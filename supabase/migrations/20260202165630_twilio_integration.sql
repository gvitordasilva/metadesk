-- =============================================
-- INTEGRAÇÃO TWILIO - CHAMADAS, SMS E WHATSAPP
-- =============================================

-- Atualizar o CHECK constraint de channel para incluir 'sms' e 'twilio_whatsapp'
ALTER TABLE public.service_queue DROP CONSTRAINT IF EXISTS service_queue_channel_check;
ALTER TABLE public.service_queue ADD CONSTRAINT service_queue_channel_check
  CHECK (channel IN ('web', 'voice', 'whatsapp', 'email', 'chat', 'sms', 'twilio_voice', 'twilio_whatsapp'));

-- Tabela para armazenar detalhes das interações Twilio
CREATE TABLE public.twilio_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identificadores Twilio
  twilio_sid TEXT NOT NULL UNIQUE, -- CallSid ou MessageSid
  account_sid TEXT NOT NULL,

  -- Tipo de interação
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('voice', 'sms', 'whatsapp')),

  -- Direção
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),

  -- Participantes
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,

  -- Status (varia por tipo)
  status TEXT NOT NULL DEFAULT 'initiated',

  -- Detalhes de chamada de voz
  call_duration INTEGER, -- em segundos
  recording_url TEXT,
  recording_sid TEXT,

  -- Detalhes de mensagem (SMS/WhatsApp)
  message_body TEXT,
  media_url TEXT,
  num_media INTEGER DEFAULT 0,

  -- Relacionamentos
  service_queue_id UUID REFERENCES public.service_queue(id) ON DELETE SET NULL,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE SET NULL,
  attendant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadados
  raw_webhook_data JSONB,

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_twilio_interactions_sid ON public.twilio_interactions(twilio_sid);
CREATE INDEX idx_twilio_interactions_type ON public.twilio_interactions(interaction_type);
CREATE INDEX idx_twilio_interactions_from ON public.twilio_interactions(from_number);
CREATE INDEX idx_twilio_interactions_status ON public.twilio_interactions(status);
CREATE INDEX idx_twilio_interactions_queue ON public.twilio_interactions(service_queue_id);
CREATE INDEX idx_twilio_interactions_created ON public.twilio_interactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.twilio_interactions ENABLE ROW LEVEL SECURITY;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.twilio_interactions;

-- Policies
CREATE POLICY "Anon can insert twilio interactions"
  ON public.twilio_interactions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view twilio interactions"
  ON public.twilio_interactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update twilio interactions"
  ON public.twilio_interactions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Service role has full access"
  ON public.twilio_interactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_twilio_interactions_updated_at
  BEFORE UPDATE ON public.twilio_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para armazenar configurações do Twilio
CREATE TABLE public.twilio_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_sid TEXT NOT NULL,
  -- auth_token é armazenado como secret no Supabase, não aqui
  phone_numbers JSONB DEFAULT '[]', -- Lista de números configurados
  webhook_base_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.twilio_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage twilio config"
  ON public.twilio_config FOR ALL
  TO authenticated
  USING (public.check_admin_access())
  WITH CHECK (public.check_admin_access());
