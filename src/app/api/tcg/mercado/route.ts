import { getMarket } from "@/lib/tcg/market";

/** Painel do mercado para atualização ao vivo (o navegador consulta a cada poucos minutos). */
export const dynamic = "force-dynamic";

export async function GET() {
  const { rows, rates, updatedAt, top } = await getMarket();
  return Response.json(
    { rows, rates, updatedAt, top },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } },
  );
}
