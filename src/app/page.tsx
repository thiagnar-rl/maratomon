import Link from "next/link";
import { catalog, eraColor, getEras } from "@/lib/catalog";
import { eraMons, type Mon } from "@/lib/pokemon";
import { getNews } from "@/lib/news";
import { ContinueCard } from "@/components/continue-card";
import { MonArt } from "@/components/mon-art";
import { Mascot } from "@/components/mascot";
import { Ticker } from "@/components/news/ticker";
import { FeaturedNews, NewsCard, NewsRow } from "@/components/news/news-card";
import { NewsGrid } from "@/components/news/news-grid";

/** A página inicial é um portal de notícias: refaz a busca nas fontes oficiais a cada hora. */
export const revalidate = 3600;

const hubs: { href: string; title: string; text: string; stat: string; mon: Mon; color: string }[] = [
  {
    href: "/temporadas",
    title: "Anime",
    text: "Checklist de todos os episódios dublados, temporada por temporada.",
    stat: `${catalog.totalEpisodes.toLocaleString("pt-BR")} episódios`,
    mon: { id: 25, name: "Pikachu" },
    color: "var(--accent-2)",
  },
  {
    href: "/tcg",
    title: "TCG",
    text: "Todas as coleções desde 1999, preços ao vivo, comparador e gráficos.",
    stat: "Preços diários",
    mon: { id: 133, name: "Eevee" },
    color: "var(--accent-3)",
  },
  {
    href: "/colecao",
    title: "Minha coleção",
    text: "Seus decks e pastas com fotos, vídeos e valor atualizado.",
    stat: "Fotos e vídeos",
    mon: { id: 143, name: "Snorlax" },
    color: "#10b39a",
  },
];

const hoje = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long" });

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function HomePage() {
  const eras = getEras();
  const { items } = await getNews(48);
  const [featured, ...rest] = items;
  const side = rest.slice(0, 5);
  const videos = items.filter((i) => i.kind === "video").slice(0, 10);

  return (
    <>
      <Ticker items={items} />

      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="stage-lights animate-drift absolute -inset-20 -z-10 opacity-70" />
        <div aria-hidden="true" className="grain absolute inset-0 -z-10 opacity-40" />
        <div className="mx-auto max-w-6xl space-y-6 px-4 pb-12 pt-8 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <Mascot className="size-16 animate-float" />
              <div>
                <p className="text-sm font-bold text-ink-soft">{capitalize(hoje.format(new Date()))}</p>
                <h1 className="font-display text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">
                  Hoje no mundo <span className="bg-gradient-to-r from-accent via-[#ff5c8a] to-accent-2 bg-clip-text text-transparent">Pokémon</span>
                </h1>
              </div>
            </div>
            <p className="max-w-sm text-sm text-ink-soft">
              TCG, games, Pokémon GO, anime e competitivo. Direto das fontes oficiais, atualizado o dia todo.
            </p>
          </div>

          {featured ? (
            <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
              <FeaturedNews item={featured} />
              <aside aria-labelledby="ultimas" className="flex flex-col rounded-[2rem] border border-line bg-surface/80 p-4 backdrop-blur">
                <div className="flex items-center justify-between px-2 pb-2">
                  <h2 id="ultimas" className="font-display text-xl font-extrabold">Últimas</h2>
                  <Link href="/noticias" className="text-sm font-bold text-accent">Ver tudo →</Link>
                </div>
                <ol className="flex-1 space-y-1">
                  {side.map((item, i) => (
                    <li key={item.id}>
                      <NewsRow item={item} index={i} />
                    </li>
                  ))}
                </ol>
              </aside>
            </div>
          ) : (
            <p className="rounded-[2rem] border border-dashed border-line p-10 text-center text-ink-soft">
              As notícias estão sendo carregadas. Volte em alguns minutos.
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 sm:px-6">
        <section aria-labelledby="jornada" className="grid items-center gap-6 rounded-[2rem] border border-line bg-gradient-to-br from-accent/20 via-surface to-surface p-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-accent">Sua maratona</p>
            <h2 id="jornada" className="font-display text-3xl font-extrabold leading-tight">
              {catalog.totalEpisodes.toLocaleString("pt-BR")} episódios dublados esperando por você
            </h2>
            <p className="text-ink-soft">Marque o que já assistiu, continue de onde parou e acompanhe sua coleção de cartas.</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/temporadas" className="rounded-full bg-accent px-5 py-2.5 font-bold text-white shadow-lg transition hover:brightness-110">
                Começar a maratona
              </Link>
              <Link href="/tcg" className="rounded-full border border-line bg-surface px-5 py-2.5 font-bold transition hover:border-ink-soft">
                Cartas e preços
              </Link>
            </div>
          </div>
          <ContinueCard />
        </section>

        <section aria-labelledby="noticias" className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-accent">Notícias oficiais</p>
              <h2 id="noticias" className="font-display text-3xl font-extrabold">Tudo o que rolou</h2>
            </div>
            <Link href="/noticias" className="shrink-0 text-sm font-bold text-accent">Todas as notícias →</Link>
          </div>
          <NewsGrid items={rest.slice(5)} limit={12} />
        </section>

        {videos.length > 0 && (
          <section aria-labelledby="videos" className="space-y-5">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-accent">Canais oficiais</p>
              <h2 id="videos" className="font-display text-3xl font-extrabold">Vídeos novos</h2>
            </div>
            <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6">
              {videos.map((item) => (
                <li key={item.id} className="w-72 shrink-0 snap-start">
                  <NewsCard item={item} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="hub" className="space-y-5">
          <h2 id="hub" className="font-display text-3xl font-extrabold">Escolha sua aventura</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {hubs.map((hub) => (
              <Link
                key={hub.href}
                href={hub.href}
                className="group relative flex min-h-64 flex-col overflow-hidden rounded-3xl border border-line p-5 transition hover:-translate-y-1 motion-reduce:hover:translate-y-0"
                style={{ background: `radial-gradient(110% 80% at 50% 0%, color-mix(in oklab, ${hub.color} 35%, transparent), transparent 70%), var(--surface)` }}
              >
                <MonArt mon={hub.mon} size={120} className="mx-auto transition duration-300 group-hover:scale-110" />
                <div className="mt-auto space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: hub.color }}>{hub.stat}</p>
                  <h3 className="font-display text-2xl font-bold">{hub.title}</h3>
                  <p className="text-sm leading-snug text-ink-soft">{hub.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="eras" className="space-y-5">
          <div className="flex items-end justify-between">
            <h2 id="eras" className="font-display text-3xl font-extrabold">Séries do anime</h2>
            <Link href="/temporadas" className="text-sm font-bold text-accent">Ver todas as temporadas →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {eras.map((era) => {
              const mon = eraMons[era.index];
              return (
                <Link
                  key={era.name}
                  href={`/temporadas#era-${era.index}`}
                  className="group relative flex h-36 items-end overflow-hidden rounded-3xl p-4 text-white"
                  style={{ background: `linear-gradient(135deg, ${eraColor(era.index)}, color-mix(in oklab, ${eraColor(era.index)} 45%, black))` }}
                >
                  {mon && (
                    <MonArt mon={mon} size={110} className="absolute -right-3 -top-3 transition duration-300 group-hover:scale-110" />
                  )}
                  <span className="relative">
                    <span className="block font-display text-lg font-bold leading-tight">{era.name}</span>
                    <span className="text-xs font-semibold opacity-85">
                      {era.seasons.length} temporadas · T{era.seasons[0].number}–T{era.seasons.at(-1)!.number}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
