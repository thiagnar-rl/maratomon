import type { Metadata } from "next";
import { searchCards } from "@/lib/tcg/api";
import { CardSearchForm } from "@/components/tcg/card-search-form";
import { PricedCardGrid } from "@/components/tcg/priced-card-grid";

export const metadata: Metadata = { title: "Buscar cartas", robots: { index: false } };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? "").slice(0, 60);
  const cards = await searchCards(q, 120);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-extrabold">Buscar cartas</h1>
      <CardSearchForm defaultValue={q} />
      {q && (
        <p className="text-sm text-ink-soft">
          {cards.length === 0 ? `Nenhuma carta encontrada para “${q}”. Tente o nome em inglês (ex.: Charizard).` : `${cards.length} cartas para “${q}”.`}
        </p>
      )}
      {cards.length > 0 && (
        <PricedCardGrid
          cards={cards}
          subtitles={Object.fromEntries(cards.map((c) => [c.id, c.id.split("-").slice(0, -1).join("-").toUpperCase()]))}
        />
      )}
    </div>
  );
}
