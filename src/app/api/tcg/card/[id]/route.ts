import { NextResponse } from "next/server";
import { getCard, getRates } from "@/lib/tcg/api";
import { cardImage, estimateBRL } from "@/lib/tcg/prices";

/** Carta com preços e valor estimado em reais (usada pelo comparador e pela coleção). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [card, rates] = await Promise.all([getCard(id), getRates()]);
  if (!card) return NextResponse.json({ error: "Carta não encontrada" }, { status: 404 });
  return NextResponse.json(
    {
      id: card.id,
      name: card.name,
      localId: card.localId,
      official: card.set.cardCount.official,
      set: card.set.name,
      setId: card.set.id,
      rarity: card.rarity ?? null,
      hp: card.hp ?? null,
      types: card.types ?? [],
      image: cardImage(card.image, "low"),
      imageHigh: cardImage(card.image, "high"),
      pricing: card.pricing ?? null,
      estimate: estimateBRL(card, rates),
      rates,
    },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
