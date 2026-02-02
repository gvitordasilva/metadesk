import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type WhatsAppMessage = {
  id: string;
  conversation_id: string;
  message_sid: string | null;
  direction: "inbound" | "outbound";
  sender_type: "customer" | "agent" | "system" | "bot";
  sender_id: string | null;
  content: string | null;
  message_type: "text" | "image" | "audio" | "video" | "document" | "location" | "contact" | "sticker";
  media_url: string | null;
  media_type: string | null;
  media_caption: string | null;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type WhatsAppConversation = {
  id: string;
  phone_number: string;
  status: "active" | "escalated" | "completed" | "abandoned";
  customer_name: string | null;
  profile_picture_url: string | null;
  contact_id: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WhatsAppContact = {
  id: string;
  phone_number: string;
  profile_name: string | null;
  profile_picture_url: string | null;
  wa_id: string | null;
  first_contact_at: string | null;
  last_contact_at: string | null;
  total_conversations: number;
  created_at: string;
  updated_at: string;
};

export function useWhatsAppMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["whatsapp-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching WhatsApp messages:", error);
        throw error;
      }

      return (data || []) as WhatsAppMessage[];
    },
    enabled: !!conversationId,
    refetchInterval: 5000, // Backup polling
  });

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`whatsapp-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("WhatsApp message update:", payload);
          queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return query;
}

export function useWhatsAppConversation(conversationId: string | null) {
  return useQuery({
    queryKey: ["whatsapp-conversation", conversationId],
    queryFn: async () => {
      if (!conversationId) return null;

      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select(`
          *,
          contact:whatsapp_contacts(*)
        `)
        .eq("id", conversationId)
        .single();

      if (error) {
        console.error("Error fetching WhatsApp conversation:", error);
        throw error;
      }

      return data as WhatsAppConversation & { contact: WhatsAppContact | null };
    },
    enabled: !!conversationId,
  });
}

export function useSendWhatsAppMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      phoneNumber,
      message,
      mediaUrl,
    }: {
      conversationId: string;
      phoneNumber: string;
      message: string;
      mediaUrl?: string;
    }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twilio-send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            to: phoneNumber,
            body: message,
            conversation_id: conversationId,
            media_url: mediaUrl,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send message");
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["service-queue"] });
    },
  });
}
