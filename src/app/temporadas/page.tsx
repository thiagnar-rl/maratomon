import type { Metadata } from "next";
import { eraColor, getEras } from "@/lib/catalog";
import { SeasonCard } from "@/components/season-card";

export const metadata: Metadata = {
  title: "Temporadas",
  description: "Todas as temporadas dubladas do anime, em ordem de lançamento, com checklist de episódios.",
};

export default function SeasonsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6">
      <header className="space-y-2">
        <h1 className="font-display text-5xl font-extrabold tracking-tight">Temporadas</h1>
        <p className="text-ink-soft">Ordem de lançamento da dublagem brasileira, da Liga Índigo até Horizontes.</p>
      </header>
      {getEras().map((era) => (
        <section key={era.name} className="space-y-4">
          <h2 className="flex items-center gap-3 font-display text-2xl font-bold">
            <span className="h-6 w-1.5 rounded-full" style={{ background: eraColor(era.index) }} />
            {era.name}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {era.seasons.map((season) => (
              <SeasonCard key={season.number} season={season} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
