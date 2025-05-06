
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  MoreHorizontal,
  Mail,
  MessageSquare,
  Phone,
  Play,
  Pause,
  Copy,
  ChevronRight,
} from "lucide-react";

type Campaign = {
  id: string;
  name: string;
  description: string;
  channel: "email" | "whatsapp" | "sms" | "phone";
  status: "draft" | "scheduled" | "active" | "paused" | "completed";
  progress: number;
  recipients: number;
  delivered: number;
  opened?: number;
  clicked?: number;
  date: string;
};

const campaigns: Campaign[] = [
  {
    id: "1",
    name: "Newsletter - Maio 2025",
    description: "Informativo mensal com novidades e ofertas exclusivas",
    channel: "email",
    status: "active",
    progress: 65,
    recipients: 5000,
    delivered: 3250,
    opened: 1820,
    clicked: 450,
    date: "15/05/2025",
  },
  {
    id: "2",
    name: "Campanha de Reativação",
    description: "Resgate clientes inativos dos últimos 90 dias",
    channel: "whatsapp",
    status: "scheduled",
    progress: 0,
    recipients: 2500,
    delivered: 0,
    date: "18/05/2025",
  },
  {
    id: "3",
    name: "Lembrete de Pagamento",
    description: "Aviso sobre faturas próximas do vencimento",
    channel: "sms",
    status: "paused",
    progress: 30,
    recipients: 1200,
    delivered: 360,
    date: "12/05/2025",
  },
  {
    id: "4",
    name: "Pesquisa de Satisfação",
    description: "Avaliação pós-atendimento para clientes recentes",
    channel: "phone",
    status: "completed",
    progress: 100,
    recipients: 800,
    delivered: 720,
    date: "10/05/2025",
  },
  {
    id: "5",
    name: "Lançamento Novo Produto",
    description: "Anúncio da nova linha de produtos premium",
    channel: "email",
    status: "draft",
    progress: 0,
    recipients: 10000,
    delivered: 0,
    date: "25/05/2025",
  },
];

const channelIcons = {
  email: <Mail className="h-5 w-5" />,
  whatsapp: <MessageSquare className="h-5 w-5" />,
  sms: <MessageSquare className="h-5 w-5" />,
  phone: <Phone className="h-5 w-5" />,
};

const statusConfig = {
  draft: {
    label: "Rascunho",
    color: "bg-gray-100 text-gray-800",
  },
  scheduled: {
    label: "Agendada",
    color: "bg-blue-100 text-blue-800",
  },
  active: {
    label: "Em execução",
    color: "bg-green-100 text-green-800",
  },
  paused: {
    label: "Pausada",
    color: "bg-yellow-100 text-yellow-800",
  },
  completed: {
    label: "Concluída",
    color: "bg-purple-100 text-purple-800",
  },
};

export default function Campanhas() {
  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Campanhas</h1>
            <p className="text-muted-foreground">
              Gerenciamento de campanhas e comunicações ativas
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Campanha
          </Button>
        </div>

        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="active">Em execução</TabsTrigger>
            <TabsTrigger value="scheduled">Agendadas</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
            <TabsTrigger value="draft">Rascunhos</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div
                    className={`p-2 rounded-full bg-gray-100 ${
                      campaign.channel === "email"
                        ? "text-blue-600"
                        : campaign.channel === "whatsapp"
                        ? "text-green-600"
                        : campaign.channel === "sms"
                        ? "text-purple-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {channelIcons[campaign.channel]}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      {campaign.status === "active" && (
                        <DropdownMenuItem>
                          <Pause className="h-4 w-4 mr-2" />
                          Pausar
                        </DropdownMenuItem>
                      )}
                      {campaign.status === "paused" && (
                        <DropdownMenuItem>
                          <Play className="h-4 w-4 mr-2" />
                          Retomar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="font-semibold text-lg mt-4 mb-1">
                  {campaign.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {campaign.description}
                </p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progresso</span>
                      <Badge className={statusConfig[campaign.status].color}>
                        {statusConfig[campaign.status].label}
                      </Badge>
                    </div>
                    <Progress value={campaign.progress} className="h-2" />
                  </div>

                  <div className="flex gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Destinatários</p>
                      <p className="font-medium">{campaign.recipients}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Entregues</p>
                      <p className="font-medium">{campaign.delivered}</p>
                    </div>
                    {campaign.opened && (
                      <div>
                        <p className="text-muted-foreground">Abertos</p>
                        <p className="font-medium">{campaign.opened}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between p-4 bg-muted/20 border-t">
                <span className="text-xs text-muted-foreground">
                  {campaign.date}
                </span>
                <Button variant="ghost" size="sm" className="h-8 gap-1">
                  Detalhes
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
