import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/stock/Products";
import Categories from "./pages/stock/Categories";
import Suppliers from "./pages/stock/Suppliers";
import Movements from "./pages/stock/Movements";
import Inventory from "./pages/stock/Inventory";
import SalesHistory from "./pages/sales/SalesHistory";
import Refunds from "./pages/sales/Refunds";
import SalesByPeriod from "./pages/reports/SalesByPeriod";
import TopSelling from "./pages/reports/TopSelling";
import Profitability from "./pages/reports/Profitability";
import CashFlow from "./pages/reports/CashFlow";
import CriticalStock from "./pages/reports/CriticalStock";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              {/* Estoque */}
              <Route path="/estoque/produtos" element={<Products />} />
              <Route path="/estoque/categorias" element={<Categories />} />
              <Route path="/estoque/fornecedores" element={<Suppliers />} />
              <Route path="/estoque/movimentacoes" element={<Movements />} />
              <Route path="/estoque/inventario" element={<Inventory />} />
              {/* Vendas */}
              <Route path="/vendas/historico" element={<SalesHistory />} />
              <Route path="/vendas/devolucoes" element={<Refunds />} />
              {/* Relatórios */}
              <Route path="/relatorios/vendas" element={<SalesByPeriod />} />
              <Route path="/relatorios/mais-vendidos" element={<TopSelling />} />
              <Route path="/relatorios/lucratividade" element={<Profitability />} />
              <Route path="/relatorios/fluxo-caixa" element={<CashFlow />} />
              <Route path="/relatorios/estoque-critico" element={<CriticalStock />} />
              {/* Configurações */}
              <Route path="/config/geral" element={<ComingSoon title="Configurações Gerais — Em Breve" />} />
              <Route path="/config/pdv" element={<ComingSoon title="PDV / Integração — Em Breve" />} />
              <Route path="/config/usuarios" element={<ComingSoon title="Usuários e Permissões — Em Breve" />} />
              <Route path="/config/plano-contas" element={<ComingSoon title="Plano de Contas — Em Breve" />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
