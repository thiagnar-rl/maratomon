"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Player do YouTube que tenta tocar a dublagem em português dentro do site.
 *
 * Os vídeos do canal oficial Pokémon TV têm várias faixas de áudio (inglês, português, espanhol…) e abrem no inglês.
 * A API oficial do player não documenta a troca de faixa, mas o player embutido expõe as funções internas
 * getAvailableAudioTracks/setAudioTrack. Usamos essas funções quando existem: se der certo, o episódio toca em
 * português e a legenda automática é desligada. Se o YouTube não permitir, o vídeo segue normal e avisamos
 * pelo onAudio(false).
 */

type Track = { id?: string; displayName?: string; languageCode?: string; audioTrackId?: string; [k: string]: unknown };
type YTPlayer = {
  getAvailableAudioTracks?: () => Track[];
  getAudioTrack?: () => Track;
  setAudioTrack?: (track: Track) => void;
  unloadModule?: (name: string) => void;
  setOption?: (module: string, option: string, value: unknown) => void;
  playVideo?: () => void;
  destroy?: () => void;
};
type YTNamespace = { Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer };

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;
function loadApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiPromise ??= new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });
  return apiPromise;
}

const isPortuguese = (t: Track) => {
  const text = `${t.languageCode ?? ""} ${t.displayName ?? ""} ${t.id ?? ""} ${t.audioTrackId ?? ""}`.toLowerCase();
  return /\bpt\b|pt-br|pt_br|portugu/.test(text);
};

/** Tenta trocar para a faixa em português. Retorna true se conseguiu. */
function trySetPortuguese(player: YTPlayer): boolean {
  try {
    const tracks = player.getAvailableAudioTracks?.() ?? [];
    const pt = tracks.find(isPortuguese);
    if (!pt || !player.setAudioTrack) return false;
    player.setAudioTrack(pt);
    // Dublado: tira a legenda automática.
    player.unloadModule?.("captions");
    return true;
  } catch {
    return false;
  }
}

export function YouTubeDubPlayer({ videoId, title, onAudio }: { videoId: string; title: string; onAudio?: (portuguese: boolean) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "pt" | "original">("loading");
  // Diagnóstico: abra o episódio com ?audio=diag para ver o que o player do YouTube oferece neste aparelho.
  const [diag, setDiag] = useState<string | null>(null);
  const isPt = useRef(false);

  useEffect(() => {
    let player: YTPlayer | null = null;
    let cancelled = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const report = () => {
      if (!player || !window.location.search.includes("audio=diag")) return;
      const fns = Object.keys(player).filter((k) => typeof (player as Record<string, unknown>)[k] === "function" && /audio|track|lang|option|module/i.test(k));
      let tracks = "—";
      try {
        tracks = JSON.stringify(player.getAvailableAudioTracks?.() ?? "função indisponível").slice(0, 400);
      } catch (e) {
        tracks = `erro: ${String(e)}`;
      }
      setDiag(`tentativa ${tries} · funções: ${fns.join(", ") || "nenhuma"} · faixas: ${tracks}`);
    };

    const attempt = () => {
      if (cancelled || !player) return;
      report();
      if (trySetPortuguese(player)) {
        isPt.current = true;
        setStatus("pt");
        onAudio?.(true);
        return;
      }
      // As faixas aparecem alguns instantes depois do vídeo começar: tenta por ~6 s.
      if (++tries < 12) timer = setTimeout(attempt, 500);
      else {
        setStatus("original");
        onAudio?.(false);
      }
    };

    loadApi().then((YT) => {
      if (cancelled || !host.current) return;
      const el = document.createElement("div");
      host.current.replaceChildren(el);
      player = new YT.Player(el, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: { autoplay: 1, rel: 0, hl: "pt-BR", cc_lang_pref: "pt", playsinline: 1, origin: window.location.origin },
        events: {
          onReady: () => {
            player?.playVideo?.();
            attempt();
          },
          onStateChange: (e: { data: number }) => {
            // Ao começar a tocar (1), confirma a faixa de novo: o YouTube às vezes volta ao áudio original.
            if (e.data === 1 && isPt.current && player) trySetPortuguese(player);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      try {
        player?.destroy?.();
      } catch {
        // ignorado
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <div className="absolute inset-0">
      <div ref={host} className="size-full [&>iframe]:size-full" title={title} />
      {diag && <p className="absolute inset-x-0 bottom-0 max-h-1/2 overflow-auto bg-black/85 p-2 font-mono text-[10px] text-white">{diag}</p>}
      {status === "pt" && (
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">🇧🇷 Dublado</span>
      )}
    </div>
  );
}
