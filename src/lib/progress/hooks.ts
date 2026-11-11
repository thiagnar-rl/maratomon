"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getAllEpisodes, type Episode } from "@/lib/catalog";
import { getServerSnapshot, getSnapshot, subscribe } from "./store";

export { closeAccountPrompt, openAccountPrompt, setWatched, toggleWatched } from "./store";

export function useProgress() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Quantos episódios de uma lista já foram assistidos. */
export function useWatchedCount(episodes: Episode[]) {
  const { watched } = useProgress();
  return useMemo(() => episodes.reduce((n, e) => n + (watched.has(e.key) ? 1 : 0), 0), [episodes, watched]);
}

const EPISODE_KEY = /^\d+-\d+$/;

/** Quantos episódios do anime já foram assistidos (sem contar filmes e jogos). */
export function useEpisodesWatched() {
  const { watched } = useProgress();
  return useMemo(() => [...watched].filter((key) => EPISODE_KEY.test(key)).length, [watched]);
}

/** Primeiro episódio ainda não assistido, na ordem de lançamento. */
export function useNextEpisode(): Episode | undefined {
  const { watched } = useProgress();
  return useMemo(() => getAllEpisodes().find((e) => !watched.has(e.key)), [watched]);
}
