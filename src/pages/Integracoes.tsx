import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Copy,
  Check,
  Plug,
  Webhook,
  FileCode,
  Key,
  ExternalLink,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Integracoes() {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  const apiKey = "mk_live_a1b2c3d4e5f6g7h8i9j0...";
  const maskedApiKey = "mk_live_****************************";

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast({
      title: "Copiado!",
      description: "Código copiado para a área de transferência.",
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const codeExamples = {
    curl: `curl -X GET "https://api.metadesk.com/v1/tickets" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    javascript: `const response = await fetch('https://api.metadesk.com/v1/tickets', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`,
    python: `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.metadesk.com/v1/tickets',
    headers=headers
)

data = response.json()
print(data)`,
  };

  const connectors = [
    {
      name: "SAP",
      description: "Integração com SAP ERP",
      status: "disconnected",
      icon: "🏢",
    },
    {
      name: "TOTVS",
      description: "Conexão com TOTVS Protheus",
      status: "disconnected",
      icon: "📊",
    },
    {
      name: "Salesforce",
      description: "CRM Salesforce",
      status: "connected",
      icon: "☁️",
    },
    {
      name: "HubSpot",
      description: "Marketing e CRM HubSpot",
      status: "disconnected",
      icon: "🧡",
    },
    {
      name: "Zapier",
      description: "Automações via Zapier",
      status: "connected",
      icon: "⚡",
    },
    {
      name: "n8n",
      description: "Workflows com n8n",
      status: "disconnected",
      icon: "🔄",
    },
  ];

  const webhooks = [
    {
      id: 1,
      url: "https://minha-empresa.com/webhook/tickets",
      events: ["ticket.created", "ticket.updated"],
      status: "active",
      lastCall: "Há 5 minutos",
    },
    {
      id: 2,
      url: "https://api.slack.com/webhook/xyz",
      events: ["ticket.resolved"],
      status: "active",
      lastCall: "Há 2 horas",
    },
  ];

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Integrações</h1>
            <p className="text-muted-foreground">
              Configure conexões com sistemas externos e acesse nossa documentação de API
            </p>
          </div>
        </div>

        <Tabs defaultValue="documentacao" className="mb-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="documentacao" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Documentação
            </TabsTrigger>
            <TabsTrigger value="apis" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Minhas APIs
            </TabsTrigger>
            <TabsTrigger value="conectores" className="flex items-center gap-2">
              <Plug className="h-4 w-4" />
              Conectores
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks
            </TabsTrigger>
          </TabsList>

          {/* Documentação Tab */}
          <TabsContent value="documentacao" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API REST do Metadesk</CardTitle>
                <CardDescription>
                  Nossa API permite que você integre o Metadesk com qualquer sistema externo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Endpoint Base */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Endpoint Base</h3>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm flex items-center justify-between">
                    <span>https://api.metadesk.com/v1</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("https://api.metadesk.com/v1", "endpoint")}
                    >
                      {copied === "endpoint" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Autenticação */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Autenticação</h3>
                  <p className="text-muted-foreground mb-3">
                    Todas as requisições devem incluir o header de autorização com seu token de API:
                  </p>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    Authorization: Bearer YOUR_API_KEY
                  </div>
                </div>

                {/* Exemplos de Código */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Exemplos de Requisição</h3>
                  <Tabs defaultValue="curl" className="w-full">
                    <TabsList>
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                      <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                    </TabsList>
                    {Object.entries(codeExamples).map(([lang, code]) => (
                      <TabsContent key={lang} value={lang}>
                        <div className="relative">
                          <pre className="bg-zinc-900 text-zinc-100 rounded-lg p-4 overflow-x-auto text-sm">
                            <code>{code}</code>
                          </pre>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-100"
                            onClick={() => copyToClipboard(code, lang)}
                          >
                            {copied === lang ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>

                {/* Endpoints Disponíveis */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Endpoints Disponíveis</h3>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="tickets">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-100 text-green-800">GET</Badge>
                          /tickets
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground mb-2">Lista todos os tickets do sistema.</p>
                        <p className="text-sm"><strong>Parâmetros:</strong> status, assignee, page, limit</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="tickets-create">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">POST</Badge>
                          /tickets
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground mb-2">Cria um novo ticket.</p>
                        <p className="text-sm"><strong>Body:</strong> title, description, priority, category</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="users">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-100 text-green-800">GET</Badge>
                          /users
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground mb-2">Lista todos os usuários.</p>
                        <p className="text-sm"><strong>Parâmetros:</strong> role, status, page, limit</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="conversations">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-100 text-green-800">GET</Badge>
                          /conversations
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground mb-2">Lista todas as conversas ativas.</p>
                        <p className="text-sm"><strong>Parâmetros:</strong> channel, status, agent_id</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Códigos de Resposta */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Códigos de Resposta</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <span className="font-mono font-bold text-green-700">200</span>
                      <p className="text-sm text-green-600">Sucesso</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <span className="font-mono font-bold text-blue-700">201</span>
                      <p className="text-sm text-blue-600">Criado</p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <span className="font-mono font-bold text-yellow-700">401</span>
                      <p className="text-sm text-yellow-600">Não autorizado</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <span className="font-mono font-bold text-red-700">500</span>
                      <p className="text-sm text-red-600">Erro do servidor</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Minhas APIs Tab */}
          <TabsContent value="apis" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Suas Chaves de API</CardTitle>
                <CardDescription>
                  Gerencie suas chaves de acesso à API do Metadesk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">Chave de API Principal</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="font-mono text-sm">
                        {showApiKey ? apiKey : maskedApiKey}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(apiKey, "apikey")}
                      >
                        {copied === "apikey" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerar
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Histórico de Chaves</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <code className="font-mono text-sm">mk_live_****7h8i</code>
                        <p className="text-xs text-muted-foreground">Criada em 15/01/2025</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                      <div>
                        <code className="font-mono text-sm">mk_live_****3d4e</code>
                        <p className="text-xs text-muted-foreground">Criada em 01/12/2024</p>
                      </div>
                      <Badge variant="outline">Revogada</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conectores Tab */}
          <TabsContent value="conectores" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectors.map((connector) => (
                <Card key={connector.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{connector.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{connector.name}</CardTitle>
                          <CardDescription>{connector.description}</CardDescription>
                        </div>
                      </div>
                      <Badge
                        className={
                          connector.status === "connected"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {connector.status === "connected" ? "Conectado" : "Desconectado"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant={connector.status === "connected" ? "outline" : "default"}
                      className="w-full"
                    >
                      {connector.status === "connected" ? "Configurar" : "Conectar"}
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Webhook</CardTitle>
                <CardDescription>
                  Configure endpoints para receber notificações em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="https://seu-sistema.com/webhook"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhooks Configurados</CardTitle>
                <CardDescription>
                  Gerencie seus endpoints de notificação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {webhooks.map((webhook) => (
                    <div
                      key={webhook.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <code className="font-mono text-sm">{webhook.url}</code>
                        <div className="flex items-center gap-2 mt-2">
                          {webhook.events.map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Última chamada: {webhook.lastCall}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
