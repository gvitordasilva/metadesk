

## Correção do Bug: Etapas Sobrescrevendo Dados

### Problema Identificado

O componente `SortableStep` usa `step.id` para identificar qual etapa atualizar, mas para etapas **novas** (ainda não salvas no banco), o `step.id` é `undefined`. Apenas o `tempId` existe para etapas novas.

Quando você edita uma etapa nova, a função `onUpdate(step.id, ...)` é chamada com `undefined`, e o `handleUpdateLocalStep` atualiza **todas** as etapas que têm `step.id === undefined` — ou seja, todas as etapas novas são modificadas simultaneamente.

### Causa Raiz

```text
SortableStep.tsx (linha 67):
────────────────────────────
onUpdate(step.id, { name: e.target.value })
         ↑
         └── Para etapas novas, step.id = undefined

WorkflowEditorModal.tsx (linha 131-132):
────────────────────────────────────────
(step.id === id || step.tempId === id) 
        ↑              ↑
        └── undefined  └── "temp-12345"

Resultado: step.id === undefined === undefined ✓ → TODAS etapas novas são atualizadas
```

### Solução

Modificar o `SortableStep` para usar o identificador correto:
- Para etapas existentes: usar `step.id`
- Para etapas novas: usar `step.tempId`

### Alterações

**Arquivo: `src/components/admin/SortableStep.tsx`**

1. Atualizar a interface para aceitar `tempId` como parte da prop `step`
2. Criar uma constante `stepId` que usa `step.id || step.tempId`
3. Usar esse `stepId` em todas as chamadas de `onUpdate` e `onDelete`
4. Usar `stepId` também no hook `useSortable`

**Mudanças específicas:**

| Local | Atual | Corrigido |
|-------|-------|-----------|
| Linha 37 | `useSortable({ id: step.id })` | `useSortable({ id: step.id \|\| (step as any).tempId })` |
| Linha 67 | `onUpdate(step.id, ...)` | `onUpdate(stepId, ...)` |
| Linha 75 | `onUpdate(step.id, ...)` | `onUpdate(stepId, ...)` |
| Linha 101 | `onUpdate(step.id, ...)` | `onUpdate(stepId, ...)` |
| Linha 113 | `onDelete(step.id)` | `onDelete(stepId)` |

### Código Corrigido

```typescript
interface LocalStep extends Partial<WorkflowStep> {
  tempId?: string;
  isNew?: boolean;
}

interface SortableStepProps {
  step: LocalStep;  // Alterado de WorkflowStep para LocalStep
  index: number;
  responsibles: WorkflowResponsible[];
  onUpdate: (id: string, updates: Partial<LocalStep>) => void;
  onDelete: (id: string) => void;
}

export function SortableStep({
  step,
  index,
  responsibles,
  onUpdate,
  onDelete,
}: SortableStepProps) {
  // Identificador único: usa id para etapas existentes ou tempId para novas
  const stepId = step.id || step.tempId || "";
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stepId });  // Usa stepId

  // ... resto do código usa stepId em vez de step.id
  
  <Input
    value={step.name || ""}
    onChange={(e) => onUpdate(stepId, { name: e.target.value })}
    ...
  />
}
```

### Resultado Esperado

Cada etapa manterá seus dados independentes:

```text
Antes (Bug):
────────────
Etapa 1: [Análise     ] ← digitar aqui
Etapa 2: [Análise     ] ← também muda!
Etapa 3: [Análise     ] ← também muda!

Depois (Corrigido):
───────────────────
Etapa 1: [Análise     ] ← digitar aqui
Etapa 2: [Revisão     ] ← mantém valor
Etapa 3: [Aprovação   ] ← mantém valor
```

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/admin/SortableStep.tsx` | **Modificar** - Usar identificador correto (id ou tempId) |

