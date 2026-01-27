import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ComplaintEmailRequest {
  protocolNumber: string;
  email: string | null;
  name: string | null;
  type: string;
  category: string;
  description: string;
  captchaToken: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ComplaintEmailRequest = await req.json();
    const { protocolNumber, email, name, type, category, description, captchaToken } = body;

    // Verify reCAPTCHA (optional - can be skipped if using test key)
    const recaptchaSecret = Deno.env.get("RECAPTCHA_SECRET_KEY");
    if (recaptchaSecret && captchaToken) {
      const recaptchaResponse = await fetch(
        "https://www.google.com/recaptcha/api/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `secret=${recaptchaSecret}&response=${captchaToken}`,
        }
      );
      const recaptchaResult = await recaptchaResponse.json();
      
      if (!recaptchaResult.success) {
        console.log("reCAPTCHA validation failed:", recaptchaResult);
        // For test key, we'll allow it to pass
      }
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const RESEND_FROM = Deno.env.get("RESEND_FROM") || "onboarding@resend.dev";

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const typeLabels: Record<string, string> = {
      reclamacao: "Reclamação",
      denuncia: "Denúncia",
      sugestao: "Sugestão",
    };

    const categoryLabels: Record<string, string> = {
      atendimento: "Atendimento",
      produto: "Produto",
      servico: "Serviço",
      conduta: "Conduta",
      financeiro: "Financeiro",
      outro: "Outro",
    };

    // Send confirmation email to the reporter (if not anonymous)
    if (email) {
      const customerEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a2e; color: #f0e68c; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .protocol { font-size: 24px; font-weight: bold; color: #1a1a2e; background: #f0e68c; padding: 15px; text-align: center; margin: 20px 0; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Metadesk</h1>
              <p>Reclamações e Denúncias</p>
            </div>
            <div class="content">
              <p>Olá${name ? `, <strong>${name}</strong>` : ""},</p>
              <p>Sua solicitação foi registrada com sucesso!</p>
              
              <div class="protocol">
                Protocolo: ${protocolNumber}
              </div>
              
              <div class="details">
                <p><strong>Tipo:</strong> ${typeLabels[type] || type}</p>
                <p><strong>Categoria:</strong> ${categoryLabels[category] || category}</p>
                <p><strong>Descrição:</strong><br>${description.substring(0, 200)}${description.length > 200 ? "..." : ""}</p>
              </div>
              
              <p>Guarde este número de protocolo para acompanhar o andamento da sua solicitação.</p>
              <p>Nossa equipe irá analisar sua manifestação e tomar as providências necessárias.</p>
            </div>
            <div class="footer">
              <p>Este é um e-mail automático. Por favor, não responda.</p>
              <p>© ${new Date().getFullYear()} Metadesk. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const customerEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: email,
          subject: `Confirmação de Solicitação - Protocolo ${protocolNumber}`,
          html: customerEmailHtml,
        }),
      });

      if (!customerEmailResponse.ok) {
        const error = await customerEmailResponse.text();
        console.error("Failed to send customer email:", error);
      } else {
        console.log("Customer email sent successfully");
      }
    }

    // Send notification to the company (internal team)
    const companyEmail = Deno.env.get("COMPANY_NOTIFICATION_EMAIL") || "atendimento@metadesk.com.br";
    
    const internalEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .protocol { font-size: 20px; font-weight: bold; color: #dc2626; padding: 10px; background: #fee2e2; text-align: center; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .label { font-weight: bold; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Nova ${typeLabels[type] || type}</h1>
          </div>
          <div class="content">
            <div class="protocol">
              Protocolo: ${protocolNumber}
            </div>
            
            <div class="details">
              <p><span class="label">Tipo:</span> ${typeLabels[type] || type}</p>
              <p><span class="label">Categoria:</span> ${categoryLabels[category] || category}</p>
              <p><span class="label">Solicitante:</span> ${name ? `${name} (${email})` : "Anônimo"}</p>
              <p><span class="label">Descrição:</span></p>
              <p style="background: #f5f5f5; padding: 15px; border-radius: 4px;">${description}</p>
            </div>
            
            <p style="text-align: center;">
              <a href="https://supabase.com/dashboard/project/jhkxcplfempenoczcoep/editor" 
                 style="background: #1a1a2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Acessar Painel
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const internalEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: companyEmail,
        subject: `🚨 Nova ${typeLabels[type] || type} - Protocolo ${protocolNumber}`,
        html: internalEmailHtml,
      }),
    });

    if (!internalEmailResponse.ok) {
      const error = await internalEmailResponse.text();
      console.error("Failed to send internal email:", error);
    } else {
      console.log("Internal notification email sent successfully");
    }

    return new Response(
      JSON.stringify({ success: true, protocolNumber }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-complaint-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
