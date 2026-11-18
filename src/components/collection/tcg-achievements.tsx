"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { computeTcgAchievements, readCounter, type Achievement } from "@/lib/achievements";
import { computeStats, useCollectionData, type CollectionData } from "@/lib/collection-store";

/** Medalhas da coleção de cartas, a partir dos dados já carregados. */
export function tcgAchievementsFrom(data: CollectionData): Achievement[] {
  const s = computeStats(data);
  return computeTcgAchievements({
    copies: s.copies,
    distinct: s.distinct,
    sets: s.sets.length,
    bestBase: Math.max(0, ...s.sets.map((p) => (p.set.official ? p.base / p.set.official : 0))),
    bestMaster: Math.max(0, ...s.sets.map((p) => (p.set.total ? p.master / p.set.total : 0))),
    value: data.pricesReady ? s.total : 0,
    languages: s.byLanguage.length,
    decks: data.collections.filter((c) => c.kind === "deck").length,
    folders: data.collections.filter((c) => c.kind === "pasta").length,
    alerts: s.alerts.length,
    alertsHit: s.alerts.filter((a) => a.hit).length,
    scanned: readCounter("scan"),
    imported: readCounter("import"),
  });
}

export function useTcgAchievements(enabled = true) {
  const data = useCollectionData(enabled);
  // contadores do aparelho só existem no navegador: recalcula depois de montar
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setTick(1), 0);
    return () => clearTimeout(t);
  }, []);
  const list = useMemo(() => (data.status === "ready" && tick ? tcgAchievementsFrom(data) : []), [data, tick]);
  return { list, ready: data.status === "ready" && data.pricesReady, data };
}

/** Faixa de conquistas no painel da coleção: quantas tem e as próximas a ganhar. */
export function TcgAchievementsStrip() {
  const { list } = useTcgAchievements();
  if (!list.length) return null;
  const unlocked = list.filter((a) => a.unlocked);
  const next = list.filter((a) => !a.unlocked).sort((a, b) => b.progress - a.progress).slice(0, 3);
  return (
    <section className="rounded-[1.75rem] border border-line bg-surface p-4 sm:p-5" aria-label="Conquistas da coleção">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-lg font-extrabold">
          🏅 Conquistas da coleção <span className="text-ink-soft">{unlocked.length}/{list.length}</span>
        </p>
        <Link href="/minha-jornada?aba=colecao#conquistas" className="text-sm font-bold text-accent">Ver todas →</Link>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {unlocked.slice(-6).reverse().map((a) => (
          <span key={a.id} title={`${a.title}: ${a.description}`} className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-300/40 to-amber-500/20 text-2xl ring-1 ring-amber-400/40">
            {a.icon}
          </span>
        ))}
        {next.map((a) => (
          <span key={a.id} className="flex min-w-48 shrink-0 items-center gap-2 rounded-2xl bg-surface-2 px-3 py-2">
            <span className="text-xl opacity-50 grayscale">{a.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold">{a.title}</span>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-line">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${a.progress * 100}%` }} />
              </span>
            </span>
            <span className="text-[10px] font-bold tabular-nums text-ink-soft">{a.progressText}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
