import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardInsights, type Insight } from "@/hooks/useDashboardInsights";
import { Loader2, Lightbulb, AlertCircle, TrendingUp, AlertTriangle, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<Insight["icon"], { Icon: typeof AlertCircle; className: string }> = {
  red: { Icon: AlertCircle, className: "text-destructive bg-destructive/10" },
  green: { Icon: TrendingUp, className: "text-emerald-600 bg-emerald-500/10" },
  yellow: { Icon: AlertTriangle, className: "text-amber-600 bg-amber-500/10" },
  blue: { Icon: CalendarClock, className: "text-blue-600 bg-blue-500/10" },
};

export function InsightsPanel() {
  const { data: insights, isLoading } = useDashboardInsights();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center h-24">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
          <Lightbulb className="h-5 w-5" />
          <span className="text-sm">Nenhum insight relevante no momento — tudo sob controle!</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Insights Automáticos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {insights.map((insight, i) => {
          const { Icon, className } = iconMap[insight.icon];
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border/50 px-3 py-2.5 transition-colors hover:bg-muted/30"
            >
              <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", className)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm leading-relaxed pt-0.5">{insight.text}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
