import { artwork, type Mon } from "@/lib/pokemon";

type Props = {
  mon: Mon;
  size?: number;
  className?: string;
  /** Prioriza o carregamento (imagens no topo da página). */
  eager?: boolean;
};

/** Arte oficial de um Pokémon (PokeAPI). */
export function MonArt({ mon, size = 160, className = "", eager = false }: Props) {
  return (
    <img
      src={artwork(mon.id)}
      alt={mon.name}
      width={size}
      height={size}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`mon-art select-none ${className}`}
      draggable={false}
    />
  );
}
