import { NextResponse } from "next/server";
import { searchCards } from "@/lib/tcg/api";
import { cardImage } from "@/lib/tcg/prices";

/** Busca de cartas por nome: /api/tcg/search?q=charizard */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const cards = await searchCards(q, 30);
  return NextResponse.json(
    cards.map((c) => ({ id: c.id, name: c.name, localId: c.localId, image: cardImage(c.image, "low") })),
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
