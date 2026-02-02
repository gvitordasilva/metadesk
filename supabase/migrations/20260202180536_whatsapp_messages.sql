-- =============================================
-- WHATSAPP CHAT MESSAGES - INTEGRAÇÃO TWILIO
-- =============================================

-- Tabela de mensagens do WhatsApp
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relacionamento com a conversa
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,

  -- Identificadores Twilio
  message_sid TEXT UNIQUE, -- MessageSid do Twilio

  -- Direção e remetente
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system', 'bot')),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Se for agente

  -- Conteúdo da mensagem
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'location', 'contact', 'sticker')),

  -- Mídia
  media_url TEXT,
  media_type TEXT,
  media_caption TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),

  -- Metadados
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de contatos/perfis do WhatsApp
CREATE TABLE public.whatsapp_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identificador único (número de telefone)
  phone_number TEXT NOT NULL UNIQUE,

  -- Informações do perfil
  profile_name TEXT, -- Nome do perfil do WhatsApp
  profile_picture_url TEXT, -- URL da foto de perfil

  -- Informações adicionais
  wa_id TEXT, -- WhatsApp ID

  -- Metadados
  first_contact_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_contact_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  total_conversations INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar referência de contato na conversa
ALTER TABLE public.whatsapp_conversations
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.whatsapp_contacts(id) ON DELETE SET NULL;

-- Adicionar foto de perfil na conversa (cache)
ALTER TABLE public.whatsapp_conversations
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Índices para performance
CREATE INDEX idx_whatsapp_messages_conversation ON public.whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_created ON public.whatsapp_messages(created_at DESC);
CREATE INDEX idx_whatsapp_messages_direction ON public.whatsapp_messages(direction);
CREATE INDEX idx_whatsapp_contacts_phone ON public.whatsapp_contacts(phone_number);

-- Enable RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;

-- Policies para whatsapp_messages
CREATE POLICY "Anon can insert whatsapp messages"
  ON public.whatsapp_messages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view whatsapp messages"
  ON public.whatsapp_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert whatsapp messages"
  ON public.whatsapp_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update whatsapp messages"
  ON public.whatsapp_messages FOR UPDATE
  TO authenticated
  USING (true);

-- Policies para whatsapp_contacts
CREATE POLICY "Anon can manage whatsapp contacts"
  ON public.whatsapp_contacts FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view whatsapp contacts"
  ON public.whatsapp_contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage whatsapp contacts"
  ON public.whatsapp_contacts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_whatsapp_messages_updated_at
  BEFORE UPDATE ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_contacts_updated_at
  BEFORE UPDATE ON public.whatsapp_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
