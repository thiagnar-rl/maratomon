"use client";

import { getSupabase } from "@/lib/supabase";

/**
 * Radar BR: preços do mercado brasileiro registrados pela comunidade do Maratomon TCG.
 * Cada pessoa só vê os próprios registros; o público vê apenas a mediana anônima de cada carta.
 */
export type RadarSummary = {
  card_id: string;
  median_brl: number;
  min_brl: number;
  max_brl: number;
  notes: number;
  last_seen: string;
};

export type RadarWeek = { week: string; median_brl: number; notes: number };

export const LANGUAGES = ["PT", "EN", "JP", "Outro"] as const;
export const SOURCES = [
  { value: "loja", label: "Loja física" },
  { value: "evento", label: "Evento / torneio" },
  { value: "online", label: "Site ou marketplace" },
  { value: "troca", label: "Troca entre jogadores" },
  { value: "outro", label: "Outro" },
] as const;

/** Mínimo de registros para mostrar a mediana (evita "preço" baseado em uma pessoa só). */
export const MIN_NOTES = 2;

export async function radarSummary(cardIds: string[]): Promise<Record<string, RadarSummary>> {
  const supabase = getSupabase();
  if (!supabase || cardIds.length === 0) return {};
  const { data, error } = await supabase.rpc("br_price_summary", { card_ids: [...new Set(cardIds)] });
  if (error || !data) return {};
  return Object.fromEntries(
    (data as RadarSummary[]).filter((r) => r.notes >= MIN_NOTES).map((r) => [r.card_id, { ...r, median_brl: Number(r.median_brl), min_brl: Number(r.min_brl), max_brl: Number(r.max_brl) }]),
  );
}

export async function radarWeekly(cardId: string): Promise<RadarWeek[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("br_price_weekly", { p_card_id: cardId });
  if (error || !data) return [];
  return (data as RadarWeek[]).map((w) => ({ ...w, median_brl: Number(w.median_brl) }));
}

export async function radarTrending(limit = 10): Promise<{ card_id: string; notes: number; median_brl: number }[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("br_price_trending", { max_rows: limit });
  if (error || !data) return [];
  return (data as { card_id: string; notes: number; median_brl: number }[]).map((r) => ({ ...r, median_brl: Number(r.median_brl) }));
}

export async function addRadarNote(note: {
  card_id: string;
  price_brl: number;
  language: string;
  condition: string;
  source: string;
  observed_on: string;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Login não configurado.");
  const { error } = await supabase.from("br_price_notes").insert(note);
  if (error) throw new Error(error.message.includes("Limite") ? "Você atingiu o limite de 20 registros por dia." : error.message);
}
