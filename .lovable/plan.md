
# Plano: Aprimorar Layout da Pagina Reclamacoes e Denuncias

## Analise do Estado Atual

Apos examinar os arquivos, identifiquei os seguintes problemas visuais:

1. **Fundo branco puro**: A pagina usa `bg-background` que e branco (`#fff`)
2. **Icones amarelos em fundo claro**: Os icones de FileText e Mic usam `text-primary` (amarelo #f5ff55) que tem baixo contraste em fundos claros
3. **Cards sem destaque**: O Card principal nao se diferencia do fundo
4. **Header e Footer sem personalidade**: Fundos brancos sem diferenciacao visual

## Solucao Proposta

### 1. Fundo Geral com Gradiente Suave

Trocar o fundo branco puro por um gradiente cinza claro elegante:
- De: `bg-background` (branco)
- Para: `bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100`

### 2. Header com Identidade Visual Forte

Transformar o header em uma faixa com fundo escuro (similar ao sidebar):
- Fundo: `bg-metadesk-darkgray` (#232f3c)
- Logo: versao amarela para contraste
- Texto: branco para legibilidade

### 3. Icones com Cores Mais Sofisticadas

Substituir o amarelo puro nos icones por cores que funcionem melhor:
- Formulario Escrito: usar `text-metadesk-blue` (#7ae4ff) - azul vibrante
- Atendimento por Voz: usar `text-metadesk-purple` (#a18aff) - roxo elegante
- Backgrounds dos icones: gradientes sutis

### 4. Cards com Elevacao e Diferenciacao

O card principal ganhara:
- Sombra suave: `shadow-lg`
- Borda sutil: `border border-slate-200`
- Fundo branco para contrastar com o fundo cinza

### 5. Botoes de Selecao de Canal Aprimorados

Os botoes de "Formulario Escrito" e "Atendimento por Voz":
- Background com gradiente sutil no hover
- Bordas mais definidas
- Cores de destaque especificas para cada opcao

### 6. Footer Mais Discreto

- Fundo cinza muito claro para continuidade visual
- Texto em tom suave

## Arquivos a Modificar

### `src/pages/ReclamacoesDenuncias.tsx`
- Atualizar classes do container principal para usar gradiente de fundo
- Modificar o header para usar fundo escuro
- Ajustar o Card para ter sombra e borda
- Estilizar o footer

### `src/components/complaints/StepChannelSelection.tsx`
- Trocar cores dos icones de amarelo para azul/roxo
- Adicionar efeitos de hover mais sofisticados
- Melhorar o visual dos cards de selecao

### `src/components/complaints/ProgressBar.tsx`
- Ajustar cores da barra de progresso para harmonia com o novo tema

### `src/components/complaints/SuccessScreen.tsx`
- Ajustar cores do icone de sucesso para verde Metadesk

## Resultado Esperado

Uma pagina visualmente mais:
- **Confortavel**: Fundo cinza claro reduz fadiga visual
- **Profissional**: Header escuro transmite seriedade
- **Acessivel**: Icones coloridos com bom contraste
- **Elegante**: Sombras e gradientes sutis

## Paleta de Cores Utilizada

Seguindo a identidade Metadesk:
- `metadesk-darkgray`: #232f3c (header)
- `metadesk-yellow`: #f5ff55 (destaques em fundo escuro)
- `metadesk-blue`: #7ae4ff (icone formulario)
- `metadesk-purple`: #a18aff (icone voz)
- `metadesk-green`: #4deb92 (sucesso)
- Fundos: gradientes de slate-50 a slate-100
