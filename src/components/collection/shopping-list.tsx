"use client";

import { useState } from "react";
import { buyListText, liga } from "@/lib/liga";
import { formatMoney } from "@/lib/tcg/prices";

export type ShoppingItem = { quantity: number; name: string; localId: string; official?: number; unitBRL: number | null };

/**
 * Lista de compras do Maratomon: texto pronto para mandar no WhatsApp da loja,
 * copiar ou colar na "Compra por Lista" da Liga Pokémon.
 */
export function ShoppingList({ title, items }: { title: string; items: ShoppingItem[] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (items.length === 0) return null;

  const total = items.reduce((n, i) => n + (i.unitBRL ?? 0) * i.quantity, 0);
  const missingPrice = items.some((i) => i.unitBRL == null);
  const list = buyListText(items);
  const message = `${title} (Maratomon TCG)\n\n${list}\n\nTotal estimado: ${formatMoney(total, "BRL")}${missingPrice ? " (algumas cartas sem preço)" : ""}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(list);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-3xl border border-line bg-surface p-5">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-left">
        <span>
          <span className="block font-display text-xl font-bold">🛒 {title}</span>
          <span className="text-sm text-ink-soft">
            {items.reduce((n, i) => n + i.quantity, 0)} cartas · {formatMoney(total, "BRL")} estimado
          </span>
        </span>
        <span className="text-2xl" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          <label htmlFor="lista-texto" className="text-xs font-semibold text-ink-soft">Lista (uma carta por linha)</label>
          <textarea id="lista-texto" readOnly value={list} rows={Math.min(12, items.length + 1)} className="w-full rounded-2xl border border-line bg-bg p-3 font-mono text-sm" />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copy} className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-ink">
              {copied ? "Copiada ✓" : "Copiar lista"}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25d366] px-4 py-2 text-sm font-bold text-black">
              Enviar no WhatsApp
            </a>
            <a href={liga.buyByList()} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-4 py-2 text-sm font-bold hover:border-ink-soft">
              Colar na Compra por Lista da Liga ↗
            </a>
          </div>
          <p className="text-xs text-ink-soft">Dica: copie a lista e cole na loja que preferir. Na Liga Pokémon é preciso estar logado.</p>
        </div>
      )}
    </div>
  );
}
