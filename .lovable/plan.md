
# Plano: Criar Página de Integrações Separada

## Objetivo

Mover "Integrações" de dentro da aba de Administração para um item de menu próprio no sidebar, criando uma nova página dedicada com documentação de API didática e configuração self-service de integrações.

---

## Arquivos a Modificar/Criar

| Arquivo | Ação |
|---------|------|
| `src/pages/Integracoes.tsx` | **Criar** - Nova página de integrações |
| `src/components/layout/Sidebar.tsx` | **Modificar** - Adicionar item "Integrações" após "Administração" |
| `src/pages/Administracao.tsx` | **Modificar** - Remover a aba "Integrações" |
| `src/App.tsx` | **Modificar** - Adicionar rota `/integracoes` |

---

## Detalhes das Alterações

### 1. Nova Página: `src/pages/Integracoes.tsx`

A página será dividida em seções didáticas:

**Estrutura da Página:**

- **Header**: Título "Integrações" com descrição
- **Seção 1 - Documentação da API**
  - Apresentação visual do endpoint base
  - Exemplos de requisições (GET, POST)
  - Códigos de resposta e erros
  - Bloco de código com syntax highlighting
  
- **Seção 2 - Suas Chaves de API**
  - Exibir chave pública (parcialmente mascarada)
  - Botão para gerar nova chave
  - Histórico de chaves geradas

- **Seção 3 - Integrações Disponíveis**
  - Cards para cada integração possível:
    - ERPs (SAP, TOTVS, Oracle)
    - CRMs (Salesforce, HubSpot)
    - Webhooks customizados
    - Zapier/n8n
  - Cada card com status (Conectado/Desconectado) e botão de configuração

- **Seção 4 - Webhooks**
  - Formulário para adicionar endpoint de webhook
  - Lista de webhooks configurados
  - Logs de chamadas recentes

**Componentes visuais:**
- Blocos de código estilizados (fundo escuro, monospace)
- Tabs para diferentes linguagens (cURL, JavaScript, Python)
- Badges de status
- Accordion para expandir detalhes

### 2. Sidebar (`src/components/layout/Sidebar.tsx`)

Adicionar novo item de menu após "Administração":

```typescript
{
  to: "/integracoes",
  icon: Plug, // ou Database
  text: "Integrações",
  path: "/integracoes",
  roles: ['admin']
}
```

Importar novo ícone: `Plug` do lucide-react.

### 3. Administração (`src/pages/Administracao.tsx`)

- Remover a aba "Integrações" do TabsList (reduzir de 5 para 4 colunas)
- Remover o TabsContent correspondente
- Remover import de `Database` se não for mais usado

### 4. App.tsx

Adicionar nova rota protegida para admin:

```typescript
import Integracoes from "./pages/Integracoes";

<Route path="/integracoes" element={
  <ProtectedRoute requiredRole="admin">
    <Integracoes />
  </ProtectedRoute>
} />
```

---

## Layout da Nova Página

```text
+------------------------------------------+
|  Integrações                             |
|  Configure conexões com sistemas externos|
+------------------------------------------+

+------------------------------------------+
|  [Tab: Documentação] [Tab: Minhas APIs]  |
|  [Tab: Conectores]   [Tab: Webhooks]     |
+------------------------------------------+

| Documentação da API                      |
| ---------------------------------------- |
| Endpoint Base:                           |
| https://api.metadesk.com/v1              |
|                                          |
| [cURL] [JavaScript] [Python]             |
| +--------------------------------------+ |
| | curl -X GET \                        | |
| |   https://api.metadesk.com/v1/...    | |
| +--------------------------------------+ |
|                                          |
| Autenticação                             |
| Use o header Authorization: Bearer TOKEN |
+------------------------------------------+
```

---

## Seção Técnica

### Imports necessários para `Integracoes.tsx`

```typescript
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Copy, Check, Plug, Webhook, FileCode, Key, ExternalLink } from "lucide-react";
```

### Estado para copiar código

```typescript
const [copied, setCopied] = useState<string | null>(null);

const copyToClipboard = (text: string, id: string) => {
  navigator.clipboard.writeText(text);
  setCopied(id);
  setTimeout(() => setCopied(null), 2000);
};
```

---

## Resultado Esperado

1. Menu sidebar terá "Integrações" logo abaixo de "Administração"
2. Página de Administração ficará mais focada (4 abas: Usuários, Perfis, Estrutura, Configurações)
3. Nova página `/integracoes` com conteúdo didático e self-service para configurar integrações
