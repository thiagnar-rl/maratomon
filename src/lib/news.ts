import "server-only";
import { XMLParser } from "fast-xml-parser";

/**
 * Notícias do mundo Pokémon, só de fontes oficiais.
 * Mostramos título, imagem de capa, data e o link para a fonte original
 * (nunca copiamos o texto das matérias). Atualiza sozinho a cada hora (ISR).
 */

import { type NewsCategory, type NewsItem } from "./news-types";
export * from "./news-types";

type Source = {
  name: string;
  url: string;
  kind: NewsItem["kind"];
  lang: NewsItem["lang"];
  category: NewsCategory;
};

const yt = (channelId: string) => `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

/** Fontes oficiais (The Pokémon Company, Niantic, Play! Pokémon). */
export const SOURCES: Source[] = [
  { name: "Pokémon Brasil", url: yt("UCuo1V_VlMUOTjy89D1FDVDw"), kind: "video", lang: "pt", category: "geral" },
  { name: "Pokémon.com Brasil", url: "https://www.pokemon.com/br/noticias-pokemon/rss", kind: "artigo", lang: "pt", category: "geral" },
  { name: "Pokémon.com", url: "https://www.pokemon.com/us/pokemon-news/rss", kind: "artigo", lang: "en", category: "geral" },
  { name: "Pokémon (canal oficial)", url: yt("UCFctpiB_Hnlk3ejWfHqSm6Q"), kind: "video", lang: "en", category: "geral" },
  { name: "Pokémon GO", url: yt("UCA698bls2pjQyiqP9N-iaeg"), kind: "video", lang: "en", category: "go" },
  { name: "Play! Pokémon", url: yt("UCimuIKQp7_Wlk9lcoSgtaFA"), kind: "video", lang: "en", category: "competitivo" },
  { name: "Pokémon UNITE", url: yt("UCGjyNCAcnOu96fcJUWeQ9SA"), kind: "video", lang: "en", category: "games" },
  { name: "Pokémon TV", url: yt("UC8wrbl5viYtQmRUgdFdf4ew"), kind: "video", lang: "en", category: "anime" },
];

/** Palavras que puxam a categoria, independente da fonte. Ordem importa: a primeira que bater vence. */
const RULES: [NewsCategory, RegExp][] = [
  ["tcg", /\b(tcg|estampas ilustradas|trading card|card game|cartas?|booster|expans[aã]o|expansion|elite trainer|deck|baralho|pocket)\b/i],
  ["go", /pok[eé]mon go|\bgo fest|community day|dia comunit[aá]rio|reide|raid hour|go tour|go battle/i],
  ["competitivo", /championships?|campeonato|mundial|\b(laic|naic|euic|ocic)\b|internacional|\bvgc\b|play! pok[eé]mon/i],
  ["anime", /\banime\b|epis[oó]dio|episode|horizons|horizontes|\bfilme\b|\bmovie\b|pok[eé]toon|animated|animad[oa]|netflix|the series|a s[eé]rie|official clip/i],
  ["games", /scarlet|violet|escarlate|legends|z-a|switch|nintendo|\bjogo\b|\bgame\b|unite|sleep|pok[eé]mon home|champions|pokopia|masters ex|caf[eé] remix|snap|mystery dungeon/i],
];

function classify(title: string, fallback: NewsCategory): NewsCategory {
  for (const [category, re] of RULES) if (re.test(title)) return category;
  return fallback;
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@", textNodeName: "#text" });

const text = (v: unknown): string => {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object" && "#text" in (v as Record<string, unknown>)) return String((v as Record<string, unknown>)["#text"]);
  return "";
};
const asArray = <T,>(v: T | T[] | undefined): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

function firstImage(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export function parseFeed(xml: string, source: Source): NewsItem[] {
  const doc = parser.parse(xml) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const items: NewsItem[] = [];

  // Atom (YouTube)
  for (const entry of asArray(doc.feed?.entry)) {
    const videoId = text(entry["yt:videoId"]);
    const link = asArray(entry.link).find((l: Record<string, string>) => l["@rel"] === "alternate")?.["@href"] ?? asArray(entry.link)[0]?.["@href"];
    // Shorts só do canal brasileiro (é onde sai a maior parte das novidades em português).
    if (!link || (/\/shorts\//.test(link) && source.lang !== "pt")) continue;
    const title = decode(text(entry.title));
    items.push({
      id: videoId || link,
      title,
      url: link,
      image: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null,
      publishedAt: new Date(text(entry.published) || text(entry.updated)).toISOString(),
      source: source.name,
      category: classify(title, source.category),
      kind: source.kind,
      lang: source.lang,
    });
  }

  // RSS 2.0
  for (const item of asArray(doc.rss?.channel?.item)) {
    const link = decode(text(item.link));
    const title = decode(text(item.title));
    if (!link || !title) continue;
    const media = asArray(item["media:content"])[0] ?? asArray(item["media:thumbnail"])[0];
    const enclosure = asArray(item.enclosure)[0];
    const image =
      media?.["@url"] ??
      (enclosure?.["@type"]?.startsWith("image") ? enclosure["@url"] : null) ??
      firstImage(text(item["content:encoded"]) || text(item.description));
    const date = new Date(text(item.pubDate) || text(item["dc:date"]) || Date.now());
    items.push({
      id: link,
      title,
      url: link,
      image: image ? decode(image) : null,
      publishedAt: (isNaN(date.getTime()) ? new Date() : date).toISOString(),
      source: source.name,
      category: classify(title, source.category),
      kind: source.kind,
      lang: source.lang,
    });
  }

  return items;
}

export type SourceStatus = { name: string; ok: boolean; items: number; error?: string };

async function fetchSource(source: Source): Promise<{ items: NewsItem[]; status: SourceStatus }> {
  try {
    const response = await fetch(source.url, {
      next: { revalidate: 3600 },
      headers: { "user-agent": "MaratomonBot/1.0 (+https://maratomon.vercel.app)", accept: "application/rss+xml, application/atom+xml, text/xml" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const items = parseFeed(await response.text(), source);
    return { items, status: { name: source.name, ok: items.length > 0, items: items.length } };
  } catch (e) {
    return { items: [], status: { name: source.name, ok: false, items: 0, error: e instanceof Error ? e.message : "erro" } };
  }
}

/** Junta todas as fontes, remove repetidos e ordena do mais novo para o mais antigo. */
export async function getNews(limit = 60): Promise<{ items: NewsItem[]; sources: SourceStatus[]; updatedAt: string }> {
  const results = await Promise.all(SOURCES.map(fetchSource));
  const seen = new Set<string>();
  const items = results
    .flatMap((r) => r.items)
    .filter((item) => {
      const key = item.title.toLowerCase();
      if (seen.has(item.id) || seen.has(key)) return false;
      seen.add(item.id);
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
  return { items, sources: results.map((r) => r.status), updatedAt: new Date().toISOString() };
}
