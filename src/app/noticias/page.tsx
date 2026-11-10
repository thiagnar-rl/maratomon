import type { Metadata } from "next";
import { getNews } from "@/lib/news";
import { NewsGrid } from "@/components/news/news-grid";
import { Mascot } from "@/components/mascot";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Notícias Pokémon de hoje",
  description: "Notícias de Pokémon TCG, games, Pokémon GO, anime e competitivo, direto das fontes oficiais e atualizadas o dia todo.",
};

export default async function NoticiasPage() {
  const { items, sources, updatedAt } = await getNews(120);
  const hora = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date(updatedAt));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center gap-4">
        <Mascot className="size-20" />
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Notícias Pokémon</h1>
          <p className="text-ink-soft">
            {items.length} novidades das fontes oficiais · atualizado em {hora}
          </p>
        </div>
      </header>

      <NewsGrid items={items} />

      <section aria-labelledby="fontes" className="space-y-3 rounded-3xl border border-line bg-surface p-6">
        <h2 id="fontes" className="font-display text-xl font-extrabold">De onde vêm as notícias</h2>
        <p className="text-sm text-ink-soft">
          Só canais e sites oficiais da The Pokémon Company, Niantic e Play! Pokémon. Mostramos o título, a imagem e o link: a matéria
          completa abre sempre na fonte original.
        </p>
        <ul className="flex flex-wrap gap-2 text-sm">
          {sources.map((s) => (
            <li key={s.name} className="flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 font-semibold">
              <span className={`size-2 rounded-full ${s.ok ? "bg-good" : "bg-line"}`} />
              {s.name}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
