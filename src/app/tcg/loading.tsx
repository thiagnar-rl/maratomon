/** Aparece na hora em que alguém abre uma página do TCG, enquanto ela carrega. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6" aria-busy="true" aria-label="Carregando">
      <div className="h-40 animate-pulse rounded-[2rem] bg-surface-2" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-[5/7] animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
      <p className="text-center text-sm text-ink-soft">Carregando…</p>
    </div>
  );
}
