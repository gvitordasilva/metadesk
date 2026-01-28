
# Plano: Migrar para reCAPTCHA Enterprise

## Problema
A implementação atual usa reCAPTCHA v2 (checkbox), mas você tem chaves do **reCAPTCHA Enterprise** do Google Cloud, que usa uma API completamente diferente.

## Alterações Necessárias

### 1. Frontend - StepConfirmation.tsx
**Arquivo:** `src/components/complaints/StepConfirmation.tsx`

Alterações:
- Trocar de `grecaptcha.render()` para `grecaptcha.enterprise.execute()`
- Usar script Enterprise: `https://www.google.com/recaptcha/enterprise.js`
- Atualizar Site Key para: `6LfT8VgsAAAAAOloUkq771fK5j5Ef3NhjasD6NDL`
- Implementar execução automática ao clicar em "Enviar" (sem checkbox visível)

O reCAPTCHA Enterprise é invisível (score-based), então o usuário não verá um checkbox - a verificação acontece automaticamente quando clicar no botão de enviar.

### 2. Backend - Edge Function
**Arquivo:** `supabase/functions/send-complaint-email/index.ts`

Alterações:
- Trocar endpoint de verificação de `google.com/recaptcha/api/siteverify` para `recaptchaenterprise.googleapis.com`
- Usar a API REST do reCAPTCHA Enterprise com a API Key do GCP
- Implementar avaliação de score (0.0 = bot, 1.0 = humano)

### 3. Secrets Necessários
Precisamos adicionar dois secrets no Supabase:
- `RECAPTCHA_GCP_API_KEY`: A API Key do Google Cloud para autenticar
- `RECAPTCHA_GCP_PROJECT_ID`: `gen-lang-client-0889154492`

## Fluxo do reCAPTCHA Enterprise

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────────┐
│  Usuário clica  │     │  Frontend gera   │     │  Backend valida via     │
│  "Enviar"       │ ──▶ │  token via       │ ──▶ │  Enterprise API         │
│                 │     │  grecaptcha.     │     │  e verifica score       │
│                 │     │  enterprise.     │     │                         │
│                 │     │  execute()       │     │  Score ≥ 0.5 = OK       │
└─────────────────┘     └──────────────────┘     └─────────────────────────┘
```

## Detalhes Técnicos

### Frontend (novo código simplificado)
```typescript
// Site Key Enterprise
const RECAPTCHA_SITE_KEY = "6LfT8VgsAAAAAOloUkq771fK5j5Ef3NhjasD6NDL";

// Script Enterprise
<script src="https://www.google.com/recaptcha/enterprise.js?render=SITE_KEY">

// Ao submeter
const token = await grecaptcha.enterprise.execute(SITE_KEY, {action: 'submit_complaint'});
```

### Backend (verificação Enterprise)
```typescript
// Endpoint Enterprise
POST https://recaptchaenterprise.googleapis.com/v1/projects/gen-lang-client-0889154492/assessments?key=API_KEY

// Body
{
  "event": {
    "token": "TOKEN_DO_FRONTEND",
    "expectedAction": "submit_complaint",
    "siteKey": "6LfT8VgsAAAAAOloUkq771fK5j5Ef3NhjasD6NDL"
  }
}

// Resposta inclui score (0.0 a 1.0)
// Aceitar se score >= 0.5
```

## Próximos Passos

1. Me forneça a **API Key** do Google Cloud Platform (encontrada em APIs & Services → Credentials)
2. Farei as alterações no frontend e backend
3. Adicionarei os secrets necessários

## Resultado

- O checkbox "Não sou robô" será removido (reCAPTCHA Enterprise é invisível)
- A verificação acontecerá automaticamente ao clicar em "Enviar"
- A validação usará score-based detection (mais seguro)
- Aparecerá um pequeno badge do reCAPTCHA no canto da página
