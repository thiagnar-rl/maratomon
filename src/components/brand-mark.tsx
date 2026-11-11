import { useId } from "react";

/**
 * Símbolo da marca Maratomon TCG: o fantasminha da casa espiando por trás de uma carta.
 * Desenho original (não usa elementos registrados da franquia).
 */
export function BrandMark({ className = "", title }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c4a6ff" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id={`c${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a1650" />
          <stop offset="1" stopColor="#120a24" />
        </linearGradient>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7eb6" />
          <stop offset="0.5" stopColor="#ffd43b" />
          <stop offset="1" stopColor="#5effc8" />
        </linearGradient>
      </defs>
      {/* fantasma atrás da carta */}
      <path d="M17 30c0-11 6.8-19 15-19s15 8 15 19v8H17z" fill={`url(#g${id})`} />
      <ellipse cx="27" cy="25" rx="3.6" ry="4.4" fill="#fff" />
      <ellipse cx="37.5" cy="25" rx="3.6" ry="4.4" fill="#fff" />
      <circle cx="28.2" cy="26.1" r="2" fill="#1b1033" />
      <circle cx="38.7" cy="26.1" r="2" fill="#1b1033" />
      <circle cx="28.9" cy="25.3" r="0.7" fill="#fff" />
      <circle cx="39.4" cy="25.3" r="0.7" fill="#fff" />
      {/* carta */}
      <g transform="rotate(-7 32 46)">
        <rect x="12" y="31" width="40" height="30" rx="6" fill={`url(#c${id})`} stroke="#ffcb05" strokeWidth="3" />
        <rect x="17" y="36" width="30" height="20" rx="3" fill="none" stroke={`url(#s${id})`} strokeWidth="1.6" opacity="0.9" />
        {/* monograma M em forma de raio */}
        <path d="M23 52V40l5.5 7 3.5-5 3.5 5 5.5-7v12" fill="none" stroke="#ffcb05" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* mãozinhas segurando a carta */}
      <ellipse cx="18.5" cy="33.5" rx="3.6" ry="2.8" fill="#8b5cf6" transform="rotate(-20 18.5 33.5)" />
      <ellipse cx="45.5" cy="31" rx="3.6" ry="2.8" fill="#8b5cf6" transform="rotate(15 45.5 31)" />
      {/* brilho */}
      <path d="M52 9l1.2 3.3 3.3 1.2-3.3 1.2L52 18l-1.2-3.3-3.3-1.2 3.3-1.2z" fill="#ffd43b" />
    </svg>
  );
}
