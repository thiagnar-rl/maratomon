import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre com seu e-mail para salvar seu progresso na nuvem.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-16 sm:px-6">
      <header className="space-y-2">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Sua conta</h1>
        <p className="text-ink-soft">
          Sem senha: enviamos um link de acesso para o seu e-mail. Seu progresso deste aparelho é juntado ao da conta.
        </p>
      </header>
      <LoginForm />
    </div>
  );
}
