
# Plano: Refatorar Chatbot para Chamadas Diretas ao Supabase

## Contexto

O botão "+Novo Fluxo" falha porque a Edge Function `chatbot-admin` não está deployada no projeto Supabase externo `udyjlesjcgxhgdiaptjp`. A solução é eliminar a dependência de Edge Functions e usar chamadas diretas ao banco de dados via Supabase Client.

## Análise do Estado Atual

| Item | Status |
|------|--------|
| Tabelas do chatbot | Existem (`chatbot_flows`, `chatbot_nodes`, `chatbot_node_options`) |
| RLS habilitado | Sim, com políticas para `authenticated` e `anon` |
| Função `has_role` | Existe no banco |
| Tipos TypeScript | Existem em `src/integrations/supabase/types.ts` |

## Implementação

### Arquivo a Modificar

**`src/hooks/useChatbotFlows.ts`**

Refatorar completamente para usar o Supabase Client diretamente em vez de chamar a Edge Function.

### Mudanças Principais

1. **Remover** a função `callAdminApi` que chama a Edge Function
2. **Substituir** todas as operações por chamadas diretas:
   - `supabase.from("chatbot_flows").select("*")` para listar
   - `supabase.from("chatbot_flows").insert({...})` para criar
   - `supabase.from("chatbot_flows").update({...})` para atualizar
   - `supabase.from("chatbot_flows").delete()` para excluir

3. **Usar tipos** do arquivo `types.ts` existente para type-safety

### Exemplo de Transformação

**Antes (Edge Function):**
```typescript
async function callAdminApi(action: string, params: Record<string, any>) {
  const { data, error } = await supabase.functions.invoke("chatbot-admin", {
    body: { action, ...params },
  });
  // ...
}

export function useChatbotFlows() {
  return useQuery({
    queryFn: async () => callAdminApi("listFlows"),
  });
}
```

**Depois (Supabase Client):**
```typescript
export function useChatbotFlows() {
  return useQuery({
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chatbot_flows")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}
```

### Operações a Refatorar

| Operação | Antes | Depois |
|----------|-------|--------|
| listFlows | `callAdminApi("listFlows")` | `supabase.from("chatbot_flows").select("*")` |
| createFlow | `callAdminApi("createFlow", {...})` | `supabase.from("chatbot_flows").insert({...})` |
| updateFlow | `callAdminApi("updateFlow", {...})` | `supabase.from("chatbot_flows").update({...}).eq("id", id)` |
| deleteFlow | `callAdminApi("deleteFlow", {...})` | `supabase.from("chatbot_flows").delete().eq("id", id)` |
| listNodes | `callAdminApi("listNodes", {...})` | `supabase.from("chatbot_nodes").select("*").eq("flow_id", flowId)` |
| createNode | `callAdminApi("createNode", {...})` | `supabase.from("chatbot_nodes").insert({...})` |
| updateNode | `callAdminApi("updateNode", {...})` | `supabase.from("chatbot_nodes").update({...}).eq("id", id)` |
| deleteNode | `callAdminApi("deleteNode", {...})` | `supabase.from("chatbot_nodes").delete().eq("id", id)` |
| bulkUpdateNodeOrder | `callAdminApi("bulkUpdateNodeOrder", {...})` | Loop com `supabase.from("chatbot_nodes").update({...})` |
| listNodeOptions | `callAdminApi("listNodeOptions", {...})` | `supabase.from("chatbot_node_options").select("*").eq("node_id", nodeId)` |
| createNodeOption | `callAdminApi("createNodeOption", {...})` | `supabase.from("chatbot_node_options").insert({...})` |
| updateNodeOption | `callAdminApi("updateNodeOption", {...})` | `supabase.from("chatbot_node_options").update({...}).eq("id", id)` |
| deleteNodeOption | `callAdminApi("deleteNodeOption", {...})` | `supabase.from("chatbot_node_options").delete().eq("id", id)` |

## Segurança

As políticas RLS já existentes garantem que:
- Usuários `authenticated` podem gerenciar (CRUD) todas as tabelas do chatbot
- Usuários `anon` podem apenas ler (SELECT) para o chat público funcionar

A verificação de admin que era feita na Edge Function será substituída pela verificação de autenticação nativa do Supabase. Se for necessário restringir apenas a admins, podemos atualizar as políticas RLS para usar a função `has_role` existente.

## Resultado Esperado

Após esta refatoração:
1. O botão "+Novo Fluxo" funcionará imediatamente
2. Todas as operações CRUD do chatbot funcionarão sem Edge Functions
3. A manutenção será simplificada (menos código server-side)
4. Não será necessário deploy manual de Edge Functions

## Detalhes Técnicos

### Tipagem

Os tipos `ChatbotFlow`, `ChatbotNode` e `ChatbotNodeOption` definidos no hook serão mantidos para compatibilidade com os componentes existentes, mas internamente usaremos os tipos gerados do Supabase para garantir type-safety nas operações de banco.

### Tratamento de Erros

Cada operação terá tratamento de erro apropriado:
```typescript
const { data, error } = await supabase.from("chatbot_flows").select("*");
if (error) throw new Error(error.message);
return data;
```

### Bulk Update

Para a operação `bulkUpdateNodeOrder`, usaremos `Promise.all` para executar múltiplas atualizações em paralelo:
```typescript
await Promise.all(
  nodes.map(node =>
    supabase
      .from("chatbot_nodes")
      .update({ node_order: node.node_order })
      .eq("id", node.id)
  )
);
```
