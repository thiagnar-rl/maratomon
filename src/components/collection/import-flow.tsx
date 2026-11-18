"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { addCards, createCollection, updateCard, type CollectionCard, type NewCard } from "@/lib/collection";
import { refreshCollection, useCollectionData } from "@/lib/collection-store";
import { parseText, readImportFile, type ImportLine } from "@/lib/collection-io";
import { bumpCounter } from "@/lib/achievements";
import { CONDITIONS } from "@/lib/collection";
import { LANGUAGES, type Language } from "@/lib/tcg/card-ref";

type Candidate = { id: string; name: string; localId: string; setId: string; setName: string; setCode?: string; official: number; image: string | null; score: number };
type Row = ImportLine & { key: number; candidates: Candidate[]; pick: number; skip: boolean; searching?: boolean };

const EXAMPLE = `4 Pikachu ex SVI 57
1 Charizard ex (199/165) PT
2x Mega Venusaur ex 003/132 [EN]
Mew ex 151/165
3 Ultra Ball`;

export function ImportFlow() {
  const data = useCollectionData();
  const [step, setStep] = useState<"entrada" | "identificando" | "conferir" | "salvando" | "pronto">("entrada");
  const [mode, setMode] = useState<"colar" | "arquivo">("colar");
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [target, setTarget] = useState("nova");
  const [newName, setNewName] = useState(`Importação ${new Date().toLocaleDateString("pt-BR")}`);
  const [defaultLang, setDefaultLang] = useState<Language>("PT");
  const [merge, setMerge] = useState(true);
  const [result, setResult] = useState<{ added: number; merged: number; collectionId: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const folders = data.collections.filter((c) => c.kind !== "desejos");
  const wishlists = data.collections.filter((c) => c.kind === "desejos");

  async function identifyAll(lines: ImportLine[]) {
    if (!lines.length) {
      setError("Não encontramos cartas nesse conteúdo. Confira o formato nos exemplos.");
      return;
    }
    if (lines.length > 1500) {
      setError("Envie no máximo 1.500 linhas por vez.");
      return;
    }
    setError("");
    setStep("identificando");
    setProgress(0);
    const out: Row[] = [];
    for (let i = 0; i < lines.length; i += 40) {
      const chunk = lines.slice(i, i + 40);
      let results: Candidate[][] = chunk.map(() => []);
      try {
        const r = await fetch("/api/tcg/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: chunk.map(({ cardId, name, number, total, setCode, setName }) => ({ cardId, name, number, total, setCode, setName })) }),
        });
        if (r.ok) results = ((await r.json()) as { results: Candidate[][] }).results;
      } catch {
        // linhas ficam sem candidatas e podem ser buscadas à mão
      }
      chunk.forEach((line, j) => out.push({ ...line, key: i + j, candidates: results[j] ?? [], pick: 0, skip: !(results[j] ?? []).length }));
      setProgress(Math.min(1, (i + chunk.length) / lines.length));
    }
    setRows(out);
    setStep("conferir");
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      await identifyAll(await readImportFile(file));
    } catch (e) {
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
      if (target === "nova") collectionId = (await createCollection({ kind: "pasta", name: newName.trim().slice(0, 80) || "Importação" })).id;
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
        <p className="font-display text-2xl font-extrabold">{step === "salvando" ? "Guardando na sua coleção…" : "Identificando as cartas…"}</p>
        {step === "identificando" && (
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
          <button type="button" onClick={() => (setRows([]), setText(""), setStep("entrada"))} className="rounded-full bg-white/10 px-6 py-3 font-bold">Importar mais</button>
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
            <p className="font-display text-2xl font-extrabold">{found} de {rows.length} linhas identificadas</p>
            <p className="text-sm text-white/65">{copies} cópias vão entrar. Confira as que estão em amarelo ou vermelho.</p>
          </div>
          <button type="button" onClick={() => setStep("entrada")} className="ml-auto rounded-full bg-white/10 px-4 py-2 text-sm font-bold">← Voltar</button>
        </div>

        <ul className="space-y-2">
          {rows.map((r) => (
            <ImportRow key={r.key} row={r} onChange={(p) => update(r.key, p)} onSearch={(q) => searchAgain(r, q)} defaultLang={defaultLang} />
          ))}
        </ul>

        <div className="sticky bottom-3 z-20 space-y-3 rounded-[1.75rem] border border-line bg-surface/95 p-4 shadow-2xl backdrop-blur">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold">
              Guardar em
              <select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 font-normal">
                <option value="nova">➕ Nova pasta</option>
                {folders.map((c) => (
                  <option key={c.id} value={c.id}>{c.kind === "deck" ? "Deck" : "Pasta"}: {c.name}</option>
                ))}
                {wishlists.map((c) => (
                  <option key={c.id} value={c.id}>Lista de desejos: {c.name}</option>
                ))}
              </select>
            </label>
            {target === "nova" ? (
              <label className="text-sm font-bold">
                Nome da pasta
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
            <button type="button" disabled={!found} onClick={save} className="self-end rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-lg font-extrabold text-white shadow-lg disabled:opacity-50">
              Importar {copies} {copies === 1 ? "carta" : "cartas"}
            </button>
          </div>
          {error && <p role="alert" className="text-sm font-semibold text-accent">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div role="tablist" className="flex w-max gap-1 rounded-full bg-surface-2 p-1">
        {(
          [
            ["colar", "📋 Colar lista"],
            ["arquivo", "📁 Enviar arquivo"],
          ] as const
        ).map(([m, label]) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className="rounded-full px-4 py-2 text-sm font-bold text-ink-soft aria-selected:bg-accent aria-selected:text-white">
            {label}
          </button>
        ))}
      </div>

      {mode === "colar" ? (
        <div className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={EXAMPLE}
            aria-label="Lista de cartas"
            className="w-full rounded-[1.5rem] border border-line bg-surface p-4 font-mono text-sm outline-none focus:border-accent"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={!text.trim()} onClick={() => identifyAll(parseText(text))} className="rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-bold text-white disabled:opacity-50">
              Identificar cartas →
            </button>
            <button type="button" onClick={() => setText(EXAMPLE)} className="rounded-full border border-line px-4 py-3 text-sm font-bold">Usar exemplo</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void onFile(e.dataTransfer.files[0]);
          }}
          className="flex w-full flex-col items-center gap-2 rounded-[2rem] border-2 border-dashed border-accent/50 bg-accent/5 p-10 text-center transition hover:bg-accent/10"
        >
          <span className="text-5xl">📁</span>
          <span className="font-display text-xl font-extrabold">Toque para escolher ou arraste o arquivo</span>
          <span className="text-sm text-ink-soft">Excel (.xlsx), CSV ou texto (.txt) — até 5 MB</span>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.xlsx,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
        </button>
      )}
      {error && <p role="alert" className="font-semibold text-accent">{error}</p>}

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.5rem] border border-line bg-surface p-5 text-sm">
          <h2 className="font-display text-lg font-bold">Formatos de lista aceitos</h2>
          <ul className="mt-2 space-y-1.5 font-mono text-xs text-ink-soft">
            <li>4 Pikachu ex SVI 57 <span className="font-sans">(Pokémon TCG Live)</span></li>
            <li>1 Charizard ex (199/165) PT</li>
            <li>2x Mew ex 151/165 [EN] (NM)</li>
            <li>3 Ultra Ball</li>
          </ul>
          <p className="mt-2 text-ink-soft">Idioma (PT, EN, JP…), condição (NM, LP…) e versão (foil, reverse) entre colchetes ou parênteses são opcionais.</p>
        </div>
        <div id="dica-pago" className="scroll-mt-32 rounded-[1.5rem] border border-line bg-surface p-5 text-sm">
          <h2 className="font-display text-lg font-bold">Planilhas (Excel ou CSV)</h2>
          <p className="mt-2 text-ink-soft">
            A primeira linha precisa ter os nomes das colunas. Reconhecemos: <strong>Quantidade, Nome, Número</strong> (ex.: 025/165), <strong>Coleção</strong> ou <strong>Sigla</strong>, <strong>Idioma, Condição, Versão</strong> e <strong>Pago (R$)</strong> — o preço que você pagou entra no cálculo de lucro.
          </p>
          <p className="mt-2 text-ink-soft">Arquivos exportados daqui (Excel ou CSV) voltam exatamente como saíram.</p>
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
    <li className={`rounded-2xl border bg-surface p-3 ${tone}`}>
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
