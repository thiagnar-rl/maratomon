"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sendPasswordReset, signInWithEmail, signUpWithEmail, useUser } from "@/lib/account";
import { isSupabaseConfigured } from "@/lib/supabase";

type Mode = "entrar" | "criar" | "senha";

const input = "w-full rounded-xl border border-line bg-bg px-4 py-3 outline-none transition focus:border-accent";

/** Painel de login e criação de conta com e-mail e senha. */
export function AuthPanel({ initialMode = "entrar" }: { initialMode?: "entrar" | "criar" }) {
  const router = useRouter();
  const user = useUser();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  useEffect(() => {
    if (user) router.replace("/conta");
  }, [user, router]);

  if (!isSupabaseConfigured) {
    return <p className="rounded-2xl border border-line bg-surface-2 p-4 text-sm text-ink-soft">O login ainda não foi configurado.</p>;
  }

  async function run(action: () => Promise<string | void>) {
    setError("");
    setBusy(true);
    try {
      const message = await action();
      if (message) setDone(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-3 rounded-3xl border border-line bg-surface p-6 text-center">
        <p className="text-4xl">📬</p>
        <p className="font-semibold">{done}</p>
        <button type="button" onClick={() => setDone("")} className="text-sm font-bold text-accent">
          Voltar
        </button>
      </div>
    );
  }

  const tabs: [Mode, string][] = [
    ["entrar", "Entrar"],
    ["criar", "Criar conta"],
  ];

  return (
    <div className="space-y-6 rounded-[2rem] border border-line bg-surface p-6 shadow-[var(--glow)] sm:p-8">
      {(mode === "entrar" || mode === "criar") && (
        <div role="tablist" aria-label="Acesso" className="grid grid-cols-2 rounded-full bg-surface-2 p-1">
          {tabs.map(([m, label]) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setError("");
              }}
              className="rounded-full py-2 text-sm font-bold text-ink-soft transition aria-selected:bg-surface aria-selected:text-ink aria-selected:shadow"
            >
              {label}
            </button>
          ))}
        </div>
      )}


      {mode === "entrar" && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run(() => signInWithEmail(email, password));
          }}
        >
          <input className={input} type="email" required autoComplete="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="E-mail" />
          <input className={input} type="password" required autoComplete="current-password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Senha" />
          <button disabled={busy} className="w-full rounded-full bg-accent px-5 py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50">
            {busy ? "Entrando…" : "Entrar"}
          </button>
          <button type="button" onClick={() => setMode("senha")} className="text-sm font-semibold text-ink-soft hover:text-ink">
            Esqueci minha senha
          </button>
        </form>
      )}

      {mode === "criar" && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              const { needsConfirmation } = await signUpWithEmail({ name, email, password, marketing });
              return needsConfirmation ? `Quase lá! Enviamos um link de confirmação para ${email}.` : undefined;
            });
          }}
        >
          <input className={input} required autoComplete="name" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nome" maxLength={120} />
          <input className={input} type="email" required autoComplete="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="E-mail" />
          <input
            className={input}
            type="password"
            required
            minLength={8}
            pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,}"
            title="Pelo menos 8 caracteres, com letras e números"
            autoComplete="new-password"
            placeholder="Senha (8+ caracteres, letras e números)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Senha"
          />
          <label className="flex items-start gap-2 text-sm text-ink-soft">
            <input type="checkbox" required checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 accent-[var(--accent)]" />
            <span>
              Li e aceito os <Link href="/termos" className="underline">Termos de uso</Link> e a{" "}
              <Link href="/privacidade" className="underline">Política de privacidade</Link>.
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1 accent-[var(--accent)]" />
            <span>Quero receber novidades e ofertas da loja Maratomon TCG (opcional).</span>
          </label>
          <button disabled={busy || !terms} className="w-full rounded-full bg-accent px-5 py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50">
            {busy ? "Criando…" : "Criar minha conta"}
          </button>
        </form>
      )}

      {mode === "senha" && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await sendPasswordReset(email);
              return `Se existir uma conta com ${email}, você vai receber um link para criar uma nova senha.`;
            });
          }}
        >
          <h2 className="font-display text-2xl font-extrabold">Recuperar senha</h2>
          <p className="text-sm text-ink-soft">Mandamos um link para você criar uma senha nova.</p>
          <input className={input} type="email" required autoComplete="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="E-mail" />
          <button disabled={busy} className="w-full rounded-full bg-accent px-5 py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50">
            {busy ? "Enviando…" : "Enviar link"}
          </button>
          <button type="button" onClick={() => setMode("entrar")} className="w-full text-sm font-semibold text-ink-soft hover:text-ink">
            ← Voltar
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
