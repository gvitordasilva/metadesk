

# Atualizar Chave reCAPTCHA v2

## Verificacao de Ambiente

Confirmado que o projeto esta configurado corretamente:
- `supabase/config.toml`: project_id = `udyjlesjcgxhgdiaptjp`
- `src/integrations/supabase/client.ts`: URL = `https://udyjlesjcgxhgdiaptjp.supabase.co`
- Edge Functions serao deployadas no ambiente correto

## Alteracao Necessaria

Substituir a chave antiga (Enterprise) pela nova chave v2 no arquivo do frontend.

## Arquivo a Modificar

**`src/components/complaints/StepConfirmation.tsx` (linha 19)**

```typescript
// De:
const RECAPTCHA_SITE_KEY = "6LfT8VgsAAAAAOloUkq771fK5j5Ef3NhjasD6NDL";

// Para:
const RECAPTCHA_SITE_KEY = "6LfIIFosAAAAAPBx5sMXu73AUth0qweQaCAwUchs";
```

## Verificacao Pre-requisito

Antes de testar, confirme que a **chave secreta** (Secret Key) correspondente foi adicionada nos Secrets do Supabase:
- Dashboard: https://supabase.com/dashboard/project/udyjlesjcgxhgdiaptjp/settings/functions
- Nome do secret: `RECAPTCHA_SECRET_KEY`
- Valor: a chave secreta gerada junto com a chave de site no Google reCAPTCHA Admin

## Resultado Esperado

- Widget reCAPTCHA v2 renderiza sem erro "Invalid key type"
- Checkbox "Nao sou um robo" funciona normalmente
- Backend valida o token corretamente via Edge Function `send-complaint-email`

