
# Plano: Migrar para reCAPTCHA Enterprise

## Status: ✅ CONCLUÍDO

## Alterações Realizadas

### 1. Frontend - StepConfirmation.tsx
- ✅ Migrado de reCAPTCHA v2 checkbox para reCAPTCHA Enterprise (invisível)
- ✅ Script atualizado para `https://www.google.com/recaptcha/enterprise.js`
- ✅ Site Key: `6LfT8VgsAAAAAOloUkq771fK5j5Ef3NhjasD6NDL`
- ✅ Verificação automática ao clicar em "Enviar" (sem checkbox)
- ✅ Adicionado badge informativo "Protegido pelo reCAPTCHA Enterprise"
- ✅ Adicionados links para políticas do Google

### 2. Backend - Edge Function
- ✅ Integrado com API reCAPTCHA Enterprise
- ✅ Endpoint: `recaptchaenterprise.googleapis.com/v1/projects/gen-lang-client-0889154492/assessments`
- ✅ Validação de token, action e score
- ✅ Score mínimo: 0.5 (configurável)

### 3. Secrets Configurados
- ✅ `RECAPTCHA_GCP_API_KEY`: Adicionado pelo usuário
- ✅ Project ID: `gen-lang-client-0889154492` (hardcoded)

## Fluxo Atual

```
Usuário clica "Enviar" 
    ↓
grecaptcha.enterprise.execute() gera token
    ↓
Backend valida via Enterprise API
    ↓
Score >= 0.5 → Aceito
Score < 0.5 → Rejeitado (bot)
```

## Resultado

- Checkbox "Não sou robô" removido
- Verificação invisível e automática
- Proteção por score-based detection
- Badge discreto do reCAPTCHA visível
