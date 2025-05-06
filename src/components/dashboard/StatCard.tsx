
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string | number;
    positive: boolean;
  };
  className?: string;
  valueClassName?: string;
};

export function StatCard({
  title,
  value,
  icon,
  trend,
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className={cn("text-2xl font-bold mt-1", valueClassName)}>
              {value}
            </h3>
            {trend && (
              <p
                className={cn(
                  "text-xs font-medium mt-1 flex items-center",
                  trend.positive ? "text-green-500" : "text-red-500"
                )}
              >
                {trend.positive ? "↑" : "↓"} {trend.value}
              </p>
            )}
          </div>
          <div className="p-2 bg-primary/10 rounded-full">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
