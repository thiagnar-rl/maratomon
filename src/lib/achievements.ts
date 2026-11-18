import { catalog, getEras } from "@/lib/catalog";
import { eraMons, seasonMons, type Mon } from "@/lib/pokemon";
import { localDay } from "@/lib/progress/store";

/** Conquistas da maratona do anime: episódios, temporadas, séries completas e sequência de dias. */
export type Achievement = {
  id: string;
  group: "episodios" | "temporadas" | "series" | "sequencia";
  title: string;
  description: string;
  icon: string;
  mon?: Mon;
  unlocked: boolean;
  /** Progresso até desbloquear (0 a 1). */
  progress: number;
  progressText: string;
};

const EPISODE_GOALS: [number, string, string][] = [
  [1, "Primeiro passo", "🥚"],
  [10, "Treinador iniciante", "🎒"],
  [50, "Pegando o ritmo", "🔥"],
  [100, "Centenário", "💯"],
  [250, "Maratonista", "🏃"],
  [500, "Veterano das rotas", "🗺️"],
  [1000, "Lenda viva", "👑"],
];
const STREAK_GOALS: [number, string, string][] = [
  [3, "3 dias seguidos", "✨"],
  [7, "Uma semana sem parar", "⚡"],
  [30, "Um mês de maratona", "🌟"],
];

/** Sequência de dias: atual (termina hoje ou ontem) e a maior já feita. */
export function streaks(days: ReadonlySet<string>, today = new Date()) {
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of sorted) {
    const date = new Date(`${d}T12:00:00`);
    run = prev && Math.round((date.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }
  // Sequência atual: conta para trás a partir de hoje (ou de ontem, para não "quebrar" antes do dia acabar).
  const cursor = new Date(today);
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let current = 0;
  while (days.has(localDay(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, best, watchedToday: days.has(localDay(today)) };
}

export function computeAchievements(watched: ReadonlySet<string>, days: ReadonlySet<string>): Achievement[] {
  const seen = catalog.seasons.reduce((n, s) => n + s.episodes.filter((e) => watched.has(e.key)).length, 0);
  const { best } = streaks(days);
  const list: Achievement[] = [];

  for (const [goal, title, icon] of EPISODE_GOALS) {
    list.push({
      id: `ep-${goal}`,
      group: "episodios",
      title,
      description: goal === 1 ? "Assista ao primeiro episódio." : `Assista a ${goal} episódios.`,
      icon,
      unlocked: seen >= goal,
      progress: Math.min(1, seen / goal),
      progressText: `${Math.min(seen, goal)}/${goal}`,
    });
  }
  list.push({
    id: "ep-todos",
    group: "episodios",
    title: "Mestre Pokémon",
    description: `Assista a todos os ${catalog.totalEpisodes} episódios.`,
    icon: "🏆",
    unlocked: seen >= catalog.totalEpisodes,
    progress: seen / catalog.totalEpisodes,
    progressText: `${seen}/${catalog.totalEpisodes}`,
  });

  for (const [goal, title, icon] of STREAK_GOALS) {
    list.push({
      id: `seq-${goal}`,
      group: "sequencia",
      title,
      description: `Assista em ${goal} dias seguidos.`,
      icon,
      unlocked: best >= goal,
      progress: Math.min(1, best / goal),
      progressText: `${Math.min(best, goal)}/${goal} dias`,
    });
  }

  for (const season of catalog.seasons) {
    const done = season.episodes.filter((e) => watched.has(e.key)).length;
    list.push({
      id: `temp-${season.number}`,
      group: "temporadas",
      title: season.title,
      description: `Complete a temporada ${season.number} (${season.region}).`,
      icon: "🎖️",
      mon: seasonMons[season.number]?.[0],
      unlocked: done === season.episodes.length,
      progress: done / season.episodes.length,
      progressText: `${done}/${season.episodes.length}`,
    });
  }

  for (const era of getEras()) {
    const eps = era.seasons.flatMap((s) => s.episodes);
    const done = eps.filter((e) => watched.has(e.key)).length;
    list.push({
      id: `serie-${era.index}`,
      group: "series",
      title: era.name,
      description: `Complete a série inteira (${era.seasons.length} temporadas).`,
      icon: "🏅",
      mon: eraMons[era.index],
      unlocked: done === eps.length,
      progress: done / eps.length,
      progressText: `${done}/${eps.length}`,
    });
  }
  return list;
}
