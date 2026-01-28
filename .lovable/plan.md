
# Plano: Sistema Avancado de Atendimento

## Visao Geral

Transformar a pagina de Atendimento (`/atendimento`) em um sistema completo de atendimento omnichannel com ordenacao por tempo de espera, ferramentas avancadas de conversa, mensagens pre-definidas, encaminhamento inteligente com IA, e analise de sentimento do cliente.

---

## Estrutura da Pagina

```text
+------------------+--------------------------------+--------------------+
|                  |                                |                    |
|   LISTA DE       |      AREA DE CONVERSA          |   PAINEL DO CASO   |
|   CONVERSAS      |                                |                    |
|                  |  - Chat / Documentos / Msgs    |  - Tempo de atend. |
|   Ordenado por   |  - Encaminhamento com IA       |  - Resumo do caso  |
|   tempo espera   |                                |  - Sentimento      |
|   (maior p/      |                                |  - Dados cliente   |
|    menor)        |                                |                    |
|                  |                                |                    |
+------------------+--------------------------------+--------------------+
```

---

## O Que Sera Implementado

### 1. Lista de Conversas (Esquerda) - Ordenacao Inteligente

| Melhoria | Descricao |
|----------|-----------|
| Ordenacao por tempo | Conversas ordenadas por tempo de espera (maior tempo no topo) |
| Indicador visual | Mostra o tempo aguardando (ex: "5min", "2h") |
| Cores de urgencia | Verde (ate 5min), Amarelo (5-15min), Vermelho (mais de 15min) |
| Inicio automatico | Ao selecionar conversa, inicia contador de tempo |

### 2. Area de Conversa (Centro) - Barra de Ferramentas

| Botao | Funcao |
|-------|--------|
| Chat | Modo padrao de conversa (atual) |
| Documentos | Abre painel para consultar/anexar documentos do caso |
| Mensagens Rapidas | Painel com mensagens pre-definidas para inserir |
| Encaminhar | Abre modal de encaminhamento inteligente usando os fluxos ja criados |

### 3. Painel do Caso (Direita) - Substituir ContentSidebar

| Secao | Conteudo |
|-------|----------|
| Tempo de Atendimento | Cronometro iniciado ao selecionar conversa |
| Indicador de Sentimento | Emoji/cor mostrando emocao detectada do cliente |
| Resumo do Caso | Protocolo, tipo, categoria, descricao |
| Dados do Cliente | Nome, email, telefone, CPF, endereco |
| Anexos | Arquivos enviados pelo cliente |
| Historico | Timeline de interacoes anteriores |

---

## Estrutura de Banco de Dados

### Nova Tabela: `quick_messages` (Mensagens Pre-definidas)

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID | Identificador unico |
| title | TEXT | Titulo da mensagem |
| content | TEXT | Conteudo da mensagem |
| category | TEXT | Categoria (saudacao, encerramento, procedimento) |
| shortcut | TEXT | Atalho de teclado opcional |
| is_active | BOOLEAN | Se esta ativa |
| created_by | UUID | Usuario que criou |
| created_at | TIMESTAMP | Data de criacao |

### Nova Tabela: `service_sessions` (Sessoes de Atendimento)

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID | Identificador unico |
| complaint_id | UUID | Referencia a complaint (nullable para conversas gerais) |
| conversation_id | TEXT | ID da conversa (mock por enquanto) |
| attendant_id | UUID | Usuario atendente |
| started_at | TIMESTAMP | Inicio do atendimento |
| ended_at | TIMESTAMP | Fim do atendimento |
| duration_seconds | INTEGER | Duracao calculada |
| ai_summary | TEXT | Resumo gerado pela IA |
| ai_sentiment | TEXT | Sentimento detectado |
| forwarded_to_step_id | UUID | Etapa do fluxo para encaminhamento |
| forward_notes | TEXT | Observacoes do encaminhamento |
| status | TEXT | Status (active, completed, forwarded) |

### Nova Tabela: `service_messages` (Mensagens da Sessao)

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID | Identificador unico |
| session_id | UUID | Referencia a service_sessions |
| sender_type | TEXT | Tipo (client, agent, system) |
| content | TEXT | Conteudo da mensagem |
| metadata | JSONB | Metadados extras |
| created_at | TIMESTAMP | Data de envio |

### Alteracoes na Tabela `complaints`

Adicionar campos:
- `waiting_since` TIMESTAMP: Quando entrou na fila de espera
- `last_sentiment` TEXT: Ultimo sentimento detectado
- `current_workflow_step_id` UUID: Etapa atual do fluxo

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useServiceSession.ts` | Hook para gerenciar sessao de atendimento |
| `src/hooks/useQuickMessages.ts` | Hook para mensagens pre-definidas |
| `src/components/omnichannel/CaseInfoPanel.tsx` | Painel de informacoes do caso (substitui ContentSidebar) |
| `src/components/omnichannel/QuickMessagesPanel.tsx` | Painel flutuante de mensagens rapidas |
| `src/components/omnichannel/ForwardModal.tsx` | Modal de encaminhamento com selecao de fluxo/etapa |
| `src/components/omnichannel/DocumentsPanel.tsx` | Painel de documentos do caso |
| `src/components/omnichannel/ServiceTimer.tsx` | Componente de cronometro de atendimento |
| `src/components/omnichannel/SentimentIndicator.tsx` | Indicador visual de sentimento |
| `src/components/omnichannel/WaitingTimeIndicator.tsx` | Indicador de tempo de espera com cores |
| `src/components/omnichannel/ConversationToolbar.tsx` | Barra de ferramentas da area de conversa |
| `supabase/functions/analyze-sentiment/index.ts` | Edge function para analise de sentimento |
| `supabase/functions/generate-summary/index.ts` | Edge function para gerar resumo via IA |

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Atendimento.tsx` | Substituir ContentSidebar por CaseInfoPanel, passar dados da sessao |
| `src/components/omnichannel/ConversationsList.tsx` | Ordenar por tempo de espera, adicionar indicadores visuais |
| `src/components/omnichannel/ConversationView.tsx` | Adicionar toolbar com botoes de documentos, mensagens rapidas, encaminhamento |

---

## Fluxo de Atendimento

```text
1. Atendente abre /atendimento
         |
         v
2. Ve lista de conversas ordenadas por tempo de espera
   [Cliente A - 25min] <- vermelho, prioridade
   [Cliente B - 8min]  <- amarelo
   [Cliente C - 2min]  <- verde
         |
         v
3. Seleciona Cliente A
   - Inicia cronometro de atendimento
   - Carrega painel do caso (direita)
   - Mostra sentimento detectado
         |
         v
4. Conduz atendimento
   - Usa chat normal
   - Consulta documentos
   - Usa mensagens pre-definidas
         |
         v
5. Resolve ou Encaminha
   a) RESOLVER: Encerra sessao, salva tempo
   b) ENCAMINHAR:
      - Seleciona fluxo de trabalho
      - Escolhe etapa destino
      - IA gera resumo automatico
      - Adiciona observacoes
      - Salva historico no caso
```

---

## Secao Tecnica

### Hook useServiceSession

```typescript
// Funcoes do hook
startSession(conversationId): inicia sessao de atendimento
endSession(): finaliza sessao e calcula duracao
forwardToStep(stepId, notes): encaminha para etapa do fluxo
getCurrentSession(): retorna sessao ativa
```

### Indicador de Tempo de Espera

```typescript
// Logica de cores
const getWaitingColor = (minutes: number) => {
  if (minutes <= 5) return "text-green-500";   // Verde
  if (minutes <= 15) return "text-yellow-500"; // Amarelo
  return "text-red-500";                        // Vermelho
};

// Formatacao
const formatWaitingTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
};
```

### Integracao com Fluxos de Trabalho

O modal de encaminhamento usara os fluxos ja criados:
1. Busca fluxos ativos com `useWorkflows()`
2. Usuario seleciona o fluxo adequado ao tipo do caso
3. Exibe etapas do fluxo com responsaveis
4. Usuario seleciona etapa destino
5. Sistema registra encaminhamento

### Edge Functions para IA

**analyze-sentiment**: Recebe texto das mensagens e retorna classificacao (positive, neutral, frustrated, angry)

**generate-summary**: Recebe historico da conversa e retorna resumo estruturado com problema, acao tomada e resultado

---

## Dados Mock Iniciais

Para demonstracao, as conversas terao campo `waiting_since` simulado:
- Maria Oliveira: 25 minutos (vermelho)
- Joao Silva: 8 minutos (amarelo)
- Ana Costa: 2 minutos (verde)

---

## Proximos Passos Apos Implementacao

1. Pagina de administracao para gerenciar mensagens pre-definidas
2. Dashboard com metricas de tempo de atendimento
3. Relatorios de encaminhamentos por fluxo/etapa
4. Integracao real com canais (WhatsApp, Email, etc.)
