import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/stock/Products";
import Categories from "./pages/stock/Categories";
import Suppliers from "./pages/stock/Suppliers";
import Movements from "./pages/stock/Movements";
import Inventory from "./pages/stock/Inventory";
import XmlImport from "./pages/stock/XmlImport";
import SalesHistory from "./pages/sales/SalesHistory";
import Refunds from "./pages/sales/Refunds";
import Customers from "./pages/customers/Customers";
import SalesByPeriod from "./pages/reports/SalesByPeriod";
import TopSelling from "./pages/reports/TopSelling";
import Profitability from "./pages/reports/Profitability";
import CashFlow from "./pages/reports/CashFlow";
import CashRegister from "./pages/reports/CashRegister";
import CriticalStock from "./pages/reports/CriticalStock";
import Seasonality from "./pages/reports/Seasonality";
import CategoryAnalysis from "./pages/reports/CategoryAnalysis";
import AbcCurve from "./pages/reports/AbcCurve";
import TicketByPayment from "./pages/reports/TicketByPayment";
import StockTurnover from "./pages/reports/StockTurnover";
import FiscalReport from "./pages/reports/FiscalReport";
import GeneralSettings from "./pages/settings/GeneralSettings";
import PdvSettings from "./pages/settings/PdvSettings";
import UsersSettings from "./pages/settings/UsersSettings";
import PlanoContas from "./pages/settings/PlanoContas";
import ApiDocs from "./pages/settings/ApiDocs";
import AuditLogPage from "./pages/audit/AuditLog";
import Payables from "./pages/payables/Payables";
import Balancete from "./pages/financeiro/Balancete";
import PosicaoFinanceira from "./pages/financeiro/PosicaoFinanceira";
import PriceHistory from "./pages/reports/PriceHistory";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/estoque/produtos" element={<Products />} />
                <Route path="/estoque/categorias" element={<Categories />} />
                <Route path="/estoque/fornecedores" element={<Suppliers />} />
                <Route path="/estoque/movimentacoes" element={<Movements />} />
                <Route path="/estoque/inventario" element={<Inventory />} />
                <Route path="/estoque/importar-xml" element={<XmlImport />} />
                <Route path="/vendas/historico" element={<SalesHistory />} />
                <Route path="/vendas/devolucoes" element={<Refunds />} />
                <Route path="/clientes" element={<Customers />} />
                <Route path="/relatorios/vendas" element={<SalesByPeriod />} />
                <Route path="/relatorios/mais-vendidos" element={<TopSelling />} />
                <Route path="/relatorios/lucratividade" element={<Profitability />} />
                <Route path="/relatorios/fluxo-caixa" element={<CashFlow />} />
                <Route path="/relatorios/estoque-critico" element={<CriticalStock />} />
                <Route path="/relatorios/sazonalidade" element={<Seasonality />} />
                <Route path="/relatorios/categorias" element={<CategoryAnalysis />} />
                <Route path="/relatorios/curva-abc" element={<AbcCurve />} />
                <Route path="/relatorios/ticket-pagamento" element={<TicketByPayment />} />
                <Route path="/relatorios/giro-estoque" element={<StockTurnover />} />
                <Route path="/relatorios/caixa" element={<CashRegister />} />
                <Route path="/relatorios/notas-fiscais" element={<FiscalReport />} />
                <Route path="/config/geral" element={<GeneralSettings />} />
                <Route path="/config/pdv" element={<PdvSettings />} />
                <Route path="/config/usuarios" element={<UsersSettings />} />
                <Route path="/config/plano-contas" element={<PlanoContas />} />
                <Route path="/config/api-docs" element={<ApiDocs />} />
                <Route path="/auditoria" element={<AuditLogPage />} />
                <Route path="/financeiro/contas-a-pagar" element={<Payables />} />
                <Route path="/financeiro/balancete" element={<Balancete />} />
                <Route path="/financeiro/posicao-financeira" element={<PosicaoFinanceira />} />
                <Route path="/relatorios/historico-precos" element={<PriceHistory />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
