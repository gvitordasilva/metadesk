

# Plano: Corrigir Chatbot para Usar Edge Functions no Supabase Externo

## Diagnóstico Confirmado

| Verificação | Resultado |
|------------|-----------|
| Tabelas existem no banco | Sim (`chatbot_flows`, `chatbot_nodes`, `chatbot_node_options`) |
| Erro ao acessar tabelas | PGRST205 - "Could not find the table in schema cache" |
| Frontend aponta para | Supabase externo `udyjlesjcgxhgdiaptjp` |
| Edge Functions deployadas | Lovable Cloud (ambiente test) - não o Supabase externo |

## Problema Raiz

O hook `useChatbotFlows.ts` foi modificado para usar chamadas diretas (`supabase.from("chatbot_flows")`), mas o PostgREST do Supabase externo tem o schema desatualizado em cache. As Edge Functions existem no código, mas estão deployadas apenas no ambiente Lovable Cloud, não no Supabase externo.

## Solução Proposta

Reverter o hook para usar Edge Functions e garantir que as chamadas passem pelo driver de conexão direta (postgres), que bypassa o cache do PostgREST.

### Fase 1: Refatorar `useChatbotFlows.ts` para Usar Edge Functions

Modificar o hook para chamar a Edge Function `chatbot-admin` em vez de usar `supabase.from()` diretamente:

```text
// Antes (atual - quebrado pelo cache):
supabase.from("chatbot_flows").select("*")

// Depois (via Edge Function - bypassa cache):
supabase.functions.invoke("chatbot-admin", { body: { action: "listFlows" } })
```

### Fase 2: Configurar Deploy Manual das Edge Functions

Como você está usando Supabase externo, as Edge Functions precisam ser deployadas manualmente via CLI. Vou preparar instruções detalhadas:

1. Instalar Supabase CLI: `npm install -g supabase`
2. Fazer login: `supabase login`
3. Linkar ao projeto: `supabase link --project-ref udyjlesjcgxhgdiaptjp`
4. Deploy das funções:
   - `supabase functions deploy chatbot-admin --no-verify-jwt`
   - `supabase functions deploy chatbot-public --no-verify-jwt`

### Fase 3: Configurar Secrets no Supabase Externo

As Edge Functions precisam das seguintes secrets configuradas no Dashboard do Supabase:
- `SUPABASE_DB_URL` - Connection string do banco (Pool Mode: Session)
- `SUPABASE_URL` - URL do projeto
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key

### Fase 4: Atualizar `useWebChat.ts` para Usar Chamadas Diretas ao Banco

O chat público já usa Edge Function `chatbot-public`, que funcionará após o deploy manual.

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/hooks/useChatbotFlows.ts` | Reverter para usar `supabase.functions.invoke("chatbot-admin")` |

## Código da Refatoração

O hook será modificado para usar uma função helper que chama a Edge Function:

```typescript
async function callAdminApi<T>(action: string, params: Record<string, any> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke("chatbot-admin", {
    body: { action, ...params },
  });

  if (error) throw new Error(error.message);
  if (!data.ok) throw new Error(data.error || "Erro na operação");
  
  return data.data as T;
}
```

Cada hook será atualizado:

- `useChatbotFlows()` -> `callAdminApi("listFlows")`
- `useCreateChatbotFlow()` -> `callAdminApi("createFlow", {...})`
- `useUpdateChatbotFlow()` -> `callAdminApi("updateFlow", {...})`
- `useDeleteChatbotFlow()` -> `callAdminApi("deleteFlow", {...})`
- E assim por diante para nodes e options

## Integração com Evolution API

A integração já está implementada no webhook `whatsapp-webhook`:
1. Quando uma mensagem chega via Evolution API
2. O webhook busca o fluxo padrão (`is_default = true`)
3. Navega pela árvore de decisão baseado nas respostas do cliente
4. Envia respostas via Evolution API
5. Se necessário, escala para atendente humano

Após o deploy das Edge Functions, essa integração funcionará automaticamente.

## Próximos Passos Após Implementação

1. Você precisará fazer o deploy manual das Edge Functions via CLI
2. Configurar as secrets no Dashboard do Supabase
3. Testar criando um novo fluxo
4. Testar a integração com WhatsApp enviando uma mensagem para o número configurado

---

## Detalhes Técnicos

### Por que Edge Functions?

O erro PGRST205 ocorre porque o PostgREST mantém um cache do schema do banco. Quando novas tabelas são criadas (via migrations), o cache não é atualizado automaticamente. As Edge Functions usam conexão direta ao Postgres (via driver `postgres`), que não depende desse cache.

### Alternativa: Forçar Reload do Schema

Existe um comando SQL que força o reload do schema:
```sql
NOTIFY pgrst, 'reload schema';
```

Porém, isso pode não funcionar em todos os casos e requer acesso ao banco. A abordagem com Edge Functions é mais robusta.

### Estrutura das Edge Functions

- `chatbot-admin`: CRUD de fluxos/nós/opções (requer autenticação)
- `chatbot-public`: Leitura para chat público (sem autenticação)
- `whatsapp-webhook`: Recebe mensagens da Evolution API e processa chatbot

