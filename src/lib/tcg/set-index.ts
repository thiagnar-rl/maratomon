import "server-only";
import { unstable_cache } from "next/cache";
import type { SetDetail } from "./types";

/** Índice leve de todas as coleções (sigla, total oficial, logo), guardado em cache por 1 dia. */
export type SetInfo = {
  id: string;
  name: string;
  namePt?: string;
  serie: string;
  logo?: string;
  symbol?: string;
  official: number;
  total: number;
  code?: string;
  releaseDate?: string;
};

const API = "https://api.tcgdex.net/v2";
const DAY = 60 * 60 * 24;

async function build(): Promise<SetInfo[]> {
  const [list, pt] = await Promise.all([
    fetch(`${API}/en/sets`, { next: { revalidate: DAY } }).then((r) => (r.ok ? r.json() : [])) as Promise<{ id: string }[]>,
    fetch(`${API}/pt/sets`, { next: { revalidate: DAY } }).then((r) => (r.ok ? r.json() : [])) as Promise<{ id: string; name: string }[]>,
  ]);
  if (!list.length) throw new Error("TCGdex indisponível");
  const ptNames = new Map(pt.map((s) => [s.id, s.name]));
  const out: SetInfo[] = [];
  for (let i = 0; i < list.length; i += 30) {
    const details = await Promise.all(
      list.slice(i, i + 30).map((s) =>
        fetch(`${API}/en/sets/${encodeURIComponent(s.id)}`, { next: { revalidate: DAY } })
          .then((r) => (r.ok ? (r.json() as Promise<SetDetail>) : null))
          .catch(() => null),
      ),
    );
    for (const d of details) {
      if (!d) continue;
      out.push({
        id: d.id,
        name: d.name,
        namePt: ptNames.get(d.id),
        serie: d.serie?.name ?? "",
        logo: d.logo,
        symbol: d.symbol,
        official: d.cardCount?.official ?? 0,
        total: d.cardCount?.total ?? d.cardCount?.official ?? 0,
        code: d.abbreviation?.official?.toUpperCase(),
        releaseDate: d.releaseDate,
      });
    }
  }
  return out;
}

const cached = unstable_cache(build, ["tcg-set-index-v1"], { revalidate: DAY });

export async function setIndex(): Promise<SetInfo[]> {
  try {
    return await cached();
  } catch {
    return [];
  }
}


