"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addCard,
  CONDITIONS,
  deleteCollection,
  deleteMedia,
  fetchCardInfo,
  getCollection,
  KIND_LABEL,
  listCards,
  listCollections,
  listMedia,
  removeCard,
  signedUrls,
  unitValue,
  updateCard,
  uploadMedia,
  valueSource,
  type CardInfo,
  type Collection,
  type CollectionCard,
  type CollectionMedia,
} from "@/lib/collection";
import { liga } from "@/lib/liga";
import { radarSummary, type RadarSummary } from "@/lib/radar";
import { formatMoney, parseBRL } from "@/lib/tcg/prices";
import { CardPicker } from "@/components/tcg/card-picker";
import { RequireLogin } from "./require-login";
import { ShoppingList, type ShoppingItem } from "./shopping-list";

export function CollectionDetail({ id }: { id: string }) {
  return (
    <RequireLogin>
      <Detail id={id} />
    </RequireLogin>
  );
}

/** Quantas cópias de cada carta você tem nas suas pastas (para o "quanto falta" dos decks). */
async function ownedInBinders(): Promise<Record<string, number>> {
  const [cols, cards] = await Promise.all([listCollections(), listCards()]);
  const binders = new Set(cols.filter((c) => c.kind === "pasta").map((c) => c.id));
  const owned: Record<string, number> = {};
  for (const card of cards) if (binders.has(card.collection_id)) owned[card.card_id] = (owned[card.card_id] ?? 0) + card.quantity;
  return owned;
}

function Detail({ id }: { id: string }) {
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null | undefined>(undefined);
  const [cards, setCards] = useState<CollectionCard[]>([]);
  const [media, setMedia] = useState<CollectionMedia[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [info, setInfo] = useState<Record<string, CardInfo>>({});
  const [radar, setRadar] = useState<Record<string, RadarSummary>>({});
  const [owned, setOwned] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<"cartas" | "midia">("cartas");
  const [error, setError] = useState("");

  const refreshMedia = useCallback(async () => {
    const list = await listMedia(id);
    setMedia(list);
    setUrls(await signedUrls(list.map((m) => m.path)));
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        const [col, items] = await Promise.all([getCollection(id), listCards(id)]);
        setCollection(col);
        setCards(items);
        await refreshMedia();
        const ids = items.map((c) => c.card_id);
        const [cardInfo, radarData, binders] = await Promise.all([
          fetchCardInfo(ids),
          radarSummary(ids),
          col?.kind === "deck" ? ownedInBinders() : Promise.resolve({}),
        ]);
        setInfo(cardInfo);
        setRadar(radarData);
        setOwned(binders);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar.");
      }
    })();
  }, [id, refreshMedia]);

  const total = useMemo(() => cards.reduce((n, c) => n + (unitValue(c, info, radar) ?? 0) * c.quantity, 0), [cards, info, radar]);

  /** Lista de compras: desejos = tudo; deck = o que falta nas suas pastas. */
  const shopping = useMemo<ShoppingItem[]>(() => {
    if (!collection || collection.kind === "pasta") return [];
    return cards
      .map((c) => {
        const missing = collection.kind === "deck" ? Math.max(0, c.quantity - (owned[c.card_id] ?? 0)) : c.quantity;
        const ref = info[c.card_id];
        return {
          quantity: missing,
          name: c.card_name,
          localId: ref?.localId ?? c.card_id.split("-").pop() ?? c.card_id,
          official: ref?.official,
          unitBRL: unitValue(c, info, radar),
        };
      })
      .filter((item) => item.quantity > 0);
  }, [cards, collection, info, owned, radar]);

  if (error) return <p role="alert" className="text-accent">{error}</p>;
  if (collection === undefined) return <p className="text-ink-soft">Carregando…</p>;
  if (collection === null) {
    return (
      <p>
        Não encontramos essa coleção. <Link href="/colecao" className="font-bold text-accent underline">Voltar para a coleção</Link>
      </p>
    );
  }

  const label = KIND_LABEL[collection.kind];

  async function handleDelete() {
    if (!collection) return;
    const typed = window.prompt(`Para apagar "${collection.name}" com todas as cartas, fotos e vídeos, digite o nome:`);
    if (typed !== collection.name) return;
    await deleteCollection(collection.id);
    router.push("/colecao");
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Navegação" className="text-sm font-semibold text-ink-soft">
        <Link href="/colecao" className="hover:text-ink">Minha coleção</Link> / {label}
      </nav>
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-[2rem] border border-line bg-surface p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">{label}</p>
          <h1 className="font-display text-4xl font-extrabold">{collection.name}</h1>
          <p className="text-ink-soft">
            {cards.reduce((n, c) => n + c.quantity, 0)} cartas · {media.length} fotos/vídeos
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-ink-soft">{collection.kind === "desejos" ? "Para completar" : "Valor estimado"}</p>
          <p className="font-display text-4xl font-extrabold tabular-nums">{formatMoney(total, "BRL")}</p>
        </div>
      </header>

      {collection.kind === "deck" && cards.length > 0 && (
        <p className="rounded-2xl bg-surface-2 p-4 text-sm">
          {shopping.length === 0
            ? "✅ Você já tem todas as cartas deste deck nas suas pastas."
            : `Faltam ${shopping.reduce((n, i) => n + i.quantity, 0)} cartas nas suas pastas para montar este deck. Veja a lista de compras abaixo.`}
        </p>
      )}
      <ShoppingList title={collection.kind === "deck" ? `O que falta para o deck ${collection.name}` : `Lista de compras: ${collection.name}`} items={shopping} />

      <div role="tablist" aria-label="Conteúdo" className="flex gap-2">
        {(["cartas", "midia"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className="rounded-full border border-line px-5 py-2 text-sm font-bold aria-selected:border-ink aria-selected:bg-ink aria-selected:text-bg"
          >
            {t === "cartas" ? "Cartas" : "Fotos e vídeos"}
          </button>
        ))}
      </div>

      {tab === "cartas" ? (
        <CardsPanel
          collection={collection}
          cards={cards}
          info={info}
          radar={radar}
          owned={owned}
          onAdded={(card, cardInfo) => {
            setCards((prev) => [card, ...prev]);
            setInfo((prev) => ({ ...prev, [card.card_id]: cardInfo }));
          }}
          onChange={(cardId, patch) => setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...patch } : c)))}
          onRemoved={(cardId) => setCards((prev) => prev.filter((c) => c.id !== cardId))}
        />
      ) : (
        <MediaPanel collectionId={collection.id} media={media} urls={urls} onChanged={refreshMedia} />
      )}

      <div className="border-t border-line pt-6">
        <button type="button" onClick={handleDelete} className="rounded-full border border-accent px-4 py-2 text-sm font-bold text-accent">
          Apagar {label.toLowerCase()}
        </button>
      </div>
    </div>
  );
}

function PriceInput({ id, label, value, onSave }: { id: string; label: string; value: number | null; onSave: (v: number | null) => Promise<void> }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-ink-soft" htmlFor={id}>
      {label}
      <input
        id={id}
        inputMode="decimal"
        placeholder="0,00"
        defaultValue={value ?? ""}
        onBlur={async (e) => {
          const next = parseBRL(e.target.value);
          if (next !== value) await onSave(next);
        }}
        className="w-24 rounded-lg border border-line bg-bg px-2 py-1 text-ink"
      />
    </label>
  );
}

function CardsPanel({
  collection,
  cards,
  info,
  radar,
  owned,
  onAdded,
  onChange,
  onRemoved,
}: {
  collection: Collection;
  cards: CollectionCard[];
  info: Record<string, CardInfo>;
  radar: Record<string, RadarSummary>;
  owned: Record<string, number>;
  onAdded: (card: CollectionCard, info: CardInfo) => void;
  onChange: (id: string, patch: Partial<CollectionCard>) => void;
  onRemoved: (id: string) => void;
}) {
  const [error, setError] = useState("");

  return (
    <div className="space-y-4">
      <CardPicker
        placeholder="Adicionar carta: busque pelo nome (em inglês)"
        onPick={async (picked) => {
          setError("");
          try {
            const response = await fetch(`/api/tcg/card/${encodeURIComponent(picked.id)}`);
            const data = response.ok
              ? ((await response.json()) as { set: string; localId: string; official?: number; estimate: { brl: number } | null })
              : null;
            const card = await addCard({
              collection_id: collection.id,
              card_id: picked.id,
              card_name: picked.name,
              set_name: data?.set ?? null,
              image: picked.image,
            });
            onAdded(card, { brl: data?.estimate?.brl ?? null, localId: data?.localId ?? picked.localId, official: data?.official });
          } catch (e) {
            setError(e instanceof Error ? e.message : "Não foi possível adicionar.");
          }
        }}
      />
      {error && <p role="alert" className="text-sm text-accent">{error}</p>}
      {cards.length === 0 && <p className="text-ink-soft">Nenhuma carta ainda. Busque acima para adicionar.</p>}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const unit = unitValue(c, info, radar);
          const ref = info[c.card_id];
          const ligaRef = { name: c.card_name, localId: ref?.localId ?? c.card_id.split("-").pop() ?? "", official: ref?.official };
          const hit = collection.kind === "desejos" && c.target_brl != null && unit != null && unit <= c.target_brl;
          const have = owned[c.card_id] ?? 0;
          return (
            <li key={c.id} className={`flex gap-3 rounded-2xl border bg-surface p-3 ${hit ? "border-good" : "border-line"}`}>
              <Link href={`/tcg/cartas/${c.card_id}`} className="shrink-0">
                {c.image ? (
                  <img src={c.image} alt={c.card_name} loading="lazy" className="aspect-[5/7] w-20 rounded-lg object-cover" />
                ) : (
                  <span className="grid aspect-[5/7] w-20 place-items-center rounded-lg bg-surface-2 text-[10px]">Sem imagem</span>
                )}
              </Link>
              <div className="min-w-0 flex-1 space-y-1.5 text-sm">
                <p className="truncate font-bold">{c.card_name}</p>
                <p className="truncate text-xs text-ink-soft">{c.set_name}</p>
                <p className="text-xs">
                  {unit == null ? "Sem preço" : <><strong>{formatMoney(unit, "BRL")}</strong> <span className="text-ink-soft">({valueSource(c, radar)})</span></>}
                  {c.paid_brl != null && <span className="text-ink-soft"> · paguei {formatMoney(c.paid_brl, "BRL")}</span>}
                </p>
                {hit && <p className="text-xs font-bold text-good">🎯 Chegou no seu preço-alvo!</p>}
                {collection.kind === "deck" && (
                  <p className={`text-xs font-semibold ${have >= c.quantity ? "text-good" : "text-accent"}`}>
                    Nas suas pastas: {have}/{c.quantity}
                  </p>
                )}
                {collection.kind === "desejos" ? (
                  <PriceInput id={`alvo-${c.id}`} label="Alvo (R$)" value={c.target_brl} onSave={async (target_brl) => {
                    await updateCard(c.id, { target_brl });
                    onChange(c.id, { target_brl });
                  }} />
                ) : (
                  <PriceInput id={`br-${c.id}`} label="Preço BR (R$)" value={c.market_brl} onSave={async (market_brl) => {
                    await updateCard(c.id, { market_brl });
                    onChange(c.id, { market_brl });
                  }} />
                )}
                <div className="flex flex-wrap items-center gap-1.5">
                  <label className="sr-only" htmlFor={`q-${c.id}`}>Quantidade</label>
                  <input
                    id={`q-${c.id}`}
                    type="number"
                    min={1}
                    max={999}
                    defaultValue={c.quantity}
                    onBlur={async (e) => {
                      const quantity = Math.max(1, Number(e.target.value) || 1);
                      if (quantity !== c.quantity) {
                        await updateCard(c.id, { quantity });
                        onChange(c.id, { quantity });
                      }
                    }}
                    className="w-16 rounded-lg border border-line bg-bg px-2 py-1"
                  />
                  {collection.kind !== "desejos" && (
                    <>
                      <label className="sr-only" htmlFor={`c-${c.id}`}>Estado</label>
                      <select
                        id={`c-${c.id}`}
                        value={c.condition ?? ""}
                        onChange={async (e) => {
                          const condition = e.target.value || null;
                          await updateCard(c.id, { condition });
                          onChange(c.id, { condition });
                        }}
                        className="rounded-lg border border-line bg-bg px-2 py-1"
                      >
                        <option value="">Estado</option>
                        {CONDITIONS.map((cond) => <option key={cond}>{cond}</option>)}
                      </select>
                    </>
                  )}
                  <a href={liga.card(ligaRef)} target="_blank" rel="noopener noreferrer" className="rounded-lg px-2 py-1 text-xs font-bold text-accent-3 hover:bg-surface-2" title="Ver ofertas desta carta na Liga Pokémon">
                    Liga ↗
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      await removeCard(c.id);
                      onRemoved(c.id);
                    }}
                    className="ml-auto rounded-lg px-2 py-1 text-xs font-bold text-accent hover:bg-surface-2"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MediaPanel({
  collectionId,
  media,
  urls,
  onChanged,
}: {
  collectionId: string;
  media: CollectionMedia[];
  urls: Record<string, string>;
  onChanged: () => Promise<void>;
}) {
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function handleFiles(files: FileList | File[]) {
    setError("");
    const list = [...files];
    setUploading(list.length);
    for (const file of list) {
      try {
        await uploadMedia(collectionId, file);
      } catch (e) {
        setError(`${file.name}: ${e instanceof Error ? e.message : "falha no envio"}`);
      }
      setUploading((n) => n - 1);
    }
    await onChanged();
  }

  return (
    <div className="space-y-4">
      <label
        htmlFor="upload"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed p-8 text-center transition ${dragging ? "border-accent bg-accent/5" : "border-line"}`}
      >
        <span className="font-display text-xl font-bold">Arraste fotos e vídeos aqui</span>
        <span className="text-sm text-ink-soft">ou toque para escolher · JPG, PNG, HEIC, MP4, MOV · até 50 MB cada</span>
        <input
          id="upload"
          type="file"
          multiple
          accept="image/*,video/*"
          className="sr-only"
          onChange={(e) => e.target.files && void handleFiles(e.target.files)}
        />
      </label>
      {uploading > 0 && <p className="text-sm text-ink-soft">Enviando {uploading} arquivo(s)…</p>}
      {error && <p role="alert" className="text-sm text-accent">{error}</p>}
      {media.length === 0 && uploading === 0 && <p className="text-ink-soft">Nenhuma foto ou vídeo ainda.</p>}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {media.map((m) => {
          const url = urls[m.path];
          return (
            <li key={m.id} className="group relative overflow-hidden rounded-2xl border border-line bg-surface-2">
              {url && m.mime.startsWith("video/") ? (
                <video src={url} controls preload="metadata" className="aspect-square w-full bg-black object-contain" />
              ) : url ? (
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={m.caption ?? "Foto da coleção"} loading="lazy" className="aspect-square w-full object-cover" />
                </a>
              ) : (
                <div className="grid aspect-square place-items-center text-xs text-ink-soft">Carregando…</div>
              )}
              <button
                type="button"
                onClick={async () => {
                  await deleteMedia(m);
                  await onChanged();
                }}
                className="absolute right-2 top-2 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
              >
                Apagar
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
