import type { Metadata } from "next";
import { searchCards } from "@/lib/tcg/api";
import { CardSearchForm } from "@/components/tcg/card-search-form";
import { CardTile } from "@/components/tcg/card-tile";
import { TcgNav } from "@/components/tcg/tcg-nav";

export const metadata: Metadata = { title: "Buscar cartas", robots: { index: false } };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? "").slice(0, 60);
  const cards = await searchCards(q, 120);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-extrabold">Buscar cartas</h1>
      <CardSearchForm defaultValue={q} />
      <TcgNav />
      {q && (
        <p className="text-sm text-ink-soft">
          {cards.length === 0 ? `Nenhuma carta encontrada para “${q}”. Tente o nome em inglês (ex.: Charizard).` : `${cards.length} cartas para “${q}”.`}
        </p>
      )}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {cards.map((card) => (
          <li key={card.id}>
            <CardTile card={card} subtitle={card.id.split("-").slice(0, -1).join("-").toUpperCase()} />
          </li>
        ))}
      </ul>
    </div>
  );
}
