import Link from "next/link";
import { catalog, eraColor, getEras } from "@/lib/catalog";
import { ContinueCard } from "@/components/continue-card";
import { SeasonCard } from "@/components/season-card";

export default function HomePage() {
  const eras = getEras();
  const freeSeasons = catalog.seasons.filter((s) => s.providers.some((p) => p.free)).length;

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="stage-lights animate-drift absolute -inset-20 -z-10" />
        <div aria-hidden="true" className="grain absolute inset-0 -z-10 opacity-40" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs font-bold uppercase tracking-widest text-ink-soft backdrop-blur">
              <span className="size-2 rounded-full bg-accent" /> Guia de fãs · 100% dublado
            </p>
            <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Todos os <span className="text-accent">{catalog.totalEpisodes.toLocaleString("pt-BR")}</span> episódios.
              <br />
              Na ordem certa.
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-ink-soft">
              Marque o que já assistiu, veja o próximo episódio e encontre onde assistir dublado em fontes oficiais,
              muitas delas de graça.
            </p>
            <dl className="grid max-w-md grid-cols-3 gap-3">
              {[
                { value: catalog.seasons.length, label: "temporadas" },
                { value: eras.length, label: "séries" },
                { value: freeSeasons, label: "temporadas grátis" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-line bg-surface/70 p-3 backdrop-blur">
                  <dt className="text-xs font-semibold text-ink-soft">{stat.label}</dt>
                  <dd className="font-display text-3xl font-extrabold tabular-nums">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <ContinueCard />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 sm:px-6">
        {eras.map((era) => (
          <section key={era.name} aria-labelledby={`era-${era.index}`} className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <h2 id={`era-${era.index}`} className="flex items-center gap-3 font-display text-3xl font-extrabold">
                <span className="h-8 w-2 rounded-full" style={{ background: eraColor(era.index) }} />
                {era.name}
              </h2>
              <span className="text-sm font-semibold text-ink-soft tabular-nums">
                {era.seasons.reduce((n, s) => n + s.episodes.length, 0)} episódios
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {era.seasons.map((season) => (
                <SeasonCard key={season.number} season={season} />
              ))}
            </div>
          </section>
        ))}
        <p className="text-center text-sm text-ink-soft">
          Filmes e especiais ficam de fora por enquanto. <Link href="/sobre" className="font-semibold underline">Saiba como montamos a lista</Link>.
        </p>
      </div>
    </>
  );
}
