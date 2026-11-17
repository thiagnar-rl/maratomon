import { getMarket } from "@/lib/tcg/market";
import { MarketLive } from "./market-live";

/** Busca o mercado no servidor (em cache) e entrega para o painel ao vivo. Usado dentro de <Suspense>. */
export async function MarketSection() {
  const market = await getMarket();
  if (market.rows.length === 0) {
    return <p className="rounded-3xl border border-line bg-surface p-6 text-ink-soft">Não foi possível carregar os preços agora. Tente de novo em alguns minutos.</p>;
  }
  return <MarketLive initial={market} />;
}

/** Esqueleto mostrado na hora, enquanto o mercado carrega. */
export function MarketSkeleton() {
  return (
    <div className="space-y-5" aria-label="Carregando o mercado" aria-busy="true">
      <div className="h-44 animate-pulse rounded-[2rem] bg-surface-2" />
      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="hidden h-96 animate-pulse rounded-[2rem] bg-surface-2 lg:block" />
        <div className="space-y-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      </div>
      <p className="text-center text-sm text-ink-soft">Carregando os preços do mercado…</p>
    </div>
  );
}
