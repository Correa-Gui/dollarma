const DIACRITICS = /[\u0300-\u036f]/g;

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function escapeLikeTerm(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

export function buildLooseLikePattern(query: string | null | undefined): string {
  const normalized = normalize(query ?? "");
  if (!normalized) {
    return "";
  }

  const terms = normalized.split(" ").filter(Boolean);
  if (terms.length === 0) {
    return "";
  }

  return `%${terms.map(escapeLikeTerm).join("%")}%`;
}
