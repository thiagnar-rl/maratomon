"use client";

import Link from "next/link";
import { useState } from "react";
import { useProgress } from "@/lib/progress/hooks";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

type FormState = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; email: string } | { kind: "error"; message: string };

export function LoginForm() {
  const { email: signedInEmail } = useProgress();
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [state, setState] = useState<FormState>({ kind: "idle" });

  if (!isSupabaseConfigured) {
    return (
      <p className="rounded-2xl border border-line bg-surface-2 p-4 text-sm text-ink-soft">
        O login ainda não foi configurado. Siga a seção “Supabase” do README para ativar.
      </p>
    );
  }

  if (signedInEmail) {
    return (
      <div className="space-y-4 rounded-3xl border border-line bg-surface p-6">
        <p>
          Conectado como <strong>{signedInEmail}</strong>.
        </p>
        <button
          type="button"
          onClick={() => getSupabase()?.auth.signOut()}
          className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold hover:border-ink-soft"
        >
          Sair
        </button>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setState({ kind: "sending" });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/minha-jornada` },
    });
    setState(error ? { kind: "error", message: "Não foi possível enviar o link. Confira o e-mail e tente de novo." } : { kind: "sent", email });
  }

  if (state.kind === "sent") {
    return (
      <p className="rounded-3xl border border-line bg-surface p-6">
        Pronto! Abra o link que enviamos para <strong>{state.email}</strong> neste mesmo navegador.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-line bg-surface p-6">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-semibold">E-mail</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-line bg-bg px-4 py-3 outline-none focus:border-ink-soft"
          placeholder="voce@exemplo.com"
        />
      </div>
      <label htmlFor="aceite" className="flex items-start gap-2 text-sm text-ink-soft">
        <input id="aceite" type="checkbox" required checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1" />
        <span>
          Li e aceito os <Link href="/termos" className="underline">Termos de uso</Link> e a{" "}
          <Link href="/privacidade" className="underline">Política de privacidade</Link>.
        </span>
      </label>
      <button
        type="submit"
        disabled={state.kind === "sending" || !accepted}
        className="w-full rounded-full bg-accent px-5 py-3 font-bold text-accent-ink transition hover:brightness-110 disabled:opacity-50"
      >
        {state.kind === "sending" ? "Enviando…" : "Receber link de acesso"}
      </button>
      {state.kind === "error" && <p role="alert" className="text-sm text-accent">{state.message}</p>}
    </form>
  );
}
