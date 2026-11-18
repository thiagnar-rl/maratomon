"use client";

import type { PricedCard } from "@/lib/tcg/types";
import { getSupabase } from "@/lib/supabase";

/** Minha coleção: decks e pastas no Supabase (tabelas e Storage protegidos por RLS). */
export type CollectionKind = "deck" | "pasta" | "desejos";

export const KIND_LABEL: Record<CollectionKind, string> = { deck: "Deck", pasta: "Pasta", desejos: "Lista de desejos" };

export type Collection = {
  id: string;
  kind: CollectionKind;
  name: string;
  description: string | null;
  created_at: string;
};

export type CollectionCard = {
  id: string;
  collection_id: string;
  card_id: string;
  card_name: string;
  set_name: string | null;
  image: string | null;
  quantity: number;
  condition: string | null;
  paid_brl: number | null;
  /** Preço de mercado no Brasil (R$, por unidade) conferido pelo dono. */
  market_brl: number | null;
  /** Lista de desejos: avisa quando o preço chegar neste valor (R$). */
  target_brl: number | null;
};

export type CollectionMedia = {
  id: string;
  collection_id: string;
  path: string;
  mime: string;
  caption: string | null;
  created_at: string;
};

export const CONDITIONS = ["NM", "LP", "MP", "HP", "DMG", "Gradeada"] as const;
const BUCKET = "colecao";
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

function client() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Login não configurado.");
  return supabase;
}

function check<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export async function listCollections(): Promise<Collection[]> {
  return check(await client().from("collections").select("*").order("created_at", { ascending: false }));
}

export async function getCollection(id: string): Promise<Collection | null> {
  return check(await client().from("collections").select("*").eq("id", id).maybeSingle());
}

export async function createCollection(input: { kind: CollectionKind; name: string; description?: string }) {
  return check<Collection>(await client().from("collections").insert(input).select().single());
}

export async function deleteCollection(id: string) {
  // apaga os arquivos do Storage antes; as linhas somem em cascata
  const media = await listMedia(id);
  if (media.length) await client().storage.from(BUCKET).remove(media.map((m) => m.path));
  check(await client().from("collections").delete().eq("id", id));
}

export async function listCards(collectionId?: string): Promise<CollectionCard[]> {
  let query = client().from("collection_cards").select("*").order("created_at", { ascending: false });
  if (collectionId) query = query.eq("collection_id", collectionId);
  return check(await query);
}

export async function addCard(input: Omit<CollectionCard, "id" | "quantity" | "condition" | "paid_brl" | "market_brl" | "target_brl"> & Partial<Pick<CollectionCard, "quantity" | "condition" | "paid_brl" | "market_brl" | "target_brl">>) {
  return check<CollectionCard>(await client().from("collection_cards").insert(input).select().single());
}

export async function updateCard(id: string, patch: Partial<Pick<CollectionCard, "quantity" | "condition" | "paid_brl" | "market_brl" | "target_brl">>) {
  check(await client().from("collection_cards").update(patch).eq("id", id));
}

export async function removeCard(id: string) {
  check(await client().from("collection_cards").delete().eq("id", id));
}

export async function listMedia(collectionId: string): Promise<CollectionMedia[]> {
  return check(await client().from("collection_media").select("*").eq("collection_id", collectionId).order("created_at"));
}

/** Envia uma foto ou vídeo para colecao/<usuário>/<coleção>/<arquivo>. */
export async function uploadMedia(collectionId: string, file: File, caption?: string) {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Arquivo maior que 50 MB.");
  if (!/^(image|video)\//.test(file.type)) throw new Error("Envie apenas fotos ou vídeos.");
  const supabase = client();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Entre na sua conta para enviar arquivos.");
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${auth.user.id}/${collectionId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return check<CollectionMedia>(
    await supabase.from("collection_media").insert({ collection_id: collectionId, path, mime: file.type, caption: caption || null }).select().single(),
  );
}

export async function deleteMedia(media: CollectionMedia) {
  const supabase = client();
  await supabase.storage.from(BUCKET).remove([media.path]);
  check(await supabase.from("collection_media").delete().eq("id", media.id));
}

/** Links temporários (1 hora) para exibir arquivos privados. */
export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await client().storage.from(BUCKET).createSignedUrls(paths, 3600);
  if (error) throw new Error(error.message);
  const urls: Record<string, string> = {};
  for (const item of data ?? []) if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
  return urls;
}

/** Preço (R$), variação e numeração de uma carta, vindos de /api/tcg/prices. */
export type CardInfo = {
  brl: number | null;
  /** true quando o preço é do Brasil (MYP Cards); false = internacional convertido. */
  br: boolean;
  /** Variação em % nos últimos 7 dias. */
  change7d: number | null;
  localId: string;
  official?: number;
};

/**
 * Valor unitário em R$, do mais confiável para o menos:
 * 1) preço que o dono anotou, 2) menor preço no Brasil (MYP Cards), 3) mediana do Radar BR, 4) mercado internacional convertido.
 */
export function unitValue(card: CollectionCard, info: Record<string, CardInfo>, radar: Record<string, { median_brl: number }> = {}) {
  const ref = info[card.card_id];
  return card.market_brl ?? (ref?.br ? ref.brl : null) ?? radar[card.card_id]?.median_brl ?? ref?.brl ?? null;
}

export function valueSource(card: CollectionCard, radar: Record<string, { median_brl: number }>, info: Record<string, CardInfo> = {}) {
  if (card.market_brl != null) return "anotado por você";
  if (info[card.card_id]?.br) return "Brasil · MYP Cards";
  if (radar[card.card_id]) return "Radar BR";
  return "internacional";
}

/** Busca preço (Brasil quando houver), variação de 7 dias e numeração de várias cartas, 60 por chamada. */
export async function fetchCardInfo(ids: string[]): Promise<Record<string, CardInfo>> {
  const unique = [...new Set(ids)];
  const out: Record<string, CardInfo> = {};
  for (const id of unique) out[id] = { brl: null, br: false, change7d: null, localId: id.split("-").pop() ?? id };
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 60) chunks.push(unique.slice(i, i + 60));
  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const response = await fetch(`/api/tcg/prices?ids=${encodeURIComponent(chunk.join(","))}`);
        if (!response.ok) return;
        const data = (await response.json()) as Record<string, PricedCard>;
        for (const [id, p] of Object.entries(data)) {
          out[id] = { brl: p.brl, br: Boolean(p.br), change7d: p.change7d, localId: p.meta?.localId ?? out[id].localId, official: p.meta?.official };
        }
      } catch {
        // mantém o valor vazio
      }
    }),
  );
  return out;
}
