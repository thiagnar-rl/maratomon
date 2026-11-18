/** Utilidades de cartas usadas no navegador e no servidor. */

export const LANGUAGES = [
  ["PT", "Português", "🇧🇷"],
  ["EN", "Inglês", "🇺🇸"],
  ["JP", "Japonês", "🇯🇵"],
  ["ES", "Espanhol", "🇪🇸"],
  ["FR", "Francês", "🇫🇷"],
  ["DE", "Alemão", "🇩🇪"],
  ["IT", "Italiano", "🇮🇹"],
  ["KO", "Coreano", "🇰🇷"],
  ["ZH", "Chinês", "🇨🇳"],
  ["OUTRO", "Outro", "🌐"],
] as const;
export type Language = (typeof LANGUAGES)[number][0];
export const LANG_FLAG = Object.fromEntries(LANGUAGES.map(([c, , f]) => [c, f])) as Record<Language, string>;
export const LANG_NAME = Object.fromEntries(LANGUAGES.map(([c, n]) => [c, n])) as Record<Language, string>;

export const VARIANTS = ["Normal", "Foil", "Reverse", "1ª edição", "Promo", "Full Art", "Gradeada"] as const;

/** Separa "sv03.5-199" em coleção "sv03.5" e número "199". */
export function splitCardId(id: string) {
  const i = id.lastIndexOf("-");
  return i > 0 ? { setId: id.slice(0, i), localId: id.slice(i + 1) } : { setId: id, localId: "" };
}

/** Número comparável: "025" → "25", "TG05" → "TG5", "SV001" → "SV1". */
export function normNumber(n: string | number | null | undefined) {
  const s = String(n ?? "").trim().toUpperCase();
  const m = s.match(/^([A-Z]*)0*(\d+)([A-Z]*)$/);
  return m ? `${m[1]}${m[2]}${m[3]}` : s;
}

/** Converte idioma escrito de várias formas ("Português", "pt-BR", "EN") para o código do site. */
export function parseLanguage(value: unknown): Language | null {
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return null;
  if (/^(pt|port|br)/.test(s)) return "PT";
  if (/^(en|ing|eng)/.test(s)) return "EN";
  if (/^(jp|ja|jap)/.test(s)) return "JP";
  if (/^(es|esp)/.test(s)) return "ES";
  if (/^(fr|fra|fre)/.test(s)) return "FR";
  if (/^(de|ale|ger)/.test(s)) return "DE";
  if (/^(it|ita)/.test(s)) return "IT";
  if (/^(ko|cor|kor)/.test(s)) return "KO";
  if (/^(zh|chi|chn)/.test(s)) return "ZH";
  return "OUTRO";
}

/** Normaliza nomes para comparar: sem acentos, minúsculo, só letras e números. */
export const normName = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
