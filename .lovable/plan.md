
# Plano: Corrigir Chaves do reCAPTCHA

## Resumo
Corrigir a inversão das chaves do reCAPTCHA, atualizando a chave do site no frontend.

## Alterações

### 1. Atualizar Chave do Site no Frontend
**Arquivo:** `src/components/complaints/StepConfirmation.tsx`

Alterar a constante `RECAPTCHA_SITE_KEY`:
- **De:** `6Lfa8VcsAAAAABYSJKRibK6PRYXp3_3H1MfLQfnf`
- **Para:** `6Lfa8VcsAAAAANLELZayXSTQlCwWh0eoc-XC2I1E`

### 2. Verificar Secret do Servidor
O secret `RECAPTCHA_SECRET_KEY` já está configurado no projeto. Se ele contém a chave que você informou inicialmente (`6Lfa8VcsAAAAABYSJKRibK6PRYXp3_3H1MfLQfnf`), está correto.

Caso contrário, será necessário atualizar o secret com a chave secreta correta.

## Resultado
Após a implementação:
- O widget reCAPTCHA será renderizado corretamente no frontend usando a chave do site
- A validação no servidor (Edge Function) usará a chave secreta para verificar o token
- O sistema de reclamações terá proteção anti-bot completa
