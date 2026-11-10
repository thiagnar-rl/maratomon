"use client";

import { useSyncExternalStore } from "react";

/** Lista de cartas no comparador (até 4), salva no navegador. */
const KEY = "maratomon:compare:v1";
export const MAX_COMPARE = 4;

let ids: string[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    ids = JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    ids = [];
  }
}

function save(next: string[]) {
  ids = next.slice(0, MAX_COMPARE);
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // sem armazenamento: segue só em memória
  }
  listeners.forEach((l) => l());
}

export const addToCompare = (id: string) => {
  load();
  if (!ids.includes(id)) save([...ids, id].slice(-MAX_COMPARE));
};
export const removeFromCompare = (id: string) => {
  load();
  save(ids.filter((x) => x !== id));
};
export const setCompare = (next: string[]) => save(next);

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const snapshot = () => {
  load();
  return ids;
};
const empty: string[] = [];

export const useCompareIds = () => useSyncExternalStore(subscribe, snapshot, () => empty);
