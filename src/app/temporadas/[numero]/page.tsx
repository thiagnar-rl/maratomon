import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eraColor, getSeason, getSeasons, pad2 } from "@/lib/catalog";
import { EpisodeChecklist } from "@/components/episode-checklist";
import { SeasonProgress } from "@/components/season-progress";

type Props = { params: Promise<{ numero: string }> };

export function generateStaticParams() {
  return getSeasons().map((s) => ({ numero: String(s.number) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const season = getSeason(Number((await params).numero));
  if (!season) return {};
  return {
    title: `Temporada ${season.number}: ${season.title}`,
    description: `Checklist dos ${season.episodes.length} episódios dublados de ${season.title} (${season.titleEn}), em ordem.`,
  };
}

export default async function SeasonPage({ params }: Props) {
  const season = getSeason(Number((await params).numero));
  if (!season) notFound();

  const color = eraColor(season.eraIndex);
  const prev = getSeason(season.number - 1);
  const next = getSeason(season.number + 1);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      <nav aria-label="Navegação" className="text-sm font-semibold text-ink-soft">
        <Link href="/temporadas" className="hover:text-ink">Temporadas</Link> / <span>{season.era}</span>
      </nav>

      <header
        className="relative overflow-hidden rounded-[2rem] p-6 text-white sm:p-10"
        style={{ background: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 55%, black))` }}
      >
        <span aria-hidden="true" className="absolute -right-4 -top-12 font-display text-[12rem] font-black leading-none opacity-15">
          {pad2(season.number)}
        </span>
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest opacity-85">
              Temporada {season.number} · {season.region}
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">{season.title}</h1>
            <p className="opacity-85">{season.titleEn} · {season.episodes.length} episódios dublados</p>
          </div>
          <SeasonProgress episodes={season.episodes} />
        </div>
      </header>

      <EpisodeChecklist season={season} color={color} />

      <nav aria-label="Outras temporadas" className="flex justify-between gap-3 text-sm font-semibold">
        {prev ? (
          <Link href={`/temporadas/${prev.number}`} className="rounded-full border border-line px-4 py-2 hover:border-ink-soft">
            ← T{pad2(prev.number)} {prev.title}
          </Link>
        ) : <span />}
        {next && (
          <Link href={`/temporadas/${next.number}`} className="rounded-full border border-line px-4 py-2 hover:border-ink-soft">
            T{pad2(next.number)} {next.title} →
          </Link>
        )}
      </nav>
    </div>
  );
}
