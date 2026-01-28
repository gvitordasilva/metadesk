
# Plano: Corrigir Edge Function do Agente de Voz

## Problema

O agente de voz ElevenLabs não está funcionando devido a:
1. **Agent ID placeholder** - O código ainda usa `"YOUR_AGENT_ID_HERE"` ao invés do ID real
2. **CORS Headers incompletos** - Faltam headers necessários para o client Supabase
3. **Edge Function não deployada** - Após migração de projeto, a função precisa ser re-deployada

---

## Correções Necessárias

### 1. Atualizar Agent ID no StepVoiceAgent.tsx

| Antes | Depois |
|-------|--------|
| `"YOUR_AGENT_ID_HERE"` | `"agent_2001kfzvc45yfwstqcvp7a43kc59"` |

### 2. Corrigir CORS Headers na Edge Function

Atualizar `supabase/functions/elevenlabs-conversation-token/index.ts`:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
```

### 3. Re-deployar Edge Function

Após as correções, a edge function será automaticamente deployada para o novo projeto Supabase.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/complaints/StepVoiceAgent.tsx` | Atualizar Agent ID para o valor real |
| `supabase/functions/elevenlabs-conversation-token/index.ts` | Corrigir CORS headers |

---

## Verificação

Após as correções:
1. A edge function será deployada automaticamente
2. O componente usará o Agent ID correto
3. As requisições CORS funcionarão corretamente
4. O secret `ELEVENLABS_API_KEY` já está configurado no projeto
