import type { Metadata } from "next";
import Link from "next/link";
import { getMarket, type MarketRow } from "@/lib/tcg/market";
import { cardImage, formatMoney, formatPct } from "@/lib/tcg/prices";
import { CardTile } from "@/components/tcg/card-tile";

export const revalidate = 10800;

export const metadata: Metadata = {
  title: "Mercado de cartas Pokémon hoje: altas, baixas e mais valiosas",
  description: "Painel do mercado Pokémon TCG em real e dólar: câmbio do dia, maiores altas e baixas da semana e as cartas mais valiosas.",
};

function Pct({ value }: { value: number | null }) {
  if (value == null) return <span className="text-ink-soft">—</span>;
  const up = value >= 0;
  return <span className={`font-bold tabular-nums ${up ? "text-good" : "text-[#ff5c8a]"}`}>{up ? "▲" : "▼"} {formatPct(value).replace(/^[+−]/, "")}</span>;
}

function MoverTable({ id, title, rows, subtitle }: { id: string; title: string; subtitle: string; rows: MarketRow[] }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-40 space-y-3 rounded-[2rem] border border-line bg-surface p-6">
      <div>
        <h2 id={`${id}-t`} className="font-display text-2xl font-extrabold">{title}</h2>
        <p className="text-sm text-ink-soft">{subtitle}</p>
      </div>
      <ol className="divide-y divide-line">
        {rows.map((r, i) => (
          <li key={r.id}>
            <Link href={`/tcg/cartas/${r.id}`} className="flex items-center gap-3 rounded-xl py-2.5 transition hover:bg-surface-2">
              <span className="w-6 text-center font-display text-lg font-extrabold text-ink-soft">{i + 1}</span>
              {cardImage(r.image, "low") ? (
                <img src={cardImage(r.image, "low")!} alt="" loading="lazy" className="h-14 w-10 shrink-0 rounded-md object-cover shadow" />
              ) : (
                <span className="h-14 w-10 shrink-0 rounded-md bg-surface-2" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{r.name}</span>
                <span className="block truncate text-xs text-ink-soft">
                  {r.setName} · #{r.localId}
                </span>
              </span>
              <span className="text-right text-sm tabular-nums">
                <span className="block font-bold">{formatMoney(r.brl, "BRL")}</span>
                <span className="block text-xs text-ink-soft">{formatMoney(r.usd ?? null, "USD")}</span>
              </span>
              <span className="w-20 text-right text-sm">
                <Pct value={r.change7d} />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function MarketPage() {
  const { rows, rates } = await getMarket();
  const withChange = rows.filter((r) => r.change7d != null);
  const gainers = [...withChange].sort((a, b) => b.change7d! - a.change7d!).filter((r) => r.change7d! > 0).slice(0, 10);
  const losers = [...withChange].sort((a, b) => a.change7d! - b.change7d!).filter((r) => r.change7d! < 0).slice(0, 10);
  const valuable = [...rows].sort((a, b) => (b.brl ?? 0) - (a.brl ?? 0)).slice(0, 12);
  const index = withChange.length ? withChange.reduce((s, r) => s + r.change7d!, 0) / withChange.length : null;
  const updated = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date());

  const fx = [
    { label: "Dólar", sub: "USD → BRL", value: rates.USD, change: rates.USDchange ?? null },
    { label: "Euro", sub: "EUR → BRL", value: rates.EUR, change: rates.EURchange ?? null },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-accent">Mercado</p>
          <h1 className="font-display text-5xl font-extrabold tracking-tight">Painel do mercado</h1>
          <p className="text-ink-soft">
            {rows.length} cartas mais disputadas acompanhadas em real e dólar · atualizado em {updated}
          </p>
        </div>
      </header>

      <section id="cambio" aria-label="Câmbio e índice" className="grid scroll-mt-40 gap-4 sm:grid-cols-3">
        {fx.map((f) => (
          <div key={f.label} className="rounded-[2rem] border border-line bg-surface p-5">
            <p className="text-sm font-bold text-ink-soft">
              {f.label} hoje <span className="font-normal">· {f.sub}</span>
            </p>
            <p className="font-display text-4xl font-extrabold tabular-nums">R$ {f.value.toFixed(2).replace(".", ",")}</p>
            <p className="text-sm">
              <Pct value={f.change} /> <span className="text-ink-soft">no dia</span>
            </p>
          </div>
        ))}
        <div className="rounded-[2rem] border border-line bg-gradient-to-br from-accent/25 to-surface p-5">
          <p className="text-sm font-bold text-ink-soft">Índice Maratomon (7 dias)</p>
          <p className="font-display text-4xl font-extrabold">
            <Pct value={index} />
          </p>
          <p className="text-sm text-ink-soft">Variação média das cartas acompanhadas.</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <MoverTable id="altas" title="📈 Maiores altas" subtitle="Quem mais valorizou na semana (Cardmarket)." rows={gainers} />
        <MoverTable id="baixas" title="📉 Maiores baixas" subtitle="Quem mais desvalorizou na semana (Cardmarket)." rows={losers} />
      </div>

      <section id="valiosas" aria-labelledby="valiosas-t" className="scroll-mt-40 space-y-4">
        <h2 id="valiosas-t" className="font-display text-3xl font-extrabold">💎 Mais valiosas hoje</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {valuable.map((r) => (
            <li key={r.id}>
              <CardTile card={{ id: r.id, name: r.name, localId: r.localId, image: r.image }} subtitle={r.setName} price={r} />
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-ink-soft">
        Fontes: TCGplayer (EUA) e Cardmarket (Europa) via TCGdex; câmbio AwesomeAPI. Valores em real são conversões pela cotação do dia; para preços
        praticados no Brasil, veja o Termômetro Brasil e a Liga Pokémon.
      </p>
    </div>
  );
}
