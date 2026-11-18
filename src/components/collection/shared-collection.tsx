"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { decodeShare, type SharePayload } from "@/lib/collection-io";
import { fetchPrices } from "@/lib/price-alerts";
import { LANG_FLAG, normNumber, type Language } from "@/lib/tcg/card-ref";
import { formatMoney } from "@/lib/tcg/prices";
import type { PricedCard } from "@/lib/tcg/types";

const TITLES: Record<SharePayload["k"], string> = { colecao: "Coleção", desejos: "Lista de desejos", faltam: "Cartas que faltam", pasta: "Pasta" };

/** Página pública de um link compartilhável: a lista vem no próprio endereço (depois do #). */
export function SharedCollection() {
  const [payload, setPayload] = useState<SharePayload | null | undefined>(undefined);
  const [prices, setPrices] = useState<Record<string, PricedCard>>({});
  const [q, setQ] = useState("");

  useEffect(() => {
    const read = () => void decodeShare(location.hash.slice(1)).then(setPayload);
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  useEffect(() => {
    if (!payload) return;
    let active = true;
    void fetchPrices(payload.c.map(([id]) => id)).then((p) => active && setPrices(p));
    return () => {
      active = false;
    };
  }, [payload]);

  const items = useMemo(() => {
    if (!payload) return [];
    const term = q.trim().toLowerCase();
    return payload.c
      .map(([id, quantity, lang]) => ({ id, quantity, lang: lang as Language, p: prices[id] }))
      .filter((x) => !term || (x.p?.meta?.name ?? x.id).toLowerCase().includes(term) || (x.p?.meta?.set ?? "").toLowerCase().includes(term))
      .sort((a, b) => (a.p?.meta?.set ?? "").localeCompare(b.p?.meta?.set ?? "") || normNumber(a.p?.meta?.localId).localeCompare(normNumber(b.p?.meta?.localId), undefined, { numeric: true }));
  }, [payload, prices, q]);

  if (payload === undefined) return <p className="text-ink-soft">Abrindo a lista…</p>;
  if (payload === null)
    return (
      <div className="rounded-[2rem] border border-line bg-surface p-8 text-center">
        <p className="text-5xl">🔗</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold">Link inválido ou incompleto</h1>
        <p className="mt-1 text-ink-soft">Peça para a pessoa copiar o link inteiro de novo.</p>
      </div>
    );

  const copies = payload.c.reduce((n, [, qty]) => n + qty, 0);
  const total = payload.c.reduce((n, [id, qty]) => n + (prices[id]?.brl ?? 0) * qty, 0);

  return (
    <div className="space-y-6">
      <header className="night-card rounded-[2rem] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">{TITLES[payload.k]} compartilhada</p>
        <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight">{payload.t}</h1>
        <p className="mt-2 text-white/70">
          {copies} {copies === 1 ? "carta" : "cartas"}
          {payload.p && total > 0 && <> · valor estimado hoje <strong className="text-amber-300">{formatMoney(total, "BRL")}</strong></>}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => navigator.clipboard?.writeText(location.href)} className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">🔗 Copiar link</button>
          <Link href="/colecao" className="rounded-full bg-blue-500 px-4 py-2 text-sm font-bold text-white">Monte a sua coleção grátis</Link>
        </div>
      </header>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Buscar nesta lista" className="w-full rounded-full border border-line bg-surface px-5 py-3 outline-none focus:border-accent" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {items.map(({ id, quantity, lang, p }) => (
          <li key={`${id}-${lang}`}>
            <Link href={`/tcg/cartas/${id}`} className="group block rounded-2xl p-1.5 transition hover:bg-surface-2">
              <span className="relative block">
                {p?.meta?.image ? (
                  <img src={p.meta.image} alt={p.meta.name ?? id} loading="lazy" className="aspect-[5/7] w-full rounded-xl object-cover shadow-md" />
                ) : (
                  <span className="block aspect-[5/7] w-full animate-pulse rounded-xl bg-surface-2" />
                )}
                {quantity > 1 && <span className="absolute right-1.5 top-1.5 rounded-full bg-blue-600 px-2 text-xs font-black text-white">x{quantity}</span>}
                <span className="absolute bottom-1.5 left-1.5 text-sm">{LANG_FLAG[lang] ?? ""}</span>
              </span>
              <span className="mt-2 block truncate text-sm font-semibold">{p?.meta?.name ?? id}</span>
              <span className="block truncate text-xs text-ink-soft">
                {p?.meta?.set ?? ""} {p?.meta?.localId ? `#${p.meta.localId}` : ""}
              </span>
              {payload.p && p?.brl != null && <span className="text-sm font-bold tabular-nums">{formatMoney(p.brl, "BRL")}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
