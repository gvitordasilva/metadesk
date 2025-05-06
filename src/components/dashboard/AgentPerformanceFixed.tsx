
import React from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// Essa é uma função auxiliar para corrigir o erro no AgentPerformance.tsx
export function getFixedProgressBar({ percentComplete, className }: { percentComplete: number, className?: string }) {
  const getProgressColor = (percent: number) => {
    if (percent < 30) return "bg-red-500";
    if (percent < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Progress
      value={percentComplete}
      className={cn("h-2", `[&>div]:${getProgressColor(percentComplete)}`, className)}
    />
  );
}
