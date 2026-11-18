import "server-only";
import { getAllEpisodes } from "@/lib/catalog";
import { searchCards } from "@/lib/tcg/api";
import { seasonMons } from "@/lib/pokemon";
import type { CardBrief } from "@/lib/tcg/types";
import type { Episode, Season } from "@/lib/catalog-types";
import { getSeasons } from "@/lib/catalog";

/** Pokédex do site: lista e página de cada Pokémon (PokeAPI + cartas da TCGdex + episódios do anime). */
const POKEAPI = "https://pokeapi.co/api/v2";
const WEEK = 60 * 60 * 24 * 7;

export const GENERATIONS: { n: number; label: string; region: string; from: number; to: number }[] = [
  { n: 1, label: "1ª geração", region: "Kanto", from: 1, to: 151 },
  { n: 2, label: "2ª geração", region: "Johto", from: 152, to: 251 },
  { n: 3, label: "3ª geração", region: "Hoenn", from: 252, to: 386 },
  { n: 4, label: "4ª geração", region: "Sinnoh", from: 387, to: 493 },
  { n: 5, label: "5ª geração", region: "Unova", from: 494, to: 649 },
  { n: 6, label: "6ª geração", region: "Kalos", from: 650, to: 721 },
  { n: 7, label: "7ª geração", region: "Alola", from: 722, to: 809 },
  { n: 8, label: "8ª geração", region: "Galar", from: 810, to: 905 },
  { n: 9, label: "9ª geração", region: "Paldea", from: 906, to: 1025 },
];

export const TYPE_PT: Record<string, string> = {
  normal: "Normal", fire: "Fogo", water: "Água", grass: "Planta", electric: "Elétrico", ice: "Gelo",
  fighting: "Lutador", poison: "Venenoso", ground: "Terrestre", flying: "Voador", psychic: "Psíquico",
  bug: "Inseto", rock: "Pedra", ghost: "Fantasma", dragon: "Dragão", dark: "Sombrio", steel: "Aço", fairy: "Fada",
};
export const TYPE_COLOR: Record<string, string> = {
  normal: "#a8a878", fire: "#f08030", water: "#6890f0", grass: "#78c850", electric: "#f8d030", ice: "#98d8d8",
  fighting: "#c03028", poison: "#a040a0", ground: "#e0c068", flying: "#a890f0", psychic: "#f85888",
  bug: "#a8b820", rock: "#b8a038", ghost: "#705898", dragon: "#7038f8", dark: "#705848", steel: "#b8b8d0", fairy: "#ee99ac",
};

export type DexEntry = { id: number; slug: string; name: string };

async function poke<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${POKEAPI}/${path}`, { next: { revalidate: WEEK } });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Nome bonito a partir do slug da PokeAPI (usado só se o nome oficial não vier). */
const prettify = (slug: string) => slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");

/** Todos os Pokémon (1 a 1025), do cache de 1 semana. */
export async function dexList(): Promise<DexEntry[]> {
  const data = await poke<{ results: { name: string; url: string }[] }>("pokemon-species?limit=1025");
  return (data?.results ?? []).map((r) => {
    const id = Number(r.url.match(/\/(\d+)\/?$/)?.[1]);
    return { id, slug: r.name, name: prettify(r.name) };
  });
}

export type DexDetail = {
  id: number;
  slug: string;
  name: string;
  genus: string | null;
  types: string[];
  height: number;
  weight: number;
  generation: (typeof GENERATIONS)[number] | undefined;
  legendary: boolean;
  mythical: boolean;
  flavor: string | null;
  prev: DexEntry | null;
  next: DexEntry | null;
};

type Species = {
  id: number;
  name: string;
  names: { name: string; language: { name: string } }[];
  genera: { genus: string; language: { name: string } }[];
  flavor_text_entries: { flavor_text: string; language: { name: string } }[];
  is_legendary: boolean;
  is_mythical: boolean;
};
type PokemonData = { height: number; weight: number; types: { type: { name: string } }[] };

export async function dexDetail(slugOrId: string): Promise<DexDetail | null> {
  const species = await poke<Species>(`pokemon-species/${encodeURIComponent(slugOrId.toLowerCase())}`);
  if (!species) return null;
  const mon = await poke<PokemonData>(`pokemon/${species.id}`);
  const list = await dexList();
  const index = list.findIndex((e) => e.id === species.id);
  const lang = <T extends { language: { name: string } }>(items: T[], ...langs: string[]) =>
    langs.map((l) => items.find((i) => i.language.name === l)).find(Boolean);
  const flavor = lang(species.flavor_text_entries, "pt-br", "pt", "en")?.flavor_text.replace(/[\f\n\r­]+/g, " ") ?? null;
  return {
    id: species.id,
    slug: species.name,
    name: lang(species.names, "en")?.name ?? prettify(species.name),
    genus: lang(species.genera, "en")?.genus ?? null,
    types: mon?.types.map((t) => t.type.name) ?? [],
    height: (mon?.height ?? 0) / 10,
    weight: (mon?.weight ?? 0) / 10,
    generation: GENERATIONS.find((g) => species.id >= g.from && species.id <= g.to),
    legendary: species.is_legendary,
    mythical: species.is_mythical,
    flavor,
    prev: index > 0 ? list[index - 1] : null,
    next: index >= 0 && index < list.length - 1 ? list[index + 1] : null,
  };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Cartas em que o Pokémon aparece (ex.: "Charizard ex", "Dark Charizard"), sem confundir Mew com Mewtwo. */
export async function dexCards(name: string): Promise<CardBrief[]> {
  const base = name.replace(/[♀♂]/g, "").trim();
  const cards = await searchCards(base, 400);
  const re = new RegExp(`(^|[\\s'’-])${escape(base)}($|[\\s-]|[♀♂])`, "i");
  return cards.filter((c) => re.test(c.name));
}

/** Temporadas em que ele é destaque e episódios com o nome dele no título. */
export function dexAnime(id: number, name: string): { seasons: Season[]; episodes: Episode[] } {
  const seasons = getSeasons().filter((s) => seasonMons[s.number]?.some((m) => m.id === id));
  const re = new RegExp(`(^|[^\\p{L}])${escape(name)}($|[^\\p{L}])`, "iu");
  const episodes = getAllEpisodes().filter((e) => re.test(e.titlePt ?? "") || re.test(e.titleEn ?? "") || re.test(e.title));
  return { seasons, episodes };
}
