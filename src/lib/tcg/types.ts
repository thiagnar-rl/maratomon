/** Tipos da API TCGdex (https://tcgdex.dev), só com os campos que o site usa. */

export type CardCount = { total: number; official: number };

export type SetBrief = {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount: CardCount;
};

export type SerieDetail = {
  id: string;
  name: string;
  logo?: string;
  releaseDate?: string;
  sets: SetBrief[];
};

export type CardBrief = { id: string; localId: string; name: string; image?: string };

export type SetDetail = SetBrief & {
  releaseDate?: string;
  serie: { id: string; name: string };
  legal?: { standard: boolean; expanded: boolean };
  cards: CardBrief[];
};

export type TcgplayerVariant = {
  lowPrice?: number | null;
  midPrice?: number | null;
  highPrice?: number | null;
  marketPrice?: number | null;
  directLowPrice?: number | null;
};

export type Pricing = {
  cardmarket?: {
    updated: string;
    unit: "EUR";
    avg?: number | null;
    low?: number | null;
    trend?: number | null;
    avg1?: number | null;
    avg7?: number | null;
    avg30?: number | null;
  } | null;
  tcgplayer?: ({ updated: string; unit: "USD" } & Record<string, TcgplayerVariant | string>) | null;
};

export type CardDetail = CardBrief & {
  category: string;
  illustrator?: string;
  rarity?: string;
  hp?: number;
  types?: string[];
  stage?: string;
  description?: string;
  set: SetBrief;
  attacks?: { name: string; cost?: string[]; damage?: number | string; effect?: string }[];
  abilities?: { name: string; type: string; effect: string }[];
  weaknesses?: { type: string; value: string }[];
  retreat?: number;
  legal?: { standard: boolean; expanded: boolean };
  pricing?: Pricing;
  updated?: string;
};

export type Rates = { USD: number; EUR: number; updated: string; fallback: boolean };
