import { energyPt, rarityPt } from "./labels";
import type { CardDetail, CardMeta, PriceSnapshot, Pricing, Rates, TcgplayerVariant } from "./types";

/**
 * URL da imagem da carta. A TCGdex entrega uma "base" sem extensão; as imagens que completamos
 * de outras fontes (Pokémon TCG API / Scrydex) já vêm como URL do tamanho pequeno.
 */
export function cardImage(base: string | undefined, quality: "low" | "high" = "low") {
  if (!base) return null;
  if (base.startsWith("https://images.pokemontcg.io/")) return quality === "high" ? base.replace(/\.png$/, "_hires.png") : base;
  if (base.startsWith("https://images.scrydex.com/")) return quality === "high" ? base.replace(/\/small$/, "/large") : base;
  return `${base}/${quality}.webp`;
}

export const setLogo = (base: string | undefined) => (base ? `${base}.webp` : null);

const VARIANT_LABEL: Record<string, string> = {
  normal: "Normal",
  holofoil: "Holo",
  "reverse-holofoil": "Reverse holo",
  "1st-edition-holofoil": "1ª edição holo",
  "1st-edition-normal": "1ª edição",
  "unlimited-holofoil": "Ilimitada holo",
  "unlimited-normal": "Ilimitada",
};
export const variantLabel = (key: string) => VARIANT_LABEL[key] ?? key;

/** Variantes do TCGplayer que têm preço. */
export function tcgplayerVariants(pricing?: Pricing): [string, TcgplayerVariant][] {
  const tp = pricing?.tcgplayer;
  if (!tp) return [];
  return Object.entries(tp).filter(
    (entry): entry is [string, TcgplayerVariant] => typeof entry[1] === "object" && entry[1] !== null,
  );
}

export type QuoteRow = { label: string; currency: "USD" | "EUR"; min: number | null; avg: number | null; max: number | null };

export type MarketplaceQuote = {
  /** Faixa consolidada em reais: menor anúncio, preço médio e maior preço médio entre os marketplaces. */
  min: number | null;
  avg: number | null;
  max: number | null;
  /** Linhas por marketplace/versão, na moeda original. */
  rows: QuoteRow[];
};

const positive = (v: number | null | undefined): v is number => typeof v === "number" && v > 0;
const round2 = (v: number) => Math.round(v * 100) / 100;

/**
 * Preço com base nos marketplaces (TCGplayer nos EUA e Cardmarket na Europa), no formato menor / médio / maior.
 * O preço médio do site é a média entre o preço de mercado do TCGplayer e a tendência do Cardmarket, em reais.
 */
export function marketplaceQuote(card: Pick<CardDetail, "pricing">, rates: Rates): MarketplaceQuote {
  const rows: QuoteRow[] = [];
  const brl = { min: [] as number[], avg: [] as number[], max: [] as number[] };

  const variants = tcgplayerVariants(card.pricing);
  variants.forEach(([key, v], i) => {
    const avg = positive(v.marketPrice) ? v.marketPrice : positive(v.midPrice) ? v.midPrice : null;
    // O "maior anúncio" do TCGplayer às vezes é um valor fora da realidade (ex.: US$ 999); só entra se for até 3× o médio.
    const high = positive(v.highPrice) && avg && v.highPrice <= avg * 3 ? v.highPrice : null;
    const max = high ?? (positive(v.midPrice) ? v.midPrice : null);
    const min = positive(v.lowPrice) ? v.lowPrice : null;
    rows.push({ label: `TCGplayer · ${variantLabel(key)}`, currency: "USD", min, avg, max });
    // A primeira versão (a principal) entra na média do site.
    if (i === 0) {
      if (min) brl.min.push(min * rates.USD);
      if (avg) brl.avg.push(avg * rates.USD);
      if (max) brl.max.push(max * rates.USD);
    }
  });

  const cm = card.pricing?.cardmarket;
  if (cm) {
    const avg = [cm.trend, cm.avg, cm.avg30].find(positive) ?? null;
    const maxes = [cm.avg, cm.avg7, cm.avg30, cm.trend].filter(positive);
    const max = maxes.length ? Math.max(...maxes) : null;
    const min = positive(cm.low) ? cm.low : null;
    if (min || avg || max) {
      rows.push({ label: "Cardmarket", currency: "EUR", min, avg, max });
      if (min) brl.min.push(min * rates.EUR);
      if (avg) brl.avg.push(avg * rates.EUR);
      if (max) brl.max.push(max * rates.EUR);
    }
  }

  return {
    min: brl.min.length ? round2(Math.min(...brl.min)) : null,
    avg: brl.avg.length ? round2(brl.avg.reduce((a, b) => a + b, 0) / brl.avg.length) : null,
    max: brl.max.length ? round2(Math.max(...brl.max)) : null,
    rows,
  };
}

/** Preço da carta em reais (média dos marketplaces) e de onde veio. */
export function estimateBRL(card: Pick<CardDetail, "pricing">, rates: Rates): { brl: number; source: string } | null {
  const q = marketplaceQuote(card, rates);
  if (q.avg == null) return null;
  const names = [...new Set(q.rows.filter((r) => r.avg).map((r) => r.label.split(" · ")[0]))];
  return { brl: q.avg, source: names.length > 1 ? `média de ${names.join(" e ")}` : names[0] ?? "marketplace" };
}

export const formatMoney = (value: number | null | undefined, currency: "BRL" | "USD" | "EUR") =>
  typeof value === "number"
    ? value.toLocaleString("pt-BR", { style: "currency", currency, maximumFractionDigits: value < 10 ? 2 : 0 })
    : "—";

/** Pontos do gráfico de tendência do Cardmarket (do mais antigo ao mais recente). */
export function cardmarketSeries(pricing: Pricing | undefined, rates: Rates) {
  const cm = pricing?.cardmarket;
  if (!cm) return [];
  return [
    { label: "Média 30 dias", eur: cm.avg30 },
    { label: "Média 7 dias", eur: cm.avg7 },
    { label: "Ontem", eur: cm.avg1 },
    { label: "Tendência", eur: cm.trend },
  ]
    .filter((p): p is { label: string; eur: number } => typeof p.eur === "number" && p.eur > 0)
    .map((p) => ({ ...p, brl: Math.round(p.eur * rates.EUR * 100) / 100 }));
}

/** Lê um valor em reais digitado ("1.234,56", "1234,56" ou "1234.56"). Retorna null se vazio ou inválido. */
export function parseBRL(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  const normalized = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  const digits = normalized.replace(/[^0-9.]/g, "");
  if (!digits) return null;
  const value = Number(digits);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

const pct = (now: number | null | undefined, before: number | null | undefined) =>
  typeof now === "number" && typeof before === "number" && now > 0 && before > 0 ? ((now - before) / before) * 100 : null;

/** Preço do dia em US$ (TCGplayer), € (Cardmarket) e R$, com a oscilação recente. */
export function priceSnapshot(card: Pick<CardDetail, "pricing">, rates: Rates): PriceSnapshot {
  const variants = tcgplayerVariants(card.pricing);
  const usd = variants.map(([, v]) => v.marketPrice ?? v.midPrice).find((p): p is number => typeof p === "number" && p > 0) ?? null;
  const cm = card.pricing?.cardmarket;
  const eur = cm?.trend || cm?.avg1 || cm?.avg30 || cm?.avg || null;
  const estimate = estimateBRL(card, rates);
  return {
    usd,
    eur,
    brl: estimate ? Math.round(estimate.brl * 100) / 100 : null,
    // Tendência do Cardmarket contra as médias de venda (a média de um único dia oscila demais).
    change7d: pct(cm?.trend ?? cm?.avg1, cm?.avg7),
    change30d: pct(cm?.trend ?? cm?.avg1, cm?.avg30),
  };
}

/** "+3,2%" / "−1,0%" */
export const formatPct = (value: number | null | undefined) =>
  typeof value === "number" ? `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—";

const VARIANT_PT: Record<string, string> = {
  normal: "Normal",
  reverse: "Reverse holo",
  holo: "Holo",
  firstEdition: "1ª edição",
  wPromo: "Promo W",
};

/** Raridade, versões e ilustrador, para os filtros. */
export function cardMeta(
  card: Pick<CardDetail, "rarity" | "illustrator" | "variants" | "types" | "category"> & { localId?: string; set?: { name: string; cardCount?: { official?: number } } },
): CardMeta {
  return {
    localId: card.localId,
    official: card.set?.cardCount?.official,
    set: card.set?.name ?? null,
    rarity: rarityPt(card.rarity),
    types: (card.types ?? []).map(energyPt),
    category: card.category ?? null,
    illustrator: card.illustrator ?? null,
    variants: Object.entries(card.variants ?? {})
      .filter(([, on]) => on)
      .map(([k]) => VARIANT_PT[k] ?? k),
  };
}

/** Quanto o preço mudou em reais, a partir do preço atual e da variação percentual no período. */
export function priceDelta(brl: number | null | undefined, pct: number | null | undefined): number | null {
  if (brl == null || pct == null || pct <= -100) return null;
  return brl - brl / (1 + pct / 100);
}

/** "+R$ 12,30" / "−R$ 4,10" */
export function formatDelta(delta: number | null): string {
  if (delta == null) return "—";
  return `${delta >= 0 ? "+" : "−"}${formatMoney(Math.abs(delta), "BRL")}`;
}
