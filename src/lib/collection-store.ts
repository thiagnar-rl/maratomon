"use client";

import { useEffect, useSyncExternalStore } from "react";
import { fetchCardInfo, listCards, listCollections, unitValue, updateCard, type CardInfo, type Collection, type CollectionCard } from "@/lib/collection";
import { radarSummary, type RadarSummary } from "@/lib/radar";
import { splitCardId, type Language } from "@/lib/tcg/card-ref";
import { getSupabase } from "@/lib/supabase";

/**
 * Dados da coleção compartilhados pelo site (painel, grade de cartas, conquistas, scan).
 * Carrega uma vez por sessão e atualiza quando algo muda (adicionar, importar, apagar).
 */
export type SetSummary = { id: string; name: string; namePt?: string; serie: string; logo?: string; symbol?: string; official: number; total: number; code?: string; releaseDate?: string };

export type CollectionData = {
  status: "idle" | "loading" | "ready" | "error";
  error?: string;
  collections: Collection[];
  cards: CollectionCard[];
  info: Record<string, CardInfo>;
  radar: Record<string, RadarSummary>;
  sets: Record<string, SetSummary>;
  pricesReady: boolean;
  updatedAt: number | null;
};

const EMPTY: CollectionData = { status: "idle", collections: [], cards: [], info: {}, radar: {}, sets: {}, pricesReady: false, updatedAt: null };
let state: CollectionData = EMPTY;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();
const set = (patch: Partial<CollectionData>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

async function fetchSets(ids: string[]): Promise<Record<string, SetSummary>> {
  if (!ids.length) return {};
  try {
    const r = await fetch(`/api/tcg/sets?ids=${encodeURIComponent([...new Set(ids)].join(","))}`);
    const { sets } = (await r.json()) as { sets: SetSummary[] };
    return Object.fromEntries(sets.map((s) => [s.id, s]));
  } catch {
    return {};
  }
}

/** Guarda o preço de hoje nas cartas que ainda não têm "preço quando entrou" (só uma vez). */
function fillAddedPrices(cards: CollectionCard[], info: Record<string, CardInfo>) {
  const missing = cards.filter((c) => c.added_brl == null && info[c.card_id]?.brl != null).slice(0, 50);
  missing.forEach((c) => {
    const value = Math.round((info[c.card_id].brl as number) * 100) / 100;
    c.added_brl = value;
    void updateCard(c.id, { added_brl: value }).catch(() => {});
  });
}

export function loadCollection(force = false): Promise<void> {
  if (inflight && !force) return inflight;
  if (state.status === "ready" && !force) return Promise.resolve();
  if (state.status !== "ready") set({ status: "loading" });
  inflight = (async () => {
    try {
      const [collections, cards] = await Promise.all([listCollections(), listCards()]);
      set({ status: "ready", collections, cards, error: undefined });
      const ids = cards.map((c) => c.card_id);
      const [info, radar, sets] = await Promise.all([fetchCardInfo(ids), radarSummary(ids).catch(() => ({})), fetchSets(ids.map((id) => splitCardId(id).setId))]);
      fillAddedPrices(cards, info);
      set({ info, radar, sets, pricesReady: true, updatedAt: Date.now(), cards: [...cards] });
    } catch (e) {
      set({ status: "error", error: e instanceof Error ? e.message : "Erro ao carregar a coleção." });
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Atualiza depois de mudar algo (mantém os dados atuais na tela enquanto recarrega). */
export const refreshCollection = () => loadCollection(true);

/** Mexe só na memória (resposta imediata na tela); use junto com a gravação no banco. */
export function patchLocal(update: (d: CollectionData) => Partial<CollectionData>) {
  set(update(state));
}

// Ao sair da conta, limpa tudo.
if (typeof window !== "undefined") {
  getSupabase()?.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") set(EMPTY);
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Dados da coleção (carrega sozinho na primeira vez, se `enabled`). */
export function useCollectionData(enabled = true): CollectionData {
  const data = useSyncExternalStore(subscribe, () => state, () => EMPTY);
  useEffect(() => {
    if (enabled) void loadCollection();
  }, [enabled]);
  return data;
}

/* ---------------------------- números do painel ---------------------------- */

export type SetProgress = {
  set: SetSummary;
  /** Números (normalizados) que a pessoa tem até o total oficial. */
  base: number;
  /** Todas as cartas diferentes da coleção, incluindo as secretas. */
  master: number;
  copies: number;
  value: number;
  cards: CollectionCard[];
};

export type CollectionStats = {
  owned: CollectionCard[];
  wanted: CollectionCard[];
  total: number;
  week: number;
  entry: number;
  entryCovered: number;
  copies: number;
  distinct: number;
  paid: number;
  withoutPaid: number;
  withoutPrice: number;
  byLanguage: { language: Language; copies: number; value: number }[];
  topGainer: { card: CollectionCard; pct: number } | null;
  topValue: (CollectionCard & { value: number })[];
  sets: SetProgress[];
  alerts: (CollectionCard & { now: number | null; hit: boolean })[];
  brShare: number;
};

export function computeStats(d: CollectionData): CollectionStats {
  const kindOf = new Map(d.collections.map((c) => [c.id, c.kind]));
  const owned = d.cards.filter((c) => kindOf.get(c.collection_id) !== "desejos");
  const wanted = d.cards.filter((c) => kindOf.get(c.collection_id) === "desejos");
  const unit = (c: CollectionCard) => unitValue(c, d.info, d.radar);
  const valueOf = (c: CollectionCard) => (unit(c) ?? 0) * c.quantity;

  let total = 0, week = 0, entry = 0, entryCovered = 0, copies = 0, paid = 0, withoutPaid = 0, withoutPrice = 0, br = 0;
  const lang = new Map<Language, { copies: number; value: number }>();
  let topGainer: CollectionStats["topGainer"] = null;
  for (const c of owned) {
    const u = unit(c);
    const v = (u ?? 0) * c.quantity;
    total += v;
    copies += c.quantity;
    if (u == null) withoutPrice += c.quantity;
    if (c.paid_brl != null) paid += c.paid_brl * c.quantity;
    else withoutPaid += c.quantity;
    if (d.info[c.card_id]?.br && c.market_brl == null) br += c.quantity;
    const pct = d.info[c.card_id]?.change7d;
    if (pct != null && c.market_brl == null && u != null) {
      week += v - v / (1 + pct / 100);
      if (!topGainer || pct > topGainer.pct) topGainer = { card: c, pct };
    }
    if (c.added_brl != null && u != null) {
      entry += c.added_brl * c.quantity;
      entryCovered += v;
    }
    const l = lang.get(c.language ?? "PT") ?? { copies: 0, value: 0 };
    l.copies += c.quantity;
    l.value += v;
    lang.set(c.language ?? "PT", l);
  }

  const bySet = new Map<string, CollectionCard[]>();
  for (const c of owned) {
    const { setId } = splitCardId(c.card_id);
    bySet.set(setId, [...(bySet.get(setId) ?? []), c]);
  }
  const sets: SetProgress[] = [];
  for (const [setId, list] of bySet) {
    const info = d.sets[setId];
    if (!info) continue;
    const numbers = new Set(list.map((c) => splitCardId(c.card_id).localId));
    const base = [...numbers].filter((n) => /^\d+$/.test(n) && Number(n) <= info.official).length;
    sets.push({ set: info, base, master: numbers.size, copies: list.reduce((n, c) => n + c.quantity, 0), value: list.reduce((n, c) => n + valueOf(c), 0), cards: list });
  }
  sets.sort((a, b) => (b.set.releaseDate ?? "").localeCompare(a.set.releaseDate ?? "") || b.value - a.value);

  const alerts = wanted
    .filter((c) => c.target_brl != null)
    .map((c) => {
      const now = unit(c);
      return { ...c, now, hit: now != null && now <= (c.target_brl as number) };
    })
    .sort((a, b) => Number(b.hit) - Number(a.hit));

  return {
    owned,
    wanted,
    total,
    week,
    entry,
    entryCovered,
    copies,
    distinct: new Set(owned.map((c) => c.card_id)).size,
    paid,
    withoutPaid,
    withoutPrice,
    byLanguage: [...lang].map(([language, v]) => ({ language, ...v })).sort((a, b) => b.copies - a.copies),
    topGainer: topGainer && (topGainer as { pct: number }).pct > 0 ? topGainer : null,
    topValue: owned.map((c) => ({ ...c, value: valueOf(c) })).sort((a, b) => b.value - a.value).slice(0, 10),
    sets,
    alerts,
    brShare: copies ? br / copies : 0,
  };
}

/** Quantas cópias a pessoa tem de cada carta (fora a lista de desejos). */
export function ownedCounts(d: CollectionData): Map<string, number> {
  const wish = new Set(d.collections.filter((c) => c.kind === "desejos").map((c) => c.id));
  const m = new Map<string, number>();
  for (const c of d.cards) if (!wish.has(c.collection_id)) m.set(c.card_id, (m.get(c.card_id) ?? 0) + c.quantity);
  return m;
}
