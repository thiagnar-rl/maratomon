import "server-only";
import { getSet, searchCards } from "./api";
import { normName, normNumber, splitCardId } from "./card-ref";
import { setIndex, type SetInfo } from "./set-index";
import { cardImage } from "./prices";

/** O que se sabe de uma carta a identificar (vindo de lista colada, planilha ou scan). */
export type CardQuery = {
  cardId?: string;
  name?: string;
  number?: string;
  total?: string | number;
  setCode?: string;
  setName?: string;
};

export type Candidate = {
  id: string;
  name: string;
  localId: string;
  setId: string;
  setName: string;
  setCode?: string;
  official: number;
  image: string | null;
  /** 0 a 1: quanto bate com o que foi pedido. */
  score: number;
};

function nameScore(wanted: string | undefined, actual: string) {
  if (!wanted) return 0.5;
  const a = normName(wanted);
  const b = normName(actual);
  if (!a) return 0.5;
  if (a === b) return 1;
  if (b.startsWith(a) || a.startsWith(b)) return 0.85;
  if (b.includes(a) || a.includes(b)) return 0.7;
  const wa = new Set(a.split(" "));
  const common = b.split(" ").filter((w) => wa.has(w)).length;
  return common ? 0.4 + (0.3 * common) / Math.max(wa.size, 1) : 0.1;
}

function setsFor(q: CardQuery, sets: SetInfo[]): SetInfo[] {
  if (q.cardId) {
    const s = sets.find((x) => x.id === splitCardId(q.cardId!).setId);
    if (s) return [s];
  }
  const code = q.setCode?.trim().toUpperCase();
  if (code) {
    const byCode = sets.filter((s) => s.code === code || s.id.toUpperCase() === code);
    if (byCode.length) return byCode;
  }
  if (q.setName) {
    const n = normName(q.setName);
    // "Mega Evolution Promos", "SV Promos" → coleção de promos da mesma série
    if (/promo/.test(n)) {
      const serie = n.replace(/\b(black star )?promos?\b/g, "").trim();
      const promos = sets.filter((s) => /promo/i.test(s.name) && (!serie || normName(s.serie) === serie || normName(s.name).includes(serie)));
      if (promos.length) return promos;
    }
    const byName = sets.filter((s) => normName(s.name) === n || (s.namePt && normName(s.namePt) === n));
    if (byName.length) return byName;
    const loose = sets.filter((s) => normName(s.name).includes(n) || (s.namePt && normName(s.namePt).includes(n)));
    if (loose.length && loose.length <= 6) return loose;
  }
  const total = Number(q.total);
  if (total > 0) return sets.filter((s) => s.official === total || (s.total === total && s.official !== total));
  return [];
}

/** Acha as cartas mais prováveis para um pedido (melhor primeiro). */
export async function identify(q: CardQuery, limit = 8): Promise<Candidate[]> {
  const sets = await setIndex();
  const byId = new Map(sets.map((s) => [s.id, s]));
  const pool = setsFor(q, sets)
    .sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""))
    .slice(0, 10);
  const num = q.number ? normNumber(q.number) : "";
  const found: Candidate[] = [];

  if (pool.length && (num || q.cardId)) {
    const details = await Promise.all(pool.map((s) => getSet(s.id)));
    details.forEach((set, i) => {
      if (!set) return;
      const info = pool[i];
      for (const c of set.cards) {
        const hit = q.cardId ? c.id === q.cardId : normNumber(c.localId) === num;
        if (!hit) continue;
        found.push({
          id: c.id,
          name: c.name,
          localId: c.localId,
          setId: set.id,
          setName: info.namePt ?? info.name,
          setCode: info.code,
          official: info.official,
          image: cardImage(c.image, "low"),
          score: (q.cardId ? 1 : 0.6) + nameScore(q.name, c.name) * 0.4,
        });
      }
    });
  }

  // Sem número, nada encontrado ou nome bem diferente do pedido: busca também pelo nome (inglês e português).
  const weak = found.length > 0 && Math.max(...found.map((c) => nameScore(q.name, c.name))) < 0.6;
  if ((!found.length || weak) && q.name && q.name.trim().length >= 2) {
    const [en, pt] = await Promise.all([searchCards(q.name, 40), searchCards(q.name, 40, "pt")]);
    const seen = new Set<string>(found.map((c) => c.id));
    for (const c of [...en, ...pt]) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      const { setId } = splitCardId(c.id);
      const info = byId.get(setId);
      let score = nameScore(q.name, c.name) * 0.7;
      if (num && normNumber(c.localId) === num) score += 0.3;
      found.push({
        id: c.id,
        name: c.name,
        localId: c.localId,
        setId,
        setName: info?.namePt ?? info?.name ?? setId,
        setCode: info?.code,
        official: info?.official ?? 0,
        image: cardImage(c.image, "low"),
        score,
      });
    }
  }

  // Sigla lida errado (ex.: no scan): tenta de novo só com número e total.
  if (!found.length && q.setCode && (q.number || q.name)) return identify({ ...q, setCode: undefined }, limit);

  const order = new Map(sets.map((s) => [s.id, s.releaseDate ?? ""]));
  return found
    .sort((a, b) => b.score - a.score || (order.get(b.setId) ?? "").localeCompare(order.get(a.setId) ?? ""))
    .slice(0, limit);
}

/** Lê "025/165", "TG05/TG30", "SV001" de um texto. */
export function parseNumber(text: string) {
  const m = text.match(/([A-Z]{0,3}\d{1,3}[a-z]?)\s*\/\s*([A-Z]{0,3}\d{1,3})/i);
  if (m) return { number: m[1], total: m[2].replace(/\D/g, "") };
  return null;
}
