"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addCard, CONDITIONS, createCollection, listCards, listCollections, updateCard, type Collection } from "@/lib/collection";
import { addToCompare, MAX_COMPARE, useCompareIds } from "@/lib/tcg/compare-store";
import { useProgress } from "@/lib/progress/hooks";
import { formatMoney, parseBRL } from "@/lib/tcg/prices";
import { refreshCollection, patchLocal } from "@/lib/collection-store";
import { LANGUAGES, VARIANTS, type Language } from "@/lib/tcg/card-ref";
import { isSupabaseConfigured } from "@/lib/supabase";

type CardInfo = { id: string; name: string; set: string; image: string | null };

export function CardActions({ card, price }: { card: CardInfo; price?: number | null }) {
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
      <PriceAlert card={card} price={price ?? null} />
      <AddToCollection card={card} price={price ?? null} />
    </div>
  );
}

/** Alerta de preço: guarda a carta na lista de desejos com um preço-alvo; o sino do topo avisa quando chegar. */
function PriceAlert({ card, price }: { card: CardInfo; price: number | null }) {
  const { email } = useProgress();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(price ? (Math.floor(price * 0.9 * 100) / 100).toFixed(2).replace(".", ",") : "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!isSupabaseConfigured) return null;
  if (!email) {
    return (
      <Link href="/entrar?modo=criar" className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff7a2f] to-accent px-4 py-2.5 text-sm font-bold text-white shadow-sm">
        🔔 Avisar quando baixar <span className="font-semibold opacity-80">· crie sua conta grátis</span>
      </Link>
    );
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const value = parseBRL(target);
    if (value == null || value <= 0) {
      setStatus("error");
      setMessage("Digite um preço válido.");
      return;
    }
    setStatus("saving");
    try {
      const collections = await listCollections();
      const wishlist = collections.find((c) => c.kind === "desejos") ?? (await createCollection({ kind: "desejos", name: "Lista de desejos" }));
      const existing = (await listCards(wishlist.id)).find((c) => c.card_id === card.id);
      if (existing) await updateCard(existing.id, { target_brl: value });
      else await addCard({ collection_id: wishlist.id, card_id: card.id, card_name: card.name, set_name: card.set, image: card.image, target_brl: value });
      try {
        sessionStorage.removeItem("forja:alertas:v1");
      } catch {
        // ignorado
      }
      void refreshCollection();
      setStatus("saved");
      setMessage(`Pronto! Quando o preço no Brasil chegar a ${formatMoney(value, "BRL")}, o sino 🔔 no topo do site avisa você.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff7a2f] to-accent px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
      >
        🔔 Avisar quando baixar
      </button>
    );
  }
  return (
    <form onSubmit={save} className="space-y-3 rounded-2xl border border-accent/40 bg-accent/5 p-4">
      <label htmlFor="alvo" className="block text-sm font-bold">
        🔔 Me avise quando custar até
      </label>
      <div className="flex gap-2">
        <span className="flex flex-1 items-center rounded-xl border border-line bg-bg px-3 text-sm">
          R$&nbsp;
          <input id="alvo" inputMode="decimal" autoFocus value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0,00" className="w-full bg-transparent py-2 outline-none" />
        </span>
        <button type="submit" disabled={status === "saving"} className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
          {status === "saving" ? "Salvando…" : "Criar alerta"}
        </button>
      </div>
      {price != null && <p className="text-xs text-ink-soft">Hoje: {formatMoney(price, "BRL")}. Sugestão: 10% abaixo.</p>}
      {message && (
        <p role="status" className={`text-sm ${status === "error" ? "text-accent" : "font-semibold"}`}>
          {message} {status === "saved" && <Link href="/colecao#alertas" className="underline">Ver meus alertas</Link>}
        </p>
      )}
    </form>
  );
}

function AddToCollection({ card, price }: { card: CardInfo; price: number | null }) {
  const [language, setLanguage] = useState<Language>("PT");
  const [variant, setVariant] = useState("Normal");
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
        language,
        variant: variant === "Normal" ? null : variant,
        added_brl: price,
      }).then((saved) => patchLocal((d) => ({ cards: [saved, ...d.cards] })));
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
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-ink-soft" htmlFor="idioma">Idioma</label>
          <select id="idioma" value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm">
            {LANGUAGES.map(([code, name, flag]) => <option key={code} value={code}>{flag} {name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-soft" htmlFor="versao">Versão</label>
          <select id="versao" value={variant} onChange={(e) => setVariant(e.target.value)} className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm">
            {VARIANTS.map((v) => <option key={v}>{v}</option>)}
          </select>
        </div>
      </div>
      <button type="submit" disabled={status === "saving" || !collectionId} className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink disabled:opacity-60">
        {status === "saving" ? "Salvando…" : "Adicionar"}
      </button>
      {message && <p role="status" className={`text-sm ${status === "error" ? "text-accent" : "text-good"}`}>{message}</p>}
    </form>
  );
}
