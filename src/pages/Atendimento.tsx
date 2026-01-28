import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ConversationsList } from "@/components/omnichannel/ConversationsList";
import { ConversationView } from "@/components/omnichannel/ConversationView";
import { CaseInfoPanel } from "@/components/omnichannel/CaseInfoPanel";
import { useServiceSession } from "@/hooks/useServiceSession";
import { toast } from "sonner";

// Dados mock de casos
const mockCases: Record<string, {
  protocol?: string;
  type?: string;
  category?: string;
  description?: string;
  status?: string;
  client: {
    name: string;
    email?: string;
    phone?: string;
    cpf?: string;
    address?: string;
    avatar?: string;
  };
}> = {
  "1": {
    protocol: "REC-2025-000123",
    type: "Reclamação",
    category: "Entrega",
    description: "Cliente relata atraso na entrega do pedido #12345, que deveria ter chegado há 7 dias úteis.",
    status: "em_andamento",
    client: {
      name: "Maria Oliveira",
      email: "maria.oliveira@email.com",
      phone: "(11) 98765-4321",
      cpf: "123.456.789-00",
      address: "Av. Paulista, 1000, apto 123\nBela Vista, São Paulo - SP\nCEP 01310-100",
      avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    },
  },
  "2": {
    protocol: "REC-2025-000124",
    type: "Dúvida",
    category: "Prazo",
    description: "Consulta sobre prazo de entrega para CEP específico.",
    status: "novo",
    client: {
      name: "João Silva",
      email: "joao.silva@email.com",
      phone: "(11) 91234-5678",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
    },
  },
  "3": {
    protocol: "REC-2025-000125",
    type: "Reclamação",
    category: "Reembolso",
    description: "Solicitação de reembolso para produto com defeito.",
    status: "em_andamento",
    client: {
      name: "Ana Costa",
      email: "ana.costa@email.com",
      phone: "(11) 99876-5432",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    },
  },
};

export default function Atendimento() {
  const [selectedConversation, setSelectedConversation] = useState<string>("1");
  const [showCasePanel, setShowCasePanel] = useState(true);
  const [currentSentiment, setCurrentSentiment] = useState<"positive" | "neutral" | "frustrated" | "angry" | null>("neutral");

  const {
    currentSession,
    isLoading: sessionLoading,
    formattedDuration,
    startSession,
    endSession,
    forwardToStep,
  } = useServiceSession();

  // Iniciar sessão ao selecionar conversa
  useEffect(() => {
    if (selectedConversation) {
      startSession(selectedConversation);
    }
  }, [selectedConversation, startSession]);

  // Dados do caso atual
  const currentCase = useMemo(() => {
    const caseData = mockCases[selectedConversation];
    if (!caseData) return null;
    return {
      id: selectedConversation,
      ...caseData,
    };
  }, [selectedConversation]);

  const handleForward = async (stepId: string, notes: string, summary?: string) => {
    const success = await forwardToStep(stepId, notes, summary);
    if (success) {
      toast.success("Atendimento encaminhado com sucesso!");
    } else {
      toast.error("Erro ao encaminhar atendimento");
    }
    return success;
  };

  const handleEndSession = async () => {
    const success = await endSession();
    if (success) {
      toast.success("Atendimento finalizado com sucesso!");
    } else {
      toast.error("Erro ao finalizar atendimento");
    }
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-130px)] overflow-hidden flex border rounded-lg bg-background">
        {/* Lista de conversas */}
        <div className="w-[350px] flex-shrink-0">
          <ConversationsList
            onSelect={setSelectedConversation}
            selectedId={selectedConversation}
          />
        </div>

        {/* Área de conversa */}
        <div className="flex-grow">
          <ConversationView
            conversationId={selectedConversation}
            onForward={handleForward}
            onEndSession={handleEndSession}
            hasActiveSession={currentSession?.status === "active"}
          />
        </div>

        {/* Painel do Caso */}
        {showCasePanel && (
          <CaseInfoPanel
            caseData={currentCase}
            formattedDuration={formattedDuration}
            isSessionActive={currentSession?.status === "active"}
            sentiment={currentSentiment}
            onClose={() => setShowCasePanel(false)}
          />
        )}
      </div>
    </MainLayout>
  );
}
