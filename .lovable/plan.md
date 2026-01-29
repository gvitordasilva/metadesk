

## Atualização da Site Key reCAPTCHA v2

### Alteração

**Arquivo:** `src/components/complaints/StepConfirmation.tsx`

**Linha 19 - Atual:**
```typescript
const RECAPTCHA_SITE_KEY = "6Le0_VksAAAAAOyv9vyuzjv3AAIuPVFlgb7COAwx";
```

**Linha 19 - Nova:**
```typescript
const RECAPTCHA_SITE_KEY = "6LdkO1osAAAAAL7sEXFROu8ubfOb9aI4971WgJ43";
```

### Ação Necessária no Supabase

Você também precisa atualizar o secret no Supabase Dashboard:

1. Acesse: **Settings > Edge Functions > Secrets**
2. Atualize `RECAPTCHA_SECRET_KEY` com a **Secret Key** correspondente a esta nova Site Key

### Checklist Pós-Atualização

1. Navegar até `/reclamacoes-denuncias`
2. Preencher o formulário até a etapa de confirmação
3. Verificar que o widget "Não sou um robô" aparece sem erros
4. Marcar o checkbox e confirmar que a verificação funciona
5. Enviar a solicitação e confirmar que não há erro de validação

