import "server-only";
import type { CardBrief, CardDetail, Rates, SerieDetail, SetBrief, SetDetail } from "./types";

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

export async function getSet(id: string): Promise<(SetDetail & { namePt?: string }) | null> {
  const [set, pt] = await Promise.all([
    tcgdex<SetDetail>(`en/sets/${encodeURIComponent(id)}`, REVALIDATE.catalog),
    portugueseNames(),
  ]);
  return set ? { ...set, namePt: pt.get(set.id) } : null;
}

export const getCard = (id: string) => tcgdex<CardDetail>(`en/cards/${encodeURIComponent(id)}`, REVALIDATE.card);

export async function searchCards(query: string, limit = 60): Promise<CardBrief[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const results = await tcgdex<CardBrief[]>(
    `en/cards?name=like:${encodeURIComponent(q)}&pagination:itemsPerPage=${limit}`,
    REVALIDATE.card,
  );
  return results ?? [];
}

/** Cotação do dólar e do euro em reais (AwesomeAPI). Usa um valor aproximado se a API falhar. */
export async function getRates(): Promise<Rates> {
  try {
    const response = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL", {
      next: { revalidate: REVALIDATE.rates },
    });
    if (!response.ok) throw new Error(String(response.status));
    const data = (await response.json()) as Record<string, { bid: string; create_date: string }>;
    return { USD: Number(data.USDBRL.bid), EUR: Number(data.EURBRL.bid), updated: data.USDBRL.create_date, fallback: false };
  } catch {
    return { USD: 5.6, EUR: 6.2, updated: "", fallback: true };
  }
}
