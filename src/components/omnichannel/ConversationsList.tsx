import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  MessageSquare,
  MailOpen,
  Phone,
  MessageCircle,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WaitingTimeIndicator } from "./WaitingTimeIndicator";

type Conversation = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  channel: "whatsapp" | "email" | "chat" | "phone";
  avatar: string;
  waitingSince: Date;
};

// Dados mock com tempo de espera simulado
const generateConversations = (): Conversation[] => {
  const now = Date.now();
  return [
    {
      id: "1",
      name: "Maria Oliveira",
      lastMessage: "Olá, preciso de ajuda com meu pedido #12345",
      time: "12:30",
      unread: 3,
      channel: "whatsapp",
      avatar: "https://randomuser.me/api/portraits/women/12.jpg",
      waitingSince: new Date(now - 25 * 60 * 1000), // 25 minutos
    },
    {
      id: "2",
      name: "João Silva",
      lastMessage: "Qual o prazo de entrega para o CEP 12345-678?",
      time: "11:45",
      unread: 0,
      channel: "chat",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      waitingSince: new Date(now - 8 * 60 * 1000), // 8 minutos
    },
    {
      id: "3",
      name: "Ana Costa",
      lastMessage: "Solicitação de reembolso enviada",
      time: "10:20",
      unread: 1,
      channel: "email",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg",
      waitingSince: new Date(now - 2 * 60 * 1000), // 2 minutos
    },
    {
      id: "4",
      name: "Carlos Santos",
      lastMessage: "Ligação finalizada (Duração: 5:32)",
      time: "09:15",
      unread: 0,
      channel: "phone",
      avatar: "https://randomuser.me/api/portraits/men/41.jpg",
      waitingSince: new Date(now - 45 * 60 * 1000), // 45 minutos
    },
    {
      id: "5",
      name: "Fernanda Lima",
      lastMessage: "Obrigada pelo atendimento!",
      time: "Ontem",
      unread: 0,
      channel: "whatsapp",
      avatar: "https://randomuser.me/api/portraits/women/54.jpg",
      waitingSince: new Date(now - 12 * 60 * 1000), // 12 minutos
    },
    {
      id: "6",
      name: "Roberto Almeida",
      lastMessage: "Consegui resolver o problema, muito obrigado",
      time: "Ontem",
      unread: 0,
      channel: "chat",
      avatar: "https://randomuser.me/api/portraits/men/65.jpg",
      waitingSince: new Date(now - 3 * 60 * 1000), // 3 minutos
    },
  ];
};

const channelIcons = {
  whatsapp: <MessageSquare className="h-4 w-4 text-[#25D366]" />,
  email: <MailOpen className="h-4 w-4 text-[#a18aff]" />,
  chat: <MessageCircle className="h-4 w-4 text-[#7ae4ff]" />,
  phone: <Phone className="h-4 w-4 text-[#f5ff55]" />,
};

type ConversationsListProps = {
  onSelect: (id: string) => void;
  selectedId?: string;
};

export function ConversationsList({
  onSelect,
  selectedId,
}: ConversationsListProps) {
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const conversations = useMemo(() => generateConversations(), []);

  // Filtrar por canal e busca
  const filteredConversations = useMemo(() => {
    let result = filter === "all"
      ? conversations
      : conversations.filter((conv) => conv.channel === filter);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (conv) =>
          conv.name.toLowerCase().includes(term) ||
          conv.lastMessage.toLowerCase().includes(term)
      );
    }

    return result;
  }, [conversations, filter, searchTerm]);

  // Ordenar por tempo de espera (maior tempo primeiro)
  const sortedConversations = useMemo(() => {
    return [...filteredConversations].sort((a, b) => {
      const aMinutes = Math.floor((Date.now() - a.waitingSince.getTime()) / 60000);
      const bMinutes = Math.floor((Date.now() - b.waitingSince.getTime()) / 60000);
      return bMinutes - aMinutes; // Maior tempo primeiro
    });
  }, [filteredConversations]);

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar conversas..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button size="icon" variant="outline">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="all" onClick={() => setFilter("all")}>
              Todos
            </TabsTrigger>
            <TabsTrigger
              value="whatsapp"
              onClick={() => setFilter("whatsapp")}
              className="flex items-center gap-1"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              onClick={() => setFilter("chat")}
              className="flex items-center gap-1"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </TabsTrigger>
            <TabsTrigger
              value="email"
              onClick={() => setFilter("email")}
              className="flex items-center gap-1"
            >
              <MailOpen className="h-3.5 w-3.5" />
            </TabsTrigger>
            <TabsTrigger
              value="phone"
              onClick={() => setFilter("phone")}
              className="flex items-center gap-1"
            >
              <Phone className="h-3.5 w-3.5" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className="divide-y">
          {sortedConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                selectedId === conversation.id && "bg-primary/10"
              )}
              onClick={() => onSelect(conversation.id)}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img
                    src={conversation.avatar}
                    alt={conversation.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                    {channelIcons[conversation.channel]}
                  </div>
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-medium truncate">{conversation.name}</h4>
                    <WaitingTimeIndicator
                      waitingSince={conversation.waitingSince}
                      size="sm"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage}
                  </p>
                </div>
                {conversation.unread > 0 && (
                  <Badge className="bg-metadesk-green ml-2 flex-shrink-0">
                    {conversation.unread}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
