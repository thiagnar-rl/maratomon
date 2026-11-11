/**
 * Capa de cada coleção. A TCGdex não tem logo de ~60 coleções (promos, kits de treinador,
 * McDonald's, galerias...). Para essas usamos, nesta ordem:
 *   1. o logo oficial publicado pela Pokémon TCG API (images.pokemontcg.io / scrydex);
 *   2. as cartas mais raras da coleção em leque (TCG Pocket);
 *   3. o logo da série com uma etiqueta (energias e promos);
 *   4. a arte do Pokémon que estrela a coleção (kits de treinador, promos antigas).
 */
import { artwork } from "@/lib/pokemon";

export type SetCover =
  | { type: "logo"; src: string }
  | { type: "cards"; srcs: string[] }
  | { type: "serie"; src: string; tag: string }
  | { type: "mon"; src: string; tag: string };

const PTCG = (id: string) => `https://images.pokemontcg.io/${id}/logo.png`;

const LOGOS: Record<string, string> = {
  // logos da TCGdex que estão quebrados (arquivo não existe)
  xy3: PTCG("xy3"),
  hgss3: PTCG("hgss3"),
  basep: PTCG("basep"),
  bog: PTCG("bp"),
  exu: PTCG("ex10"),
  "tk-ex-latio": PTCG("tk1b"),
  "tk-ex-latia": PTCG("tk1a"),
  "tk-ex-p": PTCG("tk2a"),
  "tk-ex-m": PTCG("tk2b"),
  "2011bw": PTCG("mcd11"),
  "2012bw": PTCG("mcd12"),
  "2014xy": PTCG("mcd14"),
  "2015xy": PTCG("mcd15"),
  "2016xy": PTCG("mcd16"),
  "2017sm": PTCG("mcd17"),
  "2018sm": PTCG("mcd18"),
  "2019sm": PTCG("mcd19"),
  "2021swsh": PTCG("mcd21"),
  "2022swsh": PTCG("mcd22"),
  "sm3.5": PTCG("sm35"),
  "sm7.5": PTCG("sm75"),
  sma: PTCG("sma"),
  "swsh4.5sv": PTCG("swsh45sv"),
  cel25cc: PTCG("cel25c"),
  swsh9tg: PTCG("swsh9tg"),
  swsh10tg: PTCG("swsh10tg"),
  swsh11tg: PTCG("swsh11tg"),
  swsh12tg: PTCG("swsh12tg"),
  "swsh12.5gg": PTCG("swsh12pt5gg"),
  sve: PTCG("sve"),
  svp: PTCG("svp"),
  sv05: PTCG("sv5"),
  "30th": "https://images.scrydex.com/pokemon/me55-logo/logo",
  "30th-c": "https://images.scrydex.com/pokemon/me55c-logo/logo",
  me06: "https://images.scrydex.com/pokemon/me6-logo/logo",
};

const CARD_FAN: Record<string, string[]> = {
  A3a: ["A3a/101", "A3a/102", "A3a/103"],
  A3b: ["A3b/105", "A3b/106", "A3b/107"],
  B1a: ["B1a/101", "B1a/102", "B1a/103"],
};

const SERIE_LOGO = {
  me: "https://assets.tcgdex.net/en/me/me01/logo.webp",
} as const;

const SERIE_TAG: Record<string, { serie: keyof typeof SERIE_LOGO; tag: string }> = {
  mee: { serie: "me", tag: "Energias" },
  mep: { serie: "me", tag: "Promos" },
};

/** Pokémon que estrela a coleção + etiqueta. */
const MONS: Record<string, [number, string]> = {
  miscp: [25, "Promos"],
  wp: [150, "Promos W"],
  jumbo: [143, "Cartas gigantes"],
  sp: [133, "Amostras"],
  "ex5.5": [384, "Poké Card Creator"],
  "tk-dp-l": [448, "Kit de Treinador"],
  "tk-dp-m": [490, "Kit de Treinador"],
  "tk-hs-r": [26, "Kit de Treinador"],
  "tk-hs-g": [130, "Kit de Treinador"],
  "tk-bw-z": [571, "Kit de Treinador"],
  "tk-bw-e": [530, "Kit de Treinador"],
  rc: [151, "Coleção Radiante"],
  xya: [716, "Alternativas"],
  "tk-xy-sy": [700, "Kit de Treinador"],
  "tk-xy-n": [715, "Kit de Treinador"],
  "tk-xy-b": [625, "Kit de Treinador"],
  "tk-xy-w": [40, "Kit de Treinador"],
  "tk-xy-latio": [381, "Kit de Treinador"],
  "tk-xy-latia": [380, "Kit de Treinador"],
  "tk-xy-su": [245, "Kit de Treinador"],
  "tk-xy-p": [25, "Kit de Treinador"],
  "tk-sm-l": [745, "Kit de Treinador"],
  "tk-sm-r": [10100, "Kit de Treinador"],
  "2023sv": [25, "McDonald's"],
  "2024sv": [25, "McDonald's"],
  mfb: [25, "Minha Primeira Batalha"],
  B2a: [906, "TCG Pocket"],
};

export function setCover(set: { id: string; logo?: string }): SetCover | null {
  if (LOGOS[set.id]) return { type: "logo", src: LOGOS[set.id] };
  if (set.logo) return { type: "logo", src: `${set.logo}.webp` };
  if (CARD_FAN[set.id]) return { type: "cards", srcs: CARD_FAN[set.id].map((c) => `https://assets.tcgdex.net/en/tcgp/${c}/low.webp`) };
  const serie = SERIE_TAG[set.id];
  if (serie) return { type: "serie", src: SERIE_LOGO[serie.serie], tag: serie.tag };
  const mon = MONS[set.id];
  if (mon) return { type: "mon", src: artwork(mon[0]), tag: mon[1] };
  return null;
}
