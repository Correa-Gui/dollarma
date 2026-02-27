import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pdvTerminals } from "@/data/mock-data";
import { MonitorSmartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PdvStatusPanel() {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center gap-2">
        <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base">Terminais PDV</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pdvTerminals.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  t.status === "online" ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{t.name}</p>
                <p className="text-xs text-muted-foreground">Sinc: {t.lastSync}</p>
              </div>
              {t.pendingSales > 0 && (
                <Badge variant="secondary">{t.pendingSales} pendentes</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
