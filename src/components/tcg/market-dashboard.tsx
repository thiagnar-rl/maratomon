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
  usd: number | null; // TCGplayer mercado
  eur: number | null; // Cardmarket tendência
  eur30: number | null; // Cardmarket média 30 dias
};

type Currency = "BRL" | "USD" | "EUR";
type SortKey = "value" | "change" | "name";

/** Converte um preço em dólar ou euro para a moeda escolhida, passando pelo real. */
function convert(value: number | null, from: "USD" | "EUR", to: Currency, rates: { USD: number; EUR: number }) {
  if (value == null) return null;
  if (to === from) return value;
  const brl = value * rates[from];
  return to === "BRL" ? brl : brl / rates[to];
}

/** Painel interativo: escolhe moeda, ordena e compara TCGplayer x Cardmarket. */
export function MarketDashboard({ rows, rates }: { rows: MarketRow[]; rates: { USD: number; EUR: number } }) {
  const [currency, setCurrency] = useState<Currency>("BRL");
  const [sort, setSort] = useState<SortKey>("value");

  const data = useMemo(() => {
    const mapped = rows.map((r) => {
      const change = r.eur && r.eur30 ? ((r.eur - r.eur30) / r.eur30) * 100 : null;
      return {
        ...r,
        tcgplayer: convert(r.usd, "USD", currency, rates),
        cardmarket: convert(r.eur, "EUR", currency, rates),
        change,
        short: r.name.length > 14 ? r.name.slice(0, 13) + "…" : r.name,
      };
    });
    return mapped.sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "change"
          ? (b.change ?? -999) - (a.change ?? -999)
          : (b.tcgplayer ?? b.cardmarket ?? 0) - (a.tcgplayer ?? a.cardmarket ?? 0),
    );
  }, [rows, currency, sort, rates]);

  const fmt = (v: number | null) => formatMoney(v, currency);

  return (
    <div className="space-y-5 rounded-[2rem] border border-line bg-surface p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Painel do mercado</h2>
          <p className="text-sm text-ink-soft">Cartas icônicas: TCGplayer (EUA) contra Cardmarket (Europa).</p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Moeda">
          {(["BRL", "USD", "EUR"] as Currency[]).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={currency === c}
              onClick={() => setCurrency(c)}
              className="rounded-full border border-line px-3 py-1.5 text-sm font-bold aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-ink"
            >
              {c === "BRL" ? "R$" : c === "USD" ? "US$" : "€"}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="short" tick={{ fill: "var(--ink-soft)", fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
            <YAxis tick={{ fill: "var(--ink-soft)", fontSize: 11 }} tickFormatter={(v: number) => fmt(v)} width={80} />
            <Tooltip
              formatter={(value, name) => [fmt(Number(value)), name === "tcgplayer" ? "TCGplayer" : "Cardmarket"]}
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--ink)" }}
              cursor={{ fill: "var(--surface-2)" }}
            />
            <Bar dataKey="tcgplayer" name="tcgplayer" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="cardmarket" name="cardmarket" fill="var(--accent-3)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 text-xs font-semibold text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-accent" /> TCGplayer · preço de mercado</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-accent-3" /> Cardmarket · tendência</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="py-2 pr-2">
                <button type="button" onClick={() => setSort("name")} className="font-bold uppercase">Carta {sort === "name" && "↓"}</button>
              </th>
              <th className="py-2 pr-2 text-right">
                <button type="button" onClick={() => setSort("value")} className="font-bold uppercase">TCGplayer {sort === "value" && "↓"}</button>
              </th>
              <th className="py-2 pr-2 text-right">Cardmarket</th>
              <th className="py-2 text-right">
                <button type="button" onClick={() => setSort("change")} className="font-bold uppercase">vs. 30 dias {sort === "change" && "↓"}</button>
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
                <td className="py-2 pr-2 text-right font-semibold tabular-nums">{fmt(row.tcgplayer)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{fmt(row.cardmarket)}</td>
                <td className={`py-2 text-right font-semibold tabular-nums ${row.change == null ? "text-ink-soft" : row.change >= 0 ? "text-good" : "text-accent"}`}>
                  {row.change == null ? "—" : `${row.change >= 0 ? "▲" : "▼"} ${Math.abs(row.change).toFixed(1)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
