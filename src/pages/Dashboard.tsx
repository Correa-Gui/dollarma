import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { PaymentMethodChart } from "@/components/dashboard/PaymentMethodChart";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";
import { StockEvolutionChart } from "@/components/dashboard/StockEvolutionChart";
import { SalesByHourChart } from "@/components/dashboard/SalesByHourChart";
import { CriticalStockPanel } from "@/components/dashboard/CriticalStockPanel";
import { PdvStatusPanel } from "@/components/dashboard/PdvStatusPanel";
import { useDashboardKpis } from "@/hooks/useDashboardData";
import { DollarSign, TrendingUp, ShoppingCart, Receipt, Loader2 } from "lucide-react";

const Dashboard = () => {
  const { data: kpis, isLoading } = useDashboardKpis();

  const kpiData = kpis ?? {
    revenueToday: { value: 0, change: 0 },
    revenueMonth: { value: 0, change: 0 },
    salesToday: { value: 0, change: 0 },
    avgTicket: { value: 0, change: 0 },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Faturamento Hoje" value={kpiData.revenueToday.value} change={kpiData.revenueToday.change} icon={DollarSign} format="currency" />
          <KpiCard title="Faturamento do Mês" value={kpiData.revenueMonth.value} change={kpiData.revenueMonth.change} icon={TrendingUp} format="currency" />
          <KpiCard title="Vendas Hoje" value={kpiData.salesToday.value} change={kpiData.salesToday.change} icon={ShoppingCart} format="number" />
          <KpiCard title="Ticket Médio" value={kpiData.avgTicket.value} change={kpiData.avgTicket.change} icon={Receipt} format="currency" />
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2"><RevenueChart /></div>
        <PaymentMethodChart />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <TopProductsChart />
        <SalesByHourChart />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <StockEvolutionChart />
        <CriticalStockPanel />
      </div>

      <PdvStatusPanel />
    </div>
  );
};

export default Dashboard;
