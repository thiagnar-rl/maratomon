import type { Metadata } from "next";
import { Comparator } from "@/components/tcg/comparator";

export const metadata: Metadata = {
  title: "Comparador de cartas",
  description: "Compare até 4 cartas lado a lado: preços no TCGplayer e no Cardmarket em reais, raridade e tendência.",
};

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <h1 className="font-display text-5xl font-extrabold tracking-tight">Comparador</h1>
        <p className="text-ink-soft">Até 4 cartas lado a lado, com preços convertidos para real.</p>
      </header>
      <Comparator />
    </div>
  );
}
