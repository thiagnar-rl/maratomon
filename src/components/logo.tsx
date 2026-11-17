import { BrandMark } from "./brand-mark";

/** Marca da Forja Arcana: o selo + o nome "FORJA ARCANA" em serifa, como no logo. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark className="size-11 -my-1.5 drop-shadow-[0_4px_10px_rgba(124,58,237,0.35)]" />
      <span className="flex flex-col leading-none" style={{ fontFamily: "var(--font-brand)" }}>
        <span className="text-[1.35rem] font-extrabold tracking-[0.06em] text-brand-ink">FORJA</span>
        <span className="mt-0.5 pl-[0.2em] text-[0.72rem] font-medium tracking-[0.42em] text-brand-gold">ARCANA</span>
      </span>
    </span>
  );
}
