
## Diagnóstico: Erro de Conexão com Agente de Voz ElevenLabs

### Problema Identificado

A conexão com o agente de voz está falhando com **erro 401 (Unauthorized)** da API do ElevenLabs. Isso significa que a chave de API configurada no Supabase está sendo rejeitada pela ElevenLabs.

```text
┌─────────────────────────────────────────────────────────────────┐
│                     FLUXO DO ERRO                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Usuário clica    ──►  Edge Function         ──►  ElevenLabs  │
│   "Iniciar"            elevenlabs-             API             │
│                        conversation-token                       │
│                              │                      │           │
│                              ▼                      ▼           │
│                    Envia ELEVENLABS_API_KEY   Retorna 401       │
│                              │                 UNAUTHORIZED     │
│                              ▼                      │           │
│                    ┌─────────────────┐              │           │
│                    │ Erro mostrado   │◄─────────────┘           │
│                    │ ao usuário      │                          │
│                    └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### Causa Raiz

A chave `ELEVENLABS_API_KEY` está configurada no projeto, porém a API do ElevenLabs está rejeitando essa chave. Possíveis causas:

| Causa | Verificação |
|-------|-------------|
| Chave copiada incorretamente | Verificar se há espaços ou caracteres extras |
| Chave expirada ou revogada | Verificar no painel ElevenLabs |
| Conta diferente | A chave deve ser da mesma conta que possui o agente |
| Limite de uso excedido | Verificar quota da conta ElevenLabs |

### Solução

Você precisa atualizar a chave de API do ElevenLabs nas configurações do projeto. Como a chave é gerenciada por um connector, siga estes passos:

**Passo 1: Obter uma nova chave válida**
1. Acesse https://elevenlabs.io/app/settings/api-keys
2. Gere uma nova chave de API ou copie a existente corretamente
3. Certifique-se de que a conta é a mesma que contém o agente `agent_2001kfzvc45yfwstqcvp7a43kc59`

**Passo 2: Atualizar a chave no Lovable**
Como a mensagem de secrets indica que `ELEVENLABS_API_KEY` é gerenciada por um connector, você deve:
1. Ir em **Settings → Connectors** no Lovable
2. Localizar a conexão do ElevenLabs
3. Atualizar com a nova chave de API

### Configuração das Client Tools (Verificação)

Depois que a conexão estiver funcionando, confirme que as ferramentas no painel do ElevenLabs estão configuradas assim:

| Configuração | Valor Esperado |
|--------------|----------------|
| **Tool Type** | Client |
| **Tool Name** | `createComplaint` (exatamente assim, case-sensitive) |
| **Wait for response** | Habilitado |

**Parâmetros da ferramenta `createComplaint`:**

| Identifier | Data Type | Required | Description |
|------------|-----------|----------|-------------|
| isAnonymous | Boolean | Sim | Se o usuário deseja permanecer anônimo |
| name | String | Não | Nome do usuário |
| email | String | Não | Email para contato |
| phone | String | Não | Telefone para contato |
| type | String | Sim | Tipo: Reclamação, Denúncia ou Sugestão |
| category | String | Sim | Categoria da manifestação |
| description | String | Sim | Descrição detalhada |
| location | String | Não | Local relacionado ao ocorrido |

**Parâmetros da ferramenta `transferToHuman`:**

| Identifier | Data Type | Required | Description |
|------------|-----------|----------|-------------|
| customerName | String | Sim | Nome do cliente |
| customerPhone | String | Não | Telefone do cliente |
| subject | String | Sim | Assunto da solicitação |

### Por que a solicitação não foi criada

Como a conexão inicial falhou (erro 401), a conversa com o agente nunca foi estabelecida. Sem a conversa, o agente não conseguiu coletar os dados e chamar a ferramenta `createComplaint` para gerar o protocolo.

### Próximos Passos

1. **Você** → Atualizar a chave de API do ElevenLabs (via connector)
2. **Você** → Testar novamente o atendimento por voz
3. **Confirmar** → O protocolo será gerado e aparecerá em Solicitações

### Nenhuma alteração de código necessária

O código está correto. O problema é apenas a autenticação da API. Após atualizar a chave, o fluxo funcionará:

```text
Usuário inicia conversa
       │
       ▼
Edge Function obtém token ✓
       │
       ▼
WebRTC conecta ao agente ✓
       │
       ▼
Agente coleta dados via voz ✓
       │
       ▼
Agente chama createComplaint ✓
       │
       ▼
Edge Function voice-agent-tools cria registro ✓
       │
       ▼
Protocolo gerado e exibido ✓
```
