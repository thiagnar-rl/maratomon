"use client";

import Link from "next/link";
import { useProgress } from "@/lib/progress/hooks";
import { isSupabaseConfigured } from "@/lib/supabase";

/** Mostra o conteúdo só para quem está logado. */
export function RequireLogin({ children }: { children: React.ReactNode }) {
  const { email, ready } = useProgress();
  if (!isSupabaseConfigured) {
    return <p className="rounded-3xl border border-line bg-surface p-6 text-ink-soft">O login ainda não foi configurado neste site.</p>;
  }
  if (!ready) return <p className="text-ink-soft">Carregando…</p>;
  if (!email) {
    return (
      <div className="rounded-3xl border border-line bg-surface p-8 text-center">
        <p className="font-display text-2xl font-bold">Entre para montar sua coleção</p>
        <p className="mt-1 text-ink-soft">Suas cartas, fotos e vídeos ficam guardados na sua conta e só você vê.</p>
        <Link href="/entrar" className="mt-4 inline-block rounded-full bg-accent px-6 py-3 font-bold text-accent-ink">Entrar ou criar conta</Link>
      </div>
    );
  }
  return children;
}
