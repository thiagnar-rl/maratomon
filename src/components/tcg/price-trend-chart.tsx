"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/tcg/prices";

/** Gráfico de área com as médias do Cardmarket convertidas para reais. */
export function PriceTrendChart({ points }: { points: { label: string; brl: number; eur: number }[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <AreaChart data={points} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--ink-soft)", fontSize: 12 }} />
          <YAxis tick={{ fill: "var(--ink-soft)", fontSize: 11 }} tickFormatter={(v: number) => formatMoney(v, "BRL")} width={80} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(value, _name, item) => [
              `${formatMoney(Number(value), "BRL")} (${formatMoney((item.payload as { eur: number }).eur, "EUR")})`,
              "Preço",
            ]}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--ink)" }}
          />
          <Area type="monotone" dataKey="brl" stroke="var(--accent)" strokeWidth={3} fill="url(#trendFill)" dot={{ r: 5, fill: "var(--accent)" }} activeDot={{ r: 7 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
