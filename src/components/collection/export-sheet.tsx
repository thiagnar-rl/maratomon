"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { fetchCardInfo, type CardInfo, type CollectionCard } from "@/lib/collection";
import { computeStats, useCollectionData } from "@/lib/collection-store";
import { download, encodeShare, exportRows, toCsv, toLigaText, toLiveText, toNumberedText, toPdf, toXlsx, type SharePayload } from "@/lib/collection-io";
import { FileIcon, KIND_TONE } from "./file-icons";

import { Sheet, Toggle } from "./ui";

type Format = "xlsx" | "csv" | "pdf" | "imagem" | "liga" | "texto";
const FORMATS: [Format, string, string][] = [
  ["xlsx", "excel", "Excel"],
  ["csv", "csv", "CSV"],
  ["pdf", "pdf", "PDF"],
  ["imagem", "imagem", "Imagem"],
];
const LABEL: Record<Format, string> = { xlsx: "Excel", csv: "CSV", pdf: "PDF", imagem: "Imagem", liga: "lista da Liga", texto: "lista de texto" };

/** Arquivo pronto: o usuário toca para salvar ou compartilhar (funciona no iPhone, que bloqueia download automático). */
type Ready = { blob: Blob; name: string; url: string; text?: string };

const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const sizeLabel = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "colecao";

/** Exportar e compartilhar: escolhe o que (tudo, uma pasta, desejos, faltantes de uma coleção) e o formato. */
export function ExportSheet({ open, onClose, initialScope }: { open: boolean; onClose: () => void; initialScope?: string }) {
  const data = useCollectionData(open);
  const stats = useMemo(() => computeStats(data), [data]);
  const [scope, setScope] = useState(initialScope ?? "tudo");
  const [prices, setPrices] = useState(true);
  const [format, setFormat] = useState<Format>("xlsx");
  const [textStyle, setTextStyle] = useState<"numero" | "live">("numero");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [ready, setReady] = useState<Ready | null>(null);

  function finish(content: Blob | string, filename: string, type: string, text?: string) {
    const blob = typeof content === "string" ? new Blob([content], { type }) : content;
    if (ready) URL.revokeObjectURL(ready.url);
    setReady({ blob, name: filename, url: URL.createObjectURL(blob), text });
    // No computador baixa na hora; no celular o usuário toca em Salvar/Compartilhar.
    if (window.matchMedia("(pointer: fine)").matches) download(blob, filename);
  }

  async function shareReady() {
    if (!ready) return;
    const file = new File([ready.blob], ready.name, { type: ready.blob.type });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: ready.name });
      else download(ready.blob, ready.name);
    } catch {
      // compartilhamento cancelado
    }
  }

  const wishlists = data.collections.filter((c) => c.kind === "desejos");
  const folders = data.collections.filter((c) => c.kind !== "desejos");

  /** Monta as cartas do escopo escolhido (faltantes vêm da lista oficial da coleção). */
  async function gather(): Promise<{ title: string; kind: SharePayload["k"]; cards: CollectionCard[]; info: Record<string, CardInfo> }> {
    if (scope === "tudo") return { title: "Minha coleção", kind: "colecao", cards: stats.owned, info: data.info };
    if (scope === "desejos") return { title: "Lista de desejos", kind: "desejos", cards: stats.wanted, info: data.info };
    if (scope.startsWith("pasta:")) {
      const col = data.collections.find((c) => c.id === scope.slice(6));
      return { title: col?.name ?? "Pasta", kind: col?.kind === "desejos" ? "desejos" : "pasta", cards: data.cards.filter((c) => c.collection_id === col?.id), info: data.info };
    }
    const setId = scope.slice(7);
    const r = await fetch(`/api/tcg/sets/${encodeURIComponent(setId)}`);
    if (!r.ok) throw new Error("Não foi possível carregar a lista da coleção.");
    const set = (await r.json()) as { name: string; cards: { id: string; localId: string; name: string; image: string | null }[] };
    const have = new Set(stats.owned.map((c) => c.card_id));
    const missing = set.cards.filter((c) => !have.has(c.id));
    const info = prices ? await fetchCardInfo(missing.map((c) => c.id)) : {};
    const now = new Date().toISOString();
    return {
      title: `Faltam em ${set.name}`,
      kind: "faltam",
      info,
      cards: missing.map((c) => ({
        id: c.id,
        collection_id: "",
        card_id: c.id,
        card_name: c.name,
        set_name: set.name,
        image: c.image,
        quantity: 1,
        condition: null,
        paid_brl: null,
        market_brl: null,
        target_brl: null,
        language: "PT",
        variant: null,
        added_brl: null,
        created_at: now,
      })),
    };
  }

  async function run() {
    setBusy(true);
    setMessage("");
    try {
      const { title, cards, info } = await gather();
      if (!cards.length) throw new Error("Não há cartas nessa seleção.");
      const rows = exportRows(cards, data.collections, info, data.sets, data.radar);
      const value = rows.reduce((n, r) => n + (r.total ?? 0), 0);
      const copies = rows.reduce((n, r) => n + r.quantity, 0);
      const name = `${slug(title)}-${localDate()}`;
      if (format === "csv") finish(toCsv(rows, prices), `${name}.csv`, "text/csv;charset=utf-8");
      if (format === "xlsx") finish(await toXlsx(rows, prices, title), `${name}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      if (format === "pdf") finish(await toPdf(rows, prices, title, { value, copies }), `${name}.pdf`, "application/pdf");
      if (format === "liga" || format === "texto") {
        const text = format === "liga" ? toLigaText(rows) : textStyle === "live" ? toLiveText(rows) : toNumberedText(rows, prices);
        try {
          await navigator.clipboard.writeText(text);
          setMessage(format === "liga" ? "Lista da Liga copiada! Cole na Liga Pokémon (Compra por Lista ou na sua coleção) — ou salve o arquivo abaixo." : "Lista copiada! Também dá para salvar o arquivo abaixo.");
        } catch {
          setMessage("Lista pronta — salve ou compartilhe abaixo.");
        }
        finish(text, `${name}${format === "liga" ? "-liga" : ""}.txt`, "text/plain;charset=utf-8", text);
      }
      if (format === "imagem") {
        const top = [...rows].sort((a, b) => (b.total ?? 0) - (a.total ?? 0)).slice(0, 12);
        const byId = new Map(cards.map((c) => [c.card_id, c.image]));
        const response = await fetch("/api/colecao/imagem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            copies,
            value: prices ? value : null,
            cards: top.map((r) => ({ name: r.name, image: byId.get(r.cardId) ?? null, value: prices ? r.unit : null, quantity: r.quantity })),
          }),
        });
        if (!response.ok) throw new Error("Não foi possível gerar a imagem.");
        finish(await response.blob(), `${name}.png`, "image/png");
      }
      if (format !== "texto" && format !== "liga") setMessage("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Não foi possível exportar.");
    } finally {
      setBusy(false);
    }
  }

  async function makeLink() {
    setBusy(true);
    setMessage("");
    try {
      const { title, kind, cards } = await gather();
      if (!cards.length) throw new Error("Não há cartas nessa seleção.");
      const merged = new Map<string, [string, number, string]>();
      for (const c of cards) {
        const key = `${c.card_id}|${c.language}`;
        const prev = merged.get(key);
        merged.set(key, [c.card_id, (prev?.[1] ?? 0) + c.quantity, c.language ?? "PT"]);
      }
      const code = await encodeShare({ v: 1, t: title, k: kind, p: prices, c: [...merged.values()] });
      const url = `${location.origin}/colecao/compartilhada#${code}`;
      setLink(url);
      if (navigator.share) await navigator.share({ title, text: `${title} — Forja Arcana`, url }).catch(() => {});
      else await navigator.clipboard?.writeText(url).catch(() => {});
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Não foi possível gerar o link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Exportar coleção" icon={<FileIcon kind="upload" className="size-7" />}>
      <div className="space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-white/60">O que exportar</span>
          <select value={scope} onChange={(e) => (setScope(e.target.value), setLink(""))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white">
            <option value="tudo">Toda a minha coleção ({stats.copies} cópias)</option>
            {folders.map((c) => (
              <option key={c.id} value={`pasta:${c.id}`}>
                {c.kind === "deck" ? "Deck" : "Pasta"}: {c.name}
              </option>
            ))}
            {wishlists.length > 0 && <option value="desejos">Lista de desejos ({stats.wanted.length})</option>}
            {stats.sets.map((p) => (
              <option key={p.set.id} value={`faltam:${p.set.id}`}>
                Faltantes de {p.set.namePt ?? p.set.name} ({Math.max(0, p.set.total - p.master)})
              </option>
            ))}
          </select>
        </label>

        <Toggle checked={prices} onChange={setPrices} icon="🏷️" label="Mostrar preços" hint="O valor de cada carta, o preço pago e os totais vão junto." />

        <div>
          <p className="mb-2 text-sm font-bold text-white/60">Como compartilhar</p>
          <button
            type="button"
            onClick={makeLink}
            disabled={busy}
            className="flex w-full items-center gap-3 rounded-2xl border border-blue-400/40 bg-gradient-to-r from-blue-600/25 to-violet-600/25 p-4 text-left shadow-[0_0_30px_-10px_rgb(59_130_246/0.7)] disabled:opacity-60"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-blue-500/25 text-blue-300"><FileIcon kind="link" className="size-6" /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-bold">
                Link compartilhável <span className="rounded-md bg-blue-500 px-1.5 py-0.5 text-[10px] font-black">NOVO</span>
              </span>
              <span className="block text-sm text-white/65">Um link público com as cartas (ótimo para mandar as faltantes a outros colecionadores). Nada fica salvo em servidor.</span>
            </span>
            <span className="text-blue-300">→</span>
          </button>
          {link && (
            <div className="mt-2 flex gap-2">
              <input readOnly value={link} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2 text-xs" aria-label="Link gerado" />
              <button type="button" onClick={() => navigator.clipboard?.writeText(link).then(() => setMessage("Link copiado!"))} className="rounded-xl bg-white/15 px-3 text-sm font-bold">
                Copiar
              </button>
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-white/60">Formato do arquivo</p>
          <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Formato do arquivo">
            {FORMATS.map(([f, icon, label]) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={format === f}
                onClick={() => (setFormat(f), setReady(null), setMessage(""))}
                className={`flex items-center justify-center gap-2.5 rounded-2xl px-3 py-4 text-lg font-extrabold transition ${
                  format === f ? "bg-blue-500/15 text-blue-300 ring-2 ring-blue-400" : "bg-white/[0.06] text-white/80 ring-1 ring-white/10 hover:bg-white/10"
                }`}
              >
                <FileIcon kind={icon} className="size-6" /> {label}
              </button>
            ))}
          </div>

          <div className={`mt-3 rounded-2xl p-4 ring-1 transition ${format === "liga" ? "bg-cyan-500/15 ring-2 ring-cyan-300" : "bg-cyan-500/[0.07] ring-cyan-400/30"}`}>
            <p className="flex gap-3 text-[15px] font-semibold text-white/85">
              <FileIcon kind="liga" className="size-6 shrink-0 text-cyan-300" />
              Vai levar as cartas para a Liga Pokémon? A Liga não aceita planilha: ela lê a lista no formato dela.
            </p>
            <button type="button" onClick={() => (setFormat("liga"), setReady(null), setMessage(""))} aria-pressed={format === "liga"} className="ml-9 mt-2 font-extrabold text-cyan-300 underline-offset-4 hover:underline">
              {format === "liga" ? "✓ Lista da Liga selecionada" : "Gerar a lista da Liga"}
            </button>
            {format === "liga" && (
              <p className="ml-9 mt-2 font-mono text-xs text-cyan-100/80">1 Charizard ex (199/165) [QUALIDADE=NM] [IDIOMA=PT]</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => (setFormat("texto"), setReady(null), setMessage(""))}
            aria-pressed={format === "texto"}
            className={`mt-2 flex w-full items-center gap-2.5 rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${format === "texto" ? "bg-amber-400/15 text-amber-200 ring-2 ring-amber-300" : "bg-white/[0.04] text-white/70 ring-1 ring-white/10"}`}
          >
            <FileIcon kind="texto" className="size-5" /> Lista de texto simples (para grupos e sites de deck)
          </button>
          {format === "texto" && (
            <div className="mt-2 space-y-2 rounded-2xl bg-white/5 p-3 text-sm">
              <label className="flex items-start gap-2">
                <input type="radio" checked={textStyle === "numero"} onChange={() => setTextStyle("numero")} className="mt-1" />
                <span>Com número — <code className="text-amber-200">1 Charizard ex (199/165) PT</code></span>
              </label>
              <label className="flex items-start gap-2">
                <input type="radio" checked={textStyle === "live"} onChange={() => setTextStyle("live")} className="mt-1" />
                <span>Pokémon TCG Live — <code className="text-amber-200">4 Pikachu ex SSP 57</code></span>
              </label>
            </div>
          )}
        </div>

        {message && <p role="status" className="rounded-xl bg-white/10 px-3 py-2 text-sm">{message}</p>}

        {ready && (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-3 ring-1 ring-emerald-400/40">
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ring-1 ${KIND_TONE[format === "xlsx" ? "excel" : format] ?? KIND_TONE.texto}`}>
              <FileIcon kind={format === "xlsx" ? "excel" : format} className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">{ready.name}</span>
              <span className="text-xs text-white/60">{sizeLabel(ready.blob.size)} · pronto</span>
            </span>
            <a href={ready.url} download={ready.name} className="rounded-xl bg-white/15 px-3 py-2 text-sm font-bold">Salvar</a>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button type="button" onClick={shareReady} className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-white">Enviar</button>
            )}
          </div>
        )}

        <button type="button" onClick={run} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 py-4 text-lg font-extrabold text-white shadow-lg transition hover:bg-blue-400 disabled:opacity-60">
          <FileIcon kind="upload" className="size-5" />
          {busy ? "Gerando…" : `Exportar ${LABEL[format]}`}
        </button>
        <p className="text-center text-xs text-white/40">Para trazer cartas de outro site ou planilha, use <Link href="/colecao/importar" className="underline">Importar</Link>.</p>
      </div>
    </Sheet>
  );
}

