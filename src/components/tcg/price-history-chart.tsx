"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney, formatPct } from "@/lib/tcg/prices";

export type ChartPoint = { day: string; label: string; brl: number | null; usd: number | null };

const RANGES = [
  [7, "7d"],
  [30, "30d"],
  [90, "90d"],
  [365, "1 ano"],
] as const;

/**
 * Gráfico de oscilação do preço, em real ou dólar.
 * Usa o histórico diário gravado pelo site; enquanto ele é curto, completa com as médias do Cardmarket.
 */
export function PriceHistoryChart({ history, fallback }: { history: ChartPoint[]; fallback: ChartPoint[] }) {
  const [currency, setCurrency] = useState<"brl" | "usd">("brl");
  const [range, setRange] = useState<number>(30);
  const usingHistory = history.length >= 3;

  const data = useMemo(() => {
    if (!usingHistory) return fallback;
    // Conta o período a partir do dia mais recente do histórico.
    const lastDay = history.at(-1)!.day;
    const since = new Date(new Date(`${lastDay}T12:00:00Z`).getTime() - range * 86400000).toISOString().slice(0, 10);
    return history.filter((p) => p.day >= since);
  }, [history, fallback, range, usingHistory]);

  const values = data.map((p) => p[currency]).filter((v): v is number => typeof v === "number");
  const first = values[0];
  const last = values.at(-1);
  const change = first && last ? ((last - first) / first) * 100 : null;
  const up = (change ?? 0) >= 0;
  const color = up ? "var(--good)" : "#ff5c8a";
  const money = (v: number) => formatMoney(v, currency === "brl" ? "BRL" : "USD");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-full bg-surface-2 p-1 text-xs font-bold" role="group" aria-label="Moeda">
          {(["brl", "usd"] as const).map((c) => (
            <button key={c} type="button" aria-pressed={currency === c} onClick={() => setCurrency(c)} className="rounded-full px-3 py-1.5 aria-pressed:bg-surface aria-pressed:shadow">
              {c === "brl" ? "R$ Real" : "US$ Dólar"}
            </button>
          ))}
        </div>
        {usingHistory && (
          <div className="flex items-center gap-1 rounded-full bg-surface-2 p-1 text-xs font-bold" role="group" aria-label="Período">
            {RANGES.map(([days, label]) => (
              <button key={days} type="button" aria-pressed={range === days} onClick={() => setRange(days)} className="rounded-full px-3 py-1.5 aria-pressed:bg-surface aria-pressed:shadow">
                {label}
              </button>
            ))}
          </div>
        )}
        {change != null && (
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${up ? "bg-good/15 text-good" : "bg-[#ff5c8a]/15 text-[#ff5c8a]"}`}>
            {up ? "▲" : "▼"} {formatPct(change)} no período
          </span>
        )}
      </div>

      {values.length < 2 ? (
        <p className="grid h-56 place-items-center rounded-2xl bg-surface-2 text-sm text-ink-soft">Ainda sem histórico suficiente para o gráfico.</p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="histFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--ink-soft)", fontSize: 11 }} minTickGap={24} />
              <YAxis tick={{ fill: "var(--ink-soft)", fontSize: 11 }} tickFormatter={money} width={78} domain={["auto", "auto"]} />
              <Tooltip
                formatter={(value) => [money(Number(value)), currency === "brl" ? "Preço em reais" : "Preço em dólar"]}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--ink)" }}
              />
              <Area type="monotone" dataKey={currency} stroke={color} strokeWidth={3} fill="url(#histFill)" connectNulls dot={data.length <= 8 ? { r: 4, fill: color } : false} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="text-xs text-ink-soft">
        {usingHistory
          ? "Histórico diário registrado pelo Maratomon TCG (1 ponto por dia)."
          : "Médias do Cardmarket (30 dias, 7 dias, ontem e tendência). O histórico diário do Maratomon começa a aparecer conforme os dias passam."}
      </p>
    </div>
  );
}
