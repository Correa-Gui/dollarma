import { useTheme } from "next-themes";
import { Moon, Sun, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/vendas/historico": "Vendas › Histórico",
  "/vendas/devolucoes": "Vendas › Devoluções",
  "/estoque/produtos": "Estoque › Produtos",
  "/estoque/categorias": "Estoque › Categorias",
  "/estoque/fornecedores": "Estoque › Fornecedores",
  "/estoque/movimentacoes": "Estoque › Movimentações",
  "/estoque/inventario": "Estoque › Inventário",
  "/relatorios/vendas": "Relatórios › Vendas por Período",
  "/relatorios/mais-vendidos": "Relatórios › Mais Vendidos",
  "/relatorios/lucratividade": "Relatórios › Lucratividade",
  "/relatorios/fluxo-caixa": "Relatórios › Fluxo de Caixa",
  "/relatorios/estoque-critico": "Relatórios › Estoque Crítico",
  "/config/geral": "Configurações › Geral",
  "/config/pdv": "Configurações › PDV / Integração",
  "/config/usuarios": "Configurações › Usuários",
  "/config/plano-contas": "Configurações › Plano de Contas",
};

export function AppHeader() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const breadcrumb = breadcrumbMap[location.pathname] ?? "Página";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        {/* Notch / Dynamic Island spacer no iPhone com viewport-fit=cover */}
        <div className="h-[env(safe-area-inset-top)] pt-safe" />
      <div className="flex h-14 items-center gap-3 px-4">
        <SidebarTrigger />
        <span className="text-sm text-muted-foreground font-medium">{breadcrumb}</span>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-2 text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs">Buscar...</span>
            <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Alternar tema</span>
          </Button>
        </div>
      </div>
      </header>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Busca Global</DialogTitle>
          </DialogHeader>
          <Input placeholder="Buscar produtos, vendas, fornecedores..." autoFocus />
          <p className="text-xs text-muted-foreground text-center py-4">
            Comece a digitar para buscar...
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
