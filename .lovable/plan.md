
# Plano: Trocar reCAPTCHA Enterprise v3 para reCAPTCHA v2 com Checkbox

## Situacao Atual

O sistema usa reCAPTCHA Enterprise v3 (invisivel), que:
- Funciona em segundo plano sem interacao do usuario
- Exibe apenas um badge no canto da tela (nao interativo)
- Esta apresentando erro de rede (Status 0) nas requisicoes

## Solucao: Implementar reCAPTCHA v2 com Checkbox

Trocar para o reCAPTCHA v2 tradicional com checkbox "Nao sou um robo" que:
- Aparece como um widget visivel dentro do formulario
- Requer que o usuario marque antes de enviar
- E mais claro e intuitivo para o usuario

## Arquivos a Modificar

### 1. `src/index.css`
- Remover a regra CSS que oculta o badge `.grecaptcha-badge`

### 2. `src/components/complaints/StepConfirmation.tsx`
Mudancas principais:
- Trocar o script de `recaptcha/enterprise.js` para `recaptcha/api.js`
- Adicionar um container `<div>` onde o widget v2 sera renderizado
- Usar `grecaptcha.render()` para criar o checkbox
- Usar callbacks `callback` e `expired-callback` para gerenciar o token
- Posicionar o checkbox acima do botao "Enviar Solicitacao"

### 3. `supabase/functions/send-complaint-email/index.ts`
- Atualizar a validacao do backend para usar a API v2 do reCAPTCHA (se necessario)

## Detalhes Tecnicos

### Novo Codigo do Widget (StepConfirmation.tsx)

O componente tera:
1. Um `useRef` para o container do widget
2. Carregamento do script `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`
3. Renderizacao explicita com `grecaptcha.render(containerRef, { sitekey, callback, expired-callback })`
4. O token e obtido quando usuario marca o checkbox
5. Botao "Enviar" so fica habilitado apos checkbox marcado

### Layout do Widget

O checkbox aparecera:
- Centralizado horizontalmente
- Logo acima dos botoes de navegacao
- Com texto de protecao abaixo

## Requisito Importante

Para o reCAPTCHA v2 funcionar, e necessario ter uma **chave de site v2** registrada no Google reCAPTCHA Admin Console. A chave atual (`6LfT8VgsAAAAAOloUkq771fK5j5Ef3NhjasD6NDL`) e do tipo Enterprise.

**Opcoes:**
1. Usar a mesma chave se ela for do tipo "reCAPTCHA Enterprise com checkbox" (possivel mas menos comum)
2. Criar uma nova chave v2 no console do Google e atualizar o codigo

Vou implementar o codigo preparado para a chave atual, e se nao funcionar, sera necessario criar uma nova chave v2 no Google reCAPTCHA Admin.

## Resultado Esperado

- Widget de checkbox visivel e claro no formulario
- Usuario marca o checkbox antes de enviar
- Sem badges flutuantes no canto da tela
- Experiencia mais intuitiva e confiavel
