

# Plano: Integrar Sistema de Reclamações/Denúncias com as Páginas Internas

## Situação Atual

A tabela `complaints` já existe no Supabase e está configurada para receber dados do formulário público em `/reclamacoes-denuncias`. Porém:

1. As páginas **Solicitações** e **Dashboard** usam dados hardcoded (mockados)
2. As políticas RLS usam uma função antiga `check_admin_access()` que verifica a tabela `admin_users`
3. Não há integração entre os dados salvos e as visualizações internas

## O Que Será Implementado

### 1. Atualizar Políticas RLS

Atualizar as políticas da tabela `complaints` para usar o novo sistema de roles:

- **Admins**: Podem ver, editar e deletar todas as solicitações
- **Atendentes**: Podem ver e editar solicitações atribuídas a eles
- **Público**: Pode criar novas solicitações (INSERT)

```text
┌──────────────────────┐     ┌─────────────────────────────┐
│   Formulário         │     │      Páginas Internas       │
│   Público            │     ├─────────────────────────────┤
│   /reclamacoes-      │────▶│  Admin: Vê todas            │
│   denuncias          │     │  Atendente: Vê atribuídas   │
│                      │     │                             │
│   (INSERT via RLS)   │     │  (SELECT/UPDATE via RLS)    │
└──────────────────────┘     └─────────────────────────────┘
```

### 2. Página Solicitações - Dados Reais

Refatorar `src/pages/Solicitacoes.tsx` para:

- Buscar dados da tabela `complaints` usando React Query
- Mostrar protocolo, tipo, categoria, status, prioridade
- Implementar filtros (por status, tipo, período)
- Permitir busca por protocolo ou descrição
- Adicionar modal de detalhes ao clicar em uma solicitação
- Permitir atribuir solicitação a um atendente
- Atualizar status (aberto, em_andamento, resolvido, fechado)

### 3. Dashboard - Métricas Reais

Atualizar os componentes de Dashboard para buscar dados reais:

| Componente | Métrica | Fonte |
|------------|---------|-------|
| StatCard | Total de Solicitações | COUNT(*) de complaints |
| StatCard | Resolvidas Hoje | COUNT onde status=resolvido e updated_at=hoje |
| ChannelMetrics | Distribuição por Tipo | GROUP BY type (reclamação, denúncia, sugestão) |
| ActiveConversations | Por Período | COUNT agrupado por hora/dia |

### 4. Criar Hook de Solicitações

Novo arquivo `src/hooks/useComplaints.ts`:

- `useComplaints()` - Listar solicitações com filtros
- `useComplaint(id)` - Detalhes de uma solicitação
- `useComplaintStats()` - Estatísticas para o Dashboard
- `useUpdateComplaint()` - Atualizar status/atribuição

### 5. Modal de Detalhes da Solicitação

Novo componente `src/components/complaints/ComplaintDetailModal.tsx`:

- Dados completos da solicitação
- Histórico de atualizações
- Anexos com preview
- Campo para notas internas
- Botões de ação (atribuir, mudar status)

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/useComplaints.ts` | Hook com queries para complaints |
| `src/components/complaints/ComplaintDetailModal.tsx` | Modal de detalhes |
| `src/components/complaints/ComplaintFilters.tsx` | Componente de filtros |
| `src/components/complaints/ComplaintStatusBadge.tsx` | Badge de status reutilizável |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Solicitacoes.tsx` | Integrar com banco de dados real |
| `src/pages/Dashboard.tsx` | Buscar métricas reais |
| `src/components/dashboard/StatCard.tsx` | Aceitar loading state |
| `src/components/dashboard/ChannelMetrics.tsx` | Dados da tabela complaints |
| `src/components/dashboard/ActiveConversations.tsx` | Dados por período |

## Migração de Banco de Dados

Atualizar políticas RLS:

```sql
-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins can view all complaints" ON complaints;
DROP POLICY IF EXISTS "Admins can update complaints" ON complaints;
DROP POLICY IF EXISTS "Admins can delete complaints" ON complaints;

-- Admins veem todas
CREATE POLICY "Admins can view all complaints"
ON complaints FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Atendentes veem as atribuídas a eles
CREATE POLICY "Attendants can view assigned complaints"
ON complaints FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'atendente') 
  AND assigned_to = auth.uid()
);

-- Admins podem atualizar todas
CREATE POLICY "Admins can update all complaints"
ON complaints FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Atendentes podem atualizar as atribuídas
CREATE POLICY "Attendants can update assigned complaints"
ON complaints FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'atendente') 
  AND assigned_to = auth.uid()
);
```

---

## Seção Técnica

### Estrutura do Hook useComplaints

```typescript
interface ComplaintFilters {
  status?: string;
  type?: string;
  category?: string;
  assignedTo?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

interface ComplaintStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  byType: { type: string; count: number }[];
  byCategory: { category: string; count: number }[];
}
```

### Mapeamento de Campos

| Campo BD | Campo UI | Descrição |
|----------|----------|-----------|
| protocol_number | Protocolo | Ex: REC-2026-000001 |
| type | Tipo | reclamacao, denuncia, sugestao |
| category | Categoria | atendimento, produto, servico... |
| status | Status | pending, in_progress, resolved, closed |
| created_at | Data | Data de criação |
| assigned_to | Responsável | UUID do atendente |
| reporter_name | Cliente | Nome ou "Anônimo" |

### Query para Estatísticas do Dashboard

```sql
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'pending') as open,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
  COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today
FROM complaints;
```

---

## Fluxo de Dados

```text
                      ┌─────────────────────────┐
                      │    Usuário Público      │
                      │    /reclamacoes-        │
                      │    denuncias            │
                      └───────────┬─────────────┘
                                  │ INSERT
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Tabela complaints                        │
│  ┌──────────┬──────────┬──────────┬───────────┬──────────┐  │
│  │ protocol │  type    │ status   │ assigned  │ created  │  │
│  │ REC-...  │ reclam.  │ pending  │   NULL    │ 2026-01  │  │
│  └──────────┴──────────┴──────────┴───────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
                                  │ SELECT (RLS)
                                  ▼
          ┌───────────────────────────────────────┐
          │                                       │
          ▼                                       ▼
┌─────────────────────┐              ┌─────────────────────┐
│     Dashboard       │              │    Solicitações     │
│  - Total: 45        │              │  - Lista completa   │
│  - Abertas: 12      │              │  - Filtros          │
│  - Resolvidas: 30   │              │  - Detalhes         │
└─────────────────────┘              └─────────────────────┘
```

