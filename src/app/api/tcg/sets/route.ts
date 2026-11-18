import { setIndex } from "@/lib/tcg/set-index";

/** Resumo das coleções pedidas (?ids=sv01,me01) ou de todas: nome, logo, sigla e quantidade de cartas. */
export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("ids");
  const all = await setIndex();
  const wanted = ids ? new Set(ids.split(",").map((s) => s.trim())) : null;
  const sets = wanted ? all.filter((s) => wanted.has(s.id)) : all;
  return Response.json({ sets }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
}
