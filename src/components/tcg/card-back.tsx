import { Mascot } from "@/components/mascot";

/** Verso da carta com a marca Maratomon TCG (arte própria). */
export function CardBack() {
  return (
    <div className="relative grid size-full place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_45%,#8b5cf6_0%,#4c1d95_45%,#1e0b3d_100%)]">
      <div className="absolute inset-[5%] rounded-[8%] border-[3px] border-accent-2/80" />
      <div className="absolute inset-[9%] rounded-[6%] border border-white/25" />
      <div aria-hidden="true" className="absolute size-[78%] rounded-full bg-[repeating-conic-gradient(from_0deg,rgb(255_255_255/0.07)_0deg_10deg,transparent_10deg_20deg)]" />
      <div aria-hidden="true" className="absolute size-[58%] rounded-full border-4 border-white/20" />
      <div className="relative flex flex-col items-center gap-[6%]">
        <Mascot className="w-[46%] drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]" />
        <span className="font-display text-[clamp(0.6rem,4.5cqw,1.6rem)] font-extrabold tracking-tight text-white">
          Marato<span className="text-accent-2">mon</span>
        </span>
        <span className="rounded bg-accent-2 px-1.5 text-[clamp(0.45rem,3cqw,0.9rem)] font-black text-black">TCG</span>
      </div>
    </div>
  );
}
