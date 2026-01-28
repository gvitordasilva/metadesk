
# Plano: Corrigir Erro do reCAPTCHA

## Problema Identificado
O erro "ERROR for site owner: Invalid key type" acontece porque a chave reCAPTCHA atual (`6Lfa8VcsAAAAANLELZayXSTQlCwWh0eoc-XC2I1E`) não é compatível com o tipo de reCAPTCHA sendo usado (v2 checkbox).

## Solução

### Opção A: Obter Nova Chave reCAPTCHA v2 (Recomendado)
Se você tem acesso ao Google reCAPTCHA Admin Console:

1. Acesse https://www.google.com/recaptcha/admin
2. Crie um novo site com tipo "reCAPTCHA v2" → "Não sou um robô"
3. Adicione o domínio `lovable.app` e `metadesk-command-center.lovable.app`
4. Copie a nova Site Key
5. Atualizarei o código com a nova chave

### Opção B: Usar Chave de Teste do Google (Temporário)
O Google fornece chaves de teste que sempre validam:
- **Site Key (teste):** `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- **Secret Key (teste):** `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

Isso funcionará para testes, mas não deve ser usado em produção.

## Alteração Necessária

**Arquivo:** `src/components/complaints/StepConfirmation.tsx`

Alterar a linha 18:
```typescript
// DE:
const RECAPTCHA_SITE_KEY = "6Lfa8VcsAAAAANLELZayXSTQlCwWh0eoc-XC2I1E";

// PARA (chave de teste):
const RECAPTCHA_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

// OU PARA (sua nova chave v2):
const RECAPTCHA_SITE_KEY = "SUA_NOVA_CHAVE_V2_AQUI";
```

## Próximos Passos

1. Me informe qual opção prefere:
   - **Chave de teste** (funciona imediatamente para desenvolvimento)
   - **Nova chave v2** (forneça a chave que você criar no Google)

2. Também precisarei atualizar o secret key na edge function se você criar uma nova chave de produção

## Detalhes Técnicos

O código atual usa a API de reCAPTCHA v2 explícito:
- `render=explicit` na URL do script
- `grecaptcha.render()` para criar o widget checkbox

A chave existente parece ser de reCAPTCHA v3 (invisível/score-based) ou reCAPTCHA Enterprise, que não são compatíveis com essa implementação.
