

## Atualização da Site Key do reCAPTCHA v2

### Objetivo
Substituir a Site Key antiga (que era do tipo incorreto) pela nova chave v2 Checkbox fornecida.

### Alteração Necessária

**Arquivo:** `src/components/complaints/StepConfirmation.tsx`

**Linha 19 - Antes:**
```ts
const RECAPTCHA_SITE_KEY = "6LfIIFosAAAAAPBx5sMXu73AUth0qweQaCAwUchs";
```

**Linha 19 - Depois:**
```ts
const RECAPTCHA_SITE_KEY = "6Le0_VksAAAAAOyv9vyuzjv3AAIuPVFlgb7COAwx";
```

### Checklist Pós-Atualização

Após a alteração, você deve:

1. **Verificar no Supabase** se o `RECAPTCHA_SECRET_KEY` corresponde à **Secret Key** do mesmo par de chaves (o par da nova Site Key `6Le0_VksAAAAAOyv9vyuzjv3AAIuPVFlgb7COAwx`)
2. **Testar o formulário** em `/reclamacoes-denuncias`:
   - O widget "Não sou um robô" deve aparecer corretamente
   - Ao marcar o checkbox, deve validar sem erros
   - Ao enviar, deve funcionar sem o erro "Invalid key type"

### Detalhes Técnicos

A chave v2 Checkbox requer que os domínios estejam configurados no Google reCAPTCHA Admin Console:
- `metadesk.lovable.app`
- `id-preview--02285688-a4c8-415e-8f68-e425428403c0.lovable.app`
- `localhost` (para desenvolvimento)

