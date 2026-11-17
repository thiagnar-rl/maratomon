"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { TopCard } from "@/lib/tcg/market";
import { cardImage, formatMoney } from "@/lib/tcg/prices";

/** Ranking dos cards mais caros à venda no Brasil (MYP Cards), com filtros de graduadas e idioma. */
export function BrTopCards({ top }: { top: TopCard[] }) {
  const [noGraded, setNoGraded] = useState(true);
  const [ptEn, setPtEn] = useState(false);
  const [limit, setLimit] = useState(24);

  const list = useMemo(
    () => top.filter((t) => (!noGraded || !t.graded) && (!ptEn || !t.otherLanguage)).sort((a, b) => b.low - a.low),
    [top, noGraded, ptEn],
  );
  const shown = list.slice(0, limit);

  if (top.length === 0) return <p className="rounded-3xl border border-line bg-surface p-6 text-ink-soft">Ranking do Brasil indisponível agora.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex flex-wrap gap-2" role="group" aria-label="Filtros do ranking">
          {(
            [
              [noGraded, setNoGraded, "Sem graduadas"],
              [ptEn, setPtEn, "Só português e inglês"],
            ] as const
          ).map(([on, set, label]) => (
            <button
              key={label}
              type="button"
              aria-pressed={on}
              onClick={() => set(!on)}
              className="rounded-full border border-line px-3.5 py-1.5 text-sm font-bold transition hover:border-ink-soft aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-white"
            >
              {on ? "✓ " : ""}
              {label}
            </button>
          ))}
        </span>
        <p className="text-sm text-ink-soft">
          Top {shown.length} somam <strong className="text-ink tabular-nums">{formatMoney(shown.reduce((s, t) => s + t.low, 0), "BRL")}</strong>
        </p>
      </div>

      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {shown.map((t, i) => {
          const img = cardImage(t.image, "low") ?? t.thumb;
          const inner = (
            <>
              <span className="absolute left-2 top-2 z-10 grid size-7 place-items-center rounded-full bg-accent-2 font-display text-sm font-extrabold text-black shadow-lg">{i + 1}</span>
              <div className="relative aspect-[5/7] overflow-hidden rounded-xl bg-surface-2 shadow-md">
                {img && <img src={img} alt={t.name} loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-105" />}
                <span className="absolute bottom-1.5 left-1.5 flex flex-wrap gap-1">
                  {t.graded && <span className="rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white">Graduada</span>}
                  {t.otherLanguage && <span className="rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white">Outro idioma</span>}
                </span>
              </div>
              <p className="mt-2 line-clamp-1 text-sm font-semibold" title={t.name}>{t.name}</p>
              <p className="line-clamp-1 text-xs text-ink-soft" title={t.edition}>{t.edition || t.code}</p>
              <div className="mt-1 rounded-lg bg-surface-2 px-2 py-1 text-xs tabular-nums">
                <span className="flex items-baseline justify-between gap-1">
                  <strong className="text-sm text-ink">{formatMoney(t.low, "BRL")}</strong>
                  <span className="text-[9px] font-black text-good">BR</span>
                </span>
                <span className="block text-ink-soft">
                  {t.units ? `${t.units} un. · ` : ""}
                  {t.intlBrl != null ? `int. ${formatMoney(t.intlBrl, "BRL")}` : "MYP Cards"}
                </span>
              </div>
            </>
          );
          return (
            <li key={t.mypId} className="relative">
              {t.tcgId ? (
                <Link href={`/tcg/cartas/${t.tcgId}`} className="group block rounded-2xl p-1.5 transition hover:bg-surface-2">
                  {inner}
                </Link>
              ) : (
                <a href={t.url} target="_blank" rel="noopener noreferrer" className="group block rounded-2xl p-1.5 transition hover:bg-surface-2">
                  {inner}
                </a>
              )}
            </li>
          );
        })}
      </ol>
      {list.length > shown.length && (
        <button type="button" onClick={() => setLimit(limit + 24)} className="mx-auto block rounded-full border border-line px-5 py-2 text-sm font-bold hover:border-ink-soft">
          Ver mais ({list.length - shown.length})
        </button>
      )}
      <p className="text-xs text-ink-soft">
        Menor oferta à venda no Brasil no MYP Cards (atualizado a cada 6 h). Cartas fora do catálogo do site abrem a oferta no MYP Cards. &quot;int.&quot; = média
        internacional (TCGplayer e Cardmarket) em reais.
      </p>
    </div>
  );
}
