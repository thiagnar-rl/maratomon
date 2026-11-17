import "server-only";
import { getCard, getRates, getSeries, getSet } from "./api";
import { featuredCardIds } from "./featured";
import { recordPrices } from "./history";
import { cardMeta, marketplaceQuote, priceSnapshot } from "./prices";
import { brPrices } from "./mypcards";
import type { BrPrice, CardDetail, CardMeta, PriceSnapshot, Rates } from "./types";

export type Period = "dia" | "semana" | "mes";

export type MarketRow = PriceSnapshot & {
  id: string;
  name: string;
  image?: string;
  setName: string;
  localId: string;
  meta: CardMeta;
  /** Menor preço no Brasil (MYP Cards), quando a carta está à venda lá. */
  br: BrPrice | null;
  /** Menor anúncio e preço médio alto, em reais (para as somas da lista). */
  brlLow: number | null;
  brlHigh: number | null;
  /** Cardmarket: tendência e média de 30 dias, em euro (painel TCGplayer × Cardmarket). */
  eurTrend: number | null;
  eur30: number | null;
  change: Record<Period, number | null>;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Carteira acompanhada: as cartas mais disputadas das coleções recentes
 * (raras secretas, acima da numeração oficial) + clássicos icônicos.
 */
async function poolIds(): Promise<string[]> {
  const series = await getSeries();
  const recentSets = series
    .filter((s) => !s.digital)
    .flatMap((s) => s.sets)
    .filter((set) => set.cardCount.total > set.cardCount.official && !/p$|promo/i.test(set.id))
    .slice(0, 8);
  const sets = await Promise.all(recentSets.map((s) => getSet(s.id)));
  const chase = sets.flatMap((set) =>
    (set?.cards ?? []).filter((c) => Number(c.localId) > (set?.cardCount.official ?? Infinity)).map((c) => c.id),
  );
  // Clássicos primeiro, para nunca ficarem de fora do limite.
  return [...new Set([...featuredCardIds, ...chase])].slice(0, 320);
}

const pct = (now?: number | null, before?: number | null) =>
  typeof now === "number" && typeof before === "number" && now > 0 && before > 0 ? ((now - before) / before) * 100 : null;

/** Variação do dia pelo histórico do próprio site (hoje × último dia anterior), no preço em dólar (ou euro), sem o efeito do câmbio. */
async function dailyChanges(ids: string[]): Promise<Record<string, number>> {
  if (!url || !key || ids.length === 0) return {};
  const since = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  try {
    const response = await fetch(
      `${url}/rest/v1/card_price_history?select=card_id,day,usd,eur&day=gte.${since}&card_id=in.(${ids.map(encodeURIComponent).join(",")})&order=day.desc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 900 } },
    );
    if (!response.ok) return {};
    const rows = (await response.json()) as { card_id: string; day: string; usd: number | null; eur: number | null }[];
    const byCard = new Map<string, { usd: number | null; eur: number | null }[]>();
    for (const r of rows) byCard.set(r.card_id, [...(byCard.get(r.card_id) ?? []), { usd: r.usd == null ? null : Number(r.usd), eur: r.eur == null ? null : Number(r.eur) }]);
    const out: Record<string, number> = {};
    for (const [id, list] of byCard) {
      if (list.length < 2) continue;
      const [a, b] = list;
      const change = pct(a.usd, b.usd) ?? pct(a.eur, b.eur);
      // Preço igual ao de ontem: deixa a tendência do Cardmarket mostrar o movimento do dia.
      if (change != null && Math.abs(change) >= 0.05) out[id] = change;
    }
    return out;
  } catch {
    return {};
  }
}


/** Variações acima de 75% num único dia costumam ser venda isolada ou erro de anúncio: ficam de fora. */
const sane = (v: number | null) => (v != null && Math.abs(v) <= 75 ? v : null);

function toRow(c: CardDetail, rates: Rates, day: number | undefined, br: BrPrice | undefined): MarketRow {
  const snap = priceSnapshot(c, rates);
  const cm = c.pricing?.cardmarket;
  const q = marketplaceQuote(c, rates);
  const main = br?.low ?? snap.brl;
  const brlLow = [q.min, main].filter((v): v is number => v != null).reduce((a, b) => Math.min(a, b), Infinity);
  const brlHigh = [q.max, main].filter((v): v is number => v != null).reduce((a, b) => Math.max(a, b), -Infinity);
  return {
    id: c.id,
    name: c.name,
    image: c.image,
    setName: c.set.name,
    localId: c.localId,
    ...snap,
    // Preço principal: menor anúncio no Brasil; sem ele, média dos marketplaces internacionais.
    brl: main,
    br: br ?? null,
    meta: cardMeta(c),
    brlLow: Number.isFinite(brlLow) ? Math.round(brlLow * 100) / 100 : null,
    brlHigh: Number.isFinite(brlHigh) ? Math.round(brlHigh * 100) / 100 : null,
    eurTrend: cm?.trend ?? null,
    eur30: cm?.avg30 ?? null,
    change: {
      // Dia: histórico da Forja Arcana; sem ele, tendência do Cardmarket contra a média de ontem.
      dia: sane(day ?? pct(cm?.trend, cm?.avg1)),
      semana: snap.change7d,
      mes: snap.change30d,
    },
  };
}

export async function getMarket(): Promise<{ rows: MarketRow[]; rates: Rates; updatedAt: string }> {
  const [ids, rates] = await Promise.all([poolIds(), getRates()]);
  const cards: (CardDetail | null)[] = [];
  for (let i = 0; i < ids.length; i += 24) cards.push(...(await Promise.all(ids.slice(i, i + 24).map((id) => getCard(id)))));
  const valid = cards.filter((c): c is CardDetail => Boolean(c));
  const snaps = valid.map((c) => ({ id: c.id, ...priceSnapshot(c, rates) })).filter((r) => r.brl != null);
  await recordPrices(snaps, rates.USD);
  const day = await dailyChanges(valid.map((c) => c.id));
  const br = await brPrices(valid.map((c) => ({ id: c.id, setId: c.set.id, localId: c.localId })));
  const rows = valid.map((c) => toRow(c, rates, day[c.id], br[c.id])).filter((r) => r.brl != null);
  return { rows, rates, updatedAt: new Date().toISOString() };
}
