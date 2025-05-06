
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChannelMetrics } from "@/components/dashboard/ChannelMetrics";
import { ActiveConversations } from "@/components/dashboard/ActiveConversations";
import { AgentPerformance } from "@/components/dashboard/AgentPerformance";
import {
  MessageSquare,
  ClipboardCheck,
  Clock,
  UserCheck,
} from "lucide-react";

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral dos indicadores de atendimento
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Conversas Ativas"
          value="124"
          icon={<MessageSquare className="h-5 w-5 text-metadesk-yellow" />}
          trend={{ value: "12%", positive: true }}
        />
        <StatCard
          title="Solicitações Resolvidas"
          value="85"
          icon={<ClipboardCheck className="h-5 w-5 text-metadesk-green" />}
          trend={{ value: "5%", positive: true }}
        />
        <StatCard
          title="Tempo Médio (TMA)"
          value="05:32"
          icon={<Clock className="h-5 w-5 text-metadesk-purple" />}
          trend={{ value: "1:20", positive: false }}
        />
        <StatCard
          title="Agentes Online"
          value="18"
          icon={<UserCheck className="h-5 w-5 text-metadesk-blue" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChannelMetrics />
        <ActiveConversations />
      </div>

      <div className="mb-6">
        <AgentPerformance />
      </div>
    </MainLayout>
  );
}
