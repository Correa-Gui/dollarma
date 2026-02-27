import { mockSales } from "./mock-sales-data";
import { mockProducts } from "./mock-data";

// ── Sales by period ──
export const salesByPeriodData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - 29 + i);
  const dayStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const gross = Math.round(3000 + Math.random() * 5000);
  const discounts = Math.round(gross * (Math.random() * 0.08));
  return {
    date: dayStr,
    gross,
    discounts,
    net: gross - discounts,
    sales: Math.round(15 + Math.random() * 35),
    avgTicket: +((gross - discounts) / (15 + Math.random() * 35)).toFixed(2),
    previousGross: Math.round(2500 + Math.random() * 4500),
  };
});

export const salesByPeriodTotals = {
  grossRevenue: salesByPeriodData.reduce((s, d) => s + d.gross, 0),
  discounts: salesByPeriodData.reduce((s, d) => s + d.discounts, 0),
  netRevenue: salesByPeriodData.reduce((s, d) => s + d.net, 0),
  totalSales: salesByPeriodData.reduce((s, d) => s + d.sales, 0),
  avgTicket: +(salesByPeriodData.reduce((s, d) => s + d.net, 0) / salesByPeriodData.reduce((s, d) => s + d.sales, 0)).toFixed(2),
};

// ── Top selling products ──
export type TopSellingProduct = {
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
  profit: number;
  margin: number;
};

export const topSellingProducts: TopSellingProduct[] = mockProducts
  .map((p) => {
    const qtySold = Math.round(20 + Math.random() * 150);
    const revenue = +(qtySold * p.salePrice).toFixed(2);
    const cost = +(qtySold * p.costPrice).toFixed(2);
    const profit = +(revenue - cost).toFixed(2);
    return {
      name: p.name,
      category: p.category,
      quantitySold: qtySold,
      revenue,
      profit,
      margin: +((profit / cost) * 100).toFixed(1),
    };
  })
  .sort((a, b) => b.quantitySold - a.quantitySold);

// ── Profitability ──
export type ProfitabilityProduct = {
  name: string;
  category: string;
  costPrice: number;
  salePrice: number;
  margin: number;
  totalProfit: number;
  volumeSold: number;
};

export const profitabilityData: ProfitabilityProduct[] = mockProducts.map((p) => {
  const vol = Math.round(10 + Math.random() * 120);
  const margin = +((( p.salePrice - p.costPrice) / p.costPrice) * 100).toFixed(1);
  return {
    name: p.name,
    category: p.category,
    costPrice: p.costPrice,
    salePrice: p.salePrice,
    margin,
    totalProfit: +((p.salePrice - p.costPrice) * vol).toFixed(2),
    volumeSold: vol,
  };
});

export const profitabilityByCategory = Array.from(
  profitabilityData.reduce((map, p) => {
    const existing = map.get(p.category) || { category: p.category, totalProfit: 0, totalRevenue: 0 };
    existing.totalProfit += p.totalProfit;
    existing.totalRevenue += p.salePrice * p.volumeSold;
    map.set(p.category, existing);
    return map;
  }, new Map<string, { category: string; totalProfit: number; totalRevenue: number }>())
).map(([, v]) => ({ ...v, margin: +((v.totalProfit / (v.totalRevenue - v.totalProfit)) * 100).toFixed(1) }));

// ── Cash flow ──
export type CashFlowDay = {
  date: string;
  pix: number;
  credit: number;
  debit: number;
  cash: number;
  total: number;
  accumulated: number;
};

let accumulated = 50000;
export const cashFlowData: CashFlowDay[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - 29 + i);
  const pix = Math.round(800 + Math.random() * 2000);
  const credit = Math.round(600 + Math.random() * 1500);
  const debit = Math.round(400 + Math.random() * 1000);
  const cash = Math.round(200 + Math.random() * 800);
  const total = pix + credit + debit + cash;
  accumulated += total - Math.round(1500 + Math.random() * 1500);
  return {
    date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    pix, credit, debit, cash, total,
    accumulated,
  };
});

// ── Critical stock report ──
export type CriticalStockReport = {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier: string;
  currentStock: number;
  minStock: number;
  suggestedReorder: number;
};

export const criticalStockReport: CriticalStockReport[] = mockProducts
  .filter((p) => p.stockQuantity <= p.stockMin)
  .map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    supplier: p.supplier,
    currentStock: p.stockQuantity,
    minStock: p.stockMin,
    suggestedReorder: Math.max(0, p.stockMin * 2 - p.stockQuantity),
  }));
