import { BrandMark } from "./brand-mark";

/** Marca do Maratomon TCG: fantasminha em destaque + nome + selo TCG. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight ${className}`}>
      <BrandMark className="-my-2 size-12 drop-shadow-[0_6px_14px_rgba(139,92,246,0.55)] transition group-hover:scale-105" />
      <span className="flex items-center gap-2">
        <span>
          Marato<span className="text-accent">mon</span>
        </span>
        <span className="-rotate-6 rounded-lg border-2 border-[#2a1061] bg-accent-2 px-2 py-0.5 text-[0.8em] font-black leading-none tracking-wider text-black shadow-[0_4px_12px_rgba(255,203,5,0.45)]">
          TCG
        </span>
      </span>
    </span>
  );
}
