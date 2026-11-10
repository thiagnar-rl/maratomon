"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addCard, CONDITIONS, listCollections, type Collection } from "@/lib/collection";
import { addToCompare, MAX_COMPARE, useCompareIds } from "@/lib/tcg/compare-store";
import { useProgress } from "@/lib/progress/hooks";
import { parseBRL } from "@/lib/tcg/prices";
import { isSupabaseConfigured } from "@/lib/supabase";

type CardInfo = { id: string; name: string; set: string; image: string | null };

export function CardActions({ card }: { card: CardInfo }) {
  const compare = useCompareIds();
  const inCompare = compare.includes(card.id);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => addToCompare(card.id)}
          disabled={inCompare}
          className="flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-bold hover:border-ink-soft disabled:opacity-60"
        >
          {inCompare ? "No comparador ✓" : "Comparar"}
        </button>
        <Link href="/tcg/comparar" className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-bold hover:border-ink-soft">
          Ver ({compare.length}/{MAX_COMPARE})
        </Link>
      </div>
      <AddToCollection card={card} />
    </div>
  );
}

function AddToCollection({ card }: { card: CardInfo }) {
  const { email } = useProgress();
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [collectionId, setCollectionId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<string>("NM");
  const [paid, setPaid] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!email) return;
    listCollections()
      .then((list) => {
        setCollections(list);
        if (list[0]) setCollectionId(list[0].id);
      })
      .catch(() => setCollections([]));
  }, [email]);

  if (!isSupabaseConfigured) return null;
  if (!email) {
    return (
      <p className="rounded-2xl bg-surface-2 p-4 text-sm">
        <Link href="/entrar" className="font-bold text-accent underline">Entre na sua conta</Link> para guardar esta carta nos seus decks e pastas.
      </p>
    );
  }
  if (collections && collections.length === 0) {
    return (
      <p className="rounded-2xl bg-surface-2 p-4 text-sm">
        Você ainda não tem decks nem pastas. <Link href="/colecao" className="font-bold text-accent underline">Crie o primeiro</Link>.
      </p>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    try {
      await addCard({
        collection_id: collectionId,
        card_id: card.id,
        card_name: card.name,
        set_name: card.set,
        image: card.image,
        quantity,
        condition,
        paid_brl: parseBRL(paid),
      });
      setStatus("saved");
      setMessage(`Adicionada a “${collections?.find((c) => c.id === collectionId)?.name}”.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm font-bold">Adicionar à minha coleção</p>
      <label className="block text-xs font-semibold text-ink-soft" htmlFor="col">Deck ou pasta</label>
      <select id="col" value={collectionId} onChange={(e) => setCollectionId(e.target.value)} className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm">
        {(collections ?? []).map((c) => (
          <option key={c.id} value={c.id}>{c.kind === "deck" ? "🃏" : "📁"} {c.name}</option>
        ))}
      </select>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-semibold text-ink-soft" htmlFor="qtd">Qtd.</label>
          <input id="qtd" type="number" min={1} max={999} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-soft" htmlFor="cond">Estado</label>
          <select id="cond" value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm">
            {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-soft" htmlFor="pago">Paguei (R$)</label>
          <input id="pago" inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0,00" className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm" />
        </div>
      </div>
      <button type="submit" disabled={status === "saving" || !collectionId} className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink disabled:opacity-60">
        {status === "saving" ? "Salvando…" : "Adicionar"}
      </button>
      {message && <p role="status" className={`text-sm ${status === "error" ? "text-accent" : "text-good"}`}>{message}</p>}
    </form>
  );
}
