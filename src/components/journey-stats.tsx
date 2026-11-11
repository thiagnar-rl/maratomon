"use client";

import Link from "next/link";
import { catalog, eraColor, getEras } from "@/lib/catalog";
import { useEpisodesWatched, useProgress } from "@/lib/progress/hooks";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ProgressRing } from "./progress-ring";

/** Duração média de um episódio, em minutos (sem aberturas e encerramentos). */
const MINUTES_PER_EPISODE = 22;

const statusText = {
  anonimo: "Entre na sua conta para registrar seu progresso.",
  syncing: "Sincronizando com sua conta…",
  synced: "Sincronizado com sua conta",
  error: "Não foi possível sincronizar agora. Tente de novo em instantes.",
} as const;

export function JourneyStats() {
  const { watched, status, email, ready, loggedIn } = useProgress();
  const episodesSeen = useEpisodesWatched();
  const seasonsDone = catalog.seasons.filter((s) => s.episodes.every((e) => watched.has(e.key))).length;
  const hours = Math.round((episodesSeen * MINUTES_PER_EPISODE) / 60);
  const hoursLeft = Math.round(((catalog.totalEpisodes - episodesSeen) * MINUTES_PER_EPISODE) / 60);

  if (ready && !loggedIn && isSupabaseConfigured) {
    return (
      <section className="relative overflow-hidden rounded-[2rem] border border-line bg-surface p-8 text-center">
        <div aria-hidden="true" className="pointer-events-none mx-auto grid max-w-3xl select-none grid-cols-2 gap-4 opacity-40 blur-[3px] sm:grid-cols-4">
          {["Episódios", "Temporadas", "Horas", "Conquistas"].map((label, i) => (
            <div key={label} className="rounded-3xl border border-line bg-surface-2 p-5">
              <p className="text-sm font-semibold">{label}</p>
              <p className="font-display text-4xl font-extrabold">{[128, "4/28", "47h", 6][i]}</p>
            </div>
          ))}
        </div>
        <div className="relative mt-6 space-y-3">
          <p className="text-4xl">🔒</p>
          <h2 className="font-display text-3xl font-extrabold">Sua jornada fica salva na sua conta</h2>
          <p className="mx-auto max-w-md text-ink-soft">
            Crie uma conta grátis para marcar episódios, ver estatísticas da maratona e continuar de onde parou em qualquer aparelho.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Link href="/entrar?modo=criar&voltar=/minha-jornada" className="rounded-full bg-accent px-6 py-3 font-bold text-white shadow-lg">
              Criar conta grátis
            </Link>
            <Link href="/entrar?voltar=/minha-jornada" className="rounded-full border border-line px-6 py-3 font-bold">
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Episódios assistidos", value: episodesSeen.toLocaleString("pt-BR") },
          { label: "Temporadas completas", value: `${seasonsDone}/${catalog.seasons.length}` },
          { label: "Horas de maratona", value: `${hours}h` },
          { label: "Faltam aproximadamente", value: `${hoursLeft}h` },
        ].map((tile) => (
          <div key={tile.label} className="rounded-3xl border border-line bg-surface p-5">
            <p className="text-sm font-semibold text-ink-soft">{tile.label}</p>
            <p className="font-display text-4xl font-extrabold tabular-nums">{tile.value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold">Por série</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {getEras().map((era) => {
            const episodes = era.seasons.flatMap((s) => s.episodes);
            const seen = episodes.filter((e) => watched.has(e.key)).length;
            return (
              <div key={era.name} className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4">
                <ProgressRing value={seen} total={episodes.length} size={64} stroke={7} color={eraColor(era.index)}>
                  <span className="text-xs font-bold tabular-nums">{Math.round((seen / episodes.length) * 100)}%</span>
                </ProgressRing>
                <div>
                  <p className="font-semibold leading-tight">{era.name}</p>
                  <p className="text-xs text-ink-soft tabular-nums">{seen}/{episodes.length}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-surface-2 p-5 text-sm">
        <p className="font-semibold">{statusText[status]}</p>
        {isSupabaseConfigured ? (
          <p className="text-ink-soft">
            {email ? <>Conectado como {email}. </> : null}
            <Link href="/entrar" className="font-semibold text-ink underline">
              {email ? "Gerenciar conta" : "Entrar para salvar na nuvem"}
            </Link>
          </p>
        ) : (
          <p className="text-ink-soft">O login ainda não foi configurado neste site.</p>
        )}
      </section>
    </div>
  );
}
