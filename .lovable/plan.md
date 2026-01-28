
# Plano: Integração da Fila de Atendimento com Dados Reais

## Contexto do Problema

Atualmente, a página de Atendimento (`/atendimento`) usa **dados mock hardcoded**:
- A lista de conversas (`ConversationsList.tsx`) exibe 6 conversas fictícias fixas
- As mensagens (`ConversationView.tsx`) também são hardcoded
- Interações do agente de voz (ElevenLabs) não são registradas
- Reclamações do formulário público não aparecem para atendentes

O objetivo é criar uma **fila unificada** que receba:
1. Atendimentos por voz (ElevenLabs)
2. Reclamações/denúncias do formulário web
3. Futuramente: WhatsApp, email, chat web, telefone

---

## Arquitetura Proposta

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        FONTES DE ENTRADA                            │
├─────────────┬──────────────┬─────────────┬────────────┬────────────┤
│  Formulário │  Agente Voz  │  WhatsApp   │   Email    │  Chat Web  │
│    (Web)    │ (ElevenLabs) │  (futuro)   │  (futuro)  │  (futuro)  │
└──────┬──────┴──────┬───────┴──────┬──────┴─────┬──────┴──────┬─────┘
       │             │              │            │             │
       └─────────────┴──────────────┴────────────┴─────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │  Tabela: service_queue       │
                    │  (Nova tabela centralizada)  │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │  Página de Atendimento       │
                    │  /atendimento                │
                    │                              │
                    │  ┌─────────┐ ┌────────────┐  │
                    │  │ Lista   │ │ Conversa   │  │
                    │  │ Fila    │ │ Ativa      │  │
                    │  └─────────┘ └────────────┘  │
                    └──────────────────────────────┘
```

---

## Etapas de Implementação

### 1. Criar Tabela `service_queue` no Supabase

Nova tabela para centralizar todas as solicitações de atendimento:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Chave primária |
| `channel` | text | Canal de origem: 'web', 'voice', 'whatsapp', 'email', 'chat' |
| `status` | text | 'waiting', 'in_progress', 'completed', 'forwarded' |
| `priority` | int | 1-5 (1 = maior prioridade) |
| `customer_name` | text | Nome do cliente/solicitante |
| `customer_email` | text | Email (opcional) |
| `customer_phone` | text | Telefone (opcional) |
| `customer_avatar` | text | URL do avatar (opcional) |
| `subject` | text | Assunto/resumo curto |
| `last_message` | text | Última mensagem para preview |
| `unread_count` | int | Mensagens não lidas |
| `complaint_id` | uuid | FK para `complaints` (se veio do formulário) |
| `voice_session_id` | text | ID da sessão ElevenLabs (se veio por voz) |
| `assigned_to` | uuid | FK para atendente designado |
| `waiting_since` | timestamp | Quando entrou na fila |
| `created_at` | timestamp | Criação |
| `updated_at` | timestamp | Última atualização |

---

### 2. Modificar Formulário de Reclamações

**Arquivo:** `src/pages/ReclamacoesDenuncias.tsx`

Após criar a complaint, também inserir na `service_queue`:

```typescript
// Após inserir na complaints, inserir na fila
await supabase.from("service_queue").insert({
  channel: "web",
  status: "waiting",
  priority: 3, // Prioridade média
  customer_name: identificationData.isAnonymous ? "Anônimo" : identificationData.name,
  customer_email: identificationData.isAnonymous ? null : identificationData.email,
  customer_phone: identificationData.isAnonymous ? null : identificationData.phone,
  subject: `${detailsData.type}: ${detailsData.category}`,
  last_message: detailsData.description.substring(0, 100) + "...",
  complaint_id: complaintId,
  waiting_since: new Date().toISOString(),
});
```

---

### 3. Modificar Agente de Voz

**Arquivo:** `src/components/complaints/StepVoiceAgent.tsx`

Ao iniciar conversa com o agente, criar entrada na fila:

```typescript
// Após startSession do ElevenLabs
await supabase.from("service_queue").insert({
  channel: "voice",
  status: "in_progress", // Já está em atendimento com IA
  priority: 2, // Prioridade alta (atendimento ativo)
  customer_name: "Atendimento por Voz",
  subject: "Atendimento via Agente IA",
  voice_session_id: sessionId,
  waiting_since: new Date().toISOString(),
});
```

Ao encerrar conversa, atualizar status e criar complaint:

```typescript
// Após endSession
// 1. Criar complaint com dados coletados pelo agente
// 2. Atualizar service_queue com complaint_id e status
```

---

### 4. Criar Hook `useServiceQueue`

**Novo arquivo:** `src/hooks/useServiceQueue.ts`

Hook para gerenciar a fila de atendimento com React Query:

```typescript
export function useServiceQueue(filters?: QueueFilters) {
  return useQuery({
    queryKey: ["service-queue", filters],
    queryFn: async () => {
      let query = supabase
        .from("service_queue")
        .select("*")
        .order("waiting_since", { ascending: true }); // Mais antigo primeiro

      if (filters?.channel) {
        query = query.eq("channel", filters.channel);
      }
      if (filters?.status) {
        query = query.in("status", ["waiting", "in_progress"]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });
}
```

---

### 5. Refatorar `ConversationsList`

**Arquivo:** `src/components/omnichannel/ConversationsList.tsx`

Substituir dados mock por dados reais:

- Importar `useServiceQueue`
- Mapear canais para ícones corretos
- Usar `waiting_since` para ordenação e indicadores de tempo
- Atualização em tempo real via subscriptions do Supabase

---

### 6. Refatorar `ConversationView`

**Arquivo:** `src/components/omnichannel/ConversationView.tsx`

- Receber `queueItem` como prop em vez de apenas `conversationId`
- Buscar mensagens da tabela `service_messages` filtradas por `session_id`
- Exibir dados reais do cliente da fila
- Integrar envio de mensagens real

---

### 7. Configurar Realtime Subscriptions

Para atualizações em tempo real da fila:

```typescript
useEffect(() => {
  const channel = supabase
    .channel("service-queue-changes")
    .on("postgres_changes", 
      { event: "*", schema: "public", table: "service_queue" },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: ["service-queue"] });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

### 8. Adicionar Policies RLS

```sql
-- Atendentes podem ver todas as filas
CREATE POLICY "Attendants can view queue"
  ON service_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'attendant')
    )
  );

-- Atendentes podem atualizar itens da fila
CREATE POLICY "Attendants can update queue"
  ON service_queue FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'attendant')
    )
  );
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/XXXX_create_service_queue.sql` | Criar | Migração para nova tabela |
| `src/hooks/useServiceQueue.ts` | Criar | Hook para gerenciar fila |
| `src/components/omnichannel/ConversationsList.tsx` | Modificar | Usar dados reais |
| `src/components/omnichannel/ConversationView.tsx` | Modificar | Usar dados reais |
| `src/components/complaints/StepVoiceAgent.tsx` | Modificar | Registrar na fila |
| `src/pages/ReclamacoesDenuncias.tsx` | Modificar | Registrar na fila após submit |
| `src/pages/Atendimento.tsx` | Modificar | Integrar com useServiceQueue |
| `src/integrations/supabase/types.ts` | Atualizar | Regenerar tipos |

---

## Seção Técnica

### Estrutura do Tipo `ServiceQueueItem`

```typescript
type ServiceQueueItem = {
  id: string;
  channel: "web" | "voice" | "whatsapp" | "email" | "chat";
  status: "waiting" | "in_progress" | "completed" | "forwarded";
  priority: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_avatar: string | null;
  subject: string | null;
  last_message: string | null;
  unread_count: number;
  complaint_id: string | null;
  voice_session_id: string | null;
  assigned_to: string | null;
  waiting_since: string;
  created_at: string;
  updated_at: string;
};
```

### Mapeamento de Canais para Ícones

```typescript
const channelConfig = {
  web: { icon: FileText, color: "#7ae4ff", label: "Web" },
  voice: { icon: Phone, color: "#f5ff55", label: "Voz" },
  whatsapp: { icon: MessageSquare, color: "#25D366", label: "WhatsApp" },
  email: { icon: MailOpen, color: "#a18aff", label: "Email" },
  chat: { icon: MessageCircle, color: "#7ae4ff", label: "Chat" },
};
```

---

## Resultado Esperado

1. Ao enviar reclamação pelo formulário web, ela aparece automaticamente na fila de atendimento
2. Ao iniciar conversa por voz, a sessão aparece na fila em tempo real
3. Atendentes podem ver todas as solicitações pendentes ordenadas por tempo de espera
4. Indicadores visuais mostram o canal de origem (ícone colorido)
5. A fila atualiza automaticamente via realtime subscriptions
6. Futuras integrações (WhatsApp, email) seguem o mesmo padrão
