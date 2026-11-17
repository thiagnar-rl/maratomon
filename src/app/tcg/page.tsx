import type { Metadata } from "next";
import Link from "next/link";
import { getSeries } from "@/lib/tcg/api";
import { getMarket } from "@/lib/tcg/market";
import { MarketLive } from "@/components/tcg/market-live";
import { SetCoverArt } from "@/components/tcg/set-cover";
import { TermometroBR } from "@/components/tcg/termometro-br";

export const metadata: Metadata = {
  title: "Pokémon TCG ao vivo: cards em alta, em queda e mais caros do dia",
  description: "Todas as coleções do Pokémon TCG desde 1999, com preços do TCGplayer e do Cardmarket em reais.",
};

export const revalidate = 900;

const dateFormat = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });

export default async function TcgPage() {
  const [series, market] = await Promise.all([getSeries(), getMarket()]);

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-6">
      <h1 className="sr-only">Pokémon TCG: mercado ao vivo, cards em alta e em queda e coleções</h1>
      {market.rows.length > 0 ? (
        <MarketLive initial={market} />
      ) : (
        <p className="rounded-3xl border border-line bg-surface p-6 text-ink-soft">Não foi possível carregar os preços agora. Tente de novo em alguns minutos.</p>
      )}

      <TermometroBR />

      <section id="colecoes" className="scroll-mt-40 space-y-10" aria-label="Coleções por série">
        <h2 className="font-display text-3xl font-extrabold">Todas as coleções</h2>
        {series.length === 0 && <p className="text-ink-soft">O catálogo está indisponível no momento.</p>}
        {series.map((serie) => (
          <div key={serie.id} id={`serie-${serie.id}`} className="scroll-mt-40 space-y-4">
            <h3 className="flex flex-wrap items-baseline gap-x-3 font-display text-2xl font-bold">
              {serie.name}
              <span className="text-sm font-semibold text-ink-soft">
                {serie.releaseDate ? `desde ${dateFormat.format(new Date(serie.releaseDate))}` : ""} · {serie.sets.length} coleções
                {serie.digital && " · jogo digital (TCG Pocket)"}
              </span>
            </h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {serie.sets.map((set) => {
                return (
                  <li key={set.id}>
                    <Link
                      href={`/tcg/colecoes/${set.id}`}
                      className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-surface p-3 transition hover:-translate-y-0.5 hover:border-ink-soft"
                    >
                      <div className="grid h-16 place-items-center">
                        <SetCoverArt set={set} />
                      </div>
                      <span className="text-sm font-semibold leading-tight">{set.namePt ?? set.name}</span>
                      <span className="mt-auto text-xs text-ink-soft">
                        {set.namePt && set.namePt !== set.name ? `${set.name} · ` : ""}
                        {set.cardCount.total} cartas
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <p className="text-center text-xs text-ink-soft">
        Dados e imagens: TCGdex. Preços: TCGplayer (atualizado de hora em hora) e Cardmarket (diário). Cotação: AwesomeAPI.
      </p>
    </div>
  );
}
