
# Plano: Alinhar App com Projeto Supabase Correto

## Problema Principal

O app está apontando para o projeto `udyjlesjcgxhgdiaptjp`, mas as Edge Functions estão sendo deployadas para `jhkxcplfempenoczcoep`. Isso causa o erro "Failed to fetch" porque as funções simplesmente **não existem** no projeto onde o app está fazendo as requisições.

---

## Solução

Alinhar o deployment de Edge Functions para o projeto `udyjlesjcgxhgdiaptjp` (confirmado como o projeto oficial).

### 1. Atualizar `supabase/config.toml`

O arquivo já está correto com `project_id = "udyjlesjcgxhgdiaptjp"`.

### 2. Verificar/Configurar Secrets no Projeto Correto

Os secrets (`ELEVENLABS_API_KEY`) precisam estar configurados no projeto `udyjlesjcgxhgdiaptjp` no dashboard do Supabase:

| Secret | Status | Ação |
|--------|--------|------|
| `ELEVENLABS_API_KEY` | Verificar no dashboard | Adicionar se não existir |

**Link**: https://supabase.com/dashboard/project/udyjlesjcgxhgdiaptjp/settings/functions

### 3. Re-deployar Edge Functions para o Projeto Correto

As Edge Functions precisam ser deployadas especificamente para `udyjlesjcgxhgdiaptjp`:

- `elevenlabs-conversation-token`
- `send-complaint-email`

---

## Verificação do Cliente Supabase

O arquivo `src/integrations/supabase/client.ts` está correto:

```typescript
const SUPABASE_URL = "https://udyjlesjcgxhgdiaptjp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

---

## Arquivos/Recursos a Modificar

| Item | Ação |
|------|------|
| `supabase/config.toml` | ✅ Já está com `project_id` correto |
| Edge Functions | Re-deploy para `udyjlesjcgxhgdiaptjp` |
| Secrets no Supabase | Verificar/adicionar `ELEVENLABS_API_KEY` |

---

## Passos de Implementação

1. Verificar se `ELEVENLABS_API_KEY` existe em `udyjlesjcgxhgdiaptjp` (dashboard)
2. Se não existir, adicionar via dashboard ou ferramenta de secrets
3. Deploy das Edge Functions para o projeto correto
4. Testar novamente a funcionalidade de voz

---

## Nota Importante

O arquivo `.env` tem valores de `jhkxcplfempenoczcoep` (projeto antigo), mas como essas variáveis `VITE_*` não são usadas no código do cliente (verificado via busca), não há problema. O código usa valores hardcoded no `client.ts` que já estão corretos.
