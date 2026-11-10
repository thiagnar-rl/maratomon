/**
 * Imagens de Pokémon.
 *
 * As artes oficiais vêm do repositório público da PokeAPI (hotlink, não copiamos para o projeto).
 * ⚠️ São obras protegidas por direitos autorais da The Pokémon Company/Nintendo/Game Freak/Creatures.
 *    Para monetizar o site, troque por artes próprias ou licenciadas (ver LEGAL.md).
 */
const ARTWORK_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";
const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export const artwork = (dexId: number) => `${ARTWORK_BASE}/${dexId}.png`;
export const sprite = (dexId: number) => `${SPRITE_BASE}/${dexId}.png`;

export type Mon = { id: number; name: string };

/** Pokémon marcantes de cada temporada do anime (2 por temporada). */
export const seasonMons: Record<number, [Mon, Mon]> = {
  1: [{ id: 25, name: "Pikachu" }, { id: 6, name: "Charizard" }],
  2: [{ id: 131, name: "Lapras" }, { id: 149, name: "Dragonite" }],
  3: [{ id: 158, name: "Totodile" }, { id: 155, name: "Cyndaquil" }],
  4: [{ id: 214, name: "Heracross" }, { id: 164, name: "Noctowl" }],
  5: [{ id: 245, name: "Suicune" }, { id: 246, name: "Larvitar" }],
  6: [{ id: 252, name: "Treecko" }, { id: 255, name: "Torchic" }],
  7: [{ id: 341, name: "Corphish" }, { id: 256, name: "Combusken" }],
  8: [{ id: 383, name: "Groudon" }, { id: 382, name: "Kyogre" }],
  9: [{ id: 254, name: "Sceptile" }, { id: 378, name: "Regice" }],
  10: [{ id: 387, name: "Turtwig" }, { id: 393, name: "Piplup" }],
  11: [{ id: 391, name: "Monferno" }, { id: 427, name: "Buneary" }],
  12: [{ id: 483, name: "Dialga" }, { id: 484, name: "Palkia" }],
  13: [{ id: 392, name: "Infernape" }, { id: 443, name: "Gible" }],
  14: [{ id: 495, name: "Snivy" }, { id: 501, name: "Oshawott" }],
  15: [{ id: 643, name: "Reshiram" }, { id: 644, name: "Zekrom" }],
  16: [{ id: 648, name: "Meloetta" }, { id: 646, name: "Kyurem" }],
  17: [{ id: 656, name: "Froakie" }, { id: 653, name: "Fennekin" }],
  18: [{ id: 658, name: "Greninja" }, { id: 701, name: "Hawlucha" }],
  19: [{ id: 718, name: "Zygarde" }, { id: 658, name: "Greninja" }],
  20: [{ id: 722, name: "Rowlet" }, { id: 725, name: "Litten" }],
  21: [{ id: 791, name: "Solgaleo" }, { id: 792, name: "Lunala" }],
  22: [{ id: 800, name: "Necrozma" }, { id: 727, name: "Incineroar" }],
  23: [{ id: 810, name: "Grookey" }, { id: 813, name: "Scorbunny" }],
  24: [{ id: 890, name: "Eternatus" }, { id: 94, name: "Gengar" }],
  25: [{ id: 448, name: "Lucario" }, { id: 149, name: "Dragonite" }],
  26: [{ id: 906, name: "Sprigatito" }, { id: 909, name: "Fuecoco" }],
  27: [{ id: 1024, name: "Terapagos" }, { id: 384, name: "Rayquaza" }],
  28: [{ id: 908, name: "Meowscarada" }, { id: 910, name: "Crocalor" }],
};

/** Pokémon que estampa cada série (era) do anime. */
export const eraMons: Record<number, Mon> = {
  0: { id: 25, name: "Pikachu" },
  1: { id: 384, name: "Rayquaza" },
  2: { id: 483, name: "Dialga" },
  3: { id: 643, name: "Reshiram" },
  4: { id: 658, name: "Greninja" },
  5: { id: 791, name: "Solgaleo" },
  6: { id: 448, name: "Lucario" },
  7: { id: 1024, name: "Terapagos" },
};

/** Cores dos tipos, usadas em selos e destaques. */
export const typeColors: Record<string, string> = {
  Fire: "#f08030",
  Water: "#6890f0",
  Grass: "#78c850",
  Lightning: "#f8d030",
  Psychic: "#f85888",
  Fighting: "#c03028",
  Darkness: "#705848",
  Metal: "#b8b8d0",
  Fairy: "#ee99ac",
  Dragon: "#7038f8",
  Colorless: "#a8a878",
};
