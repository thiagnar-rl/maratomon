/** Layout simples para páginas de texto (Sobre, Termos, Privacidade). */
export function ProsePage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6">
      <header className="space-y-2">
        <h1 className="font-display text-5xl font-extrabold tracking-tight">{title}</h1>
        {updated && <p className="text-sm text-ink-soft">Atualizado em {updated}</p>}
      </header>
      <div className="space-y-4 leading-relaxed text-ink-soft [&_a]:font-semibold [&_a]:text-ink [&_a]:underline [&_h2]:pt-4 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">
        {children}
      </div>
    </article>
  );
}
