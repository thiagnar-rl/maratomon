"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/tcg/prices";
import type { CardBrief, PricedCard } from "@/lib/tcg/types";
import { CardTile } from "./card-tile";

type Sort = "numero" | "maior" | "menor" | "alta" | "baixa";

const SORTS: [Sort, string][] = [
  ["numero", "Número"],
  ["maior", "Maior preço"],
  ["menor", "Menor preço"],
  ["alta", "Maiores altas (7 dias)"],
  ["baixa", "Maiores baixas (7 dias)"],
];

const EMPTY: PricedCard = { usd: null, eur: null, brl: null, change7d: null, change30d: null };

/** Conta quantas cartas têm cada valor (para mostrar nos filtros). */
function tally(values: (string | null | undefined)[]) {
  const map = new Map<string, number>();
  for (const v of values) if (v) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
}

const select = "rounded-full border border-line bg-surface px-3 py-2 text-sm font-semibold outline-none focus:border-accent";

/** Grade de cartas com preço do dia, filtros (raridade, versão, ilustrador) e ordenação. */
export function PricedCardGrid({ cards, subtitles, showTotal = false }: { cards: CardBrief[]; subtitles?: Record<string, string>; showTotal?: boolean }) {
  const [data, setData] = useState<Record<string, PricedCard>>({});
  const [done, setDone] = useState(false);
  const [sort, setSort] = useState<Sort>("numero");
  const [rarity, setRarity] = useState("");
  const [variant, setVariant] = useState("");
  const [illustrator, setIllustrator] = useState("");
  const [query, setQuery] = useState("");

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
  const rarities = useMemo(() => tally(metas.map((m) => m?.rarity)), [metas]);
  const variants = useMemo(() => tally(metas.flatMap((m) => m?.variants ?? [])), [metas]);
  const illustrators = useMemo(() => tally(metas.map((m) => m?.illustrator)), [metas]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      const m = data[c.id]?.meta;
      if (q && !c.name.toLowerCase().includes(q) && !c.localId.toLowerCase().includes(q)) return false;
      if (rarity && m?.rarity !== rarity) return false;
      if (variant && !m?.variants.includes(variant)) return false;
      if (illustrator && m?.illustrator !== illustrator) return false;
      return true;
    });
  }, [cards, data, query, rarity, variant, illustrator]);

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
  const active = Boolean(rarity || variant || illustrator || query);
  const loadingMeta = !done && rarities.length === 0;

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-[2rem] border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar por nome ou número"
            aria-label="Filtrar por nome ou número"
            className="min-w-0 flex-1 rounded-full border border-line bg-bg px-4 py-2 text-sm outline-none focus:border-accent sm:max-w-xs"
          />
          <select aria-label="Raridade" value={rarity} onChange={(e) => setRarity(e.target.value)} className={select} disabled={loadingMeta}>
            <option value="">{loadingMeta ? "Carregando raridades…" : "Todas as raridades"}</option>
            {rarities.map(([r, n]) => (
              <option key={r} value={r}>
                {r} ({n})
              </option>
            ))}
          </select>
          <select aria-label="Versão" value={variant} onChange={(e) => setVariant(e.target.value)} className={select} disabled={loadingMeta}>
            <option value="">Todas as versões</option>
            {variants.map(([v, n]) => (
              <option key={v} value={v}>
                {v} ({n})
              </option>
            ))}
          </select>
          <select aria-label="Ilustrador" value={illustrator} onChange={(e) => setIllustrator(e.target.value)} className={`${select} max-w-[14rem]`} disabled={loadingMeta}>
            <option value="">Todos os ilustradores</option>
            {illustrators.map(([v, n]) => (
              <option key={v} value={v}>
                {v} ({n})
              </option>
            ))}
          </select>
          <select aria-label="Ordenar" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={select}>
            {SORTS.map(([value, label]) => (
              <option key={value} value={value}>
                Ordenar: {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-ink-soft">
            <strong className="text-ink">{filtered.length}</strong> de {cards.length} cartas
            {active && (
              <button
                type="button"
                onClick={() => {
                  setRarity("");
                  setVariant("");
                  setIllustrator("");
                  setQuery("");
                }}
                className="ml-3 font-bold text-accent"
              >
                Limpar filtros
              </button>
            )}
          </p>
          {showTotal && (
            <p className="text-ink-soft">
              {done ? (active ? "Valor das cartas filtradas: " : "Valor de 1 cópia de cada carta: ") : "Somando valores… "}
              <strong className="text-ink tabular-nums">{formatMoney(total, "BRL")}</strong>
            </p>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line p-10 text-center text-ink-soft">Nenhuma carta com esses filtros.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {sorted.map((card) => (
            <li key={card.id}>
              <CardTile card={card} subtitle={subtitles?.[card.id]} price={data[card.id] ?? (done ? EMPTY : null)} />
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-ink-soft">
        Preço do dia: TCGplayer (EUA) convertido pela cotação de hoje; sem TCGplayer, Cardmarket (Europa). ▲▼ = variação em 7 dias. Segure e arraste uma carta para girá-la.
      </p>
    </div>
  );
}
