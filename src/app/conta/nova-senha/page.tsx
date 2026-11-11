"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updatePassword, useUser } from "@/lib/account";

export default function NewPasswordPage() {
  const user = useUser();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Criar nova senha</h1>
      {user === undefined ? (
        <p className="text-ink-soft">Carregando…</p>
      ) : user === null ? (
        <p className="text-ink-soft">O link expirou. Peça um novo em “Esqueci minha senha”.</p>
      ) : (
        <form
          className="space-y-3 rounded-3xl border border-line bg-surface p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await updatePassword(password);
              router.replace("/conta");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Não foi possível.");
              setBusy(false);
            }
          }}
        >
          <input
            className="w-full rounded-xl border border-line bg-bg px-4 py-3"
            type="password"
            required
            minLength={8}
            pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,}"
            title="Pelo menos 8 caracteres, com letras e números"
            autoComplete="new-password"
            placeholder="Nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Nova senha"
          />
          <button disabled={busy} className="w-full rounded-full bg-accent px-5 py-3 font-bold text-white disabled:opacity-50">
            Salvar senha
          </button>
          {error && <p role="alert" className="text-sm text-accent">{error}</p>}
        </form>
      )}
    </div>
  );
}
