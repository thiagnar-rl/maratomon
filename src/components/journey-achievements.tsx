"use client";

import { useProgress } from "@/lib/progress/hooks";
import { AchievementsPanel } from "./achievements";

/** Conquistas só aparecem para quem está na conta (sem conta, a página já mostra o convite). */
export function JourneyAchievements() {
  const { ready, loggedIn } = useProgress();
  if (!ready || !loggedIn) return null;
  return <AchievementsPanel />;
}
