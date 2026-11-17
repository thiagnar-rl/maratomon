import { formatMoney, formatPct, type MarketplaceQuote } from "@/lib/tcg/prices";
import type { MypProduct } from "@/lib/tcg/mypcards";
import type { Pricing, Rates } from "@/lib/tcg/types";

const COLS = [
  { key: "min", label: "Menor", bar: "bg-good", text: "text-good" },
  { key: "avg", label: "Médio", bar: "bg-[#ff9f43]", text: "text-[#ff9f43]" },
  { key: "max", label: "Maior", bar: "bg-[#ff5c8a]", text: "text-[#ff5c8a]" },
] as const;

function Cell({ value, bar, sub }: { value: number | null; bar: string; sub?: string | null }) {
  return (
    <div className="flex items-stretch gap-2">
      <span className={`w-1 shrink-0 rounded-full ${value != null ? bar : "bg-line"}`} aria-hidden="true" />
      <span className="min-w-0">
        <span className="block font-bold tabular-nums">{value != null ? formatMoney(value, "BRL") : "—"}</span>
        {sub && <span className="block text-[11px] text-ink-soft tabular-nums">{sub}</span>}
      </span>
    </div>
  );
}

function Row({ label, values, subs, strong = false }: { label: React.ReactNode; values: (number | null)[]; subs?: (string | null)[]; strong?: boolean }) {
  return (
    <div className={`grid grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))] items-center gap-3 rounded-2xl px-4 py-3 text-sm ${strong ? "bg-accent/15" : "bg-surface-2"}`}>
      <span className={`min-w-0 ${strong ? "font-black" : "font-semibold"}`}>{label}</span>
      {COLS.map((c, i) => (
        <Cell key={c.key} value={values[i]} bar={c.bar} sub={subs?.[i]} />
      ))}
    </div>
  );
}

/** Tabela de preços dos marketplaces: menor, médio e maior, em reais (estilo das lojas de cartas). */
export function MarketplacePrices({ quote, rates, cm, br }: { quote: MarketplaceQuote; rates: Rates; cm?: Pricing["cardmarket"]; br?: MypProduct | null }) {
  if (quote.rows.length === 0 && !br) return null;
  const toBRL = (v: number | null, cur: "USD" | "EUR") => (v != null ? v * rates[cur] : null);
  const recent = cm && [cm.avg1, cm.avg7, cm.avg30].some((v) => typeof v === "number" && v > 0);

  return (
    <section aria-labelledby="marketplaces" className="space-y-3 rounded-[2rem] border border-line bg-surface p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="marketplaces" className="font-display text-xl font-extrabold">Preço de venda nos marketplaces</h2>
        <span className="flex gap-3 text-xs font-bold">
          {COLS.map((c) => (
            <span key={c.key} className={`flex items-center gap-1 ${c.text}`}>
              <span className={`size-2 rounded-full ${c.bar}`} />
              {c.label}
            </span>
          ))}
        </span>
      </div>

      <div className="space-y-2">
        {br && (
          <Row
            label={
              <>
                🇧🇷 Brasil · MYP Cards
                <span className="block text-[11px] font-normal text-ink-soft">{br.offers ? `${br.offers} ofertas` : "lojas brasileiras"}</span>
              </>
            }
            values={[br.low, br.avg, br.max]}
            strong
          />
        )}
        {quote.rows.length > 0 && <Row label="🌎 Média internacional" values={[quote.min, quote.avg, quote.max]} strong={!br} />}
        {quote.rows.map((r) => (
          <Row
            key={r.label}
            label={
              <>
                {r.label}
                <span className="block text-[11px] font-normal text-ink-soft">{r.currency === "USD" ? "EUA" : "Europa"}</span>
              </>
            }
            values={[toBRL(r.min, r.currency), toBRL(r.avg, r.currency), toBRL(r.max, r.currency)]}
            subs={[r.min, r.avg, r.max].map((v) => (v != null ? formatMoney(v, r.currency) : null))}
          />
        ))}
      </div>

      {br && (
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-2xl bg-surface-2 px-4 py-3">
            <span className="block text-xs text-ink-soft">Último vendido no Brasil{br.lastSoldNote ? ` (${br.lastSoldNote})` : ""}</span>
            <span className="block font-bold tabular-nums">{br.lastSold != null ? formatMoney(br.lastSold, "BRL") : "—"}</span>
          </div>
          <div className="rounded-2xl bg-surface-2 px-4 py-3">
            <span className="block text-xs text-ink-soft">Mediana no Brasil · 30 dias</span>
            <span className={`block font-bold tabular-nums ${br.trend30d == null ? "" : br.trend30d >= 0 ? "text-good" : "text-[#ff5c8a]"}`}>
              {br.trend30d == null ? "—" : `${br.trend30d >= 0 ? "▲" : "▼"} ${formatPct(br.trend30d).replace(/^[+−]/, "")}`}
            </span>
          </div>
          <a href={br.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-2xl bg-accent px-4 py-3 text-center font-bold text-white hover:opacity-90">
            Ver ofertas no MYP Cards ↗
          </a>
        </div>
      )}

      {recent && (
        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-black">Vendas recentes (Cardmarket)</h3>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {(
              [
                ["Ontem", cm!.avg1],
                ["Média 7 dias", cm!.avg7],
                ["Média 30 dias", cm!.avg30],
              ] as const
            ).map(([label, v]) => (
              <div key={label} className="rounded-2xl bg-surface-2 px-4 py-3">
                <span className="block text-xs text-ink-soft">{label}</span>
                <span className="block font-bold tabular-nums">{typeof v === "number" && v > 0 ? formatMoney(v * rates.EUR, "BRL") : "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-ink-soft">
        Brasil: menor anúncio, preço médio dos anúncios e maior oferta no MYP Cards (atualizado a cada 6 h). Internacional: TCGplayer (EUA) e Cardmarket (Europa)
        convertidos pela cotação de hoje. O preço do site é o menor anúncio no Brasil; sem oferta no Brasil, a média internacional.
      </p>
    </section>
  );
}
