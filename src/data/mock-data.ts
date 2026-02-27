// ── KPI Data ──
export const kpiData = {
  revenueToday: { value: 4832.5, change: 12.5 },
  revenueMonth: { value: 128450.0, change: 8.3 },
  salesToday: { value: 47, change: -3.2 },
  avgTicket: { value: 102.82, change: 5.1 },
};

// ── Revenue last 30 days ──
export const revenueLast30Days = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - 29 + i);
  return {
    date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    current: Math.round(3000 + Math.random() * 4000),
    previous: Math.round(2500 + Math.random() * 3500),
  };
});

// ── Payment methods ──
export const paymentMethodData = [
  { name: "Pix", value: 38, color: "hsl(var(--chart-1))" },
  { name: "Crédito", value: 28, color: "hsl(var(--chart-2))" },
  { name: "Débito", value: 18, color: "hsl(var(--chart-3))" },
  { name: "Dinheiro", value: 12, color: "hsl(var(--chart-4))" },
  { name: "Outros", value: 4, color: "hsl(var(--chart-5))" },
];

// ── Top 10 products ──
export const topProducts = [
  { name: "Café Premium 500g", quantity: 142 },
  { name: "Leite Integral 1L", quantity: 128 },
  { name: "Pão de Forma", quantity: 115 },
  { name: "Arroz Tipo 1 5kg", quantity: 98 },
  { name: "Feijão Carioca 1kg", quantity: 87 },
  { name: "Açúcar Refinado 1kg", quantity: 76 },
  { name: "Óleo de Soja 900ml", quantity: 65 },
  { name: "Macarrão Espaguete", quantity: 54 },
  { name: "Sabão em Pó 1kg", quantity: 48 },
  { name: "Detergente 500ml", quantity: 42 },
];

// ── Stock evolution ──
export const stockEvolution = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - 29 + i);
  return {
    date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    value: Math.round(245000 + Math.random() * 30000 + i * 500),
  };
});

// ── Sales by hour ──
export const salesByHour = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}h`,
  sales: i >= 8 && i <= 20
    ? Math.round(5 + Math.random() * (i >= 11 && i <= 13 ? 25 : i >= 17 && i <= 19 ? 20 : 10))
    : Math.round(Math.random() * 3),
}));

// ── Critical stock ──
export const criticalStockItems = [
  { id: "1", name: "Café Premium 500g", current: 5, minimum: 20, supplier: "Dist. Nacional" },
  { id: "2", name: "Leite Integral 1L", current: 8, minimum: 50, supplier: "Laticínios SA" },
  { id: "3", name: "Açúcar Refinado 1kg", current: 3, minimum: 30, supplier: "Dist. Nacional" },
  { id: "4", name: "Papel Toalha", current: 2, minimum: 15, supplier: "Higiene & Cia" },
  { id: "5", name: "Sabonete Líquido", current: 4, minimum: 12, supplier: "Higiene & Cia" },
];

// ── PDV terminals ──
export const pdvTerminals = [
  { id: "1", name: "PDV 01 - Caixa Principal", status: "online" as const, lastSync: "Há 2 min", pendingSales: 0 },
  { id: "2", name: "PDV 02 - Caixa Rápido", status: "online" as const, lastSync: "Há 5 min", pendingSales: 0 },
  { id: "3", name: "PDV 03 - Autoatendimento", status: "offline" as const, lastSync: "Há 3 horas", pendingSales: 12 },
];

// ── Products ──
export type MockProduct = {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  category: string;
  supplier: string;
  costPrice: number;
  salePrice: number;
  margin: number;
  stockQuantity: number;
  stockMin: number;
  unit: string;
  active: boolean;
  imageUrl?: string;
};

export const mockProducts: MockProduct[] = [
  { id: "1", sku: "CAF001", barcode: "7891234560011", name: "Café Premium 500g", description: "Café torrado e moído premium", category: "Bebidas", supplier: "Dist. Nacional", costPrice: 12.5, salePrice: 18.9, margin: 51.2, stockQuantity: 5, stockMin: 20, unit: "un", active: true },
  { id: "2", sku: "LEI001", barcode: "7891234560028", name: "Leite Integral 1L", description: "Leite integral UHT", category: "Laticínios", supplier: "Laticínios SA", costPrice: 4.2, salePrice: 5.99, margin: 42.6, stockQuantity: 8, stockMin: 50, unit: "un", active: true },
  { id: "3", sku: "ARR001", barcode: "7891234560035", name: "Arroz Tipo 1 5kg", description: "Arroz branco tipo 1", category: "Grãos", supplier: "Dist. Nacional", costPrice: 18.0, salePrice: 24.9, margin: 38.3, stockQuantity: 45, stockMin: 30, unit: "un", active: true },
  { id: "4", sku: "FEI001", barcode: "7891234560042", name: "Feijão Carioca 1kg", description: "Feijão carioca tipo 1", category: "Grãos", supplier: "Dist. Nacional", costPrice: 7.5, salePrice: 9.99, margin: 33.2, stockQuantity: 38, stockMin: 25, unit: "un", active: true },
  { id: "5", sku: "ACU001", barcode: "7891234560059", name: "Açúcar Refinado 1kg", description: "Açúcar branco refinado", category: "Mercearia", supplier: "Dist. Nacional", costPrice: 3.8, salePrice: 5.49, margin: 44.5, stockQuantity: 3, stockMin: 30, unit: "un", active: true },
  { id: "6", sku: "OLE001", barcode: "7891234560066", name: "Óleo de Soja 900ml", description: "Óleo de soja refinado", category: "Mercearia", supplier: "Dist. Nacional", costPrice: 5.9, salePrice: 7.99, margin: 35.4, stockQuantity: 22, stockMin: 15, unit: "un", active: true },
  { id: "7", sku: "MAC001", barcode: "7891234560073", name: "Macarrão Espaguete 500g", description: "Macarrão sêmola", category: "Mercearia", supplier: "Dist. Nacional", costPrice: 2.8, salePrice: 4.29, margin: 53.2, stockQuantity: 55, stockMin: 20, unit: "un", active: true },
  { id: "8", sku: "SAB001", barcode: "7891234560080", name: "Sabão em Pó 1kg", description: "Sabão em pó multiação", category: "Limpeza", supplier: "Higiene & Cia", costPrice: 8.5, salePrice: 12.9, margin: 51.8, stockQuantity: 18, stockMin: 10, unit: "un", active: true },
  { id: "9", sku: "DET001", barcode: "7891234560097", name: "Detergente 500ml", description: "Detergente líquido neutro", category: "Limpeza", supplier: "Higiene & Cia", costPrice: 1.8, salePrice: 2.99, margin: 66.1, stockQuantity: 40, stockMin: 25, unit: "un", active: true },
  { id: "10", sku: "PAO001", barcode: "7891234560104", name: "Pão de Forma 500g", description: "Pão de forma tradicional", category: "Padaria", supplier: "Padaria Central", costPrice: 5.0, salePrice: 7.49, margin: 49.8, stockQuantity: 12, stockMin: 15, unit: "un", active: true },
];

// ── Categories ──
export type MockCategory = {
  id: string;
  name: string;
  parentId: string | null;
  parentName: string | null;
  productCount: number;
};

export const mockCategories: MockCategory[] = [
  { id: "1", name: "Bebidas", parentId: null, parentName: null, productCount: 15 },
  { id: "2", name: "Laticínios", parentId: null, parentName: null, productCount: 12 },
  { id: "3", name: "Grãos", parentId: null, parentName: null, productCount: 8 },
  { id: "4", name: "Mercearia", parentId: null, parentName: null, productCount: 22 },
  { id: "5", name: "Limpeza", parentId: null, parentName: null, productCount: 18 },
  { id: "6", name: "Padaria", parentId: null, parentName: null, productCount: 6 },
  { id: "7", name: "Refrigerantes", parentId: "1", parentName: "Bebidas", productCount: 8 },
  { id: "8", name: "Sucos", parentId: "1", parentName: "Bebidas", productCount: 5 },
  { id: "9", name: "Higiene", parentId: null, parentName: null, productCount: 10 },
];

// ── Suppliers ──
export type MockSupplier = {
  id: string;
  name: string;
  cnpj: string;
  contactName: string;
  phone: string;
  email: string;
  avgDeliveryDays: number;
  notes: string;
};

export const mockSuppliers: MockSupplier[] = [
  { id: "1", name: "Distribuidora Nacional LTDA", cnpj: "12.345.678/0001-90", contactName: "João Silva", phone: "(11) 99999-0001", email: "joao@distnacional.com.br", avgDeliveryDays: 3, notes: "Fornecedor principal de mercearia" },
  { id: "2", name: "Laticínios SA", cnpj: "23.456.789/0001-01", contactName: "Maria Santos", phone: "(11) 99999-0002", email: "maria@laticinios.com.br", avgDeliveryDays: 1, notes: "Entregas diárias" },
  { id: "3", name: "Higiene & Cia LTDA", cnpj: "34.567.890/0001-12", contactName: "Pedro Costa", phone: "(11) 99999-0003", email: "pedro@higienecia.com.br", avgDeliveryDays: 5, notes: "" },
  { id: "4", name: "Padaria Central", cnpj: "45.678.901/0001-23", contactName: "Ana Lima", phone: "(11) 99999-0004", email: "ana@padariacentral.com.br", avgDeliveryDays: 1, notes: "Entregas de segunda a sábado" },
];

// ── Stock movements ──
export type MockMovement = {
  id: string;
  date: string;
  type: "purchase" | "sale" | "adjustment_in" | "adjustment_out" | "refund" | "transfer";
  productName: string;
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  responsible: string;
  origin: string;
  notes: string;
};

const movementTypes: MockMovement["type"][] = ["purchase", "sale", "adjustment_in", "adjustment_out", "refund", "transfer"];
const typeLabels: Record<MockMovement["type"], string> = {
  purchase: "Entrada",
  sale: "Saída",
  adjustment_in: "Ajuste +",
  adjustment_out: "Ajuste -",
  refund: "Devolução",
  transfer: "Transferência",
};

export { typeLabels };

export const mockMovements: MockMovement[] = Array.from({ length: 25 }, (_, i) => {
  const type = movementTypes[i % movementTypes.length];
  const product = mockProducts[i % mockProducts.length];
  const qty = Math.ceil(Math.random() * 20);
  const before = Math.ceil(Math.random() * 50) + 10;
  const after = type === "sale" || type === "adjustment_out" ? before - qty : before + qty;
  const date = new Date();
  date.setDate(date.getDate() - i);
  return {
    id: String(i + 1),
    date: date.toLocaleString("pt-BR"),
    type,
    productName: product.name,
    quantity: qty,
    balanceBefore: before,
    balanceAfter: Math.max(0, after),
    responsible: "Admin",
    origin: type === "sale" ? "PDV 01" : "Manual",
    notes: "",
  };
});
