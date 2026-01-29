

## Badges de Notificação no Menu Lateral

Adicionar indicadores visuais (badges vermelhos com contagem) aos itens "Atendimento" e "Solicitações" no menu lateral para alertar o atendente sobre pendências.

### O Que Será Exibido

| Menu Item | Contagem Exibida |
|-----------|------------------|
| **Atendimento** | Total de itens na fila com status `waiting` (aguardando atendimento) |
| **Solicitações** | Total de complaints com status `pending` (pendentes) |

O badge só aparece quando a contagem for maior que zero.

### Visual do Badge

```text
┌─────────────────────────────┐
│  📝 Atendimento      [3]   │  ← Badge vermelho com número
│  📋 Solicitações     [12]  │  ← Badge vermelho com número
│  📖 Conteúdo               │  ← Sem badge (não tem pendências)
└─────────────────────────────┘
```

Quando o menu estiver colapsado, o badge aparece posicionado no canto superior direito do ícone.

### Arquivos a Modificar

**1. `src/components/layout/Sidebar.tsx`**

- Importar os hooks `useServiceQueue` e `useComplaintStats`
- Adicionar campo `badgeKey` no tipo `MenuItem` para identificar quais itens mostram badge
- Atualizar `SidebarItem` para receber prop `badgeCount`
- Renderizar badge vermelho quando `badgeCount > 0`

### Detalhes Técnicos

**Novo Hook de Contagem (opcional, mas recomendado):**

Criar `src/hooks/useMenuBadges.ts` para centralizar a lógica de contagem:

```typescript
export function useMenuBadges() {
  const { data: queueItems } = useServiceQueue({ 
    status: ["waiting"] 
  });
  const { data: stats } = useComplaintStats();
  
  return {
    atendimento: queueItems?.length ?? 0,
    solicitacoes: stats?.pending ?? 0,
  };
}
```

**Atualização do SidebarItem:**

```typescript
type SidebarItemProps = {
  to: string;
  icon: React.ElementType;
  text: string;
  active?: boolean;
  collapsed?: boolean;
  badgeCount?: number;  // Nova prop
};

const SidebarItem = ({ ..., badgeCount }: SidebarItemProps) => {
  return (
    <Link to={to} className="relative flex items-center ...">
      <div className="relative">
        <Icon size={20} />
        {badgeCount > 0 && collapsed && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white 
            text-[10px] font-bold rounded-full min-w-[16px] h-4 
            flex items-center justify-center px-1">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </div>
      {!collapsed && (
        <>
          <span>{text}</span>
          {badgeCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] 
              font-bold rounded-full min-w-[18px] h-[18px] 
              flex items-center justify-center px-1">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
        </>
      )}
    </Link>
  );
};
```

**Mapeamento no Sidebar:**

```typescript
const badgeCounts = useMenuBadges();

const getBadgeCount = (path: string): number => {
  switch (path) {
    case "/atendimento": return badgeCounts.atendimento;
    case "/solicitacoes": return badgeCounts.solicitacoes;
    default: return 0;
  }
};

// No render
{menuItems.map(item => (
  <SidebarItem 
    key={item.to} 
    badgeCount={getBadgeCount(item.path)}
    ...
  />
))}
```

### Comportamento em Tempo Real

- O hook `useServiceQueue` já possui **subscription realtime** para atualizar automaticamente quando novos atendimentos chegam
- O hook `useComplaintStats` atualiza a cada requisição da página
- Os badges refletem as contagens em tempo real

### Resumo das Alterações

| Arquivo | Ação |
|---------|------|
| `src/hooks/useMenuBadges.ts` | **Criar** - Hook para contagem de badges |
| `src/components/layout/Sidebar.tsx` | **Modificar** - Adicionar badges ao SidebarItem |

