"use client";

import { useEffect, useMemo, useState } from "react";
import { computeAchievements, streaks, type Achievement } from "@/lib/achievements";
import { useProgress } from "@/lib/progress/hooks";
import { artwork } from "@/lib/pokemon";
import { useCollectionData } from "@/lib/collection-store";
import { tcgAchievementsFrom, useTcgAchievements } from "./collection/tcg-achievements";

const GROUPS: [Achievement["group"], string][] = [
  ["episodios", "Episódios"],
  ["sequencia", "Sequência de dias"],
  ["temporadas", "Temporadas completas"],
  ["series", "Séries completas"],
  ["colecao", "Coleção TCG"],
];

/** Hook com as conquistas e a sequência de dias da pessoa logada. */
export function useAchievements() {
  const { watched, days } = useProgress();
  const list = useMemo(() => computeAchievements(watched, days), [watched, days]);
  const streak = useMemo(() => streaks(days), [days]);
  return { list, streak, unlocked: list.filter((a) => a.unlocked).length };
}

function Medal({ a }: { a: Achievement }) {
  return (
    <li
      className={`group relative overflow-hidden rounded-3xl border p-4 transition ${
        a.unlocked ? "border-accent-2/60 bg-gradient-to-br from-accent-2/20 via-surface to-surface shadow-[0_10px_30px_-15px_var(--accent-2)]" : "border-line bg-surface"
      }`}
      title={a.description}
    >
      <div className="flex items-center gap-3">
        <span
          className={`relative grid size-14 shrink-0 place-items-center rounded-2xl text-3xl ${a.unlocked ? "bg-accent-2/25" : "bg-surface-2 grayscale"}`}
          aria-hidden="true"
        >
          {a.mon ? <img src={artwork(a.mon.id)} alt="" loading="lazy" className={`size-12 object-contain ${a.unlocked ? "" : "opacity-30"}`} /> : <span className={a.unlocked ? "" : "opacity-30"}>{a.icon}</span>}
          {!a.unlocked && <span className="absolute -bottom-1 -right-1 text-sm">🔒</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-bold ${a.unlocked ? "" : "text-ink-soft"}`}>{a.title}</span>
          <span className="block text-xs text-ink-soft">{a.description}</span>
        </span>
      </div>
      {!a.unlocked && (
        <div className="mt-3 space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.round(a.progress * 100)}%` }} />
          </div>
          <p className="text-right text-[11px] font-semibold tabular-nums text-ink-soft">{a.progressText}</p>
        </div>
      )}
    </li>
  );
}

/** Painel de conquistas e sequência (página Minha jornada). */
export function AchievementsPanel() {
  const anime = useAchievements();
  const tcg = useTcgAchievements(true);
  const { streak } = anime;
  const list = useMemo(() => [...anime.list, ...tcg.list], [anime.list, tcg.list]);
  const unlocked = list.filter((a) => a.unlocked).length;
  const [group, setGroup] = useState<Achievement["group"]>(() =>
    typeof window !== "undefined" && new URLSearchParams(location.search).get("aba") === "colecao" ? "colecao" : "episodios",
  );
  const shown = list.filter((a) => a.group === group);

  return (
    <section id="conquistas" aria-labelledby="conquistas-t" className="scroll-mt-40 space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-[#ff7a2f]/25 via-surface to-surface p-6">
          <p className="text-sm font-bold text-ink-soft">Sequência de dias</p>
          <p className="font-display text-6xl font-extrabold tabular-nums">
            🔥 {streak.current}
            <span className="ml-2 text-xl font-bold text-ink-soft">{streak.current === 1 ? "dia" : "dias"}</span>
          </p>
          <p className="text-sm text-ink-soft">
            {streak.watchedToday
              ? "Você já assistiu hoje. Volte amanhã para continuar!"
              : streak.current > 0
                ? "Assista a um episódio hoje para não perder a sequência."
                : "Assista a um episódio hoje para começar uma sequência."}{" "}
            Recorde: <strong className="text-ink">{streak.best}</strong> {streak.best === 1 ? "dia" : "dias"}.
          </p>
        </div>
        <div className="rounded-[2rem] border border-line bg-surface p-6">
          <p className="text-sm font-bold text-ink-soft">Conquistas</p>
          <p className="font-display text-6xl font-extrabold tabular-nums">
            {unlocked}
            <span className="text-xl font-bold text-ink-soft">/{list.length}</span>
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2" style={{ width: `${(unlocked / list.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="conquistas-t" className="font-display text-3xl font-extrabold">🏅 Conquistas</h2>
        <div className="flex flex-wrap gap-1.5 rounded-full bg-surface-2 p-1" role="tablist">
          {GROUPS.map(([g, label]) => {
            const n = list.filter((a) => a.group === g);
            return (
              <button
                key={g}
                role="tab"
                aria-selected={group === g}
                onClick={() => setGroup(g)}
                className="rounded-full px-3.5 py-1.5 text-sm font-bold transition aria-selected:bg-accent aria-selected:text-white"
              >
                {label} <span className="opacity-70">{n.filter((a) => a.unlocked).length}/{n.length}</span>
              </button>
            );
          })}
        </div>
      </div>
      {group === "colecao" && !tcg.list.length && <p className="text-ink-soft">Carregando sua coleção…</p>}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((a) => (
          <Medal key={a.id} a={a} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Aviso de conquista nova: aparece no canto quando a pessoa desbloqueia algo enquanto usa o site.
 * Na primeira vez (ou em outro aparelho), só registra o que já tinha, sem uma chuva de avisos.
 */
export function AchievementToaster() {
  const { ready, loggedIn, status, email } = useProgress();
  const { list } = useAchievements();
  // A coleção só entra se já estiver carregada (não busca a coleção em toda página).
  const collection = useCollectionData(false);
  const tcgList = useMemo(() => (collection.status === "ready" && collection.pricesReady ? tcgAchievementsFrom(collection) : null), [collection]);
  const [toast, setToast] = useState<Achievement | null>(null);

  useEffect(() => {
    if (!ready || !loggedIn || status === "syncing" || !email) return;
    const groups: [string, Achievement[] | null][] = [
      [`maratomon:conquistas:${email}`, list],
      [`forja:conquistas-tcg:${email}`, tcgList],
    ];
    let fresh: Achievement | undefined;
    for (const [key, items] of groups) {
      if (!items) continue;
      const unlockedIds = items.filter((a) => a.unlocked).map((a) => a.id);
      let seen: string[] | null = null;
      try {
        seen = JSON.parse(localStorage.getItem(key) ?? "null") as string[] | null;
        localStorage.setItem(key, JSON.stringify([...new Set([...(seen ?? []), ...unlockedIds])]));
      } catch {
        continue;
      }
      if (!seen) continue; // primeira vez: só registra, sem chuva de avisos
      fresh ??= items.find((a) => a.unlocked && !seen!.includes(a.id));
    }
    if (!fresh) return;
    const found = fresh;
    const show = setTimeout(() => setToast(found), 0);
    const hide = setTimeout(() => setToast(null), 6000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [list, tcgList, ready, loggedIn, status, email]);

  if (!toast) return null;
  return (
    <div role="status" className="fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-sm items-center gap-3 rounded-3xl border border-accent-2/60 bg-surface p-4 shadow-2xl sm:bottom-6 sm:left-auto sm:right-6">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-2/25 text-2xl">
        {toast.mon ? <img src={artwork(toast.mon.id)} alt="" className="size-10 object-contain" /> : toast.icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-black uppercase tracking-wider text-accent">Conquista desbloqueada!</span>
        <span className="block truncate font-bold">{toast.title}</span>
      </span>
      <a href={`/minha-jornada${toast.group === "colecao" ? "?aba=colecao" : ""}#conquistas`} className="ml-auto shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-white">
        Ver
      </a>
    </div>
  );
}
