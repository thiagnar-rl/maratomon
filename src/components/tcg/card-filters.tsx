"use client";

import { useMemo, useState } from "react";
import { formatMoney, parseBRL } from "@/lib/tcg/prices";
import type { CardMeta } from "@/lib/tcg/types";
import { typeColors } from "@/lib/pokemon";
import { ENERGY_PT } from "@/lib/tcg/labels";

/** Faixas rápidas de preço em reais. */
export const PRICE_RANGES: { label: string; min: number | null; max: number | null }[] = [
  { label: "Até R$ 10", min: null, max: 10 },
  { label: "R$ 10–50", min: 10, max: 50 },
  { label: "R$ 50–200", min: 50, max: 200 },
  { label: "R$ 200–1.000", min: 200, max: 1000 },
  { label: "Acima de R$ 1.000", min: 1000, max: null },
];

export type Filters = {
  q: string;
  set: string[];
  rarity: string[];
  energy: string[];
  variant: string[];
  illustrator: string[];
  ranges: string[];
  min: string;
  max: string;
};

const EMPTY: Filters = { q: "", set: [], rarity: [], energy: [], variant: [], illustrator: [], ranges: [], min: "", max: "" };

type Item = { name: string; localId?: string; meta?: CardMeta; brl: number | null | undefined };

/** Estado dos filtros + função que diz se uma carta passa. Dentro de um grupo vale "ou"; entre grupos, "e". */
export function useCardFilters() {
  const [f, setF] = useState<Filters>(EMPTY);
  const min = parseBRL(f.min);
  const max = parseBRL(f.max);

  const matches = useMemo(
    () => (item: Item) => {
      const m = item.meta;
      const q = f.q.trim().toLowerCase();
      if (q && !item.name.toLowerCase().includes(q) && !(item.localId ?? "").toLowerCase().includes(q)) return false;
      if (f.set.length && !f.set.includes(m?.set ?? "")) return false;
      if (f.rarity.length && !f.rarity.includes(m?.rarity ?? "")) return false;
      if (f.energy.length && !f.energy.some((e) => m?.types.includes(e))) return false;
      if (f.variant.length && !f.variant.some((v) => m?.variants.includes(v))) return false;
      if (f.illustrator.length && !f.illustrator.includes(m?.illustrator ?? "")) return false;
      if (min != null || max != null || f.ranges.length) {
        const brl = item.brl;
        if (brl == null) return false;
        if (min != null && brl < min) return false;
        if (max != null && brl > max) return false;
        if (f.ranges.length && !PRICE_RANGES.some((r) => f.ranges.includes(r.label) && (r.min == null || brl >= r.min) && (r.max == null || brl < r.max))) return false;
      }
      return true;
    },
    [f, min, max],
  );

  const toggle = (key: "set" | "rarity" | "energy" | "variant" | "illustrator" | "ranges", value: string) =>
    setF((prev) => ({ ...prev, [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value] }));

  const active =
    f.q !== "" || f.set.length + f.rarity.length + f.energy.length + f.variant.length + f.illustrator.length + f.ranges.length > 0 || min != null || max != null;

  return { f, setF, toggle, matches, active, min, max, clear: () => setF(EMPTY) };
}

export type FilterApi = ReturnType<typeof useCardFilters>;

function tally(values: (string | null | undefined)[]) {
  const map = new Map<string, number>();
  for (const v of values) if (v) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
}

const ENERGY_COLOR = Object.fromEntries(Object.entries(ENERGY_PT).map(([en, pt]) => [pt, typeColors[en]]));

function Section({ title, children, count }: { title: string; children: React.ReactNode; count?: number }) {
  return (
    <section className="space-y-2.5">
      <h3 className="flex items-center gap-2 text-sm font-black">
        <svg viewBox="0 0 24 24" className="size-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
        </svg>
        {title}
        {count ? <span className="grid size-5 place-items-center rounded-full bg-accent text-[10px] text-white">{count}</span> : null}
        <span className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-accent/60 to-transparent" />
      </h3>
      {children}
    </section>
  );
}

/** Botão-pílula com nome e quantidade, como nas lojas de cartas. */
function Chip({ label, count, on, onClick, color }: { label: string; count: number; on: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      title={label}
      className={`group relative flex min-h-[3.1rem] flex-col items-center justify-center rounded-2xl border px-2 py-1.5 text-center transition ${
        on ? "border-accent bg-accent text-white shadow-[0_6px_18px_-6px_var(--accent)]" : "border-line bg-surface hover:border-ink-soft"
      }`}
    >
      {color && <span className="absolute left-2 top-2 size-2 rounded-full" style={{ background: color }} aria-hidden="true" />}
      <span className="line-clamp-1 text-xs font-bold leading-tight">{label}</span>
      <span className={`text-[11px] font-semibold tabular-nums ${on ? "text-white/80" : "text-ink-soft"}`}>{count}</span>
    </button>
  );
}

/** Painel lateral de filtros (Raridade, Energia, Versão, Ilustrador, Preço). */
export function FilterPanel({ api, metas, loading = false, allSets }: { api: FilterApi; metas: (CardMeta | undefined)[]; loading?: boolean; allSets?: string[] }) {
  const { f, setF, toggle } = api;
  const [illQuery, setIllQuery] = useState("");
  const [setQuery, setSetQuery] = useState("");
  // Todas as coleções acompanhadas aparecem; as sem carta na lista atual ficam com 0.
  const sets = useMemo(() => {
    const counts = new Map(tally(metas.map((m) => m?.set)));
    for (const name of allSets ?? []) if (!counts.has(name)) counts.set(name, 0);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"));
  }, [metas, allSets]);
  const setList = setQuery ? sets.filter(([n]) => n.toLowerCase().includes(setQuery.toLowerCase())) : sets;
  const rarities = useMemo(() => tally(metas.map((m) => m?.rarity)), [metas]);
  const energies = useMemo(() => tally(metas.flatMap((m) => m?.types ?? [])), [metas]);
  const variants = useMemo(() => tally(metas.flatMap((m) => m?.variants ?? [])), [metas]);
  const illustrators = useMemo(() => tally(metas.map((m) => m?.illustrator)), [metas]);
  const ills = illQuery ? illustrators.filter(([n]) => n.toLowerCase().includes(illQuery.toLowerCase())) : illustrators;

  if (loading && rarities.length === 0) {
    return (
      <div className="space-y-3" aria-label="Carregando filtros">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <input
        type="search"
        value={f.q}
        onChange={(e) => setF((p) => ({ ...p, q: e.target.value }))}
        placeholder="Nome ou número da carta"
        aria-label="Filtrar por nome ou número"
        className="w-full rounded-2xl border border-line bg-bg px-4 py-2.5 text-sm outline-none focus:border-accent"
      />

      {sets.length > 1 && (
        <Section title="Coleção" count={f.set.length}>
          {sets.length > 8 && (
            <input
              value={setQuery}
              onChange={(e) => setSetQuery(e.target.value)}
              placeholder="Buscar coleção"
              aria-label="Buscar coleção"
              className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
            />
          )}
          <ul className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
            {setList.map(([v, n]) => (
              <li key={v}>
                <label className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm hover:bg-surface-2 ${n === 0 ? "opacity-45" : ""}`}>
                  <input type="checkbox" checked={f.set.includes(v)} onChange={() => toggle("set", v)} className="size-4 accent-[var(--accent)]" />
                  <span className="min-w-0 flex-1 truncate">{v}</span>
                  <span className="text-xs text-ink-soft tabular-nums">{n}</span>
                </label>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {rarities.length > 0 && (
        <Section title="Raridade" count={f.rarity.length}>
          <div className="grid grid-cols-2 gap-2">
            {rarities.map(([r, n]) => (
              <Chip key={r} label={r} count={n} on={f.rarity.includes(r)} onClick={() => toggle("rarity", r)} />
            ))}
          </div>
        </Section>
      )}

      {energies.length > 0 && (
        <Section title="Energia" count={f.energy.length}>
          <div className="grid grid-cols-2 gap-2">
            {energies.map(([e, n]) => (
              <Chip key={e} label={e} count={n} color={ENERGY_COLOR[e]} on={f.energy.includes(e)} onClick={() => toggle("energy", e)} />
            ))}
          </div>
        </Section>
      )}

      <Section title="Preço (R$)" count={f.ranges.length + (api.min != null ? 1 : 0) + (api.max != null ? 1 : 0)}>
        <div className="flex items-center gap-2">
          <input
            inputMode="decimal"
            value={f.min}
            onChange={(e) => setF((p) => ({ ...p, min: e.target.value }))}
            placeholder="mín."
            aria-label="Preço mínimo em reais"
            className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <span className="text-ink-soft">–</span>
          <input
            inputMode="decimal"
            value={f.max}
            onChange={(e) => setF((p) => ({ ...p, max: e.target.value }))}
            placeholder="máx."
            aria-label="Preço máximo em reais"
            className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRICE_RANGES.map((r) => (
            <button
              key={r.label}
              type="button"
              aria-pressed={f.ranges.includes(r.label)}
              onClick={() => toggle("ranges", r.label)}
              className="rounded-full border border-line px-3 py-1.5 text-xs font-bold transition hover:border-ink-soft aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-white"
            >
              {r.label}
            </button>
          ))}
        </div>
      </Section>

      {variants.length > 0 && (
        <Section title="Versão" count={f.variant.length}>
          <div className="grid grid-cols-2 gap-2">
            {variants.map(([v, n]) => (
              <Chip key={v} label={v} count={n} on={f.variant.includes(v)} onClick={() => toggle("variant", v)} />
            ))}
          </div>
        </Section>
      )}

      {illustrators.length > 0 && (
        <Section title="Ilustrador" count={f.illustrator.length}>
          {illustrators.length > 8 && (
            <input
              value={illQuery}
              onChange={(e) => setIllQuery(e.target.value)}
              placeholder="Buscar ilustrador"
              aria-label="Buscar ilustrador"
              className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
            />
          )}
          <ul className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
            {ills.map(([v, n]) => (
              <li key={v}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm hover:bg-surface-2">
                  <input type="checkbox" checked={f.illustrator.includes(v)} onChange={() => toggle("illustrator", v)} className="size-4 accent-[var(--accent)]" />
                  <span className="min-w-0 flex-1 truncate">{v}</span>
                  <span className="text-xs text-ink-soft tabular-nums">{n}</span>
                </label>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

/** Etiquetas dos filtros ativos, cada uma com × para tirar. */
export function ActiveFilters({ api }: { api: FilterApi }) {
  const { f, setF, toggle, active, clear, min, max } = api;
  if (!active) return null;
  const chips = [
    ...f.set.map((v) => ({ k: `s${v}`, t: `📦 ${v}`, rm: () => toggle("set", v) })),
    ...f.rarity.map((v) => ({ k: `r${v}`, t: v, rm: () => toggle("rarity", v) })),
    ...f.energy.map((v) => ({ k: `e${v}`, t: `⚡ ${v}`, rm: () => toggle("energy", v) })),
    ...f.variant.map((v) => ({ k: `v${v}`, t: v, rm: () => toggle("variant", v) })),
    ...f.illustrator.map((v) => ({ k: `i${v}`, t: `🎨 ${v}`, rm: () => toggle("illustrator", v) })),
    ...f.ranges.map((v) => ({ k: `p${v}`, t: v, rm: () => toggle("ranges", v) })),
    ...(min != null ? [{ k: "min", t: `Mín. ${formatMoney(min, "BRL")}`, rm: () => setF((p) => ({ ...p, min: "" })) }] : []),
    ...(max != null ? [{ k: "max", t: `Máx. ${formatMoney(max, "BRL")}`, rm: () => setF((p) => ({ ...p, max: "" })) }] : []),
    ...(f.q ? [{ k: "q", t: `“${f.q}”`, rm: () => setF((p) => ({ ...p, q: "" })) }] : []),
  ];
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Filtros ativos">
      {chips.map((c) => (
        <button key={c.k} type="button" onClick={c.rm} aria-label={`Remover filtro ${c.t}`} className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold hover:bg-accent/25">
          {c.t} <span aria-hidden="true">×</span>
        </button>
      ))}
      <button type="button" onClick={clear} className="px-2 text-xs font-bold text-accent">
        Limpar tudo
      </button>
    </div>
  );
}

/** Layout com filtros na lateral (computador) ou em gaveta (celular). */
export function FilterLayout({ panel, children, activeCount }: { panel: React.ReactNode; children: React.ReactNode; activeCount: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-bold lg:hidden"
      >
        Filtros {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] text-white">{activeCount}</span>}
      </button>
      <aside className="hidden lg:block">
        <div className="sticky top-40 max-h-[calc(100vh-11rem)] overflow-y-auto rounded-[2rem] border border-line bg-surface/80 p-4 backdrop-blur">{panel}</div>
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
          <button type="button" aria-label="Fechar filtros" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[86vw] max-w-sm overflow-y-auto rounded-r-[2rem] bg-surface p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-xl font-extrabold">Filtros</p>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-white">
                Ver cartas
              </button>
            </div>
            {panel}
          </div>
        </div>
      )}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
