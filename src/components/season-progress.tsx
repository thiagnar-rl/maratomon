"use client";

import type { Episode } from "@/lib/catalog";
import { useWatchedCount } from "@/lib/progress/hooks";
import { ProgressRing } from "./progress-ring";

export function SeasonProgress({ episodes }: { episodes: Episode[] }) {
  const seen = useWatchedCount(episodes);
  return (
    <ProgressRing value={seen} total={episodes.length} size={112} stroke={10} color="#ffffff" trackColor="rgb(255 255 255 / 0.25)" label={`${seen} de ${episodes.length} assistidos`}>
      <span className="font-display text-2xl font-extrabold tabular-nums">
        {seen}
        <span className="text-sm opacity-75">/{episodes.length}</span>
      </span>
    </ProgressRing>
  );
}
