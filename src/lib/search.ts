const DIACRITICS = /[\u0300-\u036f]/g;

function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function matchesLooseSearch(source: string, query: string): boolean {
  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) {
    return true;
  }

  const normalizedSource = normalizeForSearch(source);
  const terms = normalizedQuery.split(" ").filter(Boolean);

  let cursor = 0;
  for (const term of terms) {
    const nextIndex = normalizedSource.indexOf(term, cursor);
    if (nextIndex < 0) {
      return false;
    }
    cursor = nextIndex + term.length;
  }

  return true;
}
