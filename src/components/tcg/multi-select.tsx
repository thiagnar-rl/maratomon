"use client";

import { useEffect, useRef, useState } from "react";

/** Filtro com várias opções marcáveis ao mesmo tempo (raridade, versão, ilustrador). */
export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  searchable = false,
  disabled = false,
}: {
  label: string;
  options: [string, number][];
  selected: string[];
  onChange: (next: string[]) => void;
  searchable?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const visible = q ? options.filter(([o]) => o.toLowerCase().includes(q.toLowerCase())) : options;
  const toggle = (value: string) => onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${
          selected.length ? "border-accent bg-accent/15 text-ink" : "border-line bg-surface hover:border-ink-soft"
        }`}
      >
        {label}
        {selected.length > 0 && <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] font-black text-white">{selected.length}</span>}
        <svg viewBox="0 0 24 24" className={`size-3.5 transition ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 z-40 mt-2 w-72 rounded-2xl border border-line bg-surface p-2 shadow-2xl">
          {searchable && (
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Buscar ${label.toLowerCase()}`}
              className="mb-2 w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
            />
          )}
          <ul className="max-h-64 space-y-0.5 overflow-y-auto" role="listbox" aria-multiselectable="true" aria-label={label}>
            {visible.map(([value, count]) => {
              const on = selected.includes(value);
              return (
                <li key={value}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm hover:bg-surface-2">
                    <input type="checkbox" checked={on} onChange={() => toggle(value)} className="size-4 accent-[var(--accent)]" />
                    <span className="min-w-0 flex-1 truncate">{value}</span>
                    <span className="text-xs text-ink-soft tabular-nums">{count}</span>
                  </label>
                </li>
              );
            })}
            {visible.length === 0 && <li className="px-2 py-3 text-center text-sm text-ink-soft">Nada encontrado.</li>}
          </ul>
          {selected.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="mt-1 w-full rounded-xl py-1.5 text-xs font-bold text-accent hover:bg-surface-2">
              Limpar {label.toLowerCase()}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
