import type { Metadata } from "next";
import { getMarket } from "@/lib/tcg/market";
import { MarketLive } from "@/components/tcg/market-live";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Cards Pokémon em alta e em queda hoje: mercado ao vivo",
  description: "Mercado Pokémon TCG ao vivo em real e dólar: cards em alta e em queda no dia, na semana e no mês, câmbio e as cartas mais caras do dia.",
};

export default async function MarketPage() {
  const market = await getMarket();
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <h1 className="sr-only">Mercado Pokémon TCG ao vivo</h1>
      <MarketLive initial={market} />
    </div>
  );
}
