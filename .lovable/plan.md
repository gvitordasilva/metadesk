

# Código Mínimo da Edge Function para Validar reCAPTCHA v2

## Onde Criar

**Projeto Supabase:** `udyjlesjcgxhgdiaptjp`
- Dashboard > Edge Functions > Create function
- Nome: `send-complaint-email`
- JWT verification: **Desativado** (função pública)

## Secret Necessário

Configure em Dashboard > Settings > Edge Functions > Secrets:
- `RECAPTCHA_SECRET_KEY` = sua chave secreta do reCAPTCHA v2 (não a Site Key)

## Código para colar no `index.ts`

```ts
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyRecaptchaV2(token: string): Promise<{ success: boolean; error?: string }> {
  const secretKey = Deno.env.get("RECAPTCHA_SECRET_KEY");

  if (!secretKey) {
    console.error("RECAPTCHA_SECRET_KEY not configured");
    return { success: false, error: "reCAPTCHA not configured" };
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
  });

  const result = await response.json();
  console.log("reCAPTCHA result:", JSON.stringify(result));

  if (!result.success) {
    return { success: false, error: "Invalid reCAPTCHA" };
  }

  return { success: true };
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { captchaToken, protocolNumber } = await req.json();

    // Validar reCAPTCHA
    if (!captchaToken) {
      return new Response(
        JSON.stringify({ error: "reCAPTCHA token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recaptchaResult = await verifyRecaptchaV2(captchaToken);

    if (!recaptchaResult.success) {
      return new Response(
        JSON.stringify({ error: recaptchaResult.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("reCAPTCHA verified successfully for protocol:", protocolNumber);

    // Aqui você pode adicionar lógica de envio de email depois
    // Por enquanto, apenas retorna sucesso

    return new Response(
      JSON.stringify({ success: true, protocolNumber }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

## Como Testar

1. Acesse `/reclamacoes-denuncias` no site
2. Preencha o formulário até a última etapa
3. Marque o checkbox "Não sou um robô"
4. Clique em "Enviar Solicitação"
5. Verifique os logs da Edge Function em:
   Dashboard > Edge Functions > `send-complaint-email` > Logs

Deve aparecer: `reCAPTCHA verified successfully for protocol: REC-2026-XXXXXX`

