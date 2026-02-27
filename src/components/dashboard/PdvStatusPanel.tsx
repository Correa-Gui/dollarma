import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePdvTerminals } from "@/hooks/useDashboardData";
import { MonitorSmartphone, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PdvStatusPanel() {
  const { data: terminals = [], isLoading } = usePdvTerminals();

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center gap-2">
        <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base">Terminais PDV</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : terminals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum terminal cadastrado</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {terminals.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className={`h-2.5 w-2.5 rounded-full ${t.status === "online" ? "bg-emerald-500" : "bg-red-500"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">Sinc: {t.lastSync}</p>
                </div>
                {t.pendingSales > 0 && <Badge variant="secondary">{t.pendingSales} pendentes</Badge>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
