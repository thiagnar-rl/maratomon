import type { Metadata } from "next";
import { SharedCollection } from "@/components/collection/shared-collection";

export const metadata: Metadata = {
  title: "Lista de cartas compartilhada",
  description: "Lista de cartas Pokémon compartilhada pela Forja Arcana, com preços em reais.",
  robots: { index: false },
};

export default function SharedPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <SharedCollection />
    </div>
  );
}
