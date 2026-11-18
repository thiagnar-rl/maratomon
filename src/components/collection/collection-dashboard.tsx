"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { createCollection, KIND_LABEL, unitValue, type Collection, type CollectionKind } from "@/lib/collection";
import { computeStats, patchLocal, refreshCollection, useCollectionData, type CollectionStats, type SetProgress } from "@/lib/collection-store";
import { LANG_FLAG, LANG_NAME, normNumber, splitCardId } from "@/lib/tcg/card-ref";
import { formatMoney } from "@/lib/tcg/prices";
import { RequireLogin } from "./require-login";
import { Delta, Money, ProgressBar, useHideValues } from "./ui";
import { ExportSheet } from "./export-sheet";
import { TcgAchievementsStrip } from "./tcg-achievements";

const PALETTE = ["#8b5cf6", "#3d7dca", "#ffcb05", "#10b39a", "#e3350d", "#ff7a1f", "#5b6cff", "#c03dff"];
const tooltipStyle = { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--ink)" };

export function CollectionDashboard() {
  return (
    <RequireLogin>
      <Dashboard />
    </RequireLogin>
  );
}

type Tab = "colecoes" | "pastas" | "desejos" | "graficos";

function Dashboard() {
  const data = useCollectionData();
  const stats = useMemo(() => computeStats(data), [data]);
  const [hidden, toggleHidden] = useHideValues();
  const [tab, setTab] = useState<Tab>("colecoes");
  const [exporting, setExporting] = useState(false);

  if (data.status === "loading" || data.status === "idle") return <DashboardSkeleton />;
  if (data.status === "error") return <p role="alert" className="rounded-3xl border border-line bg-surface p-6 text-accent">{data.error}</p>;

  const empty = data.cards.length === 0;
  const tabs: [Tab, string, number][] = [
    ["colecoes", "Coleções", stats.sets.length],
    ["pastas", "Pastas e decks", data.collections.filter((c) => c.kind !== "desejos").length],
    ["desejos", "Desejos e alertas", stats.alerts.length || stats.wanted.length],
    ["graficos", "Gráficos", 0],
  ];

  return (
    <div className="space-y-6 pb-24">
      <Hero stats={stats} hidden={hidden} onToggleHidden={toggleHidden} pricesReady={data.pricesReady} updatedAt={data.updatedAt} />

      <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
        <ActionButton href="/colecao/escanear" icon="📷" label="Escanear" primary />
        <ActionButton href="/colecao/importar" icon="⬆️" label="Importar" />
        <ActionButton onClick={() => setExporting(true)} icon="⬇️" label="Exportar" />
        <ActionButton onClick={() => setExporting(true)} icon="🔗" label="Compartilhar" />
      </div>

      {empty ? (
        <EmptyState />
      ) : (
        <>
          <TcgAchievementsStrip />
          <div className="sticky top-[4.25rem] z-20 -mx-4 overflow-x-auto bg-bg/85 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-full sm:px-1">
            <div role="tablist" className="flex w-max gap-1 rounded-full bg-surface-2 p-1">
              {tabs.map(([key, label, n]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className="rounded-full px-4 py-2 text-sm font-bold text-ink-soft transition aria-selected:bg-accent aria-selected:text-white aria-selected:shadow"
                >
                  {label}
                  {n > 0 && <span className="ml-1.5 rounded-full bg-black/15 px-1.5 text-xs">{n}</span>}
                </button>
              ))}
            </div>
          </div>
          {tab === "colecoes" && <SetsTab stats={stats} hidden={hidden} />}
          {tab === "pastas" && <FoldersTab hidden={hidden} />}
          {tab === "desejos" && <WishTab stats={stats} hidden={hidden} pricesReady={data.pricesReady} />}
          {tab === "graficos" && <ChartsTab stats={stats} hidden={hidden} />}
        </>
      )}
      {empty && <FoldersTab hidden={hidden} />}

      <Link
        href="/colecao/escanear"
        aria-label="Escanear cartas com a câmera"
        className="fixed bottom-5 left-1/2 z-40 grid size-16 -translate-x-1/2 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-2xl text-white shadow-[0_12px_40px_-8px_rgb(99_102_241/0.8)] ring-4 ring-bg transition hover:scale-105 sm:hidden"
      >
        📷
      </Link>
      <ExportSheet open={exporting} onClose={() => setExporting(false)} />
    </div>
  );
}

function ActionButton({ href, onClick, icon, label, primary }: { href?: string; onClick?: () => void; icon: string; label: string; primary?: boolean }) {
  const cls = `flex flex-col items-center gap-1 rounded-2xl border px-3 py-3 text-xs font-bold transition sm:flex-row sm:gap-2 sm:rounded-full sm:px-5 sm:py-2.5 sm:text-sm ${
    primary ? "border-transparent bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg hover:brightness-110" : "border-line bg-surface hover:border-accent/60"
  }`;
  const inner = (
    <>
      <span className="text-xl sm:text-base" aria-hidden="true">{icon}</span>
      {label}
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function minutesAgo(t: number | null) {
  if (!t) return "";
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? "agora" : `há ${m} min`;
}

function Hero({ stats, hidden, onToggleHidden, pricesReady, updatedAt }: { stats: CollectionStats; hidden: boolean; onToggleHidden: () => void; pricesReady: boolean; updatedAt: number | null }) {
  const since = stats.entryCovered - stats.entry;
  const sincePct = stats.entry > 0 ? (since / stats.entry) * 100 : null;
  const weekBase = stats.total - stats.week;
  const [refreshing, setRefreshing] = useState(false);
  return (
    <section className="night-card relative overflow-hidden rounded-[2rem] p-5 shadow-[0_30px_80px_-30px_rgb(37_47_120/0.9)] ring-1 ring-white/10 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-xl" aria-hidden="true">💼</span>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">
          Sua coleção
          <br />
          vale
        </p>
        <button type="button" onClick={onToggleHidden} className="mt-1 text-lg text-white/60 hover:text-white" aria-label={hidden ? "Mostrar valores" : "Esconder valores"} title={hidden ? "Mostrar valores" : "Esconder valores"}>
          {hidden ? "🙈" : "👁️"}
        </button>
        {pricesReady && Math.abs(stats.week) >= 0.01 && (
          <Delta value={stats.week} hidden={hidden} suffix="7 dias" pct={weekBase > 0 ? (stats.week / weekBase) * 100 : null} className="ml-auto" />
        )}
      </div>
      <p className="mt-3 font-display text-5xl font-extrabold tracking-tight tabular-nums sm:text-6xl">
        {pricesReady ? <Money value={stats.total} hidden={hidden} /> : <span className="inline-block h-12 w-56 animate-pulse rounded-xl bg-white/10" />}
      </p>
      <p className="mt-1 text-sm text-white/60">
        {stats.copies} {stats.copies === 1 ? "cópia" : "cópias"} · {stats.distinct} cartas diferentes
        {pricesReady && stats.copies > 0 && ` · 🇧🇷 ${Math.round(stats.brShare * 100)}% com preço do Brasil`}
      </p>

      {pricesReady && stats.entry > 0 && (
        <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-amber-200/25 bg-black/10">
          <div className="border-r border-amber-200/20 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">Vale hoje</p>
            <p className="font-display text-2xl font-extrabold tabular-nums"><Money value={stats.entryCovered} hidden={hidden} /></p>
          </div>
          <div className="p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">Valia ao entrar</p>
            <p className="font-display text-2xl font-extrabold tabular-nums text-amber-300"><Money value={stats.entry} hidden={hidden} /></p>
          </div>
          <div className="col-span-2 border-t border-amber-200/20 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">Desde que entraram</p>
            <p className={`font-display text-3xl font-extrabold tabular-nums ${since >= 0 ? "text-emerald-300" : "text-rose-400"}`}>
              {since >= 0 ? "+" : "−"}
              <Money value={Math.abs(since)} hidden={hidden} />
              {sincePct != null && <span className="ml-2 text-lg">({since >= 0 ? "+" : "−"}{Math.abs(sincePct).toFixed(1)}%)</span>}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2 text-sm">
        {stats.topGainer && (
          <Link href={`/tcg/cartas/${stats.topGainer.card.card_id}`} className="flex items-center gap-2 text-white/80 hover:text-white">
            🔥 Maior alta: <strong className="truncate text-white">{stats.topGainer.card.card_name}</strong>
            <span className="font-bold text-emerald-300">+{stats.topGainer.pct.toFixed(0)}%</span> ›
          </Link>
        )}
        {stats.withoutPaid > 0 && stats.copies > 0 && (
          <Link href="/colecao/importar#dica-pago" className="flex items-center gap-2 text-white/70 hover:text-white">
            🏷️ {stats.withoutPaid} {stats.withoutPaid === 1 ? "cópia" : "cópias"} sem preço pago
            {stats.withoutPrice > 0 && <span className="text-white/50">· {stats.withoutPrice} sem cotação</span>}
          </Link>
        )}
      </div>

      {stats.byLanguage.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {stats.byLanguage.map((l) => (
            <span key={l.language} className="rounded-full bg-black/25 px-3 py-1.5 text-sm font-bold ring-1 ring-white/10" title={LANG_NAME[l.language]}>
              {LANG_FLAG[l.language]} {l.language} {l.copies}
              {pricesReady && <> · <Money value={l.value} hidden={hidden} /></>}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-white/50">
        <span>{pricesReady ? `Atualizado ${minutesAgo(updatedAt)}` : "Buscando preços…"}</span>
        <button
          type="button"
          disabled={refreshing}
          onClick={async () => {
            setRefreshing(true);
            await refreshCollection();
            setRefreshing(false);
          }}
          className="rounded-full bg-white/10 px-3 py-1 font-bold text-white/80 hover:bg-white/20 disabled:opacity-50"
        >
          {refreshing ? "Atualizando…" : "↻ Atualizar preços"}
        </button>
      </div>
    </section>
  );
}

function SetCard({ p, hidden }: { p: SetProgress; hidden: boolean }) {
  const [open, setOpen] = useState(false);
  const base = p.set.official ? p.base / p.set.official : 0;
  const master = p.set.total ? p.master / p.set.total : 0;
  const done = base >= 1;
  const sorted = [...p.cards].sort((a, b) => normNumber(splitCardId(a.card_id).localId).localeCompare(normNumber(splitCardId(b.card_id).localId), undefined, { numeric: true }));
  return (
    <li className={`night-card overflow-hidden rounded-[1.75rem] p-4 ring-1 sm:p-5 ${done ? "ring-amber-300/60" : "ring-white/10"}`}>
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-20 shrink-0 place-items-center">
          {p.set.logo ? <img src={`${p.set.logo}.webp`} alt="" loading="lazy" className="max-h-12 max-w-20 object-contain drop-shadow" /> : <span className="text-2xl">🃏</span>}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2">
            {p.set.code && <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-black tracking-wider">{p.set.code}</span>}
            <span className="truncate font-display text-lg font-extrabold">{p.set.namePt ?? p.set.name}</span>
            {done && <span title="Coleção base completa">👑</span>}
          </p>
          <p className="truncate text-sm text-white/55">{p.set.serie}</p>
        </div>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-white/80" aria-label={open ? "Esconder cartas" : "Ver minhas cartas"}>
          {open ? "▴" : "▾"}
        </button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="flex justify-between text-xs font-black uppercase tracking-wider text-sky-300">
            Base <span className="tabular-nums">{(base * 100).toFixed(1)}%</span>
          </p>
          <ProgressBar value={base} className="mt-1.5" />
          <p className="mt-1.5 text-xs text-white/55 tabular-nums">
            {p.base}/{p.set.official} cartas · {done ? "completa!" : `faltam ${p.set.official - p.base}`}
          </p>
        </div>
        <div>
          <p className="flex justify-between text-xs font-black uppercase tracking-wider text-violet-300">
            Com secretas <span className="tabular-nums">{(master * 100).toFixed(1)}%</span>
          </p>
          <ProgressBar value={master} color="from-violet-400 to-fuchsia-500" className="mt-1.5" />
          <p className="mt-1.5 text-xs text-white/55 tabular-nums">
            {p.master}/{p.set.total} cartas · {p.copies} {p.copies === 1 ? "cópia" : "cópias"}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Link href={`/tcg/colecoes/${p.set.id}?faltam=1`} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20">
          Ver as que faltam →
        </Link>
        <span className="font-display text-lg font-extrabold tabular-nums text-sky-300">
          <Money value={p.value} hidden={hidden} />
        </span>
      </div>
      {open && (
        <ul className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
          {sorted.map((c) => (
            <li key={c.id} className="relative">
              <Link href={`/tcg/cartas/${c.card_id}`} title={c.card_name}>
                {c.image ? <img src={c.image} alt={c.card_name} loading="lazy" className="aspect-[5/7] w-full rounded-lg object-cover shadow-lg" /> : <span className="grid aspect-[5/7] place-items-center rounded-lg bg-white/10 text-[10px]">{c.card_name}</span>}
                <span className="absolute right-1 top-1 rounded-full bg-blue-600 px-1.5 text-[10px] font-black">x{c.quantity}</span>
                <span className="absolute bottom-1 left-1 text-[11px]">{LANG_FLAG[c.language ?? "PT"]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function SetsTab({ stats, hidden }: { stats: CollectionStats; hidden: boolean }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recentes" | "progresso" | "valor">("recentes");
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = stats.sets.filter((p) => !term || `${p.set.name} ${p.set.namePt ?? ""} ${p.set.code ?? ""} ${p.set.serie}`.toLowerCase().includes(term));
    if (sort === "progresso") return [...filtered].sort((a, b) => b.base / (b.set.official || 1) - a.base / (a.set.official || 1));
    if (sort === "valor") return [...filtered].sort((a, b) => b.value - a.value);
    return filtered;
  }, [stats.sets, q, sort]);
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Buscar coleção" className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent" />
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold" aria-label="Ordenar coleções">
          <option value="recentes">Mais recentes</option>
          <option value="progresso">Mais completas</option>
          <option value="valor">Mais valiosas</option>
        </select>
      </div>
      {list.length === 0 ? (
        <p className="text-ink-soft">{stats.sets.length ? "Nenhuma coleção com esse nome." : "Carregando coleções…"}</p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {list.map((p) => (
            <SetCard key={p.set.id} p={p} hidden={hidden} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FoldersTab({ hidden }: { hidden: boolean }) {
  const data = useCollectionData();
  const folders = data.collections;
  return (
    <section className="space-y-4">
      <NewCollectionForm
        onCreated={(c) => {
          patchLocal((d) => ({ collections: [c, ...d.collections] }));
        }}
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {folders.map((col, i) => {
          const items = data.cards.filter((c) => c.collection_id === col.id);
          const value = items.reduce((n, c) => n + (unitValue(c, data.info, data.radar) ?? 0) * c.quantity, 0);
          const copies = items.reduce((n, c) => n + c.quantity, 0);
          return (
            <li key={col.id}>
              <Link href={`/colecao/${col.id}`} className="group flex h-full flex-col gap-3 rounded-[1.75rem] border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-[var(--glow)]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                  <span className="rounded-full px-2.5 py-1 text-white" style={{ background: col.kind === "desejos" ? "#10b39a" : PALETTE[i % PALETTE.length] }}>
                    {KIND_LABEL[col.kind]}
                  </span>
                  <span className="text-ink-soft">{copies} {copies === 1 ? "carta" : "cartas"}</span>
                </div>
                <p className="font-display text-xl font-bold">{col.name}</p>
                <div className="flex h-24 -space-x-8">
                  {items.slice(0, 5).map((c, j) =>
                    c.image ? (
                      <img key={c.id} src={c.image} alt="" loading="lazy" className="aspect-[5/7] h-24 rounded-lg border-2 border-surface object-cover shadow-md transition group-hover:translate-y-[-4px]" style={{ transitionDelay: `${j * 30}ms` }} />
                    ) : null,
                  )}
                </div>
                <p className="mt-auto flex items-center justify-between text-sm font-semibold tabular-nums">
                  <span>{col.kind === "desejos" ? "Para completar" : "Valor"}</span>
                  <Money value={value} hidden={hidden} className="font-display text-lg font-extrabold" />
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function WishTab({ stats, hidden, pricesReady }: { stats: CollectionStats; hidden: boolean; pricesReady: boolean }) {
  const data = useCollectionData();
  const wishCost = stats.wanted.reduce((n, c) => n + (unitValue(c, data.info, data.radar) ?? 0) * c.quantity, 0);
  return (
    <section id="alertas" className="scroll-mt-40 space-y-4">
      <div className="rounded-[1.75rem] border border-line bg-surface p-5">
        <h2 className="font-display text-xl font-bold">🔔 Alertas de preço</h2>
        {stats.alerts.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">
            Abra qualquer carta e toque em <strong>“🔔 Avisar quando baixar”</strong>. Quando o preço no Brasil chegar no valor que você escolheu, o sino no topo do site avisa.{" "}
            <Link href="/tcg" className="font-bold text-accent underline">Procurar cartas</Link>
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-line text-sm">
            {stats.alerts.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                {c.image && <img src={c.image} alt="" loading="lazy" className="aspect-[5/7] w-10 rounded object-cover" />}
                <Link href={`/tcg/cartas/${c.card_id}`} className="min-w-0 flex-1 truncate font-bold hover:underline">{c.card_name}</Link>
                <span className="tabular-nums text-ink-soft">alvo {formatMoney(c.target_brl as number, "BRL")}</span>
                <span className={`w-28 text-right font-bold tabular-nums ${c.hit ? "text-good" : ""}`}>
                  {!pricesReady ? "…" : c.now == null ? "sem preço" : `${c.hit ? "🎯 " : ""}${formatMoney(c.now, "BRL")}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {stats.wanted.length > 0 && (
        <div className="rounded-[1.75rem] border border-line bg-surface p-5">
          <h2 className="font-display text-xl font-bold">⭐ Quero ter ({stats.wanted.length})</h2>
          <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
            {stats.wanted.map((c) => (
              <li key={c.id}>
                <Link href={`/tcg/cartas/${c.card_id}`} className="block text-center text-xs" title={c.card_name}>
                  {c.image ? <img src={c.image} alt={c.card_name} loading="lazy" className="aspect-[5/7] w-full rounded-lg object-cover shadow" /> : null}
                  <span className="mt-1 block truncate font-semibold">{c.card_name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-right text-sm">
            Para comprar tudo: <Money value={wishCost} hidden={hidden} className="font-bold" />
          </p>
        </div>
      )}
    </section>
  );
}

function ChartsTab({ stats, hidden }: { stats: CollectionStats; hidden: boolean }) {
  const data = useCollectionData();
  const byFolder = data.collections
    .filter((c) => c.kind !== "desejos")
    .map((col) => ({ name: col.name, value: Math.round(stats.owned.filter((c) => c.collection_id === col.id).reduce((n, c) => n + (unitValue(c, data.info, data.radar) ?? 0) * c.quantity, 0) * 100) / 100 }))
    .filter((c) => c.value > 0);
  const fmt = (v: unknown) => (hidden ? "R$ •••" : formatMoney(Number(v), "BRL"));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-[1.75rem] border border-line bg-surface p-5">
        <h2 className="font-display text-xl font-bold">Valor por pasta/deck</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={byFolder} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
                {byFolder.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip formatter={fmt} contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-[1.75rem] border border-line bg-surface p-5">
        <h2 className="font-display text-xl font-bold">Cartas mais valiosas</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={stats.topValue} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="card_name" width={110} tick={{ fill: "var(--ink-soft)", fontSize: 11 }} />
              <Tooltip formatter={fmt} contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-2)" }} />
              <Bar dataKey="value" fill="var(--accent)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-[1.75rem] border border-line bg-surface p-5 lg:col-span-2">
        <h2 className="font-display text-xl font-bold">Por idioma</h2>
        <ul className="mt-3 space-y-2">
          {stats.byLanguage.map((l) => (
            <li key={l.language} className="flex items-center gap-3 text-sm">
              <span className="w-28 font-bold">{LANG_FLAG[l.language]} {LANG_NAME[l.language]}</span>
              <span className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${(l.copies / Math.max(stats.copies, 1)) * 100}%` }} />
              </span>
              <span className="w-40 text-right tabular-nums">{l.copies} · <Money value={l.value} hidden={hidden} /></span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-[2rem] border border-dashed border-line bg-surface p-8 text-center">
      <p className="text-5xl">🃏</p>
      <h2 className="mt-2 font-display text-2xl font-extrabold">Comece sua coleção</h2>
      <p className="mx-auto mt-1 max-w-md text-ink-soft">Escaneie suas cartas com a câmera, cole uma lista ou envie a planilha que você já tem. O site acha cada carta e calcula quanto vale em reais.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link href="/colecao/escanear" className="rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-bold text-white">📷 Escanear cartas</Link>
        <Link href="/colecao/importar" className="rounded-full border border-line px-6 py-3 font-bold">⬆️ Importar lista ou planilha</Link>
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando sua coleção">
      <div className="night-card h-72 animate-pulse rounded-[2rem]" />
      <div className="grid grid-cols-4 gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-2" />)}</div>
      <div className="grid gap-4 lg:grid-cols-2">{[0, 1].map((i) => <div key={i} className="night-card h-44 animate-pulse rounded-[1.75rem]" />)}</div>
    </div>
  );
}

function NewCollectionForm({ onCreated }: { onCreated: (c: Collection) => void }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CollectionKind>("pasta");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      onCreated(await createCollection({ kind, name: name.trim() }));
      setName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 rounded-3xl border border-dashed border-line p-4">
      <label htmlFor="new-kind" className="sr-only">Tipo</label>
      <select id="new-kind" value={kind} onChange={(e) => setKind(e.target.value as CollectionKind)} className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold">
        <option value="pasta">Pasta (binder)</option>
        <option value="deck">Deck</option>
        <option value="desejos">Lista de desejos</option>
      </select>
      <label htmlFor="new-name" className="sr-only">Nome</label>
      <input id="new-name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome: ex. Pasta Kanto, Deck Charizard ex, Quero comprar" className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm" />
      <button type="submit" disabled={saving} className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-ink disabled:opacity-60">
        {saving ? "Criando…" : "Criar"}
      </button>
      {error && <p role="alert" className="w-full text-sm text-accent">{error}</p>}
    </form>
  );
}
