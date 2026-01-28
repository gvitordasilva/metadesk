

# Plano Revisado: Integração WhatsApp com Chatbot Customizável (Árvore de Decisão)

## Visao Geral

Criar um sistema de chatbot baseado em **fluxos pre-definidos** (arvore de decisao) que o administrador pode construir visualmente via drag-and-drop. As respostas sao pre-definidas na plataforma, nao geradas por IA.

---

## Arquitetura da Solucao

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ADMINISTRACAO - ABA "CHATBOT"                            │
│                                                                             │
│  ┌─────────────────────┐     ┌──────────────────────────────────────────┐  │
│  │  Lista de Fluxos    │     │  Editor Visual (Drag-and-Drop)          │  │
│  │                     │     │                                          │  │
│  │  > Boas-vindas      │     │  [No: Boas-vindas]                       │  │
│  │  > Menu Principal   │────▶│     │                                    │  │
│  │  > FAQ              │     │  "Ola! Escolha uma opcao:"               │  │
│  │  > Escalacao        │     │     │                                    │  │
│  │                     │     │  ┌──┴──┬──────┬──────┐                   │  │
│  └─────────────────────┘     │  │1    │2     │3     │                   │  │
│                              │  │FAQ  │Status│Falar │                   │  │
│                              │  │     │      │Atend.│                   │  │
│                              │  └─────┴──────┴──────┘                   │  │
│                              └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EVOLUTION API (WhatsApp)                            │
│                    Recebe mensagem → Dispara webhook                        │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ POST
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              Edge Function: whatsapp-webhook                                │
│                                                                             │
│  1. Valida webhook (apikey)                                                 │
│  2. Busca/cria conversa em whatsapp_conversations                           │
│  3. Salva mensagem em service_messages                                      │
│  4. Carrega no atual do usuario (current_menu)                              │
│  5. Processa arvore de decisao (chatbot_nodes)                              │
│  6. Envia resposta via Evolution API                                        │
│  7. Se acao = "escalar" → cria item em service_queue                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Estrutura do Banco de Dados (Novas Tabelas MetaDesk)

### 1. `chatbot_flows` - Fluxos de Chatbot

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | uuid | Chave primaria |
| `name` | text | Nome do fluxo (ex: "Menu Principal") |
| `description` | text | Descricao do fluxo |
| `channel` | text | 'whatsapp', 'webchat', 'all' |
| `is_active` | boolean | Se esta ativo |
| `is_default` | boolean | Se e o fluxo inicial |
| `created_at` | timestamp | Criacao |
| `updated_at` | timestamp | Atualizacao |

### 2. `chatbot_nodes` - Nos da Arvore de Decisao

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | uuid | Chave primaria |
| `flow_id` | uuid | FK para chatbot_flows |
| `node_type` | text | 'message', 'menu', 'input', 'action', 'condition' |
| `name` | text | Nome do no (para identificacao) |
| `content` | text | Texto da mensagem/pergunta |
| `options` | jsonb | Opcoes do menu (se for menu) |
| `action_type` | text | 'none', 'escalate', 'transfer', 'end', 'goto' |
| `action_config` | jsonb | Config da acao (ex: para qual no ir) |
| `next_node_id` | uuid | Proximo no (se linear) |
| `node_order` | integer | Ordem no fluxo |
| `is_active` | boolean | Se esta ativo |
| `created_at` | timestamp | Criacao |
| `updated_at` | timestamp | Atualizacao |

### 3. `chatbot_node_options` - Opcoes de Menu

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | uuid | Chave primaria |
| `node_id` | uuid | FK para chatbot_nodes |
| `option_key` | text | Tecla/numero da opcao (ex: "1", "2") |
| `option_text` | text | Texto da opcao (ex: "Falar com atendente") |
| `next_node_id` | uuid | No destino ao selecionar esta opcao |
| `option_order` | integer | Ordem de exibicao |

### 4. Adicionar coluna em `service_queue`

```sql
ALTER TABLE service_queue 
ADD COLUMN whatsapp_conversation_id uuid REFERENCES whatsapp_conversations(id);
```

### 5. Usar tabela existente `whatsapp_conversations`

Ja existe com campos uteis:
- `current_menu` → Guardar ID do no atual
- `conversation_state` → Estado adicional (jsonb)
- `session_active` → Se sessao esta ativa

---

## Componentes do Frontend

### 1. Nova Aba na Administracao: "Chatbot"

Adicionar quinta aba em `Administracao.tsx`:
- Icone: `Bot` ou `MessageSquare`
- Conteudo: `ChatbotManager` component

### 2. `ChatbotManager.tsx`

Gerenciador principal com duas colunas:
- **Esquerda**: Lista de fluxos (criar, editar, deletar)
- **Direita**: Preview do fluxo selecionado

### 3. `ChatbotFlowEditor.tsx`

Modal de edicao do fluxo com:
- Campo nome/descricao
- Lista de nos drag-and-drop (similar ao WorkflowEditorModal)
- Cada no pode ser:
  - **Mensagem simples**: Texto + proximo no
  - **Menu**: Texto + opcoes numeradas + destino de cada opcao
  - **Acao**: Escalar, transferir, encerrar

### 4. `SortableChatbotNode.tsx`

Componente arrastavel para cada no:
- Icone do tipo (mensagem, menu, acao)
- Campo de texto da mensagem
- Se menu: lista de opcoes com destinos
- Botao deletar

---

## Edge Functions

### 1. `whatsapp-webhook/index.ts`

Recebe webhooks do Evolution API:

```typescript
// Payload do Evolution API
interface EvolutionMessage {
  event: "messages.upsert";
  data: {
    key: { remoteJid: string; fromMe: boolean; };
    pushName: string;
    message: { conversation?: string; };
  };
}

// Fluxo:
// 1. Ignorar mensagens fromMe (enviadas por nos)
// 2. Extrair telefone de remoteJid
// 3. Buscar/criar whatsapp_conversations
// 4. Salvar mensagem em service_messages
// 5. Carregar no atual (current_menu)
// 6. Processar entrada do usuario
// 7. Buscar proximo no baseado na resposta
// 8. Enviar resposta via Evolution API
// 9. Se acao = escalar → criar service_queue
```

### 2. `whatsapp-send/index.ts`

Envia mensagens pelo Evolution API:

```typescript
// POST para Evolution API
const response = await fetch(
  `${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      number: phoneNumber,
      text: message,
      delay: 1000, // Simula digitacao
    }),
  }
);
```

---

## Logica da Arvore de Decisao

```typescript
async function processUserInput(
  conversationId: string,
  userMessage: string,
  currentNodeId: string | null
): Promise<{ response: string; nextNodeId: string | null; action?: string }> {
  
  // Se nao tem no atual, buscar no inicial (is_default = true)
  if (!currentNodeId) {
    const defaultFlow = await getDefaultFlow();
    const firstNode = await getFirstNode(defaultFlow.id);
    return {
      response: firstNode.content,
      nextNodeId: firstNode.id,
    };
  }

  // Buscar no atual
  const currentNode = await getNode(currentNodeId);

  // Se no atual e menu, processar opcao escolhida
  if (currentNode.node_type === "menu") {
    const selectedOption = await getOptionByKey(currentNode.id, userMessage.trim());
    
    if (!selectedOption) {
      return {
        response: "Opcao invalida. Por favor, escolha uma das opcoes disponiveis.",
        nextNodeId: currentNodeId, // Manter no mesmo no
      };
    }

    // Buscar proximo no
    const nextNode = await getNode(selectedOption.next_node_id);
    
    // Verificar se e acao de escalacao
    if (nextNode.action_type === "escalate") {
      return {
        response: nextNode.content || "Transferindo para um atendente...",
        nextNodeId: null,
        action: "escalate",
      };
    }

    // Montar resposta do proximo no
    return buildNodeResponse(nextNode);
  }

  // Se no e mensagem simples, ir para proximo
  if (currentNode.node_type === "message") {
    const nextNode = await getNode(currentNode.next_node_id);
    return buildNodeResponse(nextNode);
  }

  return { response: "Erro no fluxo", nextNodeId: null };
}

function buildNodeResponse(node: ChatbotNode): { response: string; nextNodeId: string } {
  let response = node.content;

  // Se for menu, adicionar opcoes
  if (node.node_type === "menu" && node.options) {
    const optionsText = node.options
      .map((opt, i) => `${i + 1}. ${opt.text}`)
      .join("\n");
    response += "\n\n" + optionsText;
  }

  return { response, nextNodeId: node.id };
}
```

---

## Exemplo de Fluxo Pre-definido

```text
[No 1: Boas-vindas] (is_default: true)
  Tipo: message
  Conteudo: "Ola! Bem-vindo ao atendimento MetaDesk."
  Proximo: No 2

[No 2: Menu Principal]
  Tipo: menu
  Conteudo: "Como posso ajudar?"
  Opcoes:
    1. "Duvidas frequentes" → No 3
    2. "Status de solicitacao" → No 4
    3. "Falar com atendente" → No 5

[No 3: FAQ]
  Tipo: menu
  Conteudo: "Selecione sua duvida:"
  Opcoes:
    1. "Horario de atendimento" → No 6
    2. "Formas de contato" → No 7
    3. "Voltar" → No 2

[No 5: Escalar]
  Tipo: action
  Acao: escalate
  Conteudo: "Aguarde, um atendente ira te atender em breve..."
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `supabase/migrations/xxx_chatbot_tables.sql` | Criar | Tabelas do chatbot |
| `supabase/functions/whatsapp-webhook/index.ts` | Criar | Receber webhooks |
| `supabase/functions/whatsapp-send/index.ts` | Criar | Enviar mensagens |
| `src/components/admin/ChatbotManager.tsx` | Criar | Gerenciador de fluxos |
| `src/components/admin/ChatbotFlowEditor.tsx` | Criar | Editor visual drag-and-drop |
| `src/components/admin/SortableChatbotNode.tsx` | Criar | No arrastavel |
| `src/hooks/useChatbotFlows.ts` | Criar | Hook para fluxos |
| `src/pages/Administracao.tsx` | Modificar | Adicionar aba Chatbot |
| `src/components/omnichannel/ConversationView.tsx` | Modificar | Suporte a mensagens WhatsApp |

---

## Secrets Necessarios

| Secret | Descricao |
|--------|-----------|
| `EVOLUTION_API_URL` | URL base da API Evolution |
| `EVOLUTION_API_KEY` | API key da instancia |
| `EVOLUTION_INSTANCE_NAME` | Nome da instancia |

---

## Fluxo Completo

```text
Cliente envia "Oi" no WhatsApp
        │
        ▼
Evolution API dispara webhook
        │
        ▼
Edge Function whatsapp-webhook
   ├── Cria/atualiza whatsapp_conversations
   ├── Salva mensagem em service_messages
   ├── current_menu = null → busca no inicial
   ├── Retorna: "Ola! Como posso ajudar? 1. FAQ 2. Status 3. Atendente"
   ├── Atualiza current_menu = node_2
   └── Envia resposta via whatsapp-send
        │
        ▼
Cliente responde "3"
        │
        ▼
Edge Function whatsapp-webhook
   ├── Carrega current_menu = node_2 (menu)
   ├── Opcao "3" → next_node = node_5 (escalar)
   ├── Detecta action_type = "escalate"
   ├── Cria entrada em service_queue (status: waiting)
   ├── Responde: "Aguarde, um atendente ira te atender..."
   └── current_menu = null
        │
        ▼
Conversa aparece na fila de Atendimento
        │
        ▼
Atendente assume e responde
        │
        ▼
Mensagem enviada via whatsapp-send
```

---

## Resultado Esperado

1. Administrador pode criar fluxos de chatbot via interface drag-and-drop
2. Fluxos sao compostos por nos: mensagem, menu (opcoes), acao
3. Cliente no WhatsApp interage com menus numerados
4. Respostas sao pre-definidas, nao geradas por IA
5. Ao selecionar "Falar com atendente", conversa entra na fila
6. Atendente ve historico completo e pode responder pelo sistema
7. Todas as mensagens ficam registradas em tabelas MetaDesk

