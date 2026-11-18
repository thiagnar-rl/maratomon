import { catalog, getEras } from "@/lib/catalog";
import { eraMons, seasonMons, type Mon } from "@/lib/pokemon";
import { localDay } from "@/lib/progress/store";

/** Conquistas da maratona do anime: episódios, temporadas, séries completas e sequência de dias. */
export type Achievement = {
  id: string;
  group: "episodios" | "temporadas" | "series" | "sequencia" | "colecao";
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

/* ============================ Coleção de cartas (TCG) ============================ */

/** Números da coleção usados nas medalhas de TCG (vêm de computeStats). */
export type TcgFacts = {
  copies: number;
  distinct: number;
  sets: number;
  bestBase: number;
  bestMaster: number;
  value: number;
  languages: number;
  decks: number;
  folders: number;
  alerts: number;
  alertsHit: number;
  scanned: number;
  imported: number;
};

const tiers = (facts: number, goals: [number, string, string, string][], prefix: string, unit: (n: number) => string): Achievement[] =>
  goals.map(([goal, title, icon, description]) => ({
    id: `${prefix}-${goal}`,
    group: "colecao",
    title,
    description,
    icon,
    unlocked: facts >= goal,
    progress: Math.min(1, facts / goal),
    progressText: `${unit(Math.min(facts, goal))}/${unit(goal)}`,
  }));

const n = (x: number) => x.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const pct = (x: number) => `${Math.round(x * 100)}%`;
const brl = (x: number) => `R$ ${n(x)}`;

export function computeTcgAchievements(f: TcgFacts): Achievement[] {
  return [
    ...tiers(f.copies, [
      [1, "Primeira carta", "🃏", "Adicione a primeira carta à coleção."],
      [10, "Mão cheia", "✋", "Tenha 10 cartas."],
      [50, "Pasta começando", "📒", "Tenha 50 cartas."],
      [100, "Colecionador", "🗂️", "Tenha 100 cartas."],
      [250, "Arquivo vivo", "📚", "Tenha 250 cartas."],
      [500, "Guardião das cartas", "🏛️", "Tenha 500 cartas."],
      [1000, "Lenda do fichário", "🐉", "Tenha 1.000 cartas."],
    ], "tcg-copias", n),
    ...tiers(f.distinct, [
      [25, "Variedade", "🎴", "Tenha 25 cartas diferentes."],
      [100, "Enciclopédia", "📖", "Tenha 100 cartas diferentes."],
      [300, "Pokédex de papel", "📕", "Tenha 300 cartas diferentes."],
    ], "tcg-diferentes", n),
    ...tiers(f.sets, [
      [3, "Explorador de coleções", "🧭", "Tenha cartas de 3 coleções."],
      [10, "Viajante das eras", "🗺️", "Tenha cartas de 10 coleções."],
      [25, "Historiador do TCG", "⏳", "Tenha cartas de 25 coleções."],
    ], "tcg-colecoes", n),
    ...tiers(f.bestBase, [
      [0.25, "Um quarto do caminho", "🥉", "Complete 25% da base de uma coleção."],
      [0.5, "Meio caminho", "🥈", "Complete 50% da base de uma coleção."],
      [0.75, "Quase lá", "🥇", "Complete 75% da base de uma coleção."],
      [1, "Coleção completa", "👑", "Tenha todas as cartas da base de uma coleção."],
    ], "tcg-base", pct),
    ...tiers(f.bestMaster, [[1, "Master set", "💎", "Tenha todas as cartas de uma coleção, inclusive as secretas."]], "tcg-master", pct),
    ...tiers(f.value, [
      [100, "Primeira centena", "💵", "Coleção valendo R$ 100."],
      [500, "Tesouro em formação", "💰", "Coleção valendo R$ 500."],
      [1000, "Cofre de cartas", "🏦", "Coleção valendo R$ 1.000."],
      [5000, "Investidor Pokémon", "📈", "Coleção valendo R$ 5.000."],
      [10000, "Magnata", "🏆", "Coleção valendo R$ 10.000."],
    ], "tcg-valor", brl),
    ...tiers(f.languages, [[2, "Poliglota", "🌎", "Tenha cartas em 2 idiomas."], [3, "Cidadão do mundo", "🗺️", "Tenha cartas em 3 idiomas."]], "tcg-idiomas", n),
    ...tiers(f.decks, [[1, "Pronto para a batalha", "⚔️", "Monte seu primeiro deck."]], "tcg-deck", n),
    ...tiers(f.alerts, [[1, "De olho no preço", "🔔", "Crie um alerta de preço."]], "tcg-alerta", n),
    ...tiers(f.alertsHit, [[1, "Caçador de ofertas", "🎯", "Uma carta chega no seu preço-alvo."]], "tcg-oferta", n),
    ...tiers(f.scanned, [[1, "Primeiro scan", "📷", "Escaneie uma carta com a câmera."], [50, "Scanner turbo", "⚡", "Escaneie 50 cartas."]], "tcg-scan", n),
    ...tiers(f.imported, [[1, "Mudança de casa", "📦", "Importe uma lista ou planilha de cartas."]], "tcg-importar", n),
  ];
}

/** Contadores guardados no aparelho (scan e importação). */
export function bumpCounter(key: "scan" | "import", by = 1) {
  try {
    const k = `forja:contador:${key}`;
    localStorage.setItem(k, String((Number(localStorage.getItem(k)) || 0) + by));
  } catch {
    // ignorado
  }
}
export function readCounter(key: "scan" | "import") {
  try {
    return Number(localStorage.getItem(`forja:contador:${key}`)) || 0;
  } catch {
    return 0;
  }
}
