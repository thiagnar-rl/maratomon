"use client";

import { useProgress } from "@/lib/progress/hooks";
import { ProgressRing } from "./progress-ring";

/** Anel com quantos itens de uma lista (filmes, jogos) já foram marcados. */
export function CollectionProgress({ keys, label }: { keys: string[]; label: string }) {
  const { watched } = useProgress();
  const done = keys.filter((k) => watched.has(k)).length;
  return (
    <div className="relative flex items-center gap-3">
      <ProgressRing value={done} total={keys.length} size={96} stroke={9} color="var(--accent-2)" trackColor="rgb(255 255 255 / 0.2)" label={`${done} de ${keys.length} ${label}`}>
        <span className="font-display text-xl font-extrabold tabular-nums">
          {done}
          <span className="text-xs opacity-70">/{keys.length}</span>
        </span>
      </ProgressRing>
      <span className="text-sm font-semibold opacity-85">{label}</span>
    </div>
  );
}
