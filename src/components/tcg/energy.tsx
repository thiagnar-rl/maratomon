import { typeColors } from "@/lib/pokemon";

const GLYPH: Record<string, string> = {
  Fire: "🔥",
  Water: "💧",
  Grass: "🍃",
  Lightning: "⚡",
  Psychic: "👁️",
  Fighting: "👊",
  Darkness: "🌙",
  Metal: "⚙️",
  Fairy: "✨",
  Dragon: "🐉",
  Colorless: "⭐",
};

export const TYPE_PT: Record<string, string> = {
  Fire: "Fogo",
  Water: "Água",
  Grass: "Planta",
  Lightning: "Elétrico",
  Psychic: "Psíquico",
  Fighting: "Lutador",
  Darkness: "Escuridão",
  Metal: "Metal",
  Fairy: "Fada",
  Dragon: "Dragão",
  Colorless: "Incolor",
};

/** Ícone de energia (círculo na cor do tipo). */
export function Energy({ type, size = "md" }: { type: string; size?: "sm" | "md" }) {
  return (
    <span
      title={TYPE_PT[type] ?? type}
      className={`inline-grid shrink-0 place-items-center rounded-full ring-2 ring-white/30 ${size === "sm" ? "size-5 text-[10px]" : "size-7 text-sm"}`}
      style={{ background: typeColors[type] ?? "#999" }}
    >
      <span aria-hidden="true">{GLYPH[type] ?? "•"}</span>
      <span className="sr-only">{TYPE_PT[type] ?? type}</span>
    </span>
  );
}
