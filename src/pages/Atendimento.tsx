
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ConversationsList } from "@/components/omnichannel/ConversationsList";
import { ConversationView } from "@/components/omnichannel/ConversationView";

export default function Atendimento() {
  const [selectedConversation, setSelectedConversation] = useState<string>("1");

  return (
    <MainLayout>
      <div className="h-[calc(100vh-130px)] overflow-hidden flex border rounded-lg bg-background">
        <div className="w-[350px] flex-shrink-0">
          <ConversationsList
            onSelect={setSelectedConversation}
            selectedId={selectedConversation}
          />
        </div>
        <div className="flex-grow">
          <ConversationView conversationId={selectedConversation} />
        </div>
      </div>
    </MainLayout>
  );
}
