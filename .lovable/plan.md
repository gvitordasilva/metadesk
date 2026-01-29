

## Integração do Agente de Voz com Sistema de Solicitações e Atendimento

Implementar a integração completa do agente de voz ElevenLabs para que:
1. **Registre solicitações** automaticamente na tabela `complaints` com geração de protocolo
2. **Encaminhe para atendimento humano** quando solicitado, criando entrada na fila `service_queue`

### Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     FLUXO DO AGENTE DE VOZ                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Usuário fala    ──►   Agente ElevenLabs   ──►   Client Tool      │
│                              │                         │            │
│                              ▼                         ▼            │
│                    ┌─────────────────┐       ┌───────────────────┐  │
│                    │ Coleta dados:   │       │ Edge Function:    │  │
│                    │ - Nome          │       │ voice-agent-tools │  │
│                    │ - Tipo          │       └─────────┬─────────┘  │
│                    │ - Categoria     │                 │            │
│                    │ - Descrição     │                 ▼            │
│                    │ - Email/Tel     │       ┌───────────────────┐  │
│                    └─────────────────┘       │ Ações no Supabase │  │
│                                              │ - complaints      │  │
│                                              │ - service_queue   │  │
│                                              │ - Gera protocolo  │  │
│                                              └───────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Componentes a Implementar

#### 1. Nova Edge Function: `voice-agent-tools`

Centraliza as ações que o agente de voz pode executar:

| Ação | Descrição | Retorno |
|------|-----------|---------|
| `createComplaint` | Cria nova solicitação com dados coletados | Protocolo gerado |
| `transferToHuman` | Transfere para fila de atendimento humano | ID da fila |
| `lookupProtocol` | Consulta status de protocolo existente | Dados da solicitação |

#### 2. Atualização do Componente `StepVoiceAgent.tsx`

- Adicionar **client tools** ao hook `useConversation`
- Exibir **tela de sucesso** com protocolo quando solicitação for criada
- Exibir **mensagem de transferência** quando encaminhar para humano

#### 3. Configuração no ElevenLabs (Manual)

O agente precisa ser configurado na interface do ElevenLabs com:
- Prompt atualizado para coletar dados estruturados
- Definição dos client tools disponíveis

---

### Detalhes Técnicos

#### Edge Function `voice-agent-tools`

**Arquivo:** `supabase/functions/voice-agent-tools/index.ts`

```typescript
// Endpoint: POST /voice-agent-tools
// Body: { action: string, data: object }

// Ação: createComplaint
// Dados esperados:
{
  action: "createComplaint",
  data: {
    isAnonymous: boolean,
    name?: string,
    email?: string,
    phone?: string,
    type: string,           // "Reclamação" | "Denúncia" | "Sugestão"
    category: string,       // Categoria específica
    description: string,    // Descrição coletada por voz
    location?: string
  }
}

// Retorno:
{
  success: true,
  protocolNumber: "REC-2026-000123",
  complaintId: "uuid",
  message: "Solicitação registrada com sucesso"
}

// Ação: transferToHuman
// Dados esperados:
{
  action: "transferToHuman",
  data: {
    customerName: string,
    customerPhone?: string,
    subject: string,
    voiceSessionId: string
  }
}

// Retorno:
{
  success: true,
  queueId: "uuid",
  message: "Transferido para atendimento humano"
}
```

#### Atualização do `StepVoiceAgent.tsx`

```typescript
const conversation = useConversation({
  clientTools: {
    // Criar nova solicitação
    createComplaint: async (params: ComplaintParams) => {
      const { data, error } = await supabase.functions.invoke(
        "voice-agent-tools",
        { body: { action: "createComplaint", data: params } }
      );
      
      if (data?.success) {
        setProtocolNumber(data.protocolNumber);
        setShowSuccess(true);
      }
      
      return data?.protocolNumber 
        ? `Protocolo ${data.protocolNumber} gerado com sucesso`
        : "Erro ao criar solicitação";
    },
    
    // Transferir para humano
    transferToHuman: async (params: TransferParams) => {
      const { data, error } = await supabase.functions.invoke(
        "voice-agent-tools",
        { body: { action: "transferToHuman", data: params } }
      );
      
      if (data?.success) {
        setTransferredToHuman(true);
      }
      
      return data?.success 
        ? "Você será atendido por um de nossos atendentes em breve"
        : "Erro ao transferir";
    }
  },
  
  onMessage: (message) => {
    // Capturar transcripts para histórico
  },
  
  // ... outros handlers
});
```

#### Novos Estados no Componente

```typescript
const [protocolNumber, setProtocolNumber] = useState<string | null>(null);
const [showSuccess, setShowSuccess] = useState(false);
const [transferredToHuman, setTransferredToHuman] = useState(false);
```

#### Nova UI de Sucesso (dentro do componente)

Quando `showSuccess` for true, exibir:
- Número do protocolo
- Botão para copiar
- Opção de nova solicitação

Quando `transferredToHuman` for true, exibir:
- Mensagem de aguardo
- Indicador de posição na fila

---

### Configuração Necessária no ElevenLabs

Você precisará acessar o painel do ElevenLabs e configurar o agente com ID `agent_2001kfzvc45yfwstqcvp7a43kc59`:

**1. Atualizar o Prompt do Agente:**

```text
Você é um assistente de atendimento da Metadesk. Sua função é:

1. Coletar informações para registrar reclamações, denúncias ou sugestões
2. Transferir o usuário para um atendente humano quando solicitado

Ao coletar uma manifestação, obtenha:
- Se deseja ser anônimo ou identificar-se
- Se identificado: nome, email ou telefone
- Tipo: Reclamação, Denúncia ou Sugestão
- Categoria específica
- Descrição detalhada do ocorrido
- Local (se aplicável)

Quando tiver todas as informações, chame a ferramenta createComplaint.
Se o usuário pedir para falar com um humano, chame transferToHuman.
```

**2. Definir os Client Tools:**

No painel do ElevenLabs, adicionar as ferramentas:

| Tool Name | Description |
|-----------|-------------|
| `createComplaint` | Registra a manifestação no sistema e gera protocolo |
| `transferToHuman` | Transfere a conversa para a fila de atendimento humano |

**3. Parâmetros das Tools:**

```json
// createComplaint
{
  "isAnonymous": { "type": "boolean" },
  "name": { "type": "string", "optional": true },
  "email": { "type": "string", "optional": true },
  "phone": { "type": "string", "optional": true },
  "type": { "type": "string", "enum": ["Reclamação", "Denúncia", "Sugestão"] },
  "category": { "type": "string" },
  "description": { "type": "string" },
  "location": { "type": "string", "optional": true }
}

// transferToHuman
{
  "customerName": { "type": "string" },
  "customerPhone": { "type": "string", "optional": true },
  "subject": { "type": "string" }
}
```

---

### Resumo dos Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/voice-agent-tools/index.ts` | **Criar** - Edge function para ações do agente |
| `src/components/complaints/StepVoiceAgent.tsx` | **Modificar** - Adicionar client tools e telas de resultado |

### Fluxo Completo

```text
Cenário 1: Criar Solicitação
─────────────────────────────
1. Usuário inicia conversa por voz
2. Agente coleta: tipo, categoria, descrição, identificação
3. Agente chama clientTool "createComplaint"
4. Edge function gera protocolo e insere em complaints + service_queue
5. Componente exibe tela de sucesso com protocolo
6. Badge vermelho aparece em Solicitações no menu

Cenário 2: Transferência para Humano
────────────────────────────────────
1. Usuário pede para falar com atendente
2. Agente chama clientTool "transferToHuman"
3. Edge function insere na service_queue com status "waiting"
4. Componente exibe mensagem de transferência
5. Badge vermelho aparece em Atendimento no menu
6. Atendente visualiza na fila e assume a conversa
```

