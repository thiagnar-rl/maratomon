import Link from "next/link";
import { cardImage, formatDelta, formatMoney, formatPct, priceDelta } from "@/lib/tcg/prices";
import type { BrPrice, CardBrief, PriceSnapshot } from "@/lib/tcg/types";
import { CardPlaceholder } from "./card-placeholder";
import { HoloCard } from "./holo-card";

/** Miniatura de carta para grades (coleção, busca), com o preço do dia embaixo. */
export function CardTile({ card, subtitle, price, changeTitle = "Variação em 7 dias", showDelta = false }: { card: CardBrief; subtitle?: string; price?: (PriceSnapshot & { br?: BrPrice | null }) | null; changeTitle?: string; showDelta?: boolean }) {
  const src = cardImage(card.image, "low");
  const change = price?.change7d;
  return (
    <Link
      href={`/tcg/cartas/${card.id}`}
      className="group block rounded-2xl p-1.5 transition hover:bg-surface-2"
    >
      <HoloCard className="aspect-[5/7]" faceClassName="size-full rounded-xl bg-surface-2 shadow-md">
        {src ? (
          <img src={src} alt={card.name} loading="lazy" decoding="async" className="size-full object-cover" />
        ) : (
          <CardPlaceholder name={card.name} />
        )}
      </HoloCard>
      <p className="mt-2 truncate text-sm font-semibold">{card.name}</p>
      <p className="truncate text-xs text-ink-soft">{subtitle ?? `#${card.localId}`}</p>
      {price !== undefined && (
        <div className="mt-1 min-h-[2.4rem] rounded-lg bg-surface-2 px-2 py-1 text-xs tabular-nums">
          {price === null ? (
            <span className="inline-block h-3 w-16 animate-pulse rounded bg-line" aria-label="Carregando preço" />
          ) : price.brl == null ? (
            <span className="text-ink-soft">Sem preço</span>
          ) : (
            <>
              <span className="flex items-baseline justify-between gap-1">
                <strong className="text-sm text-ink" title={price.br ? `Menor preço no Brasil (MYP Cards)${price.br.units ? ` · ${price.br.units} un. à venda` : ""}` : "Média dos marketplaces internacionais, em reais"}>
                  {formatMoney(price.brl, "BRL")}
                  <span className={`ml-1 align-middle text-[9px] font-black ${price.br ? "text-good" : "text-ink-soft"}`}>{price.br ? "BR" : "INT"}</span>
                </strong>
                {typeof change === "number" && Math.abs(change) >= 0.1 && (
                  <span className={`font-bold ${change > 0 ? "text-good" : "text-[#ff5c8a]"}`} title={changeTitle}>
                    {change > 0 ? "▲" : "▼"} {formatPct(change).replace(/^[+−]/, "")}
                  </span>
                )}
              </span>
              {showDelta && typeof change === "number" && (
                <span className={`block font-bold ${change >= 0 ? "text-good" : "text-[#ff5c8a]"}`} title={`${changeTitle} em reais`}>
                  {formatDelta(priceDelta(price.brl, change))}
                </span>
              )}
              <span className="text-ink-soft">{price.usd != null ? formatMoney(price.usd, "USD") : formatMoney(price.eur, "EUR")}</span>
            </>
          )}
        </div>
      )}
    </Link>
  );
}
