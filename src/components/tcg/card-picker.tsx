"use client";

import { useEffect, useState } from "react";

export type PickedCard = { id: string; name: string; localId: string; image: string | null };

/** Campo de busca com resultados em miniatura, para escolher uma carta. */
export function CardPicker({ onPick, placeholder = "Buscar carta para adicionar…" }: { onPick: (card: PickedCard) => void; placeholder?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedCard[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/tcg/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        setResults(response.ok ? await response.json() : []);
      } catch {
        // busca cancelada ou sem rede
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="space-y-3">
      <label htmlFor="picker" className="sr-only">{placeholder}</label>
      <input
        id="picker"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-line bg-surface px-5 py-3 outline-none focus:border-ink-soft"
      />
      {loading && <p className="text-sm text-ink-soft">Buscando…</p>}
      {query.trim().length >= 2 && results.length > 0 && (
        <ul className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto rounded-2xl border border-line bg-surface p-2 sm:grid-cols-6">
          {results.map((card) => (
            <li key={card.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(card);
                  setQuery("");
                }}
                className="w-full rounded-xl p-1 text-left hover:bg-surface-2"
              >
                {card.image ? (
                  <img src={card.image} alt="" loading="lazy" className="aspect-[5/7] w-full rounded-lg object-cover" />
                ) : (
                  <span className="grid aspect-[5/7] place-items-center rounded-lg bg-surface-2 text-[10px]">Sem imagem</span>
                )}
                <span className="mt-1 block truncate text-xs font-semibold">{card.name}</span>
                <span className="block truncate text-[10px] text-ink-soft">{card.id}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
