import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eraColor, getAllEpisodes, getEpisode, getNeighbors, getSeason, pad2 } from "@/lib/catalog";
import { EpisodeActions } from "@/components/episode-actions";
import { WatchPanel } from "@/components/watch-panel";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllEpisodes().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const episode = getEpisode((await params).slug);
  if (!episode) return {};
  const season = getSeason(episode.season)!;
  return {
    title: `${episode.title} (T${pad2(episode.season)}E${pad2(episode.number)})`,
    description: `Episódio ${episode.number} de ${season.title}, dublado. Veja onde assistir oficialmente e marque no seu progresso.`,
  };
}

export default async function EpisodePage({ params }: Props) {
  const episode = getEpisode((await params).slug);
  if (!episode) notFound();

  const season = getSeason(episode.season)!;
  const color = eraColor(season.eraIndex);
  const { prev, next } = getNeighbors(episode);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <nav aria-label="Navegação" className="text-sm font-semibold text-ink-soft">
        <Link href="/temporadas" className="hover:text-ink">Temporadas</Link> /{" "}
        <Link href={`/temporadas/${season.number}`} className="hover:text-ink">
          T{pad2(season.number)} {season.title}
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <WatchPanel episode={episode} providers={season.providers} />

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
              Temporada {season.number} · Episódio {episode.number} · #{episode.overall} no geral
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-tight">{episode.title}</h1>
            {episode.titlePt && episode.titleEn && <p className="text-ink-soft">{episode.titleEn}</p>}
          </div>
          <EpisodeActions episodeKey={episode.key} color={color} />
          <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
            {prev ? (
              <Link href={`/episodios/${prev.slug}`} className="rounded-2xl border border-line p-3 hover:border-ink-soft">
                <span className="block text-xs text-ink-soft">← Anterior</span>
                <span className="line-clamp-2">{prev.title}</span>
              </Link>
            ) : <span />}
            {next && (
              <Link href={`/episodios/${next.slug}`} className="rounded-2xl border border-line p-3 text-right hover:border-ink-soft">
                <span className="block text-xs text-ink-soft">Próximo →</span>
                <span className="line-clamp-2">{next.title}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
