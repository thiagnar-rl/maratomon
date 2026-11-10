import type { CardDetail, Pricing, Rates, TcgplayerVariant } from "./types";

/** Imagem da carta: "low" (miniatura) ou "high" (detalhe). */
export const cardImage = (base: string | undefined, quality: "low" | "high" = "low") =>
  base ? `${base}/${quality}.webp` : null;

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
