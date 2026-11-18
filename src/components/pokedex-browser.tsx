"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { sprite } from "@/lib/pokemon";

type Entry = { id: number; slug: string; name: string };
type Gen = { n: number; label: string; region: string; from: number; to: number };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Busca e filtro por geração da Pokédex (tudo no navegador, sem novas chamadas). */
export function PokedexBrowser({ list, generations }: { list: Entry[]; generations: Gen[] }) {
  const [q, setQ] = useState("");
  const [gen, setGen] = useState<number | null>(null);
  const query = useDeferredValue(norm(q.trim()));

  const shown = useMemo(() => {
    const g = generations.find((x) => x.n === gen);
    return list.filter((e) => (!g || (e.id >= g.from && e.id <= g.to)) && (!query || norm(e.name).includes(query) || String(e.id) === query.replace(/^#?0*/, "")));
  }, [list, generations, gen, query]);

  return (
    <div className="space-y-5">
      <div className="sticky top-[4.5rem] z-10 -mx-4 space-y-3 bg-bg/85 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-3xl sm:border sm:border-line sm:px-4">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome ou número (ex.: Pikachu, 25)"
          aria-label="Buscar Pokémon"
          className="w-full rounded-full border border-line bg-surface px-5 py-3 text-base outline-none focus:border-accent"
        />
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Geração">
          <button type="button" aria-pressed={gen === null} onClick={() => setGen(null)} className="shrink-0 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold aria-pressed:bg-accent aria-pressed:text-white">
            Todas
          </button>
          {generations.map((g) => (
            <button key={g.n} type="button" aria-pressed={gen === g.n} onClick={() => setGen(gen === g.n ? null : g.n)} className="shrink-0 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold aria-pressed:bg-accent aria-pressed:text-white">
              {g.region}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm text-ink-soft">{shown.length} Pokémon</p>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {shown.map((e) => (
          <li key={e.id}>
            <Link
              href={`/pokemon/${e.slug}`}
              className="group flex flex-col items-center rounded-3xl border border-line bg-surface p-2 text-center transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-lg"
            >
              <img src={sprite(e.id)} alt="" loading="lazy" width={96} height={96} className="size-20 object-contain [image-rendering:pixelated] transition group-hover:scale-110" />
              <span className="text-[11px] font-semibold tabular-nums text-ink-soft">#{String(e.id).padStart(4, "0")}</span>
              <span className="w-full truncate text-sm font-bold">{e.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
