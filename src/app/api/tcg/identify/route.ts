import { identify, type CardQuery } from "@/lib/tcg/identify";

/**
 * Identifica cartas a partir de nome, número (025/165), sigla da coleção ou id.
 * POST { items: CardQuery[] } (até 150) → { results: Candidate[][] }
 * GET ?name=&number=&total=&setCode= → { candidates }
 */
const clean = (v: unknown, max = 80) => (typeof v === "string" || typeof v === "number" ? String(v).slice(0, max).trim() || undefined : undefined);

function sanitize(raw: Record<string, unknown>): CardQuery {
  const cardId = clean(raw.cardId, 40);
  return {
    cardId: cardId && /^[A-Za-z0-9.\-]{2,40}$/.test(cardId) ? cardId : undefined,
    name: clean(raw.name),
    number: clean(raw.number, 12),
    total: clean(raw.total, 6),
    setCode: clean(raw.setCode, 12),
    setName: clean(raw.setName),
  };
}

export async function GET(request: Request) {
  const p = Object.fromEntries(new URL(request.url).searchParams);
  const candidates = await identify(sanitize(p), 12);
  return Response.json({ candidates }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}

export async function POST(request: Request) {
  let body: { items?: unknown };
  try {
    body = (await request.json()) as { items?: unknown };
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  const items = Array.isArray(body.items) ? body.items.slice(0, 150) : [];
  const results = [];
  // Em lotes de 10 para não sobrecarregar a TCGdex.
  for (let i = 0; i < items.length; i += 10) {
    results.push(...(await Promise.all(items.slice(i, i + 10).map((it) => identify(sanitize((it ?? {}) as Record<string, unknown>), 5)))));
  }
  return Response.json({ results });
}
