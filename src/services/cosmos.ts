export type CosmosProduct = {
  description: string;
  ncm: { code: string; description: string } | null;
};

export async function fetchCosmosProduct(ean: string): Promise<CosmosProduct | null> {
  const token = import.meta.env.VITE_COSMOS_TOKEN;
  if (!token) {
    console.warn("COSMOS: VITE_COSMOS_TOKEN não configurado");
    return null;
  }
  try {
    const res = await fetch(`https://api.cosmos.bluesoft.com.br/gtins/${ean}`, {
      headers: { "X-Cosmos-Token": token },
    });
    if (!res.ok) return null;
    return (await res.json()) as CosmosProduct;
  } catch {
    return null;
  }
}
