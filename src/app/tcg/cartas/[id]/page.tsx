import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCard, getRates } from "@/lib/tcg/api";
import { getHistory, recordPrice } from "@/lib/tcg/history";
import { cardImage, cardmarketSeries, estimateBRL, formatMoney, formatPct, priceSnapshot, setLogo, tcgplayerVariants, variantLabel } from "@/lib/tcg/prices";
import { typeColors } from "@/lib/pokemon";
import { liga } from "@/lib/liga";
import { CardPlaceholder } from "@/components/tcg/card-placeholder";
import { CardActions } from "@/components/tcg/card-actions";
import { RadarBR } from "@/components/tcg/radar-br";
import { HoloCard } from "@/components/tcg/holo-card";
import { PriceHistoryChart, type ChartPoint } from "@/components/tcg/price-history-chart";
import { Energy, TYPE_PT } from "@/components/tcg/energy";

type Props = { params: Promise<{ id: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = await getCard((await params).id);
  if (!card) return { title: "Carta não encontrada" };
  return {
    title: `${card.name} (${card.set.name}) – preço hoje em reais`,
    description: `Quanto vale ${card.name} #${card.localId} de ${card.set.name}: preço do dia em real e dólar, histórico, oscilação e ficha completa.`,
  };
}

const dateTime = (iso?: string) =>
  iso ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(iso)) : "—";
const dayLabel = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

const STAGE: Record<string, string> = { Basic: "Básico", Stage1: "Estágio 1", Stage2: "Estágio 2", BREAK: "BREAK", "LEVEL-UP": "Nível X", VMAX: "VMAX", VSTAR: "V-ASTRO", MEGA: "Mega" };
const CATEGORY: Record<string, string> = { Pokemon: "Pokémon", Trainer: "Treinador", Energy: "Energia" };

function Change({ label, value }: { label: string; value: number | null | undefined }) {
  const up = (value ?? 0) >= 0;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${value == null ? "bg-surface-2 text-ink-soft" : up ? "bg-good/15 text-good" : "bg-[#ff5c8a]/15 text-[#ff5c8a]"}`}>
      {label}
      <span className="tabular-nums">{value == null ? "—" : `${up ? "▲" : "▼"} ${formatPct(value).replace(/^[+−]/, "")}`}</span>
    </span>
  );
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-3">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">{label}</dt>
      <dd className="mt-1 flex flex-wrap items-center gap-1.5 font-semibold">{children}</dd>
    </div>
  );
}

export default async function CardPage({ params }: Props) {
  const [card, rates] = await Promise.all([getCard((await params).id), getRates()]);
  if (!card) notFound();

  const image = cardImage(card.image, "high");
  const snap = priceSnapshot(card, rates);
  const estimate = estimateBRL(card, rates);
  const variants = tcgplayerVariants(card.pricing);
  const cm = card.pricing?.cardmarket;
  const typeColor = card.types?.[0] ? typeColors[card.types[0]] : undefined;

  await recordPrice(card.id, snap, rates.USD);
  const history = await getHistory(card.id);
  const points: ChartPoint[] = history.map((p) => ({ day: p.day, label: dayLabel(p.day), brl: p.brl, usd: p.usd }));
  if (points.at(-1)?.day !== today() && (snap.brl != null || snap.usd != null)) {
    points.push({ day: today(), label: "Hoje", brl: snap.brl, usd: snap.usd });
  }
  const fallback: ChartPoint[] = cardmarketSeries(card.pricing, rates).map((p) => ({
    day: p.label,
    label: p.label,
    brl: p.brl,
    usd: Math.round((p.brl / rates.USD) * 100) / 100,
  }));

  const ext = card.variants_detailed?.find((v) => v.thirdParty?.tcgplayer || v.thirdParty?.cardmarket)?.thirdParty;
  const ligaRef = { name: card.name, localId: card.localId, official: card.set.cardCount.official };
  const markets = [
    ext?.tcgplayer && { label: "TCGplayer", href: `https://www.tcgplayer.com/product/${ext.tcgplayer}`, note: "EUA · US$" },
    { label: "Cardmarket", href: `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(card.name)}`, note: "Europa · €" },
    { label: "Liga Pokémon", href: liga.card(ligaRef), note: "Brasil · R$" },
  ].filter(Boolean) as { label: string; href: string; note: string }[];

  const variantNames = Object.entries(card.variants ?? {})
    .filter(([, on]) => on)
    .map(([k]) => ({ normal: "Normal", reverse: "Reverse holo", holo: "Holo", firstEdition: "1ª edição", wPromo: "Promo W" })[k] ?? k);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <nav aria-label="Navegação" className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink-soft">
        <Link href="/tcg" className="hover:text-ink">TCG</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/tcg/colecoes/${card.set.id}`} className="hover:text-ink">{card.set.name}</Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink">{card.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
        {/* Coluna da carta */}
        <div className="space-y-4 lg:sticky lg:top-40 lg:self-start">
          <HoloCard strong className="mx-auto max-w-[320px] lg:max-w-none" faceClassName="rounded-[1.4rem] shadow-2xl">
            <div style={{ boxShadow: typeColor ? `0 30px 80px -30px ${typeColor}` : undefined }}>
              {image ? (
                <img src={image} alt={card.name} className="w-full" />
              ) : (
                <div className="aspect-[5/7]">
                  <CardPlaceholder name={card.name} size="lg" />
                </div>
              )}
            </div>
          </HoloCard>
          <p className="text-center text-xs text-ink-soft">↔ Segure e arraste a carta para girar e ver o verso</p>
          <CardActions card={{ id: card.id, name: card.name, set: card.set.name, image: cardImage(card.image, "low") }} />
          <div className="grid grid-cols-3 gap-2">
            {markets.map((m) => (
              <a key={m.label} href={m.href} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-line bg-surface p-2.5 text-center transition hover:border-accent">
                <span className="block text-sm font-bold">{m.label} ↗</span>
                <span className="block text-[11px] text-ink-soft">{m.note}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Coluna das informações */}
        <div className="min-w-0 space-y-6">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              {card.types?.map((t) => (
                <span key={t} className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-white" style={{ background: typeColors[t] ?? "var(--ink-soft)" }}>
                  <Energy type={t} size="sm" /> {TYPE_PT[t] ?? t}
                </span>
              ))}
              {card.rarity && <span className="rounded-full bg-accent-2 px-3 py-1 text-black">{card.rarity}</span>}
              <span className="rounded-full bg-surface-2 px-3 py-1">
                #{card.localId}/{card.set.cardCount.official}
              </span>
            </div>
            <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">{card.name}</h1>
            <Link href={`/tcg/colecoes/${card.set.id}`} className="inline-flex items-center gap-3 rounded-2xl bg-surface-2 px-3 py-2 text-sm font-semibold hover:bg-line">
              {setLogo(card.set.logo) && <img src={setLogo(card.set.logo)!} alt="" className="h-7 w-auto" />}
              {card.set.name}
            </Link>
          </header>

          {/* Preço do dia */}
          <section aria-labelledby="preco" className="overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-accent/20 via-surface to-surface">
            <div className="grid gap-px bg-line sm:grid-cols-2">
              <div className="space-y-1 bg-surface/90 p-6">
                <p id="preco" className="text-sm font-bold text-ink-soft">Preço hoje em reais</p>
                <p className="font-display text-5xl font-extrabold tabular-nums">{snap.brl != null ? formatMoney(snap.brl, "BRL") : "Sem preço"}</p>
                <p className="text-xs text-ink-soft">{estimate ? `Base: ${estimate.source}, convertido pela cotação de hoje` : "Ainda sem negociações registradas"}</p>
              </div>
              <div className="space-y-1 bg-surface/90 p-6">
                <p className="text-sm font-bold text-ink-soft">Preço hoje em dólar</p>
                <p className="font-display text-5xl font-extrabold tabular-nums">{snap.usd != null ? formatMoney(snap.usd, "USD") : "—"}</p>
                <p className="text-xs text-ink-soft">Europa: {formatMoney(snap.eur, "EUR")}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-line bg-surface/90 px-6 py-4">
              <Change label="7 dias" value={snap.change7d} />
              <Change label="30 dias" value={snap.change30d} />
              <span className="ml-auto text-xs text-ink-soft tabular-nums">
                US$ 1 = R$ {rates.USD.toFixed(2)}
                {rates.USDchange != null && <span className={rates.USDchange >= 0 ? "text-good" : "text-[#ff5c8a]"}> ({formatPct(rates.USDchange)} hoje)</span>}
                {" · "}€ 1 = R$ {rates.EUR.toFixed(2)}
                {rates.fallback && " (aproximada)"}
              </span>
            </div>
          </section>

          <section aria-labelledby="historico" className="space-y-3 rounded-[2rem] border border-line bg-surface p-6">
            <h2 id="historico" className="font-display text-xl font-extrabold">Oscilação do preço</h2>
            <PriceHistoryChart history={points} fallback={fallback} />
          </section>

          <RadarBR card={{ id: card.id, name: card.name, localId: card.localId, official: card.set.cardCount.official }} internationalBRL={snap.brl} />

          {/* Ficha técnica */}
          <section aria-labelledby="ficha" className="space-y-4 rounded-[2rem] border border-line bg-surface p-6">
            <h2 id="ficha" className="font-display text-xl font-extrabold">Ficha técnica</h2>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Spec label="Categoria">{CATEGORY[card.category] ?? card.category}</Spec>
              {card.stage && <Spec label="Estágio">{STAGE[card.stage] ?? card.stage}</Spec>}
              {card.evolveFrom && <Spec label="Evolui de">{card.evolveFrom}</Spec>}
              {card.hp && <Spec label="HP">{card.hp}</Spec>}
              {card.types?.length ? (
                <Spec label="Tipo">
                  {card.types.map((t) => (
                    <span key={t} className="flex items-center gap-1">
                      <Energy type={t} size="sm" />
                      <span aria-hidden="true">{TYPE_PT[t] ?? t}</span>
                    </span>
                  ))}
                </Spec>
              ) : null}
              {card.weaknesses?.length ? (
                <Spec label="Fraqueza">
                  {card.weaknesses.map((w) => (
                    <span key={w.type} className="flex items-center gap-1">
                      <Energy type={w.type} size="sm" /> {w.value}
                    </span>
                  ))}
                </Spec>
              ) : null}
              {card.resistances?.length ? (
                <Spec label="Resistência">
                  {card.resistances.map((w) => (
                    <span key={w.type} className="flex items-center gap-1">
                      <Energy type={w.type} size="sm" /> {w.value}
                    </span>
                  ))}
                </Spec>
              ) : null}
              {card.retreat != null && (
                <Spec label="Custo de recuo">
                  {card.retreat === 0 ? "Grátis" : Array.from({ length: card.retreat }, (_, i) => <Energy key={i} type="Colorless" size="sm" />)}
                </Spec>
              )}
              {card.trainerType && <Spec label="Tipo de treinador">{card.trainerType}</Spec>}
              {card.energyType && <Spec label="Tipo de energia">{card.energyType}</Spec>}
              {card.rarity && <Spec label="Raridade">{card.rarity}</Spec>}
              <Spec label="Número">
                {card.localId}/{card.set.cardCount.official}
              </Spec>
              {card.illustrator && <Spec label="Ilustrador">{card.illustrator}</Spec>}
              {card.regulationMark && <Spec label="Marca de regulamento">{card.regulationMark}</Spec>}
              {card.legal && (
                <Spec label="Legalidade">
                  <span className={card.legal.standard ? "text-good" : "text-ink-soft"}>Standard {card.legal.standard ? "✓" : "✗"}</span>
                  <span className={card.legal.expanded ? "text-good" : "text-ink-soft"}>Expanded {card.legal.expanded ? "✓" : "✗"}</span>
                </Spec>
              )}
              {variantNames.length > 0 && <Spec label="Versões">{variantNames.join(", ")}</Spec>}
              {card.dexId?.length ? <Spec label="Pokédex nacional">{card.dexId.map((d) => `#${String(d).padStart(4, "0")}`).join(", ")}</Spec> : null}
            </dl>
            {card.description && <p className="rounded-2xl bg-surface-2 p-4 text-sm italic text-ink-soft">“{card.description}”</p>}
          </section>

          {(card.abilities?.length || card.attacks?.length || card.effect || card.item) && (
            <section aria-labelledby="na-carta" className="space-y-3 rounded-[2rem] border border-line bg-surface p-6">
              <h2 id="na-carta" className="font-display text-xl font-extrabold">Habilidades e ataques</h2>
              {card.abilities?.map((a) => (
                <div key={a.name} className="rounded-2xl border border-[#ff5c8a]/40 bg-[#ff5c8a]/5 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-[#ff5c8a]">{a.type}</p>
                  <p className="font-bold">{a.name}</p>
                  <p className="text-sm text-ink-soft">{a.effect}</p>
                </div>
              ))}
              {card.item && (
                <div className="rounded-2xl bg-surface-2 p-4">
                  <p className="font-bold">{card.item.name}</p>
                  <p className="text-sm text-ink-soft">{card.item.effect}</p>
                </div>
              )}
              {card.attacks?.map((a) => (
                <div key={a.name} className="flex gap-3 rounded-2xl bg-surface-2 p-4">
                  <span className="flex shrink-0 gap-0.5 pt-0.5">
                    {(a.cost?.length ? a.cost : ["Colorless"]).map((c, i) => (
                      <Energy key={i} type={c} size="sm" />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-bold">{a.name}</span>
                      {a.damage != null && <span className="font-display text-xl font-extrabold">{a.damage}</span>}
                    </span>
                    {a.effect && <span className="block text-sm text-ink-soft">{a.effect}</span>}
                  </span>
                </div>
              ))}
              {card.effect && <p className="rounded-2xl bg-surface-2 p-4 text-sm">{card.effect}</p>}
            </section>
          )}

          {/* Detalhe dos mercados */}
          <div className="grid gap-4 md:grid-cols-2">
            <section className="space-y-3 rounded-[2rem] border border-line bg-surface p-6">
              <h2 className="font-display text-lg font-extrabold">TCGplayer (EUA)</h2>
              {variants.length === 0 && <p className="text-sm text-ink-soft">Sem preço no TCGplayer.</p>}
              {variants.map(([key, v]) => (
                <div key={key} className="space-y-1">
                  <p className="text-sm font-bold">{variantLabel(key)}</p>
                  <dl className="space-y-0.5 text-sm tabular-nums">
                    {(
                      [
                        ["Mercado", v.marketPrice],
                        ["Menor anúncio", v.lowPrice],
                        ["Médio", v.midPrice],
                        ["Maior anúncio", v.highPrice],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-2 border-b border-line/60 py-1">
                        <dt className="text-ink-soft">{label}</dt>
                        <dd className="text-right">
                          {formatMoney(value, "USD")} <span className="text-xs text-ink-soft">{value ? `· ${formatMoney(value * rates.USD, "BRL")}` : ""}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
              <p className="text-xs text-ink-soft">Atualizado em {dateTime(card.pricing?.tcgplayer?.updated as string | undefined)}</p>
            </section>

            <section className="space-y-3 rounded-[2rem] border border-line bg-surface p-6">
              <h2 className="font-display text-lg font-extrabold">Cardmarket (Europa)</h2>
              {!cm && <p className="text-sm text-ink-soft">Sem preço no Cardmarket.</p>}
              {cm && (
                <dl className="space-y-0.5 text-sm tabular-nums">
                  {(
                    [
                      ["Tendência", cm.trend],
                      ["Média de venda", cm.avg],
                      ["Menor anúncio", cm.low],
                      ["Média de ontem", cm.avg1],
                      ["Média 7 dias", cm.avg7],
                      ["Média 30 dias", cm.avg30],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-2 border-b border-line/60 py-1">
                      <dt className="text-ink-soft">{label}</dt>
                      <dd className="text-right">
                        {formatMoney(value, "EUR")} <span className="text-xs text-ink-soft">{value ? `· ${formatMoney(value * rates.EUR, "BRL")}` : ""}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="text-xs text-ink-soft">Atualizado em {dateTime(cm?.updated)}</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
