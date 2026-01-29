
## Diagnóstico: Erro na Client Tool do ElevenLabs

### Problema Identificado

O agente de voz (Max) está tentando registrar a reclamação, mas recebe erro. Através dos testes descobri que:

1. **Edge function `voice-agent-tools` funciona corretamente** - Teste manual retornou sucesso com protocolo `REC-2026-089262`
2. **Edge function `elevenlabs-conversation-token` funciona corretamente** - Retornou token válido
3. **O problema está na comunicação ElevenLabs → Client Tool → Edge Function**

### Causa Raiz Provável

O timeout de 5 segundos pode não ser suficiente quando consideramos:
- Latência para chamar a edge function do Supabase
- Processamento no banco de dados (insert em `complaints` + insert em `service_queue`)
- Retorno da resposta

Além disso, há um problema potencial no tratamento de erros: se a chamada falhar parcialmente, o agente recebe uma mensagem de erro mas não há logs detalhados para diagnóstico.

### Solução

Modificar o componente `StepVoiceAgent.tsx` para:

1. **Adicionar logs detalhados** em cada etapa da execução da client tool
2. **Capturar e logar erros de rede** específicos
3. **Adicionar tratamento de timeout explícito** com mensagem mais clara
4. **Melhorar o feedback de erro** para o usuário

```text
┌─────────────────────────────────────────────────────────────────────┐
│  FLUXO ATUAL (COM PROBLEMA)                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ElevenLabs chama createComplaint                                  │
│         │                                                           │
│         ▼                                                           │
│  Client Tool executa                                               │
│         │                                                           │
│         ▼                                                           │
│  supabase.functions.invoke (pode demorar >5s)                      │
│         │                                                           │
│         ▼                                                           │
│  TIMEOUT ElevenLabs (5s) ◄── Agente recebe erro                    │
│         │                                                           │
│         ▼                                                           │
│  Edge function pode completar depois mas resposta é perdida        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  FLUXO CORRIGIDO                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ElevenLabs chama createComplaint                                  │
│         │                                                           │
│         ▼                                                           │
│  Client Tool com logs detalhados e timeout interno                 │
│         │                                                           │
│         ▼                                                           │
│  Timeout ElevenLabs aumentado para 10-15s                          │
│         │                                                           │
│         ▼                                                           │
│  Resposta retornada antes do timeout ✓                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Alterações

**Arquivo: `src/components/complaints/StepVoiceAgent.tsx`**

Adicionar logs detalhados e melhor tratamento de erros:

```typescript
createComplaint: async (params: ComplaintParams) => {
  console.log("[VoiceAgent] createComplaint called at:", new Date().toISOString());
  console.log("[VoiceAgent] Params received:", JSON.stringify(params, null, 2));
  
  const startTime = Date.now();
  
  try {
    console.log("[VoiceAgent] Invoking voice-agent-tools...");
    
    const { data, error } = await supabase.functions.invoke(
      "voice-agent-tools",
      { body: { action: "createComplaint", data: params } }
    );

    const duration = Date.now() - startTime;
    console.log(`[VoiceAgent] Edge function responded in ${duration}ms`);
    
    if (error) {
      console.error("[VoiceAgent] Supabase invoke error:", error);
      console.error("[VoiceAgent] Error details:", JSON.stringify(error, null, 2));
      return "Desculpe, ocorreu um erro ao registrar sua solicitação. Por favor, tente novamente.";
    }

    console.log("[VoiceAgent] Response data:", JSON.stringify(data, null, 2));
    
    // ... resto do código
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`[VoiceAgent] Exception after ${duration}ms:`, err);
    console.error("[VoiceAgent] Error name:", (err as Error)?.name);
    console.error("[VoiceAgent] Error message:", (err as Error)?.message);
    return "Ocorreu um erro inesperado. Por favor, tente novamente.";
  }
}
```

### Ação Adicional Necessária (ElevenLabs Dashboard)

Aumentar o **Tempo limite de resposta** da ferramenta `createComplaint`:
- Valor atual: 5s
- Valor recomendado: **15 segundos** (para acomodar latência de rede + processamento)

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/complaints/StepVoiceAgent.tsx` | **Modificar** - Adicionar logs detalhados para debug |

### Como Testar

1. Após o deploy, faça uma nova conversa com o agente Max
2. Quando tentar registrar, observe os logs no console do navegador (F12 → Console)
3. Os logs mostrarão exatamente onde o erro está ocorrendo
4. Compartilhe os logs comigo para diagnóstico adicional se necessário
