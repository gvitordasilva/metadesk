import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TwilioWhatsAppWebhook {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  ProfileName?: string;
  WaId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse form data from Twilio webhook
    const formData = await req.formData();
    const webhookData: Record<string, string> = {};
    formData.forEach((value, key) => {
      webhookData[key] = value.toString();
    });

    console.log("[WhatsApp Webhook] Received:", JSON.stringify(webhookData, null, 2));

    const data = webhookData as unknown as TwilioWhatsAppWebhook;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Clean phone number (remove whatsapp: prefix)
    const phoneNumber = data.From?.replace("whatsapp:", "") || "";
    const profileName = data.ProfileName || `WhatsApp ${phoneNumber}`;
    const waId = data.WaId || phoneNumber.replace("+", "");

    // 1. Upsert contact
    const { data: contact, error: contactError } = await supabase
      .from("whatsapp_contacts")
      .upsert({
        phone_number: phoneNumber,
        profile_name: profileName,
        wa_id: waId,
        last_contact_at: new Date().toISOString(),
      }, {
        onConflict: "phone_number",
      })
      .select()
      .single();

    if (contactError) {
      console.error("[WhatsApp Webhook] Error upserting contact:", contactError);
    }

    // 2. Find or create conversation
    let conversation;
    const { data: existingConversation } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("phone_number", phoneNumber)
      .in("status", ["active", "escalated"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingConversation) {
      conversation = existingConversation;
      // Update last message time
      await supabase
        .from("whatsapp_conversations")
        .update({
          last_message_at: new Date().toISOString(),
          customer_name: profileName,
          contact_id: contact?.id,
        })
        .eq("id", conversation.id);
    } else {
      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from("whatsapp_conversations")
        .insert({
          phone_number: phoneNumber,
          customer_name: profileName,
          status: "active",
          contact_id: contact?.id,
        })
        .select()
        .single();

      if (convError) {
        console.error("[WhatsApp Webhook] Error creating conversation:", convError);
        throw convError;
      }
      conversation = newConversation;

      // Create service queue entry for new conversation
      await supabase
        .from("service_queue")
        .insert({
          channel: "twilio_whatsapp",
          status: "waiting",
          priority: 3,
          customer_phone: phoneNumber,
          customer_name: profileName,
          subject: "Conversa WhatsApp",
          last_message: data.Body,
          whatsapp_conversation_id: conversation.id,
        });
    }

    // 3. Create message record
    const hasMedia = parseInt(data.NumMedia || "0") > 0;
    const messageType = hasMedia ? getMediaType(data.MediaContentType0) : "text";

    const { error: messageError } = await supabase
      .from("whatsapp_messages")
      .insert({
        conversation_id: conversation.id,
        message_sid: data.MessageSid,
        direction: "inbound",
        sender_type: "customer",
        content: data.Body,
        message_type: messageType,
        media_url: data.MediaUrl0,
        media_type: data.MediaContentType0,
        status: "delivered",
        metadata: webhookData,
      });

    if (messageError) {
      console.error("[WhatsApp Webhook] Error creating message:", messageError);
    }

    // 4. Update service queue with last message
    await supabase
      .from("service_queue")
      .update({
        last_message: data.Body || (hasMedia ? "[Mídia recebida]" : ""),
        updated_at: new Date().toISOString(),
      })
      .eq("whatsapp_conversation_id", conversation.id);

    // Return empty TwiML (don't auto-reply)
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

    return new Response(twiml, {
      headers: { "Content-Type": "application/xml" },
    });
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }
});

function getMediaType(contentType?: string): string {
  if (!contentType) return "text";
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("application/")) return "document";
  return "text";
}
