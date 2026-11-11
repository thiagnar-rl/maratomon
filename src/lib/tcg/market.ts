import "server-only";
import { getCard, getRates, getSeries, getSet } from "./api";
import { featuredCardIds } from "./featured";
import { recordPrices } from "./history";
import { priceSnapshot } from "./prices";
import type { CardDetail, PriceSnapshot, Rates } from "./types";

export type MarketRow = PriceSnapshot & { id: string; name: string; image?: string; setName: string; localId: string };

/**
 * Carteira acompanhada no painel do mercado: as cartas mais disputadas das coleções recentes
 * (raras secretas, acima da numeração oficial) + clássicos icônicos.
 */
async function poolIds(): Promise<string[]> {
  const series = await getSeries();
  const recentSets = series
    .filter((s) => !s.digital)
    .flatMap((s) => s.sets)
    .filter((set) => set.cardCount.total > set.cardCount.official && !/p$|promo/i.test(set.id))
    .slice(0, 4);
  const sets = await Promise.all(recentSets.map((s) => getSet(s.id)));
  const chase = sets.flatMap((set) =>
    (set?.cards ?? []).filter((c) => Number(c.localId) > (set?.cardCount.official ?? Infinity)).map((c) => c.id),
  );
  return [...new Set([...chase, ...featuredCardIds])].slice(0, 140);
}

export async function getMarket(): Promise<{ rows: MarketRow[]; rates: Rates }> {
  const [ids, rates] = await Promise.all([poolIds(), getRates()]);
  const cards: (CardDetail | null)[] = [];
  for (let i = 0; i < ids.length; i += 20) cards.push(...(await Promise.all(ids.slice(i, i + 20).map((id) => getCard(id)))));
  const rows = cards
    .filter((c): c is CardDetail => Boolean(c))
    .map((c) => ({ id: c.id, name: c.name, image: c.image, setName: c.set.name, localId: c.localId, ...priceSnapshot(c, rates) }))
    .filter((r) => r.brl != null);
  await recordPrices(rows, rates.USD);
  return { rows, rates };
}
