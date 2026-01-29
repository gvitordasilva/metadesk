

# Deploy da Edge Function no Projeto Correto

## Problema Identificado

A edge function `send-complaint-email` existe no código mas precisa ser deployada no projeto Supabase correto (`udyjlesjcgxhgdiaptjp`).

Além disso, há uma referência ao projeto antigo no código da função que precisa ser corrigida.

## Ações Necessárias

### 1. Corrigir Link no Email Interno

No arquivo `supabase/functions/send-complaint-email/index.ts`, linha 227, o link do painel aponta para o projeto errado:

```typescript
// De:
href="https://supabase.com/dashboard/project/jhkxcplfempenoczcoep/editor"

// Para:
href="https://supabase.com/dashboard/project/udyjlesjcgxhgdiaptjp/editor"
```

### 2. Deploy da Edge Function

Após a correção, a função será deployada automaticamente no projeto `udyjlesjcgxhgdiaptjp` (conforme configurado em `supabase/config.toml`).

### 3. Verificar Secrets no Projeto Correto

Confirmar que os seguintes secrets estão configurados no projeto `udyjlesjcgxhgdiaptjp`:
- `RECAPTCHA_SECRET_KEY` - chave secreta do reCAPTCHA v2
- `RESEND_API_KEY` - chave da API do Resend
- `RESEND_FROM` - email de origem

Dashboard: https://supabase.com/dashboard/project/udyjlesjcgxhgdiaptjp/settings/functions

## Resultado Esperado

- Edge function deployada no projeto correto
- reCAPTCHA v2 validado corretamente no backend
- Emails enviados com sucesso
- Link no email interno aponta para o dashboard correto

