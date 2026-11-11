"use client";

import { toggleWatched, useProgress } from "@/lib/progress/hooks";
import { WatchedCheckbox } from "./watched-checkbox";

/** Checkbox ligado ao progresso (filmes, jogos…). Só conta com login; sem conta, abre o convite. */
export function CheckButton({ itemKey, label, color, doneText, todoText }: {
  itemKey: string;
  label: string;
  color?: string;
  doneText: string;
  todoText: string;
}) {
  const { watched } = useProgress();
  const checked = watched.has(itemKey);
  return (
    <span className="inline-flex items-center gap-2">
      <WatchedCheckbox checked={checked} onChange={() => toggleWatched(itemKey)} label={label} color={color} />
      <span className={`text-sm font-semibold ${checked ? "text-good" : "text-ink-soft"}`}>{checked ? doneText : todoText}</span>
    </span>
  );
}

