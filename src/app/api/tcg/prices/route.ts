import { getCard, getRates } from "@/lib/tcg/api";
import { recordPrices } from "@/lib/tcg/history";
import { priceSnapshot } from "@/lib/tcg/prices";
import type { PriceSnapshot } from "@/lib/tcg/types";

/**
 * Preço do dia de várias cartas: /api/tcg/prices?ids=sv03.5-199,base1-4
 * Cada carta vem do cache da TCGdex (1 h). Aproveita para gravar o ponto de hoje no histórico.
 */
export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^[A-Za-z0-9.\-]{2,40}$/.test(id))
    .slice(0, 80);
  if (ids.length === 0) return Response.json({});

  const rates = await getRates();
  const result: Record<string, PriceSnapshot> = {};
  // Busca em lotes para não sobrecarregar a API.
  for (let i = 0; i < ids.length; i += 16) {
    const cards = await Promise.all(ids.slice(i, i + 16).map((id) => getCard(id)));
    cards.forEach((card, j) => {
      if (card) result[ids[i + j]] = priceSnapshot(card, rates);
    });
  }
  void recordPrices(
    Object.entries(result).map(([id, s]) => ({ id, ...s })),
    rates.USD,
  );
  return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
