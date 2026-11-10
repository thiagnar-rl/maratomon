import type { Metadata } from "next";
import { justWatchUrl, movies } from "@/data/movies";
import { MonArt } from "@/components/mon-art";
import { CheckButton } from "@/components/check-button";
import { CollectionProgress } from "@/components/collection-progress";

export const metadata: Metadata = {
  title: "Filmes",
  description: "Todos os filmes de Pokémon em ordem de lançamento, com checklist e onde assistir no Brasil.",
};

export default function MoviesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6">
      <header className="relative flex flex-col gap-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#4b1c6b] via-[#2b1846] to-[#0f0b1d] p-8 text-white sm:flex-row sm:items-end sm:justify-between sm:p-10">
        <MonArt mon={{ id: 150, name: "Mewtwo" }} size={220} eager className="animate-float pointer-events-none absolute -right-6 -top-6 opacity-90" />
        <div className="relative max-w-xl space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-accent-2">Cinema Pokémon</p>
          <h1 className="font-display text-5xl font-extrabold tracking-tight">Filmes</h1>
          <p className="opacity-85">
            Os {movies.length} longas, do Mewtwo de 1998 às Crônicas de Arceus, em ordem de lançamento no Japão.
            Marque os que já viu.
          </p>
        </div>
        <div className="relative sm:mr-48">
          <CollectionProgress keys={movies.map((m) => m.key)} label="filmes vistos" />
        </div>
      </header>

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {movies.map((movie) => (
          <li key={movie.key} className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface">
            <div className="relative grid h-44 place-items-center bg-gradient-to-br from-surface-2 to-bg">
              <span aria-hidden="true" className="absolute left-4 top-3 font-display text-6xl font-black text-ink/10">
                {String(movie.number).padStart(2, "0")}
              </span>
              <MonArt mon={movie.mon} size={150} className="transition duration-300 group-hover:scale-110" />
              {movie.kind && (
                <span className="absolute right-3 top-3 rounded-full bg-accent-2 px-2.5 py-1 text-[11px] font-bold uppercase text-black">
                  {movie.kind}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div>
                <p className="text-xs font-bold text-accent">{movie.year}</p>
                <h2 className="font-display text-lg font-bold leading-tight">{movie.title}</h2>
              </div>
              <p className="text-sm text-ink-soft">
                <strong className="text-ink">Onde assistir:</strong> {movie.whereToWatch}
              </p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <CheckButton itemKey={movie.key} label={`Marcar "${movie.title}" como assistido`} doneText="Assistido" todoText="Não assisti" />
                <a
                  href={justWatchUrl(movie.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-bold hover:border-ink-soft"
                >
                  Ver agora no JustWatch ↗
                </a>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-center text-xs text-ink-soft">
        Disponibilidade segundo o Omelete (maio de 2026). O JustWatch mostra onde cada filme está hoje.
      </p>
    </div>
  );
}
