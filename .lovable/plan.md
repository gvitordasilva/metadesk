
## Correção: Incompatibilidade de Valores entre Edge Function e Banco de Dados

### Problema Identificado

A conexão com o ElevenLabs está funcionando corretamente (o teste retornou um token válido), porém a edge function `voice-agent-tools` falha ao tentar inserir dados na tabela `complaints` devido a incompatibilidades de valores.

```text
┌───────────────────────────────────────────────────────────────────┐
│                    FLUXO DO ERRO                                 │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ElevenLabs Agent         Edge Function           Database       │
│   (Max)                    voice-agent-tools       complaints     │
│                                                                   │
│   type: "Reclamação"  ──►  type: "Reclamação"  ──►  REJEITADO!   │
│                                                     Aceita apenas:│
│                                                     "reclamacao"  │
│                                                     "denuncia"    │
│                                                     "sugestao"    │
│                                                                   │
│   status: ---         ──►  status: "pending"   ──►  REJEITADO!   │
│                                                     Aceita apenas:│
│                                                     "novo"        │
│                                                     "em_analise"  │
│                                                     "resolvido"   │
│                                                     "fechado"     │
└───────────────────────────────────────────────────────────────────┘
```

### Causa Raiz

| Campo | Valor Enviado | Valor Aceito pelo Banco | Problema |
|-------|---------------|-------------------------|----------|
| `status` | `'pending'` | `'novo'`, `'em_analise'`, `'resolvido'`, `'fechado'` | Valor em inglês vs português |
| `type` | `'Reclamação'` | `'reclamacao'`, `'denuncia'`, `'sugestao'` | Com acento vs sem acento |

A constraint `complaints_status_check` rejeita qualquer valor diferente dos permitidos, causando o erro 500.

### Solução

Modificar a edge function `voice-agent-tools` para:

1. **Normalizar o tipo** recebido do agente para o formato aceito pelo banco
2. **Usar o status correto** (`'novo'` em vez de `'pending'`)
3. **Atualizar o mapeamento de status** na função `lookupProtocol`

### Alterações no Arquivo

**Arquivo: `supabase/functions/voice-agent-tools/index.ts`**

**1. Adicionar função de normalização de tipo (após linha 29):**

```typescript
// Normaliza o tipo recebido para o formato do banco
function normalizeType(type: string): string {
  const typeMap: Record<string, string> = {
    'Reclamação': 'reclamacao',
    'reclamação': 'reclamacao',
    'reclamacao': 'reclamacao',
    'Denúncia': 'denuncia',
    'denúncia': 'denuncia',
    'denuncia': 'denuncia',
    'Sugestão': 'sugestao',
    'sugestão': 'sugestao',
    'sugestao': 'sugestao',
  };
  return typeMap[type] || 'reclamacao';
}
```

**2. Atualizar generateProtocolNumber (linhas 31-41):**

```typescript
function generateProtocolNumber(type: string): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  let prefix = 'SOL';
  if (type === 'reclamacao') prefix = 'REC';
  else if (type === 'denuncia') prefix = 'DEN';
  else if (type === 'sugestao') prefix = 'SUG';
  
  return `${prefix}-${year}-${randomNum}`;
}
```

**3. Atualizar createComplaint (linhas 63-84):**

```typescript
case 'createComplaint': {
  const complaintData = data as CreateComplaintData;
  const normalizedType = normalizeType(complaintData.type);
  const protocolNumber = generateProtocolNumber(normalizedType);

  const { data: complaint, error: complaintError } = await supabase
    .from('complaints')
    .insert({
      protocol_number: protocolNumber,
      type: normalizedType,  // Usar tipo normalizado
      category: complaintData.category,
      description: complaintData.description,
      is_anonymous: complaintData.isAnonymous,
      reporter_name: complaintData.isAnonymous ? null : complaintData.name,
      reporter_email: complaintData.isAnonymous ? null : complaintData.email,
      reporter_phone: complaintData.isAnonymous ? null : complaintData.phone,
      location: complaintData.location,
      status: 'novo',  // Usar status correto
      waiting_since: new Date().toISOString(),
    })
    .select()
    .single();
```

**4. Atualizar service_queue (linha 97):**

```typescript
priority: normalizedType === 'denuncia' ? 1 : 2,
```

**5. Atualizar statusMessages em lookupProtocol (linhas 172-177):**

```typescript
const statusMessages: Record<string, string> = {
  novo: 'aguardando análise',
  em_analise: 'em andamento',
  resolvido: 'resolvida',
  fechado: 'encerrada',
};
```

### Resultado Esperado

Após a correção:

```text
Usuário fala com Max (ElevenLabs)
       │
       ▼
Max coleta: type="Reclamação", category="Atendimento"
       │
       ▼
Edge Function normaliza: type="reclamacao", status="novo"
       │
       ▼
Banco aceita o INSERT ✓
       │
       ▼
Protocolo REC-2026-XXXXXX gerado ✓
       │
       ▼
Aparece em /solicitacoes ✓
```

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/voice-agent-tools/index.ts` | **Modificar** - Normalizar tipos e usar status corretos |
