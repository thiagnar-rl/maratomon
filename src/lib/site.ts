export const siteConfig = {
  name: "Forja Arcana",
  description:
    "Forja Arcana — TCG e cultura nerd: anime Pokémon dublado em ordem, cartas com preços no Brasil, mercado ao vivo e sua coleção.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contato@exemplo.com",
  disclaimer:
    "Forja Arcana é um projeto de fãs, independente e não oficial. Não tem ligação com Nintendo, Game Freak, Creatures ou The Pokémon Company. Pokémon e todos os nomes relacionados são marcas registradas de seus respectivos donos. Imagens de Pokémon e cartas vêm de PokeAPI e TCGdex. Não hospedamos episódios nem jogos.",
};
