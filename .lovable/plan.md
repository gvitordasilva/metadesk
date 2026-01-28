
# Plano: Corrigir Redirecionamento Pós-Login por Role

## Problema Identificado

Após o login, o redirecionamento não está funcionando corretamente porque:

1. O `LoginPage` chama `getDefaultRoute()` **imediatamente** após `signIn()`
2. O `role` ainda não foi carregado (é assíncrono via `onAuthStateChange`)
3. Como `role` é `null`, `getDefaultRoute()` retorna `/login`

## Fluxo Atual (com bug)

```text
Login → signIn() → getDefaultRoute() [role=null] → /login (loop!)
```

## Solução

Modificar o `LoginPage` para navegar para `/` após o login bem-sucedido, delegando o redirecionamento baseado em role para o componente `RoleBasedRedirect` que já existe e funciona corretamente.

## Fluxo Corrigido

```text
Login → signIn() → navigate('/') → ProtectedRoute → RoleBasedRedirect
                                                         ↓
                                    [espera role carregar]
                                                         ↓
                                    admin → /dashboard
                                    atendente → /atendimento
```

---

## Alterações

### Arquivo: `src/components/auth/LoginPage.tsx`

**Mudança**: Após login bem-sucedido, navegar para `/` ao invés de usar `getDefaultRoute()` diretamente.

| Linha | Antes | Depois |
|-------|-------|--------|
| 50-51 | `const from = ...getDefaultRoute(); navigate(from, ...)` | `navigate('/', { replace: true })` |
| 25-26 | Mesma lógica no redirect de usuário já logado | `navigate('/', { replace: true })` |

**Código atualizado:**

```typescript
// Se já estiver logado, redirecionar para raiz (RoleBasedRedirect cuidará do resto)
if (user) {
  navigate('/', { replace: true });
  return null;
}

// ...

// Após login bem-sucedido
navigate('/', { replace: true });
```

---

## Resumo

| Componente | Responsabilidade |
|------------|------------------|
| `LoginPage` | Autentica e navega para `/` |
| `ProtectedRoute` (em `/`) | Verifica autenticação |
| `RoleBasedRedirect` | Espera role carregar e redireciona para rota correta |

---

## Resultado Esperado

- **Admin** → Login → `/dashboard`
- **Atendente** → Login → `/atendimento`
