export const siteConfig = {
  name: "Maratomon TCG",
  description:
    "Guia de fãs de Pokémon: anime dublado em ordem, filmes, jogos clássicos, cartas do TCG com preços em reais e sua coleção pessoal.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contato@exemplo.com",
  disclaimer:
    "Maratomon TCG é um projeto de fãs, independente e não oficial. Não tem ligação com Nintendo, Game Freak, Creatures ou The Pokémon Company. Pokémon e todos os nomes relacionados são marcas registradas de seus respectivos donos. Imagens de Pokémon e cartas vêm de PokeAPI e TCGdex. Não hospedamos episódios nem jogos.",
};
