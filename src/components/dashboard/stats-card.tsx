import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  period?: string;
  dateRange?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

export function StatsCard({
  title,
  value,
  change,
  period = "Last 30 Days",
  dateRange,
  trend = "neutral",
  icon,
}: StatsCardProps) {
  const isPositive = trend === "up" || (change && change > 0);
  const isNegative = trend === "down" || (change && change < 0);

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <span className="text-xs text-muted-foreground">{period}</span>
        </div>

        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {dateRange && (
              <p className="text-xs text-muted-foreground">{dateRange}</p>
            )}
          </div>

          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium",
                isPositive && "bg-green-50 text-green-700",
                isNegative && "bg-red-50 text-red-700",
                !isPositive && !isNegative && "bg-gray-50 text-gray-700"
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : isNegative ? (
                <ArrowDownRight className="h-4 w-4" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
          )}

          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </div>
    </Card>
  );
}
