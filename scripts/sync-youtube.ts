/**
 * Encontra o vídeo oficial (canal Pokémon TV) de cada episódio e grava em
 * data/source/youtube-links.json. Depois, `npm run catalog` atualiza o site.
 *
 * Uso:
 *   1. Crie uma chave da YouTube Data API v3 (gratuita) no Google Cloud Console.
 *   2. Coloque YOUTUBE_API_KEY=... no arquivo .env.local
 *   3. npm run sync:youtube
 *
 * Como funciona: lista todas as playlists do canal oficial, lê os vídeos de cada uma
 * e associa vídeo ↔ episódio comparando o título (em inglês ou português).
 * Só vídeos do canal oficial entram, nunca reuploads de terceiros.
 * Cota: cada página de 50 itens custa 1 unidade (o limite diário grátis é 10.000).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..");
const API = "https://www.googleapis.com/youtube/v3";
const CHANNEL_HANDLE = "@OfficialPokémonTV";

function loadEnv() {
  try {
    for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // sem .env.local: usa só as variáveis do sistema
  }
}

type RawSeason = { n: number; eps: [string, string][] };

/** Normaliza um título para comparação: sem acento, pontuação, caixa ou prefixos como "Pokémon: Indigo League | 12 |". */
export function normalize(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function api<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${API}/${path}`);
  Object.entries({ ...params, key: process.env.YOUTUBE_API_KEY! }).forEach(([k, v]) => url.searchParams.set(k, v));
  const response = await fetch(url);
  if (!response.ok) throw new Error(`YouTube API ${response.status}: ${await response.text()}`);
  return (await response.json()) as T;
}

type Page<T> = { items: T[]; nextPageToken?: string };

async function listAll<T>(path: string, params: Record<string, string>): Promise<T[]> {
  const items: T[] = [];
  let pageToken: string | undefined;
  do {
    const page = await api<Page<T>>(path, { ...params, maxResults: "50", ...(pageToken ? { pageToken } : {}) });
    items.push(...page.items);
    pageToken = page.nextPageToken;
  } while (pageToken);
  return items;
}

async function main() {
  loadEnv();
  if (!process.env.YOUTUBE_API_KEY) {
    console.error("Defina YOUTUBE_API_KEY no .env.local (veja o README).");
    process.exit(1);
  }

  const channels = await api<Page<{ id: string }>>("channels", { part: "id", forHandle: CHANNEL_HANDLE });
  const channelId = channels.items[0]?.id;
  if (!channelId) throw new Error(`Canal ${CHANNEL_HANDLE} não encontrado.`);

  const playlists = await listAll<{ id: string; snippet: { title: string } }>("playlists", { part: "snippet", channelId });
  console.log(`${playlists.length} playlists no canal oficial.`);

  // título normalizado -> id do vídeo (só vídeos publicados pelo próprio canal)
  const videos = new Map<string, string>();
  for (const playlist of playlists) {
    const items = await listAll<{ snippet: { title: string; videoOwnerChannelId?: string; resourceId: { videoId: string } } }>(
      "playlistItems",
      { part: "snippet", playlistId: playlist.id },
    );
    for (const { snippet } of items) {
      if (snippet.videoOwnerChannelId && snippet.videoOwnerChannelId !== channelId) continue;
      // Títulos costumam vir como "Nome do episódio | Pokémon: Temporada…": testamos cada parte.
      for (const part of snippet.title.split(/[|｜]/)) {
        const key = normalize(part);
        if (key.length > 3 && !videos.has(key)) videos.set(key, snippet.resourceId.videoId);
      }
    }
  }

  const seasons = JSON.parse(readFileSync(join(root, "data/source/episodes.json"), "utf8")) as RawSeason[];
  const links: Record<string, string> = {};
  for (const season of seasons) {
    season.eps.forEach(([pt, en], index) => {
      const id = (en && videos.get(normalize(en))) || (pt && videos.get(normalize(pt)));
      if (id) links[`${season.n}-${index + 1}`] = id;
    });
  }

  writeFileSync(join(root, "data/source/youtube-links.json"), JSON.stringify(links, null, 2) + "\n");
  console.log(`${Object.keys(links).length} episódios associados a vídeos oficiais. Agora rode: npm run catalog`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
