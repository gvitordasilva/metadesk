
# Plano: Corrigir Posicionamento do Badge do reCAPTCHA Enterprise

## Problema Identificado

O reCAPTCHA Enterprise, quando carregado com a opção `render=SITE_KEY`, exibe automaticamente um **badge flutuante** (selo) no canto inferior direito da tela. Este badge está:

1. Posicionado em um local extremo que pode estar sendo cortado pelo layout
2. Apresentando erros de validação que o usuário não consegue visualizar
3. Interferindo na experiência do usuário

## Causa Raiz

O Google reCAPTCHA Enterprise v3 usa verificação invisível baseada em score, mas ainda exibe um badge obrigatório por padrão. Como a implementação atual já inclui o texto legal exigido pelo Google ("Este site é protegido pelo reCAPTCHA e as Políticas de Privacidade e Termos de Serviço do Google se aplicam"), é **permitido ocultar o badge via CSS**.

## Solução Proposta

### 1. Adicionar CSS Global para Ocultar o Badge

No arquivo `src/index.css`, adicionar regra CSS para ocultar o badge do reCAPTCHA:

```css
/* Oculta o badge do reCAPTCHA - texto legal já está visível no formulário */
.grecaptcha-badge {
  visibility: hidden !important;
}
```

### 2. Melhorar Tratamento de Erros no Componente

No arquivo `src/components/complaints/StepConfirmation.tsx`:

- Adicionar estado para armazenar mensagens de erro
- Exibir erro de forma clara para o usuário quando a verificação falhar
- Adicionar logs de console para debug

## Arquivos a Modificar

### `src/index.css`
- Adicionar regra CSS para ocultar `.grecaptcha-badge`

### `src/components/complaints/StepConfirmation.tsx`
- Adicionar estado `recaptchaError` para capturar e exibir erros
- Melhorar o bloco `catch` para mostrar mensagem amigável ao usuário
- Adicionar feedback visual quando há erro na verificação

## Conformidade com Google

Esta solução está em conformidade com as diretrizes do Google para reCAPTCHA invisível. O Google permite ocultar o badge desde que o texto de branding seja visível, o que já está implementado na linha 237-247 do componente atual:

> "Este site é protegido pelo reCAPTCHA e as Políticas de Privacidade e Termos de Serviço do Google se aplicam."

## Resultado Esperado

- Badge do reCAPTCHA não será mais visível no canto da tela
- Erros de verificação serão exibidos de forma clara no formulário
- Experiência do usuário mais limpa e profissional
- Conformidade mantida com as políticas do Google
