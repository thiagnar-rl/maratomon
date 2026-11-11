import "server-only";
import type { CardBrief, CardDetail, Rates, SerieDetail, SetBrief, SetDetail } from "./types";
import { extraImage } from "./missing-images";

/**
 * Dados do TCG: TCGdex (gratuita, sem chave). Preços: TCGplayer (EUA, atualizado de hora em hora)
 * e Cardmarket (Europa, diário), incluídos em cada carta.
 * ⚠️ Imagens das cartas são da The Pokémon Company: veja LEGAL.md antes de monetizar.
 */
const API = "https://api.tcgdex.net/v2";

/** Tempo de cache (segundos) por tipo de dado. */
export const REVALIDATE = { catalog: 60 * 60 * 12, card: 60 * 60, rates: 60 * 30 } as const;

async function tcgdex<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const response = await fetch(`${API}/${path}`, { next: { revalidate } });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null; // sem rede no build ou API fora do ar: a página mostra um aviso
  }
}

/** Nomes das coleções em português (quando a coleção saiu no Brasil). */
async function portugueseNames(): Promise<Map<string, string>> {
  const sets = await tcgdex<SetBrief[]>("pt/sets", REVALIDATE.catalog);
  return new Map((sets ?? []).map((s) => [s.id, s.name]));
}

export type SetWithPt = SetBrief & { namePt?: string };
export type SerieWithSets = Omit<SerieDetail, "sets"> & { sets: SetWithPt[]; digital: boolean };

/** Todas as séries com suas coleções, da mais nova para a mais antiga. */
export async function getSeries(): Promise<SerieWithSets[]> {
  const list = await tcgdex<{ id: string; name: string }[]>("en/series", REVALIDATE.catalog);
  if (!list) return [];
  const [details, pt] = await Promise.all([
    Promise.all(list.map((s) => tcgdex<SerieDetail>(`en/series/${s.id}`, REVALIDATE.catalog))),
    portugueseNames(),
  ]);
  return details
    .filter((d): d is SerieDetail => Boolean(d && d.sets?.length))
    .map((d) => ({
      ...d,
      digital: d.id === "tcgp",
      sets: [...d.sets].reverse().map((s) => ({ ...s, namePt: pt.get(s.id) })),
    }))
    .sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));
}

/** Idiomas em que a TCGdex às vezes tem a imagem que falta em inglês (mesma arte). */
const IMAGE_LANGS = ["es", "it", "de", "fr", "pt"] as const;

/**
 * Completa as imagens que a TCGdex não tem em inglês:
 * 1. Pokémon TCG API / Scrydex (tabela em missing-images.ts);
 * 2. a mesma carta em outro idioma na própria TCGdex.
 */
async function fillSetImages(setId: string, cards: CardBrief[]): Promise<CardBrief[]> {
  let filled = cards.map((c) => (c.image ? c : { ...c, image: extraImage(setId, c.localId) ?? undefined }));
  if (filled.every((c) => c.image)) return filled;
  const others = await Promise.all(
    IMAGE_LANGS.map((lang) => tcgdex<SetDetail>(`${lang}/sets/${encodeURIComponent(setId)}`, REVALIDATE.catalog)),
  );
  const byLocalId = new Map<string, string>();
  for (const other of others) for (const c of other?.cards ?? []) if (c.image && !byLocalId.has(c.localId)) byLocalId.set(c.localId, c.image);
  filled = filled.map((c) => (c.image ? c : { ...c, image: byLocalId.get(c.localId) }));
  return filled;
}

export async function getSet(id: string): Promise<(SetDetail & { namePt?: string }) | null> {
  const [set, pt] = await Promise.all([
    tcgdex<SetDetail>(`en/sets/${encodeURIComponent(id)}`, REVALIDATE.catalog),
    portugueseNames(),
  ]);
  if (!set) return null;
  return { ...set, cards: await fillSetImages(set.id, set.cards ?? []), namePt: pt.get(set.id) };
}

export async function getCard(id: string): Promise<CardDetail | null> {
  const card = await tcgdex<CardDetail>(`en/cards/${encodeURIComponent(id)}`, REVALIDATE.card);
  if (!card || card.image) return card;
  const extra = extraImage(card.set.id, card.localId);
  if (extra) return { ...card, image: extra };
  for (const lang of IMAGE_LANGS) {
    const other = await tcgdex<CardBrief>(`${lang}/cards/${encodeURIComponent(id)}`, REVALIDATE.catalog);
    if (other?.image) return { ...card, image: other.image };
  }
  return card;
}

export async function searchCards(query: string, limit = 60): Promise<CardBrief[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const results = await tcgdex<CardBrief[]>(
    `en/cards?name=like:${encodeURIComponent(q)}&pagination:itemsPerPage=${limit}`,
    REVALIDATE.card,
  );
  return (results ?? []).map((c) => {
    if (c.image) return c;
    const setId = c.id.slice(0, c.id.length - c.localId.length - 1);
    return { ...c, image: extraImage(setId, c.localId) ?? undefined };
  });
}

/** Cotação do dólar e do euro em reais: AwesomeAPI, depois Frankfurter (BCE), depois um valor aproximado. */
export async function getRates(): Promise<Rates> {
  try {
    const response = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL", {
      next: { revalidate: REVALIDATE.rates },
    });
    if (!response.ok) throw new Error(String(response.status));
    const data = (await response.json()) as Record<string, { bid: string; create_date: string }>;
    const usd = Number(data.USDBRL?.bid);
    const eur = Number(data.EURBRL?.bid);
    if (usd > 0 && eur > 0) return { USD: usd, EUR: eur, updated: data.USDBRL.create_date, fallback: false };
    throw new Error("cotação inválida");
  } catch {
    try {
      const response = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=BRL,EUR", {
        next: { revalidate: REVALIDATE.rates },
      });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { date: string; rates: { BRL: number; EUR: number } };
      return { USD: data.rates.BRL, EUR: data.rates.BRL / data.rates.EUR, updated: data.date, fallback: false };
    } catch {
      return { USD: 5.6, EUR: 6.2, updated: "", fallback: true };
    }
  }
}
