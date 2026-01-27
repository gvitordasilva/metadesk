
# Sistema de Reclamações e Denúncias

## Resumo

Criar uma página pública para registro de reclamações e denúncias com formulário multi-etapas, suporte a anexos, validação por captcha, geração de protocolo e notificação por e-mail.

---

## Fluxo do Usuário

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PÁGINA PÚBLICA                                  │
│                          /reclamacoes-denuncias                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ETAPA 1: IDENTIFICAÇÃO                                                      │
│  ═══════════════════════                                                     │
│  ○ Anônimo (sem identificação)                                              │
│  ○ Identificado (nome, e-mail, telefone opcional)                           │
│                                                                              │
│  Barra de progresso: [████░░░░░░░░░░░░░░░░] 25%                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ETAPA 2: DETALHES DA OCORRÊNCIA                                            │
│  ═══════════════════════════════                                            │
│  • Tipo: [Reclamação] [Denúncia] [Sugestão]                                 │
│  • Categoria: [Atendimento] [Produto] [Serviço] [Conduta] [Outro]          │
│  • Data/hora do ocorrido                                                     │
│  • Local onde aconteceu                                                      │
│  • Descrição detalhada (textarea)                                           │
│  • Pessoas/departamentos envolvidos (opcional)                              │
│                                                                              │
│  Barra de progresso: [████████░░░░░░░░░░░░] 50%                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ETAPA 3: ANEXOS (OPCIONAL)                                                  │
│  ══════════════════════════                                                  │
│  ┌─────────────────────────────────────────────┐                            │
│  │  📎 Arraste arquivos ou clique para enviar  │                            │
│  │     Fotos, documentos, prints (máx 5MB)     │                            │
│  └─────────────────────────────────────────────┘                            │
│  Arquivos anexados: foto1.jpg, documento.pdf                                │
│                                                                              │
│  Barra de progresso: [████████████░░░░░░░░] 75%                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ETAPA 4: CONFIRMAÇÃO                                                        │
│  ════════════════════                                                        │
│  ┌─────────────────────────────────────────────┐                            │
│  │       🔒 Verifique que você é humano        │                            │
│  │           [reCAPTCHA widget]                │                            │
│  └─────────────────────────────────────────────┘                            │
│                                                                              │
│  Resumo da solicitação:                                                      │
│  • Tipo: Denúncia                                                            │
│  • Categoria: Conduta                                                        │
│  • Data: 15/01/2026                                                          │
│  • Anexos: 2 arquivos                                                        │
│                                                                              │
│  [        ENVIAR SOLICITAÇÃO        ]                                        │
│                                                                              │
│  Barra de progresso: [████████████████████] 100%                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  CONFIRMAÇÃO DE ENVIO                                                        │
│  ════════════════════                                                        │
│               ✅ Solicitação enviada com sucesso!                            │
│                                                                              │
│              Seu protocolo é: REC-2026-001234                               │
│                                                                              │
│  Um e-mail foi enviado para maria@email.com com os detalhes.                │
│  Guarde este número para acompanhamento.                                     │
│                                                                              │
│             [  Nova Solicitação  ]  [  Página Inicial  ]                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## O Que Será Criado

### 1. Página Pública
- Nova rota `/reclamacoes-denuncias` acessível sem login
- Design limpo e profissional seguindo a identidade visual do Metadesk
- Formulário dividido em 4 etapas com barra de progresso visual
- Totalmente responsivo para acesso mobile

### 2. Banco de Dados
Nova tabela `complaints` para armazenar todas as solicitações:
- Dados do solicitante (opcional se anônimo)
- Tipo, categoria e detalhes da ocorrência
- Referência aos arquivos anexados
- Protocolo único gerado automaticamente
- Status para acompanhamento interno

### 3. Armazenamento de Arquivos
- Novo bucket no Supabase Storage para os anexos
- Suporte a imagens (JPG, PNG) e documentos (PDF)
- Limite de 5MB por arquivo

### 4. Envio de E-mails
- Edge Function para envio de e-mails via Resend
- E-mail de confirmação para o cliente com protocolo
- Notificação interna para a equipe de atendimento

### 5. Validação de Segurança
- Integração com Google reCAPTCHA v2
- Proteção contra envios automatizados

---

## Componentes a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/ReclamacoesDenuncias.tsx` | Página principal com formulário multi-etapas |
| `src/components/complaints/StepIdentification.tsx` | Etapa 1 - Escolha anônimo/identificado |
| `src/components/complaints/StepDetails.tsx` | Etapa 2 - Detalhes da ocorrência |
| `src/components/complaints/StepAttachments.tsx` | Etapa 3 - Upload de arquivos |
| `src/components/complaints/StepConfirmation.tsx` | Etapa 4 - Captcha e confirmação |
| `src/components/complaints/ProgressBar.tsx` | Barra de progresso visual |
| `src/components/complaints/SuccessScreen.tsx` | Tela de sucesso com protocolo |
| `supabase/functions/send-complaint-email/index.ts` | Edge Function para envio de e-mails |

---

## Detalhes Técnicos

### Tabela `complaints`

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ complaints                                                                  │
├────────────────────┬───────────────────┬───────────────────────────────────┤
│ Campo              │ Tipo              │ Descrição                         │
├────────────────────┼───────────────────┼───────────────────────────────────┤
│ id                 │ UUID              │ Identificador único               │
│ protocol_number    │ TEXT              │ Protocolo (REC-2026-000001)       │
│ is_anonymous       │ BOOLEAN           │ Se é denúncia anônima             │
│ reporter_name      │ TEXT              │ Nome do solicitante               │
│ reporter_email     │ TEXT              │ E-mail do solicitante             │
│ reporter_phone     │ TEXT              │ Telefone (opcional)               │
│ type               │ TEXT              │ reclamacao/denuncia/sugestao      │
│ category           │ TEXT              │ Categoria da ocorrência           │
│ occurred_at        │ TIMESTAMPTZ       │ Data/hora do ocorrido             │
│ location           │ TEXT              │ Local onde aconteceu              │
│ description        │ TEXT              │ Descrição detalhada               │
│ involved_parties   │ TEXT              │ Pessoas/departamentos envolvidos  │
│ attachments        │ JSONB             │ Lista de URLs dos anexos          │
│ status             │ TEXT              │ novo/em_analise/resolvido/fechado │
│ internal_notes     │ TEXT              │ Notas internas (uso da empresa)   │
│ assigned_to        │ UUID              │ Responsável pelo caso             │
│ created_at         │ TIMESTAMPTZ       │ Data de criação                   │
│ updated_at         │ TIMESTAMPTZ       │ Data de atualização               │
└────────────────────┴───────────────────┴───────────────────────────────────┘
```

### Função de Geração de Protocolo

```text
Formato: REC-AAAA-NNNNNN
Exemplo: REC-2026-000042

- REC = Prefixo fixo
- 2026 = Ano corrente
- 000042 = Número sequencial com 6 dígitos
```

### Políticas de Segurança (RLS)

- **INSERT**: Qualquer pessoa pode criar (página pública)
- **SELECT/UPDATE/DELETE**: Apenas usuários autenticados com permissão de administrador

### Requisitos para Funcionar

1. **Google reCAPTCHA**
   - Criar projeto em https://www.google.com/recaptcha/admin
   - Obter Site Key (frontend) e Secret Key (backend)
   - Adicionar `RECAPTCHA_SECRET_KEY` nos secrets do Supabase

2. **Resend (já configurado)**
   - A chave `RESEND_API_KEY` já existe no projeto
   - Será necessário informar o domínio verificado para o "from"

3. **Storage Bucket**
   - Criar bucket `complaint-attachments` no Supabase
   - Configurar políticas para upload público

---

## Ordem de Implementação

1. Criar tabela `complaints` no banco de dados com RLS
2. Criar função SQL para geração de protocolo
3. Criar bucket de storage para anexos
4. Criar componentes do formulário multi-etapas
5. Criar página principal com toda a lógica
6. Criar Edge Function para envio de e-mails
7. Adicionar rota no App.tsx
8. Testar fluxo completo

---

## Resultado Final

O cliente poderá:
- Acessar a página sem precisar de login
- Escolher se quer se identificar ou não
- Descrever o ocorrido com todos os detalhes necessários
- Anexar fotos e documentos como evidência
- Receber um protocolo para acompanhamento
- Receber confirmação por e-mail

A empresa poderá:
- Visualizar todas as solicitações no banco de dados
- Gerenciar status e atribuir responsáveis
- Manter histórico completo para auditoria
