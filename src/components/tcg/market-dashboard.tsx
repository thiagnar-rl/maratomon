"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/tcg/prices";

export type MarketRow = {
  id: string;
  name: string;
  set: string;
  image: string | null;
  usd: number | null; // TCGplayer, preço de mercado em dólar
  eur: number | null; // Cardmarket, tendência em euro
  eur30: number | null; // Cardmarket, média de 30 dias em euro
  brl?: number | null; // Brasil (MYP Cards), menor oferta em reais
};

type Market = "brasil" | "tcgplayer" | "cardmarket";
type SortKey = "value" | "change" | "name";

/**
 * Cada marketplace na própria moeda, sem conversão: o real do Brasil já inclui frete e impostos de importação,
 * e converter dólar ou euro pela cotação deixaria esses custos de fora e distorceria a comparação.
 */
const MARKETS: { key: Market; label: string; sub: string; currency: "BRL" | "USD" | "EUR"; color: string; value: (r: MarketRow) => number | null }[] = [
  { key: "brasil", label: "Brasil", sub: "MYP Cards · menor oferta", currency: "BRL", color: "var(--good)", value: (r) => r.brl ?? null },
  { key: "tcgplayer", label: "EUA", sub: "TCGplayer · preço de mercado", currency: "USD", color: "var(--accent)", value: (r) => r.usd },
  { key: "cardmarket", label: "Europa", sub: "Cardmarket · tendência", currency: "EUR", color: "var(--accent-3)", value: (r) => r.eur },
];

const SYMBOL = { BRL: "R$", USD: "US$", EUR: "€" } as const;

/** Painel interativo: escolhe o marketplace (cada um na sua moeda), ordena e compara as cartas icônicas. */
export function MarketDashboard({ rows }: { rows: MarketRow[] }) {
  const [market, setMarket] = useState<Market>("brasil");
  const [sort, setSort] = useState<SortKey>("value");
  const m = MARKETS.find((x) => x.key === market)!;

  const data = useMemo(() => {
    const mapped = rows.map((r) => ({
      ...r,
      value: m.value(r),
      change: r.eur && r.eur30 ? ((r.eur - r.eur30) / r.eur30) * 100 : null,
      short: r.name.length > 14 ? r.name.slice(0, 13) + "…" : r.name,
    }));
    return mapped.sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : sort === "change" ? (b.change ?? -999) - (a.change ?? -999) : (b.value ?? -1) - (a.value ?? -1),
    );
  }, [rows, m, sort]);

  const chart = data.filter((d) => d.value != null);
  const fmt = (v: number | null | undefined) => formatMoney(v ?? null, m.currency);

  return (
    <div className="space-y-5 rounded-[2rem] border border-line bg-surface p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Painel do mercado</h2>
          <p className="text-sm text-ink-soft">Cartas icônicas em cada marketplace, na moeda de cada um (sem conversão).</p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Marketplace">
          {MARKETS.map((x) => (
            <button
              key={x.key}
              type="button"
              aria-pressed={market === x.key}
              onClick={() => setMarket(x.key)}
              className="rounded-full border border-line px-3 py-1.5 text-sm font-bold aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-ink"
            >
              {x.label} <span className="opacity-75">{SYMBOL[x.currency]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        {chart.length === 0 ? (
          <p className="grid h-full place-items-center rounded-2xl bg-surface-2 text-sm text-ink-soft">Sem preços neste marketplace agora.</p>
        ) : (
          <ResponsiveContainer>
            <BarChart data={chart} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="short" tick={{ fill: "var(--ink-soft)", fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fill: "var(--ink-soft)", fontSize: 11 }} tickFormatter={(v: number) => fmt(v)} width={80} />
              <Tooltip
                formatter={(value) => [fmt(Number(value)), `${m.label} (${m.sub})`]}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--ink)" }}
                cursor={{ fill: "var(--surface-2)" }}
              />
              <Bar dataKey="value" fill={m.color} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
        <span className="size-3 rounded-sm" style={{ background: m.color }} /> {m.label} · {m.sub}, em {SYMBOL[m.currency]}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="py-2 pr-2">
                <button type="button" onClick={() => setSort("name")} className="font-bold uppercase">Carta {sort === "name" && "↓"}</button>
              </th>
              {MARKETS.map((x) => (
                <th key={x.key} className="py-2 pr-2 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setMarket(x.key);
                      setSort("value");
                    }}
                    className="font-bold uppercase"
                  >
                    {x.label} ({SYMBOL[x.currency]}) {sort === "value" && market === x.key && "↓"}
                  </button>
                </th>
              ))}
              <th className="py-2 text-right">
                <button type="button" onClick={() => setSort("change")} className="font-bold uppercase">Europa 30 dias {sort === "change" && "↓"}</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-b border-line/60 last:border-0">
                <td className="py-2 pr-2">
                  <Link href={`/tcg/cartas/${row.id}`} className="flex items-center gap-3 font-semibold hover:text-accent">
                    {row.image && <img src={row.image} alt="" width={32} height={44} loading="lazy" className="h-11 w-8 rounded object-cover" />}
                    <span>
                      {row.name}
                      <span className="block text-xs font-normal text-ink-soft">{row.set}</span>
                    </span>
                  </Link>
                </td>
                {MARKETS.map((x) => (
                  <td key={x.key} className={`py-2 pr-2 text-right tabular-nums ${market === x.key ? "font-bold text-ink" : "text-ink-soft"}`}>
                    {formatMoney(x.value(row), x.currency)}
                  </td>
                ))}
                <td className={`py-2 text-right font-semibold tabular-nums ${row.change == null ? "text-ink-soft" : row.change >= 0 ? "text-good" : "text-[#ff5c8a]"}`}>
                  {row.change == null ? "—" : `${row.change >= 0 ? "▲" : "▼"} ${Math.abs(row.change).toFixed(1).replace(".", ",")}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-soft">
        Os preços dos EUA e da Europa ficam em dólar e euro: convertê-los pela cotação deixaria de fora frete e impostos de importação. Para comparar com o
        Brasil, use o preço em reais da linha Brasil.
      </p>
    </div>
  );
}
