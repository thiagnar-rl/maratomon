"use client";

import { useSyncExternalStore } from "react";
import { formatMoney } from "@/lib/tcg/prices";

/** Peças visuais da coleção (compartilhadas entre painel, detalhe e exportação). */

const HIDE_KEY = "forja:ocultar-valores";
const hideListeners = new Set<() => void>();
function readHidden() {
  try {
    return localStorage.getItem(HIDE_KEY) === "1";
  } catch {
    return false;
  }
}
/** Olhinho: esconde os valores em reais (para mostrar a tela sem expor quanto vale). */
export function useHideValues(): [boolean, () => void] {
  const hidden = useSyncExternalStore(
    (l) => {
      hideListeners.add(l);
      return () => hideListeners.delete(l);
    },
    readHidden,
    () => false,
  );
  const toggle = () => {
    try {
      localStorage.setItem(HIDE_KEY, hidden ? "0" : "1");
    } catch {
      // ignorado
    }
    hideListeners.forEach((l) => l());
  };
  return [hidden, toggle];
}

export function Money({ value, hidden, className }: { value: number | null | undefined; hidden?: boolean; className?: string }) {
  if (hidden) return <span className={className}>R$ •••</span>;
  return <span className={className}>{value == null ? "—" : formatMoney(value, "BRL")}</span>;
}

export function Delta({ value, pct, hidden, suffix, className = "" }: { value: number; pct?: number | null; hidden?: boolean; suffix?: string; className?: string }) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold tabular-nums ring-1 ${
        up ? "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30" : "bg-rose-500/15 text-rose-300 ring-rose-400/30"
      } ${className}`}
    >
      {up ? "▲" : "▼"} {hidden ? "•••" : formatMoney(Math.abs(value), "BRL")}
      {pct != null && Number.isFinite(pct) && ` (${up ? "+" : "−"}${Math.abs(pct).toFixed(1)}%)`}
      {suffix && <span className="font-semibold opacity-80">· {suffix}</span>}
    </span>
  );
}

export function ProgressBar({ value, color = "from-sky-400 to-blue-500", className = "" }: { value: number; color?: string; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-[width] duration-700`} style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} />
    </div>
  );
}

/** Folha que sobe da base da tela (celular) ou abre no centro (computador). */
export function Sheet({ open, onClose, title, icon, children }: { open: boolean; onClose: () => void; title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#121a33] p-5 text-white shadow-2xl animate-[sheet_.25s_ease-out] sm:rounded-[2rem]">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20 sm:hidden" />
        <div className="mb-4 flex items-center gap-3">
          {icon && <span className="text-2xl text-sky-400">{icon}</span>}
          <h2 className="font-display text-2xl font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} className="ml-auto grid size-9 place-items-center rounded-full bg-white/10 text-lg" aria-label="Fechar">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Interruptor estilo celular. */
export function Toggle({ checked, onChange, label, hint, icon }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      {icon && <span className="text-xl text-sky-400">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{label}</span>
        {hint && <span className="block text-sm text-white/60">{hint}</span>}
      </span>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-7 w-12 shrink-0 rounded-full bg-white/15 transition peer-checked:bg-emerald-500 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-400 after:absolute after:left-0.5 after:top-0.5 after:size-6 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}
