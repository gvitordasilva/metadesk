import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Bot,
  MessageSquare,
  Play,
  Pause,
  Trash2,
  Edit,
  Star,
} from "lucide-react";
import {
  useChatbotFlows,
  useCreateChatbotFlow,
  useDeleteChatbotFlow,
  useUpdateChatbotFlow,
  ChatbotFlow,
} from "@/hooks/useChatbotFlows";
import { ChatbotFlowEditor } from "./ChatbotFlowEditor";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ChatbotManager() {
  const { data: flows, isLoading } = useChatbotFlows();
  const createFlow = useCreateChatbotFlow();
  const deleteFlow = useDeleteChatbotFlow();
  const updateFlow = useUpdateChatbotFlow();

  const [selectedFlow, setSelectedFlow] = useState<ChatbotFlow | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState<ChatbotFlow | null>(null);

  const handleCreateFlow = async () => {
    try {
      const newFlow = await createFlow.mutateAsync({
        name: "Novo Fluxo",
        description: "Descrição do fluxo",
        channel: "all",
      });
      setSelectedFlow(newFlow);
      setIsEditorOpen(true);
      toast.success("Fluxo criado com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar fluxo");
    }
  };

  const handleDeleteFlow = async () => {
    if (!flowToDelete) return;

    try {
      await deleteFlow.mutateAsync(flowToDelete.id);
      setFlowToDelete(null);
      if (selectedFlow?.id === flowToDelete.id) {
        setSelectedFlow(null);
      }
      toast.success("Fluxo excluído com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir fluxo");
    }
  };

  const handleToggleActive = async (flow: ChatbotFlow) => {
    try {
      await updateFlow.mutateAsync({
        id: flow.id,
        is_active: !flow.is_active,
      });
      toast.success(
        flow.is_active ? "Fluxo desativado" : "Fluxo ativado"
      );
    } catch (error) {
      toast.error("Erro ao atualizar fluxo");
    }
  };

  const handleSetDefault = async (flow: ChatbotFlow) => {
    try {
      // First, unset all other defaults
      const otherDefaults = flows?.filter((f) => f.is_default && f.id !== flow.id) || [];
      await Promise.all(
        otherDefaults.map((f) =>
          updateFlow.mutateAsync({ id: f.id, is_default: false })
        )
      );

      // Then set this one as default
      await updateFlow.mutateAsync({
        id: flow.id,
        is_default: true,
      });
      toast.success("Fluxo definido como padrão");
    } catch (error) {
      toast.error("Erro ao definir fluxo padrão");
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case "whatsapp":
        return "WhatsApp";
      case "webchat":
        return "Webchat";
      case "all":
        return "Todos";
      default:
        return channel;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Fluxos de Chatbot</h2>
          <p className="text-muted-foreground">
            Crie e gerencie fluxos de atendimento automatizado
          </p>
        </div>
        <Button onClick={handleCreateFlow} disabled={createFlow.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Fluxo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : flows?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum fluxo criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro fluxo de chatbot para começar
            </p>
            <Button onClick={handleCreateFlow}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Fluxo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows?.map((flow) => (
            <Card
              key={flow.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedFlow?.id === flow.id ? "ring-2 ring-primary" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{flow.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {flow.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Padrão
                      </Badge>
                    )}
                    <Badge
                      variant={flow.is_active ? "default" : "outline"}
                      className="text-xs"
                    >
                      {flow.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {flow.description || "Sem descrição"}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {getChannelLabel(flow.channel)}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(flow);
                      }}
                      title={flow.is_active ? "Desativar" : "Ativar"}
                    >
                      {flow.is_active ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    {!flow.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(flow);
                        }}
                        title="Definir como padrão"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFlow(flow);
                        setIsEditorOpen(true);
                      }}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFlowToDelete(flow);
                      }}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Flow Editor Modal */}
      {selectedFlow && (
        <ChatbotFlowEditor
          flow={selectedFlow}
          open={isEditorOpen}
          onOpenChange={setIsEditorOpen}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!flowToDelete}
        onOpenChange={(open) => !open && setFlowToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fluxo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fluxo "{flowToDelete?.name}"?
              Esta ação não pode ser desfeita e todos os nós do fluxo serão
              removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFlow}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
