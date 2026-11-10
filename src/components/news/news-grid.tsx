"use client";

import { useState } from "react";
import { CATEGORY_COLOR, CATEGORY_LABEL, type NewsCategory, type NewsItem } from "@/lib/news-types";
import { NewsCard } from "./news-card";

const FILTERS: (NewsCategory | "todas")[] = ["todas", "tcg", "games", "go", "anime", "competitivo", "geral"];

/** Grade de notícias com filtro por franquia. */
export function NewsGrid({ items, limit }: { items: NewsItem[]; limit?: number }) {
  const [filter, setFilter] = useState<NewsCategory | "todas">("todas");
  const [onlyPt, setOnlyPt] = useState(false);
  const visible = items.filter((i) => (filter === "todas" || i.category === filter) && (!onlyPt || i.lang === "pt"));
  const shown = limit ? visible.slice(0, limit) : visible;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar notícias">
        {FILTERS.map((f) => {
          const count = f === "todas" ? items.length : items.filter((i) => i.category === f).length;
          if (f !== "todas" && count === 0) return null;
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f)}
              className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-bold transition hover:border-ink-soft aria-pressed:border-transparent aria-pressed:bg-ink aria-pressed:text-bg"
            >
              {f !== "todas" && <span className="size-2.5 rounded-full" style={{ background: CATEGORY_COLOR[f] }} />}
              {f === "todas" ? "Tudo" : CATEGORY_LABEL[f]}
              <span className="text-xs opacity-60">{count}</span>
            </button>
          );
        })}
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink-soft">
          <input type="checkbox" checked={onlyPt} onChange={(e) => setOnlyPt(e.target.checked)} className="size-4 accent-[var(--accent)]" />
          Só em português
        </label>
      </div>
      {shown.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line p-8 text-center text-ink-soft">Nada por aqui com esse filtro agora.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((item) => (
            <li key={item.id}>
              <NewsCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
