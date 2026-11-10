import type { Metadata } from "next";
import { catalog, eraColor, getEras } from "@/lib/catalog";
import { eraMons } from "@/lib/pokemon";
import { SeasonCard } from "@/components/season-card";
import { MonArt } from "@/components/mon-art";

export const metadata: Metadata = {
  title: "Anime: todas as temporadas",
  description: "Todas as temporadas dubladas do anime, em ordem de lançamento, com checklist de episódios.",
};

export default function SeasonsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-14 px-4 py-12 sm:px-6">
      <header className="relative space-y-2">
        <MonArt mon={{ id: 25, name: "Pikachu" }} size={120} eager className="animate-float absolute -top-6 right-0 hidden sm:block" />
        <h1 className="font-display text-5xl font-extrabold tracking-tight">Anime</h1>
        <p className="max-w-xl text-ink-soft">
          {catalog.totalEpisodes.toLocaleString("pt-BR")} episódios dublados em {catalog.seasons.length} temporadas, na
          ordem de lançamento, da Liga Índigo até Horizontes.
        </p>
      </header>
      {getEras().map((era) => {
        const mon = eraMons[era.index];
        return (
          <section key={era.name} id={`era-${era.index}`} className="scroll-mt-28 space-y-4">
            <h2 className="flex items-center gap-3 font-display text-3xl font-extrabold">
              {mon && <MonArt mon={mon} size={56} />}
              <span style={{ color: eraColor(era.index) }}>{era.name}</span>
              <span className="text-sm font-semibold text-ink-soft">
                {era.seasons.reduce((n, s) => n + s.episodes.length, 0)} episódios
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {era.seasons.map((season) => (
                <SeasonCard key={season.number} season={season} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
