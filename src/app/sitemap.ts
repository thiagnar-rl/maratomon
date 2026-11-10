import type { MetadataRoute } from "next";
import { getAllEpisodes, getSeasons } from "@/lib/catalog";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  return [
    { url: base, priority: 1 },
    { url: `${base}/temporadas`, priority: 0.9 },
    { url: `${base}/filmes`, priority: 0.8 },
    { url: `${base}/jogos`, priority: 0.8 },
    { url: `${base}/tcg`, priority: 0.9 },
    { url: `${base}/tcg/comparar`, priority: 0.6 },
    ...getSeasons().map((s) => ({ url: `${base}/temporadas/${s.number}`, priority: 0.8 })),
    ...getAllEpisodes().map((e) => ({ url: `${base}/episodios/${e.slug}`, priority: 0.5 })),
    { url: `${base}/sobre` },
  ];
}
