"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { liga } from "@/lib/liga";
import { radarTrending } from "@/lib/radar";
import { formatMoney } from "@/lib/tcg/prices";

type Row = { card_id: string; notes: number; median_brl: number };

const shortcuts = [
  { label: "Em alta na Liga", href: liga.trendingUp() },
  { label: "Mais vistas", href: liga.mostViewed() },
  { label: "Leilões", href: liga.auctions() },
  { label: "Bazar", href: liga.bazaar() },
  { label: "Compra por lista", href: liga.buyByList() },
];

/** Cartas com mais preços anotados pela comunidade nos últimos 7 dias (Radar BR). */
export function TermometroBR() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let active = true;
    radarTrending(8)
      .then((data) => active && setRows(data))
      .catch(() => active && setRows([]));
    return () => {
      active = false;
    };
  }, []);

  return (
    <section aria-labelledby="termometro" className="scroll-mt-40 space-y-4 rounded-[2rem] border border-line bg-surface p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Radar BR</p>
          <h2 id="termometro" className="font-display text-3xl font-extrabold">Termômetro Brasil 🇧🇷</h2>
          <p className="max-w-2xl text-sm text-ink-soft">
            Preços que treinadores pagaram de verdade em lojas, eventos e trocas no Brasil. Cada anotação é anônima; mostramos a mediana
            a partir de duas anotações.
          </p>
        </div>
      </div>
      {rows === null ? (
        <p className="text-sm text-ink-soft">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-ink-soft">
          Ainda sem anotações suficientes. Abra uma carta e registre quanto você pagou para começar o termômetro.
        </p>
      ) : (
        <ol className="grid gap-2 sm:grid-cols-2">
          {rows.map((r, i) => (
            <li key={r.card_id}>
              <Link href={`/tcg/cartas/${r.card_id}`} className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3 hover:bg-line">
                <span className="font-semibold">
                  <span className="mr-2 text-ink-soft">{i + 1}.</span>
                  {r.card_id}
                </span>
                <span className="text-right text-sm">
                  <strong className="tabular-nums">{formatMoney(r.median_brl, "BRL")}</strong>
                  <span className="block text-xs text-ink-soft">{r.notes} anotações</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <span className="text-sm font-semibold text-ink-soft">Atalhos na Liga Pokémon:</span>
        {shortcuts.map((s) => (
          <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1 text-sm font-bold hover:border-ink">
            {s.label} ↗
          </a>
        ))}
      </div>
    </section>
  );
}
