"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney, parseBRL } from "@/lib/tcg/prices";
import type { CardBrief, PricedCard } from "@/lib/tcg/types";
import { CardTile } from "./card-tile";
import { MultiSelect } from "./multi-select";

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

/** Faixas rápidas de preço em reais. */
const RANGES: { label: string; min: number | null; max: number | null }[] = [
  { label: "Até R$ 10", min: null, max: 10 },
  { label: "R$ 10–50", min: 10, max: 50 },
  { label: "R$ 50–200", min: 50, max: 200 },
  { label: "R$ 200–1.000", min: 200, max: 1000 },
  { label: "Acima de R$ 1.000", min: 1000, max: null },
];

const select = "rounded-full border border-line bg-surface px-3 py-2 text-sm font-semibold outline-none focus:border-accent";

/** Grade de cartas com preço do dia, filtros (raridade, versão, ilustrador) e ordenação. */
export function PricedCardGrid({ cards, subtitles, showTotal = false }: { cards: CardBrief[]; subtitles?: Record<string, string>; showTotal?: boolean }) {
  const [data, setData] = useState<Record<string, PricedCard>>({});
  const [done, setDone] = useState(false);
  const [sort, setSort] = useState<Sort>("numero");
  const [rarity, setRarity] = useState<string[]>([]);
  const [variant, setVariant] = useState<string[]>([]);
  const [illustrator, setIllustrator] = useState<string[]>([]);
  const [ranges, setRanges] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [minText, setMinText] = useState("");
  const [maxText, setMaxText] = useState("");
  const minPrice = parseBRL(minText);
  const maxPrice = parseBRL(maxText);

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
      // Dentro de cada filtro vale qualquer opção marcada (OU); entre filtros, todos precisam bater (E).
      if (rarity.length && !rarity.includes(m?.rarity ?? "")) return false;
      if (variant.length && !variant.some((v) => m?.variants.includes(v))) return false;
      if (illustrator.length && !illustrator.includes(m?.illustrator ?? "")) return false;
      if (minPrice != null || maxPrice != null || ranges.length) {
        const brl = data[c.id]?.brl;
        if (brl == null) return false;
        if (minPrice != null && brl < minPrice) return false;
        if (maxPrice != null && brl > maxPrice) return false;
        if (ranges.length && !RANGES.some((r) => ranges.includes(r.label) && (r.min == null || brl >= r.min) && (r.max == null || brl < r.max))) return false;
      }
      return true;
    });
  }, [cards, data, query, rarity, variant, illustrator, minPrice, maxPrice, ranges]);

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
  const active = Boolean(rarity.length || variant.length || illustrator.length || ranges.length || query || minPrice != null || maxPrice != null);
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
          <MultiSelect label="Raridade" options={rarities} selected={rarity} onChange={setRarity} disabled={loadingMeta} />
          <MultiSelect label="Versão" options={variants} selected={variant} onChange={setVariant} disabled={loadingMeta} />
          <MultiSelect label="Ilustrador" options={illustrators} selected={illustrator} onChange={setIllustrator} searchable disabled={loadingMeta} />
          <select aria-label="Ordenar" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={select}>
            {SORTS.map(([value, label]) => (
              <option key={value} value={value}>
                Ordenar: {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="text-sm font-bold">Preço (R$)</span>
          <input
            inputMode="decimal"
            value={minText}
            onChange={(e) => setMinText(e.target.value)}
            placeholder="mín."
            aria-label="Preço mínimo em reais"
            className="w-24 rounded-full border border-line bg-bg px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
          <span className="text-ink-soft">–</span>
          <input
            inputMode="decimal"
            value={maxText}
            onChange={(e) => setMaxText(e.target.value)}
            placeholder="máx."
            aria-label="Preço máximo em reais"
            className="w-24 rounded-full border border-line bg-bg px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
          {RANGES.map((r) => {
            const on = ranges.includes(r.label);
            return (
              <button
                key={r.label}
                type="button"
                aria-pressed={on}
                onClick={() => setRanges(on ? ranges.filter((x) => x !== r.label) : [...ranges, r.label])}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-bold transition hover:border-ink-soft aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-white"
              >
                {r.label}
              </button>
            );
          })}
          <span className="ml-auto flex items-center gap-1 rounded-full bg-surface-2 p-1 text-xs font-bold" role="group" aria-label="Ordem de preço">
            {(
              [
                ["maior", "Maior → menor"],
                ["menor", "Menor → maior"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={sort === value}
                onClick={() => setSort(sort === value ? "numero" : value)}
                className="rounded-full px-3 py-1.5 aria-pressed:bg-accent aria-pressed:text-white"
              >
                {label}
              </button>
            ))}
          </span>
          {!done && (minPrice != null || maxPrice != null) && <span className="text-xs text-ink-soft">carregando preços…</span>}
        </div>
        {active && (
          <div className="flex flex-wrap gap-1.5" aria-label="Filtros ativos">
            {[
              ...rarity.map((v) => ({ key: `r-${v}`, text: v, remove: () => setRarity(rarity.filter((x) => x !== v)) })),
              ...variant.map((v) => ({ key: `v-${v}`, text: v, remove: () => setVariant(variant.filter((x) => x !== v)) })),
              ...illustrator.map((v) => ({ key: `i-${v}`, text: `🎨 ${v}`, remove: () => setIllustrator(illustrator.filter((x) => x !== v)) })),
              ...ranges.map((v) => ({ key: `p-${v}`, text: v, remove: () => setRanges(ranges.filter((x) => x !== v)) })),
              ...(minPrice != null ? [{ key: "min", text: `Mín. ${formatMoney(minPrice, "BRL")}`, remove: () => setMinText("") }] : []),
              ...(maxPrice != null ? [{ key: "max", text: `Máx. ${formatMoney(maxPrice, "BRL")}`, remove: () => setMaxText("") }] : []),
              ...(query ? [{ key: "q", text: `“${query}”`, remove: () => setQuery("") }] : []),
            ].map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.remove}
                className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-ink hover:bg-accent/25"
                aria-label={`Remover filtro ${chip.text}`}
              >
                {chip.text} <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-ink-soft">
            <strong className="text-ink">{filtered.length}</strong> de {cards.length} cartas
            {active && (
              <button
                type="button"
                onClick={() => {
                  setRarity([]);
                  setVariant([]);
                  setIllustrator([]);
                  setRanges([]);
                  setQuery("");
                  setMinText("");
                  setMaxText("");
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
        Preço do dia: TCGplayer (EUA) convertido pela cotação de hoje; sem TCGplayer, Cardmarket (Europa). ▲▼ = variação em 7 dias.
      </p>
    </div>
  );
}
