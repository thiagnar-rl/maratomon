import type { CardDetail, PriceSnapshot, Pricing, Rates, TcgplayerVariant } from "./types";

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

/** Melhor estimativa do valor da carta em reais e de onde veio. */
export function estimateBRL(card: Pick<CardDetail, "pricing">, rates: Rates): { brl: number; source: string } | null {
  const variants = tcgplayerVariants(card.pricing);
  const market = variants.map(([, v]) => v.marketPrice ?? v.midPrice).find((p): p is number => typeof p === "number" && p > 0);
  if (market) return { brl: market * rates.USD, source: "TCGplayer (mercado)" };
  const cm = card.pricing?.cardmarket;
  const eur = cm?.trend || cm?.avg30 || cm?.avg;
  if (eur) return { brl: eur * rates.EUR, source: "Cardmarket (tendência)" };
  return null;
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
    change7d: pct(cm?.avg1, cm?.avg7),
    change30d: pct(cm?.avg1 ?? cm?.trend, cm?.avg30),
  };
}

/** "+3,2%" / "−1,0%" */
export const formatPct = (value: number | null | undefined) =>
  typeof value === "number" ? `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—";
