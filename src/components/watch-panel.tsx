"use client";

import { useState, useSyncExternalStore } from "react";
import type { Episode, Provider } from "@/lib/catalog";

/**
 * Onde assistir o episódio.
 * - Se existe vídeo oficial no YouTube: mostra a miniatura e só carrega o player
 *   (youtube-nocookie) quando a pessoa clica. Isso deixa a página leve e evita
 *   cookies do YouTube antes do consentimento (LGPD).
 * - Sempre lista as fontes oficiais da temporada.
 */
export function WatchPanel({ episode, providers }: { episode: Episode; providers: Provider[] }) {
  const [clicked, setPlaying] = useState(false);
  // Vindo da lista com "Assistir" (#assistir), o player já abre carregado.
  const fromList = useSyncExternalStore(
    () => () => {},
    () => window.location.hash === "#assistir",
    () => false,
  );
  const playing = clicked || fromList;

  return (
    <div className="space-y-4">
      {episode.youtubeId ? (
        <div id="assistir" className="relative aspect-video scroll-mt-24 overflow-hidden rounded-3xl border border-line bg-black shadow-[var(--glow)]">
          {playing ? (
            <iframe
              className="absolute inset-0 size-full"
              src={`https://www.youtube-nocookie.com/embed/${episode.youtubeId}?autoplay=1&hl=pt-BR&cc_lang_pref=pt-BR`}
              title={`${episode.title} — vídeo oficial`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 grid place-items-center"
              aria-label={`Assistir "${episode.title}" no player do YouTube`}
            >
              <img
                src={`https://i.ytimg.com/vi/${episode.youtubeId}/hqdefault.jpg`}
                alt=""
                className="absolute inset-0 size-full object-cover opacity-80 transition group-hover:opacity-100"
              />
              <span className="relative grid size-20 place-items-center rounded-full bg-accent text-accent-ink shadow-xl transition group-hover:scale-110">
                <svg viewBox="0 0 24 24" className="ml-1 size-9" aria-hidden="true">
                  <path d="M7 5v14l12-7z" fill="currentColor" />
                </svg>
              </span>
              <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                Vídeo oficial · ao tocar, o YouTube pode usar cookies
              </span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid aspect-video place-items-center rounded-3xl border border-dashed border-line bg-surface-2 p-6 text-center">
          <p className="max-w-sm text-sm text-ink-soft">
            Ainda não há um vídeo oficial gratuito deste episódio. Veja abaixo onde ele está disponível dublado.
          </p>
        </div>
      )}

      {episode.youtubeId && (
        <p className="text-xs text-ink-soft">
          Se o áudio não começar em português, escolha <strong>Português (Brasil)</strong> em Configurações › Faixa de áudio no player.
        </p>
      )}

      <ul className="grid gap-2 sm:grid-cols-2">
        {providers.map((provider) => (
          <li key={provider.url + provider.label}>
            <a
              href={provider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-ink-soft"
            >
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
                  provider.free ? "bg-good/15 text-good" : "bg-surface-2 text-ink-soft"
                }`}
              >
                {provider.free ? "Grátis" : "Assinatura"}
              </span>
              <span className="text-sm font-semibold">{provider.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
