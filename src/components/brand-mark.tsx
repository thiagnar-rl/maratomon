/** Selo da Forja Arcana: a carta com a runa sendo forjada pelo martelo, com a faixa "TCG · NERD". */
export function BrandMark({ className = "", alt = "" }: { className?: string; alt?: string }) {
  return <img src="/brand/forja-arcana-selo.png" alt={alt} width={512} height={512} className={`shrink-0 object-contain ${className}`} />;
}
