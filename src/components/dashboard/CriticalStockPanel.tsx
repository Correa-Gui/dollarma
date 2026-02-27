import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCriticalStockDashboard } from "@/hooks/useDashboardData";
import { AlertTriangle, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CriticalStockPanel() {
  const { data: items = [], isLoading } = useCriticalStockDashboard();

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <CardTitle className="text-base">Estoque Crítico</CardTitle>
        <Badge variant="destructive" className="ml-auto">{items.length}</Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto com estoque crítico 🎉</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.current}/{item.minimum} un — {item.supplier}</p>
                </div>
                <Button variant="outline" size="sm" className="ml-2 shrink-0">
                  <ShoppingCart className="h-3.5 w-3.5 mr-1" />Pedir
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
