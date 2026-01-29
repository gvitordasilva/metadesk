
## Correção: Incompatibilidade de Status entre Frontend e Banco de Dados

### Problema Identificado

Confirmei através de testes que:

1. **Edge functions funcionam corretamente** - O teste manual criou o registro `REC-2026-513550` com sucesso
2. **Dados estão no banco** - A reclamação existe na tabela `complaints` com `status: 'novo'`
3. **O agente do ElevenLabs NÃO está chamando a ferramenta** - Não há logs da edge function `voice-agent-tools` sendo chamada durante sua conversa

### Diagnóstico em Duas Partes

```text
┌─────────────────────────────────────────────────────────────────────┐
│  PROBLEMA 1: Agente ElevenLabs não chama a ferramenta              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Conversa com Max (ElevenLabs)                                     │
│         │                                                           │
│         ▼                                                           │
│  Coleta dados via voz                                              │
│         │                                                           │
│         ▼                                                           │
│  NÃO CHAMA createComplaint ◄── Configuração da Client Tool        │
│         │                       no painel ElevenLabs               │
│         ▼                                                           │
│  Encerra conversa sem protocolo                                    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  PROBLEMA 2: Frontend usa status errados (inglês vs português)     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  useComplaintStats:                                                │
│    pending: status === "pending"    ← ERRADO                       │
│    in_progress: status === "in_progress"  ← ERRADO                 │
│                                                                     │
│  Banco de dados (constraint):                                      │
│    status IN ('novo', 'em_analise', 'resolvido', 'fechado')        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Solução

#### Parte 1: Correção do Frontend (src/hooks/useComplaints.ts)

Atualizar o hook para usar os status corretos em português:

| Status no Código | Status Correto |
|------------------|----------------|
| `pending` | `novo` |
| `in_progress` | `em_analise` |
| `resolved` | `resolvido` |
| `closed` | `fechado` |

**Alterações necessárias:**
- Linhas 34-39: Atualizar `statusLabels` para usar chaves em português
- Linhas 112-116: Atualizar filtros em `useComplaintStats` para usar status em português

#### Parte 2: Configuração do ElevenLabs (Ação Manual)

A ferramenta `createComplaint` precisa ser configurada corretamente no painel do ElevenLabs para que o agente a chame. Verifique:

| Configuração | Valor Esperado |
|--------------|----------------|
| **Tool Type** | Client (não Server/Webhook) |
| **Tool Name** | `createComplaint` (exatamente assim) |
| **Wait for response** | Habilitado |
| **Descrição** | Instrução clara para o agente saber quando usar |

**Parâmetros obrigatórios:**

```text
isAnonymous (boolean): Se a pessoa quer ficar anônima
type (string): Tipo - Reclamação, Denúncia ou Sugestão  
category (string): Categoria do problema
description (string): Descrição detalhada
```

**Parâmetros opcionais:**
```text
name (string): Nome do solicitante
email (string): Email para contato
phone (string): Telefone
location (string): Local do ocorrido
```

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useComplaints.ts` | **Modificar** - Corrigir mapeamento de status |

### Resultado Esperado

Após as correções:

1. **Contadores do Dashboard** mostrarão os valores corretos
2. **Lista de Solicitações** exibirá os badges de status corretos
3. **Agente de voz** (após configuração no ElevenLabs) criará registros automaticamente
