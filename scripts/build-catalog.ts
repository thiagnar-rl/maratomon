/**
 * Gera src/data/catalog.json a partir dos arquivos em data/source/.
 *
 *   data/source/episodes.json       títulos (PT-BR oficial quando existe + EN oficial), por temporada
 *   data/source/providers.json      onde assistir, por faixa de temporadas
 *   data/source/youtube-links.json  vídeo oficial de cada episódio (gerado por scripts/sync-youtube.ts)
 *
 * Rode com: npm run catalog
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Catalog, Episode, Provider, Season } from "../src/lib/catalog-types";

type RawSeason = {
  n: number;
  pt: string;
  en: string;
  region: string;
  era: string;
  eps: [pt: string, en: string][];
};

type ProvidersFile = {
  youtubeChannel: { name: string; url: string };
  seasons: Record<string, Provider[]>;
};

const root = join(__dirname, "..");
const read = <T>(file: string): T => JSON.parse(readFileSync(join(root, file), "utf8")) as T;

const rawSeasons = read<RawSeason[]>("data/source/episodes.json");
const providers = read<ProvidersFile>("data/source/providers.json");
/** Canal Pokémon TV: vídeos com várias dublagens (o player embutido abre no áudio original). */
const youtubeLinks = read<Record<string, string>>("data/source/youtube-links.json");
/** Canal oficial brasileiro: áudio só em português, tem prioridade. */
const youtubePt = read<Record<string, string>>("data/source/youtube-links-pt.json");

/** Episódios que nunca receberam dublagem brasileira ficam fora do catálogo. */
const NOT_DUBBED = new Set<string>([]);

const ERA_ORDER = [
  "Série Original",
  "Rubi e Safira",
  "Diamante e Pérola",
  "Preto e Branco",
  "XY",
  "Sol e Lua",
  "Jornadas",
  "Horizontes",
];

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

const pad = (n: number) => String(n).padStart(2, "0");

function providersFor(season: number): Provider[] {
  return Object.entries(providers.seasons).flatMap(([range, list]) => {
    const [from, to = from] = range.split("-").map(Number);
    return season >= from && season <= to ? list : [];
  });
}

let overall = 0;
const seasons: Season[] = rawSeasons.map((raw) => {
  const episodes: Episode[] = [];
  raw.eps.forEach(([pt, en], index) => {
    const number = index + 1;
    const key = `${raw.n}-${number}`;
    if (NOT_DUBBED.has(key)) return;
    overall += 1;
    const title = pt || en;
    episodes.push({
      key,
      season: raw.n,
      number,
      overall,
      title,
      titlePt: pt || null,
      titleEn: en || null,
      slug: `t${pad(raw.n)}e${pad(number)}-${slugify(title)}`,
      youtubeId: youtubePt[key] ?? youtubeLinks[key] ?? null,
      youtubeAudio: youtubePt[key] ? "pt" : youtubeLinks[key] ? "multi" : null,
    });
  });

  return {
    number: raw.n,
    slug: `temporada-${raw.n}`,
    title: raw.pt,
    titleEn: raw.en,
    region: raw.region,
    era: raw.era,
    eraIndex: ERA_ORDER.indexOf(raw.era),
    providers: providersFor(raw.n),
    episodes,
  };
});

const catalog: Catalog = {
  generatedAt: new Date().toISOString().slice(0, 10),
  youtubeChannel: providers.youtubeChannel,
  totalEpisodes: overall,
  seasons,
};

writeFileSync(join(root, "src/data/catalog.json"), JSON.stringify(catalog));
const linked = seasons.flatMap((s) => s.episodes).filter((e) => e.youtubeId).length;
console.log(`Catálogo: ${seasons.length} temporadas, ${overall} episódios dublados, ${linked} com vídeo oficial.`);
