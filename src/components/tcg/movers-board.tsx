"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { MarketRow, Period } from "@/lib/tcg/market";
import { cardImage, formatDelta, formatMoney, formatPct, priceDelta } from "@/lib/tcg/prices";
import { typeColors } from "@/lib/pokemon";
import { ENERGY_PT } from "@/lib/tcg/labels";
import { CardTile } from "./card-tile";
import { ActiveFilters, FilterLayout, FilterPanel, useCardFilters } from "./card-filters";

type Dir = "alta" | "queda";
export type LiveMarket = { market: { rows: MarketRow[]; updatedAt: string }; loading: boolean; now: number; refresh: () => void };

const PERIODS: [Period, string][] = [
  ["dia", "Dia"],
  ["semana", "Semana"],
  ["mes", "Mês"],
];
const ENERGY_COLOR = Object.fromEntries(Object.entries(ENERGY_PT).map(([en, pt]) => [pt, typeColors[en]]));

function Pct({ value, big = false }: { value: number | null; big?: boolean }) {
  if (value == null) return <span className="text-ink-soft">—</span>;
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-black tabular-nums ${big ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-xs"} ${
        up ? "bg-good/15 text-good" : "bg-[#ff5c8a]/15 text-[#ff5c8a]"
      }`}
    >
      {up ? "▲" : "▼"} {formatPct(value).replace(/^[+−]/, "")}
    </span>
  );
}

export function ago(iso: string, now: number) {
  const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  return min < 1 ? "agora" : min === 1 ? "há 1 min" : min < 60 ? `há ${min} min` : `há ${Math.round(min / 60)} h`;
}

/** Cards em alta e em queda, com período, filtros, lista/grade e atualização automática. */
export function MoversBoard({ live, initialDir = "alta" }: { live: LiveMarket; initialDir?: Dir }) {
  const { market, loading, now, refresh } = live;
  const [dir, setDir] = useState<Dir>(initialDir);
  const [period, setPeriod] = useState<Period>("semana");
  const [view, setView] = useState<"lista" | "grade">("lista");
  const filters = useCardFilters();

  // #altas / #baixas no endereço escolhem a aba (links do menu).
  useEffect(() => {
    const sync = () => {
      if (location.hash === "#baixas") setDir("queda");
      else if (location.hash === "#altas") setDir("alta");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const pool = useMemo(
    () => market.rows.filter((r) => (dir === "alta" ? (r.change[period] ?? 0) > 0 : (r.change[period] ?? 0) < 0)),
    [market.rows, dir, period],
  );
  const metas = useMemo(() => pool.map((r) => r.meta), [pool]);
  const allSets = useMemo(() => [...new Set(market.rows.map((r) => r.setName))], [market.rows]);
  const list = useMemo(
    () =>
      pool
        .filter((r) => filters.matches({ name: r.name, localId: r.localId, meta: r.meta, brl: r.brl }))
        .sort((a, b) => (dir === "alta" ? b.change[period]! - a.change[period]! : a.change[period]! - b.change[period]!))
        .slice(0, 50),
    [pool, filters, dir, period],
  );

  const sum = (key: "brlLow" | "brl" | "brlHigh") => list.reduce((s, r) => s + (r[key] ?? 0), 0);
  const f = filters.f;
  const activeCount = f.set.length + f.rarity.length + f.energy.length + f.variant.length + f.illustrator.length + f.ranges.length + (f.q ? 1 : 0) + (filters.min != null ? 1 : 0) + (filters.max != null ? 1 : 0);
  const other: Dir = dir === "alta" ? "queda" : "alta";
  const label = (d: Dir) => (d === "alta" ? "Cards em Alta" : "Cards em Queda");
  const inPeriod = { dia: "no dia", semana: "na semana", mes: "no mês" }[period];

  return (
    <section id="cards" aria-labelledby="movers-title" className="relative scroll-mt-40 space-y-5">
      <span id="altas" className="absolute -top-40" aria-hidden="true" />
      <span id="baixas" className="absolute -top-40" aria-hidden="true" />
      {/* Cabeçalho */}
      <div className={`overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br ${dir === "alta" ? "from-good/20" : "from-[#ff5c8a]/20"} via-surface to-surface p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h2 id="movers-title" className="font-display text-3xl font-extrabold sm:text-4xl">
                {dir === "alta" ? "📈" : "📉"} {label(dir)}
              </h2>
              <button type="button" onClick={() => setDir(other)} className="text-sm font-bold text-ink-soft underline-offset-4 hover:text-ink hover:underline">
                ({label(other)})
              </button>
            </div>
            <p className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-good/15 px-2.5 py-0.5 text-xs font-black text-good">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-good opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-good" />
                </span>
                AO VIVO
              </span>
              Atualizado {ago(market.updatedAt, now)} · atualiza sozinho a cada 5 min
              <button type="button" onClick={refresh} disabled={loading} className="font-bold text-accent disabled:opacity-50">
                {loading ? "Atualizando…" : "↻ Atualizar agora"}
              </button>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">Período:</span>
            <span className="flex rounded-full bg-surface-2 p-1" role="group" aria-label="Período">
              {PERIODS.map(([p, l]) => (
                <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)} className="rounded-full px-4 py-1.5 text-sm font-bold transition aria-pressed:bg-accent aria-pressed:text-white">
                  {l}
                </button>
              ))}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              {list.length} cards ·{" "}
              <span className={dir === "alta" ? "text-good" : "text-[#ff5c8a]"} title={`Quanto esses cards ${dir === "alta" ? "subiram" : "caíram"} somados, em reais`}>
                {formatDelta(list.reduce((s, r) => s + (priceDelta(r.brl, r.change[period]) ?? 0), 0))} {inPeriod}
              </span>
            </p>
            <p className="flex flex-wrap items-baseline gap-x-2 font-display text-lg font-extrabold tabular-nums">
              <span className="text-good" title="Soma dos menores preços">{formatMoney(sum("brlLow"), "BRL")}</span>
              <span className="text-ink-soft">·</span>
              <span className="text-[#ff9f43]" title="Soma dos preços do site">{formatMoney(sum("brl"), "BRL")}</span>
              <span className="text-ink-soft">·</span>
              <span className="text-[#ff5c8a]" title="Soma dos maiores preços">{formatMoney(sum("brlHigh"), "BRL")}</span>
            </p>
            <p className="text-[11px] text-ink-soft">menor · preço do site (Brasil quando houver) · maior</p>
          </div>
          <span className="flex rounded-full bg-surface-2 p-1" role="group" aria-label="Modo de exibição">
            {(
              [
                ["lista", "M4 6h16M4 12h16M4 18h16", "Lista"],
                ["grade", "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z", "Grade"],
              ] as const
            ).map(([v, d, l]) => (
              <button key={v} type="button" aria-pressed={view === v} aria-label={l} title={l} onClick={() => setView(v)} className="grid size-9 place-items-center rounded-full transition aria-pressed:bg-accent aria-pressed:text-white">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
                  <path d={d} />
                </svg>
              </button>
            ))}
          </span>
        </div>
      </div>

      <FilterLayout activeCount={activeCount} panel={<FilterPanel api={filters} metas={metas} allSets={allSets} />}>
        <div className="space-y-3">
          <ActiveFilters api={filters} />
          {list.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-line p-10 text-center text-ink-soft">
              Nenhuma carta {dir === "alta" ? "subiu" : "caiu"} no período com esses filtros.
            </p>
          ) : view === "lista" ? (
            <ol className="divide-y divide-line overflow-hidden rounded-[2rem] border border-line bg-surface">
              {list.map((r, i) => (
                <li key={r.id}>
                  <Link href={`/tcg/cartas/${r.id}`} className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-surface-2 sm:px-4">
                    <span className="w-7 text-center font-display text-lg font-extrabold text-ink-soft">{i + 1}</span>
                    {cardImage(r.image, "low") ? (
                      <img src={cardImage(r.image, "low")!} alt="" loading="lazy" className="h-16 w-11 shrink-0 rounded-md object-cover shadow-md" />
                    ) : (
                      <span className="h-16 w-11 shrink-0 rounded-md bg-surface-2" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{r.name}</span>
                      <span className="block truncate text-xs text-ink-soft">
                        {r.setName} · #{r.localId}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1">
                        {r.meta.rarity && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold">{r.meta.rarity}</span>}
                        {r.meta.types.map((t) => (
                          <span key={t} title={t} className="size-3 rounded-full ring-2 ring-surface" style={{ background: ENERGY_COLOR[t] ?? "#999" }} />
                        ))}
                      </span>
                    </span>
                    <span className="hidden text-right text-xs text-ink-soft tabular-nums sm:block">
                      <span className="block">{formatMoney(r.usd, "USD")}</span>
                      <span className="block">{formatMoney(r.eur, "EUR")}</span>
                    </span>
                    <span className="w-24 text-right tabular-nums">
                      <span className="block font-bold">{formatMoney(r.brl, "BRL")}</span>
                    </span>
                    <span className="flex w-24 flex-col items-end gap-0.5 text-right">
                      <Pct value={r.change[period]} />
                      <span className={`text-xs font-bold tabular-nums ${(r.change[period] ?? 0) >= 0 ? "text-good" : "text-[#ff5c8a]"}`} title={`Variação em reais ${inPeriod}`}>
                        {formatDelta(priceDelta(r.brl, r.change[period]))}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {list.map((r) => (
                <li key={r.id}>
                  <CardTile
                    card={{ id: r.id, name: r.name, localId: r.localId, image: r.image }}
                    subtitle={r.setName}
                    price={{ ...r, change7d: r.change[period] }}
                    changeTitle={`Variação ${inPeriod}`}
                    showDelta
                  />
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-ink-soft">
            Dia: histórico diário do Maratomon (ou tendência do Cardmarket); semana e mês: médias do Cardmarket. Valores em reais pela cotação do dia.
          </p>
        </div>
      </FilterLayout>
    </section>
  );
}
