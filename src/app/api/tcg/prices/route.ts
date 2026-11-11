import { getCard, getRates } from "@/lib/tcg/api";
import { recordPrices } from "@/lib/tcg/history";
import { cardMeta, priceSnapshot } from "@/lib/tcg/prices";
import type { PricedCard } from "@/lib/tcg/types";

/**
 * Preço do dia (e raridade, versões e ilustrador) de várias cartas: /api/tcg/prices?ids=sv03.5-199,base1-4
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
  const result: Record<string, PricedCard> = {};
  // Busca em lotes para não sobrecarregar a API.
  for (let i = 0; i < ids.length; i += 16) {
    const cards = await Promise.all(ids.slice(i, i + 16).map((id) => getCard(id)));
    cards.forEach((card, j) => {
      if (card) result[ids[i + j]] = { ...priceSnapshot(card, rates), meta: cardMeta(card) };
    });
  }
  void recordPrices(
    Object.entries(result).map(([id, { usd, eur, brl, change7d, change30d }]) => ({ id, usd, eur, brl, change7d, change30d })),
    rates.USD,
  );
  return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
