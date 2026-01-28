
# Plano: Corrigir Configuração do Supabase e Autenticação do Chatbot

## Problema Identificado

O erro "Erro ao criar fluxo" acontece por dois motivos principais:

### 1. Cliente Supabase apontando para projeto errado

| Configuração Atual | Valor Errado | Valor Correto |
|-------------------|--------------|---------------|
| `SUPABASE_URL` | `https://udyjlesjcgxhgdiaptjp.supabase.co` | `https://jhkxcplfempenoczcoep.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Token do projeto errado | Token do projeto correto |

O frontend está chamando o projeto `udyjlesjcgxhgdiaptjp`, mas as Edge Functions estão deployadas em `jhkxcplfempenoczcoep`. Resultado: "Failed to fetch".

### 2. Edge Function verificando tabela errada

A Edge Function `chatbot-admin` verifica permissões na tabela `admin_users`:
```javascript
const { data: adminUser } = await supabase
  .from("admin_users")
  .select("role")
  .eq("user_id", user.id)
  .single();

return adminUser?.role === "admin";
```

Mas o sistema de autenticação do app usa `user_roles`:
```javascript
const { data } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .single();
```

## Solução

### Etapa 1: Corrigir `src/integrations/supabase/client.ts`

Atualizar a URL e a chave para o projeto correto:

```typescript
const SUPABASE_URL = "https://jhkxcplfempenoczcoep.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoa3hjcGxmZW1wZW5vY3pjb2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDQxNTcsImV4cCI6MjA2NTU4MDE1N30.WQgbaSWF6PebXLDX5PUWuP4dM-vsyBimcv3lMxhVJ30";
```

### Etapa 2: Atualizar Edge Function `chatbot-admin`

Modificar a verificação de admin para usar `user_roles` em vez de `admin_users`:

```javascript
async function verifyAdmin(supabase: any, authHeader: string): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return false;
  }

  // Verificar user_roles (sistema atual do app)
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (userRole?.role === "admin") {
    return true;
  }

  // Fallback: verificar admin_users (legado)
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  return adminUser?.role === "admin";
}
```

### Etapa 3: Adicionar usuário atual como admin (via migração)

Inserir o usuário `matheus.roldan@metasix.com.br` (ID: `1801501f-f97f-4945-a0af-8a53ca33d36c`) na tabela `user_roles`:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('1801501f-f97f-4945-a0af-8a53ca33d36c', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

---

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/integrations/supabase/client.ts` | Modificar | Corrigir URL e chave do projeto |
| `supabase/functions/chatbot-admin/index.ts` | Modificar | Verificar `user_roles` além de `admin_users` |
| Migração SQL | Criar | Inserir usuário como admin em `user_roles` |

---

## Resultado Esperado

Após as correções:

1. O frontend vai conectar ao projeto correto
2. A Edge Function vai receber tokens válidos
3. O usuário atual será reconhecido como admin
4. Criar fluxo funcionará normalmente

---

## Seção Técnica

### Por que o "Failed to fetch"?

O navegador faz requisições para `udyjlesjcgxhgdiaptjp.supabase.co/functions/v1/chatbot-admin`, mas essa função não existe nesse projeto (está em `jhkxcplfempenoczcoep`). O Supabase retorna erro de CORS ou 404, que o browser interpreta como "Failed to fetch".

### Fluxo de Autenticação Corrigido

```text
Frontend (client.ts)
    |
    v
jhkxcplfempenoczcoep.supabase.co
    |
    v
Edge Function: chatbot-admin
    |
    v
Verifica token JWT → user.id
    |
    v
Consulta user_roles WHERE user_id = ?
    |
    v
role = "admin" ? → Autorizado
```

### Considerações de Segurança

- A verificação continua exigindo role "admin"
- Fallback para `admin_users` mantém compatibilidade com dados existentes
- Tokens JWT são validados pelo Supabase Auth antes de chegar ao código
