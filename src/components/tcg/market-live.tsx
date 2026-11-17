"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MarketRow } from "@/lib/tcg/market";
import type { Rates } from "@/lib/tcg/types";
import { featuredCardIds } from "@/lib/tcg/featured";
import { cardImage, formatMoney, formatPct } from "@/lib/tcg/prices";
import { CardTile } from "./card-tile";
import { MarketDashboard } from "./market-dashboard";
import { MoversBoard, ago, type LiveMarket } from "./movers-board";

type Market = { rows: MarketRow[]; rates: Rates; updatedAt: string };

const REFRESH_MS = 5 * 60 * 1000;

function Pct({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-ink-soft">—</span>;
  const up = value >= 0;
  return <span className={`font-bold tabular-nums ${up ? "text-good" : "text-[#ff5c8a]"}`}>{up ? "▲" : "▼"} {formatPct(value).replace(/^[+−]/, "")}</span>;
}

/** Busca o mercado de novo a cada 5 minutos (e quando a aba volta a ficar visível). */
function useLiveMarket(initial: Market) {
  const [market, setMarket] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => new Date(initial.updatedAt).getTime());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tcg/mercado", { cache: "no-store" });
      if (response.ok) setMarket((await response.json()) as Market);
    } catch {
      // mantém os últimos dados
    } finally {
      setLoading(false);
      setNow(Date.now());
    }
  }, []);

  useEffect(() => {
    const poll = setInterval(refresh, REFRESH_MS);
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - new Date(market.updatedAt).getTime() > REFRESH_MS) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, market.updatedAt]);

  return { market, loading, now, refresh };
}

/** Mercado ao vivo: cards em alta/queda, painel (câmbio, índice, TCGplayer × Cardmarket) e mais caros do dia. */
export function MarketLive({ initial }: { initial: Market }) {
  const live = useLiveMarket(initial);
  const { market, now } = live;
  const { rows, rates } = market;

  const withWeek = rows.filter((r) => r.change.semana != null);
  const index = withWeek.length ? withWeek.reduce((s, r) => s + r.change.semana!, 0) / withWeek.length : null;
  const up = rows.filter((r) => (r.change.dia ?? 0) > 0).length;
  const down = rows.filter((r) => (r.change.dia ?? 0) < 0).length;
  const priciest = useMemo(() => [...rows].sort((a, b) => (b.brl ?? 0) - (a.brl ?? 0)).slice(0, 12), [rows]);
  const classics = useMemo(
    () =>
      rows
        .filter((r) => featuredCardIds.includes(r.id))
        .map((r) => ({ id: r.id, name: r.name, set: r.setName, image: cardImage(r.image, "low"), usd: r.usd, eur: r.eurTrend, eur30: r.eur30 })),
    [rows],
  );

  const fx = [
    { label: "Dólar", sub: "USD → BRL", value: rates.USD, change: rates.USDchange },
    { label: "Euro", sub: "EUR → BRL", value: rates.EUR, change: rates.EURchange },
  ];

  return (
    <div className="space-y-12">
      <MoversBoard live={live as LiveMarket} />

      <section id="painel" aria-labelledby="painel-t" className="scroll-mt-40 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="painel-t" className="font-display text-3xl font-extrabold">📊 Painel do mercado</h2>
          <p className="text-sm text-ink-soft">Atualizado {ago(market.updatedAt, now)}</p>
        </div>
        <div id="cambio" className="grid scroll-mt-40 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <p className="text-sm text-ink-soft">Variação média de {rows.length} cartas.</p>
          </div>
          <div className="rounded-[2rem] border border-line bg-surface p-5">
            <p className="text-sm font-bold text-ink-soft">Hoje no mercado</p>
            <p className="font-display text-4xl font-extrabold tabular-nums">
              <span className="text-good">{up}</span>
              <span className="text-ink-soft"> / </span>
              <span className="text-[#ff5c8a]">{down}</span>
            </p>
            <p className="text-sm text-ink-soft">cartas subindo / caindo no dia</p>
          </div>
        </div>
        {classics.length > 0 && <MarketDashboard rows={classics} rates={rates} />}
      </section>

      <section id="valiosas" aria-labelledby="valiosas-t" className="scroll-mt-40 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="valiosas-t" className="font-display text-3xl font-extrabold">💎 Cards mais caros do dia</h2>
          <p className="text-sm text-ink-soft">
            Top 12 somam <strong className="text-ink tabular-nums">{formatMoney(priciest.reduce((s, r) => s + (r.brl ?? 0), 0), "BRL")}</strong>
          </p>
        </div>
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {priciest.map((r, i) => (
            <li key={r.id} className="relative">
              <span className="absolute left-2 top-2 z-10 grid size-7 place-items-center rounded-full bg-accent-2 font-display text-sm font-extrabold text-black shadow-lg">{i + 1}</span>
              <CardTile card={{ id: r.id, name: r.name, localId: r.localId, image: r.image }} subtitle={r.setName} price={{ ...r, change7d: r.change.dia ?? r.change7d }} changeTitle="Variação no dia" />
            </li>
          ))}
        </ol>
      </section>

      <p className="text-xs text-ink-soft">
        Fontes: TCGplayer (EUA) e Cardmarket (Europa) via TCGdex; câmbio AwesomeAPI. Tudo se atualiza sozinho a cada 5 minutos. Valores em real são conversões pela cotação do dia.
      </p>
    </div>
  );
}
