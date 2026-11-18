"use client";

import Link from "next/link";
import { catalog } from "@/lib/catalog";
import { useEpisodesWatched, useProgress } from "@/lib/progress/hooks";
import { isSupabaseConfigured } from "@/lib/supabase";
import { streaks } from "@/lib/achievements";
import { usePriceAlerts } from "@/lib/price-alerts";

/** Pílula com o progresso geral e acesso à conta. */
export function HeaderProgress() {
  const { ready, email, loggedIn, days } = useProgress();
  const streak = streaks(days).current;
  const alerts = usePriceAlerts(ready && loggedIn);
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
      {loggedIn && alerts.length > 0 && (
        <Link
          href="/colecao#alertas"
          className="relative grid size-9 place-items-center rounded-full border border-line bg-surface shadow-sm"
          aria-label={`${alerts.length} ${alerts.length === 1 ? "carta chegou" : "cartas chegaram"} no seu preço-alvo`}
          title="Cartas no seu preço-alvo"
        >
          🔔
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#ff5c8a] px-1 text-[10px] font-black text-white">{alerts.length}</span>
        </Link>
      )}
      {loggedIn && streak > 0 && (
        <Link
          href="/minha-jornada#conquistas"
          className="hidden items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1.5 text-sm font-bold tabular-nums shadow-sm sm:flex"
          title={`Sequência: ${streak} ${streak === 1 ? "dia" : "dias"} seguidos assistindo`}
        >
          🔥 {streak}
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
