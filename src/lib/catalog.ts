import data from "@/data/catalog.json";
import type { Catalog, Episode, Season } from "./catalog-types";

export type { Catalog, Episode, Season, Provider } from "./catalog-types";

export const catalog = data as Catalog;

const allEpisodes: Episode[] = catalog.seasons.flatMap((s) => s.episodes);
const episodesBySlug = new Map(allEpisodes.map((e) => [e.slug, e]));
const seasonsByNumber = new Map(catalog.seasons.map((s) => [s.number, s]));

export const getSeasons = (): Season[] => catalog.seasons;
export const getSeason = (number: number): Season | undefined => seasonsByNumber.get(number);
export const getAllEpisodes = (): Episode[] => allEpisodes;
export const getEpisode = (slug: string): Episode | undefined => episodesBySlug.get(slug);

/** Episódio anterior e seguinte na ordem geral de lançamento. */
export function getNeighbors(episode: Episode): { prev?: Episode; next?: Episode } {
  const i = episode.overall - 1;
  return { prev: allEpisodes[i - 1], next: allEpisodes[i + 1] };
}

/** Temporadas agrupadas por série (Série Original, Rubi e Safira…), na ordem de lançamento. */
export function getEras(): { name: string; index: number; seasons: Season[] }[] {
  const eras = new Map<string, { name: string; index: number; seasons: Season[] }>();
  for (const season of catalog.seasons) {
    const era = eras.get(season.era) ?? { name: season.era, index: season.eraIndex, seasons: [] };
    era.seasons.push(season);
    eras.set(season.era, era);
  }
  return [...eras.values()];
}

/** Cor de destaque de cada série (definidas em globals.css como --era-0 … --era-7). */
export const eraColor = (eraIndex: number) => `var(--era-${eraIndex})`;

export const pad2 = (n: number) => String(n).padStart(2, "0");
