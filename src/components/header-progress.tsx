"use client";

import Link from "next/link";
import { catalog } from "@/lib/catalog";
import { useProgress } from "@/lib/progress/hooks";
import { isSupabaseConfigured } from "@/lib/supabase";

/** Pílula com o progresso geral e acesso à conta. */
export function HeaderProgress() {
  const { watched, ready, email } = useProgress();
  const pct = Math.round((watched.size / catalog.totalEpisodes) * 100);

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/minha-jornada"
        className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold tabular-nums shadow-sm"
        aria-label={`Progresso: ${watched.size} de ${catalog.totalEpisodes} episódios`}
      >
        <span className="relative h-2 w-16 overflow-hidden rounded-full bg-surface-2">
          <span className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </span>
        {ready ? `${pct}%` : "—"}
      </Link>
      {isSupabaseConfigured && (
        <Link
          href="/entrar"
          className="rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-bg transition hover:opacity-85"
        >
          {email ? "Conta" : "Entrar"}
        </Link>
      )}
    </div>
  );
}
