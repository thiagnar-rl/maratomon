/** Marca do Maratomon TCG: anel de progresso (vermelho/amarelo) com um "play". */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight ${className}`}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
        <circle cx="16" cy="16" r="13" fill="none" stroke="var(--accent-2)" strokeWidth="4" />
        <circle
          cx="16"
          cy="16"
          r="13"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="60 82"
          transform="rotate(-90 16 16)"
        />
        <path d="M13 11.5v9l7.5-4.5z" fill="var(--ink)" />
      </svg>
      <span className="flex items-baseline gap-1.5">
        <span>
          Marato<span className="text-accent">mon</span>
        </span>
        <span className="rounded-md bg-accent-2 px-1.5 py-0.5 text-[0.65em] font-black leading-none text-black">TCG</span>
      </span>
    </span>
  );
}
