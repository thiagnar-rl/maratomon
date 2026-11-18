import type { Metadata } from "next";
import { CollectionDashboard } from "@/components/collection/collection-dashboard";
import { MonArt } from "@/components/mon-art";

export const metadata: Metadata = {
  title: "Minha coleção",
  description: "Sua coleção de cartas: valor em reais, progresso por coleção, scan, importação e exportação.",
  robots: { index: false },
};

export default function CollectionPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">Catálogo pessoal</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Minha coleção</h1>
        </div>
        <MonArt mon={{ id: 143, name: "Snorlax" }} size={88} eager className="hidden sm:block" />
      </header>
      <CollectionDashboard />
    </div>
  );
}
