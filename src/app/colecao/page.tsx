import type { Metadata } from "next";
import { CollectionDashboard } from "@/components/collection/collection-dashboard";
import { MonArt } from "@/components/mon-art";

export const metadata: Metadata = {
  title: "Minha coleção",
  description: "Seus decks e pastas de cartas, com fotos, vídeos e valor atualizado.",
  robots: { index: false },
};

export default function CollectionPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
      <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0e7c6b] via-[#0b5a52] to-[#06231f] p-8 text-white sm:p-10">
        <MonArt mon={{ id: 143, name: "Snorlax" }} size={200} eager className="pointer-events-none absolute -right-4 -top-4 hidden opacity-95 sm:block" />
        <div className="relative max-w-xl space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-accent-2">Catálogo pessoal</p>
          <h1 className="font-display text-5xl font-extrabold tracking-tight">Minha coleção</h1>
          <p className="opacity-85">Organize decks e pastas, anexe fotos e vídeos e acompanhe quanto sua coleção vale hoje.</p>
        </div>
      </header>
      <CollectionDashboard />
    </div>
  );
}
