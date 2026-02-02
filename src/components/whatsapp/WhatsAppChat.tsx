import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Phone,
  MoreVertical,
  Check,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useWhatsAppMessages,
  useWhatsAppConversation,
  useSendWhatsAppMessage,
  WhatsAppMessage,
} from "@/hooks/useWhatsAppChat";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface WhatsAppChatProps {
  conversationId: string | null;
  phoneNumber?: string;
}

export function WhatsAppChat({ conversationId, phoneNumber }: WhatsAppChatProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading: messagesLoading } = useWhatsAppMessages(conversationId);
  const { data: conversation, isLoading: conversationLoading } = useWhatsAppConversation(conversationId);
  const sendMessage = useSendWhatsAppMessage();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !conversationId || !conversation) return;

    const phone = phoneNumber || conversation.phone_number;

    try {
      await sendMessage.mutateAsync({
        conversationId,
        phoneNumber: phone,
        message: message.trim(),
      });
      setMessage("");
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Selecione uma conversa para visualizar</p>
      </div>
    );
  }

  if (messagesLoading || conversationLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const contactName = conversation?.customer_name || conversation?.phone_number || "Cliente";
  const contactInitial = contactName.charAt(0).toUpperCase();
  const contactAvatar = conversation?.profile_picture_url || conversation?.contact?.profile_picture_url;

  return (
    <div className="flex flex-col h-full bg-[#0b141a]">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 bg-[#202c33] border-b border-[#2a3942]">
        <Avatar className="h-10 w-10">
          <AvatarImage src={contactAvatar || undefined} />
          <AvatarFallback className="bg-[#00a884] text-white">
            {contactInitial}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-medium text-[#e9edef]">{contactName}</h3>
          <p className="text-xs text-[#8696a0]">
            {conversation?.phone_number}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-[#aebac1] hover:bg-[#2a3942]">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-[#aebac1] hover:bg-[#2a3942]">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" style={{ backgroundImage: "url('/whatsapp-bg.png')", backgroundColor: "#0b141a" }}>
        <div className="space-y-2 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center text-[#8696a0] py-8">
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">As mensagens aparecerão aqui</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 bg-[#202c33] border-t border-[#2a3942]">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <Button variant="ghost" size="icon" className="text-[#8696a0] hover:bg-[#2a3942]">
            <Smile className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-[#8696a0] hover:bg-[#2a3942]">
            <Paperclip className="h-6 w-6" />
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Digite uma mensagem"
            className="flex-1 bg-[#2a3942] border-none text-[#d1d7db] placeholder:text-[#8696a0] focus-visible:ring-0"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            size="icon"
            className="bg-[#00a884] hover:bg-[#06cf9c] text-white"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: WhatsAppMessage }) {
  const isOutbound = message.direction === "outbound";
  const time = format(new Date(message.created_at), "HH:mm", { locale: ptBR });

  return (
    <div className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[65%] rounded-lg px-3 py-2 shadow-sm",
          isOutbound
            ? "bg-[#005c4b] text-[#e9edef]"
            : "bg-[#202c33] text-[#e9edef]"
        )}
      >
        {/* Media content */}
        {message.media_url && message.message_type === "image" && (
          <div className="mb-2">
            <img
              src={message.media_url}
              alt="Imagem"
              className="rounded-lg max-w-full"
            />
          </div>
        )}

        {message.media_url && message.message_type === "audio" && (
          <div className="mb-2">
            <audio controls className="max-w-full">
              <source src={message.media_url} type={message.media_type || "audio/ogg"} />
            </audio>
          </div>
        )}

        {message.media_url && message.message_type === "video" && (
          <div className="mb-2">
            <video controls className="rounded-lg max-w-full">
              <source src={message.media_url} type={message.media_type || "video/mp4"} />
            </video>
          </div>
        )}

        {message.media_url && message.message_type === "document" && (
          <div className="mb-2">
            <a
              href={message.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#53bdeb] hover:underline"
            >
              <Paperclip className="h-4 w-4" />
              <span>Documento</span>
            </a>
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {/* Time and status */}
        <div className={cn("flex items-center gap-1 mt-1", isOutbound ? "justify-end" : "justify-start")}>
          <span className="text-[10px] text-[#8696a0]">{time}</span>
          {isOutbound && (
            <MessageStatus status={message.status} />
          )}
        </div>
      </div>
    </div>
  );
}

function MessageStatus({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <Loader2 className="h-3 w-3 text-[#8696a0] animate-spin" />;
    case "sent":
      return <Check className="h-3 w-3 text-[#8696a0]" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3 text-[#8696a0]" />;
    case "read":
      return <CheckCheck className="h-3 w-3 text-[#53bdeb]" />;
    case "failed":
      return <span className="text-[10px] text-red-500">!</span>;
    default:
      return null;
  }
}
