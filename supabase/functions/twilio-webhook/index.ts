import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TwilioVoiceWebhook {
  CallSid: string;
  AccountSid: string;
  From: string;
  To: string;
  CallStatus: string;
  Direction: string;
  CallerName?: string;
  CallerCity?: string;
  CallerState?: string;
  CallerCountry?: string;
  RecordingUrl?: string;
  RecordingSid?: string;
  RecordingDuration?: string;
  CallDuration?: string;
}

interface TwilioMessageWebhook {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  SmsStatus?: string;
  WaId?: string; // WhatsApp ID
  ProfileName?: string; // WhatsApp profile name
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const interactionType = url.searchParams.get("type") || "voice";

    // Parse form data from Twilio webhook
    const formData = await req.formData();
    const webhookData: Record<string, string> = {};
    formData.forEach((value, key) => {
      webhookData[key] = value.toString();
    });

    console.log(`[Twilio Webhook] Type: ${interactionType}`, JSON.stringify(webhookData, null, 2));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let response: Response;

    switch (interactionType) {
      case "voice":
        response = await handleVoiceWebhook(supabase, webhookData as unknown as TwilioVoiceWebhook);
        break;
      case "sms":
        response = await handleSmsWebhook(supabase, webhookData as unknown as TwilioMessageWebhook, "sms");
        break;
      case "whatsapp":
        response = await handleSmsWebhook(supabase, webhookData as unknown as TwilioMessageWebhook, "whatsapp");
        break;
      case "voice-status":
        response = await handleVoiceStatusCallback(supabase, webhookData as unknown as TwilioVoiceWebhook);
        break;
      default:
        response = new Response("Unknown interaction type", { status: 400 });
    }

    return response;
  } catch (error) {
    console.error("[Twilio Webhook] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleVoiceWebhook(
  supabase: ReturnType<typeof createClient>,
  data: TwilioVoiceWebhook
): Promise<Response> {
  console.log("[Voice Webhook] Processing call:", data.CallSid);

  // Create interaction record
  const { data: interaction, error: interactionError } = await supabase
    .from("twilio_interactions")
    .upsert({
      twilio_sid: data.CallSid,
      account_sid: data.AccountSid,
      interaction_type: "voice",
      direction: data.Direction?.toLowerCase() === "inbound" ? "inbound" : "outbound",
      from_number: data.From,
      to_number: data.To,
      status: data.CallStatus,
      raw_webhook_data: data,
    }, {
      onConflict: "twilio_sid",
    })
    .select()
    .single();

  if (interactionError) {
    console.error("[Voice Webhook] Error creating interaction:", interactionError);
  }

  // For inbound calls, create a service queue entry
  if (data.Direction?.toLowerCase() === "inbound" && data.CallStatus === "ringing") {
    const { error: queueError } = await supabase
      .from("service_queue")
      .insert({
        channel: "twilio_voice",
        status: "waiting",
        priority: 2, // High priority for calls
        customer_phone: data.From,
        customer_name: data.CallerName || `Chamada de ${data.From}`,
        subject: "Chamada de voz recebida",
        last_message: `Ligação recebida de ${data.From}`,
        voice_session_id: data.CallSid,
      });

    if (queueError) {
      console.error("[Voice Webhook] Error creating queue entry:", queueError);
    }

    // Update interaction with queue reference
    if (interaction) {
      const { data: queueEntry } = await supabase
        .from("service_queue")
        .select("id")
        .eq("voice_session_id", data.CallSid)
        .single();

      if (queueEntry) {
        await supabase
          .from("twilio_interactions")
          .update({ service_queue_id: queueEntry.id })
          .eq("twilio_sid", data.CallSid);
      }
    }
  }

  // Return TwiML response
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">Olá! Sua ligação foi recebida. Por favor, aguarde enquanto transferimos para um atendente.</Say>
  <Play>https://api.twilio.com/cowbell.mp3</Play>
  <Pause length="30"/>
  <Say language="pt-BR">Obrigado por aguardar. Um atendente entrará em contato em breve.</Say>
</Response>`;

  return new Response(twiml, {
    headers: { "Content-Type": "application/xml" },
  });
}

async function handleVoiceStatusCallback(
  supabase: ReturnType<typeof createClient>,
  data: TwilioVoiceWebhook
): Promise<Response> {
  console.log("[Voice Status] Updating call:", data.CallSid, "Status:", data.CallStatus);

  const updateData: Record<string, unknown> = {
    status: data.CallStatus,
    raw_webhook_data: data,
  };

  // If call ended, record duration
  if (["completed", "busy", "no-answer", "canceled", "failed"].includes(data.CallStatus)) {
    updateData.ended_at = new Date().toISOString();
    if (data.CallDuration) {
      updateData.call_duration = parseInt(data.CallDuration);
    }

    // Update service queue status
    await supabase
      .from("service_queue")
      .update({ status: data.CallStatus === "completed" ? "completed" : "waiting" })
      .eq("voice_session_id", data.CallSid);
  }

  // If there's a recording
  if (data.RecordingUrl) {
    updateData.recording_url = data.RecordingUrl;
    updateData.recording_sid = data.RecordingSid;
  }

  await supabase
    .from("twilio_interactions")
    .update(updateData)
    .eq("twilio_sid", data.CallSid);

  return new Response("OK", { status: 200 });
}

async function handleSmsWebhook(
  supabase: ReturnType<typeof createClient>,
  data: TwilioMessageWebhook,
  type: "sms" | "whatsapp"
): Promise<Response> {
  console.log(`[${type.toUpperCase()} Webhook] Processing message:`, data.MessageSid);

  const isWhatsApp = type === "whatsapp" || data.From?.startsWith("whatsapp:");
  const channel = isWhatsApp ? "twilio_whatsapp" : "sms";

  // Clean phone numbers (remove whatsapp: prefix if present)
  const fromNumber = data.From?.replace("whatsapp:", "") || "";
  const toNumber = data.To?.replace("whatsapp:", "") || "";

  // Create interaction record
  const { data: interaction, error: interactionError } = await supabase
    .from("twilio_interactions")
    .insert({
      twilio_sid: data.MessageSid,
      account_sid: data.AccountSid,
      interaction_type: isWhatsApp ? "whatsapp" : "sms",
      direction: "inbound",
      from_number: fromNumber,
      to_number: toNumber,
      status: data.SmsStatus || "received",
      message_body: data.Body,
      media_url: data.MediaUrl0,
      num_media: parseInt(data.NumMedia || "0"),
      raw_webhook_data: data,
    })
    .select()
    .single();

  if (interactionError) {
    console.error(`[${type.toUpperCase()} Webhook] Error creating interaction:`, interactionError);
  }

  // Check if there's an existing conversation in the queue
  const { data: existingQueue } = await supabase
    .from("service_queue")
    .select("id")
    .eq("customer_phone", fromNumber)
    .eq("channel", channel)
    .in("status", ["waiting", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existingQueue) {
    // Update existing queue entry
    await supabase
      .from("service_queue")
      .update({
        last_message: data.Body,
        unread_count: supabase.rpc("increment_unread", { row_id: existingQueue.id }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingQueue.id);

    // Link interaction to queue
    if (interaction) {
      await supabase
        .from("twilio_interactions")
        .update({ service_queue_id: existingQueue.id })
        .eq("twilio_sid", data.MessageSid);
    }
  } else {
    // Create new queue entry
    const customerName = data.ProfileName || (isWhatsApp ? `WhatsApp ${fromNumber}` : `SMS ${fromNumber}`);

    const { data: newQueue, error: queueError } = await supabase
      .from("service_queue")
      .insert({
        channel: channel,
        status: "waiting",
        priority: 3,
        customer_phone: fromNumber,
        customer_name: customerName,
        subject: isWhatsApp ? "Mensagem WhatsApp" : "Mensagem SMS",
        last_message: data.Body,
      })
      .select()
      .single();

    if (queueError) {
      console.error(`[${type.toUpperCase()} Webhook] Error creating queue entry:`, queueError);
    }

    // Link interaction to new queue
    if (interaction && newQueue) {
      await supabase
        .from("twilio_interactions")
        .update({ service_queue_id: newQueue.id })
        .eq("twilio_sid", data.MessageSid);
    }
  }

  // Return TwiML response for SMS/WhatsApp
  const responseMessage = isWhatsApp
    ? "Recebemos sua mensagem! Em breve um atendente irá respondê-lo."
    : "Mensagem recebida! Aguarde nosso retorno.";

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage}</Message>
</Response>`;

  return new Response(twiml, {
    headers: { "Content-Type": "application/xml" },
  });
}
