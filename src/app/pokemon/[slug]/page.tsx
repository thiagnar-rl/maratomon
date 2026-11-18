import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { PricedCardGrid } from "@/components/tcg/priced-card-grid";
import { dexAnime, dexCards, dexDetail, TYPE_COLOR, TYPE_PT } from "@/lib/pokedex";
import { artwork } from "@/lib/pokemon";
import { siteConfig } from "@/lib/site";

// Páginas geradas sob demanda (não no build), para economizar deploy na Vercel.
export function generateStaticParams() {
  return [];
}
export const dynamicParams = true;
export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const mon = await dexDetail((await params).slug);
  if (!mon) return { title: "Pokémon não encontrado" };
  const title = `${mon.name}: cartas, preços no Brasil e episódios`;
  const description = `Todas as cartas de ${mon.name} (#${String(mon.id).padStart(4, "0")}) com preço em reais, a mais cara e a mais barata, e os episódios do anime em que ${mon.name} aparece.`;
  return {
    title,
    description,
    alternates: { canonical: `/pokemon/${mon.slug}` },
    openGraph: { title, description, images: [artwork(mon.id)] },
  };
}

export default async function PokemonPage({ params }: Props) {
  const { slug } = await params;
  const mon = await dexDetail(slug);
  if (!mon) notFound();
  if (slug !== mon.slug) permanentRedirect(`/pokemon/${mon.slug}`);

  const [cards, anime] = await Promise.all([dexCards(mon.name), Promise.resolve(dexAnime(mon.id, mon.name))]);
  const color = TYPE_COLOR[mon.types[0]] ?? "#a8a878";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Thing",
    name: mon.name,
    description: mon.flavor ?? undefined,
    image: artwork(mon.id),
    url: `${siteConfig.url}/pokemon/${mon.slug}`,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="flex items-center justify-between text-sm font-bold">
        <Link href="/pokemon" className="text-ink-soft hover:text-ink">← Pokédex</Link>
        <span className="flex gap-2">
          {mon.prev && <Link href={`/pokemon/${mon.prev.slug}`} className="rounded-full bg-surface-2 px-3 py-1.5">‹ #{mon.prev.id} {mon.prev.name}</Link>}
          {mon.next && <Link href={`/pokemon/${mon.next.slug}`} className="rounded-full bg-surface-2 px-3 py-1.5">#{mon.next.id} {mon.next.name} ›</Link>}
        </span>
      </nav>

      <section
        className="relative grid items-center gap-6 overflow-hidden rounded-[2.5rem] border border-line p-6 sm:grid-cols-[minmax(0,1fr)_18rem] sm:p-10"
        style={{ background: `radial-gradient(circle at 80% 30%, ${color}55, transparent 60%), var(--surface)` }}
      >
        <div className="space-y-4">
          <p className="font-display text-xl font-extrabold tabular-nums text-ink-soft">#{String(mon.id).padStart(4, "0")}</p>
          <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl">{mon.name}</h1>
          <div className="flex flex-wrap gap-2">
            {mon.types.map((t) => (
              <span key={t} className="rounded-full px-3 py-1 text-sm font-bold text-white shadow-sm" style={{ background: TYPE_COLOR[t] }}>
                {TYPE_PT[t] ?? t}
              </span>
            ))}
            {mon.legendary && <span className="rounded-full bg-[#d4a017] px-3 py-1 text-sm font-bold text-white">Lendário</span>}
            {mon.mythical && <span className="rounded-full bg-[#9b59b6] px-3 py-1 text-sm font-bold text-white">Mítico</span>}
          </div>
          {mon.flavor && <p className="max-w-xl text-ink-soft">{mon.flavor}</p>}
          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {mon.generation && (
              <div>
                <dt className="text-ink-soft">Geração</dt>
                <dd className="font-bold">{mon.generation.label} · {mon.generation.region}</dd>
              </div>
            )}
            <div>
              <dt className="text-ink-soft">Altura</dt>
              <dd className="font-bold">{mon.height.toLocaleString("pt-BR")} m</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Peso</dt>
              <dd className="font-bold">{mon.weight.toLocaleString("pt-BR")} kg</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Cartas</dt>
              <dd className="font-bold">{cards.length}</dd>
            </div>
          </dl>
        </div>
        <img src={artwork(mon.id)} alt={mon.name} width={288} height={288} className="mx-auto size-56 object-contain drop-shadow-2xl sm:size-72" />
      </section>

      <section aria-labelledby="cartas" className="space-y-4">
        <h2 id="cartas" className="font-display text-3xl font-extrabold">Cartas de {mon.name}</h2>
        {cards.length ? (
          <PricedCardGrid cards={cards} showTotal highlights />
        ) : (
          <p className="rounded-3xl border border-dashed border-line p-8 text-center text-ink-soft">Ainda não encontramos cartas de {mon.name}.</p>
        )}
      </section>

      <section aria-labelledby="anime" className="space-y-4">
        <h2 id="anime" className="font-display text-3xl font-extrabold">{mon.name} no anime</h2>
        {anime.seasons.length === 0 && anime.episodes.length === 0 ? (
          <p className="text-ink-soft">
            Não achamos episódios com {mon.name} no título. <Link href="/temporadas" className="font-bold text-accent underline">Ver todas as temporadas</Link>.
          </p>
        ) : (
          <>
            {anime.seasons.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {anime.seasons.map((s) => (
                  <Link key={s.number} href={`/temporadas/${s.number}`} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold hover:border-accent">
                    ⭐ Destaque da temporada {s.number}: {s.title}
                  </Link>
                ))}
              </div>
            )}
            {anime.episodes.length > 0 && (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {anime.episodes.slice(0, 60).map((e) => (
                  <li key={e.key}>
                    <Link href={`/episodios/${e.slug}`} className="flex gap-3 rounded-2xl border border-line bg-surface p-3 hover:border-accent">
                      <span className="shrink-0 rounded-xl bg-surface-2 px-2 py-1 text-xs font-black tabular-nums">T{e.season}·E{e.number}</span>
                      <span className="text-sm font-semibold">{e.titlePt ?? e.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
