"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { addCards, createCollection, updateCard, type CollectionCard, type NewCard } from "@/lib/collection";
import { refreshCollection, useCollectionData } from "@/lib/collection-store";
import { ACCEPT_ALL, IMPORT_KINDS, parseText, readImportFile, type ImportKind, type ImportLine } from "@/lib/collection-io";
import { FileIcon, KIND_TONE } from "./file-icons";
import { bumpCounter } from "@/lib/achievements";
import { CONDITIONS } from "@/lib/collection";
import { LANGUAGES, type Language } from "@/lib/tcg/card-ref";
import { useProgress } from "@/lib/progress/hooks";

const PENDING = "forja:importacao-pendente";

type Candidate = { id: string; name: string; localId: string; setId: string; setName: string; setCode?: string; official: number; image: string | null; score: number };
type Row = ImportLine & { key: number; candidates: Candidate[]; pick: number; skip: boolean; searching?: boolean };

const EXAMPLE = `1 Charizard ex (199/165) [QUALIDADE=NM] [IDIOMA=PT]
4 Pikachu ex SSP 57
2x Mega Venusaur ex 003/132 [EN]
Mew ex 151/165
3 Ultra Ball`;

export function ImportFlow() {
  const { email, ready: authReady } = useProgress();
  const data = useCollectionData(Boolean(email));
  const [step, setStep] = useState<"entrada" | "identificando" | "conferir" | "salvando" | "pronto">("entrada");
  const [busyMsg, setBusyMsg] = useState("");
  const [source, setSource] = useState<{ name: string; kind: ImportKind } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState<"todas" | "duvida" | "faltando">("todas");
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [target, setTarget] = useState("nova");
  const [newName, setNewName] = useState(`Importação ${new Date().toLocaleDateString("pt-BR")}`);
  const [defaultLang, setDefaultLang] = useState<Language>("PT");
  const [merge, setMerge] = useState(true);
  const [result, setResult] = useState<{ added: number; merged: number; collectionId: string } | null>(null);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  // Quem conferiu a lista sem estar logado volta para ela depois de entrar
  useEffect(() => {
    if (!email) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(PENDING) ?? "null") as { rows: Row[]; source: typeof source } | null;
      if (!saved?.rows?.length) return;
      sessionStorage.removeItem(PENDING);
      const t = setTimeout(() => {
        setRows(saved.rows);
        setSource(saved.source);
        setStep("conferir");
      }, 0);
      return () => clearTimeout(t);
    } catch {
      // ignorado
    }
  }, [email]);

  // Arrastar um arquivo para qualquer lugar da página (computador)
  useEffect(() => {
    if (step !== "entrada") return;
    let depth = 0;
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth++;
      setDragging(true);
    };
    const over = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const leave = () => {
      depth = Math.max(0, depth - 1);
      if (!depth) setDragging(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      void onFile(e.dataTransfer?.files?.[0]);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const folders = data.collections.filter((c) => c.kind !== "desejos");
  const wishlists = data.collections.filter((c) => c.kind === "desejos");

  async function identifyAll(lines: ImportLine[]) {
    if (!lines.length) {
      setError("Não encontramos cartas nesse conteúdo. Confira o formato nos exemplos.");
      return;
    }
    if (lines.length > 6000) {
      setError("Envie no máximo 6.000 cartas por vez.");
      return;
    }
    setError("");
    setStep("identificando");
    setProgress(0);
    const out: Row[] = new Array(lines.length);
    const chunks: number[] = [];
    for (let i = 0; i < lines.length; i += 40) chunks.push(i);
    let done = 0;
    // 4 pedidos ao mesmo tempo: rápido sem sobrecarregar
    const worker = async () => {
      while (chunks.length) {
        const i = chunks.shift()!;
        const chunk = lines.slice(i, i + 40);
        let results: Candidate[][] = chunk.map(() => []);
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const r = await fetch("/api/tcg/identify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items: chunk.map(({ cardId, name, number, total, setCode, setName }) => ({ cardId, name, number, total, setCode, setName })) }),
            });
            if (r.ok) {
              results = ((await r.json()) as { results: Candidate[][] }).results;
              break;
            }
          } catch {
            // tenta mais uma vez; depois a linha fica para buscar à mão
          }
        }
        chunk.forEach((line, j) => (out[i + j] = { ...line, key: i + j, candidates: results[j] ?? [], pick: 0, skip: !(results[j] ?? []).length }));
        done += chunk.length;
        setProgress(Math.min(1, done / lines.length));
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    // arquivo de faltantes/desejos: sugere guardar numa lista de desejos
    const wanted = lines.filter((l) => l.status === "falta").length;
    if (wanted > lines.length * 0.6) {
      setTarget("nova-desejos");
      setNewName(`Faltantes ${new Date().toLocaleDateString("pt-BR")}`);
    }
    setRows(out);
    setStep("conferir");
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setStep("identificando");
    setProgress(0);
    setBusyMsg("Abrindo o arquivo…");
    try {
      const { kind, lines } = await readImportFile(file, setBusyMsg);
      setSource({ name: file.name, kind });
      setBusyMsg("");
      await identifyAll(lines);
    } catch (e) {
      setBusyMsg("");
      setError(e instanceof Error ? e.message : "Não foi possível ler o arquivo.");
      setStep("entrada");
    }
  }

  const update = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  async function searchAgain(row: Row, query: string) {
    update(row.key, { searching: true });
    try {
      const m = query.match(/(.*?)\s*([A-Z]{0,3}\d{1,3})\s*\/\s*(\d{1,3})\s*$/i);
      const params = new URLSearchParams(m ? { name: m[1], number: m[2], total: m[3] } : { name: query });
      const r = await fetch(`/api/tcg/identify?${params}`);
      const { candidates } = (await r.json()) as { candidates: Candidate[] };
      update(row.key, { candidates, pick: 0, skip: !candidates.length, searching: false });
    } catch {
      update(row.key, { searching: false });
    }
  }

  async function save() {
    setStep("salvando");
    setError("");
    try {
      let collectionId = target;
      if (target === "nova" || target === "nova-desejos")
        collectionId = (await createCollection({ kind: target === "nova" ? "pasta" : "desejos", name: newName.trim().slice(0, 80) || "Importação" })).id;
      const chosen = rows.filter((r) => !r.skip && r.candidates[r.pick]);
      // junta linhas repetidas (mesma carta, idioma e condição)
      const grouped = new Map<string, NewCard>();
      for (const r of chosen) {
        const c = r.candidates[r.pick];
        const language = r.language ?? defaultLang;
        const condition = r.condition ?? null;
        const key = `${c.id}|${language}|${condition}|${r.variant ?? ""}`;
        const prev = grouped.get(key);
        if (prev) prev.quantity = Math.min(999, (prev.quantity ?? 1) + r.quantity);
        else
          grouped.set(key, {
            collection_id: collectionId,
            card_id: c.id,
            card_name: c.name,
            set_name: c.setName,
            image: c.image,
            quantity: r.quantity,
            language,
            condition,
            variant: r.variant ?? null,
            paid_brl: r.paid ?? null,
          });
      }
      const existing = merge ? data.cards.filter((c) => c.collection_id === collectionId) : [];
      const toAdd: NewCard[] = [];
      let merged = 0;
      for (const item of grouped.values()) {
        const same = existing.find((e: CollectionCard) => e.card_id === item.card_id && e.language === item.language && (e.condition ?? null) === item.condition);
        if (same) {
          await updateCard(same.id, { quantity: Math.min(999, same.quantity + (item.quantity ?? 1)) });
          merged++;
        } else toAdd.push(item);
      }
      await addCards(toAdd);
      bumpCounter("import");
      await refreshCollection();
      setResult({ added: toAdd.length, merged, collectionId });
      setStep("pronto");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
      setStep("conferir");
    }
  }

  if (step === "identificando" || step === "salvando") {
    return (
      <div className="night-card space-y-4 rounded-[2rem] p-8 text-center">
        <p className="text-5xl motion-safe:animate-bounce">{step === "salvando" ? "💾" : "🔎"}</p>
        <p className="font-display text-2xl font-extrabold">{step === "salvando" ? "Guardando na sua coleção…" : busyMsg || "Identificando as cartas…"}</p>
        {step === "identificando" && !busyMsg && (
          <div className="mx-auto h-2 max-w-sm overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-500 transition-[width]" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
      </div>
    );
  }

  if (step === "pronto" && result) {
    return (
      <div className="night-card space-y-4 rounded-[2rem] p-8 text-center">
        <p className="text-6xl">🎉</p>
        <p className="font-display text-3xl font-extrabold">Importação concluída!</p>
        <p className="text-white/70">
          {result.added} {result.added === 1 ? "carta nova" : "cartas novas"}
          {result.merged > 0 && ` e ${result.merged} com quantidade somada`}.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href={`/colecao/${result.collectionId}`} className="rounded-full bg-blue-500 px-6 py-3 font-bold text-white">Ver a pasta</Link>
          <Link href="/colecao" className="rounded-full bg-white/10 px-6 py-3 font-bold">Ir para a coleção</Link>
          <button type="button" onClick={() => (setRows([]), setText(""), setSource(null), setStep("entrada"))} className="rounded-full bg-white/10 px-6 py-3 font-bold">Importar mais</button>
        </div>
      </div>
    );
  }

  if (step === "conferir") {
    const found = rows.filter((r) => !r.skip && r.candidates.length).length;
    const copies = rows.filter((r) => !r.skip && r.candidates.length).reduce((n, r) => n + r.quantity, 0);
    return (
      <div className="space-y-5">
        <div className="night-card flex flex-wrap items-center gap-4 rounded-[1.75rem] p-5">
          <div>
            {source && (
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-white/60">
                <FileIcon kind={source.kind} className="size-4" /> {source.name}
              </p>
            )}
            <p className="font-display text-2xl font-extrabold">{found} de {rows.length} linhas identificadas</p>
            <p className="text-sm text-white/65">{copies} cópias vão entrar. Confira as que estão em amarelo ou vermelho.</p>
          </div>
          <button type="button" onClick={() => (setSource(null), setStep("entrada"))} className="ml-auto rounded-full bg-white/10 px-4 py-2 text-sm font-bold">← Voltar</button>
        </div>

        <div className="flex flex-wrap gap-1 rounded-full bg-surface-2 p-1 text-sm font-bold" role="group" aria-label="Mostrar">
          {(
            [
              ["todas", `Todas (${rows.length})`],
              ["duvida", `Conferir (${rows.filter((r) => r.candidates[r.pick] && r.candidates[r.pick].score < 0.75).length})`],
              ["faltando", `Não encontradas (${rows.filter((r) => !r.candidates.length).length})`],
            ] as const
          ).map(([v, label]) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className="rounded-full px-4 py-1.5 text-ink-soft aria-pressed:bg-accent aria-pressed:text-white">
              {label}
            </button>
          ))}
        </div>

        <ul className="space-y-2">
          {rows
            .filter((r) => view === "todas" || (view === "faltando" ? !r.candidates.length : r.candidates[r.pick] && r.candidates[r.pick].score < 0.75))
            .map((r) => (
            <ImportRow key={r.key} row={r} onChange={(p) => update(r.key, p)} onSearch={(q) => searchAgain(r, q)} defaultLang={defaultLang} />
          ))}
        </ul>

        <div className="sticky bottom-3 z-20 space-y-3 rounded-[1.75rem] border border-line bg-surface/95 p-4 shadow-2xl backdrop-blur">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold">
              Guardar em
              <select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 font-normal">
                <option value="nova">➕ Nova pasta</option>
                <option value="nova-desejos">⭐ Nova lista de desejos</option>
                {folders.map((c) => (
                  <option key={c.id} value={c.id}>{c.kind === "deck" ? "Deck" : "Pasta"}: {c.name}</option>
                ))}
                {wishlists.map((c) => (
                  <option key={c.id} value={c.id}>Lista de desejos: {c.name}</option>
                ))}
              </select>
            </label>
            {target === "nova" || target === "nova-desejos" ? (
              <label className="text-sm font-bold">
                {target === "nova" ? "Nome da pasta" : "Nome da lista"}
                <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={80} className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 font-normal" />
              </label>
            ) : (
              <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold">
                <input type="checkbox" checked={merge} onChange={(e) => setMerge(e.target.checked)} /> Somar quantidade se a carta já estiver lá
              </label>
            )}
            <label className="text-sm font-bold">
              Idioma das linhas sem idioma
              <select value={defaultLang} onChange={(e) => setDefaultLang(e.target.value as Language)} className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 font-normal">
                {LANGUAGES.map(([code, name, flag]) => (
                  <option key={code} value={code}>{flag} {name}</option>
                ))}
              </select>
            </label>
            {email ? (
              <button type="button" disabled={!found} onClick={save} className="self-end rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-lg font-extrabold text-white shadow-lg disabled:opacity-50">
                Importar {copies} {copies === 1 ? "carta" : "cartas"}
              </button>
            ) : (
              <Link
                href="/entrar"
                onClick={() => {
                  try {
                    sessionStorage.setItem(PENDING, JSON.stringify({ rows, source }));
                  } catch {
                    // ignorado
                  }
                }}
                className="self-end rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-center text-lg font-extrabold text-white shadow-lg"
              >
                {authReady ? "Entre para salvar na sua coleção" : "…"}
              </Link>
            )}
          </div>
          {error && <p role="alert" className="text-sm font-semibold text-accent">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-[90] grid place-items-center bg-[#0b1230]/80 backdrop-blur-sm">
          <div className="rounded-[2rem] border-2 border-dashed border-sky-400 px-10 py-12 text-center text-white">
            <FileIcon kind="upload" className="mx-auto size-14 text-sky-400" />
            <p className="mt-3 font-display text-2xl font-extrabold">Solte para importar</p>
            <p className="text-white/60">Excel, CSV, PDF, imagem, Liga ou texto</p>
          </div>
        </div>
      )}

      <label
        htmlFor="arquivo-importar"
        onDragOver={(e) => e.preventDefault()}
        className="night-card group relative flex cursor-pointer flex-col items-center gap-3 overflow-hidden rounded-[2rem] p-8 text-center ring-1 ring-white/10 transition hover:ring-sky-400/60 focus-within:ring-2 focus-within:ring-sky-400 sm:p-10"
      >
        <span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600 text-white shadow-[0_12px_40px_-10px_rgb(56_189_248/0.8)] transition group-hover:scale-105">
          <FileIcon kind="upload" className="size-8" />
        </span>
        <span className="font-display text-2xl font-extrabold">Escolha o arquivo da sua coleção</span>
        <span className="max-w-md text-sm text-white/65">
          <span className="hidden sm:inline">Arraste para cá ou clique. </span>
          Aceitamos Excel, CSV, PDF, imagem (print ou foto), lista da Liga Pokémon e texto — até 15 MB.
        </span>
        <span className="mt-1 rounded-full bg-white px-6 py-3 font-bold text-[#121a3a] shadow-lg transition group-hover:bg-sky-100">Selecionar arquivo</span>
        <input
          id="arquivo-importar"
          type="file"
          accept={ACCEPT_ALL}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            void onFile(f);
          }}
        />
      </label>

      {error && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-rose-400/50 bg-rose-500/10 p-4 text-sm">
          <span className="text-xl">⚠️</span>
          <p className="font-semibold">{error}</p>
        </div>
      )}

      <section aria-labelledby="formatos-t" className="space-y-3">
        <h2 id="formatos-t" className="text-sm font-black uppercase tracking-[0.18em] text-ink-soft">Ou escolha pelo tipo</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {IMPORT_KINDS.map((k) => (
            <label key={k.kind} className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl p-3 text-center ring-1 transition hover:-translate-y-0.5 focus-within:ring-2 ${KIND_TONE[k.kind]}`}>
              <FileIcon kind={k.kind} className="size-7" />
              <span className="text-sm font-extrabold text-ink">{k.label}</span>
              <span className="text-[11px] text-ink-soft">{k.hint}</span>
              <input
                type="file"
                accept={k.accept}
                className="sr-only"
                aria-label={`Importar ${k.label}`}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  void onFile(f);
                }}
              />
            </label>
          ))}
        </div>
      </section>

      <section aria-labelledby="colar-t" className="space-y-3 rounded-[2rem] border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="colar-t" className="flex items-center gap-2 font-display text-xl font-extrabold">
            <FileIcon kind="paste" className="size-5 text-accent" /> Colar uma lista
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  const clip = await navigator.clipboard.readText();
                  if (clip) setText(clip);
                  else pasteRef.current?.focus();
                } catch {
                  pasteRef.current?.focus();
                }
              }}
              className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold"
            >
              Colar da área de transferência
            </button>
            <button type="button" onClick={() => setText(EXAMPLE)} className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold">Exemplo</button>
          </div>
        </div>
        <textarea
          ref={pasteRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder={EXAMPLE}
          aria-label="Lista de cartas"
          className="w-full rounded-2xl border border-line bg-bg p-4 font-mono text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => {
            setSource(null);
            void identifyAll(parseText(text));
          }}
          className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 py-3.5 font-extrabold text-white shadow-lg transition hover:brightness-110 disabled:opacity-40 sm:w-auto sm:px-8"
        >
          Identificar cartas →
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.5rem] border border-line bg-surface p-5 text-sm">
          <h2 className="font-display text-lg font-bold">Listas aceitas</h2>
          <ul className="mt-2 space-y-1.5 font-mono text-xs text-ink-soft">
            <li>1 Charizard ex (199/165) [QUALIDADE=NM] [IDIOMA=PT] <span className="font-sans">(Liga)</span></li>
            <li>4 Pikachu ex SSP 57 <span className="font-sans">(Pokémon TCG Live)</span></li>
            <li>2x Mew ex 151/165 [EN] (NM)</li>
            <li>3 Ultra Ball</li>
          </ul>
        </div>
        <div id="dica-pago" className="scroll-mt-32 rounded-[1.5rem] border border-line bg-surface p-5 text-sm">
          <h2 className="font-display text-lg font-bold">Planilhas, PDF e imagens</h2>
          <p className="mt-2 text-ink-soft">
            Em planilhas (Excel ou CSV), a primeira linha deve ter os nomes das colunas: <strong>Quantidade, Nome, Número</strong> (025/165), <strong>Coleção</strong> ou <strong>Sigla, Idioma, Condição, Versão, Pago (R$)</strong> — em português ou inglês. PDFs com tabela e prints de listas são lidos automaticamente; foto de uma carta funciona como o scanner.
          </p>
        </div>
      </section>
    </div>
  );
}

function ImportRow({ row, onChange, onSearch, defaultLang }: { row: Row; onChange: (p: Partial<Row>) => void; onSearch: (q: string) => void; defaultLang: Language }) {
  const [query, setQuery] = useState([row.name, row.number && row.total ? `${row.number}/${row.total}` : row.number].filter(Boolean).join(" "));
  const c = row.candidates[row.pick];
  const sure = c && c.score >= 0.75;
  const tone = !c ? "border-rose-400/60 bg-rose-500/5" : row.skip ? "border-line opacity-60" : sure ? "border-line" : "border-amber-400/60 bg-amber-400/5";
  return (
    <li className={`rounded-2xl border bg-surface p-3 [contain-intrinsic-size:auto_150px] [content-visibility:auto] ${tone}`}>
      <div className="flex gap-3">
        <span className="w-14 shrink-0">
          {c?.image ? <img src={c.image} alt={c.name} loading="lazy" className="aspect-[5/7] w-14 rounded-lg object-cover shadow" /> : <span className="grid aspect-[5/7] w-14 place-items-center rounded-lg bg-surface-2 text-xl">?</span>}
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate text-xs text-ink-soft" title={row.raw}>“{row.raw}”</p>
          {c ? (
            <p className="truncate font-bold">
              {c.name} <span className="font-normal text-ink-soft">· {c.setName} · #{c.localId}{c.official ? `/${c.official}` : ""}</span>
            </p>
          ) : (
            <p className="font-bold text-rose-500">Não encontramos esta carta</p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label className="flex items-center gap-1">
              Qtd
              <input type="number" min={1} max={999} value={row.quantity} onChange={(e) => onChange({ quantity: Math.max(1, Math.min(999, Number(e.target.value) || 1)) })} className="w-16 rounded-lg border border-line bg-bg px-2 py-1" />
            </label>
            <select value={row.language ?? defaultLang} onChange={(e) => onChange({ language: e.target.value as Language })} className="rounded-lg border border-line bg-bg px-2 py-1" aria-label="Idioma">
              {LANGUAGES.map(([code, , flag]) => (
                <option key={code} value={code}>{flag} {code}</option>
              ))}
            </select>
            <select value={row.condition ?? ""} onChange={(e) => onChange({ condition: e.target.value || undefined })} className="rounded-lg border border-line bg-bg px-2 py-1" aria-label="Condição">
              <option value="">Condição</option>
              {CONDITIONS.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
            {c && (
              <label className="ml-auto flex items-center gap-1 text-xs font-semibold">
                <input type="checkbox" checked={!row.skip} onChange={(e) => onChange({ skip: !e.target.checked })} /> Importar
              </label>
            )}
          </div>
          {row.candidates.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Outras opções">
              {row.candidates.map((o, i) => (
                <button key={o.id} type="button" onClick={() => onChange({ pick: i, skip: false })} aria-pressed={i === row.pick} className="shrink-0 rounded-lg p-0.5 ring-2 ring-transparent aria-pressed:ring-accent" title={`${o.name} · ${o.setName} #${o.localId}`}>
                  {o.image ? <img src={o.image} alt="" loading="lazy" className="aspect-[5/7] w-10 rounded object-cover" /> : <span className="block w-10 text-[9px]">{o.setCode ?? o.setId}</span>}
                </button>
              ))}
            </div>
          )}
          {(!c || !sure) && (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                onSearch(query);
              }}
            >
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome e número, ex.: Pikachu 025/165" className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-2 py-1 text-sm" aria-label="Buscar outra carta" />
              <button type="submit" disabled={row.searching} className="rounded-lg bg-accent px-3 text-sm font-bold text-white disabled:opacity-60">{row.searching ? "…" : "Buscar"}</button>
            </form>
          )}
        </div>
      </div>
    </li>
  );
}
