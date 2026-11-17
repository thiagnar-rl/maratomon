import { getMarket } from "@/lib/tcg/market";

/** Painel do mercado para atualização ao vivo (o navegador consulta a cada poucos minutos). */
export const revalidate = 900;

export async function GET() {
  const { rows, rates, updatedAt } = await getMarket();
  return Response.json(
    { rows, rates, updatedAt },
    { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } },
  );
}
