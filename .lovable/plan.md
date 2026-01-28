
# Plano: Corrigir erro "Invalid API Key" no login

## Problema identificado

Ha uma incompatibilidade entre URL e chave de API:
- **URL** no codigo: `https://udyjlesjcgxhgdiaptjp.supabase.co` (correto)
- **Chave** sendo usada: possivelmente a do projeto `jhkxcplfempenoczcoep` (errado)

O codigo atual usa `import.meta.env.VITE_SUPABASE_ANON_KEY` com fallback. Se essa variavel estiver configurada com a chave do projeto errado, ela sobrescreve o fallback correto.

## Solucao

### Etapa 1: Simplificar o client.ts

Remover a dependencia de variaveis de ambiente e usar valores fixos do projeto correto:

```text
const SUPABASE_URL = "https://udyjlesjcgxhgdiaptjp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkeWpsZXNqY2d4aGdkaWFwdGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTI4ODUsImV4cCI6MjA2NTQyODg4NX0.GJmOYZ3MfwNjNXKfJCiXeL9gJrPfTSJMwdJt5xaKqgA";
```

Isso garante que nenhuma variavel de ambiente com valor incorreto possa interferir.

### Etapa 2: Limpar o arquivo .env

Atualizar o arquivo `.env` para refletir o projeto correto (udyj):

```text
VITE_SUPABASE_PROJECT_ID="udyjlesjcgxhgdiaptjp"
VITE_SUPABASE_URL="https://udyjlesjcgxhgdiaptjp.supabase.co"
```

### Etapa 3: Atualizar a secret VITE_SUPABASE_ANON_KEY

Se necessario, atualizar o valor da secret no Cloud para a chave anon correta do projeto udyj.

## Resultado esperado

Apos as correcoes, o login funcionara corretamente conectando ao projeto Supabase `udyjlesjcgxhgdiaptjp`.

## Detalhes tecnicos

### Por que isso acontece?

Chaves anon do Supabase sao JWTs que contem o `ref` (ID do projeto) na payload. Quando voce usa uma chave de um projeto com a URL de outro, o Supabase rejeita porque o `ref` no token nao corresponde ao projeto da URL.

### Arquivos a modificar

1. `src/integrations/supabase/client.ts` - usar valores fixos sem fallback
2. `.env` - atualizar para o projeto correto
3. Secret `VITE_SUPABASE_ANON_KEY` no Cloud - atualizar valor se necessario
