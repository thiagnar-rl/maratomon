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
  resistances?: { type: string; value: string }[];
  retreat?: number;
  evolveFrom?: string;
  suffix?: string;
  dexId?: number[];
  regulationMark?: string;
  effect?: string;
  trainerType?: string;
  energyType?: string;
  item?: { name: string; effect: string };
  variants?: { normal?: boolean; reverse?: boolean; holo?: boolean; firstEdition?: boolean; wPromo?: boolean };
  variants_detailed?: { type: string; size?: string; thirdParty?: { cardmarket?: number; tcgplayer?: number; cardtrader?: number } }[];
  legal?: { standard: boolean; expanded: boolean };
  pricing?: Pricing;
  updated?: string;
};

export type Rates = {
  USD: number;
  EUR: number;
  updated: string;
  fallback: boolean;
  /** Variação do dia em % (AwesomeAPI), quando disponível. */
  USDchange?: number | null;
  EURchange?: number | null;
};

/** Preço do dia de uma carta, em dólar, euro e real, com oscilações. */
export type PriceSnapshot = {
  usd: number | null;
  eur: number | null;
  brl: number | null;
  /** % de variação: preço de ontem contra a média de 7 e 30 dias (Cardmarket). */
  change7d: number | null;
  change30d: number | null;
};

/** Dados extras para filtros nas grades (raridade, versões, ilustrador). */
export type CardMeta = { rarity: string | null; illustrator: string | null; variants: string[] };
export type PricedCard = PriceSnapshot & { meta?: CardMeta };
