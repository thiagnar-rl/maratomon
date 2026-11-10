"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  createCollection,
  fetchCardValues,
  listCards,
  listCollections,
  type Collection,
  type CollectionCard,
  type CollectionKind,
  unitValue,
} from "@/lib/collection";
import { formatMoney } from "@/lib/tcg/prices";
import { RequireLogin } from "./require-login";

const PALETTE = ["#e3350d", "#3d7dca", "#ffcb05", "#10b39a", "#a35bd6", "#ff7a1f", "#5b6cff", "#c03dff"];

export function CollectionDashboard() {
  return (
    <RequireLogin>
      <Dashboard />
    </RequireLogin>
  );
}

function Dashboard() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [cards, setCards] = useState<CollectionCard[]>([]);
  const [values, setValues] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [cols, items] = await Promise.all([listCollections(), listCards()]);
        if (!active) return;
        setCollections(cols);
        setCards(items);
        setLoading(false);
        const prices = await fetchCardValues(items.map((c) => c.card_id));
        if (active) setValues(prices);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Erro ao carregar.");
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const valueOf = (c: CollectionCard) => (unitValue(c, values) ?? 0) * c.quantity;
    const total = cards.reduce((n, c) => n + valueOf(c), 0);
    const paid = cards.reduce((n, c) => n + (c.paid_brl ?? 0) * c.quantity, 0);
    const count = cards.reduce((n, c) => n + c.quantity, 0);
    const byCollection = collections.map((col) => ({
      id: col.id,
      name: col.name,
      value: Math.round(cards.filter((c) => c.collection_id === col.id).reduce((n, c) => n + valueOf(c), 0) * 100) / 100,
    }));
    const top = [...cards]
      .map((c) => ({ ...c, unit: unitValue(c, values), value: valueOf(c) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    return { total, paid, count, byCollection, top };
  }, [cards, collections, values]);

  if (loading) return <p className="text-ink-soft">Carregando sua coleção…</p>;
  if (error) return <p role="alert" className="text-accent">{error}</p>;

  const pricesLoaded = Object.keys(values).length > 0 || cards.length === 0;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Valor da coleção (R$)", value: pricesLoaded ? formatMoney(stats.total, "BRL") : "Calculando…" },
          { label: "Quanto você pagou", value: formatMoney(stats.paid, "BRL") },
          {
            label: "Valorização",
            value: stats.paid > 0 && pricesLoaded ? `${stats.total >= stats.paid ? "▲" : "▼"} ${Math.abs(((stats.total - stats.paid) / stats.paid) * 100).toFixed(1)}%` : "—",
          },
          { label: "Cartas", value: `${stats.count} em ${collections.length} ${collections.length === 1 ? "lugar" : "lugares"}` },
        ].map((tile) => (
          <div key={tile.label} className="rounded-3xl border border-line bg-surface p-5">
            <p className="text-sm font-semibold text-ink-soft">{tile.label}</p>
            <p className="font-display text-3xl font-extrabold tabular-nums">{tile.value}</p>
          </div>
        ))}
      </div>

      {cards.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <section className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="font-display text-xl font-bold">Valor por deck/pasta</h2>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={stats.byCollection.filter((c) => c.value > 0)} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
                    {stats.byCollection.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(Number(v), "BRL")} contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--ink)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="font-display text-xl font-bold">Cartas mais valiosas</h2>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={stats.top} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="card_name" width={110} tick={{ fill: "var(--ink-soft)", fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatMoney(Number(v), "BRL")} contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--ink)" }} cursor={{ fill: "var(--surface-2)" }} />
                  <Bar dataKey="value" fill="var(--accent)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">Decks e pastas</h2>
        </div>
        <NewCollectionForm onCreated={(c) => setCollections((prev) => [c, ...prev])} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col, i) => {
            const items = cards.filter((c) => c.collection_id === col.id);
            const preview = items.slice(0, 4);
            return (
              <li key={col.id}>
                <Link href={`/colecao/${col.id}`} className="group flex h-full flex-col gap-3 rounded-3xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-ink-soft">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                    <span className="rounded-full px-2.5 py-1 text-white" style={{ background: PALETTE[i % PALETTE.length] }}>
                      {col.kind === "deck" ? "Deck" : "Pasta"}
                    </span>
                    <span className="text-ink-soft">{items.reduce((n, c) => n + c.quantity, 0)} cartas</span>
                  </div>
                  <p className="font-display text-xl font-bold">{col.name}</p>
                  <div className="flex -space-x-6">
                    {preview.map((c) =>
                      c.image ? <img key={c.id} src={c.image} alt="" loading="lazy" className="aspect-[5/7] w-16 rounded-lg border-2 border-surface object-cover shadow transition group-hover:-rotate-2" /> : null,
                    )}
                  </div>
                  <p className="mt-auto text-sm font-semibold tabular-nums">
                    {formatMoney(stats.byCollection.find((b) => b.id === col.id)?.value ?? 0, "BRL")}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
        {collections.length === 0 && <p className="text-ink-soft">Crie seu primeiro deck ou pasta acima.</p>}
      </section>
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
      </select>
      <label htmlFor="new-name" className="sr-only">Nome</label>
      <input id="new-name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome: ex. Pasta Kanto, Deck Charizard ex" className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm" />
      <button type="submit" disabled={saving} className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-ink disabled:opacity-60">
        {saving ? "Criando…" : "Criar"}
      </button>
      {error && <p role="alert" className="w-full text-sm text-accent">{error}</p>}
    </form>
  );
}
