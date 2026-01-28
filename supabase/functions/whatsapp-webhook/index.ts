import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EvolutionWebhook {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: { text: string };
    };
    messageType?: string;
    messageTimestamp?: number;
  };
}

interface ChatbotNode {
  id: string;
  flow_id: string;
  node_type: string;
  name: string;
  content: string | null;
  options: any;
  action_type: string;
  action_config: any;
  next_node_id: string | null;
  is_entry_point: boolean;
}

interface NodeOption {
  id: string;
  node_id: string;
  option_key: string;
  option_text: string;
  next_node_id: string | null;
  option_order: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

    // Validate Evolution API key from header
    const apiKey = req.headers.get("apikey");
    if (EVOLUTION_API_KEY && apiKey !== EVOLUTION_API_KEY) {
      console.log("Invalid API key received");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const payload: EvolutionWebhook = await req.json();
    console.log("Webhook received:", JSON.stringify(payload, null, 2));

    // Only process incoming messages
    if (payload.event !== "messages.upsert" || payload.data?.key?.fromMe) {
      return new Response(JSON.stringify({ status: "ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract phone number from remoteJid (format: 5511999999999@s.whatsapp.net)
    const remoteJid = payload.data.key.remoteJid;
    const phoneNumber = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "");
    const customerName = payload.data.pushName || "Cliente";
    const messageContent =
      payload.data.message?.conversation ||
      payload.data.message?.extendedTextMessage?.text ||
      "";

    console.log(`Message from ${phoneNumber} (${customerName}): ${messageContent}`);

    // Find or create conversation
    let { data: conversation } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("phone_number", phoneNumber)
      .single();

    if (!conversation) {
      const { data: newConversation, error: createError } = await supabase
        .from("whatsapp_conversations")
        .insert({
          phone_number: phoneNumber,
          customer_name: customerName,
          session_active: true,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating conversation:", createError);
        throw createError;
      }
      conversation = newConversation;
    } else {
      // Update existing conversation
      await supabase
        .from("whatsapp_conversations")
        .update({
          customer_name: customerName,
          last_message_at: new Date().toISOString(),
          session_active: true,
        })
        .eq("id", conversation.id);
    }

    // Save incoming message
    await supabase.from("service_messages").insert({
      conversation_id: conversation.id,
      channel: "whatsapp",
      sender_type: "customer",
      sender_name: customerName,
      content: messageContent,
      metadata: { whatsapp_message_id: payload.data.key.id },
    });

    // Process chatbot logic
    const response = await processChatbotResponse(
      supabase,
      conversation,
      messageContent
    );

    // Send response via Evolution API
    if (response.message) {
      await sendWhatsAppMessage(phoneNumber, response.message);

      // Save bot response
      await supabase.from("service_messages").insert({
        conversation_id: conversation.id,
        channel: "whatsapp",
        sender_type: "bot",
        sender_name: "MetaDesk Bot",
        content: response.message,
      });
    }

    // Update conversation state
    await supabase
      .from("whatsapp_conversations")
      .update({
        current_node_id: response.nextNodeId,
        escalated_at: response.escalated ? new Date().toISOString() : null,
      })
      .eq("id", conversation.id);

    // If escalated, add to service queue
    if (response.escalated) {
      await supabase.from("service_queue").insert({
        channel: "whatsapp",
        status: "waiting",
        customer_name: customerName,
        customer_phone: phoneNumber,
        subject: "Atendimento WhatsApp",
        last_message: messageContent,
        unread_count: 1,
        whatsapp_conversation_id: conversation.id,
        waiting_since: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ status: "processed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processChatbotResponse(
  supabase: any,
  conversation: any,
  userMessage: string
): Promise<{ message: string; nextNodeId: string | null; escalated: boolean }> {
  const currentNodeId = conversation.current_node_id;

  // If no current node, get the entry point of the default flow
  if (!currentNodeId) {
    const { data: defaultFlow } = await supabase
      .from("chatbot_flows")
      .select("id")
      .eq("is_default", true)
      .eq("is_active", true)
      .single();

    if (!defaultFlow) {
      return {
        message: "Olá! Bem-vindo ao atendimento. Um momento, vou transferir você para um atendente.",
        nextNodeId: null,
        escalated: true,
      };
    }

    const { data: entryNode } = await supabase
      .from("chatbot_nodes")
      .select("*")
      .eq("flow_id", defaultFlow.id)
      .eq("is_entry_point", true)
      .eq("is_active", true)
      .single();

    if (!entryNode) {
      return {
        message: "Olá! Bem-vindo ao atendimento. Um momento, vou transferir você para um atendente.",
        nextNodeId: null,
        escalated: true,
      };
    }

    return buildNodeResponse(supabase, entryNode);
  }

  // Get current node
  const { data: currentNode } = await supabase
    .from("chatbot_nodes")
    .select("*")
    .eq("id", currentNodeId)
    .single();

  if (!currentNode) {
    return {
      message: "Desculpe, ocorreu um erro. Transferindo para um atendente.",
      nextNodeId: null,
      escalated: true,
    };
  }

  // Process based on node type
  if (currentNode.node_type === "menu") {
    // Find selected option
    const { data: options } = await supabase
      .from("chatbot_node_options")
      .select("*")
      .eq("node_id", currentNode.id)
      .order("option_order");

    const userChoice = userMessage.trim();
    const selectedOption = options?.find(
      (opt: NodeOption) =>
        opt.option_key === userChoice ||
        opt.option_text.toLowerCase().includes(userChoice.toLowerCase())
    );

    if (!selectedOption) {
      // Invalid option, repeat the menu
      return {
        message: `Opção inválida. Por favor, escolha uma das opções disponíveis.\n\n${currentNode.content}\n\n${formatOptions(options)}`,
        nextNodeId: currentNodeId,
        escalated: false,
      };
    }

    if (!selectedOption.next_node_id) {
      return {
        message: "Transferindo para um atendente. Aguarde um momento.",
        nextNodeId: null,
        escalated: true,
      };
    }

    // Get next node
    const { data: nextNode } = await supabase
      .from("chatbot_nodes")
      .select("*")
      .eq("id", selectedOption.next_node_id)
      .single();

    if (!nextNode) {
      return {
        message: "Transferindo para um atendente. Aguarde um momento.",
        nextNodeId: null,
        escalated: true,
      };
    }

    return buildNodeResponse(supabase, nextNode);
  }

  // For message nodes, move to next
  if (currentNode.node_type === "message" && currentNode.next_node_id) {
    const { data: nextNode } = await supabase
      .from("chatbot_nodes")
      .select("*")
      .eq("id", currentNode.next_node_id)
      .single();

    if (nextNode) {
      return buildNodeResponse(supabase, nextNode);
    }
  }

  // For action nodes
  if (currentNode.node_type === "action") {
    if (currentNode.action_type === "escalate") {
      return {
        message: currentNode.content || "Transferindo para um atendente. Aguarde um momento.",
        nextNodeId: null,
        escalated: true,
      };
    }

    if (currentNode.action_type === "end") {
      return {
        message: currentNode.content || "Obrigado pelo contato. Até logo!",
        nextNodeId: null,
        escalated: false,
      };
    }
  }

  // Default: escalate
  return {
    message: "Transferindo para um atendente. Aguarde um momento.",
    nextNodeId: null,
    escalated: true,
  };
}

async function buildNodeResponse(
  supabase: any,
  node: ChatbotNode
): Promise<{ message: string; nextNodeId: string | null; escalated: boolean }> {
  // Check if this is an action node
  if (node.node_type === "action") {
    if (node.action_type === "escalate") {
      return {
        message: node.content || "Transferindo para um atendente. Aguarde um momento.",
        nextNodeId: null,
        escalated: true,
      };
    }

    if (node.action_type === "end") {
      return {
        message: node.content || "Obrigado pelo contato. Até logo!",
        nextNodeId: null,
        escalated: false,
      };
    }
  }

  let message = node.content || "";

  // If menu, append options
  if (node.node_type === "menu") {
    const { data: options } = await supabase
      .from("chatbot_node_options")
      .select("*")
      .eq("node_id", node.id)
      .order("option_order");

    if (options && options.length > 0) {
      message += "\n\n" + formatOptions(options);
    }
  }

  return {
    message,
    nextNodeId: node.id,
    escalated: false,
  };
}

function formatOptions(options: NodeOption[]): string {
  return options.map((opt) => `${opt.option_key}. ${opt.option_text}`).join("\n");
}

async function sendWhatsAppMessage(phoneNumber: string, text: string): Promise<void> {
  const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
  const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
  const EVOLUTION_INSTANCE_NAME = Deno.env.get("EVOLUTION_INSTANCE_NAME");

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
    console.error("Evolution API not configured");
    return;
  }

  try {
    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: phoneNumber,
          text: text,
          delay: 1000,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to send WhatsApp message:", error);
    } else {
      console.log(`Message sent to ${phoneNumber}`);
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
  }
}
