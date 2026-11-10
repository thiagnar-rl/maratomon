"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { liga } from "@/lib/liga";
import { addRadarNote, LANGUAGES, MIN_NOTES, radarSummary, radarWeekly, SOURCES, type RadarSummary, type RadarWeek } from "@/lib/radar";
import { CONDITIONS } from "@/lib/collection";
import { useProgress } from "@/lib/progress/hooks";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatMoney, parseBRL } from "@/lib/tcg/prices";

type CardRef = { id: string; name: string; localId: string; official?: number };

const today = () => new Date().toISOString().slice(0, 10);
const shortDate = (iso: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(iso));

/** Radar BR: mediana dos preços que a comunidade viu no Brasil + gráfico semanal + formulário para registrar. */
export function RadarBR({ card, internationalBRL }: { card: CardRef; internationalBRL: number | null }) {
  const { email } = useProgress();
  const [summary, setSummary] = useState<RadarSummary | null | undefined>(undefined);
  const [weeks, setWeeks] = useState<RadarWeek[]>([]);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([radarSummary([card.id]), radarWeekly(card.id)]).then(([s, w]) => {
      if (!active) return;
      setSummary(s[card.id] ?? null);
      setWeeks(w);
    });
    return () => {
      active = false;
    };
  }, [card.id, reload]);

  const gap = summary && internationalBRL ? ((summary.median_brl - internationalBRL) / internationalBRL) * 100 : null;

  return (
    <section className="space-y-4 rounded-3xl border-2 border-accent-2/60 bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-accent">Radar BR 🇧🇷</p>
          <h2 className="font-display text-2xl font-bold">Quanto está saindo no Brasil</h2>
          <p className="text-sm text-ink-soft">Preços em estado NM que a comunidade Maratomon viu em lojas, eventos e trocas (últimos 90 dias).</p>
        </div>
        {summary && (
          <div className="text-right">
            <p className="font-display text-4xl font-extrabold tabular-nums">{formatMoney(summary.median_brl, "BRL")}</p>
            <p className="text-xs text-ink-soft">
              mediana de {summary.notes} registros · {formatMoney(summary.min_brl, "BRL")} a {formatMoney(summary.max_brl, "BRL")}
            </p>
            {gap != null && (
              <p className={`text-xs font-bold ${gap > 0 ? "text-accent" : "text-good"}`}>
                {gap > 0 ? "▲" : "▼"} {Math.abs(gap).toFixed(0)}% {gap > 0 ? "acima" : "abaixo"} do preço lá fora
              </p>
            )}
          </div>
        )}
      </div>

      {summary === undefined && <p className="text-sm text-ink-soft">Carregando o radar…</p>}
      {summary === null && (
        <p className="rounded-2xl bg-surface-2 p-4 text-sm">
          Ainda não há registros suficientes desta carta (mínimo de {MIN_NOTES}). Viu esta carta à venda? Registre abaixo e ajude a
          formar o preço brasileiro.
        </p>
      )}

      {weeks.length > 1 && (
        <div className="h-44 w-full">
          <ResponsiveContainer>
            <AreaChart data={weeks} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-2)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--accent-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="week" tickFormatter={shortDate} tick={{ fill: "var(--ink-soft)", fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => formatMoney(v, "BRL")} tick={{ fill: "var(--ink-soft)", fontSize: 11 }} width={76} domain={["auto", "auto"]} />
              <Tooltip
                labelFormatter={(label) => `Semana de ${shortDate(String(label))}`}
                formatter={(value, _n, item) => [`${formatMoney(Number(value), "BRL")} (${(item.payload as RadarWeek).notes} registros)`, "Mediana"]}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--ink)" }}
              />
              <Area type="monotone" dataKey="median_brl" stroke="var(--accent-2)" strokeWidth={3} fill="url(#radarFill)" dot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {isSupabaseConfigured && (email ? (
        <NoteForm cardId={card.id} onSaved={() => setReload((n) => n + 1)} />
      ) : (
        <p className="text-sm">
          <Link href="/entrar" className="font-bold text-accent underline">Entre</Link> para registrar um preço que você viu.
        </p>
      ))}

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4 text-xs">
        <span className="font-semibold text-ink-soft">Conferir também:</span>
        <a href={liga.card(card)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1.5 font-bold hover:border-ink-soft">Ofertas na Liga Pokémon ↗</a>
        <a href={liga.priceHistory(card)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1.5 font-bold hover:border-ink-soft">Histórico na Liga ↗</a>
        <a href={`https://lista.mercadolivre.com.br/${encodeURIComponent(`carta pokemon ${card.name} ${card.localId}`).replace(/%20/g, "-")}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1.5 font-bold hover:border-ink-soft">Mercado Livre ↗</a>
        <a href={liga.decksWithCard(card)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1.5 font-bold hover:border-ink-soft">Decks com esta carta ↗</a>
      </div>
    </section>
  );
}

function NoteForm({ cardId, onSaved }: { cardId: string; onSaved: () => void }) {
  const [price, setPrice] = useState("");
  const [language, setLanguage] = useState<string>("PT");
  const [condition, setCondition] = useState<string>("NM");
  const [source, setSource] = useState<string>("loja");
  const [date, setDate] = useState(today());
  const [state, setState] = useState<{ kind: "idle" | "saving" | "ok" | "error"; message?: string }>({ kind: "idle" });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = parseBRL(price);
    if (!value) return setState({ kind: "error", message: "Informe um preço válido, ex.: 149,90" });
    setState({ kind: "saving" });
    try {
      await addRadarNote({ card_id: cardId, price_brl: value, language, condition, source, observed_on: date });
      setPrice("");
      setState({ kind: "ok", message: "Obrigado! Seu registro entrou no Radar BR." });
      onSaved();
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Não foi possível salvar." });
    }
  }

  const field = "w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm";
  return (
    <form onSubmit={handleSubmit} className="grid gap-2 rounded-2xl bg-surface-2 p-4 sm:grid-cols-6">
      <p className="text-sm font-bold sm:col-span-6">Vi esta carta à venda por…</p>
      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Preço (R$)</span>
        <input inputMode="decimal" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="149,90" className={field} />
      </label>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Idioma</span>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className={field}>{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select>
      </label>
      <label>
        <span className="text-xs font-semibold text-ink-soft">Estado</span>
        <select value={condition} onChange={(e) => setCondition(e.target.value)} className={field}>{CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select>
      </label>
      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Onde</span>
        <select value={source} onChange={(e) => setSource(e.target.value)} className={field}>{SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
      </label>
      <label className="sm:col-span-2">
        <span className="text-xs font-semibold text-ink-soft">Quando</span>
        <input type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} className={field} />
      </label>
      <div className="flex items-end sm:col-span-4">
        <button type="submit" disabled={state.kind === "saving"} className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink disabled:opacity-60">
          {state.kind === "saving" ? "Registrando…" : "Registrar no Radar BR"}
        </button>
      </div>
      {state.message && <p role="status" className={`text-sm sm:col-span-6 ${state.kind === "error" ? "text-accent" : "text-good"}`}>{state.message}</p>}
      <p className="text-[11px] text-ink-soft sm:col-span-6">Seu nome nunca aparece: o público vê só a mediana. Só entram no cálculo cartas em estado NM.</p>
    </form>
  );
}
