import "server-only";
import { getSet } from "./api";
import type { BrPrice } from "./types";

/**
 * Preços do MYP Cards (https://mypcards.com), o maior marketplace de card games do Brasil.
 * Lê só páginas públicas permitidas no robots.txt deles (edições e páginas de produto), com cache de horas,
 * e sempre mostra a fonte com link para a oferta. Nada de busca, API interna ou contornar bloqueios.
 */

const BASE = "https://mypcards.com";
const HEADERS = { "User-Agent": "MaratomonTCG/1.0 (+https://maratomon.vercel.app)", Accept: "text/html" };
const SIX_HOURS = 60 * 60 * 6;
const ONE_DAY = 60 * 60 * 24;

async function page(path: string, revalidate: number): Promise<string | null> {
  try {
    const response = await fetch(`${BASE}${path}`, { headers: HEADERS, next: { revalidate } });
    if (!response.ok) return null;
    const html = await response.text();
    // Se um dia aparecer uma tela de verificação, simplesmente não usamos os dados.
    if (/Just a moment|cf-chl/i.test(html)) return null;
    return decode(html);
  } catch {
    return null;
  }
}

const ENTITIES: Record<string, string> = { nbsp: " ", middot: "·", ccedil: "ç", eacute: "é", aacute: "á", atilde: "ã", ecirc: "ê", oacute: "ó", iacute: "í", uacute: "ú", amp: "&", quot: '"' };

/** Troca entidades HTML (&eacute;, &#233;, &nbsp;…) pelos caracteres, para as buscas no texto funcionarem. */
const decode = (html: string) =>
  html
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);

/** "1.234,56" → 1234.56 */
const money = (text?: string | null) => (text ? Number(text.replace(/\./g, "").replace(",", ".")) || null : null);

/** Sigla da coleção (minúscula) → endereço da edição no MYP Cards. */
async function editions(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (let p = 1; p <= 15; p++) {
    const html = await page(`/pokemon/edicoes?page=${p}&per-page=48`, ONE_DAY);
    if (!html) break;
    const found = [...html.matchAll(/<a[^>]+href="(\/pokemon\/[a-z0-9-]+)"[^>]*>([\s\S]*?)<\/a>/g)]
      .map(([, href, inner]) => [href, inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()] as const)
      .filter(([, text]) => /\d{2}\/\d{2}\/\d{4}$/.test(text));
    if (found.length === 0) break;
    for (const [href, text] of found) {
      if (/japon|chin|corean|korean/i.test(text)) continue;
      const code = text.match(/\s(\S+)\s\d{2}\/\d{2}\/\d{4}$/)?.[1]?.toLowerCase();
      if (code && !map.has(code)) map.set(code, href);
    }
  }
  return map;
}

type ListItem = { sku: string; id: number; low: number | null; units: number | null };

/** Cartas mais procuradas de uma edição (a página lista as principais com o menor preço). */
async function editionItems(href: string): Promise<ListItem[]> {
  const html = await page(href, SIX_HOURS);
  if (!html) return [];
  return html
    .split('<li class="stream-item"')
    .slice(1)
    .map((chunk) => {
      const sku = chunk.match(/data-ga-item-id="(pokemon_[^"]+)"/)?.[1];
      const id = Number(chunk.match(/href="\/pokemon\/[a-z0-9-]+\/(\d+)\//)?.[1]);
      const text = chunk.replace(/<script[\s\S]*?<\/script>|<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      const low = money(text.match(/R\$ ([\d.]+,\d{2})/)?.[1]);
      const units = Number(text.match(/(\d+) un\b/)?.[1]);
      return sku && id ? { sku, id, low, units: Number.isFinite(units) ? units : null } : null;
    })
    .filter((x): x is ListItem => x !== null);
}

export type MypProduct = {
  url: string;
  sku: string;
  low: number | null;
  avg: number | null;
  max: number | null;
  lastSold: number | null;
  lastSoldNote: string | null;
  trend30d: number | null;
  offers: number | null;
};

async function product(id: number): Promise<MypProduct | null> {
  const html = await page(`/pokemon/produto/${id}`, SIX_HOURS);
  if (!html) return null;
  const sku = html.match(/"sku":\s*"([^"]+)"/)?.[1];
  const url = html.match(/"url":\s*"(https:\/\/mypcards\.com\/pokemon\/produto\/[^"]+)"/)?.[1] ?? `${BASE}/pokemon/produto/${id}`;
  if (!sku) return null;
  const box = (kind: string) => html.match(new RegExp(`resumo-preco--${kind}"[^>]*?title="([^"]*)"[\\s\\S]*?<span class="moeda">R\\$ ([\\d.]+,\\d{2})</span>`));
  const menor = box("menor");
  const ultimo = box("ultimo");
  const trend = html.match(/produto-tendencia--(alta|baixa)[^"]*"[^>]*title="Mediana (?:subiu|caiu) ([\d,]+)% em 30 dias/);
  // Ofertas listadas na página: o maior valor entre elas.
  const start = html.indexOf('id="produto-abas-painel-ofertas"');
  const end = html.indexOf('id="produto-abas-painel-historico"', start);
  const offersText = start > 0 ? html.slice(start, end > start ? end : start + 60000).replace(/<[^>]+>/g, " ") : "";
  const offerPrices = [...offersText.matchAll(/R\$ ([\d.]+,\d{2})/g)].map((m) => money(m[1])).filter((v): v is number => v != null && v > 0);
  return {
    url,
    sku,
    low: money(menor?.[2]),
    avg: money(menor?.[1].match(/m[ée]dio\s*R\$\s*([\d.]+,\d{2})/i)?.[1]),
    max: offerPrices.length ? Math.max(...offerPrices) : null,
    lastSold: money(ultimo?.[2]),
    lastSoldNote: ultimo?.[1].match(/\(([^)]+)\)/)?.[1] ?? null,
    trend30d: trend ? Number(trend[2].replace(",", ".")) * (trend[1] === "baixa" ? -1 : 1) : null,
    offers: Number(html.match(/Ofertas\s*(?:<[^>]+>\s*)*\((\d+)\)/)?.[1]) || null,
  };
}

const pad3 = (n: string | number) => String(n).padStart(3, "0");
const skuNumber = (sku: string) => Number(sku.match(/_(\d+)\/\d+$/)?.[1]);

type CardRef = { setId: string; localId: string };

/** SKU do MYP Cards para uma carta (ex.: pokemon_pfl_129/094), ou null se a coleção não estiver lá. */
async function locate(card: CardRef): Promise<{ sku: string; edition: string } | null> {
  if (!/^\d+$/.test(card.localId)) return null;
  const set = await getSet(card.setId);
  const code = set?.abbreviation?.official?.toLowerCase();
  if (!set || !code) return null;
  const edition = (await editions()).get(code);
  if (!edition) return null;
  return { sku: `pokemon_${code}_${pad3(card.localId)}/${pad3(set.cardCount.official)}`, edition };
}

/** Menor preço no Brasil para várias cartas (usa só as páginas das edições: 1 leitura por coleção). */
export async function brPrices(cards: (CardRef & { id: string })[]): Promise<Record<string, BrPrice>> {
  const out: Record<string, BrPrice> = {};
  const located = await Promise.all(cards.map(async (c) => ({ c, loc: await locate(c) })));
  const byEdition = new Map<string, Promise<ListItem[]>>();
  for (const { loc } of located) if (loc && !byEdition.has(loc.edition)) byEdition.set(loc.edition, editionItems(loc.edition));
  for (const { c, loc } of located) {
    if (!loc) continue;
    const item = (await byEdition.get(loc.edition)!).find((i) => i.sku === loc.sku);
    if (item?.low) out[c.id] = { low: item.low, units: item.units, url: `${BASE}/pokemon/produto/${item.id}` };
  }
  return out;
}

/** Ficha completa no MYP Cards para a página da carta (menor, médio, maior, último vendido e tendência). */
export async function mypProduct(card: CardRef): Promise<MypProduct | null> {
  const loc = await locate(card);
  if (!loc) return null;
  const items = await editionItems(loc.edition);
  const direct = items.find((i) => i.sku === loc.sku);
  if (direct) return product(direct.id);

  // Fora da lista principal: o código do produto costuma seguir a numeração da coleção.
  // Parte da carta listada mais próxima e confere o SKU (até 3 tentativas).
  const want = Number(card.localId);
  const anchors = items.filter((i) => Number.isFinite(skuNumber(i.sku)) && i.sku.split("_")[1] === loc.sku.split("_")[1]);
  if (anchors.length === 0) return null;
  const anchor = anchors.reduce((a, b) => (Math.abs(skuNumber(b.sku) - want) < Math.abs(skuNumber(a.sku) - want) ? b : a));
  let guess = anchor.id + (want - skuNumber(anchor.sku));
  for (let attempt = 0; attempt < 3; attempt++) {
    const p = await product(guess);
    if (!p) return null;
    if (p.sku === loc.sku) return p;
    const got = skuNumber(p.sku);
    if (!Number.isFinite(got) || got === want || !p.sku.startsWith(loc.sku.split("_").slice(0, 2).join("_"))) return null;
    guess += want - got;
  }
  return null;
}

/** Diagnóstico temporário. */
export async function mypDebug(card: CardRef) {
  const set = await getSet(card.setId);
  const eds = await editions();
  const loc = await locate(card);
  const items = loc ? await editionItems(loc.edition) : [];
  return { abbr: set?.abbreviation, official: set?.cardCount.official, editions: eds.size, sample: [...eds.entries()].slice(0, 3), loc, items: items.length, first: items.slice(0, 3) };
}
