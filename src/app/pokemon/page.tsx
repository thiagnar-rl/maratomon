import type { Metadata } from "next";
import { PokedexBrowser } from "@/components/pokedex-browser";
import { dexList, GENERATIONS } from "@/lib/pokedex";

export const revalidate = 604800;

export const metadata: Metadata = {
  title: "Pokédex: cartas, preços e episódios de cada Pokémon",
  description: "Todos os 1025 Pokémon com as cartas de cada um, a mais cara e a mais barata no Brasil, e os episódios do anime em que aparecem.",
  alternates: { canonical: "/pokemon" },
};

export default async function PokedexPage() {
  const list = await dexList();
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6">
      <header className="space-y-2">
        <h1 className="font-display text-5xl font-extrabold tracking-tight">Pokédex</h1>
        <p className="max-w-2xl text-ink-soft">
          Escolha um Pokémon para ver todas as cartas dele, quanto valem no Brasil e em quais episódios do anime ele aparece.
        </p>
      </header>
      <PokedexBrowser list={list} generations={GENERATIONS.map(({ n, label, region, from, to }) => ({ n, label, region, from, to }))} />
    </div>
  );
}
