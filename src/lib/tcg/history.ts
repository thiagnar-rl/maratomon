import "server-only";
import type { PriceSnapshot } from "./types";

/**
 * Histórico diário de preços (Supabase, tabela card_price_history).
 * Gravamos o preço de hoje quando a carta é aberta; o gráfico mostra a oscilação ao longo dos dias.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const headers = { apikey: key ?? "", Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

export type HistoryPoint = { day: string; usd: number | null; eur: number | null; brl: number | null };

export async function recordPrice(cardId: string, snapshot: PriceSnapshot, usdBrl: number) {
  if (!url || !key || (snapshot.usd == null && snapshot.eur == null)) return;
  try {
    await fetch(`${url}/rest/v1/rpc/record_card_price`, {
      method: "POST",
      headers,
      body: JSON.stringify({ p_card_id: cardId, p_usd: snapshot.usd, p_eur: snapshot.eur, p_brl: snapshot.brl, p_usd_brl: usdBrl }),
      cache: "no-store",
    });
  } catch {
    // histórico é um extra: se falhar, a página segue normal
  }
}

/** Grava o preço de hoje de várias cartas de uma vez. */
export async function recordPrices(items: ({ id: string } & PriceSnapshot)[], usdBrl: number) {
  const valid = items.filter((i) => i.usd != null || i.eur != null).slice(0, 300);
  if (!url || !key || valid.length === 0) return;
  try {
    await fetch(`${url}/rest/v1/rpc/record_card_prices`, {
      method: "POST",
      headers,
      body: JSON.stringify({ items: valid.map(({ id, usd, eur, brl }) => ({ id, usd, eur, brl })), p_usd_brl: usdBrl }),
      cache: "no-store",
    });
  } catch {
    // ignorado
  }
}

export async function getHistory(cardId: string, days = 365): Promise<HistoryPoint[]> {
  if (!url || !key) return [];
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  try {
    const response = await fetch(
      `${url}/rest/v1/card_price_history?card_id=eq.${encodeURIComponent(cardId)}&day=gte.${since}&select=day,usd,eur,brl&order=day.asc`,
      { headers, next: { revalidate: 3600 } },
    );
    if (!response.ok) return [];
    return ((await response.json()) as HistoryPoint[]).map((p) => ({ ...p, usd: num(p.usd), eur: num(p.eur), brl: num(p.brl) }));
  } catch {
    return [];
  }
}

const num = (v: unknown) => (v == null ? null : Number(v));
