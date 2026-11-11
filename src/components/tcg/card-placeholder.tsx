import { Mascot } from "@/components/mascot";

/** Moldura de carta para quando nenhuma fonte tem a imagem ainda (coleções recém-lançadas, kits antigos). */
export function CardPlaceholder({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 rounded-[inherit] border-4 border-accent-2/70 bg-gradient-to-br from-accent/40 via-surface-2 to-surface-2 p-3 text-center">
      <Mascot className={size === "lg" ? "size-24" : "size-12"} />
      <p className={`font-display font-bold leading-tight ${size === "lg" ? "text-xl" : "text-xs"}`}>{name}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">Imagem em breve</p>
    </div>
  );
}
