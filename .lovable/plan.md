
# Plano: Migração do Banco de Dados para Novo Projeto Supabase

## Visão Geral

Migrar toda a estrutura do banco de dados do projeto "Agro Ikemba" para um novo projeto Supabase, criando apenas as tabelas necessárias para o MetaDesk (sistema de atendimento).

---

## Situação Atual

O banco de dados atual (Agro Ikemba) possui **70+ tabelas**, sendo a maioria relacionada ao sistema agrícola original. Para o MetaDesk, precisamos apenas de **10 tabelas específicas**.

### Tabelas Necessárias para o MetaDesk

| Tabela | Descrição |
|--------|-----------|
| `user_roles` | Roles de usuários (admin, atendente) |
| `attendant_profiles` | Perfis dos atendentes |
| `complaints` | Reclamações e denúncias |
| `workflows` | Fluxos de trabalho |
| `workflow_steps` | Etapas dos fluxos |
| `workflow_responsibles` | Responsáveis pelas etapas |
| `quick_messages` | Mensagens pré-definidas |
| `service_sessions` | Sessões de atendimento |
| `service_messages` | Mensagens das sessões |
| `admin_users` | Usuários administradores (legado, necessário para `check_admin_access`) |

---

## Passos para Migração

### 1. Criar Novo Projeto Supabase

Você precisará:
1. Acessar [supabase.com/dashboard](https://supabase.com/dashboard)
2. Criar um novo projeto (ex: "MetaDesk Testes")
3. Anotar as credenciais:
   - **Project URL**: `https://[SEU_REF].supabase.co`
   - **Anon Key**: chave pública
   - **Project ID**: referência do projeto

### 2. Executar Script de Migração no Novo Projeto

Abra o SQL Editor do novo projeto e execute o script completo abaixo:

```sql
-- =============================================
-- SCRIPT DE MIGRAÇÃO METADESK
-- Execute este script no novo projeto Supabase
-- =============================================

-- 1. FUNÇÕES AUXILIARES BASE
-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Tabela de admin_users (necessária para check_admin_access)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para verificar acesso admin
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
$$;

-- 2. SISTEMA DE ROLES
-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'atendente');

-- Tabela de roles
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'atendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para obter role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS para user_roles
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. PERFIS DE ATENDENTES
CREATE TABLE public.attendant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    working_hours JSONB DEFAULT '{"start": "09:00", "end": "18:00"}',
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'break')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.attendant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile"
ON public.attendant_profiles FOR ALL
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.attendant_profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_attendant_profiles_updated_at
BEFORE UPDATE ON public.attendant_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RESPONSÁVEIS DE WORKFLOW
CREATE TABLE public.workflow_responsibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workflow_responsibles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage workflow_responsibles"
ON public.workflow_responsibles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Attendants can view workflow_responsibles"
ON public.workflow_responsibles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'atendente'));

CREATE TRIGGER update_workflow_responsibles_updated_at
BEFORE UPDATE ON public.workflow_responsibles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. WORKFLOWS
CREATE TABLE public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage workflows"
ON public.workflows FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Attendants can view workflows"
ON public.workflows FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'atendente'));

CREATE TRIGGER update_workflows_updated_at
BEFORE UPDATE ON public.workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. ETAPAS DE WORKFLOW
CREATE TABLE public.workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  responsible_id UUID REFERENCES public.workflow_responsibles(id) ON DELETE SET NULL,
  sla_days INTEGER DEFAULT 1,
  step_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage workflow_steps"
ON public.workflow_steps FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Attendants can view workflow_steps"
ON public.workflow_steps FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'atendente'));

CREATE TRIGGER update_workflow_steps_updated_at
BEFORE UPDATE ON public.workflow_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. RECLAMAÇÕES E DENÚNCIAS
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_number TEXT NOT NULL UNIQUE,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  reporter_name TEXT,
  reporter_email TEXT,
  reporter_phone TEXT,
  type TEXT NOT NULL CHECK (type IN ('reclamacao', 'denuncia', 'sugestao', 'elogio')),
  category TEXT NOT NULL,
  occurred_at TIMESTAMPTZ,
  location TEXT,
  description TEXT NOT NULL,
  involved_parties TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  internal_notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  waiting_since TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_sentiment TEXT,
  current_workflow_step_id UUID REFERENCES public.workflow_steps(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Função para gerar protocolo
CREATE OR REPLACE FUNCTION public.generate_complaint_protocol()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(987654);
  year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  SELECT COALESCE(MAX(CAST(SUBSTRING(protocol_number FROM '^REC-\d{4}-(\d+)$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.complaints
  WHERE protocol_number ~ ('^REC-' || year_suffix || '-\d+$');
  RETURN 'REC-' || year_suffix || '-' || LPAD(next_number::TEXT, 6, '0');
END;
$$;

-- Políticas RLS para complaints
CREATE POLICY "Anyone can create complaints"
ON public.complaints FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all complaints"
ON public.complaints FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Attendants can view complaints"
ON public.complaints FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'atendente') 
  AND (assigned_to = auth.uid() OR assigned_to IS NULL)
);

CREATE POLICY "Admins can update all complaints"
ON public.complaints FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Attendants can update assigned complaints"
ON public.complaints FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'atendente') AND assigned_to = auth.uid())
WITH CHECK (public.has_role(auth.uid(), 'atendente') AND assigned_to = auth.uid());

CREATE TRIGGER update_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8. MENSAGENS PRÉ-DEFINIDAS
CREATE TABLE public.quick_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  shortcut TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quick_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ver mensagens ativas"
ON public.quick_messages FOR SELECT
USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Admins podem gerenciar mensagens"
ON public.quick_messages FOR ALL
USING (public.check_admin_access());

CREATE TRIGGER update_quick_messages_updated_at
BEFORE UPDATE ON public.quick_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. SESSÕES DE ATENDIMENTO
CREATE TABLE public.service_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE SET NULL,
  conversation_id TEXT,
  attendant_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  ai_summary TEXT,
  ai_sentiment TEXT,
  forwarded_to_step_id UUID REFERENCES public.workflow_steps(id) ON DELETE SET NULL,
  forward_notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'forwarded')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ver suas sessoes"
ON public.service_sessions FOR SELECT
USING (auth.uid() = attendant_id OR public.check_admin_access());

CREATE POLICY "Usuarios autenticados podem criar sessoes"
ON public.service_sessions FOR INSERT
WITH CHECK (auth.uid() = attendant_id);

CREATE POLICY "Usuarios autenticados podem atualizar suas sessoes"
ON public.service_sessions FOR UPDATE
USING (auth.uid() = attendant_id OR public.check_admin_access());

CREATE TRIGGER update_service_sessions_updated_at
BEFORE UPDATE ON public.service_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 10. MENSAGENS DAS SESSÕES
CREATE TABLE public.service_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.service_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'agent', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver mensagens de suas sessoes"
ON public.service_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.service_sessions 
    WHERE id = session_id AND (attendant_id = auth.uid() OR public.check_admin_access())
  )
);

CREATE POLICY "Usuarios podem criar mensagens em suas sessoes"
ON public.service_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.service_sessions 
    WHERE id = session_id AND attendant_id = auth.uid() AND status = 'active'
  )
);

-- 11. ÍNDICES DE PERFORMANCE
CREATE INDEX idx_complaints_protocol ON public.complaints(protocol_number);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_type ON public.complaints(type);
CREATE INDEX idx_complaints_created_at ON public.complaints(created_at DESC);
CREATE INDEX idx_complaints_waiting_since ON public.complaints(waiting_since);
CREATE INDEX idx_workflow_steps_workflow_id ON public.workflow_steps(workflow_id);
CREATE INDEX idx_workflow_steps_responsible_id ON public.workflow_steps(responsible_id);
CREATE INDEX idx_workflows_type ON public.workflows(workflow_type);
CREATE INDEX idx_workflow_responsibles_active ON public.workflow_responsibles(is_active);
CREATE INDEX idx_service_sessions_attendant ON public.service_sessions(attendant_id);
CREATE INDEX idx_service_sessions_status ON public.service_sessions(status);
CREATE INDEX idx_service_sessions_complaint ON public.service_sessions(complaint_id);
CREATE INDEX idx_service_messages_session ON public.service_messages(session_id);
CREATE INDEX idx_quick_messages_category ON public.quick_messages(category);

-- 12. STORAGE BUCKET PARA ANEXOS
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-attachments', 'complaint-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload complaint attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'complaint-attachments');

CREATE POLICY "Anyone can view complaint attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'complaint-attachments');

CREATE POLICY "Admins can delete complaint attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'complaint-attachments' AND public.check_admin_access());

-- 13. DADOS INICIAIS
INSERT INTO public.quick_messages (title, content, category, shortcut) VALUES
  ('Saudação Inicial', 'Olá! Meu nome é [NOME] e estou aqui para ajudá-lo(a). Como posso auxiliar hoje?', 'saudacao', '/oi'),
  ('Aguardando Informações', 'Para dar continuidade ao seu atendimento, preciso de algumas informações adicionais. Poderia me fornecer?', 'procedimento', '/info'),
  ('Verificando Sistema', 'Um momento, por favor. Estou verificando as informações no sistema.', 'procedimento', '/aguarde'),
  ('Protocolo Gerado', 'Seu protocolo de atendimento é: [PROTOCOLO]. Guarde este número para futuras consultas.', 'procedimento', '/protocolo'),
  ('Encaminhamento', 'Vou encaminhar seu caso para o setor responsável. Você receberá um retorno em até [PRAZO].', 'procedimento', '/encaminhar'),
  ('Agradecimento Final', 'Agradeço pelo contato! Caso tenha outras dúvidas, estamos à disposição. Tenha um ótimo dia!', 'encerramento', '/tchau'),
  ('Pesquisa de Satisfação', 'Antes de finalizar, gostaria de saber: como você avalia o atendimento prestado hoje?', 'encerramento', '/pesquisa');

-- PRONTO!
```

### 3. Conectar Projeto Lovable ao Novo Supabase

Após criar o novo projeto e executar o script:

1. Acesse as configurações do projeto Lovable
2. Vá em "Supabase Integration" ou "Backend"
3. Desconecte do projeto atual (Agro Ikemba)
4. Conecte ao novo projeto usando as novas credenciais

### 4. Criar Usuário Administrador Inicial

No SQL Editor do novo projeto, após criar um usuário via Auth:

```sql
-- Substitua 'USER_ID_AQUI' pelo ID do usuário criado
INSERT INTO public.admin_users (user_id, email, role)
VALUES ('USER_ID_AQUI', 'seu_email@exemplo.com', 'admin');

INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_AQUI', 'admin');

INSERT INTO public.attendant_profiles (user_id, full_name, email, status)
VALUES ('USER_ID_AQUI', 'Administrador', 'seu_email@exemplo.com', 'online');
```

### 5. Atualizar Credenciais no Código

Após trocar a conexão, precisarei atualizar o arquivo `src/integrations/supabase/client.ts` com as novas credenciais.

---

## Resumo das Tabelas Criadas

| Tabela | Registros | Descrição |
|--------|-----------|-----------|
| admin_users | 0 | Usuários admin (legado) |
| user_roles | 0 | Roles dos usuários |
| attendant_profiles | 0 | Perfis de atendentes |
| workflow_responsibles | 0 | Responsáveis dos fluxos |
| workflows | 0 | Fluxos de trabalho |
| workflow_steps | 0 | Etapas dos fluxos |
| complaints | 0 | Reclamações/Denúncias |
| quick_messages | 7 | Mensagens pré-definidas |
| service_sessions | 0 | Sessões de atendimento |
| service_messages | 0 | Mensagens das sessões |

---

## Próximos Passos

1. Criar novo projeto Supabase
2. Executar script SQL de migração
3. Criar usuário administrador via Supabase Auth
4. Inserir registro do admin nas tabelas
5. Me informar o novo Project ID e Anon Key para atualizar o código
