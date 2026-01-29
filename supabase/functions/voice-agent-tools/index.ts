import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CreateComplaintData {
  isAnonymous: boolean;
  name?: string;
  email?: string;
  phone?: string;
  type: string;
  category: string;
  description: string;
  location?: string;
}

interface TransferToHumanData {
  customerName: string;
  customerPhone?: string;
  subject: string;
  voiceSessionId?: string;
}

interface LookupProtocolData {
  protocolNumber: string;
}

// Normaliza o tipo recebido para o formato do banco
function normalizeType(type: string): string {
  const typeMap: Record<string, string> = {
    'Reclamação': 'reclamacao',
    'reclamação': 'reclamacao',
    'reclamacao': 'reclamacao',
    'Denúncia': 'denuncia',
    'denúncia': 'denuncia',
    'denuncia': 'denuncia',
    'Sugestão': 'sugestao',
    'sugestão': 'sugestao',
    'sugestao': 'sugestao',
  };
  return typeMap[type] || 'reclamacao';
}

function generateProtocolNumber(type: string): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  let prefix = 'SOL';
  if (type === 'reclamacao') prefix = 'REC';
  else if (type === 'denuncia') prefix = 'DEN';
  else if (type === 'sugestao') prefix = 'SUG';
  
  return `${prefix}-${year}-${randomNum}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, data } = await req.json();

    console.log(`Voice agent action: ${action}`, data);

    switch (action) {
      case 'createComplaint': {
        const complaintData = data as CreateComplaintData;
        const normalizedType = normalizeType(complaintData.type);
        const protocolNumber = generateProtocolNumber(normalizedType);

        // Insert into complaints table
        const { data: complaint, error: complaintError } = await supabase
          .from('complaints')
          .insert({
            protocol_number: protocolNumber,
            type: normalizedType,
            category: complaintData.category,
            description: complaintData.description,
            is_anonymous: complaintData.isAnonymous,
            reporter_name: complaintData.isAnonymous ? null : complaintData.name,
            reporter_email: complaintData.isAnonymous ? null : complaintData.email,
            reporter_phone: complaintData.isAnonymous ? null : complaintData.phone,
            location: complaintData.location,
            status: 'novo',
            waiting_since: new Date().toISOString(),
          })
          .select()
          .single();

        if (complaintError) {
          console.error('Error creating complaint:', complaintError);
          throw new Error(`Failed to create complaint: ${complaintError.message}`);
        }

        // Also add to service queue for tracking
        await supabase
          .from('service_queue')
          .insert({
            channel: 'voice',
            status: 'waiting',
            priority: normalizedType === 'denuncia' ? 1 : 2,
            customer_name: complaintData.isAnonymous ? 'Anônimo' : (complaintData.name || 'Não identificado'),
            customer_phone: complaintData.phone,
            subject: `${complaintData.type}: ${complaintData.category}`,
            waiting_since: new Date().toISOString(),
          });

        console.log(`Complaint created with protocol: ${protocolNumber}`);

        return new Response(
          JSON.stringify({
            success: true,
            protocolNumber,
            complaintId: complaint.id,
            message: `Sua solicitação foi registrada com sucesso. Seu protocolo é ${protocolNumber}.`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'transferToHuman': {
        const transferData = data as TransferToHumanData;

        // Add to service queue with waiting status
        const { data: queueItem, error: queueError } = await supabase
          .from('service_queue')
          .insert({
            channel: 'voice',
            status: 'waiting',
            priority: 1, // High priority for human transfer requests
            customer_name: transferData.customerName || 'Cliente',
            customer_phone: transferData.customerPhone,
            subject: transferData.subject || 'Solicitação de atendimento humano',
            voice_session_id: transferData.voiceSessionId,
            waiting_since: new Date().toISOString(),
          })
          .select()
          .single();

        if (queueError) {
          console.error('Error creating queue item:', queueError);
          throw new Error(`Failed to transfer to human: ${queueError.message}`);
        }

        console.log(`Transferred to human queue: ${queueItem.id}`);

        return new Response(
          JSON.stringify({
            success: true,
            queueId: queueItem.id,
            message: 'Você foi transferido para a fila de atendimento. Um atendente irá atendê-lo em breve.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'lookupProtocol': {
        const lookupData = data as LookupProtocolData;

        const { data: complaint, error: lookupError } = await supabase
          .from('complaints')
          .select('*')
          .eq('protocol_number', lookupData.protocolNumber)
          .single();

        if (lookupError || !complaint) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `Não foi encontrada nenhuma solicitação com o protocolo ${lookupData.protocolNumber}.`,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const statusMessages: Record<string, string> = {
          novo: 'aguardando análise',
          em_analise: 'em andamento',
          resolvido: 'resolvida',
          fechado: 'encerrada',
        };

        return new Response(
          JSON.stringify({
            success: true,
            complaint: {
              protocolNumber: complaint.protocol_number,
              type: complaint.type,
              category: complaint.category,
              status: complaint.status,
              createdAt: complaint.created_at,
            },
            message: `Sua solicitação ${complaint.protocol_number} está ${statusMessages[complaint.status] || complaint.status}.`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Voice agent tools error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
