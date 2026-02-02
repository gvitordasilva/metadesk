import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendMessageRequest {
  to: string;
  body: string;
  conversation_id: string;
  media_url?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioWhatsAppNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
      throw new Error("Twilio credentials not configured");
    }

    const { to, body, conversation_id, media_url }: SendMessageRequest = await req.json();

    console.log(`[Twilio Send] Sending WhatsApp to: ${to}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Send via Twilio
    const authHeader = "Basic " + btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const formData = new URLSearchParams();
    formData.append("To", `whatsapp:${to}`);
    formData.append("From", `whatsapp:${twilioWhatsAppNumber}`);
    formData.append("Body", body);

    if (media_url) {
      formData.append("MediaUrl", media_url);
    }

    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    const twilioData = await twilioResponse.json();
    console.log("[Twilio Send] Response:", JSON.stringify(twilioData, null, 2));

    if (!twilioResponse.ok) {
      throw new Error(`Twilio API error: ${twilioData.message || JSON.stringify(twilioData)}`);
    }

    // Get sender info from auth header
    const authHeaderValue = req.headers.get("Authorization");
    let senderId: string | null = null;

    if (authHeaderValue) {
      try {
        const token = authHeaderValue.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);
        senderId = user?.id || null;
      } catch (e) {
        console.log("[Twilio Send] Could not get user from token");
      }
    }

    // Save message to database
    const { error: messageError } = await supabase
      .from("whatsapp_messages")
      .insert({
        conversation_id: conversation_id,
        message_sid: twilioData.sid,
        direction: "outbound",
        sender_type: senderId ? "agent" : "system",
        sender_id: senderId,
        content: body,
        message_type: media_url ? "image" : "text",
        media_url: media_url,
        status: twilioData.status || "sent",
        metadata: twilioData,
      });

    if (messageError) {
      console.error("[Twilio Send] Error saving message:", messageError);
    }

    // Update service queue with last message
    await supabase
      .from("service_queue")
      .update({
        last_message: body,
        updated_at: new Date().toISOString(),
      })
      .eq("whatsapp_conversation_id", conversation_id);

    return new Response(JSON.stringify({ success: true, data: twilioData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Twilio Send] Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
