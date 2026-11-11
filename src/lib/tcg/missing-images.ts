/**
 * Imagens das cartas que a TCGdex ainda não tem em inglês.
 * Fonte: Pokémon TCG API (images.pokemontcg.io) e Scrydex (coleções novas, promos, kits e TCG Pocket).
 * Associação feita carta a carta por número e nome (veja o histórico do repositório).
 *
 * Formato: coleção TCGdex -> [coleção na Pokémon TCG API, host, números diferentes, cartas sem imagem]
 *   host "p" = images.pokemontcg.io/<set>/<numero>.png
 *   host "s" = images.scrydex.com/pokemon/<set>-<codigo>/small
 */
type Entry = [set: string, host: "p" | "s", renumber?: Record<string, string>, missing?: string[]];

const H = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`H0${i + 1}`, `H${i + 1}`]));

const SETS: Record<string, Entry> = {
  bog: ["bp", "p"],
  ecard2: ["ecard2", "p", { "50b": "50", "74a": "74", "95a": "95", "103b": "103", ...H }, ["50a", "74b", "95b", "103a"]],
  ecard3: ["ecard3", "p", H],
  "tk-ex-latio": ["tk1b", "p"],
  "tk-ex-latia": ["tk1a", "p"],
  exu: ["ex10", "p", { "?": "A", "%3F": "A" }],
  "tk-ex-p": ["tk2a", "p"],
  "tk-ex-m": ["tk2b", "p"],
  pop6: ["pop6", "p"],
  pl2: ["pl2", "p"],
  hgssp: ["hsp", "p"],
  bwp: ["bwp", "p", { BW04: "BW004", BW05: "BW005" }],
  "2011bw": ["mcd11", "p"],
  "2012bw": ["mcd12", "p"],
  xyp: ["xyp", "p"],
  "2014xy": ["mcd14", "p"],
  xy8: ["xy8", "p"],
  "2015xy": ["mcd15", "p"],
  "2016xy": ["mcd16", "p"],
  smp: ["smp", "s"],
  sm2: ["sm2", "p"],
  "2017sm": ["mcd17", "p"],
  "sm3.5": ["sm35", "p"],
  sm6: ["sm6", "p"],
  "sm7.5": ["sm75", "p"],
  "2018sm": ["mcd18", "p"],
  det1: ["det1", "p", {}, ["25"]],
  "2019sm": ["mcd19", "p"],
  "2021swsh": ["mcd21", "p"],
  "swsh4.5sv": ["swsh45sv", "p"],
  cel25: ["cel25", "p"],
  cel25cc: [
    "cel25c",
    "p",
    {
      CC001: "2", CC002: "4", CC003: "15", CC004: "73", CC005: "8", CC006: "15", CC007: "15", CC008: "24", CC009: "20",
      CC010: "66", CC011: "9", CC012: "86", CC013: "88", CC014: "93", CC015: "17", CC016: "15", CC017: "109", CC018: "145",
      CC019: "107", CC020: "113", CC021: "114", CC022: "54", CC023: "97", CC024: "76", CC025: "60",
    },
  ],
  swsh9tg: ["swsh9tg", "p"],
  swsh10tg: ["swsh10tg", "p"],
  "2022swsh": ["mcd22", "p"],
  swsh11tg: ["swsh11tg", "p"],
  swsh12tg: ["swsh12tg", "p"],
  "swsh12.5gg": ["swsh12pt5gg", "p"],
  sve: ["sve", "s"],
  svp: ["svp", "s", {}, ["500"]],
  swshp: ["swshp", "s"],
  // Kits de treinador (Scrydex numera tk3..tk10)
  "tk-dp-m": ["tk3a", "s"],
  "tk-dp-l": ["tk3b", "s"],
  "tk-hs-r": ["tk4a", "s"],
  "tk-hs-g": ["tk4b", "s"],
  "tk-bw-z": ["tk5a", "s"],
  "tk-bw-e": ["tk5b", "s"],
  "tk-sm-r": ["tk10b", "s"],
  "2023sv": ["mcd23", "s"],
  "2024sv": ["mcd24", "s"],
  mep: ["mep", "s", {}, ["Museum"]],
  mee: ["mee", "s"],
  // TCG Pocket
  "P-A": ["tcgp-PA", "s"],
  B1a: ["tcgp-B1a", "s"],
  B2a: ["tcgp-B2a", "s"],
  "30th-c": [
    "me55c",
    "s",
    {
      "001": "4", "002": "5", "003": "11", "004": "11g", "005": "18", "006": "19", "007": "25", "008": "33", "009": "41", "010": "43",
      "011": "47", "012": "50", "013": "57", "014": "58", "015": "69", "016": "85", "017": "89", "018": "94", "019": "99", "020": "100",
      "021": "101", "022": "106p", "023": "106m", "024": "106", "025": "108", "026": "114", "027": "123", "028": "138", "029": "149", "030": "203",
    },
  ],
  me06: ["me6", "s"],
};

/** Imagem (tamanho pequeno) de uma carta sem imagem na TCGdex, ou null se não tivermos. */
export function extraImage(setId: string, localId: string): string | null {
  const entry = SETS[setId];
  if (!entry) return null;
  const [set, host, renumber = {}, missing = []] = entry;
  if (missing.includes(localId)) return null;
  const number = renumber[localId] ?? localId.replace(/^0+(?=\w)/, "");
  return host === "p"
    ? `https://images.pokemontcg.io/${set}/${number}.png`
    : `https://images.scrydex.com/pokemon/${set}-${number}/small`;
}
