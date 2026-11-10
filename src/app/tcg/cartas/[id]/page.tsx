import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCard, getRates } from "@/lib/tcg/api";
import { brazilPriceLinks, cardImage, cardmarketSeries, estimateBRL, formatMoney, tcgplayerVariants, variantLabel } from "@/lib/tcg/prices";
import { typeColors } from "@/lib/pokemon";
import { PriceTrendChart } from "@/components/tcg/price-trend-chart";
import { CardActions } from "@/components/tcg/card-actions";

type Props = { params: Promise<{ id: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = await getCard((await params).id);
  if (!card) return { title: "Carta não encontrada" };
  return { title: `${card.name} – ${card.set.name}`, description: `Preço da carta ${card.name} (${card.set.name}) em reais, TCGplayer e Cardmarket.` };
}

const dateTime = (iso?: string) =>
  iso ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(iso)) : "—";

export default async function CardPage({ params }: Props) {
  const [card, rates] = await Promise.all([getCard((await params).id), getRates()]);
  if (!card) notFound();

  const image = cardImage(card.image, "high");
  const estimate = estimateBRL(card, rates);
  const variants = tcgplayerVariants(card.pricing);
  const cm = card.pricing?.cardmarket;
  const trend = cardmarketSeries(card.pricing, rates);
  const typeColor = card.types?.[0] ? typeColors[card.types[0]] : undefined;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <nav aria-label="Navegação" className="text-sm font-semibold text-ink-soft">
        <Link href="/tcg" className="hover:text-ink">TCG</Link> /{" "}
        <Link href={`/tcg/colecoes/${card.set.id}`} className="hover:text-ink">{card.set.name}</Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <div
            className="overflow-hidden rounded-[1.4rem] shadow-2xl"
            style={{ boxShadow: typeColor ? `0 30px 80px -30px ${typeColor}` : undefined }}
          >
            {image ? (
              <img src={image} alt={card.name} className="w-full" />
            ) : (
              <div className="grid aspect-[5/7] place-items-center bg-surface-2 text-ink-soft">Sem imagem</div>
            )}
          </div>
          <CardActions
            card={{ id: card.id, name: card.name, set: card.set.name, image: cardImage(card.image, "low") }}
          />
        </div>

        <div className="space-y-6">
          <header className="space-y-2">
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {card.types?.map((t) => (
                <span key={t} className="rounded-full px-3 py-1 text-white" style={{ background: typeColors[t] ?? "var(--ink-soft)" }}>{t}</span>
              ))}
              {card.rarity && <span className="rounded-full bg-surface-2 px-3 py-1">{card.rarity}</span>}
              <span className="rounded-full bg-surface-2 px-3 py-1">#{card.localId}/{card.set.cardCount.official}</span>
            </div>
            <h1 className="font-display text-5xl font-extrabold leading-tight">{card.name}</h1>
            <p className="text-ink-soft">
              {card.set.name}
              {card.illustrator && <> · Ilustração de {card.illustrator}</>}
              {card.hp && <> · {card.hp} HP</>}
            </p>
          </header>

          <section className="space-y-4 rounded-3xl border border-line bg-gradient-to-br from-surface to-surface-2 p-6">
            <div>
              <p className="text-sm font-semibold text-ink-soft">Valor estimado em reais (mercado internacional convertido)</p>
              <p className="font-display text-5xl font-extrabold tabular-nums">{estimate ? formatMoney(estimate.brl, "BRL") : "Sem preço"}</p>
              <p className="text-xs text-ink-soft">
                {estimate ? `Baseado em ${estimate.source}. ` : ""}
                Cotação: US$ 1 = R$ {rates.USD.toFixed(2)} · € 1 = R$ {rates.EUR.toFixed(2)}
                {rates.fallback && " (aproximada)"}
              </p>
            </div>
            <div className="rounded-2xl bg-bg/60 p-4">
              <p className="text-sm font-bold">Preço no Brasil 🇧🇷</p>
              <p className="text-xs text-ink-soft">
                No Brasil a carta costuma ter preço próprio (versão em português, frete e importação). Confira quanto está
                saindo por aqui e anote na sua coleção:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {brazilPriceLinks({ name: card.name, localId: card.localId, setOfficial: card.set.cardCount.official }).map((link) => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-bold hover:border-ink-soft" title={link.note}>
                    {link.label} ↗
                  </a>
                ))}
              </div>
            </div>
          </section>

          {trend.length > 1 && (
            <section className="space-y-3 rounded-3xl border border-line bg-surface p-6">
              <h2 className="font-display text-xl font-bold">Tendência no Cardmarket (em reais)</h2>
              <PriceTrendChart points={trend} />
            </section>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <section className="space-y-3 rounded-3xl border border-line bg-surface p-6">
              <h2 className="font-display text-xl font-bold">TCGplayer (EUA)</h2>
              {variants.length === 0 && <p className="text-sm text-ink-soft">Sem preço no TCGplayer.</p>}
              {variants.map(([key, v]) => (
                <div key={key} className="space-y-1">
                  <p className="text-sm font-bold">{variantLabel(key)}</p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm tabular-nums">
                    {([
                      ["Mercado", v.marketPrice],
                      ["Mínimo", v.lowPrice],
                      ["Médio", v.midPrice],
                      ["Máximo", v.highPrice],
                    ] as const).map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-2 border-b border-line/60 py-1">
                        <dt className="text-ink-soft">{label}</dt>
                        <dd className="text-right">
                          {formatMoney(value, "USD")}
                          <span className="block text-xs text-ink-soft">{value ? formatMoney(value * rates.USD, "BRL") : ""}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
              <p className="text-xs text-ink-soft">Atualizado em {dateTime(card.pricing?.tcgplayer?.updated as string | undefined)}</p>
            </section>

            <section className="space-y-3 rounded-3xl border border-line bg-surface p-6">
              <h2 className="font-display text-xl font-bold">Cardmarket (Europa)</h2>
              {!cm && <p className="text-sm text-ink-soft">Sem preço no Cardmarket.</p>}
              {cm && (
                <dl className="grid grid-cols-1 gap-y-1 text-sm tabular-nums">
                  {([
                    ["Tendência", cm.trend],
                    ["Média de venda", cm.avg],
                    ["Mínimo anunciado", cm.low],
                    ["Média 1 dia", cm.avg1],
                    ["Média 7 dias", cm.avg7],
                    ["Média 30 dias", cm.avg30],
                  ] as const).map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-2 border-b border-line/60 py-1">
                      <dt className="text-ink-soft">{label}</dt>
                      <dd className="text-right">
                        {formatMoney(value, "EUR")}
                        <span className="ml-2 text-xs text-ink-soft">{value ? formatMoney(value * rates.EUR, "BRL") : ""}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="text-xs text-ink-soft">Atualizado em {dateTime(cm?.updated)}</p>
            </section>
          </div>

          {(card.attacks?.length || card.abilities?.length) && (
            <section className="space-y-3 rounded-3xl border border-line bg-surface p-6">
              <h2 className="font-display text-xl font-bold">Na carta</h2>
              {card.abilities?.map((a) => (
                <p key={a.name} className="text-sm"><strong>{a.type}: {a.name}.</strong> {a.effect}</p>
              ))}
              {card.attacks?.map((a) => (
                <p key={a.name} className="text-sm">
                  <strong>{a.name}</strong>
                  {a.damage ? ` · ${a.damage}` : ""}
                  {a.effect ? `. ${a.effect}` : ""}
                </p>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
