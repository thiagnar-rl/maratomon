import type { Metadata } from "next";
import Link from "next/link";
import { getCard, getRates, getSeries } from "@/lib/tcg/api";
import { featuredCardIds } from "@/lib/tcg/featured";
import { cardImage, setLogo, tcgplayerVariants } from "@/lib/tcg/prices";
import { MarketDashboard, type MarketRow } from "@/components/tcg/market-dashboard";
import { CardSearchForm } from "@/components/tcg/card-search-form";
import { MonArt } from "@/components/mon-art";
import { TcgNav } from "@/components/tcg/tcg-nav";

export const metadata: Metadata = {
  title: "TCG: coleções, preços e comparador",
  description: "Todas as coleções do Pokémon TCG desde 1999, com preços do TCGplayer e do Cardmarket em reais.",
};

export const revalidate = 3600;

const dateFormat = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });

export default async function TcgPage() {
  const [series, rates, featured] = await Promise.all([
    getSeries(),
    getRates(),
    Promise.all(featuredCardIds.map((id) => getCard(id))),
  ]);

  const rows: MarketRow[] = featured
    .filter((c) => c !== null)
    .map((card) => {
      const usd = tcgplayerVariants(card.pricing).map(([, v]) => v.marketPrice).find((p): p is number => typeof p === "number") ?? null;
      return {
        id: card.id,
        name: card.name,
        set: card.set.name,
        image: cardImage(card.image, "low"),
        usd,
        eur: card.pricing?.cardmarket?.trend ?? null,
        eur30: card.pricing?.cardmarket?.avg30 ?? null,
      };
    });

  const totalSets = series.reduce((n, s) => n + s.sets.length, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6">
      <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1d3f8f] via-[#16275c] to-[#0b1230] p-8 text-white sm:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-4 -top-6 hidden items-end sm:flex">
          <MonArt mon={{ id: 133, name: "Eevee" }} size={130} eager className="-mr-10 mb-2" />
          <MonArt mon={{ id: 197, name: "Umbreon" }} size={200} eager className="animate-float" />
        </div>
        <div className="relative max-w-xl space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-accent-2">Estampas Ilustradas</p>
          <h1 className="font-display text-5xl font-extrabold tracking-tight">Pokémon TCG</h1>
          <p className="opacity-85">
            {totalSets} coleções em {series.length} séries, desde a Coleção Básica de 1999. Preços do TCGplayer e do
            Cardmarket convertidos para real
            {rates.fallback ? " (cotação aproximada)" : ` pela cotação de hoje: US$ 1 = R$ ${rates.USD.toFixed(2)}, € 1 = R$ ${rates.EUR.toFixed(2)}`}.
          </p>
          <CardSearchForm />
        </div>
      </header>

      <TcgNav />

      {rows.length > 0 ? (
        <MarketDashboard rows={rows} rates={rates} />
      ) : (
        <p className="rounded-3xl border border-line bg-surface p-6 text-ink-soft">Não foi possível carregar os preços agora. Tente de novo em alguns minutos.</p>
      )}

      <section className="space-y-10" aria-label="Coleções por série">
        <h2 className="font-display text-3xl font-extrabold">Todas as coleções</h2>
        {series.length === 0 && <p className="text-ink-soft">O catálogo está indisponível no momento.</p>}
        {series.map((serie) => (
          <div key={serie.id} className="space-y-4">
            <h3 className="flex flex-wrap items-baseline gap-x-3 font-display text-2xl font-bold">
              {serie.name}
              <span className="text-sm font-semibold text-ink-soft">
                {serie.releaseDate ? `desde ${dateFormat.format(new Date(serie.releaseDate))}` : ""} · {serie.sets.length} coleções
                {serie.digital && " · jogo digital (TCG Pocket)"}
              </span>
            </h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {serie.sets.map((set) => {
                const logo = setLogo(set.logo);
                return (
                  <li key={set.id}>
                    <Link
                      href={`/tcg/colecoes/${set.id}`}
                      className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-surface p-3 transition hover:-translate-y-0.5 hover:border-ink-soft"
                    >
                      <div className="grid h-16 place-items-center">
                        {logo ? (
                          <img src={logo} alt="" loading="lazy" className="max-h-16 max-w-full object-contain" />
                        ) : (
                          <span className="font-display text-sm font-bold text-ink-soft">{set.id.toUpperCase()}</span>
                        )}
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
