
# Plano: Sistema de Controle de Acesso por Roles (Atendente e Admin)

## Visao Geral

Vamos implementar um sistema completo de autenticacao e autorizacao com dois tipos de acesso:

- **Atendente**: Acesso limitado focado no atendimento
- **Administrador**: Acesso completo ao sistema

## Estrutura de Acesso por Role

### Atendente
| Modulo | Acesso |
|--------|--------|
| Dashboard | Nao |
| Atendimento | Sim (pagina inicial) |
| Solicitacoes | Sim |
| Conteudo | Sim (somente leitura) |
| Campanhas | Nao |
| Monitoramento | Sim |
| Administracao | Nao |
| Configuracoes Pessoais | Sim |

### Administrador
| Modulo | Acesso |
|--------|--------|
| Dashboard | Sim (pagina inicial) |
| Atendimento | Sim |
| Solicitacoes | Sim |
| Conteudo | Sim (leitura/escrita) |
| Campanhas | Sim |
| Monitoramento | Sim |
| Administracao | Sim |
| Configuracoes Pessoais | Sim |

---

## Etapas de Implementacao

### Etapa 1: Criar Estrutura de Banco de Dados

**Criar tabela `user_roles` no Supabase:**

```sql
-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'atendente');

-- Criar tabela de roles (separada de profiles para seguranca)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'atendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Criar tabela de perfis de atendentes
CREATE TABLE public.attendant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    working_hours JSONB DEFAULT '{"start": "09:00", "end": "18:00"}',
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'break')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.attendant_profiles ENABLE ROW LEVEL SECURITY;
```

**Criar funcao segura para verificar roles (evita recursao RLS):**

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;
```

**Criar politicas RLS:**

```sql
-- Usuarios podem ver seu proprio role
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Apenas admins podem gerenciar roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Atendentes podem ver e editar seu proprio perfil
CREATE POLICY "Users can manage own profile"
ON public.attendant_profiles FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.attendant_profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

---

### Etapa 2: Criar Sistema de Autenticacao

**Novos arquivos a criar:**

```text
src/
  contexts/
    AuthContext.tsx       <- Context de autenticacao
  hooks/
    useAuth.ts            <- Hook para usar auth
    useRole.ts            <- Hook para verificar role
  components/
    auth/
      LoginPage.tsx       <- Pagina de login
      ProtectedRoute.tsx  <- Wrapper para rotas protegidas
      RoleGuard.tsx       <- Componente que verifica role
```

**AuthContext.tsx** - Gerenciar estado de autenticacao:
- Listener para `onAuthStateChange`
- Carregar role do usuario apos login
- Funcoes de login, logout
- Estado: `user`, `role`, `loading`

**useRole.ts** - Hook para verificar permissoes:
- `hasRole(role)` - verifica se usuario tem role
- `isAdmin` - atalho para verificar admin
- `isAtendente` - atalho para verificar atendente
- `canAccess(module)` - verifica se pode acessar modulo

---

### Etapa 3: Criar Pagina de Login

**LoginPage.tsx:**
- Formulario com email e senha
- Integracao com Supabase Auth
- Logo do Metadesk
- Tratamento de erros

---

### Etapa 4: Atualizar Rotas com Protecao

**App.tsx atualizado:**

```tsx
<AuthProvider>
  <BrowserRouter>
    <Routes>
      {/* Rota publica */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Rota raiz - redireciona baseado no role */}
      <Route path="/" element={
        <ProtectedRoute>
          <RoleBasedRedirect />
        </ProtectedRoute>
      } />
      
      {/* Rotas de Admin */}
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="admin">
          <Dashboard />
        </ProtectedRoute>
      } />
      
      {/* Rotas compartilhadas */}
      <Route path="/atendimento" element={
        <ProtectedRoute>
          <Atendimento />
        </ProtectedRoute>
      } />
      
      {/* ... outras rotas */}
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

---

### Etapa 5: Atualizar Sidebar Dinamica

**Sidebar.tsx atualizado:**
- Usar `useRole()` para obter role do usuario
- Filtrar `menuItems` baseado no role
- Atendente ve: Atendimento, Solicitacoes, Conteudo, Monitoramento
- Admin ve: Todos os itens

```tsx
const menuItems = useMemo(() => {
  const baseItems = [
    { to: "/atendimento", icon: MessageSquare, text: "Atendimento", roles: ['admin', 'atendente'] },
    { to: "/solicitacoes", icon: ClipboardList, text: "Solicitacoes", roles: ['admin', 'atendente'] },
    { to: "/conteudo", icon: Book, text: "Conteudo", roles: ['admin', 'atendente'] },
    { to: "/monitoramento", icon: BarChart3, text: "Monitoramento", roles: ['admin', 'atendente'] },
  ];
  
  const adminItems = [
    { to: "/dashboard", icon: Home, text: "Dashboard", roles: ['admin'] },
    { to: "/campanhas", icon: Megaphone, text: "Campanhas", roles: ['admin'] },
    { to: "/administracao", icon: Settings, text: "Administracao", roles: ['admin'] },
  ];
  
  return [...adminItems, ...baseItems].filter(item => 
    item.roles.includes(role)
  );
}, [role]);
```

---

### Etapa 6: Adicionar Barra de Conteudo no Atendimento

**ConversationView.tsx atualizado:**

Adicionar painel lateral direito com acesso rapido a conteudos:

```tsx
{/* Painel de Conteudos - lado direito */}
<div className="w-72 border-l h-full overflow-y-auto">
  <div className="p-4 border-b bg-muted/20">
    <h3 className="font-medium flex items-center gap-2">
      <Book className="h-4 w-4" />
      Base de Conhecimento
    </h3>
  </div>
  <div className="p-4">
    {/* Lista de artigos relevantes */}
    {/* Busca rapida */}
    {/* FAQs mais usadas */}
  </div>
</div>
```

---

### Etapa 7: Pagina de Configuracoes do Usuario

**Criar nova pagina `MeuPerfil.tsx`:**

- Dados pessoais (nome, email, telefone)
- Alteracao de senha
- Horario de atendimento (para atendentes)
- Avatar/foto
- Preferencias de notificacao

Esta pagina sera acessivel para todos os usuarios logados.

---

### Etapa 8: Atualizar Header

**Header.tsx atualizado:**

- Mostrar nome e avatar do usuario logado
- Menu dropdown com:
  - "Meu Perfil" (link para configuracoes)
  - "Preferencias"
  - "Sair" (logout)
- Indicador de status (online/offline) para atendentes

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/contexts/AuthContext.tsx` | Context de autenticacao com role |
| `src/hooks/useAuth.ts` | Hook para acessar auth |
| `src/hooks/useRole.ts` | Hook para verificar permissoes |
| `src/components/auth/LoginPage.tsx` | Pagina de login |
| `src/components/auth/ProtectedRoute.tsx` | Wrapper de rotas protegidas |
| `src/components/auth/RoleGuard.tsx` | Guard baseado em role |
| `src/pages/MeuPerfil.tsx` | Pagina de configuracoes do usuario |
| `src/components/omnichannel/ContentSidebar.tsx` | Barra lateral de conteudos |

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/App.tsx` | Adicionar AuthProvider e rotas protegidas |
| `src/components/layout/Sidebar.tsx` | Filtrar menu por role |
| `src/components/layout/Header.tsx` | Adicionar info do usuario e logout |
| `src/components/omnichannel/ConversationView.tsx` | Adicionar painel de conteudos |
| `src/pages/Index.tsx` | Redirecionar baseado no role |

---

## Fluxo de Usuario

### Atendente
1. Faz login em `/login`
2. Redirecionado para `/atendimento` (pagina inicial)
3. Ve sidebar com: Atendimento, Solicitacoes, Conteudo, Monitoramento
4. No Atendimento, ve painel de conteudos no lado direito
5. Pode acessar "Meu Perfil" para ajustar dados pessoais

### Administrador
1. Faz login em `/login`
2. Redirecionado para `/dashboard` (pagina inicial)
3. Ve sidebar completa com todos os modulos
4. Acesso total a todas as funcionalidades
5. Pode gerenciar usuarios em Administracao

---

## Secao Tecnica

### Estrutura do AuthContext

```tsx
type AuthContextType = {
  user: User | null;
  role: 'admin' | 'atendente' | null;
  profile: AttendantProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};
```

### Permissoes por Modulo

```typescript
const MODULE_PERMISSIONS = {
  dashboard: ['admin'],
  atendimento: ['admin', 'atendente'],
  solicitacoes: ['admin', 'atendente'],
  conteudo: ['admin', 'atendente'], // atendente = somente leitura
  campanhas: ['admin'],
  monitoramento: ['admin', 'atendente'],
  administracao: ['admin'],
  meu_perfil: ['admin', 'atendente'],
};
```

### Verificacao de Role no Backend

Para seguranca adicional, as Edge Functions e RLS policies verificam o role diretamente no banco, nunca confiando apenas no cliente.
