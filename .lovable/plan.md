
## Diagnóstico (o que está acontecendo agora)

Ao clicar em **“Novo Fluxo”**, o navegador faz:

- `POST https://udyjlesjcgxhgdiaptjp.supabase.co/rest/v1/chatbot_flows?select=*`

e recebe:

- **404** com erro **PGRST205**:  
  `"Could not find the table 'public.chatbot_flows' in the schema cache"`

Isso significa que **o PostgREST (API /rest/v1 do Supabase) não está enxergando as tabelas `chatbot_*` no cache de schema**, mesmo elas existindo no banco.  
Resultado: **qualquer** `supabase.from("chatbot_flows")...` (criar, listar, editar) falha — e isso afeta também:
- Admin (criação/edição)
- Webchat público (`/chat/:flowId`)
- WhatsApp webhook (pois ele também consulta `chatbot_flows`/`chatbot_nodes` via supabase-js)

Observação importante: há relatos recentes (incluindo issues atuais) de casos em que `NOTIFY pgrst, 'reload schema'` não resolve em alguns projetos; então precisamos de uma abordagem que “garanta” funcionamento mesmo com esse comportamento.

---

## Objetivo

1) **Garantir** que criar fluxo funcione no Admin (sem depender do PostgREST “enxergar” as tabelas).  
2) Garantir que o fluxo criado seja usado:
   - no **WhatsApp** (início e navegação do fluxo padrão)
   - no **link público do webchat** (geração e funcionamento do `/chat/:flowId`)  
3) Melhorar a experiência do usuário/admin com:
   - botão para **copiar link público** do fluxo
   - mensagens de erro mais claras (sem “Erro ao criar fluxo” genérico)

---

## Estratégia escolhida (robusta)

### Trocar o acesso do Chatbot (somente Chatbot) de “PostgREST direto” para “Edge Functions + conexão direta ao Postgres”

- Em vez de `supabase.from("chatbot_flows")...` no frontend, usaremos `supabase.functions.invoke(...)`.
- As Edge Functions vão acessar o banco via **`SUPABASE_DB_URL`** (conexão Postgres direta), contornando completamente o cache do PostgREST.
- Com isso, **a criação e leitura do chatbot passam a funcionar mesmo que o PostgREST continue retornando PGRST205**.

Segurança:
- Endpoints de **admin** vão exigir login e conferir se o usuário tem role **admin** (via `user_roles`).
- Endpoints **públicos** (webchat) vão retornar apenas fluxos/nós ativos e permitidos para webchat (ex.: `channel in ('all','webchat')`).

---

## Mudanças planejadas (implementação)

### 1) Criar Edge Function `chatbot-admin` (CRUD do editor)
**Local:** `supabase/functions/chatbot-admin/index.ts`

Responsabilidades:
- Autenticar usuário via token do header `Authorization: Bearer ...`
- Validar autorização: usuário precisa ser **admin**
- Operações (via `action` no body):
  - `listFlows`
  - `createFlow`
  - `updateFlow`
  - `deleteFlow`
  - `listNodes(flowId)`
  - `createNode(flowId, ...)`
  - `updateNode`
  - `deleteNode`
  - `listNodeOptions(nodeId)`
  - `createNodeOption`
  - `updateNodeOption`
  - `deleteNodeOption`
  - `bulkUpdateNodeOrder`

Detalhes técnicos:
- Usar `deno-postgres` via import por URL (sem instalar dependências do frontend).
- Queries parametrizadas (evitar SQL injection).
- Respostas padronizadas `{ ok: true, data }` e erros `{ ok: false, error, code }`.

---

### 2) Criar Edge Function `chatbot-public` (somente leitura para o link público)
**Local:** `supabase/functions/chatbot-public/index.ts`

Operações:
- `getFlow(flowId)`  
  - somente `is_active = true` e `channel in ('all','webchat')`
- `getEntryNode(flowId)` (ou fallback para o primeiro por `node_order`)
- `getNode(nodeId)` (somente `is_active = true`)
- `getNodeOptions(nodeId)` (ordenado por `option_order`)

Assim o `/chat/:flowId` funciona sem login, sem depender do PostgREST.

---

### 3) Atualizar o frontend para usar as Edge Functions (em vez de PostgREST)

#### 3.1) Refatorar `src/hooks/useChatbotFlows.ts`
Trocar todos os `.from("chatbot_*")` por chamadas `supabase.functions.invoke("chatbot-admin", ...)`, mantendo:
- React Query keys iguais (para não quebrar o resto)
- Tipos `ChatbotFlow`, `ChatbotNode`, `ChatbotNodeOption`

Também vamos ajustar o tratamento de erros:
- toast com mensagem mais útil (ex.: “Falha ao criar fluxo: PGRST205 …” quando for o caso)
- log detalhado no console em desenvolvimento

#### 3.2) Refatorar `src/pages/PublicChat.tsx`
Trocar `supabase.from("chatbot_flows")...` por:
- `supabase.functions.invoke("chatbot-public", { body: { action: "getFlow", flowId }})`

#### 3.3) Refatorar `src/hooks/useWebChat.ts`
Trocar consultas de nós/opções por `chatbot-public`:
- `getEntryNode`
- `getNode`
- `getNodeOptions`

Mantém a mesma UI e a mesma experiência do chat, mas com dados vindos do endpoint confiável.

---

### 4) Garantir que o WhatsApp use o fluxo criado (atualizar `whatsapp-webhook`)
**Local:** `supabase/functions/whatsapp-webhook/index.ts`

Hoje ele faz:
- `.from("chatbot_flows")`, `.from("chatbot_nodes")`, `.from("chatbot_node_options")`

Isso falha com PGRST205 e impede o bot no WhatsApp.

Mudança:
- Manter Supabase JS para tabelas “antigas” (`whatsapp_conversations`, `service_messages`, `service_queue`) se elas estiverem OK.
- Trocar somente as consultas do chatbot (`chatbot_*`) para **conexão direta Postgres** (mesma abordagem das novas edge functions), reusando helpers:
  - `getDefaultFlowIdForWhatsapp()` filtrando `channel in ('all','whatsapp')`
  - `getEntryNode(flowId)`
  - `getNode(nodeId)`
  - `getNodeOptions(nodeId)`

Ajuste comportamental recomendado:
- Quando buscar fluxo padrão, considerar canal:
  - WhatsApp: `channel in ('all','whatsapp')`
  - Webchat: `channel in ('all','webchat')`

---

### 5) Gerar e exibir o “link público do chatbot” no Admin
**Local:** `src/components/admin/ChatbotManager.tsx`

Adicionar no card (ou no modal editor):
- Botão “Copiar link”
- Link: `${window.location.origin}/chat/${flow.id}`

Isso resolve “precisamos gerar o link do chatbot” sem depender de config extra.

---

## Critérios de aceite (o que deve ficar OK)

1) Em **Administração > Chatbot**:
   - clicar “Novo Fluxo” cria e abre o editor sem erro
   - listar fluxos funciona
   - ativar/desativar, definir padrão, editar nome/descrição funcionam

2) No link público:
   - abrir `/chat/:flowId` carrega o fluxo ativo e inicia o atendimento
   - se fluxo estiver inativo ou canal incompatível, mostra “Chat indisponível”

3) No WhatsApp:
   - ao receber primeira mensagem, o webhook encontra o **fluxo padrão ativo** (compatível com WhatsApp) e responde com o nó de entrada
   - menus aceitam resposta por número e navegam corretamente
   - ações “escalate/end” funcionam como esperado

---

## Plano de testes (passo-a-passo)

1) Admin:
   - Criar fluxo
   - Definir como padrão
   - Criar nó de entrada (message/menu) e algumas opções
   - Salvar e reabrir o editor para confirmar persistência

2) Webchat:
   - Abrir link copiado do Admin em aba anônima
   - Fazer um caminho completo no menu até “end” e até “escalate”

3) WhatsApp:
   - Enviar “oi” para o número integrado
   - Confirmar que a primeira resposta é do fluxo padrão
   - Escolher opções e confirmar transições

4) Observabilidade:
   - Verificar logs das edge functions (`chatbot-admin`, `chatbot-public`, `whatsapp-webhook`) para confirmar que não há chamadas ao PostgREST do chatbot e que as queries retornam resultados.

---

## Impacto / Riscos e mitigação

- Esta abordagem remove a dependência do PostgREST apenas para o Chatbot, aumentando confiabilidade.
- Como bypassa RLS (via DB direto), mitigamos com:
  - validação de admin em `chatbot-admin`
  - filtros estritos de “ativo + canal” em `chatbot-public`
- Caso o PostgREST volte a funcionar no futuro, manteremos o chatbot por Edge Function (não há conflito).

---

## Arquivos que serão criados/alterados

**Criar**
- `supabase/functions/chatbot-admin/index.ts`
- `supabase/functions/chatbot-public/index.ts`

**Editar**
- `src/hooks/useChatbotFlows.ts`
- `src/pages/PublicChat.tsx`
- `src/hooks/useWebChat.ts`
- `supabase/functions/whatsapp-webhook/index.ts`
- `src/components/admin/ChatbotManager.tsx`

(Se necessário, pequenos ajustes de tipos em `src/integrations/supabase/types.ts` apenas para manter TypeScript consistente.)
