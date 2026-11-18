import { getSet } from "@/lib/tcg/api";
import { cardImage } from "@/lib/tcg/prices";

/** Cartas de uma coleção (id, número, nome, imagem) — para "faltantes" e exportação. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const set = await getSet((await params).id);
  if (!set) return Response.json({ error: "Coleção não encontrada" }, { status: 404 });
  return Response.json(
    {
      id: set.id,
      name: set.namePt ?? set.name,
      official: set.cardCount.official,
      total: set.cardCount.total,
      cards: set.cards.map((c) => ({ id: c.id, localId: c.localId, name: c.name, image: cardImage(c.image, "low") })),
    },
    { headers: { "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=604800" } },
  );
}
