import type { Mon } from "@/lib/pokemon";

export type Movie = {
  key: string;
  number: number;
  title: string;
  year: number;
  /** Onde estava disponível no Brasil segundo o Omelete (maio de 2026). Catálogos mudam: o link do JustWatch mostra o atual. */
  whereToWatch: string;
  mon: Mon;
  kind?: "animação" | "live-action" | "especial";
};

const raw: Omit<Movie, "key" | "number">[] = [
  { title: "Pokémon: O Filme – Mewtwo Contra-Ataca", year: 1998, whereToWatch: "Claro TV+, Globoplay e canal Telecine", mon: { id: 150, name: "Mewtwo" } },
  { title: "Pokémon: O Filme 2000 – O Poder de Um", year: 1999, whereToWatch: "Claro TV+ e canal Telecine", mon: { id: 249, name: "Lugia" } },
  { title: "Pokémon 3: O Feitiço dos Unown", year: 2000, whereToWatch: "Apple TV (aluguel ou compra)", mon: { id: 244, name: "Entei" } },
  { title: "Pokémon 4: Viajantes do Tempo – Celebi, a Voz da Floresta", year: 2001, whereToWatch: "Apple TV (aluguel ou compra)", mon: { id: 251, name: "Celebi" } },
  { title: "Heróis Pokémon: Latios e Latias", year: 2002, whereToWatch: "Indisponível em streaming", mon: { id: 380, name: "Latias" } },
  { title: "Pokémon 6: Jirachi – Realizador de Desejos", year: 2003, whereToWatch: "Apple TV (aluguel ou compra)", mon: { id: 385, name: "Jirachi" } },
  { title: "Pokémon 7: Alma Gêmea", year: 2004, whereToWatch: "Apple TV (aluguel ou compra)", mon: { id: 386, name: "Deoxys" } },
  { title: "Pokémon: Lucario e o Mistério de Mew", year: 2005, whereToWatch: "Canal Telecine (Prime Video e Globoplay)", mon: { id: 448, name: "Lucario" } },
  { title: "Pokémon Ranger e o Lendário Templo do Mar", year: 2006, whereToWatch: "Apple TV (aluguel ou compra)", mon: { id: 490, name: "Manaphy" } },
  { title: "Pokémon: O Pesadelo de Darkrai", year: 2007, whereToWatch: "Apple TV (aluguel ou compra)", mon: { id: 491, name: "Darkrai" } },
  { title: "Pokémon: Giratina e o Cavaleiro do Céu", year: 2008, whereToWatch: "Canal Telecine (Prime Video e Globoplay)", mon: { id: 487, name: "Giratina" } },
  { title: "Pokémon: Arceus e a Joia da Vida", year: 2009, whereToWatch: "Claro TV+ e canal Telecine", mon: { id: 493, name: "Arceus" } },
  { title: "Pokémon: Zoroark – Mestre das Ilusões", year: 2010, whereToWatch: "Claro TV+ e canal Telecine", mon: { id: 571, name: "Zoroark" } },
  { title: "Pokémon O Filme: Preto – Victini e Reshiram", year: 2011, whereToWatch: "Apple TV (aluguel ou compra)", mon: { id: 643, name: "Reshiram" } },
  { title: "Pokémon O Filme: Branco – Victini e Zekrom", year: 2011, whereToWatch: "Apple TV (aluguel ou compra)", mon: { id: 644, name: "Zekrom" } },
  { title: "Pokémon O Filme: Kyurem Contra a Espada da Justiça", year: 2012, whereToWatch: "Apple TV (aluguel ou compra)", mon: { id: 647, name: "Keldeo" } },
  { title: "Pokémon O Filme: Genesect e a Lenda Revelada", year: 2013, whereToWatch: "Apple TV (aluguel ou compra)", mon: { id: 649, name: "Genesect" } },
  { title: "Pokémon O Filme: Diancie e o Casulo da Destruição", year: 2014, whereToWatch: "Apple TV (aluguel ou compra)", mon: { id: 719, name: "Diancie" } },
  { title: "Pokémon O Filme: Hoopa e o Duelo Lendário", year: 2015, whereToWatch: "Canal Telecine (Prime Video e Globoplay)", mon: { id: 720, name: "Hoopa" } },
  { title: "Pokémon O Filme: Volcanion e a Maravilha Mecânica", year: 2016, whereToWatch: "Claro TV+ e canal Telecine", mon: { id: 721, name: "Volcanion" } },
  { title: "Pokémon O Filme: Eu Escolho Você!", year: 2017, whereToWatch: "Apple TV (aluguel ou compra)", mon: { id: 250, name: "Ho-Oh" } },
  { title: "Pokémon O Filme: O Poder de Todos", year: 2018, whereToWatch: "Apple TV (aluguel ou compra)", mon: { id: 807, name: "Zeraora" } },
  { title: "Pokémon, O Filme: Mewtwo Contra-Ataca – Evolução", year: 2019, whereToWatch: "Netflix", mon: { id: 150, name: "Mewtwo" } },
  { title: "Pokémon: Detetive Pikachu", year: 2019, whereToWatch: "Netflix, HBO Max, Claro TV+ e Universal+", mon: { id: 25, name: "Pikachu" }, kind: "live-action" },
  { title: "Pokémon o Filme: Segredos da Selva", year: 2020, whereToWatch: "Netflix", mon: { id: 893, name: "Zarude" } },
  { title: "Pokémon: As Crônicas de Arceus", year: 2022, whereToWatch: "Netflix", mon: { id: 493, name: "Arceus" }, kind: "especial" },
];

export const movies: Movie[] = raw.map((movie, i) => ({ ...movie, key: `f-${i + 1}`, number: i + 1 }));

/** Busca do JustWatch Brasil: mostra onde o filme está disponível hoje. */
export const justWatchUrl = (title: string) => `https://www.justwatch.com/br/busca?q=${encodeURIComponent(title)}`;
