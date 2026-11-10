import Link from "next/link";
import { cardImage } from "@/lib/tcg/prices";
import type { CardBrief } from "@/lib/tcg/types";

/** Miniatura de carta para grades (coleção, busca). */
export function CardTile({ card, subtitle }: { card: CardBrief; subtitle?: string }) {
  const src = cardImage(card.image, "low");
  return (
    <Link
      href={`/tcg/cartas/${card.id}`}
      className="group block rounded-2xl p-1.5 transition hover:-translate-y-1 hover:bg-surface-2 motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-[5/7] overflow-hidden rounded-xl bg-surface-2 shadow-md transition group-hover:shadow-xl">
        {src ? (
          <img src={src} alt={card.name} loading="lazy" decoding="async" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center p-3 text-center text-xs font-semibold text-ink-soft">Sem imagem</div>
        )}
      </div>
      <p className="mt-2 truncate text-sm font-semibold">{card.name}</p>
      <p className="truncate text-xs text-ink-soft">{subtitle ?? `#${card.localId}`}</p>
    </Link>
  );
}
