import { MockProduct, mockProducts } from "./mock-data";

// ── Sales ──
export type MockSaleItem = {
  id: string;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type MockSale = {
  id: string;
  number: number;
  date: string;
  soldAt: string;
  terminal: string;
  origin: "pdv" | "web";
  paymentMethod: string;
  items: MockSaleItem[];
  total: number;
  status: "completed" | "cancelled" | "refunded";
  cancelReason?: string;
  createdBy: string;
};

const paymentMethods = ["Pix", "Crédito", "Débito", "Dinheiro"];
const terminals = ["PDV 01", "PDV 02", "PDV 03", "Web"];

export const mockSales: MockSale[] = Array.from({ length: 40 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(i / 3));
  date.setHours(8 + (i % 12), Math.floor(Math.random() * 60));

  const numItems = 1 + Math.floor(Math.random() * 4);
  const items: MockSaleItem[] = Array.from({ length: numItems }, (_, j) => {
    const product = mockProducts[(i + j) % mockProducts.length];
    const qty = 1 + Math.floor(Math.random() * 3);
    return {
      id: `${i}-${j}`,
      productName: product.name,
      barcode: product.barcode,
      quantity: qty,
      unitPrice: product.salePrice,
      subtotal: +(qty * product.salePrice).toFixed(2),
    };
  });

  const total = +items.reduce((sum, it) => sum + it.subtotal, 0).toFixed(2);
  const terminal = terminals[i % terminals.length];
  const statuses: MockSale["status"][] = ["completed", "completed", "completed", "completed", "cancelled", "refunded"];

  return {
    id: `sale-${String(i + 1).padStart(4, "0")}`,
    number: 1000 + i,
    date: date.toLocaleDateString("pt-BR"),
    soldAt: date.toLocaleString("pt-BR"),
    terminal,
    origin: terminal === "Web" ? "web" : "pdv",
    paymentMethod: paymentMethods[i % paymentMethods.length],
    items,
    total,
    status: statuses[i % statuses.length],
    cancelReason: statuses[i % statuses.length] === "cancelled" ? "Cliente desistiu" : undefined,
    createdBy: "Admin",
  };
});

// ── Refunds ──
export type MockRefund = {
  id: string;
  saleId: string;
  saleNumber: number;
  date: string;
  reason: string;
  items: { productName: string; quantity: number; subtotal: number }[];
  totalRefunded: number;
  createdBy: string;
};

export const mockRefunds: MockRefund[] = mockSales
  .filter((s) => s.status === "refunded")
  .map((s, i) => ({
    id: `ref-${i + 1}`,
    saleId: s.id,
    saleNumber: s.number,
    date: s.date,
    reason: "Produto com defeito",
    items: s.items.slice(0, 1).map((it) => ({
      productName: it.productName,
      quantity: it.quantity,
      subtotal: it.subtotal,
    })),
    totalRefunded: s.items[0]?.subtotal ?? 0,
    createdBy: "Admin",
  }));

// ── Inventory ──
export type MockInventoryItem = {
  id: string;
  productName: string;
  sku: string;
  systemQty: number;
  countedQty: number | null;
  difference: number | null;
  status: "pending" | "counted" | "adjusted";
};

export const mockInventoryItems: MockInventoryItem[] = mockProducts.map((p, i) => {
  const counted = i < 6 ? p.stockQuantity + Math.floor(Math.random() * 6) - 3 : null;
  return {
    id: p.id,
    productName: p.name,
    sku: p.sku,
    systemQty: p.stockQuantity,
    countedQty: counted,
    difference: counted !== null ? counted - p.stockQuantity : null,
    status: counted !== null ? (counted === p.stockQuantity ? "adjusted" : "counted") : "pending",
  };
});
