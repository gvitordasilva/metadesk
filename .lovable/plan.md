
# Plano: Corrigir "Invalid API Key" - Sincronizar chave anon correta

## Diagnostico

Analisando os logs de rede, a aplicacao esta enviando a chave:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkeWpsZXNqY2d4aGdkaWFwdGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTI4ODUsImV4cCI6MjA2NTQyODg4NX0.GJmOYZ3MfwNjNXKfJCiXeL9gJrPfTSJMwdJt5xaKqgA
```

Esta chave:
- Aponta para o projeto correto (`ref: udyjlesjcgxhgdiaptjp`)
- Tem role `anon` (correto)
- Mas o Supabase a rejeita com "Invalid API key"

Isso significa que a **chave foi invalidada** no lado do Supabase. Causas possiveis:
1. A "Legacy JWT Secret" foi rotacionada no dashboard
2. O projeto migrou para "New API Keys" (formato `sb_publishable_...`)
3. A chave nunca foi a correta para este projeto

## Solucao

### Etapa 1: Verificar e copiar a chave correta

Voce precisa acessar o dashboard do Supabase e copiar a chave anon atualizada:

1. Acesse: https://supabase.com/dashboard/project/udyjlesjcgxhgdiaptjp/settings/api
2. Na secao "Project API keys", localize a **anon key** (ou "Publishable Key")
3. Se houver uma aba "New API Keys" com chaves `sb_publishable_...`, use essa
4. Copie a chave completa

### Etapa 2: Atualizar o codigo

Vou atualizar o arquivo `src/integrations/supabase/client.ts` com a nova chave que voce fornecer.

Se o Supabase migrou para o novo formato de chaves (`sb_publishable_...`), precisaremos atualizar tambem o formato no codigo.

### Etapa 3: Desabilitar Legacy JWT (se necessario)

Se o Supabase mostrar a opcao de desabilitar "Legacy JWT" e voce quiser fazer isso, faremos APOS atualizar o codigo com a nova chave. Nao desabilite antes, pois isso invalidaria qualquer chave antiga imediatamente.

## Proximo passo imediato

Por favor, acesse o link abaixo e me envie a **anon key** (ou "Publishable Key") atual que aparece la:

https://supabase.com/dashboard/project/udyjlesjcgxhgdiaptjp/settings/api

Pode ser uma chave no formato `eyJhbG...` (JWT) ou `sb_publishable_...` (novo formato).

## Observacao sobre o arquivo .env

Notei que o arquivo `.env` foi revertido para apontar para o projeto `jhkx`. Isso sera corrigido tambem ao atualizar a chave, garantindo consistencia com o projeto `udyj`.

## Arquivos a modificar

1. `src/integrations/supabase/client.ts` - atualizar SUPABASE_PUBLISHABLE_KEY
2. `.env` - corrigir para apontar para projeto `udyj`
