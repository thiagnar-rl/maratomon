"use client";

import { useState, useSyncExternalStore } from "react";
import type { Episode, Provider } from "@/lib/catalog";
import { YouTubeDubPlayer } from "./youtube-dub-player";

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
  // null = ainda tentando; true = dublado; false = o YouTube não deixou trocar a faixa.
  const [dubbed, setDubbed] = useState<boolean | null>(null);

  return (
    <div className="space-y-4">
      {episode.youtubeId ? (
        <div
          id="assistir"
          className="relative aspect-video scroll-mt-24 overflow-hidden rounded-3xl border border-line bg-black shadow-[var(--glow)]"
        >
          {playing ? (
            <YouTubeDubPlayer videoId={episode.youtubeId} title={`${episode.title} — vídeo oficial`} onAudio={setDubbed} />
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
            Ainda não há um vídeo oficial gratuito e dublado deste episódio.
          </p>
        </div>
      )}

      {/* Plano B: só se a troca para a dublagem falhou. O normal é o episódio tocar aqui mesmo, dentro do site. */}
      {episode.youtubeId && episode.youtubeAudio === "multi" && playing && dubbed === false && (
        <>
          <AudioTip />
          <OpenInApp videoId={episode.youtubeId} />
        </>
      )}

      <ul className="grid gap-2 sm:grid-cols-2">
        {providers
          // Se o episódio já toca aqui, não mandamos a pessoa para fora do site.
          .filter((provider) => !(episode.youtubeId && provider.type === "youtube"))
          .map((provider) => (
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

/**
 * Plano B, só no celular/tablet e só quando a dublagem não entrou no site: abre o episódio no app do YouTube. O app tem o menu "Faixa de áudio" e já escolhe a dublagem
 * pelo idioma do aparelho, coisa que o player embutido em sites não faz nesses aparelhos.
 */
function OpenInApp({ videoId }: { videoId: string }) {
  const touch = useIsTouchDevice();
  if (!touch) return null;
  return (
    <a
      href={`https://www.youtube.com/watch?v=${videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-accent-ink shadow-lg transition active:scale-[0.98]"
    >
      🇧🇷 Assistir dublado no app do YouTube
    </a>
  );
}

/** Celular ou tablet (tela de toque): o player do YouTube nesses aparelhos não mostra o menu "Faixa de áudio". */
function useIsTouchDevice() {
  return useSyncExternalStore(
    () => () => {},
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
}

/** Só aparece se o YouTube não deixou o site trocar para a dublagem automaticamente. */
function AudioTip() {
  const touch = useIsTouchDevice();
  return (
    <div className="space-y-1 rounded-2xl border border-accent-2/60 bg-accent-2/10 p-4">
      <p className="font-bold">🇧🇷 Ficou em inglês?</p>
      {touch ? (
        <p className="text-sm text-ink-soft">
          No celular, o player embutido nem sempre deixa trocar o áudio. Se preferir, toque em <strong>Assistir dublado no app do YouTube</strong> logo
          abaixo: no app, o episódio abre em português se o seu YouTube estiver em português; se não, toque em ⚙ › <strong>Faixa de áudio</strong> ›{" "}
          <strong>Português (Brasil)</strong>.
        </p>
      ) : (
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
          <li>No player:</li>
          <li className="rounded-lg bg-surface px-2 py-1 font-semibold text-ink">⚙ Configurações</li>
          <li aria-hidden="true">›</li>
          <li className="rounded-lg bg-surface px-2 py-1 font-semibold text-ink">Faixa de áudio</li>
          <li aria-hidden="true">›</li>
          <li className="rounded-lg bg-surface px-2 py-1 font-semibold text-ink">Português (Brasil)</li>
        </ol>
      )}
    </div>
  );
}
