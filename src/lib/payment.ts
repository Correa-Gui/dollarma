const PAYMENT_LABELS: Record<string, string> = {
  cash: "Dinheiro",
  dinheiro: "Dinheiro",
  pix: "PIX",
  credit_card: "Cartão de crédito",
  cartao_credito: "Cartão de crédito",
  credito: "Cartão de crédito",
  debit_card: "Cartão de débito",
  cartao_debito: "Cartão de débito",
  debito: "Cartão de débito",
  boleto: "Boleto",
  cheque: "Cheque",
  crediario: "Crediário",
  vale_refeicao: "Vale refeição",
};

function normalize(method?: string | null) {
  return (method ?? "").trim().toLowerCase();
}

export function normalizePaymentMethod(method?: string | null) {
  const value = normalize(method);
  if (!value) {
    return "";
  }

  switch (value) {
    case "dinheiro":
      return "cash";
    case "cartao_credito":
    case "credito":
    case "credit_card":
      return "credit_card";
    case "cartao_debito":
    case "debito":
    case "debit_card":
      return "debit_card";
    default:
      return value;
  }
}

export function getPaymentLabel(method?: string | null) {
  const normalized = normalizePaymentMethod(method);
  if (!normalized) {
    return "—";
  }

  return PAYMENT_LABELS[normalized] ?? method ?? "—";
}

export function getPaymentBucketKey(method?: string | null) {
  const normalized = normalizePaymentMethod(method);
  if (!normalized) {
    return "cash";
  }

  return normalized;
}

export const paymentLabelEntries = [
  { value: "cash", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "debit_card", label: "Cartão de débito" },
  { value: "boleto", label: "Boleto" },
  { value: "cheque", label: "Cheque" },
  { value: "crediario", label: "Crediário" },
] as const;
