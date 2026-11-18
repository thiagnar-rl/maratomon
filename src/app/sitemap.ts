import type { MetadataRoute } from "next";
import { getAllEpisodes, getSeasons } from "@/lib/catalog";
import { siteConfig } from "@/lib/site";
import { dexList } from "@/lib/pokedex";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const dex = await dexList();
  return [
    { url: base, priority: 1 },
    { url: `${base}/temporadas`, priority: 0.9 },
    { url: `${base}/noticias`, priority: 0.9, changeFrequency: "hourly" },
    { url: `${base}/tcg`, priority: 0.9 },
    { url: `${base}/tcg/comparar`, priority: 0.6 },
    { url: `${base}/pokemon`, priority: 0.8 },
    ...dex.map((p) => ({ url: `${base}/pokemon/${p.slug}`, priority: 0.6 })),
    ...getSeasons().map((s) => ({ url: `${base}/temporadas/${s.number}`, priority: 0.8 })),
    ...getAllEpisodes().map((e) => ({ url: `${base}/episodios/${e.slug}`, priority: 0.5 })),
    { url: `${base}/sobre` },
  ];
}
