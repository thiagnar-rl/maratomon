"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { closeAccountPrompt, useProgress } from "@/lib/progress/hooks";
import { catalog } from "@/lib/catalog";
import { Mascot } from "./mascot";

const perks = [
  ["✅", "Marque episódios e veja sua porcentagem subir"],
  ["▶️", "“Continue de onde parou” em qualquer aparelho"],
  ["🃏", "Monte sua coleção de cartas com valor em reais"],
  ["🏆", "Conquistas e estatísticas da sua maratona"],
];

/** Convite para criar conta. Aparece quando alguém sem login tenta marcar algo. */
export function AccountPrompt() {
  const { prompt } = useProgress();
  const pathname = usePathname();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (prompt && !dialog.open) dialog.showModal();
    if (!prompt && dialog.open) dialog.close();
  }, [prompt]);

  // Fecha ao trocar de página.
  useEffect(() => {
    closeAccountPrompt();
  }, [pathname]);

  const back = encodeURIComponent(pathname);
  const marking = prompt?.kind === "marcar";

  return (
    <dialog
      ref={ref}
      onClose={closeAccountPrompt}
      onClick={(e) => e.target === ref.current && closeAccountPrompt()}
      aria-labelledby="convite-titulo"
      className="m-auto w-[min(92vw,30rem)] overflow-hidden rounded-[2rem] border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="relative bg-gradient-to-br from-accent/40 via-surface to-surface px-6 pb-4 pt-6 text-center">
        <button type="button" onClick={closeAccountPrompt} aria-label="Fechar" className="absolute right-4 top-4 rounded-full px-2 text-xl text-ink-soft hover:text-ink">
          ×
        </button>
        <Mascot className="mx-auto size-20 animate-float" />
        <h2 id="convite-titulo" className="mt-2 font-display text-3xl font-extrabold leading-tight">
          {marking ? "Salve sua maratona!" : "Crie sua conta grátis"}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          {marking
            ? `Para contar ${prompt.count > 1 ? `esses ${prompt.count} episódios` : "esse episódio"} no seu progresso, entre na sua conta. Assim que entrar, ele já aparece marcado.`
            : `Acompanhe os ${catalog.totalEpisodes.toLocaleString("pt-BR")} episódios dublados e continue de onde parou em qualquer aparelho.`}
        </p>
      </div>
      <ul className="space-y-2 px-6 py-4 text-sm">
        {perks.map(([icon, text]) => (
          <li key={text} className="flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            {text}
          </li>
        ))}
      </ul>
      <div className="space-y-2 px-6 pb-6">
        <Link
          href={`/entrar?modo=criar&voltar=${back}`}
          className="block rounded-full bg-accent px-5 py-3 text-center font-bold text-white shadow-lg transition hover:brightness-110"
        >
          Criar conta grátis
        </Link>
        <Link href={`/entrar?voltar=${back}`} className="block rounded-full border border-line px-5 py-3 text-center font-bold transition hover:border-ink-soft">
          Já tenho conta
        </Link>
        <button type="button" onClick={closeAccountPrompt} className="w-full py-1 text-sm font-semibold text-ink-soft hover:text-ink">
          Agora não
        </button>
      </div>
    </dialog>
  );
}
