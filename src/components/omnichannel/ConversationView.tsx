
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Paperclip,
  Send,
  User,
  Info,
  Clipboard,
  Archive,
  Phone,
  Video,
  Smile,
  PanelRight,
} from "lucide-react";

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

type ConversationViewProps = {
  conversationId: string;
};

export function ConversationView({ conversationId }: ConversationViewProps) {
  const [newMessage, setNewMessage] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);

  const handleSend = () => {
    if (newMessage.trim()) {
      console.log("Sending:", newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-full">
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

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setInfoOpen(!infoOpen)}
                    className={cn(infoOpen && "bg-muted")}
                  >
                    <PanelRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Informações do cliente</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

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

      {infoOpen && (
        <div className="w-80 border-l h-full overflow-y-auto animate-fade-in">
          <div className="p-4 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Informações do Cliente</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInfoOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <div className="flex flex-col items-center mb-6">
              <img
                src="https://randomuser.me/api/portraits/women/12.jpg"
                alt="Maria Oliveira"
                className="w-16 h-16 rounded-full mb-2"
              />
              <h4 className="font-medium">Maria Oliveira</h4>
              <p className="text-sm text-muted-foreground">
                ID: 123456789
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Dados de Contato</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    maria.oliveira@email.com
                  </p>
                  <p>
                    <span className="text-muted-foreground">Telefone:</span>{" "}
                    (11) 98765-4321
                  </p>
                  <p>
                    <span className="text-muted-foreground">CPF:</span>{" "}
                    123.456.789-00
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Endereço</h4>
                <p className="text-sm">
                  Av. Paulista, 1000, apto 123
                  <br />
                  Bela Vista, São Paulo - SP
                  <br />
                  CEP 01310-100
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Solicitações Ativas</h4>
                <div className="space-y-2">
                  <div className="bg-muted p-2 rounded-md text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">#12345</span>
                      <Badge variant="outline" className="text-[10px]">
                        Entrega
                      </Badge>
                    </div>
                    <p className="mb-1">Problema com entrega de pedido</p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">15/05/2025</span>
                      <span className="text-yellow-500">Em andamento</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
