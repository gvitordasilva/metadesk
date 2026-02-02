import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Paperclip,
  Send,
  Phone,
  Video,
  Clipboard,
  Archive,
  PanelRight,
  Smile,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConversationToolbar } from "./ConversationToolbar";
import { QuickMessagesPanel } from "./QuickMessagesPanel";
import { ForwardModal } from "./ForwardModal";
import { WhatsAppChat } from "@/components/whatsapp/WhatsAppChat";
import { useServiceQueue } from "@/hooks/useServiceQueue";
import { toast } from "sonner";

type Message = {
  id: string;
  text: string;
  sender: "user" | "agent";
  time: string;
};

const messages: Message[] = [
  {
    id: "1",
    text: "Olá! Preciso de ajuda com meu pedido #12345. Ele ainda não chegou e já se passaram 7 dias úteis.",
    sender: "user",
    time: "12:30",
  },
  {
    id: "2",
    text: "Olá Maria, tudo bem? Sou o Carlos e vou te ajudar hoje. Vou verificar o status do seu pedido #12345.",
    sender: "agent",
    time: "12:31",
  },
  {
    id: "3",
    text: "Obrigada Carlos, estou aguardando.",
    sender: "user",
    time: "12:32",
  },
  {
    id: "4",
    text: "Maria, verifiquei aqui e seu pedido está em trânsito. A transportadora informou que houve um atraso devido a problemas logísticos, mas a entrega está prevista para amanhã. Posso enviar o código de rastreamento atualizado para você acompanhar?",
    sender: "agent",
    time: "12:35",
  },
  {
    id: "5",
    text: "Sim, por favor. Estou precisando do produto com urgência.",
    sender: "user",
    time: "12:36",
  },
  {
    id: "6",
    text: "Compreendo sua urgência. O código de rastreamento é TR123456789BR. Você pode acompanhar pelo site da transportadora ou pelo nosso aplicativo. Além disso, registrei a prioridade do seu caso e solicitei à transportadora atenção especial. Posso fazer mais alguma coisa para ajudar?",
    sender: "agent",
    time: "12:38",
  },
];

type ToolbarMode = "chat" | "documents" | "quick-messages";

type ConversationViewProps = {
  conversationId: string;
  onForward?: (stepId: string, notes: string, summary?: string) => Promise<boolean>;
  onEndSession?: () => void;
  hasActiveSession?: boolean;
};

export function ConversationView({
  conversationId,
  onForward,
  onEndSession,
  hasActiveSession = false,
}: ConversationViewProps) {
  const [newMessage, setNewMessage] = useState("");
  const [activeMode, setActiveMode] = useState<ToolbarMode>("chat");
  const [showForwardModal, setShowForwardModal] = useState(false);

  // Get queue item to check channel type
  const { data: queueItems = [] } = useServiceQueue({ excludeCompleted: false });
  const currentQueueItem = queueItems.find(item => item.id === conversationId);
  const isWhatsAppTwilio = currentQueueItem?.channel === "twilio_whatsapp";
  const whatsappConversationId = currentQueueItem?.whatsapp_conversation_id;

  const handleSend = () => {
    if (newMessage.trim()) {
      console.log("Sending:", newMessage);
      setNewMessage("");
    }
  };

  const handleInsertQuickMessage = (content: string) => {
    setNewMessage((prev) => {
      if (prev.trim()) {
        return prev + "\n" + content;
      }
      return content;
    });
    setActiveMode("chat");
    toast.success("Mensagem inserida");
  };

  const handleForward = async (stepId: string, notes: string, summary?: string) => {
    if (onForward) {
      return await onForward(stepId, notes, summary);
    }
    // Fallback se não houver handler
    toast.success("Atendimento encaminhado com sucesso!");
    return true;
  };

  const handleEndSession = () => {
    if (onEndSession) {
      onEndSession();
    }
    toast.success("Atendimento finalizado com sucesso!");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="https://randomuser.me/api/portraits/women/12.jpg"
              alt="Maria Oliveira"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className="font-medium">Maria Oliveira</h3>
              <p className="text-xs text-muted-foreground">
                Cliente desde jan/2023 • 5 atendimentos anteriores
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ligar</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Video className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Videochamada</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Nova solicitação</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Archive className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Arquivar conversa</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Toolbar de ferramentas */}
      <ConversationToolbar
        activeMode={activeMode}
        onModeChange={setActiveMode}
        onForwardClick={() => setShowForwardModal(true)}
        onEndSession={handleEndSession}
        hasActiveSession={hasActiveSession}
      />

      {/* Área de conteúdo principal */}
      <div className="flex-grow flex overflow-hidden">
        {/* Área de chat/documentos */}
        <div className="flex-grow flex flex-col">
          {activeMode === "chat" && isWhatsAppTwilio && whatsappConversationId && (
            <WhatsAppChat
              conversationId={whatsappConversationId}
              phoneNumber={currentQueueItem?.customer_phone || undefined}
            />
          )}

          {activeMode === "chat" && !isWhatsAppTwilio && (
            <>
              <div className="bg-muted/20 p-4 border-b">
                <Tabs defaultValue="atendimento">
                  <TabsList>
                    <TabsTrigger value="atendimento">Atendimento</TabsTrigger>
                    <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
                    <TabsTrigger value="historico">Histórico</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex-grow overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="text-center text-xs text-muted-foreground">
                    Hoje, 15 de maio de 2025
                  </div>

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.sender === "user" ? "justify-start" : "justify-end"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-lg p-3",
                          message.sender === "user"
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {message.sender === "agent" && (
                            <span className="text-xs font-medium">Carlos</span>
                          )}
                          <span className="text-xs opacity-70">{message.time}</span>
                        </div>
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    className="min-h-[60px]"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Anexar arquivo</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Smile className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Emoji</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={handleSend}>
                            <Send className="h-4 w-4 mr-2" />
                            Enviar
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Enviar mensagem</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeMode === "documents" && (
            <div className="flex-grow flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <PanelRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Documentos do Caso</h3>
                <p className="text-sm">Nenhum documento anexado ainda.</p>
              </div>
            </div>
          )}
        </div>

        {/* Painel de mensagens rápidas */}
        {activeMode === "quick-messages" && (
          <div className="w-80 border-l">
            <QuickMessagesPanel
              onSelect={handleInsertQuickMessage}
              onClose={() => setActiveMode("chat")}
            />
          </div>
        )}
      </div>

      {/* Modal de encaminhamento */}
      <ForwardModal
        open={showForwardModal}
        onOpenChange={setShowForwardModal}
        onForward={handleForward}
      />
    </div>
  );
}
