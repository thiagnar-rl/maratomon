"use client";

import { toggleWatched, useProgress } from "@/lib/progress/hooks";
import { WatchedCheckbox } from "./watched-checkbox";

export function EpisodeActions({ episodeKey, color }: { episodeKey: string; color: string }) {
  const { watched } = useProgress();
  const checked = watched.has(episodeKey);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 pr-5">
      <WatchedCheckbox checked={checked} onChange={() => toggleWatched(episodeKey)} label="Assistido" color={color} size="lg" />
      <div>
        <p className="font-semibold">{checked ? "Você já assistiu" : "Marcar como assistido"}</p>
        <p className="text-xs text-ink-soft">{checked ? "Toque para desmarcar" : "Conta no seu progresso"}</p>
      </div>
    </div>
  );
}
