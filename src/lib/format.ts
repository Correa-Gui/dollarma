const DIGIT_RE = /\D/g;

export function trimText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

export function trimOptionalText(value: string | null | undefined): string | null {
  const trimmed = trimText(value);
  return trimmed ? trimmed : null;
}

export function digitsOnly(value: string | null | undefined): string {
  return trimText(value).replace(DIGIT_RE, "");
}

function formatCpfPartial(digits: string): string {
  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  if (digits.length <= 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  return digits.slice(0, 11);
}

function formatCnpjPartial(digits: string): string {
  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }

  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }

  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }

  if (digits.length <= 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  return digits.slice(0, 14);
}

export function formatCpfCnpj(value: string | null | undefined): string | null {
  const digits = digitsOnly(value);
  if (!digits) {
    return null;
  }

  return digits.length <= 11 ? formatCpfPartial(digits) : formatCnpjPartial(digits);
}

export function formatCpfCnpjPartial(value: string | null | undefined): string {
  const digits = digitsOnly(value);
  if (!digits) {
    return "";
  }

  return digits.length <= 11 ? formatCpfPartial(digits) : formatCnpjPartial(digits);
}

