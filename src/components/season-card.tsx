"use client";

import Link from "next/link";
import { eraColor, pad2, type Season } from "@/lib/catalog";
import { seasonMons } from "@/lib/pokemon";
import { useWatchedCount } from "@/lib/progress/hooks";
import { MonArt } from "./mon-art";

export function SeasonCard({ season }: { season: Season }) {
  const seen = useWatchedCount(season.episodes);
  const total = season.episodes.length;
  const done = seen === total;
  const color = eraColor(season.eraIndex);
  const [main, second] = seasonMons[season.number] ?? [];

  return (
    <Link
      href={`/temporadas/${season.number}`}
      className="group relative flex min-h-56 flex-col gap-4 overflow-hidden rounded-3xl border border-line p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-28px_var(--card-color)] motion-reduce:hover:translate-y-0"
      style={
        {
          "--card-color": color,
          background: `radial-gradient(120% 90% at 100% 0%, color-mix(in oklab, ${color} 28%, transparent), transparent 60%), var(--surface)`,
        } as React.CSSProperties
      }
    >
      {main && (
        <div aria-hidden="true" className="pointer-events-none absolute -right-4 -top-2 flex items-end">
          {second && (
            <MonArt mon={second} size={92} className="-mr-8 mb-2 opacity-90 transition group-hover:-translate-x-1" />
          )}
          <MonArt mon={main} size={132} className="transition duration-300 group-hover:scale-110 group-hover:-rotate-3" />
        </div>
      )}
      <div className="relative flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
        <span className="rounded-full px-2.5 py-1 text-white" style={{ background: color }}>
          T{pad2(season.number)}
        </span>
        <span className="text-ink-soft">{season.region}</span>
      </div>
      <div className="relative mt-auto max-w-[70%]">
        {done && (
          <span className="mb-2 inline-block rounded-full bg-good/15 px-2.5 py-1 text-xs font-bold text-good">
            Completa ✓
          </span>
        )}
        <h3 className="font-display text-xl font-bold leading-tight">{season.title}</h3>
        <p className="text-sm text-ink-soft">{season.titleEn}</p>
      </div>
      <div className="relative space-y-1.5">
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${(seen / total) * 100}%`, background: done ? "var(--good)" : color }}
          />
        </div>
        <p className="text-xs font-semibold tabular-nums text-ink-soft">
          {seen} de {total} episódios
          {main && <span className="float-right opacity-70">{main.name}{second ? ` & ${second.name}` : ""}</span>}
        </p>
      </div>
    </Link>
  );
}
