

# Plano: Corrigir Erro de Schema Cache do Chatbot

## Problema Identificado

Ao clicar no botão "Novo Fluxo", o sistema retorna erro 404 com a mensagem:
> "Could not find the table 'public.chatbot_flows' in the schema cache"

### Análise Técnica

| Verificação | Status | Detalhes |
|-------------|--------|----------|
| Tabela `chatbot_flows` existe | OK | Confirmado no banco de dados |
| Tabela `chatbot_nodes` existe | OK | Confirmado |
| Tabela `chatbot_node_options` existe | OK | Confirmado |
| Permissões (GRANT) | OK | `anon`, `authenticated`, `service_role` com acesso total |
| Políticas RLS | OK | Leitura/escrita para autenticados, leitura para anon |
| Tipos TypeScript | OK | Sincronizados em `types.ts` |
| PostgREST Schema Cache | PROBLEMA | Não reconhece as novas tabelas |

O PostgREST usa um cache do schema do banco de dados para performance. Quando tabelas são criadas, às vezes esse cache não atualiza automaticamente.

---

## Solução

### 1. Migração para Forçar Reload do Schema Cache

Criar uma migração que executa `NOTIFY pgrst, 'reload schema'` para forçar o PostgREST a recarregar seu cache.

```sql
-- Força o PostgREST a recarregar o schema cache
NOTIFY pgrst, 'reload schema';

-- Garantir que as tabelas estão expostas corretamente
COMMENT ON TABLE public.chatbot_flows IS 'Fluxos de chatbot para atendimento automatizado';
COMMENT ON TABLE public.chatbot_nodes IS 'Nós da árvore de decisão do chatbot';
COMMENT ON TABLE public.chatbot_node_options IS 'Opções de menu para navegação no chatbot';
```

### 2. Regenerar Tipos Supabase

Após a migração, garantir que os tipos estejam sincronizados (já estão, mas confirmar).

---

## Funcionalidades Adicionais para o Chatbot

### 3. Link Público para Webchat

Criar uma página pública de webchat que pode ser acessada por qualquer pessoa:

| Componente | Descrição |
|------------|-----------|
| Rota `/chat/:flowId` | Página pública de chatbot |
| Interface de chat | Bolhas de mensagem, input, envio |
| Integração com fluxo | Usa a mesma lógica do WhatsApp |

### 4. Experiência do Usuário no WhatsApp

Garantir que quando um usuário iniciar uma conversa pelo WhatsApp:
1. O sistema identifica o número
2. Inicia o fluxo padrão ou específico
3. Navega pela árvore de decisão
4. Escala para atendente quando necessário

---

## Arquivos a Modificar/Criar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| Nova migração SQL | Criar | Força reload do schema cache |
| `src/pages/PublicChat.tsx` | Criar | Página pública de webchat |
| `src/App.tsx` | Modificar | Adicionar rota `/chat/:flowId` |
| `src/components/chat/WebChatInterface.tsx` | Criar | Interface de chat público |

---

## Seção Técnica

### Como funciona o Schema Cache do PostgREST

O PostgREST mantém um cache do schema PostgreSQL para:
- Evitar queries repetidas ao `information_schema`
- Melhorar performance das requisições
- Validar estrutura das tabelas

O cache é recarregado quando:
- O serviço reinicia
- Recebe uma notificação `NOTIFY pgrst, 'reload schema'`
- Em intervalos configurados (por padrão, pode demorar)

### Fluxo de Atendimento

```text
Usuário envia mensagem
        |
        v
+------------------+
|  Webhook recebe  |
|  mensagem        |
+------------------+
        |
        v
+------------------+
|  Busca fluxo     |
|  padrão ativo    |
+------------------+
        |
        v
+------------------+
|  Processa nó     |
|  atual           |
+------------------+
        |
   +----+----+
   |         |
   v         v
Menu      Ação
   |         |
   v         v
Mostra    Executa
opções    (escalar/
          encerrar)
```

### Estrutura do Webchat Público

A página de webchat pública permitirá:
- Acesso sem login
- Interface similar ao WhatsApp Web
- Histórico da sessão
- Mesma lógica de fluxo do backend

