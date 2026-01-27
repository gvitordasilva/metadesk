
# Plano: Adicionar Opção de Atendimento por Voz com ElevenLabs

## Resumo
Adicionar uma tela inicial no formulário de reclamações/denúncias onde o cliente pode escolher entre **atendimento por texto** (fluxo atual) ou **atendimento por voz** (usando o agente ElevenLabs já configurado).

## Arquitetura

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ReclamacoesDenuncias                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Step 0: StepChannelSelection (NOVO)                     │   │
│  │  ┌─────────────────┐    ┌─────────────────┐              │   │
│  │  │   📝 Texto      │    │   🎙️ Voz        │              │   │
│  │  │   Formulário    │    │   Agente IA     │              │   │
│  │  └────────┬────────┘    └────────┬────────┘              │   │
│  └───────────┼──────────────────────┼───────────────────────┘   │
│              │                      │                            │
│              ▼                      ▼                            │
│  ┌───────────────────┐   ┌───────────────────────────────────┐  │
│  │ Fluxo Texto       │   │ StepVoiceAgent (NOVO)             │  │
│  │ (Steps 1-4)       │   │ ┌─────────────────────────────┐   │  │
│  │ Identificação     │   │ │  ElevenLabs Conversational  │   │  │
│  │ Detalhes          │   │ │  Agent Widget               │   │  │
│  │ Anexos            │   │ │  (useConversation hook)     │   │  │
│  │ Confirmação       │   │ └─────────────────────────────┘   │  │
│  └───────────────────┘   └───────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Alterações

### 1. Criar Edge Function para Token do ElevenLabs
**Novo arquivo:** `supabase/functions/elevenlabs-conversation-token/index.ts`

Edge function que gera um token de conversação WebRTC para conectar ao agente ElevenLabs de forma segura, sem expor a API Key no frontend.

```typescript
// Busca token de: https://api.elevenlabs.io/v1/convai/conversation/token
// Usa ELEVENLABS_API_KEY do ambiente
// Retorna { token: string }
```

### 2. Criar Componente de Seleção de Canal
**Novo arquivo:** `src/components/complaints/StepChannelSelection.tsx`

Tela inicial com duas opções estilizadas:
- **Texto**: Ícone de formulário, descrição "Preencha o formulário passo a passo"
- **Voz**: Ícone de microfone, descrição "Converse com nossa IA por voz"

Ambas as opções terão cards clicáveis similares ao design do `StepIdentification`.

### 3. Criar Componente de Atendimento por Voz
**Novo arquivo:** `src/components/complaints/StepVoiceAgent.tsx`

Componente que integra com o ElevenLabs usando o hook `useConversation`:
- Botão para iniciar conversa (solicita permissão de microfone)
- Visualização do status da conexão
- Indicador de quando o agente está falando vs ouvindo
- Botão para encerrar conversa
- Opção de voltar para escolher texto

### 4. Atualizar Página Principal
**Arquivo:** `src/pages/ReclamacoesDenuncias.tsx`

Modificações:
- Adicionar estado `channel: 'text' | 'voice' | null`
- Step 0 = Seleção de canal (novo)
- Se `channel === 'text'`: fluxo atual (steps 1-4)
- Se `channel === 'voice'`: componente de voz
- Ajustar `TOTAL_STEPS` e `ProgressBar` condicionalmente

### 5. Instalar Dependência
**Pacote:** `@elevenlabs/react`

SDK oficial do ElevenLabs para React com o hook `useConversation`.

## Configuração Necessária

Você precisará fornecer o **Agent ID** do seu agente ElevenLabs para que eu possa configurar a conexão. O Agent ID pode ser encontrado no dashboard da ElevenLabs em **Conversational AI → Agents**.

## Fluxo do Usuário (Voz)

1. Cliente acessa `/reclamacoes-denuncias`
2. Vê tela de escolha: Texto ou Voz
3. Clica em "Voz"
4. Sistema solicita permissão de microfone
5. Conexão WebRTC é estabelecida com o agente ElevenLabs
6. Cliente conversa com o agente (que já tem o script configurado)
7. Ao finalizar, agente coleta os dados e registra a reclamação
8. Cliente vê tela de sucesso com protocolo

## Detalhes Técnicos

### Hook useConversation (ElevenLabs React SDK)
```typescript
const conversation = useConversation({
  onConnect: () => console.log("Conectado"),
  onDisconnect: () => console.log("Desconectado"),
  onMessage: (message) => console.log("Mensagem:", message),
  onError: (error) => console.error("Erro:", error),
});

// Iniciar
await conversation.startSession({
  conversationToken: token, // do edge function
  connectionType: "webrtc",
});

// Encerrar
await conversation.endSession();

// Estados disponíveis
conversation.status // 'connected' | 'disconnected'
conversation.isSpeaking // boolean
```

### Estrutura de Arquivos Final
```
src/components/complaints/
├── StepChannelSelection.tsx  (NOVO)
├── StepVoiceAgent.tsx        (NOVO)
├── StepIdentification.tsx
├── StepDetails.tsx
├── StepAttachments.tsx
├── StepConfirmation.tsx
├── SuccessScreen.tsx
└── ProgressBar.tsx

supabase/functions/
├── elevenlabs-conversation-token/
│   └── index.ts              (NOVO)
└── send-complaint-email/
    └── index.ts
```

## Resultado Esperado

Após a implementação, o cliente terá duas opções de atendimento:
1. **Texto**: Formulário tradicional em 4 etapas
2. **Voz**: Conversa interativa com o agente de IA da ElevenLabs

O agente de voz usará o script já configurado na plataforma ElevenLabs para coletar as informações da reclamação de forma conversacional.
