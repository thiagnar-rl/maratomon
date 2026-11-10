"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { addToCompare, MAX_COMPARE, removeFromCompare, useCompareIds } from "@/lib/tcg/compare-store";
import { formatMoney, tcgplayerVariants } from "@/lib/tcg/prices";
import type { Pricing, Rates } from "@/lib/tcg/types";
import { CardPicker } from "./card-picker";

type CardData = {
  id: string;
  name: string;
  set: string;
  rarity: string | null;
  hp: number | null;
  image: string | null;
  pricing: Pricing | null;
  estimate: { brl: number; source: string } | null;
  rates: Rates;
};

const COLORS = ["var(--accent)", "var(--accent-3)", "var(--accent-2)", "#10b39a"];

export function Comparator() {
  const ids = useCompareIds();
  const [cards, setCards] = useState<Record<string, CardData>>({});

  useEffect(() => {
    const missing = ids.filter((id) => !cards[id]);
    if (missing.length === 0) return;
    Promise.all(
      missing.map((id) => fetch(`/api/tcg/card/${encodeURIComponent(id)}`).then((r) => (r.ok ? (r.json() as Promise<CardData>) : null))),
    ).then((list) => {
      setCards((prev) => {
        const next = { ...prev };
        list.forEach((c) => c && (next[c.id] = c));
        return next;
      });
    });
  }, [ids, cards]);

  const selected = ids.map((id) => cards[id]).filter(Boolean) as CardData[];

  const chart = useMemo(() => {
    const metric = (c: CardData) => {
      const rates = c.rates;
      const tp = tcgplayerVariants(c.pricing ?? undefined)[0]?.[1];
      const cm = c.pricing?.cardmarket;
      return {
        "TCGplayer mín.": tp?.lowPrice ? tp.lowPrice * rates.USD : null,
        "TCGplayer mercado": tp?.marketPrice ? tp.marketPrice * rates.USD : null,
        "Cardmarket 30 dias": cm?.avg30 ? cm.avg30 * rates.EUR : null,
        "Cardmarket tendência": cm?.trend ? cm.trend * rates.EUR : null,
      };
    };
    const labels = ["TCGplayer mín.", "TCGplayer mercado", "Cardmarket 30 dias", "Cardmarket tendência"] as const;
    return labels.map((label) => {
      const row: Record<string, string | number | null> = { label };
      selected.forEach((c) => (row[c.id] = metric(c)[label]));
      return row;
    });
  }, [selected]);

  const best = selected.reduce<CardData | null>((acc, c) => (c.estimate && (!acc?.estimate || c.estimate.brl > acc.estimate.brl) ? c : acc), null);

  return (
    <div className="space-y-6">
      {ids.length < MAX_COMPARE && <CardPicker onPick={(c) => addToCompare(c.id)} placeholder="Buscar carta para comparar (ex.: Charizard)" />}

      {ids.length === 0 && (
        <p className="rounded-3xl border border-dashed border-line p-8 text-center text-ink-soft">
          Busque uma carta acima ou use o botão “Comparar” na página de qualquer carta.
        </p>
      )}

      {selected.length > 0 && (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {selected.map((c, i) => (
              <li key={c.id} className="relative space-y-3 rounded-3xl border-2 bg-surface p-4" style={{ borderColor: COLORS[i] }}>
                <button type="button" onClick={() => removeFromCompare(c.id)} aria-label={`Remover ${c.name}`} className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-surface-2 font-bold">
                  ×
                </button>
                <Link href={`/tcg/cartas/${c.id}`}>
                  {c.image && <img src={c.image} alt={c.name} className="mx-auto aspect-[5/7] w-40 rounded-xl object-cover shadow-lg" />}
                </Link>
                <div>
                  <p className="font-display text-lg font-bold leading-tight">{c.name}</p>
                  <p className="text-xs text-ink-soft">{c.set}</p>
                </div>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-ink-soft">Valor estimado</dt><dd className="font-bold">{formatMoney(c.estimate?.brl, "BRL")}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-soft">Raridade</dt><dd>{c.rarity ?? "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-soft">HP</dt><dd>{c.hp ?? "—"}</dd></div>
                </dl>
                {best?.id === c.id && selected.length > 1 && (
                  <p className="rounded-full bg-accent-2 px-3 py-1 text-center text-xs font-bold text-black">Mais valiosa</p>
                )}
              </li>
            ))}
          </ul>

          <section className="space-y-3 rounded-3xl border border-line bg-surface p-5">
            <h2 className="font-display text-xl font-bold">Preços lado a lado (R$)</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer>
                <BarChart data={chart} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "var(--ink-soft)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "var(--ink-soft)", fontSize: 11 }} tickFormatter={(v: number) => formatMoney(v, "BRL")} width={80} />
                  <Tooltip
                    formatter={(value, name) => [formatMoney(Number(value), "BRL"), selected.find((c) => c.id === name)?.name ?? String(name)]}
                    contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--ink)" }}
                    cursor={{ fill: "var(--surface-2)" }}
                  />
                  <Legend formatter={(value) => selected.find((c) => c.id === value)?.name ?? value} />
                  {selected.map((c, i) => (
                    <Bar key={c.id} dataKey={c.id} fill={COLORS[i]} radius={[6, 6, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
