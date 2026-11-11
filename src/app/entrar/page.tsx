import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPanel } from "@/components/account/auth-panel";
import { Mascot } from "@/components/mascot";

export const metadata: Metadata = {
  title: "Entrar ou criar conta",
  description: "Crie sua conta Maratomon TCG com e-mail e senha.",
  robots: { index: false },
};

const perks = [
  ["📺", "Progresso da maratona salvo na nuvem, em qualquer aparelho"],
  ["🃏", "Coleção de cartas com fotos, valor em reais e lista de desejos"],
  ["🛒", "Pronta para comprar na loja Maratomon TCG quando ela abrir"],
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ modo?: string }> }) {
  const { modo } = await searchParams;
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:py-20">
      <section className="space-y-6">
        <Mascot className="size-24 animate-float" />
        <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight">
          Sua conta de <span className="text-accent">treinador</span>
        </h1>
        <p className="text-lg text-ink-soft">Uma conta só para o anime, as cartas e a loja. Crie com seu e-mail e uma senha.</p>
        <ul className="space-y-3">
          {perks.map(([icon, text]) => (
            <li key={text} className="flex items-center gap-3 font-semibold">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-surface-2 text-xl">{icon}</span>
              {text}
            </li>
          ))}
        </ul>
      </section>
      <Suspense>
        <AuthPanel initialMode={modo === "criar" ? "criar" : "entrar"} />
      </Suspense>
    </div>
  );
}
