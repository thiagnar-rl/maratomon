/** Tipos e cores das notícias (usados no servidor e no navegador). */
export type NewsCategory = "tcg" | "games" | "go" | "anime" | "competitivo" | "geral";

export type NewsItem = {
  id: string;
  title: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: string;
  category: NewsCategory;
  kind: "video" | "artigo";
  lang: "pt" | "en";
};

export const CATEGORY_LABEL: Record<NewsCategory, string> = {
  tcg: "TCG",
  games: "Games",
  go: "Pokémon GO",
  anime: "Anime",
  competitivo: "Competitivo",
  geral: "Novidades",
};

export const CATEGORY_COLOR: Record<NewsCategory, string> = {
  tcg: "#ffcb05",
  games: "#5b9bff",
  go: "#2fd6a4",
  anime: "#ff5c8a",
  competitivo: "#ff8a3d",
  geral: "#a98bff",
};

