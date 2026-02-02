import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ConversationsList } from "@/components/omnichannel/ConversationsList";
import { ConversationView } from "@/components/omnichannel/ConversationView";
import { CaseInfoPanel } from "@/components/omnichannel/CaseInfoPanel";
import { useServiceSession } from "@/hooks/useServiceSession";
import { useServiceQueue, ServiceQueueItem } from "@/hooks/useServiceQueue";
import { toast } from "sonner";


export default function Atendimento() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showCasePanel, setShowCasePanel] = useState(true);
  const [currentSentiment, setCurrentSentiment] = useState<"positive" | "neutral" | "frustrated" | "angry" | null>("neutral");

  // Buscar fila de atendimento
  const { data: queueItems = [] } = useServiceQueue({ excludeCompleted: true });

  const {
    currentSession,
    isLoading: sessionLoading,
    formattedDuration,
    startSession,
    endSession,
    forwardToStep,
  } = useServiceSession();

  // Selecionar primeira conversa automaticamente
  useEffect(() => {
    if (!selectedConversation && queueItems.length > 0) {
      setSelectedConversation(queueItems[0].id);
    }
  }, [selectedConversation, queueItems]);

  // Iniciar sessão ao selecionar conversa
  useEffect(() => {
    if (selectedConversation) {
      startSession(selectedConversation);
    }
  }, [selectedConversation, startSession]);

  // Dados do caso atual baseado na fila
  const currentCase = useMemo(() => {
    if (!selectedConversation) return null;
    
    const queueItem = queueItems.find(item => item.id === selectedConversation);
    if (!queueItem) return null;

    return {
      id: queueItem.id,
      protocol: queueItem.complaint_id ? `REC-${queueItem.created_at.slice(0, 10).replace(/-/g, '')}` : undefined,
      type: queueItem.channel === 'web' ? 'Reclamação' :
            queueItem.channel === 'voice' ? 'Atendimento por Voz' :
            queueItem.channel === 'twilio_voice' ? 'Chamada Twilio' :
            queueItem.channel === 'sms' ? 'SMS' :
            queueItem.channel === 'twilio_whatsapp' ? 'WhatsApp Twilio' :
            queueItem.channel === 'whatsapp' ? 'WhatsApp' :
            queueItem.channel,
      category: queueItem.subject,
      description: queueItem.last_message,
      status: queueItem.status,
      client: {
        name: queueItem.customer_name || "Anônimo",
        email: queueItem.customer_email,
        phone: queueItem.customer_phone,
        avatar: queueItem.customer_avatar,
      },
    };
  }, [selectedConversation, queueItems]);

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
          {selectedConversation ? (
            <ConversationView
              conversationId={selectedConversation}
              onForward={handleForward}
              onEndSession={handleEndSession}
              hasActiveSession={currentSession?.status === "active"}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>Selecione um atendimento para começar</p>
            </div>
          )}
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
