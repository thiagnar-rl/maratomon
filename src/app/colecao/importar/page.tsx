import type { Metadata } from "next";
import Link from "next/link";
import { ImportFlow } from "@/components/collection/import-flow";
import { RequireLogin } from "@/components/collection/require-login";

export const metadata: Metadata = {
  title: "Importar cartas",
  description: "Traga sua coleção de uma lista de texto, planilha do Excel ou arquivo CSV.",
  robots: { index: false },
};

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <Link href="/colecao" className="text-sm font-bold text-ink-soft hover:text-ink">← Minha coleção</Link>
      <header className="space-y-2">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Importar cartas</h1>
        <p className="text-ink-soft">Cole uma lista ou envie uma planilha. O site identifica cada carta, você confere e pronto.</p>
      </header>
      <RequireLogin>
        <ImportFlow />
      </RequireLogin>
    </div>
  );
}
