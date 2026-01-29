import { useServiceQueue } from "./useServiceQueue";
import { useComplaintStats } from "./useComplaints";

export function useMenuBadges() {
  const { data: queueItems } = useServiceQueue({ 
    status: ["waiting"] 
  });
  const { data: stats } = useComplaintStats();
  
  return {
    atendimento: queueItems?.length ?? 0,
    solicitacoes: stats?.pending ?? 0,
  };
}
