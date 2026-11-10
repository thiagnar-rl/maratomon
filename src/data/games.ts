import type { Mon } from "@/lib/pokemon";

export type Platform = "Game Boy" | "Game Boy Color" | "Game Boy Advance";

export type Game = {
  key: string;
  title: string;
  year: number;
  platform: Platform;
  generation?: number;
  kind: "principal" | "remake" | "spin-off";
  region: string;
  mon: Mon;
  summary: string;
  /** Formas oficiais de jogar hoje (quando existem). */
  officialToday?: string;
  japanOnly?: boolean;
};

const list: Omit<Game, "key">[] = [
  { title: "Pokémon Red e Green", year: 1996, platform: "Game Boy", generation: 1, kind: "principal", region: "Kanto", mon: { id: 3, name: "Venusaur" }, summary: "Os originais japoneses que começaram tudo.", japanOnly: true },
  { title: "Pokémon Red e Blue", year: 1998, platform: "Game Boy", generation: 1, kind: "principal", region: "Kanto", mon: { id: 6, name: "Charizard" }, summary: "A versão ocidental da primeira geração: 151 Pokémon, 8 ginásios e a Equipe Rocket.", officialToday: "Relançados no Virtual Console do 3DS (loja encerrada em 2023)." },
  { title: "Pokémon Yellow", year: 1998, platform: "Game Boy", generation: 1, kind: "principal", region: "Kanto", mon: { id: 25, name: "Pikachu" }, summary: "Inspirado no anime: Pikachu te segue pelo mapa e você ganha os três iniciais.", officialToday: "Relançado no Virtual Console do 3DS (loja encerrada em 2023)." },
  { title: "Pokémon Pinball", year: 1999, platform: "Game Boy Color", kind: "spin-off", region: "Kanto", mon: { id: 25, name: "Pikachu" }, summary: "Fliperama com captura de Pokémon e cartucho com vibração (Rumble Pak)." },
  { title: "Pokémon Trading Card Game", year: 1998, platform: "Game Boy Color", kind: "spin-off", region: "Ilhas TCG", mon: { id: 150, name: "Mewtwo" }, summary: "O jogo de cartas em versão portátil, com as coleções Base, Jungle e Fossil.", officialToday: "Disponível no Nintendo Switch Online (Game Boy, plano básico)." },
  { title: "Pokémon Gold e Silver", year: 1999, platform: "Game Boy Color", generation: 2, kind: "principal", region: "Johto e Kanto", mon: { id: 250, name: "Ho-Oh" }, summary: "Dia e noite, criação de ovos, 100 Pokémon novos e duas regiões para explorar.", officialToday: "Relançados no Virtual Console do 3DS (loja encerrada em 2023)." },
  { title: "Pokémon Crystal", year: 2000, platform: "Game Boy Color", generation: 2, kind: "principal", region: "Johto e Kanto", mon: { id: 245, name: "Suicune" }, summary: "Primeira vez que dava para jogar com uma treinadora; história extra com Suicune.", officialToday: "Relançado no Virtual Console do 3DS (loja encerrada em 2023)." },
  { title: "Pokémon Puzzle Challenge", year: 2000, platform: "Game Boy Color", kind: "spin-off", region: "Johto", mon: { id: 152, name: "Chikorita" }, summary: "Quebra-cabeça no estilo Puzzle League com os personagens de Johto." },
  { title: "Pokémon Card GB2", year: 2001, platform: "Game Boy Color", kind: "spin-off", region: "Ilha GR", mon: { id: 151, name: "Mew" }, summary: "Continuação do jogo de cartas, com a Equipe GR.", japanOnly: true },
  { title: "Pokémon Ruby e Sapphire", year: 2002, platform: "Game Boy Advance", generation: 3, kind: "principal", region: "Hoenn", mon: { id: 383, name: "Groudon" }, summary: "Batalhas em dupla, habilidades, naturezas e os Concursos Pokémon." },
  { title: "Pokémon Pinball: Ruby & Sapphire", year: 2003, platform: "Game Boy Advance", kind: "spin-off", region: "Hoenn", mon: { id: 382, name: "Kyogre" }, summary: "Pinball com mesas de Ruby e Sapphire e mais de 200 Pokémon para capturar." },
  { title: "Pokémon FireRed e LeafGreen", year: 2004, platform: "Game Boy Advance", generation: 3, kind: "remake", region: "Kanto e Ilhas Sevii", mon: { id: 6, name: "Charizard" }, summary: "Remakes de Red e Green com gráficos novos e as Ilhas Sevii." },
  { title: "Pokémon Emerald", year: 2004, platform: "Game Boy Advance", generation: 3, kind: "principal", region: "Hoenn", mon: { id: 384, name: "Rayquaza" }, summary: "A versão definitiva de Hoenn, com a Battle Frontier." },
  { title: "Pokémon Mystery Dungeon: Red Rescue Team", year: 2005, platform: "Game Boy Advance", kind: "spin-off", region: "Mundo Pokémon", mon: { id: 258, name: "Mudkip" }, summary: "Você vira um Pokémon e explora masmorras aleatórias com uma equipe de resgate.", officialToday: "Disponível no Nintendo Switch Online + Pacote de Expansão (Game Boy Advance)." },
];

export const games: Game[] = list
  .sort((a, b) => a.year - b.year)
  .map((game) => ({ ...game, key: `g-${game.title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}` }));

/** Emuladores de código aberto e legais. Use apenas cópias de jogos que você possui. */
export const emulators = [
  { name: "mGBA", platforms: "GB, GBC, GBA", systems: "Windows, macOS, Linux, Switch (homebrew)", url: "https://mgba.io", note: "O mais preciso e fácil de usar para GBA." },
  { name: "SameBoy", platforms: "GB, GBC", systems: "Windows, macOS, Linux, navegador", url: "https://sameboy.github.io", note: "Altíssima precisão para Game Boy e Game Boy Color." },
  { name: "RetroArch", platforms: "Todos (via núcleos)", systems: "Windows, macOS, Linux, Android, iOS", url: "https://www.retroarch.com", note: "Central de emuladores com os núcleos mGBA e SameBoy." },
  { name: "Delta", platforms: "GB, GBC, GBA", systems: "iPhone e iPad (App Store)", url: "https://faultyapps.com/delta/", note: "Emulador oficial na App Store da Apple." },
] as const;

/** Aparelhos para copiar (fazer dump) dos seus próprios cartuchos e saves. */
export const dumpers = [
  { name: "GB Operator (Epilogue)", url: "https://www.epilogue.co", note: "Lê cartuchos de GB, GBC e GBA pelo USB e salva seus saves." },
  { name: "GBxCart RW (insideGadgets)", url: "https://www.gbxcart.com", note: "Leitor/gravador USB popular entre colecionadores." },
] as const;
