import { useState, useCallback, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff, Phone, PhoneOff, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ELEVENLABS_AGENT_ID = "agent_2001kfzvc45yfwstqcvp7a43kc59";

interface StepVoiceAgentProps {
  onBack: () => void;
  onComplete?: (protocolNumber: string) => void;
}

export function StepVoiceAgent({ onBack, onComplete }: StepVoiceAgentProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const queueItemIdRef = useRef<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      toast({
        title: "Conectado",
        description: "Você está conectado ao agente. Pode começar a falar.",
      });
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
    },
    onMessage: (message) => {
      console.log("Message from agent:", message);
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      toast({
        variant: "destructive",
        title: "Erro na conexão",
        description: "Não foi possível conectar ao agente de voz. Tente novamente.",
      });
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token from edge function
      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token",
        {
          body: { agentId: ELEVENLABS_AGENT_ID },
        }
      );

      if (error || !data?.token) {
        throw new Error(error?.message || "Não foi possível obter o token de conexão");
      }

      // Start the conversation with WebRTC
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });

      // Add to service queue for tracking
      try {
        const { data: queueData, error: queueError } = await supabase
          .from("service_queue")
          .insert({
            channel: "voice",
            status: "in_progress",
            priority: 2,
            customer_name: "Atendimento por Voz",
            subject: "Atendimento via Agente IA",
            voice_session_id: data.token,
            waiting_since: new Date().toISOString(),
          })
          .select()
          .single();

        if (!queueError && queueData) {
          queueItemIdRef.current = queueData.id;
        }
      } catch (queueErr) {
        console.error("Failed to add to service queue:", queueErr);
        // Don't fail if queue insert fails
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
      
      if (error instanceof Error && error.name === "NotAllowedError") {
        toast({
          variant: "destructive",
          title: "Microfone necessário",
          description: "Por favor, permita o acesso ao microfone para usar o atendimento por voz.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao conectar",
          description: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, toast]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    
    // Update queue item status
    if (queueItemIdRef.current) {
      try {
        await supabase
          .from("service_queue")
          .update({ status: "completed" })
          .eq("id", queueItemIdRef.current);
      } catch (err) {
        console.error("Failed to update queue status:", err);
      }
    }
    
    toast({
      title: "Conversa encerrada",
      description: "Obrigado por utilizar nosso atendimento por voz.",
    });
  }, [conversation, toast]);

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Atendimento por Voz
        </h2>
        <p className="text-muted-foreground">
          {isConnected
            ? "Converse com nossa IA para registrar sua manifestação"
            : "Clique para iniciar a conversa com nossa IA"}
        </p>
      </div>

      {/* Voice visualization */}
      <div className="flex flex-col items-center justify-center py-12">
        <div
          className={cn(
            "relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300",
            isConnected
              ? isSpeaking
                ? "bg-primary/20 animate-pulse"
                : "bg-primary/10"
              : "bg-muted"
          )}
        >
          {/* Pulse rings when speaking */}
          {isConnected && isSpeaking && (
            <>
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-primary/15 animate-ping animation-delay-100" />
            </>
          )}
          
          <div
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-colors",
              isConnected
                ? isSpeaking
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/80 text-primary-foreground"
                : "bg-muted-foreground/20 text-muted-foreground"
            )}
          >
            {isConnected ? (
              isSpeaking ? (
                <Mic className="w-10 h-10" />
              ) : (
                <MicOff className="w-10 h-10" />
              )
            ) : (
              <Phone className="w-10 h-10" />
            )}
          </div>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          {isConnected
            ? isSpeaking
              ? "Agente está falando..."
              : "Agente está ouvindo você..."
            : "Pronto para iniciar"}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {!isConnected ? (
          <>
            <Button
              variant="outline"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <Button
              onClick={startConversation}
              disabled={isConnecting}
              className="gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  Iniciar Conversa
                </>
              )}
            </Button>
          </>
        ) : (
          <Button
            variant="destructive"
            onClick={stopConversation}
            className="gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            Encerrar Conversa
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-muted/50 rounded-lg p-4 mt-6">
        <h4 className="font-medium text-foreground mb-2">Como funciona:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>1. Clique em "Iniciar Conversa" e permita o acesso ao microfone</li>
          <li>2. Converse naturalmente com nossa IA sobre sua manifestação</li>
          <li>3. A IA irá coletar todas as informações necessárias</li>
          <li>4. Ao finalizar, você receberá seu número de protocolo</li>
        </ul>
      </div>
    </div>
  );
}
