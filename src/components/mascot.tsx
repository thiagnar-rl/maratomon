import { useId } from "react";

/**
 * Mascote do Maratomon TCG: um fantasminha roxo original segurando uma carta.
 * Desenho próprio da marca (não é personagem da franquia), seguro para usar na loja física.
 */
export function Mascot({ className = "", title }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c4a6ff" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#5b21b6" />
        </linearGradient>
        <radialGradient id={`g${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#a78bfa" stopOpacity="0.55" />
          <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill={`url(#g${id})`} />
      <ellipse cx="32" cy="60" rx="15" ry="2.6" fill="#000" opacity="0.22" />
      {/* braço esquerdo */}
      <ellipse cx="12" cy="37" rx="4.5" ry="3.2" fill="#7c4dea" transform="rotate(-35 12 37)" />
      {/* corpo */}
      <path
        d="M13 32C13 18.5 21.5 8 32 8s19 10.5 19 24v20c-2.4 4-5.4 4-7.6 0-2.1-3.8-5.4-3.8-7.6 0-2.2 4-5.4 4-7.6 0-2.1-3.8-5.4-3.8-7.6 0-2.2 4-5.2 4-7.6 0z"
        fill={`url(#b${id})`}
      />
      <path d="M20 17c3-4.5 7-6.5 11.5-6.5" stroke="#fff" strokeOpacity="0.45" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      {/* carta */}
      <g transform="rotate(14 51 37)">
        <rect x="44.5" y="27" width="13" height="18" rx="2.2" fill="#ffcb05" stroke="#fff" strokeWidth="1.6" />
        <rect x="47" y="29.6" width="8" height="6.4" rx="1" fill="#fff" opacity="0.85" />
        <rect x="47" y="38" width="8" height="1.6" rx="0.8" fill="#7a5a00" opacity="0.55" />
        <rect x="47" y="41" width="5.5" height="1.6" rx="0.8" fill="#7a5a00" opacity="0.55" />
      </g>
      {/* braço direito segurando a carta */}
      <ellipse cx="47.5" cy="40" rx="4.2" ry="3.2" fill="#7c4dea" />
      {/* olhos */}
      <ellipse cx="25" cy="28" rx="5" ry="6" fill="#fff" />
      <ellipse cx="39" cy="28" rx="5" ry="6" fill="#fff" />
      <circle cx="26.4" cy="29.4" r="2.7" fill="#1b1033" />
      <circle cx="40.4" cy="29.4" r="2.7" fill="#1b1033" />
      <circle cx="27.4" cy="28.2" r="0.9" fill="#fff" />
      <circle cx="41.4" cy="28.2" r="0.9" fill="#fff" />
      {/* bochechas e sorriso */}
      <ellipse cx="19.5" cy="36" rx="3" ry="1.8" fill="#ff7eb6" opacity="0.65" />
      <ellipse cx="44.5" cy="36" rx="3" ry="1.8" fill="#ff7eb6" opacity="0.65" />
      <path d="M28.5 37.5q3.5 3.6 7 0" stroke="#1b1033" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
