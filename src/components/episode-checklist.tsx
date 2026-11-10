"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { pad2, type Season } from "@/lib/catalog";
import { setWatched, toggleWatched, useProgress } from "@/lib/progress/hooks";
import { WatchedCheckbox } from "./watched-checkbox";

export function EpisodeChecklist({ season, color }: { season: Season; color: string }) {
  const { watched } = useProgress();
  const [hideWatched, setHideWatched] = useState(false);
  const [query, setQuery] = useState("");

  const nextKey = season.episodes.find((e) => !watched.has(e.key))?.key;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return season.episodes.filter(
      (e) =>
        (!hideWatched || !watched.has(e.key)) &&
        (!q || `${e.titlePt ?? ""} ${e.titleEn ?? ""}`.toLowerCase().includes(q)),
    );
  }, [season.episodes, hideWatched, query, watched]);

  const keys = season.episodes.map((e) => e.key);

  return (
    <section aria-label="Episódios" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="busca" className="sr-only">Buscar episódio</label>
        <input
          id="busca"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar nesta temporada…"
          className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-ink-soft"
        />
        <button
          type="button"
          aria-pressed={hideWatched}
          onClick={() => setHideWatched((v) => !v)}
          className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-bg"
        >
          Ocultar assistidos
        </button>
        <button
          type="button"
          onClick={() => setWatched(keys, true)}
          className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:border-ink-soft"
        >
          Marcar todos
        </button>
        <button
          type="button"
          onClick={() => setWatched(keys, false)}
          className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:border-ink-soft"
        >
          Desmarcar todos
        </button>
      </div>

      <ol className="overflow-hidden rounded-3xl border border-line bg-surface">
        {visible.map((episode) => {
          const isWatched = watched.has(episode.key);
          const isNext = episode.key === nextKey;
          return (
            <li
              key={episode.key}
              className={`flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0 sm:px-5 ${
                isNext ? "bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]" : ""
              }`}
            >
              <WatchedCheckbox
                checked={isWatched}
                onChange={() => toggleWatched(episode.key)}
                label={`Marcar "${episode.title}" como assistido`}
                color={color}
              />
              <span className="w-14 shrink-0 text-xs font-bold tabular-nums text-ink-soft">
                E{pad2(episode.number)}
                <span className="block font-medium opacity-70">#{String(episode.overall).padStart(4, "0")}</span>
              </span>
              <Link href={`/episodios/${episode.slug}`} className="min-w-0 flex-1 py-1">
                <span className={`block font-semibold leading-snug ${isWatched ? "text-ink-soft line-through decoration-ink-soft/50" : ""}`}>
                  {episode.title}
                </span>
                {episode.titlePt && episode.titleEn && (
                  <span className="block truncate text-xs text-ink-soft">{episode.titleEn}</span>
                )}
              </Link>
              {isNext && (
                <span className="hidden rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-ink sm:inline">
                  Próximo
                </span>
              )}
              {episode.youtubeId && (
                <span className="hidden rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-ink-soft sm:inline">
                  Grátis
                </span>
              )}
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="px-5 py-10 text-center text-sm text-ink-soft">Nenhum episódio com esse filtro.</li>
        )}
      </ol>
    </section>
  );
}
