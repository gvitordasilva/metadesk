
# Plano: Corrigir configuracao e criar tabelas no projeto udyjlesjcgxhgdiaptjp

## Resumo

O projeto Metadesk deve usar exclusivamente o Supabase `udyjlesjcgxhgdiaptjp`. Atualmente o frontend aponta para o projeto errado e as tabelas do chatbot nao existem no banco correto.

## O que sera feito

### Etapa 1: Corrigir o cliente Supabase

Atualizar `src/integrations/supabase/client.ts` para apontar para o projeto correto:

```text
SUPABASE_URL = "https://udyjlesjcgxhgdiaptjp.supabase.co"
SUPABASE_PUBLISHABLE_KEY = [chave anon do projeto udyj...]
```

### Etapa 2: Criar tabelas base no banco udyjlesjcgxhgdiaptjp

Executar migracao SQL para criar as tabelas dependentes que ainda nao existem:

1. `public.whatsapp_conversations` - conversas do WhatsApp
2. `public.service_queue` - fila de atendimento
3. `public.service_messages` - mensagens das sessoes

### Etapa 3: Criar tabelas do chatbot

Executar migracao SQL para criar:

1. `public.chatbot_flows` - fluxos do chatbot
2. `public.chatbot_nodes` - nos da arvore de decisao
3. `public.chatbot_node_options` - opcoes de menu

Incluindo:
- Indices para performance
- Politicas RLS
- Triggers de updated_at

### Etapa 4: Verificar secrets das Edge Functions

Confirmar que as secrets estao configuradas no projeto `udyjlesjcgxhgdiaptjp`:
- `SUPABASE_DB_URL` (connection string PostgreSQL)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Detalhes tecnicos

### SQL das tabelas dependentes

```text
-- Tabela whatsapp_conversations
CREATE TABLE public.whatsapp_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number text NOT NULL,
  customer_name text,
  status text NOT NULL DEFAULT 'active',
  current_node_id uuid,
  escalated_at timestamp with time zone,
  last_message_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela service_queue
CREATE TABLE public.service_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id uuid,
  whatsapp_conversation_id uuid,
  priority integer DEFAULT 0,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela service_messages
CREATE TABLE public.service_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid,
  conversation_id uuid,
  sender_type text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### SQL das tabelas do chatbot

```text
-- chatbot_flows
CREATE TABLE public.chatbot_flows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  channel text NOT NULL DEFAULT 'all',
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- chatbot_nodes
CREATE TABLE public.chatbot_nodes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id uuid NOT NULL REFERENCES public.chatbot_flows(id) ON DELETE CASCADE,
  node_type text NOT NULL,
  name text NOT NULL,
  content text,
  options jsonb,
  action_type text DEFAULT 'none',
  action_config jsonb,
  next_node_id uuid,
  node_order integer NOT NULL DEFAULT 0,
  is_entry_point boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- chatbot_node_options
CREATE TABLE public.chatbot_node_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id uuid NOT NULL REFERENCES public.chatbot_nodes(id) ON DELETE CASCADE,
  option_key text NOT NULL,
  option_text text NOT NULL,
  next_node_id uuid,
  option_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### Arquivo client.ts corrigido

```text
const SUPABASE_URL = "https://udyjlesjcgxhgdiaptjp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "[chave anon do projeto udyj]";
```

---

## Sequencia de execucao

1. Voce aprova este plano
2. Eu executo a migracao SQL para criar todas as tabelas no banco correto
3. Eu atualizo o arquivo client.ts para apontar para udyjlesjcgxhgdiaptjp
4. Voce faz login novamente na preview
5. Testamos o botao "+Novo Fluxo"

## Prerequisito

Preciso da chave anon (SUPABASE_PUBLISHABLE_KEY) do projeto `udyjlesjcgxhgdiaptjp`. Voce pode encontra-la em:
- Dashboard Supabase > Project Settings > API > anon public key

Ou, se preferir, posso usar a que esta no arquivo .env atual (`VITE_SUPABASE_PUBLISHABLE_KEY`).
