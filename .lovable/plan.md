
# Configuração do Projeto Metadesk

## Ambiente Supabase

O projeto Metadesk utiliza **exclusivamente** o ambiente Supabase:

| Configuração | Valor |
|-------------|-------|
| **Project ID** | `udyjlesjcgxhgdiaptjp` |
| **URL** | `https://udyjlesjcgxhgdiaptjp.supabase.co` |

---

## Arquivos de Configuração

| Arquivo | Status |
|---------|--------|
| `src/integrations/supabase/client.ts` | ✅ Configurado para udyjlesjcgxhgdiaptjp |
| `supabase/config.toml` | ✅ Configurado para udyjlesjcgxhgdiaptjp |
| `.env` | ✅ Configurado para udyjlesjcgxhgdiaptjp |

---

## Notas

- Todas as Edge Functions devem ser deployadas para o projeto `udyjlesjcgxhgdiaptjp`
- O sistema de autenticação usa a tabela `user_roles` para controle de acesso
- A Edge Function `chatbot-admin` verifica permissões em `user_roles` (primário) e `admin_users` (fallback)
