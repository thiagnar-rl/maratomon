"use client";

import { useEffect, useState } from "react";
import { enabledProviders, PROVIDER_LABEL, SOCIAL, signInWithProvider, type SocialProvider } from "@/lib/account";

export function ProviderIcon({ provider, className = "size-5" }: { provider: SocialProvider; className?: string }) {
  if (provider === "google")
    return (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
    );
  if (provider === "facebook")
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path fill="currentColor" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.77-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.66zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.66 1.37-.58.67-1.09 1.75-.96 2.79 1.02.08 2.05-.52 2.68-1.27z" />
    </svg>
  );
}

const STYLE: Record<SocialProvider, string> = {
  google: "bg-white text-[#1f1f1f] border border-[#dadce0] hover:bg-[#f7f8f8]",
  facebook: "bg-[#1877F2] text-white hover:bg-[#166fe0]",
  apple: "bg-black text-white hover:bg-[#1a1a1a] dark:ring-1 dark:ring-white/25",
};

/** Botões "Continuar com Google / Facebook / Apple". */
export function SocialButtons({ next = "/conta" }: { next?: string }) {
  const [enabled, setEnabled] = useState<Record<SocialProvider, boolean> | null>(null);
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    enabledProviders().then((e) => active && setEnabled(e));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-2.5">
      {SOCIAL.map((provider) => {
        const on = enabled?.[provider] ?? true;
        return (
          <button
            key={provider}
            type="button"
            disabled={busy !== null || !on}
            onClick={async () => {
              setError("");
              setBusy(provider);
              try {
                await signInWithProvider(provider, next);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Não foi possível continuar.");
                setBusy(null);
              }
            }}
            className={`relative flex w-full items-center justify-center gap-3 rounded-full px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${STYLE[provider]}`}
          >
            <span className="absolute left-5">
              <ProviderIcon provider={provider} />
            </span>
            {busy === provider ? "Abrindo…" : `Continuar com ${PROVIDER_LABEL[provider]}`}
            {!on && <span className="ml-1 rounded-full bg-black/10 px-2 text-[10px] font-bold uppercase">em breve</span>}
          </button>
        );
      })}
      {error && (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
