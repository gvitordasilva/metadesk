import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChatMessage = {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  options?: { key: string; text: string }[];
};

export type ChatNode = {
  id: string;
  node_type: string;
  name: string;
  content: string | null;
  action_type: string | null;
  next_node_id: string | null;
};

export type ChatNodeOption = {
  id: string;
  option_key: string;
  option_text: string;
  next_node_id: string | null;
};

export function useWebChat(flowId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentNode, setCurrentNode] = useState<ChatNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [isEnded, setIsEnded] = useState(false);

  const addMessage = useCallback((content: string, sender: "user" | "bot", options?: { key: string; text: string }[]) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      content,
      sender,
      timestamp: new Date(),
      options,
    }]);
  }, []);

  const fetchNodeOptions = useCallback(async (nodeId: string): Promise<ChatNodeOption[]> => {
    const { data, error } = await supabase
      .from("chatbot_node_options")
      .select("*")
      .eq("node_id", nodeId)
      .order("option_order", { ascending: true });

    if (error) {
      console.error("Error fetching node options:", error);
      return [];
    }

    return data || [];
  }, []);

  const processNode = useCallback(async (node: ChatNode) => {
    setCurrentNode(node);

    // Send node content as bot message
    if (node.content) {
      if (node.node_type === "menu") {
        const options = await fetchNodeOptions(node.id);
        const optionsList = options.map(opt => ({ key: opt.option_key, text: opt.option_text }));
        addMessage(node.content, "bot", optionsList);
      } else {
        addMessage(node.content, "bot");
      }
    }

    // Handle action types
    if (node.action_type === "end") {
      setIsEnded(true);
      addMessage("Atendimento encerrado. Obrigado pelo contato!", "bot");
    } else if (node.action_type === "escalate") {
      addMessage("Você será transferido para um atendente humano. Por favor, aguarde...", "bot");
      setIsEnded(true);
    }

    // Auto-navigate for message nodes without menu
    if (node.node_type === "message" && node.next_node_id && node.action_type === "none") {
      setTimeout(async () => {
        const { data: nextNode } = await supabase
          .from("chatbot_nodes")
          .select("*")
          .eq("id", node.next_node_id)
          .single();

        if (nextNode) {
          await processNode(nextNode as ChatNode);
        }
      }, 500);
    }
  }, [addMessage, fetchNodeOptions]);

  const startChat = useCallback(async () => {
    if (!flowId) return;

    setIsLoading(true);
    try {
      // Find entry point node
      const { data: entryNode, error } = await supabase
        .from("chatbot_nodes")
        .select("*")
        .eq("flow_id", flowId)
        .eq("is_entry_point", true)
        .eq("is_active", true)
        .single();

      if (error || !entryNode) {
        // Try first node by order
        const { data: firstNode } = await supabase
          .from("chatbot_nodes")
          .select("*")
          .eq("flow_id", flowId)
          .eq("is_active", true)
          .order("node_order", { ascending: true })
          .limit(1)
          .single();

        if (firstNode) {
          await processNode(firstNode as ChatNode);
        } else {
          addMessage("Não foi possível iniciar o atendimento. Tente novamente mais tarde.", "bot");
        }
      } else {
        await processNode(entryNode as ChatNode);
      }
    } catch (err) {
      console.error("Error starting chat:", err);
      addMessage("Erro ao iniciar o chat. Por favor, tente novamente.", "bot");
    } finally {
      setIsLoading(false);
    }
  }, [flowId, processNode, addMessage]);

  const handleUserInput = useCallback(async (input: string) => {
    if (isEnded || !currentNode) return;

    addMessage(input, "user");
    setIsLoading(true);

    try {
      if (currentNode.node_type === "menu") {
        // Find matching option
        const options = await fetchNodeOptions(currentNode.id);
        const selectedOption = options.find(
          opt => opt.option_key === input || opt.option_text.toLowerCase() === input.toLowerCase()
        );

        if (selectedOption && selectedOption.next_node_id) {
          const { data: nextNode } = await supabase
            .from("chatbot_nodes")
            .select("*")
            .eq("id", selectedOption.next_node_id)
            .single();

          if (nextNode) {
            await processNode(nextNode as ChatNode);
          }
        } else {
          addMessage("Opção inválida. Por favor, escolha uma das opções disponíveis.", "bot");
        }
      } else if (currentNode.node_type === "input") {
        // For input nodes, just move to next node
        if (currentNode.next_node_id) {
          const { data: nextNode } = await supabase
            .from("chatbot_nodes")
            .select("*")
            .eq("id", currentNode.next_node_id)
            .single();

          if (nextNode) {
            await processNode(nextNode as ChatNode);
          }
        }
      }
    } catch (err) {
      console.error("Error handling input:", err);
      addMessage("Erro ao processar sua mensagem. Tente novamente.", "bot");
    } finally {
      setIsLoading(false);
    }
  }, [currentNode, isEnded, addMessage, fetchNodeOptions, processNode]);

  const selectOption = useCallback(async (optionKey: string) => {
    await handleUserInput(optionKey);
  }, [handleUserInput]);

  return {
    messages,
    isLoading,
    isEnded,
    sessionId,
    currentNode,
    startChat,
    handleUserInput,
    selectOption,
  };
}
