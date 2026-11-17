/** Símbolo da Forja Arcana: o monograma "A" com a carta da runa, dentro do hexágono. */
export function BrandMark({ className = "", alt = "" }: { className?: string; alt?: string }) {
  return <img src="/brand/forja-arcana-simbolo.png" alt={alt} width={512} height={512} className={`shrink-0 object-contain ${className}`} />;
}
