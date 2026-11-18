"use client";


import { LANG_NAME, normNumber, parseLanguage, splitCardId, type Language } from "@/lib/tcg/card-ref";
import { CONDITIONS, unitValue, type CardInfo, type Collection, type CollectionCard } from "@/lib/collection";
import type { SetSummary } from "@/lib/collection-store";

/* ================================ IMPORTAR ================================ */

/** Uma linha lida de uma lista ou planilha, antes de identificar a carta. */
export type ImportLine = {
  raw: string;
  quantity: number;
  cardId?: string;
  name?: string;
  number?: string;
  total?: string;
  setCode?: string;
  setName?: string;
  language?: Language;
  condition?: string;
  variant?: string;
  paid?: number;
};

const SKIP = /^(pok[eé]mon|treinador|trainer|energ(y|ia)|total|deck|lista|cartas?)\s*[:(-]?\s*\d*\)?\s*$/i;

function parseMoney(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  const s = String(v).replace(/[^\d,.-]/g, "");
  if (!s) return undefined;
  const n = Number(/,\d{1,2}$/.test(s) ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function parseCondition(v: unknown) {
  const s = String(v ?? "").trim().toUpperCase();
  if (!s) return undefined;
  const map: Record<string, string> = { M: "NM", NM: "NM", "NEAR MINT": "NM", SP: "LP", LP: "LP", MP: "MP", PL: "MP", HP: "HP", D: "DMG", DMG: "DMG", DM: "DMG" };
  if (map[s]) return map[s];
  if (/^(PSA|CGC|BGS|GRAD)/.test(s)) return "Gradeada";
  return (CONDITIONS as readonly string[]).includes(s) ? s : undefined;
}

/**
 * Lê uma linha de lista de texto. Aceita, por exemplo:
 *   4 Pikachu ex SSP 57          (padrão Pokémon TCG Live)
 *   1x Charizard ex (199/165) PT (quantidade, nome, número/total, idioma)
 *   Mew ex 151/165
 *   2 Ultra Ball
 */
export function parseLine(line: string): ImportLine | null {
  const raw = line.replace(/ /g, " ").trim();
  if (!raw || raw.startsWith("#") || raw.startsWith("//") || SKIP.test(raw)) return null;
  const item: ImportLine = { raw, quantity: 1 };
  let s = raw.replace(/^[-*•]\s*/, "");

  const qty = s.match(/^(\d{1,3})\s*[xX×]?\s+(?=\D)/);
  if (qty) {
    item.quantity = Math.max(1, Math.min(999, Number(qty[1])));
    s = s.slice(qty[0].length);
  } else {
    const tail = s.match(/\s+[xX×]\s*(\d{1,3})$/);
    if (tail) {
      item.quantity = Math.max(1, Math.min(999, Number(tail[1])));
      s = s.slice(0, -tail[0].length);
    }
  }

  // idioma e condição entre colchetes/parênteses ou no fim
  s = s.replace(/[[(]\s*(PT|PT-BR|EN|JP|ES|FR|DE|IT|KO|ZH|Português|Inglês|Japonês)\s*[\])]/gi, (_, l) => {
    item.language = parseLanguage(l) ?? undefined;
    return " ";
  });
  s = s.replace(/[[(]\s*(NM|LP|MP|HP|DMG|SP|M|PL)\s*[\])]/g, (_, c) => {
    item.condition = parseCondition(c);
    return " ";
  });
  s = s.replace(/[[(]\s*(foil|holo|reverse|reverse holo|1ª edição|1st edition|promo)\s*[\])]/gi, (_, v) => {
    item.variant = /rev/i.test(v) ? "Reverse" : /holo|foil/i.test(v) ? "Foil" : /1/.test(v) ? "1ª edição" : "Promo";
    return " ";
  });
  const endLang = s.match(/\s+(PT|PT-BR|EN|JP)\s*$/i);
  if (endLang) {
    item.language = parseLanguage(endLang[1]) ?? undefined;
    s = s.slice(0, -endLang[0].length);
  }

  s = s.replace(/\s{2,}/g, " ").trim();
  // número/total: (199/165), 199/165, #199
  const numTotal = s.match(/[([#]?\s*([A-Z]{0,3}\d{1,3}[a-z]?)\s*\/\s*([A-Z]{0,3}\d{1,3})\s*[)\]]?/i);
  if (numTotal) {
    item.number = numTotal[1];
    item.total = numTotal[2].replace(/\D/g, "");
    s = s.replace(numTotal[0], " ");
  } else {
    // padrão PTCG Live: "Nome SIGLA 123"
    const live = s.match(/\s+([A-Z][A-Z0-9]{1,5}(?:-[A-Z0-9]+)?)\s+([A-Z]{0,3}\d{1,3}[a-z]?)$/);
    if (live && !/^(EX|GX|V|VMAX|VSTAR|LV|BREAK)$/.test(live[1])) {
      item.setCode = live[1].replace(/^PR-.*/, live[1]);
      item.number = live[2];
      s = s.slice(0, -live[0].length);
    } else {
      const hash = s.match(/\s+#\s*([A-Z]{0,3}\d{1,3})$/i);
      if (hash) {
        item.number = hash[1];
        s = s.slice(0, -hash[0].length);
      }
    }
  }
  item.name = s.replace(/\s{2,}/g, " ").replace(/[-–|,;]+$/, "").trim() || undefined;
  if (!item.name && !item.number) return null;
  return item;
}

export function parseText(text: string): ImportLine[] {
  return text
    .split(/\r?\n/)
    .map(parseLine)
    .filter((x): x is ImportLine => Boolean(x));
}

/* ------------------------------ planilhas ------------------------------ */

const HEADERS: [keyof ImportLine | "numTotal", RegExp][] = [
  ["cardId", /^(id|card ?id|id da carta|tcgdex)$/],
  ["quantity", /^(qtd|qtde|quant|quantidade|qty|quantity|count|copias|copies|n)$/],
  ["name", /^(nome|name|carta|card|card name|nome da carta|pokemon)$/],
  ["numTotal", /^(numero|n[uú]mero|number|num|card number|#|no|nº|n°|colecionador|collector number)$/],
  ["total", /^(total|total da colecao|set total)$/],
  ["setCode", /^(sigla|codigo|set code|code|abrev|abreviacao|edicao sigla)$/],
  ["setName", /^(colecao|cole[cç][aã]o|edicao|edi[cç][aã]o|set|expansao|expansion|set name)$/],
  ["language", /^(idioma|lingua|language|lang)$/],
  ["condition", /^(condicao|condi[cç][aã]o|estado|qualidade|condition|quality)$/],
  ["variant", /^(versao|vers[aã]o|variante|variant|acabamento|finish|extras?)$/],
  ["paid", /^(pago|preco pago|valor pago|paid|purchase price|custo|preco de compra)/],
];

const plain = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .trim();

/** Lê linhas de planilha (primeira linha com cabeçalhos). Sem cabeçalho reconhecido, trata como lista de texto. */
export function parseRows(rows: unknown[][]): ImportLine[] {
  const nonEmpty = rows.filter((r) => r.some((c) => String(c ?? "").trim()));
  if (!nonEmpty.length) return [];
  const headerIndex = nonEmpty.slice(0, 5).findIndex((r) => r.filter((c) => HEADERS.some(([, re]) => re.test(plain(c)))).length >= 2);
  if (headerIndex < 0) return parseText(nonEmpty.map((r) => r.join(" ")).join("\n"));
  const header = nonEmpty[headerIndex].map(plain);
  const col = new Map<string, number>();
  header.forEach((h, i) => {
    const hit = HEADERS.find(([, re]) => re.test(h));
    if (hit && !col.has(hit[0])) col.set(hit[0], i);
  });
  const get = (r: unknown[], k: string) => (col.has(k) ? r[col.get(k)!] : undefined);
  const out: ImportLine[] = [];
  for (const r of nonEmpty.slice(headerIndex + 1)) {
    const name = String(get(r, "name") ?? "").trim();
    const cardId = String(get(r, "cardId") ?? "").trim();
    const nt = String(get(r, "numTotal") ?? "").trim();
    if (!name && !cardId && !nt) continue;
    const item: ImportLine = { raw: r.map((c) => String(c ?? "")).join(" · "), quantity: 1 };
    const q = Number(String(get(r, "quantity") ?? "1").replace(/\D/g, ""));
    item.quantity = q > 0 ? Math.min(999, q) : 1;
    if (/^[A-Za-z0-9.\-]{2,40}$/.test(cardId) && cardId.includes("-")) item.cardId = cardId;
    item.name = name || undefined;
    if (nt) {
      const m = nt.match(/([A-Z]{0,3}\d{1,3}[a-z]?)\s*(?:\/\s*([A-Z]{0,3}\d{1,3}))?/i);
      if (m) {
        item.number = m[1];
        if (m[2]) item.total = m[2].replace(/\D/g, "");
      }
    }
    const total = String(get(r, "total") ?? "").replace(/\D/g, "");
    if (total) item.total = total;
    const code = String(get(r, "setCode") ?? "").trim();
    if (code) item.setCode = code.toUpperCase();
    const setName = String(get(r, "setName") ?? "").trim();
    if (setName) {
      if (!code && /^(?=.*[A-Z])[A-Z0-9]{2,6}$/.test(setName)) item.setCode = setName;
      else item.setName = setName;
    }
    item.language = parseLanguage(get(r, "language")) ?? undefined;
    item.condition = parseCondition(get(r, "condition"));
    const variant = String(get(r, "variant") ?? "").trim();
    if (variant) item.variant = variant.slice(0, 30);
    item.paid = parseMoney(get(r, "paid"));
    out.push(item);
  }
  return out;
}

/** CSV com ; , ou tab e aspas. */
export function parseCsv(text: string): unknown[][] {
  const clean = text.replace(/^﻿/, "");
  const first = clean.split(/\r?\n/, 1)[0];
  const delim = [";", "\t", ","].sort((a, b) => first.split(b).length - first.split(a).length)[0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** Lê um arquivo enviado: .csv, .txt ou planilha do Excel (.xlsx). */
export async function readImportFile(file: File): Promise<ImportLine[]> {
  if (file.size > 5 * 1024 * 1024) throw new Error("Arquivo maior que 5 MB.");
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    if (name.endsWith(".xls")) throw new Error("Salve a planilha como .xlsx ou .csv e envie de novo.");
    const { readSheet } = await import("read-excel-file/browser");
    return parseRows((await readSheet(file)) as unknown[][]);
  }
  const text = await file.text();
  if (name.endsWith(".csv") || name.endsWith(".tsv") || /[;\t,]/.test(text.split(/\r?\n/, 1)[0])) {
    const rows = parseCsv(text);
    const lines = parseRows(rows);
    if (lines.length) return lines;
  }
  return parseText(text);
}

/* ================================ EXPORTAR ================================ */

export type ExportRow = {
  cardId: string;
  name: string;
  setName: string;
  setCode: string;
  number: string;
  official: string;
  quantity: number;
  language: Language;
  condition: string;
  variant: string;
  collection: string;
  unit: number | null;
  total: number | null;
  paid: number | null;
  source: string;
};

export function exportRows(
  cards: CollectionCard[],
  collections: Collection[],
  info: Record<string, CardInfo>,
  sets: Record<string, SetSummary>,
  radar: Record<string, { median_brl: number }> = {},
): ExportRow[] {
  const colName = new Map(collections.map((c) => [c.id, c.name]));
  return cards
    .map((c) => {
      const { setId, localId } = splitCardId(c.card_id);
      const set = sets[setId];
      const unit = unitValue(c, info, radar);
      return {
        cardId: c.card_id,
        name: c.card_name,
        setName: set?.namePt ?? set?.name ?? c.set_name ?? setId,
        setCode: set?.code ?? "",
        number: info[c.card_id]?.localId ?? localId,
        official: String(info[c.card_id]?.official ?? set?.official ?? ""),
        quantity: c.quantity,
        language: c.language ?? "PT",
        condition: c.condition ?? "",
        variant: c.variant ?? "",
        collection: colName.get(c.collection_id) ?? "",
        unit: unit == null ? null : Math.round(unit * 100) / 100,
        total: unit == null ? null : Math.round(unit * c.quantity * 100) / 100,
        paid: c.paid_brl,
        source: c.market_brl != null ? "Anotado" : info[c.card_id]?.br ? "Brasil (MYP Cards)" : unit != null ? "Internacional" : "",
      };
    })
    .sort((a, b) => a.setName.localeCompare(b.setName) || normNumber(a.number).localeCompare(normNumber(b.number), undefined, { numeric: true }));
}

const numberLabel = (r: ExportRow) => (r.official ? `${r.number}/${String(r.official).padStart(r.number.replace(/\D/g, "").length, "0")}` : r.number);

const COLUMNS = (prices: boolean) =>
  [
    ["Quantidade", (r: ExportRow) => r.quantity],
    ["Nome", (r: ExportRow) => r.name],
    ["Número", (r: ExportRow) => numberLabel(r)],
    ["Coleção", (r: ExportRow) => r.setName],
    ["Sigla", (r: ExportRow) => r.setCode],
    ["Idioma", (r: ExportRow) => LANG_NAME[r.language] ?? r.language],
    ["Condição", (r: ExportRow) => r.condition],
    ["Versão", (r: ExportRow) => r.variant],
    ["Pasta/Deck", (r: ExportRow) => r.collection],
    ...(prices
      ? ([
          ["Valor unitário (R$)", (r: ExportRow) => r.unit],
          ["Valor total (R$)", (r: ExportRow) => r.total],
          ["Pago (R$)", (r: ExportRow) => r.paid],
          ["Fonte do preço", (r: ExportRow) => r.source],
        ] as const)
      : []),
    ["ID", (r: ExportRow) => r.cardId],
  ] as const;

const csvCell = (v: unknown) => {
  if (v == null) return "";
  const s = typeof v === "number" ? String(v).replace(".", ",") : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(rows: ExportRow[], prices: boolean) {
  const cols = COLUMNS(prices);
  const lines = [cols.map(([h]) => h).join(";"), ...rows.map((r) => cols.map(([, f]) => csvCell(f(r))).join(";"))];
  return "﻿" + lines.join("\r\n");
}

/** Lista de texto no padrão do Pokémon TCG Live: "4 Pikachu ex SSP 57". */
export function toLiveText(rows: ExportRow[]) {
  return rows.map((r) => `${r.quantity} ${r.name} ${r.setCode || r.cardId.split("-")[0].toUpperCase()} ${r.number.replace(/^0+(?=\d)/, "")}`).join("\n");
}

/** Lista de texto com número/total: "1 Charizard ex (199/165)" — fácil de ler e de colar em sites e conversas. */
export function toNumberedText(rows: ExportRow[], prices: boolean) {
  return rows
    .map((r) => `${r.quantity} ${r.name} (${numberLabel(r)}) ${r.language}${prices && r.unit != null ? ` · R$ ${r.unit.toFixed(2).replace(".", ",")}` : ""}`)
    .join("\n");
}

export async function toXlsx(rows: ExportRow[], prices: boolean, title: string): Promise<Blob> {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const cols = COLUMNS(prices);
  const header = cols.map(([h]) => ({ value: h, fontWeight: "bold" as const, backgroundColor: "#1f2b4d", textColor: "#ffffff" }));
  const body = rows.map((r) =>
    cols.map(([h, f]) => {
      const v = f(r);
      if (v == null || v === "") return null;
      return typeof v === "number" ? { value: v, format: /R\$/.test(h) ? "#,##0.00" : "0" } : String(v);
    }),
  );
  const result = await writeXlsxFile([header, ...body] as never, {
    sheet: title.slice(0, 30).replace(/[\\/?*[\]:]/g, " ") || "Coleção",
    columns: cols.map(([h]) => ({ width: h === "Nome" ? 28 : h === "Coleção" ? 24 : h === "ID" ? 16 : 13 })),
    stickyRowsCount: 1,
  } as never);
  return (result as unknown as { toBlob: () => Promise<Blob> }).toBlob();
}

export async function toPdf(rows: ExportRow[], prices: boolean, title: string, totals: { value: number; copies: number }): Promise<Blob> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: prices ? "landscape" : "portrait", unit: "pt", format: "a4" });
  const money = (n: number | null) => (n == null ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
  doc.setFontSize(18);
  doc.text(title, 40, 48);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(
    `${totals.copies} cartas${prices ? ` · valor estimado ${money(totals.value)}` : ""} · gerado em ${new Date().toLocaleDateString("pt-BR")} · forja-arcana.vercel.app`,
    40,
    66,
  );
  const head = ["Qtd", "Nome", "Número", "Coleção", "Idioma", "Cond.", ...(prices ? ["Unit.", "Total"] : [])];
  autoTable(doc, {
    startY: 82,
    head: [head],
    body: rows.map((r) => [r.quantity, r.name, numberLabel(r), r.setName, r.language, r.condition, ...(prices ? [money(r.unit), money(r.total)] : [])]),
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [31, 43, 77] },
    alternateRowStyles: { fillColor: [244, 246, 251] },
  });
  return doc.output("blob");
}

export function download(content: Blob | string, filename: string, type = "text/plain;charset=utf-8") {
  const blob = typeof content === "string" ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ============================ LINK COMPARTILHÁVEL ============================ */

/** O que vai no link: título, se mostra preços, e as cartas [id, quantidade, idioma]. */
export type SharePayload = { v: 1; t: string; k: "colecao" | "desejos" | "faltam" | "pasta"; p: boolean; c: [string, number, string][] };

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

/** Compacta a lista no próprio link (nada fica salvo em servidor). */
export async function encodeShare(payload: SharePayload): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(payload));
  if (typeof CompressionStream === "undefined") return `j.${b64url(json)}`;
  return `z.${b64url(await pipe(json, new CompressionStream("deflate-raw")))}`;
}

export async function decodeShare(code: string): Promise<SharePayload | null> {
  try {
    const [kind, data] = [code.slice(0, 1), code.slice(2)];
    const bytes = fromB64url(data);
    const json = kind === "z" ? await pipe(bytes, new DecompressionStream("deflate-raw")) : bytes;
    const p = JSON.parse(new TextDecoder().decode(json)) as SharePayload;
    if (p.v !== 1 || !Array.isArray(p.c)) return null;
    p.c = p.c.filter((x) => Array.isArray(x) && typeof x[0] === "string" && /^[A-Za-z0-9.\-]{2,40}$/.test(x[0])).slice(0, 1500);
    return p;
  } catch {
    return null;
  }
}
