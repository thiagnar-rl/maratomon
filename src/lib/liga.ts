/**
 * Integração com a Liga Pokémon (ligapokemon.com.br), referência de preço do mercado brasileiro.
 *
 * A Liga não tem API pública e os termos dela proíbem reproduzir o conteúdo e os bancos de dados.
 * Por isso o Maratomon TCG só cria LINKS DIRETOS para as ferramentas da Liga (carta, histórico de preço,
 * decks, compra por lista…) e gera listas em texto para o usuário colar lá. Nenhum preço da Liga é copiado.
 */
const BASE = "https://www.ligapokemon.com.br/";

const url = (params: Record<string, string>) => `${BASE}?${new URLSearchParams(params).toString()}`;

const pad3 = (value: string | number) => {
  const text = String(value);
  return /^\d+$/.test(text) ? text.padStart(3, "0") : text;
};

/** Nome da carta no formato usado pela Liga: "Charizard ex (199/165)". */
export function ligaCardName(card: { name: string; localId: string; official?: number }) {
  return card.official ? `${card.name} (${pad3(card.localId)}/${pad3(card.official)})` : card.name;
}

/** O parâmetro "card" da Liga não tem espaço antes do parêntese: "Charizard ex(199/165)". */
const cardParam = (card: { name: string; localId: string; official?: number }) => ligaCardName(card).replace(" (", "(");

export const liga = {
  card: (card: { name: string; localId: string; official?: number }) => url({ view: "cards/card", card: cardParam(card) }),
  priceHistory: (card: { name: string; localId: string; official?: number }) => url({ view: "cards/pricehistory", card: cardParam(card) }),
  decksWithCard: (card: { name: string; localId: string; official?: number }) =>
    url({ view: "dks/decks", filtro_nome_deck: `card=${ligaCardName(card)}`, tipo: "3", vcm: "1" }),
  search: (name: string) => url({ view: "cards/search", card: name }),
  buyByList: () => url({ view: "cards/lista" }),
  trendingUp: () => url({ view: "cards/variacao", show: "alta" }),
  mostViewed: () => url({ view: "cards/hits" }),
  auctions: () => url({ view: "leilao/listar" }),
  bazaar: () => url({ view: "bzr/bazar" }),
  sealed: () => url({ view: "prod/home" }),
  sets: () => url({ view: "cards/edicoes" }),
  decks: () => url({ view: "dks/decks" }),
};

/** Lista no formato "quantidade nome (número/total)", uma carta por linha, para colar na Compra por Lista. */
export function buyListText(items: { quantity: number; name: string; localId: string; official?: number }[]) {
  return items.map((item) => `${item.quantity} ${ligaCardName(item)}`).join("\n");
}

/** Extrai número e total do id da TCGdex quando não temos o total ("sv03.5-199" → localId "199"). */
export const localIdFromCardId = (cardId: string) => cardId.split("-").pop() ?? cardId;
