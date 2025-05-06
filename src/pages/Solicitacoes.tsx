
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  ArrowUpDown,
} from "lucide-react";

type Solicitacao = {
  protocolo: string;
  cliente: string;
  assunto: string;
  tipo: string;
  status: "aberto" | "em_andamento" | "pendente" | "resolvido" | "fechado";
  prioridade: "baixa" | "media" | "alta" | "critica";
  data: string;
  responsavel: string;
};

const solicitacoes: Solicitacao[] = [
  {
    protocolo: "SOL-123456",
    cliente: "Maria Oliveira",
    assunto: "Problema com entrega",
    tipo: "Entrega",
    status: "em_andamento",
    prioridade: "alta",
    data: "15/05/2025",
    responsavel: "Carlos Santos",
  },
  {
    protocolo: "SOL-123457",
    cliente: "João Silva",
    assunto: "Dúvida sobre faturamento",
    tipo: "Financeiro",
    status: "aberto",
    prioridade: "media",
    data: "15/05/2025",
    responsavel: "Ana Costa",
  },
  {
    protocolo: "SOL-123458",
    cliente: "Fernanda Lima",
    assunto: "Solicitação de reembolso",
    tipo: "Financeiro",
    status: "pendente",
    prioridade: "media",
    data: "14/05/2025",
    responsavel: "Roberto Almeida",
  },
  {
    protocolo: "SOL-123459",
    cliente: "Pedro Souza",
    assunto: "Produto com defeito",
    tipo: "Suporte",
    status: "aberto",
    prioridade: "critica",
    data: "14/05/2025",
    responsavel: "Juliana Costa",
  },
  {
    protocolo: "SOL-123460",
    cliente: "Luiza Ferreira",
    assunto: "Cancelamento de assinatura",
    tipo: "Administrativo",
    status: "resolvido",
    prioridade: "baixa",
    data: "13/05/2025",
    responsavel: "Eduardo Santos",
  },
  {
    protocolo: "SOL-123461",
    cliente: "Ricardo Gomes",
    assunto: "Problema de acesso ao sistema",
    tipo: "Suporte",
    status: "fechado",
    prioridade: "alta",
    data: "12/05/2025",
    responsavel: "Mariana Silva",
  },
];

const statusConfig = {
  aberto: { label: "Aberto", color: "bg-blue-500" },
  em_andamento: { label: "Em andamento", color: "bg-yellow-500" },
  pendente: { label: "Pendente", color: "bg-orange-500" },
  resolvido: { label: "Resolvido", color: "bg-green-500" },
  fechado: { label: "Fechado", color: "bg-gray-500" },
};

const prioridadeConfig = {
  baixa: { label: "Baixa", color: "bg-blue-100 text-blue-800" },
  media: { label: "Média", color: "bg-yellow-100 text-yellow-800" },
  alta: { label: "Alta", color: "bg-orange-100 text-orange-800" },
  critica: { label: "Crítica", color: "bg-red-100 text-red-800" },
};

export default function Solicitacoes() {
  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Solicitações</h1>
            <p className="text-muted-foreground">
              Gerenciamento de solicitações e protocolos
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Solicitação
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-grow relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por protocolo, cliente, assunto..."
              className="pl-8"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Período
          </Button>
        </div>

        <div className="rounded-lg border bg-background overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Protocolo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead className="w-[100px]">
                  <div className="flex items-center">
                    Data
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitacoes.map((solicitacao) => (
                <TableRow key={solicitacao.protocolo}>
                  <TableCell className="font-medium">
                    {solicitacao.protocolo}
                  </TableCell>
                  <TableCell>{solicitacao.cliente}</TableCell>
                  <TableCell>{solicitacao.assunto}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{solicitacao.tipo}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          statusConfig[solicitacao.status].color
                        }`}
                      ></span>
                      <span>{statusConfig[solicitacao.status].label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        prioridadeConfig[solicitacao.prioridade].color
                      }
                      variant="secondary"
                    >
                      {prioridadeConfig[solicitacao.prioridade].label}
                    </Badge>
                  </TableCell>
                  <TableCell>{solicitacao.data}</TableCell>
                  <TableCell>{solicitacao.responsavel}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Visualizar detalhes</DropdownMenuItem>
                        <DropdownMenuItem>Atualizar status</DropdownMenuItem>
                        <DropdownMenuItem>
                          Transferir responsável
                        </DropdownMenuItem>
                        <DropdownMenuItem>Adicionar comentário</DropdownMenuItem>
                        <DropdownMenuItem>Encerrar solicitação</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
