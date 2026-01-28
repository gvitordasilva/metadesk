
# Plano: Sistema de Gestao de Fluxos de Trabalho

## Visao Geral

Criar um sistema completo de gestao de fluxos de trabalho na aba "Estrutura" da pagina de Administracao, permitindo cadastrar responsaveis e definir fluxos com etapas reorganizaveis via drag-and-drop.

---

## O Que Sera Implementado

### 1. Cadastro de Responsaveis

Formulario para registrar pessoas que podem receber encaminhamentos:

| Campo | Tipo | Descricao |
|-------|------|-----------|
| Nome | Texto | Nome completo do responsavel |
| Cargo | Texto | Ex: Coordenador, Gerente, Analista |
| Setor | Texto | Ex: Financeiro, Juridico, RH |
| Email | Email | Email corporativo |
| Telefone | Telefone | Contato direto |
| Ativo | Boolean | Se esta disponivel para receber demandas |

### 2. Gestao de Fluxos de Trabalho

Cada fluxo de trabalho representa um caminho que uma solicitacao pode seguir:

| Campo | Descricao |
|-------|-----------|
| Nome | Ex: "Fluxo de Reclamacoes", "Fluxo de Denuncias" |
| Descricao | Objetivo do fluxo |
| Tipo | reclamacao, denuncia, sugestao (para vincular automaticamente) |
| Etapas | Lista ordenada de passos |

### 3. Etapas do Fluxo (Drag and Drop)

Cada etapa define um passo no processo:

| Campo | Descricao |
|-------|-----------|
| Nome | Ex: "Triagem Inicial", "Analise Tecnica" |
| Responsavel | Pessoa designada para esta etapa |
| Prazo (dias) | SLA esperado |
| Ordem | Posicao no fluxo (ajustavel via drag-and-drop) |

---

## Interface Visual

```text
+---------------------------------------------------------------+
|  FLUXOS DE TRABALHO                            [+ Novo Fluxo] |
+---------------------------------------------------------------+
|                                                               |
|  +------------------+  +------------------+  +---------------+ |
|  | Fluxo Reclamacoes|  | Fluxo Denuncias  |  | Fluxo Sugestoes|
|  | 5 etapas         |  | 4 etapas         |  | 3 etapas      | |
|  | [Editar]         |  | [Editar]         |  | [Editar]      | |
|  +------------------+  +------------------+  +---------------+ |
|                                                               |
+---------------------------------------------------------------+
|  RESPONSAVEIS                          [+ Novo Responsavel]  |
+---------------------------------------------------------------+
|  Nome           | Cargo       | Setor      | Email | Telefone |
|  Maria Silva    | Coord.      | Financeiro | ...   | ...      |
|  Joao Santos    | Gerente     | Juridico   | ...   | ...      |
+---------------------------------------------------------------+
```

### Editor de Fluxo (Modal)

```text
+---------------------------------------------------------------+
|  Editar Fluxo: Reclamacoes                              [X]  |
+---------------------------------------------------------------+
|  Nome: [Fluxo de Reclamacoes________________]                 |
|  Tipo: [Reclamacao v]                                         |
|                                                               |
|  ETAPAS (arraste para reordenar):                            |
|  +-----------------------------------------------------------+|
|  | [=] 1. Triagem Inicial      | Maria Silva | 1 dia   [x]  ||
|  +-----------------------------------------------------------+|
|  | [=] 2. Analise Tecnica      | Joao Santos | 3 dias  [x]  ||
|  +-----------------------------------------------------------+|
|  | [=] 3. Parecer Juridico     | Ana Costa   | 5 dias  [x]  ||
|  +-----------------------------------------------------------+|
|  | [=] 4. Resolucao Final      | Pedro Lima  | 2 dias  [x]  ||
|  +-----------------------------------------------------------+|
|                                                               |
|  [+ Adicionar Etapa]                                         |
|                                                               |
|  [Cancelar]                                [Salvar Fluxo]    |
+---------------------------------------------------------------+
```

---

## Estrutura de Banco de Dados

### Tabela: `workflow_responsibles` (Responsaveis)

```sql
CREATE TABLE workflow_responsibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,        -- cargo
  department TEXT NOT NULL,      -- setor
  email TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabela: `workflows` (Fluxos de Trabalho)

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT,            -- reclamacao, denuncia, sugestao
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabela: `workflow_steps` (Etapas do Fluxo)

```sql
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  responsible_id UUID REFERENCES workflow_responsibles(id),
  sla_days INTEGER DEFAULT 1,
  step_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Politicas RLS

```sql
-- Apenas admins podem gerenciar fluxos
CREATE POLICY "Admins can manage workflows"
ON workflows FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage workflow_steps"
ON workflow_steps FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage workflow_responsibles"
ON workflow_responsibles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Atendentes podem visualizar para encaminhamentos
CREATE POLICY "Attendants can view workflows"
ON workflows FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'atendente'));

CREATE POLICY "Attendants can view workflow_steps"
ON workflow_steps FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'atendente'));

CREATE POLICY "Attendants can view workflow_responsibles"
ON workflow_responsibles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'atendente'));
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useWorkflows.ts` | Hook com queries para fluxos e responsaveis |
| `src/components/admin/WorkflowManager.tsx` | Componente principal da aba Estrutura |
| `src/components/admin/ResponsiblesList.tsx` | Tabela de responsaveis com CRUD |
| `src/components/admin/ResponsibleModal.tsx` | Modal para criar/editar responsavel |
| `src/components/admin/WorkflowsList.tsx` | Cards dos fluxos existentes |
| `src/components/admin/WorkflowEditorModal.tsx` | Modal com editor drag-and-drop |
| `src/components/admin/SortableStep.tsx` | Componente de etapa arrastavel |

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Administracao.tsx` | Substituir conteudo da aba Estrutura |
| `package.json` | Adicionar `@dnd-kit/core` e `@dnd-kit/sortable` |

---

## Dependencia: @dnd-kit

Sera instalada a biblioteca `@dnd-kit` para implementar o drag-and-drop:

```json
"@dnd-kit/core": "^6.1.0",
"@dnd-kit/sortable": "^8.0.0",
"@dnd-kit/utilities": "^3.2.2"
```

Esta biblioteca e moderna, acessivel e integra bem com React.

---

## Secao Tecnica

### Estrutura do Hook useWorkflows

```typescript
// Responsaveis
useWorkflowResponsibles(): lista de responsaveis
useCreateResponsible(): criar novo
useUpdateResponsible(): editar
useDeleteResponsible(): remover

// Fluxos
useWorkflows(): lista de fluxos
useWorkflow(id): detalhes com etapas
useCreateWorkflow(): criar fluxo
useUpdateWorkflow(): atualizar fluxo
useDeleteWorkflow(): remover fluxo

// Etapas
useCreateStep(): adicionar etapa
useUpdateStep(): editar etapa
useDeleteStep(): remover etapa
useReorderSteps(): reordenar etapas (drag-drop)
```

### Logica de Reordenacao

Ao soltar uma etapa em nova posicao:

```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  
  if (active.id !== over?.id) {
    const oldIndex = steps.findIndex(s => s.id === active.id);
    const newIndex = steps.findIndex(s => s.id === over.id);
    
    const reordered = arrayMove(steps, oldIndex, newIndex);
    
    // Atualiza step_order de cada etapa
    await Promise.all(reordered.map((step, index) => 
      updateStep({ id: step.id, step_order: index + 1 })
    ));
  }
};
```

### Vinculo com Encaminhamentos

Quando um atendente encaminha uma solicitacao:

1. Sistema identifica o tipo (reclamacao, denuncia, etc.)
2. Busca o fluxo ativo para aquele tipo
3. Apresenta as etapas disponiveis para encaminhar
4. Registra para qual etapa/responsavel foi encaminhado

---

## Fluxo de Uso

```text
1. Admin acessa Administracao > Estrutura
         |
         v
2. Cadastra Responsaveis (pessoas que receberao demandas)
   - Maria Silva, Coordenadora, Financeiro
   - Joao Santos, Gerente, Juridico
         |
         v
3. Cria Fluxo de Trabalho
   - Nome: "Fluxo de Reclamacoes"
   - Tipo: Reclamacao
         |
         v
4. Adiciona Etapas ao Fluxo
   - 1. Triagem (Maria, 1 dia)
   - 2. Analise (Joao, 3 dias)
         |
         v
5. Reordena etapas arrastando
         |
         v
6. Salva Fluxo
         |
         v
7. Atendente ao encaminhar ve opcoes do fluxo
```

---

## Proxima Etapa

Apos implementar o sistema de fluxos, sera possivel integrar com a funcionalidade de encaminhamento na pagina de Atendimento, onde o atendente podera selecionar para qual etapa/responsavel enviar a solicitacao.
