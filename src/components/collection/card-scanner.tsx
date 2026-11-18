"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { addCard, CONDITIONS, createCollection, removeCard, type CollectionCard } from "@/lib/collection";
import { patchLocal, refreshCollection, useCollectionData } from "@/lib/collection-store";
import { getOcrWorker, readCard, type OcrResult } from "@/lib/card-ocr";
import { bumpCounter } from "@/lib/achievements";
import { LANGUAGES, LANG_FLAG, VARIANTS, type Language } from "@/lib/tcg/card-ref";
import { formatMoney } from "@/lib/tcg/prices";
import type { PricedCard } from "@/lib/tcg/types";

type Candidate = { id: string; name: string; localId: string; setId: string; setName: string; setCode?: string; official: number; image: string | null; score: number };
const CARD_RATIO = 63 / 88;
const PREFS = "forja:scan-prefs";

/** Scanner: câmera com moldura da carta, leitura do número/nome, confirmação e adição em sequência. */
export function CardScanner() {
  const data = useCollectionData();
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camera, setCamera] = useState<"off" | "starting" | "on" | "denied" | "unsupported">("off");
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState<"" | "lendo" | "buscando" | "salvando" | "preparando">("");
  const [ocr, setOcr] = useState<OcrResult | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [pick, setPick] = useState(0);
  const [price, setPrice] = useState<PricedCard | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [language, setLanguage] = useState<Language>("PT");
  const [condition, setCondition] = useState("NM");
  const [variant, setVariant] = useState("Normal");
  const [target, setTarget] = useState("");
  const [manual, setManual] = useState("");
  const [session, setSession] = useState<CollectionCard[]>([]);
  const [toast, setToast] = useState("");

  const folders = data.collections.filter((c) => c.kind !== "desejos");

  // preferências lembradas (idioma, condição, pasta)
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PREFS) ?? "{}") as { language?: Language; condition?: string; target?: string };
      const fromUrl = new URLSearchParams(location.search).get("pasta");
      if (fromUrl && /^[0-9a-f-]{36}$/.test(fromUrl)) p.target = fromUrl;
      const t = setTimeout(() => {
        if (p.language) setLanguage(p.language);
        if (p.condition) setCondition(p.condition);
        if (p.target) setTarget(p.target);
      }, 0);
      return () => clearTimeout(t);
    } catch {
      // ignorado
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(PREFS, JSON.stringify({ language, condition, target }));
    } catch {
      // ignorado
    }
  }, [language, condition, target]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);
  useEffect(() => stop, [stop]);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera("unsupported");
      return;
    }
    setCamera("starting");
    void getOcrWorker(); // já baixa o leitor enquanto a câmera abre
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamera("on");
    } catch {
      setCamera("denied");
    }
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    try {
      await track?.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] });
      setTorch(!torch);
    } catch {
      setToast("Este aparelho não deixa ligar a lanterna pelo navegador.");
    }
  }

  /** Recorta da imagem a área da moldura (proporção de carta). */
  function cropFromVideo(): HTMLCanvasElement | null {
    const video = videoRef.current;
    const frame = frameRef.current;
    if (!video || !frame || !video.videoWidth) return null;
    const vr = video.getBoundingClientRect();
    const fr = frame.getBoundingClientRect();
    // vídeo em object-cover: calcula a escala entre tela e imagem
    const scale = Math.max(vr.width / video.videoWidth, vr.height / video.videoHeight);
    const offX = (video.videoWidth * scale - vr.width) / 2;
    const offY = (video.videoHeight * scale - vr.height) / 2;
    const sx = (fr.left - vr.left + offX) / scale;
    const sy = (fr.top - vr.top + offY) / scale;
    const sw = fr.width / scale;
    const sh = fr.height / scale;
    const c = document.createElement("canvas");
    c.width = Math.round(Math.min(1100, sw * 1.5));
    c.height = Math.round(c.width / CARD_RATIO);
    c.getContext("2d")!.drawImage(video, sx, sy, sw, sh, 0, 0, c.width, c.height);
    return c;
  }

  async function fromFile(file: File | undefined) {
    if (!file) return;
    const bmp = await createImageBitmap(file);
    // centraliza um recorte na proporção da carta
    let w = bmp.width;
    let h = w / CARD_RATIO;
    if (h > bmp.height) {
      h = bmp.height;
      w = h * CARD_RATIO;
    }
    const c = document.createElement("canvas");
    c.width = Math.round(Math.min(1100, w));
    c.height = Math.round(c.width / CARD_RATIO);
    c.getContext("2d")!.drawImage(bmp, (bmp.width - w) / 2, (bmp.height - h) / 2, w, h, 0, 0, c.width, c.height);
    await process(c);
  }

  async function process(card: HTMLCanvasElement) {
    setSnapshot(card.toDataURL("image/jpeg", 0.7));
    setCandidates(null);
    setPrice(null);
    setPick(0);
    setQuantity(1);
    setBusy("lendo");
    try {
      const read = await readCard(card);
      setOcr(read);
      await lookup({ name: read.name, number: read.number, total: read.total, setCode: read.setCode });
    } catch {
      setBusy("");
      setCandidates([]);
    }
  }

  async function lookup(q: { name?: string; number?: string; total?: string; setCode?: string }) {
    setBusy("buscando");
    const params = new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][]);
    try {
      const r = await fetch(`/api/tcg/identify?${params}`);
      const { candidates: list } = (await r.json()) as { candidates: Candidate[] };
      setCandidates(list);
      setPick(0);
      if (list[0]) void loadPrice(list[0].id);
    } catch {
      setCandidates([]);
    } finally {
      setBusy("");
    }
  }

  async function loadPrice(id: string) {
    setPrice(null);
    try {
      const r = await fetch(`/api/tcg/prices?ids=${encodeURIComponent(id)}`);
      const p = ((await r.json()) as Record<string, PricedCard>)[id];
      setPrice(p ?? null);
    } catch {
      // sem preço
    }
  }

  function capture() {
    const c = cropFromVideo();
    if (c) void process(c);
  }

  function manualSearch(e: React.FormEvent) {
    e.preventDefault();
    const m = manual.match(/(.*?)\s*([A-Z]{0,3}\d{1,3})\s*\/\s*(\d{1,3})\s*$/i);
    setSnapshot(null);
    setOcr(null);
    void lookup(m ? { name: m[1].trim() || undefined, number: m[2], total: m[3] } : { name: manual.trim() });
  }

  async function add() {
    const c = candidates?.[pick];
    if (!c) return;
    setBusy("salvando");
    try {
      let collectionId = target && folders.some((f) => f.id === target) ? target : "";
      if (!collectionId) {
        const existing = folders.find((f) => f.name === "Cartas escaneadas");
        collectionId = existing?.id ?? (await createCollection({ kind: "pasta", name: "Cartas escaneadas" })).id;
        setTarget(collectionId);
      }
      const saved = await addCard({
        collection_id: collectionId,
        card_id: c.id,
        card_name: c.name,
        set_name: c.setName,
        image: c.image,
        quantity,
        language,
        condition,
        variant: variant === "Normal" ? null : variant,
        added_brl: price?.brl ?? null,
      });
      bumpCounter("scan");
      patchLocal((d) => ({ cards: [saved, ...d.cards] }));
      setSession((s) => [saved, ...s]);
      setToast(`✓ ${c.name} adicionada`);
      setCandidates(null);
      setSnapshot(null);
      setOcr(null);
      setManual("");
      if (!data.collections.some((x) => x.id === collectionId)) void refreshCollection();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Não foi possível adicionar.");
    } finally {
      setBusy("");
    }
  }

  async function undo(card: CollectionCard) {
    await removeCard(card.id).catch(() => {});
    setSession((s) => s.filter((x) => x.id !== card.id));
    patchLocal((d) => ({ cards: d.cards.filter((x) => x.id !== card.id) }));
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const chosen = candidates?.[pick];
  const sessionValue = session.reduce((n, c) => n + (c.added_brl ?? 0) * c.quantity, 0);

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-[#070a18] text-white sm:overflow-hidden sm:rounded-[2rem]">
      <div className="flex items-center gap-3 px-4 pt-4">
        <Link href="/colecao" className="grid size-10 place-items-center rounded-full bg-white/10" aria-label="Voltar para a coleção">
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-extrabold">Escanear cartas</h1>
          <label className="flex items-center gap-1 text-xs text-white/60">
            Salvando em
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="max-w-[12rem] truncate rounded-md bg-white/10 px-1.5 py-0.5 font-bold text-white">
              <option value="">Cartas escaneadas (nova)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </label>
        </div>
        {camera === "on" && (
          <button type="button" onClick={toggleTorch} className={`grid size-10 place-items-center rounded-full ${torch ? "bg-amber-400 text-black" : "bg-white/10"}`} aria-label="Lanterna" aria-pressed={torch}>
            🔦
          </button>
        )}
      </div>

      <div className="relative mx-auto mt-4 aspect-[3/4] max-h-[62dvh] w-full overflow-hidden bg-black sm:rounded-3xl">
        <video ref={videoRef} playsInline muted className={`absolute inset-0 size-full object-cover ${camera === "on" ? "" : "hidden"}`} />
        {camera !== "on" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="text-6xl">📷</span>
            {camera === "denied" ? (
              <p className="max-w-xs text-white/75">Não conseguimos abrir a câmera. Libere o acesso à câmera para este site nas configurações do navegador, ou envie uma foto da carta.</p>
            ) : camera === "unsupported" ? (
              <p className="max-w-xs text-white/75">Este navegador não abre a câmera por aqui. Envie uma foto da carta.</p>
            ) : (
              <p className="max-w-xs text-white/75">Coloque a carta numa superfície lisa e com boa luz. A leitura acontece no seu aparelho — a foto não é enviada a ninguém.</p>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={start} disabled={camera === "starting"} className="rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-bold disabled:opacity-60">
                {camera === "starting" ? "Abrindo…" : "Abrir câmera"}
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-full bg-white/10 px-6 py-3 font-bold">
                🖼️ Enviar foto
              </button>
            </div>
          </div>
        )}
        {camera === "on" && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-black/45 [mask:linear-gradient(#000,#000)]" />
            <div ref={frameRef} className="absolute left-1/2 top-1/2 h-[82%] -translate-x-1/2 -translate-y-1/2 rounded-[1.1rem] shadow-[0_0_0_9999px_rgb(0_0_0/0.45)] ring-2 ring-white/80" style={{ aspectRatio: `${CARD_RATIO}` }}>
              {["left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl", "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-2xl", "right-0 bottom-0 border-r-4 border-b-4 rounded-br-2xl"].map((c) => (
                <span key={c} className={`absolute size-8 border-sky-400 ${c}`} />
              ))}
              {busy && <span className="absolute inset-x-2 h-0.5 bg-sky-400 shadow-[0_0_16px_4px_rgb(56_189_248/0.8)] motion-safe:animate-[scanline_1.6s_ease-in-out_infinite]" />}
              <span className="absolute inset-x-0 -bottom-9 text-center text-xs font-semibold text-white/80">Encaixe a carta e deixe o número do rodapé visível</span>
            </div>
          </>
        )}
        {busy && (
          <span className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1.5 text-sm font-bold backdrop-blur">
            {busy === "lendo" ? "Lendo a carta…" : busy === "buscando" ? "Procurando…" : busy === "salvando" ? "Salvando…" : "Preparando…"}
          </span>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void fromFile(e.target.files?.[0])} />
      </div>

      {camera === "on" && !candidates && (
        <div className="flex items-center justify-center gap-6 py-5">
          <button type="button" onClick={() => fileRef.current?.click()} className="grid size-12 place-items-center rounded-full bg-white/10 text-xl" aria-label="Enviar foto">
            🖼️
          </button>
          <button type="button" onClick={capture} disabled={!!busy} aria-label="Capturar carta" className="grid size-20 place-items-center rounded-full bg-white p-1.5 shadow-[0_0_40px_-5px_rgb(99_102_241/0.9)] transition active:scale-95 disabled:opacity-50">
            <span className="size-full rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
          </button>
          <span className="w-12" />
        </div>
      )}

      <div className="space-y-4 px-4 pb-8 pt-2">
        {candidates && (
          <section className="rounded-[1.75rem] border border-white/10 bg-[#121a33] p-4" aria-live="polite">
            {chosen ? (
              <>
                <div className="flex gap-4">
                  <img src={chosen.image ?? snapshot ?? ""} alt={chosen.name} className="aspect-[5/7] w-28 shrink-0 rounded-xl object-cover shadow-2xl" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-black uppercase tracking-wider text-sky-300">{chosen.score >= 0.75 ? "Encontramos" : "Será esta?"}</p>
                    <p className="font-display text-2xl font-extrabold leading-tight">{chosen.name}</p>
                    <p className="text-sm text-white/65">
                      {chosen.setName} · #{chosen.localId}
                      {chosen.official ? `/${chosen.official}` : ""}
                    </p>
                    <p className="font-display text-xl font-extrabold text-emerald-300">
                      {price?.brl != null ? formatMoney(price.brl, "BRL") : price ? "Sem preço" : "…"}
                      {price?.br && <span className="ml-1 text-[10px] text-white/60">BRASIL</span>}
                    </p>
                  </div>
                </div>
                {candidates.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Outras opções">
                    {candidates.map((o, i) => (
                      <button
                        key={o.id}
                        type="button"
                        aria-pressed={i === pick}
                        onClick={() => {
                          setPick(i);
                          void loadPrice(o.id);
                        }}
                        className="shrink-0 rounded-lg p-0.5 ring-2 ring-transparent aria-pressed:ring-sky-400"
                        title={`${o.name} · ${o.setName} #${o.localId}`}
                      >
                        {o.image ? <img src={o.image} alt="" className="aspect-[5/7] w-12 rounded object-cover" /> : <span className="block w-12 text-[9px]">{o.setCode}</span>}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <div className="flex items-center justify-between rounded-xl bg-white/10 px-2 py-1.5">
                    <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="size-7 rounded-lg bg-white/10 font-bold" aria-label="Menos">−</button>
                    <span className="font-bold tabular-nums">{quantity}</span>
                    <button type="button" onClick={() => setQuantity((q) => Math.min(999, q + 1))} className="size-7 rounded-lg bg-white/10 font-bold" aria-label="Mais">+</button>
                  </div>
                  <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="rounded-xl bg-white/10 px-2 py-2 font-semibold" aria-label="Idioma">
                    {LANGUAGES.map(([code, name, flag]) => (
                      <option key={code} value={code} className="text-black">{flag} {name}</option>
                    ))}
                  </select>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className="rounded-xl bg-white/10 px-2 py-2 font-semibold" aria-label="Condição">
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c} className="text-black">{c}</option>
                    ))}
                  </select>
                  <select value={variant} onChange={(e) => setVariant(e.target.value)} className="rounded-xl bg-white/10 px-2 py-2 font-semibold" aria-label="Versão">
                    {VARIANTS.map((v) => (
                      <option key={v} value={v} className="text-black">{v}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => (setCandidates(null), setSnapshot(null))} className="rounded-2xl bg-white/10 px-4 py-3 font-bold">
                    Tentar de novo
                  </button>
                  <button type="button" onClick={add} disabled={busy === "salvando"} className="flex-1 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-lg font-extrabold disabled:opacity-60">
                    {busy === "salvando" ? "Salvando…" : `Adicionar ${LANG_FLAG[language]}`}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-2 text-center">
                <p className="font-display text-xl font-extrabold">Não reconhecemos a carta</p>
                <p className="text-sm text-white/65">
                  {ocr?.number ? `Lemos o número ${ocr.number}/${ocr.total}, mas não achamos a coleção. ` : "Tente com mais luz e a carta reta, ou "}digite o número abaixo.
                </p>
                <button type="button" onClick={() => setCandidates(null)} className="rounded-full bg-white/10 px-5 py-2 font-bold">Escanear de novo</button>
              </div>
            )}
          </section>
        )}

        <form onSubmit={manualSearch} className="flex gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Ou digite: nome e número (Pikachu 025/165)"
            aria-label="Buscar carta pelo nome ou número"
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-sky-400"
          />
          <button type="submit" disabled={!manual.trim()} className="rounded-2xl bg-white/15 px-4 font-bold disabled:opacity-50">
            Buscar
          </button>
        </form>

        {session.length > 0 && (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="font-bold">
                Nesta sessão: {session.reduce((n, c) => n + c.quantity, 0)} {session.length === 1 ? "carta" : "cartas"}
              </p>
              <span className="font-display font-extrabold text-emerald-300">{formatMoney(sessionValue, "BRL")}</span>
            </div>
            <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {session.map((c) => (
                <li key={c.id} className="relative shrink-0">
                  {c.image ? <img src={c.image} alt={c.card_name} className="aspect-[5/7] w-16 rounded-lg object-cover" /> : <span className="block w-16 text-xs">{c.card_name}</span>}
                  <span className="absolute left-1 top-1 rounded-full bg-blue-600 px-1.5 text-[10px] font-black">x{c.quantity}</span>
                  <button type="button" onClick={() => undo(c)} className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-rose-500 text-xs font-black" aria-label={`Desfazer ${c.card_name}`}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <Link href="/colecao" className="mt-3 block rounded-2xl bg-white/10 py-2.5 text-center font-bold">Concluir e ver a coleção</Link>
          </section>
        )}
      </div>

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-6 z-[80] mx-auto max-w-sm rounded-2xl bg-emerald-500 px-4 py-3 text-center font-bold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
