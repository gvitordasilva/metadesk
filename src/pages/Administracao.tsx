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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Settings,
  Lock,
  MoreHorizontal,
  UserPlus,
  Key,
  FolderTree,
  Bot,
} from "lucide-react";
import { WorkflowManager } from "@/components/admin/WorkflowManager";
import { ChatbotManager } from "@/components/admin/ChatbotManager";

export default function Administracao() {
  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Administração</h1>
            <p className="text-muted-foreground">
              Configurações e gerenciamento do sistema
            </p>
          </div>
        </div>

        <Tabs defaultValue="usuarios" className="mb-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="perfis" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Perfis
            </TabsTrigger>
            <TabsTrigger
              value="estrutura"
              className="flex items-center gap-2"
            >
              <FolderTree className="h-4 w-4" />
              Estrutura
            </TabsTrigger>
            <TabsTrigger
              value="chatbot"
              className="flex items-center gap-2"
            >
              <Bot className="h-4 w-4" />
              Chatbot
            </TabsTrigger>
            <TabsTrigger
              value="configuracoes"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="mt-6">
            <div className="flex justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Usuários do Sistema</h2>
                <p className="text-muted-foreground">
                  Gerenciamento de contas e acessos
                </p>
              </div>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Último Acesso</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                            MS
                          </div>
                          <span>Mariana Silva</span>
                        </div>
                      </TableCell>
                      <TableCell>mariana.silva@metadesk.com</TableCell>
                      <TableCell>Administrador</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          Ativo
                        </Badge>
                      </TableCell>
                      <TableCell>15/05/2025 14:30</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Redefinir senha</DropdownMenuItem>
                            <DropdownMenuItem>Desativar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                            CO
                          </div>
                          <span>Carlos Oliveira</span>
                        </div>
                      </TableCell>
                      <TableCell>carlos.oliveira@metadesk.com</TableCell>
                      <TableCell>Supervisor</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          Ativo
                        </Badge>
                      </TableCell>
                      <TableCell>15/05/2025 13:45</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Redefinir senha</DropdownMenuItem>
                            <DropdownMenuItem>Desativar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                            JC
                          </div>
                          <span>Juliana Costa</span>
                        </div>
                      </TableCell>
                      <TableCell>juliana.costa@metadesk.com</TableCell>
                      <TableCell>Atendente</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          Ativo
                        </Badge>
                      </TableCell>
                      <TableCell>15/05/2025 11:20</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Redefinir senha</DropdownMenuItem>
                            <DropdownMenuItem>Desativar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            RS
                          </div>
                          <span>Roberto Santos</span>
                        </div>
                      </TableCell>
                      <TableCell>roberto.santos@metadesk.com</TableCell>
                      <TableCell>Atendente</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-muted-foreground">
                          Inativo
                        </Badge>
                      </TableCell>
                      <TableCell>10/05/2025 09:15</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Redefinir senha</DropdownMenuItem>
                            <DropdownMenuItem>Ativar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="perfis" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Administrador</CardTitle>
                  <CardDescription>Acesso total ao sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge className="mr-1">Atendimento</Badge>
                    <Badge className="mr-1">Solicitações</Badge>
                    <Badge className="mr-1">Conteúdo</Badge>
                    <Badge className="mr-1">Campanhas</Badge>
                    <Badge className="mr-1">Monitoramento</Badge>
                    <Badge className="mr-1">Administração</Badge>
                  </div>
                  <div className="mt-6">
                    <Button variant="outline" className="w-full">
                      Editar Permissões
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Supervisor</CardTitle>
                  <CardDescription>
                    Monitora e gerencia equipe de atendimento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge className="mr-1">Atendimento</Badge>
                    <Badge className="mr-1">Solicitações</Badge>
                    <Badge className="mr-1">Conteúdo</Badge>
                    <Badge className="mr-1">Campanhas</Badge>
                    <Badge className="mr-1">Monitoramento</Badge>
                  </div>
                  <div className="mt-6">
                    <Button variant="outline" className="w-full">
                      Editar Permissões
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Atendente</CardTitle>
                  <CardDescription>
                    Realiza atendimentos e registra solicitações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge className="mr-1">Atendimento</Badge>
                    <Badge className="mr-1">Solicitações</Badge>
                    <Badge className="mr-1">Conteúdo (leitura)</Badge>
                  </div>
                  <div className="mt-6">
                    <Button variant="outline" className="w-full">
                      Editar Permissões
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="estrutura" className="mt-6">
            <WorkflowManager />
          </TabsContent>

          <TabsContent value="chatbot" className="mt-6">
            <ChatbotManager />
          </TabsContent>

          <TabsContent value="configuracoes" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Segurança</CardTitle>
                  <CardDescription>
                    Políticas de acesso e autenticação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="mr-2">
                    <Lock className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Personalização</CardTitle>
                  <CardDescription>
                    Customize a aparência e comportamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="mr-2">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
