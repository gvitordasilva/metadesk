import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendMessageRequest {
  type: "sms" | "whatsapp" | "voice";
  to: string;
  body?: string;
  from?: string;
  twiml_url?: string; // For voice calls
  service_queue_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const twilioWhatsAppNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken) {
      throw new Error("Twilio credentials not configured");
    }

    const { type, to, body, from, twiml_url, service_queue_id }: SendMessageRequest = await req.json();

    console.log(`[Twilio Send] Type: ${type}, To: ${to}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let twilioResponse: Response;
    let twilioData: Record<string, unknown>;

    const authHeader = "Basic " + btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    switch (type) {
      case "sms": {
        const formData = new URLSearchParams();
        formData.append("To", to);
        formData.append("From", from || twilioPhoneNumber || "");
        formData.append("Body", body || "");

        twilioResponse = await fetch(
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
        twilioData = await twilioResponse.json();
        break;
      }

      case "whatsapp": {
        const formData = new URLSearchParams();
        formData.append("To", `whatsapp:${to}`);
        formData.append("From", from || `whatsapp:${twilioWhatsAppNumber}` || "");
        formData.append("Body", body || "");

        twilioResponse = await fetch(
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
        twilioData = await twilioResponse.json();
        break;
      }

      case "voice": {
        const formData = new URLSearchParams();
        formData.append("To", to);
        formData.append("From", from || twilioPhoneNumber || "");
        if (twiml_url) {
          formData.append("Url", twiml_url);
        } else {
          // Default TwiML URL - you should configure this
          formData.append(
            "Twiml",
            `<Response><Say language="pt-BR">${body || "Olá, esta é uma chamada do Metadesk."}</Say></Response>`
          );
        }

        twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`,
          {
            method: "POST",
            headers: {
              Authorization: authHeader,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
          }
        );
        twilioData = await twilioResponse.json();
        break;
      }

      default:
        throw new Error("Invalid message type");
    }

    console.log("[Twilio Send] Response:", JSON.stringify(twilioData, null, 2));

    if (!twilioResponse.ok) {
      throw new Error(`Twilio API error: ${JSON.stringify(twilioData)}`);
    }

    // Record the outbound interaction
    const sid = (twilioData.sid || twilioData.Sid) as string;
    if (sid) {
      await supabase.from("twilio_interactions").insert({
        twilio_sid: sid,
        account_sid: twilioAccountSid,
        interaction_type: type === "voice" ? "voice" : type,
        direction: "outbound",
        from_number: from || (type === "whatsapp" ? twilioWhatsAppNumber : twilioPhoneNumber) || "",
        to_number: to,
        status: (twilioData.status || "queued") as string,
        message_body: body,
        service_queue_id: service_queue_id,
        raw_webhook_data: twilioData,
      });
    }

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
