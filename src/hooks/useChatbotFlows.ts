import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ChatbotFlow = {
  id: string;
  name: string;
  description: string | null;
  channel: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatbotNode = {
  id: string;
  flow_id: string;
  node_type: "message" | "menu" | "input" | "action" | "condition";
  name: string;
  content: string | null;
  options: any;
  action_type: "none" | "escalate" | "transfer" | "end" | "goto";
  action_config: any;
  next_node_id: string | null;
  node_order: number;
  is_entry_point: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatbotNodeOption = {
  id: string;
  node_id: string;
  option_key: string;
  option_text: string;
  next_node_id: string | null;
  option_order: number;
  created_at: string;
};

// Fetch all flows
export function useChatbotFlows() {
  return useQuery({
    queryKey: ["chatbot-flows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chatbot_flows")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ChatbotFlow[];
    },
  });
}

// Fetch nodes for a flow
export function useChatbotNodes(flowId: string | null) {
  return useQuery({
    queryKey: ["chatbot-nodes", flowId],
    queryFn: async () => {
      if (!flowId) return [];

      const { data, error } = await supabase
        .from("chatbot_nodes")
        .select("*")
        .eq("flow_id", flowId)
        .order("node_order", { ascending: true });

      if (error) throw error;
      return data as ChatbotNode[];
    },
    enabled: !!flowId,
  });
}

// Fetch options for a node
export function useChatbotNodeOptions(nodeId: string | null) {
  return useQuery({
    queryKey: ["chatbot-node-options", nodeId],
    queryFn: async () => {
      if (!nodeId) return [];

      const { data, error } = await supabase
        .from("chatbot_node_options")
        .select("*")
        .eq("node_id", nodeId)
        .order("option_order", { ascending: true });

      if (error) throw error;
      return data as ChatbotNodeOption[];
    },
    enabled: !!nodeId,
  });
}

// Create flow
export function useCreateChatbotFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flow: Partial<ChatbotFlow>) => {
      const { data, error } = await supabase
        .from("chatbot_flows")
        .insert({
          name: flow.name || "Novo Fluxo",
          description: flow.description,
          channel: flow.channel || "all",
          is_active: flow.is_active ?? true,
          is_default: flow.is_default ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChatbotFlow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-flows"] });
    },
  });
}

// Update flow
export function useUpdateChatbotFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChatbotFlow> & { id: string }) => {
      const { data, error } = await supabase
        .from("chatbot_flows")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ChatbotFlow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-flows"] });
    },
  });
}

// Delete flow
export function useDeleteChatbotFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chatbot_flows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-flows"] });
    },
  });
}

// Create node
export function useCreateChatbotNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (node: Partial<ChatbotNode>) => {
      const { data, error } = await supabase
        .from("chatbot_nodes")
        .insert({
          flow_id: node.flow_id,
          node_type: node.node_type || "message",
          name: node.name || "Novo Nó",
          content: node.content,
          options: node.options,
          action_type: node.action_type || "none",
          action_config: node.action_config,
          next_node_id: node.next_node_id,
          node_order: node.node_order ?? 0,
          is_entry_point: node.is_entry_point ?? false,
          is_active: node.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChatbotNode;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-nodes", data.flow_id] });
    },
  });
}

// Update node
export function useUpdateChatbotNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChatbotNode> & { id: string }) => {
      const { data, error } = await supabase
        .from("chatbot_nodes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ChatbotNode;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-nodes", data.flow_id] });
    },
  });
}

// Delete node
export function useDeleteChatbotNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, flowId }: { id: string; flowId: string }) => {
      const { error } = await supabase.from("chatbot_nodes").delete().eq("id", id);
      if (error) throw error;
      return { flowId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-nodes", data.flowId] });
    },
  });
}

// Create option
export function useCreateNodeOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (option: Partial<ChatbotNodeOption>) => {
      const { data, error } = await supabase
        .from("chatbot_node_options")
        .insert({
          node_id: option.node_id,
          option_key: option.option_key || "1",
          option_text: option.option_text || "Nova Opção",
          next_node_id: option.next_node_id,
          option_order: option.option_order ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChatbotNodeOption;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-node-options", data.node_id] });
    },
  });
}

// Update option
export function useUpdateNodeOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChatbotNodeOption> & { id: string }) => {
      const { data, error } = await supabase
        .from("chatbot_node_options")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ChatbotNodeOption;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-node-options", data.node_id] });
    },
  });
}

// Delete option
export function useDeleteNodeOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nodeId }: { id: string; nodeId: string }) => {
      const { error } = await supabase.from("chatbot_node_options").delete().eq("id", id);
      if (error) throw error;
      return { nodeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-node-options", data.nodeId] });
    },
  });
}

// Bulk update nodes (for reordering)
export function useBulkUpdateNodes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nodes: { id: string; node_order: number }[]) => {
      const promises = nodes.map((node) =>
        supabase
          .from("chatbot_nodes")
          .update({ node_order: node.node_order })
          .eq("id", node.id)
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-nodes"] });
    },
  });
}
