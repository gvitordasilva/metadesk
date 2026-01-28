
# Plano: Corrigir Ambiente Supabase para MetaDesk

## Problema Identificado

As migrações do chatbot foram aplicadas no projeto errado (`jhkxcplfempenoczcoep`), enquanto o frontend está configurado para usar o projeto correto (`udyjlesjcgxhgdiaptjp`).

## Ações Necessárias

### 1. Atualizar Configuração do Supabase

Corrigir o `supabase/config.toml` para apontar para o projeto correto:

```toml
project_id = "udyjlesjcgxhgdiaptjp"
```

### 2. Recriar Tabelas do Chatbot

Aplicar nova migração no ambiente correto com as seguintes tabelas:

| Tabela | Descrição |
|--------|-----------|
| `chatbot_flows` | Fluxos de chatbot (nome, canal, ativo) |
| `chatbot_nodes` | Nós da árvore de decisão |
| `chatbot_node_options` | Opções de menu com destinos |

Além de alterações nas tabelas existentes:
- `whatsapp_conversations`: adicionar `current_node_id`, `customer_name`, `escalated_at`
- `service_queue`: adicionar `whatsapp_conversation_id`
- `service_messages`: adicionar `conversation_id`

### 3. Configurar Secrets no Ambiente Correto

Os secrets da Evolution API precisam ser adicionados ao projeto `udyjlesjcgxhgdiaptjp`:
- `EVOLUTION_API_URL`
- `EVOLUTION_API_KEY`
- `EVOLUTION_INSTANCE_NAME`

### 4. Deploy das Edge Functions

As Edge Functions (`whatsapp-webhook`, `whatsapp-send`) serão deployadas no ambiente correto automaticamente após a correção do `config.toml`.

### 5. Atualizar URL do Webhook

Após a correção, a URL do webhook Evolution API será:
```
https://udyjlesjcgxhgdiaptjp.supabase.co/functions/v1/whatsapp-webhook
```

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/config.toml` | Atualizar `project_id` |
| Nova migração SQL | Criar tabelas do chatbot |

## Resultado

- Frontend e backend apontando para o mesmo projeto Supabase
- Tabelas do chatbot criadas no ambiente MetaDesk dedicado
- Edge Functions funcionando corretamente
