import { parseLanguage, type Language } from "@/lib/tcg/card-ref";

/**
 * Leitura de PDFs de coleção em GRADE (cartas lado a lado, como os relatórios de apps de coleção):
 *   [Nome da coleção]            12/45 (27%)
 *   #96        TENHO      #5       TENHO
 *   NORMAL                [REV] REVERSE HOLO
 *   Tauros                Servine
 *   Common   R$ 0,13      Common   R$ 0,29
 *   Português             Português
 * Cada carta começa num selo "#número"; o que está abaixo dele, na mesma coluna, pertence à carta.
 * Funciona com qualquer quantidade de colunas e páginas, e com coleções que continuam na página seguinte.
 */
export type PdfItem = { str: string; x: number; y: number; w: number };

export type GridCard = {
  raw: string;
  number: string;
  total?: string;
  name?: string;
  setName?: string;
  language?: Language;
  variant?: string;
  quantity: number;
};

const ANCHOR = /^#\s*([A-Z]{0,4}\d{1,4}[a-z]?)(?:\s*\/\s*([A-Z]{0,4}\d{1,4}))?$/i;
const SECTION_COUNT = /^\d+\s*\/\s*\d+\s*\(\d+(?:[.,]\d+)?%\)$/;
const PRICE = /(R\$|US\$|€|\$)\s*[\d.,]+/i;
const LANG = /^(português|portugues|inglês|ingles|english|japonês|japones|japanese|espanhol|spanish|francês|frances|french|alemão|alemao|german|italiano|italian|coreano|korean|chinês|chines|chinese|pt|en|jp)$/i;
const STATUS = /^(tenho|falta|faltam|faltando|verificado|verified|owned|missing|have|want|quero|desejo|wishlist|novo)$/i;
const QTY = /^(?:x\s*(\d{1,3})|(\d{1,3})\s*x|qtd\.?:?\s*(\d{1,3})|quantidade:?\s*(\d{1,3}))$/i;
const RARITY =
  /^(common|uncommon|rare|rare holo|holo rare|double rare|ultra rare|illustration rare|special illustration rare|hyper rare|secret rare|shiny rare|shiny ultra rare|ace spec rare|mega hyper rare|mega attack rare|promo|black white rare|radiant rare|amazing rare|trainer gallery rare|rare rainbow|rare secret|rare ultra|rare holo v|rare holo vmax|rare holo vstar|rare holo ex|rare holo gx|rare shiny|classic collection|comum|incomum|rara|rara dupla|ultra rara|ilustração rara|ilustração rara especial|hiper rara|rara secreta|rara brilhante|promocional|none)$/i;
const VARIANT = /^(\[[^\]]+\]\s*)?(normal|holo|holofoil|holo foil|reverse|reverse holo|reverse holofoil|foil|non-?holo|1st edition|1ª edição|primeira edição|poké ?ball|master ball|energy reverse|cosmos holo|cracked ice|promo|stamped|unlimited|shadowless)(\s+.*)?$/i;

function variantOf(text: string): string | undefined {
  const t = text.replace(/\[[^\]]*\]/g, " ").trim();
  if (/^normal$/i.test(t) || /^non-?holo$/i.test(t)) return undefined;
  if (/reverse/i.test(t)) return "Reverse";
  if (/holo|foil/i.test(t)) return "Foil";
  if (/1st|1ª|primeira/i.test(t)) return "1ª edição";
  return t.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()).slice(0, 30) || undefined;
}

/** Junta pedaços na mesma altura (uma "linha") dentro de um conjunto de itens. */
function lines(items: PdfItem[]): string[] {
  const rows: PdfItem[][] = [];
  for (const it of [...items].sort((a, b) => b.y - a.y || a.x - b.x)) {
    const row = rows.find((r) => Math.abs(r[0].y - it.y) < 2.5);
    if (row) row.push(it);
    else rows.push([it]);
  }
  return rows.map((r) => r.sort((a, b) => a.x - b.x).map((i) => i.str.trim()).filter(Boolean).join(" ").trim()).filter(Boolean);
}

/** Lê as páginas; devolve null se o PDF não parece uma grade de cartas. */
export function parseGrid(pages: PdfItem[][]): GridCard[] | null {
  const anchorsTotal = pages.reduce((n, p) => n + p.filter((i) => ANCHOR.test(i.str.trim())).length, 0);
  if (anchorsTotal < 2) return null;
  const out: GridCard[] = [];
  let currentSet: string | undefined;

  for (const items of pages) {
    const clean = items.filter((i) => i.str.trim());
    // títulos de seção: "Nome da coleção" com "x/y (z%)" na mesma linha
    const sections = clean
      .filter((i) => SECTION_COUNT.test(i.str.trim()))
      .map((count) => {
        const sameLine = clean.filter((i) => i !== count && Math.abs(i.y - count.y) < 3 && i.x < count.x);
        return { y: count.y, name: sameLine.sort((a, b) => a.x - b.x).map((i) => i.str.trim()).join(" ").trim() };
      })
      .filter((s) => s.name)
      .sort((a, b) => b.y - a.y);
    const sectionItems = new Set(clean.filter((i) => sections.some((s) => Math.abs(i.y - s.y) < 3)));

    const anchors = clean.filter((i) => ANCHOR.test(i.str.trim())).sort((a, b) => b.y - a.y || a.x - b.x);
    if (!anchors.length) {
      if (sections.length) currentSet = sections[sections.length - 1].name;
      continue;
    }
    // o rodapé fica abaixo da última linha de cartas: corta no maior vão vertical depois dela
    const lowestAnchor = Math.min(...anchors.map((a) => a.y));
    const rowGap = (() => {
      const ys = [...new Set(anchors.map((a) => Math.round(a.y)))].sort((a, b) => b - a);
      return ys.length > 1 ? Math.min(...ys.slice(1).map((y, i) => ys[i] - y)) : Infinity;
    })();
    const floor = Number.isFinite(rowGap) ? lowestAnchor - rowGap : -Infinity;

    for (const a of anchors) {
      const sameRow = anchors.filter((b) => Math.abs(b.y - a.y) < 4);
      const right = Math.min(...sameRow.filter((b) => b.x > a.x + 4).map((b) => b.x), Infinity);
      const below = anchors.filter((b) => b.y < a.y - 4 && Math.abs(b.x - a.x) < 12);
      const sectionBelow = sections.filter((s) => s.y < a.y - 4).map((s) => s.y);
      const bottom = Math.max(below.length ? Math.max(...below.map((b) => b.y)) : floor, ...sectionBelow, floor);
      const cell = clean.filter((i) => i !== a && !sectionItems.has(i) && i.x >= a.x - 6 && i.x < right - 6 && i.y <= a.y + 3 && i.y > bottom + 3);
      // coleção: o título mais próximo acima desta carta (ou o que veio da página anterior)
      const above = sections.filter((s) => s.y > a.y);
      const setName = above.length ? above[above.length - 1].name : currentSet;

      const m = a.str.trim().match(ANCHOR)!;
      const card: GridCard = { raw: "", number: m[1], total: m[2]?.replace(/\D/g, "") || undefined, setName, quantity: 1 };
      const leftovers: string[] = [];
      for (const line of lines(cell)) {
        // uma linha pode ter "Common  R$ 0,13" ou "TENHO x2": separa as palavras conhecidas
        const parts = line.split(/\s{2,}|(?<=\S)\s+(?=R\$|US\$|€)/).flatMap((p) => p.split(/\s+(?=x\d+$)/i));
        for (const piece of parts) {
          const t = piece.replace(PRICE, "").trim();
          if (!t) continue;
          const q = t.match(QTY);
          if (q) {
            card.quantity = Math.max(1, Math.min(999, Number(q[1] ?? q[2] ?? q[3] ?? q[4])));
            continue;
          }
          if (STATUS.test(t) || RARITY.test(t)) continue;
          if (LANG.test(t)) {
            card.language = parseLanguage(t) ?? undefined;
            continue;
          }
          if (VARIANT.test(t) || /^\[[^\]]{1,12}\]/.test(t)) {
            card.variant = variantOf(t);
            continue;
          }
          const tagged = t.match(/^(.*?)\s*\b(TENHO|FALTA)\b\s*(?:x\s*(\d+))?$/i);
          if (tagged) {
            if (tagged[3]) card.quantity = Number(tagged[3]);
            if (tagged[1]) leftovers.push(tagged[1]);
            continue;
          }
          leftovers.push(t);
        }
      }
      card.name = leftovers.find((l) => /[A-Za-zÀ-ÿ]{2,}/.test(l));
      card.raw = [`#${card.number}`, card.name, setName, card.language, card.variant].filter(Boolean).join(" · ");
      if (card.name || card.number) out.push(card);
    }
    if (sections.length) currentSet = sections[sections.length - 1].name;
  }
  return out.length ? out : null;
}
