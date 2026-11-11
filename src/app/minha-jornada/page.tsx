import type { Metadata } from "next";
import { JourneyStats } from "@/components/journey-stats";

export const metadata: Metadata = {
  title: "Minha jornada",
  description: "Seu progresso na maratona: episódios assistidos, temporadas completas e tempo de tela.",
};

export default function JourneyPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6">
      <header className="space-y-2">
        <h1 className="font-display text-5xl font-extrabold tracking-tight">Minha jornada</h1>
        <p className="text-ink-soft">Seu progresso fica salvo na sua conta e acompanha você em qualquer aparelho.</p>
      </header>
      <JourneyStats />
    </div>
  );
}
