"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/tcg/prices";
import type { CardBrief, PriceSnapshot } from "@/lib/tcg/types";
import { CardTile } from "./card-tile";

type Sort = "numero" | "maior" | "menor" | "alta" | "baixa";

const SORTS: [Sort, string][] = [
  ["numero", "Número"],
  ["maior", "Maior preço"],
  ["menor", "Menor preço"],
  ["alta", "Maiores altas (7 dias)"],
  ["baixa", "Maiores baixas (7 dias)"],
];

/** Grade de cartas que busca o preço do dia de cada uma (em lotes) e mostra embaixo. */
export function PricedCardGrid({ cards, subtitles, showTotal = false }: { cards: CardBrief[]; subtitles?: Record<string, string>; showTotal?: boolean }) {
  const [prices, setPrices] = useState<Record<string, PriceSnapshot>>({});
  const [done, setDone] = useState(false);
  const [sort, setSort] = useState<Sort>("numero");

  useEffect(() => {
    let active = true;
    (async () => {
      const ids = cards.map((c) => c.id);
      for (let i = 0; i < ids.length && active; i += 60) {
        try {
          const response = await fetch(`/api/tcg/prices?ids=${encodeURIComponent(ids.slice(i, i + 60).join(","))}`);
          const chunk = (await response.json()) as Record<string, PriceSnapshot>;
          if (active) setPrices((prev) => ({ ...prev, ...chunk }));
        } catch {
          // segue com os próximos lotes
        }
      }
      if (active) setDone(true);
    })();
    return () => {
      active = false;
    };
  }, [cards]);

  const sorted = useMemo(() => {
    if (sort === "numero") return cards;
    const value = (c: CardBrief) => {
      const p = prices[c.id];
      if (sort === "maior" || sort === "menor") return p?.brl ?? null;
      return p?.change7d ?? null;
    };
    const dir = sort === "menor" ? 1 : sort === "baixa" ? 1 : -1;
    return [...cards].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return (va - vb) * dir;
    });
  }, [cards, prices, sort]);

  const total = Object.values(prices).reduce((sum, p) => sum + (p.brl ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          Ordenar por
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-full border border-line bg-surface px-3 py-1.5">
            {SORTS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {showTotal && (
          <p className="text-sm text-ink-soft">
            {done ? "Valor de 1 cópia de cada carta: " : "Somando valores… "}
            <strong className="text-ink tabular-nums">{formatMoney(total, "BRL")}</strong>
          </p>
        )}
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {sorted.map((card) => (
          <li key={card.id}>
            <CardTile card={card} subtitle={subtitles?.[card.id]} price={prices[card.id] ?? (done ? { usd: null, eur: null, brl: null, change7d: null, change30d: null } : null)} />
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-soft">
        Preço do dia: TCGplayer (EUA) convertido pela cotação de hoje; sem TCGplayer, Cardmarket (Europa). ▲▼ = variação em 7 dias no Cardmarket.
      </p>
    </div>
  );
}
