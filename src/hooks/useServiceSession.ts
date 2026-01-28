import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ServiceSession = {
  id: string;
  complaint_id: string | null;
  conversation_id: string | null;
  attendant_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  ai_summary: string | null;
  ai_sentiment: string | null;
  forwarded_to_step_id: string | null;
  forward_notes: string | null;
  status: "active" | "completed" | "forwarded";
};

export function useServiceSession() {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<ServiceSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer para calcular tempo decorrido
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (currentSession && currentSession.status === "active") {
      const startTime = new Date(currentSession.started_at).getTime();
      
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession]);

  const startSession = useCallback(
    async (conversationId: string, complaintId?: string) => {
      if (!user) return null;

      setIsLoading(true);
      try {
        // Verificar se já existe sessão ativa para este atendente
        const { data: existingSession } = await supabase
          .from("service_sessions")
          .select("*")
          .eq("attendant_id", user.id)
          .eq("status", "active")
          .single();

        if (existingSession) {
          // Se existe, retornar a sessão existente
          setCurrentSession(existingSession as ServiceSession);
          return existingSession as ServiceSession;
        }

        // Criar nova sessão
        const { data, error } = await supabase
          .from("service_sessions")
          .insert({
            conversation_id: conversationId,
            complaint_id: complaintId || null,
            attendant_id: user.id,
            status: "active",
          })
          .select()
          .single();

        if (error) throw error;

        setCurrentSession(data as ServiceSession);
        setElapsedSeconds(0);
        return data as ServiceSession;
      } catch (error) {
        console.error("Erro ao iniciar sessão:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const endSession = useCallback(async () => {
    if (!currentSession) return false;

    setIsLoading(true);
    try {
      const endedAt = new Date().toISOString();
      const startedAt = new Date(currentSession.started_at).getTime();
      const durationSeconds = Math.floor((Date.now() - startedAt) / 1000);

      const { error } = await supabase
        .from("service_sessions")
        .update({
          ended_at: endedAt,
          duration_seconds: durationSeconds,
          status: "completed",
        })
        .eq("id", currentSession.id);

      if (error) throw error;

      setCurrentSession(null);
      setElapsedSeconds(0);
      return true;
    } catch (error) {
      console.error("Erro ao encerrar sessão:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const forwardToStep = useCallback(
    async (stepId: string, notes: string, summary?: string) => {
      if (!currentSession) return false;

      setIsLoading(true);
      try {
        const endedAt = new Date().toISOString();
        const startedAt = new Date(currentSession.started_at).getTime();
        const durationSeconds = Math.floor((Date.now() - startedAt) / 1000);

        const { error } = await supabase
          .from("service_sessions")
          .update({
            ended_at: endedAt,
            duration_seconds: durationSeconds,
            status: "forwarded",
            forwarded_to_step_id: stepId,
            forward_notes: notes,
            ai_summary: summary || null,
          })
          .eq("id", currentSession.id);

        if (error) throw error;

        // Se houver complaint_id, atualizar a etapa do fluxo na complaint
        if (currentSession.complaint_id) {
          await supabase
            .from("complaints")
            .update({
              current_workflow_step_id: stepId,
            })
            .eq("id", currentSession.complaint_id);
        }

        setCurrentSession(null);
        setElapsedSeconds(0);
        return true;
      } catch (error) {
        console.error("Erro ao encaminhar sessão:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [currentSession]
  );

  const updateSentiment = useCallback(
    async (sentiment: string) => {
      if (!currentSession) return false;

      try {
        const { error } = await supabase
          .from("service_sessions")
          .update({ ai_sentiment: sentiment })
          .eq("id", currentSession.id);

        if (error) throw error;

        setCurrentSession((prev) =>
          prev ? { ...prev, ai_sentiment: sentiment } : null
        );
        return true;
      } catch (error) {
        console.error("Erro ao atualizar sentimento:", error);
        return false;
      }
    },
    [currentSession]
  );

  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    currentSession,
    isLoading,
    elapsedSeconds,
    formattedDuration: formatDuration(elapsedSeconds),
    startSession,
    endSession,
    forwardToStep,
    updateSentiment,
  };
}
