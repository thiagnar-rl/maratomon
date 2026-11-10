import { setCover } from "@/lib/tcg/set-covers";

/** Capa da coleção: logo, leque de cartas, logo da série com etiqueta ou arte do Pokémon. */
export function SetCoverArt({ set, size = "sm" }: { set: { id: string; logo?: string }; size?: "sm" | "lg" }) {
  const cover = setCover(set);
  const h = size === "lg" ? "h-28" : "h-16";

  if (!cover) {
    return <span className="font-display text-sm font-bold text-ink-soft">{set.id.toUpperCase()}</span>;
  }
  if (cover.type === "logo") {
    return <img src={cover.src} alt="" loading="lazy" className={`${size === "lg" ? "max-h-28" : "max-h-16"} max-w-full object-contain`} />;
  }
  if (cover.type === "cards") {
    return (
      <span className={`relative flex ${h} w-full items-center justify-center`}>
        {cover.srcs.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            loading="lazy"
            className={`absolute ${size === "lg" ? "h-28" : "h-16"} rounded-md shadow-lg ring-1 ring-black/20`}
            style={{ transform: `translateX(${(i - 1) * (size === "lg" ? 34 : 20)}px) rotate(${(i - 1) * 10}deg)`, zIndex: i === 1 ? 2 : 1 }}
          />
        ))}
      </span>
    );
  }
  return (
    <span className={`relative flex ${h} w-full items-center justify-center`}>
      <img
        src={cover.src}
        alt=""
        loading="lazy"
        className={cover.type === "mon" ? `${h} object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)]` : `${size === "lg" ? "max-h-20" : "max-h-11"} max-w-full object-contain`}
      />
      <span className="absolute bottom-0 right-0 rounded-md bg-accent-2 px-1.5 py-0.5 text-[10px] font-black uppercase leading-none text-black">
        {cover.tag}
      </span>
    </span>
  );
}
