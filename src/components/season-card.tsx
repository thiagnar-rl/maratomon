"use client";

import Link from "next/link";
import { eraColor, pad2, type Season } from "@/lib/catalog";
import { useWatchedCount } from "@/lib/progress/hooks";

export function SeasonCard({ season }: { season: Season }) {
  const seen = useWatchedCount(season.episodes);
  const total = season.episodes.length;
  const done = seen === total;
  const color = eraColor(season.eraIndex);

  return (
    <Link
      href={`/temporadas/${season.number}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-line bg-surface p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-24px_var(--card-color)] motion-reduce:hover:translate-y-0"
      style={{ "--card-color": color } as React.CSSProperties}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-10 font-display text-[7.5rem] font-black leading-none opacity-[0.08] transition group-hover:opacity-[0.16]"
        style={{ color }}
      >
        {pad2(season.number)}
      </span>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
        <span className="rounded-full px-2.5 py-1 text-white" style={{ background: color }}>
          T{pad2(season.number)}
        </span>
        <span className="text-ink-soft">{season.region}</span>
        {done && <span className="ml-auto rounded-full bg-good/15 px-2.5 py-1 text-good">Completa</span>}
      </div>
      <div>
        <h3 className="font-display text-xl font-bold leading-tight">{season.title}</h3>
        <p className="text-sm text-ink-soft">{season.titleEn}</p>
      </div>
      <div className="mt-auto space-y-1.5">
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${(seen / total) * 100}%`, background: done ? "var(--good)" : color }}
          />
        </div>
        <p className="text-xs font-semibold tabular-nums text-ink-soft">
          {seen} de {total} episódios
        </p>
      </div>
    </Link>
  );
}
