import type { Metadata } from "next";
import Link from "next/link";
import { SetCoverArt } from "@/components/tcg/set-cover";
import { notFound } from "next/navigation";
import { getSet } from "@/lib/tcg/api";
import { PricedCardGrid } from "@/components/tcg/priced-card-grid";

type Props = { params: Promise<{ id: string }> };

export const revalidate = 43200;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const set = await getSet((await params).id);
  if (!set) return { title: "Coleção não encontrada" };
  return { title: `${set.namePt ?? set.name} (${set.serie.name})`, description: `Todas as ${set.cardCount.total} cartas de ${set.name}, com preços.` };
}

export default async function SetPage({ params }: Props) {
  const set = await getSet((await params).id);
  if (!set) notFound();
  const released = set.releaseDate
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(set.releaseDate))
    : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <nav aria-label="Navegação" className="text-sm font-semibold text-ink-soft">
        <Link href="/tcg" className="hover:text-ink">TCG</Link> / <span>{set.serie.name}</span>
      </nav>
      <header className="flex flex-col gap-6 rounded-[2rem] border border-line bg-surface p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="grid w-full max-w-[260px] shrink-0 place-items-center">
          <SetCoverArt set={set} size="lg" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-extrabold leading-tight">{set.namePt ?? set.name}</h1>
          {set.namePt && set.namePt !== set.name && <p className="text-ink-soft">{set.name}</p>}
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-surface-2 px-3 py-1">{set.serie.name}</span>
            {released && <span className="rounded-full bg-surface-2 px-3 py-1">Lançada em {released}</span>}
            <span className="rounded-full bg-surface-2 px-3 py-1">{set.cardCount.total} cartas</span>
            {set.legal?.standard && <span className="rounded-full bg-good/15 px-3 py-1 text-good">Válida no Standard</span>}
            {set.legal?.expanded && <span className="rounded-full bg-accent-3/15 px-3 py-1 text-accent-3">Válida no Expanded</span>}
          </div>
        </div>
      </header>
      <p className="text-sm text-ink-soft">Toque numa carta para ver preços, gráfico e adicionar à sua coleção.</p>
      <PricedCardGrid cards={set.cards} showTotal />
    </div>
  );
}
