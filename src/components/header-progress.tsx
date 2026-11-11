"use client";

import Link from "next/link";
import { catalog } from "@/lib/catalog";
import { useEpisodesWatched, useProgress } from "@/lib/progress/hooks";
import { isSupabaseConfigured } from "@/lib/supabase";

/** Pílula com o progresso geral e acesso à conta. */
export function HeaderProgress() {
  const { ready, email, loggedIn } = useProgress();
  const episodesSeen = useEpisodesWatched();
  const pct = Math.round((episodesSeen / catalog.totalEpisodes) * 100);

  return (
    <div className="flex items-center gap-2">
      {ready && !loggedIn && isSupabaseConfigured && (
        <Link
          href="/entrar?modo=criar"
          className="hidden rounded-full border border-accent/50 bg-accent/10 px-3 py-1.5 text-sm font-bold text-accent sm:inline-block"
        >
          Criar conta grátis
        </Link>
      )}
      {loggedIn && (
        <Link
          href="/minha-jornada"
          className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold tabular-nums shadow-sm"
          aria-label={`Progresso: ${episodesSeen} de ${catalog.totalEpisodes} episódios`}
        >
          <span className="relative h-2 w-16 overflow-hidden rounded-full bg-surface-2">
            <span className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </span>
          {ready ? `${pct}%` : "—"}
        </Link>
      )}
      {isSupabaseConfigured && (
        <Link
          href={email ? "/conta" : "/entrar"}
          className="rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-bg transition hover:opacity-85"
        >
          {email ? "Minha conta" : "Entrar"}
        </Link>
      )}
    </div>
  );
}
