import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function useSeasonalityData() {
  return useQuery({
    queryKey: ["report-seasonality"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sales")
        .select("sold_at, total")
        .eq("status", "completed")
        .order("sold_at");

      const grid: Record<number, number[]> = {};
      let maxVal = 0;

      data?.forEach((s) => {
        const d = new Date(s.sold_at);
        const year = d.getFullYear();
        const month = d.getMonth();
        if (!grid[year]) grid[year] = Array(12).fill(0);
        grid[year][month] += Number(s.total);
        if (grid[year][month] > maxVal) maxVal = grid[year][month];
      });

      const years = Object.keys(grid).map(Number).sort();
      return { grid, years, maxVal };
    },
  });
}

function getHeatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-muted/40";
  const ratio = value / max;
  if (ratio <= 0.15) return "bg-chart-2/15";
  if (ratio <= 0.3) return "bg-chart-2/25";
  if (ratio <= 0.45) return "bg-chart-2/40";
  if (ratio <= 0.6) return "bg-chart-2/55";
  if (ratio <= 0.75) return "bg-chart-2/70";
  return "bg-chart-2/90";
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Seasonality = () => {
  const { data, isLoading } = useSeasonalityData();

  const exportCSV = () => {
    if (!data) return;
    const header = "Ano," + MONTHS.join(",") + "\n";
    const rows = data.years.map((y) => `${y},${data.grid[y].map((v) => Math.round(v)).join(",")}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "sazonalidade.csv"; a.click();
    toast.success("CSV exportado");
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sazonalidade Mensal</h1>
          <p className="text-muted-foreground text-sm">Faturamento por mês ao longo dos anos</p>
        </div>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Exportar CSV</Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mapa de Calor — Faturamento Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          {!data || data.years.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Sem dados de vendas</div>
          ) : (
            <TooltipProvider delayDuration={100}>
              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  {/* Month headers */}
                  <div className="flex gap-1 mb-1 ml-16">
                    {MONTHS.map((m) => (
                      <div key={m} className="flex-1 text-center text-xs font-medium text-muted-foreground">{m}</div>
                    ))}
                  </div>

                  {/* Year rows */}
                  {data.years.map((year) => (
                    <div key={year} className="flex gap-1 mb-1">
                      <div className="w-16 flex items-center justify-end pr-3 text-sm font-semibold text-foreground shrink-0">{year}</div>
                      {data.grid[year].map((val, monthIdx) => (
                        <Tooltip key={monthIdx}>
                          <TooltipTrigger asChild>
                            <div className={cn(
                              "flex-1 h-12 rounded-md transition-colors cursor-default flex items-center justify-center",
                              getHeatColor(val, data.maxVal)
                            )}>
                              {val > 0 && (
                                <span className="text-[10px] font-medium text-foreground/70">
                                  {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : Math.round(val)}
                                </span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-semibold">{MONTHS[monthIdx]} {year}</p>
                            <p>{fmt(val)}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  ))}

                  {/* Legend */}
                  <div className="flex items-center justify-end gap-1 mt-4">
                    <span className="text-[10px] text-muted-foreground mr-1">Menos</span>
                    <div className="h-3 w-3 rounded-sm bg-muted/40" />
                    <div className="h-3 w-3 rounded-sm bg-chart-2/15" />
                    <div className="h-3 w-3 rounded-sm bg-chart-2/40" />
                    <div className="h-3 w-3 rounded-sm bg-chart-2/70" />
                    <div className="h-3 w-3 rounded-sm bg-chart-2/90" />
                    <span className="text-[10px] text-muted-foreground ml-1">Mais</span>
                  </div>
                </div>
              </div>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Seasonality;
