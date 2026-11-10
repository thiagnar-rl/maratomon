"use client";

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

/** Informações de preço e numeração de uma carta (vindas de /api/tcg/card). */
export type CardInfo = { brl: number | null; localId: string; official?: number };

/**
 * Valor unitário em R$, do mais confiável para o menos:
 * 1) preço que o dono anotou, 2) mediana do Radar BR, 3) mercado internacional convertido.
 */
export function unitValue(card: CollectionCard, info: Record<string, CardInfo>, radar: Record<string, { median_brl: number }> = {}) {
  return card.market_brl ?? radar[card.card_id]?.median_brl ?? info[card.card_id]?.brl ?? null;
}

export function valueSource(card: CollectionCard, radar: Record<string, { median_brl: number }>) {
  if (card.market_brl != null) return "anotado por você";
  if (radar[card.card_id]) return "Radar BR";
  return "internacional";
}

/** Busca preço internacional (R$) e numeração de várias cartas. */
export async function fetchCardInfo(ids: string[]): Promise<Record<string, CardInfo>> {
  const unique = [...new Set(ids)];
  const entries = await Promise.all(
    unique.map(async (id): Promise<[string, CardInfo]> => {
      const fallback: CardInfo = { brl: null, localId: id.split("-").pop() ?? id };
      try {
        const response = await fetch(`/api/tcg/card/${encodeURIComponent(id)}`);
        if (!response.ok) return [id, fallback];
        const data = (await response.json()) as { estimate: { brl: number } | null; localId: string; official?: number };
        return [id, { brl: data.estimate?.brl ?? null, localId: data.localId, official: data.official }];
      } catch {
        return [id, fallback];
      }
    }),
  );
  return Object.fromEntries(entries);
}
