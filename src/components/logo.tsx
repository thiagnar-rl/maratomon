import { Mascot } from "./mascot";

/** Marca do Maratomon TCG: o mascote fantasminha + nome. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight ${className}`}>
      <Mascot className="size-10 -my-1 drop-shadow-[0_4px_10px_rgba(139,92,246,0.45)]" />
      <span className="flex items-baseline gap-1.5">
        <span>
          Marato<span className="text-accent">mon</span>
        </span>
        <span className="rounded-md bg-accent-2 px-1.5 py-0.5 text-[0.65em] font-black leading-none text-black">TCG</span>
      </span>
    </span>
  );
}
