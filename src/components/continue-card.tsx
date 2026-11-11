"use client";

import Link from "next/link";
import { catalog, eraColor, getSeason, pad2 } from "@/lib/catalog";
import { openAccountPrompt, useEpisodesWatched, useNextEpisode, useProgress } from "@/lib/progress/hooks";
import { ProgressRing } from "./progress-ring";

/** Bloco "continue de onde parou" do herói da página inicial. */
export function ContinueCard() {
  const { ready, loggedIn } = useProgress();
  const episodesSeen = useEpisodesWatched();
  const next = useNextEpisode();
  const season = next ? getSeason(next.season) : undefined;
  const total = catalog.totalEpisodes;
  const pct = Math.round((episodesSeen / total) * 100);

  if (ready && !loggedIn) return <GuestCard />;

  return (
    <div className="relative flex flex-col items-center gap-6 rounded-[2rem] border border-line bg-surface/85 p-6 shadow-[var(--glow)] backdrop-blur sm:flex-row sm:p-8">
      <ProgressRing value={ready ? episodesSeen : 0} total={total} label={`${episodesSeen} de ${total} episódios assistidos`}>
        <span>
          <span className="block font-display text-4xl font-extrabold tabular-nums">{ready ? pct : 0}%</span>
          <span className="text-xs font-semibold text-ink-soft tabular-nums">
            {episodesSeen}/{total}
          </span>
        </span>
      </ProgressRing>

      <div className="w-full min-w-0 flex-1 space-y-3 text-center sm:text-left">
        {next && season ? (
          <>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: eraColor(season.eraIndex) }}>
              {episodesSeen === 0 ? "Comece por aqui" : "Continue de onde parou"} · T{pad2(season.number)} E{pad2(next.number)}
            </p>
            <p className="font-display text-2xl font-bold leading-tight">{next.title}</p>
            <p className="text-sm text-ink-soft">{season.title}</p>
            <div className="flex flex-wrap justify-center gap-2 pt-1 sm:justify-start">
              <Link
                href={`/episodios/${next.slug}${next.youtubeId ? "#assistir" : ""}`}
                className="rounded-full bg-accent px-5 py-3 text-sm font-bold text-accent-ink shadow-lg transition hover:brightness-110"
              >
                {next.youtubeId ? "Assistir agora" : "Ver episódio"}
              </Link>
              <Link
                href={`/temporadas/${season.number}`}
                className="rounded-full border border-line px-5 py-3 text-sm font-bold transition hover:border-ink-soft"
              >
                Abrir checklist
              </Link>
            </div>
          </>
        ) : (
          <p className="font-display text-2xl font-bold">Você assistiu tudo! Mestre da maratona. 🏆</p>
        )}
      </div>
    </div>
  );
}

/** Sem conta: convida a criar conta para registrar a maratona. */
function GuestCard() {
  const first = catalog.seasons[0].episodes[0];
  return (
    <div className="relative flex flex-col items-center gap-6 rounded-[2rem] border border-accent/40 bg-surface/85 p-6 shadow-[var(--glow)] backdrop-blur sm:flex-row sm:p-8">
      <button type="button" onClick={openAccountPrompt} aria-label="Criar conta para registrar seu progresso" className="group relative">
        <ProgressRing value={0} total={catalog.totalEpisodes} label="Progresso disponível com conta">
          <span className="text-4xl transition group-hover:scale-110" aria-hidden="true">🔒</span>
        </ProgressRing>
      </button>
      <div className="w-full min-w-0 flex-1 space-y-3 text-center sm:text-left">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Sua maratona começa aqui</p>
        <p className="font-display text-2xl font-bold leading-tight">Crie sua conta e acompanhe cada episódio que você assistir</p>
        <p className="text-sm text-ink-soft">Porcentagem da maratona, “continue de onde parou” e conquistas. É grátis.</p>
        <div className="flex flex-wrap justify-center gap-2 pt-1 sm:justify-start">
          <Link
            href="/entrar?modo=criar"
            className="rounded-full bg-accent px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
          >
            Criar conta grátis
          </Link>
          <Link
            href={`/episodios/${first.slug}${first.youtubeId ? "#assistir" : ""}`}
            className="rounded-full border border-line px-5 py-3 text-sm font-bold transition hover:border-ink-soft"
          >
            Assistir o 1º episódio
          </Link>
        </div>
      </div>
    </div>
  );
}
