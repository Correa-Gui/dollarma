import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSalesHeatmap } from "@/hooks/useSalesHeatmap";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}h`);

function getIntensityClass(count: number, max: number): string {
  if (max === 0 || count === 0) return "bg-muted/40";
  const ratio = count / max;
  if (ratio <= 0.2) return "bg-chart-1/15";
  if (ratio <= 0.4) return "bg-chart-1/30";
  if (ratio <= 0.6) return "bg-chart-1/50";
  if (ratio <= 0.8) return "bg-chart-1/70";
  return "bg-chart-1/90";
}

export function SalesHeatmap() {
  const { data, isLoading } = useSalesHeatmap();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Heatmap de Vendas</CardTitle>
        <p className="text-xs text-muted-foreground">Últimos 30 dias — dia da semana × hora</p>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <TooltipProvider delayDuration={100}>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Hour labels row */}
                <div className="flex gap-[2px] mb-[2px] ml-10">
                  {HOUR_LABELS.map((h, i) => (
                    <div
                      key={h}
                      className={cn(
                        "flex-1 text-center text-[9px] font-medium text-muted-foreground",
                        i % 3 !== 0 && "hidden sm:block"
                      )}
                    >
                      {i % 3 === 0 ? h : ""}
                    </div>
                  ))}
                </div>

                {/* Grid rows */}
                {data.dayLabels.map((dayLabel, dayIdx) => (
                  <div key={dayLabel} className="flex gap-[2px] mb-[2px]">
                    <div className="w-10 flex items-center justify-end pr-2 text-xs font-medium text-muted-foreground shrink-0">
                      {dayLabel}
                    </div>
                    {Array.from({ length: 24 }, (_, hour) => {
                      const cell = data.cells.find(
                        (c) => c.day === dayIdx && c.hour === hour
                      );
                      const count = cell?.count ?? 0;
                      return (
                        <Tooltip key={hour}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "flex-1 aspect-square rounded-sm transition-colors cursor-default min-h-[16px]",
                                getIntensityClass(count, data.maxCount)
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-semibold">{dayLabel} às {String(hour).padStart(2, "0")}h</p>
                            <p>{count} {count === 1 ? "venda" : "vendas"}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}

                {/* Legend */}
                <div className="flex items-center justify-end gap-1 mt-3">
                  <span className="text-[10px] text-muted-foreground mr-1">Menos</span>
                  <div className="h-3 w-3 rounded-sm bg-muted/40" />
                  <div className="h-3 w-3 rounded-sm bg-chart-1/15" />
                  <div className="h-3 w-3 rounded-sm bg-chart-1/30" />
                  <div className="h-3 w-3 rounded-sm bg-chart-1/50" />
                  <div className="h-3 w-3 rounded-sm bg-chart-1/70" />
                  <div className="h-3 w-3 rounded-sm bg-chart-1/90" />
                  <span className="text-[10px] text-muted-foreground ml-1">Mais</span>
                </div>
              </div>
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
