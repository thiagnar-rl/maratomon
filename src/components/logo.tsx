/** Marca original do Maratomon: um anel de progresso com um "play". */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight ${className}`}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
        <circle cx="16" cy="16" r="13" fill="none" stroke="var(--line)" strokeWidth="4" />
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
      Maratomon
    </span>
  );
}
