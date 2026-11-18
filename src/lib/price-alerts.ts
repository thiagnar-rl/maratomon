"use client";

import { useEffect, useState } from "react";
import { listCards, listCollections } from "@/lib/collection";
import type { PricedCard } from "@/lib/tcg/types";

/** Carta da lista de desejos que chegou no preço-alvo. */
export type PriceAlert = { cardId: string; name: string; image: string | null; target: number; now: number; br: boolean };

const CACHE_KEY = "forja:alertas:v1";
const CACHE_MS = 30 * 60 * 1000;

/** Preço atual (R$) de várias cartas: Brasil (MYP Cards) quando houver, senão internacional. */
export async function fetchPrices(ids: string[]): Promise<Record<string, PricedCard>> {
  const unique = [...new Set(ids)];
  const out: Record<string, PricedCard> = {};
  for (let i = 0; i < unique.length; i += 60) {
    try {
      const response = await fetch(`/api/tcg/prices?ids=${encodeURIComponent(unique.slice(i, i + 60).join(","))}`);
      Object.assign(out, (await response.json()) as Record<string, PricedCard>);
    } catch {
      // segue com os próximos
    }
  }
  return out;
}

/** Confere a lista de desejos e devolve as cartas que já estão no preço-alvo (ou abaixo). */
export async function checkPriceAlerts(): Promise<PriceAlert[]> {
  const [collections, cards] = await Promise.all([listCollections(), listCards()]);
  const wishlists = new Set(collections.filter((c) => c.kind === "desejos").map((c) => c.id));
  const wanted = cards.filter((c) => wishlists.has(c.collection_id) && c.target_brl != null);
  if (wanted.length === 0) return [];
  const prices = await fetchPrices(wanted.map((c) => c.card_id));
  return wanted
    .map((c) => ({ c, p: prices[c.card_id] }))
    .filter(({ c, p }) => p?.brl != null && p.brl <= (c.target_brl as number))
    .map(({ c, p }) => ({ cardId: c.card_id, name: c.card_name, image: c.image, target: c.target_brl as number, now: p!.brl as number, br: Boolean(p!.br) }));
}

/** Alertas de preço da pessoa logada (consulta no máximo a cada 30 min por aba). */
export function usePriceAlerts(enabled: boolean) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "null") as { at: number; alerts: PriceAlert[] } | null;
      if (cached && Date.now() - cached.at < CACHE_MS) {
        const t = setTimeout(() => active && setAlerts(cached.alerts), 0);
        return () => {
          active = false;
          clearTimeout(t);
        };
      }
    } catch {
      // ignora cache inválido
    }
    checkPriceAlerts()
      .then((list) => {
        if (!active) return;
        setAlerts(list);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), alerts: list }));
        } catch {
          // ignorado
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [enabled]);
  return alerts;
}
