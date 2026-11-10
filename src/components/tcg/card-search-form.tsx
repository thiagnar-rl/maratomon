/** Busca de cartas por nome (formulário GET simples, funciona sem JavaScript). */
export function CardSearchForm({ defaultValue = "", size = "lg" }: { defaultValue?: string; size?: "lg" | "md" }) {
  return (
    <form action="/tcg/busca" method="get" role="search" className="flex w-full max-w-xl gap-2">
      <label htmlFor="q" className="sr-only">Nome da carta</label>
      <input
        id="q"
        name="q"
        type="search"
        required
        minLength={2}
        defaultValue={defaultValue}
        placeholder="Buscar carta: Charizard, Umbreon, Pikachu…"
        className={`min-w-0 flex-1 rounded-full border border-line bg-surface px-5 outline-none focus:border-ink-soft ${size === "lg" ? "py-3.5" : "py-2.5 text-sm"}`}
      />
      <button type="submit" className="rounded-full bg-accent px-5 font-bold text-accent-ink transition hover:brightness-110">
        Buscar
      </button>
    </form>
  );
}
