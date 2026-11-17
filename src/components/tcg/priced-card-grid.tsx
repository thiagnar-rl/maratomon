"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/tcg/prices";
import type { CardBrief, PricedCard } from "@/lib/tcg/types";
import { CardTile } from "./card-tile";
import { ActiveFilters, FilterLayout, FilterPanel, useCardFilters } from "./card-filters";

type Sort = "numero" | "maior" | "menor" | "alta" | "baixa";

const SORTS: [Sort, string][] = [
  ["numero", "Número"],
  ["maior", "Maior preço"],
  ["menor", "Menor preço"],
  ["alta", "Maiores altas (7 dias)"],
  ["baixa", "Maiores baixas (7 dias)"],
];

const EMPTY: PricedCard = { usd: null, eur: null, brl: null, change7d: null, change30d: null };

/** Grade de cartas com preço do dia, filtros na lateral e ordenação. */
export function PricedCardGrid({ cards, subtitles, showTotal = false }: { cards: CardBrief[]; subtitles?: Record<string, string>; showTotal?: boolean }) {
  const [data, setData] = useState<Record<string, PricedCard>>({});
  const [done, setDone] = useState(false);
  const [sort, setSort] = useState<Sort>("numero");
  const filters = useCardFilters();

  useEffect(() => {
    let active = true;
    (async () => {
      const ids = cards.map((c) => c.id);
      for (let i = 0; i < ids.length && active; i += 60) {
        try {
          const response = await fetch(`/api/tcg/prices?ids=${encodeURIComponent(ids.slice(i, i + 60).join(","))}`);
          const chunk = (await response.json()) as Record<string, PricedCard>;
          if (active) setData((prev) => ({ ...prev, ...chunk }));
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

  const metas = useMemo(() => cards.map((c) => data[c.id]?.meta), [cards, data]);
  const filtered = useMemo(
    () => cards.filter((c) => filters.matches({ name: c.name, localId: c.localId, meta: data[c.id]?.meta, brl: data[c.id]?.brl })),
    [cards, data, filters],
  );

  const sorted = useMemo(() => {
    if (sort === "numero") return filtered;
    const value = (c: CardBrief) => {
      const p = data[c.id];
      return sort === "maior" || sort === "menor" ? (p?.brl ?? null) : (p?.change7d ?? null);
    };
    const dir = sort === "menor" || sort === "baixa" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return (va - vb) * dir;
    });
  }, [filtered, data, sort]);

  const total = filtered.reduce((sum, c) => sum + (data[c.id]?.brl ?? 0), 0);
  const f = filters.f;
  const activeCount = f.set.length + f.rarity.length + f.energy.length + f.variant.length + f.illustrator.length + f.ranges.length + (filters.min != null ? 1 : 0) + (filters.max != null ? 1 : 0) + (f.q ? 1 : 0);

  return (
    <FilterLayout activeCount={activeCount} panel={<FilterPanel api={filters} metas={metas} loading={!done} />}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-line bg-surface px-4 py-3">
          <p className="text-sm text-ink-soft">
            <strong className="text-ink">{filtered.length}</strong> de {cards.length} cartas
            {showTotal && (
              <>
                {" · "}
                {done ? (filters.active ? "valor filtrado " : "valor de 1 de cada ") : "somando… "}
                <strong className="text-ink tabular-nums">{formatMoney(total, "BRL")}</strong>
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-surface-2 p-1 text-xs font-bold" role="group" aria-label="Ordem de preço">
              {(
                [
                  ["maior", "Maior → menor"],
                  ["menor", "Menor → maior"],
                ] as const
              ).map(([value, label]) => (
                <button key={value} type="button" aria-pressed={sort === value} onClick={() => setSort(sort === value ? "numero" : value)} className="rounded-full px-3 py-1.5 aria-pressed:bg-accent aria-pressed:text-white">
                  {label}
                </button>
              ))}
            </span>
            <select
              aria-label="Ordenar"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-full border border-line bg-surface px-3 py-2 text-sm font-semibold outline-none focus:border-accent"
            >
              {SORTS.map(([value, label]) => (
                <option key={value} value={value}>
                  Ordenar: {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <ActiveFilters api={filters} />

        {sorted.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line p-10 text-center text-ink-soft">Nenhuma carta com esses filtros.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            {sorted.map((card) => (
              <li key={card.id}>
                <CardTile card={card} subtitle={subtitles?.[card.id]} price={data[card.id] ?? (done ? EMPTY : null)} />
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-ink-soft">
          Preço do dia: média dos marketplaces (TCGplayer e Cardmarket) em reais pela cotação de hoje. ▲▼ = variação em 7 dias.
        </p>
      </div>
    </FilterLayout>
  );
}
