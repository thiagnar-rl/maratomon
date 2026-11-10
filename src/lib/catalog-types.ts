export type Provider = {
  type: "youtube" | "netflix" | "prime" | "other";
  label: string;
  url: string;
  free: boolean;
};

export type Episode = {
  /** Chave estável usada no progresso do usuário: "temporada-episódio", ex. "1-25". */
  key: string;
  season: number;
  number: number;
  /** Posição na ordem geral de lançamento (só episódios dublados). */
  overall: number;
  title: string;
  titlePt: string | null;
  titleEn: string | null;
  slug: string;
  /** Vídeo oficial (dublado) no YouTube, quando existir. */
  youtubeId: string | null;
};

export type Season = {
  number: number;
  slug: string;
  title: string;
  titleEn: string;
  region: string;
  era: string;
  eraIndex: number;
  providers: Provider[];
  episodes: Episode[];
};

export type Catalog = {
  generatedAt: string;
  youtubeChannel: { name: string; url: string };
  totalEpisodes: number;
  seasons: Season[];
};
