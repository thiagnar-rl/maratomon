import Link from "next/link";
import { catalog, eraColor, getEras } from "@/lib/catalog";
import { eraMons, type Mon } from "@/lib/pokemon";
import { movies } from "@/data/movies";
import { games } from "@/data/games";
import { ContinueCard } from "@/components/continue-card";
import { MonArt } from "@/components/mon-art";

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
    href: "/filmes",
    title: "Filmes",
    text: "Todos os filmes em ordem, com onde assistir.",
    stat: `${movies.length} filmes`,
    mon: { id: 150, name: "Mewtwo" },
    color: "#a35bd6",
  },
  {
    href: "/jogos",
    title: "Jogos clássicos",
    text: "Game Boy, Color e Advance: fichas, onde jogar e emuladores.",
    stat: `${games.length} jogos`,
    mon: { id: 6, name: "Charizard" },
    color: "var(--accent)",
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

export default function HomePage() {
  const eras = getEras();

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="stage-lights animate-drift absolute -inset-20 -z-10" />
        <div aria-hidden="true" className="grain absolute inset-0 -z-10 opacity-40" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div className="relative space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs font-bold uppercase tracking-widest text-ink-soft backdrop-blur">
              <span className="size-2 rounded-full bg-accent" /> Para treinadores de todas as gerações
            </p>
            <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Sua jornada Pokémon <span className="text-accent">completa</span>.
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-ink-soft">
              Maratone os {catalog.totalEpisodes.toLocaleString("pt-BR")} episódios dublados, os filmes e os clássicos do
              Game Boy. E cuide da sua coleção de cartas com preços atualizados.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/temporadas" className="rounded-full bg-accent px-6 py-3 font-bold text-accent-ink shadow-lg transition hover:brightness-110">
                Começar a maratona
              </Link>
              <Link href="/tcg" className="rounded-full border border-line bg-surface/70 px-6 py-3 font-bold backdrop-blur transition hover:border-ink-soft">
                Ver cartas e preços
              </Link>
            </div>
          </div>
          <div className="relative">
            <div aria-hidden="true" className="pointer-events-none absolute -top-24 right-0 hidden lg:block">
              <MonArt mon={{ id: 6, name: "Charizard" }} size={220} eager className="animate-float opacity-95" />
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute -left-10 -top-16 hidden lg:block">
              <MonArt mon={{ id: 25, name: "Pikachu" }} size={150} eager className="animate-float [animation-delay:-2s]" />
            </div>
            <div className="relative pt-0 lg:pt-28">
              <ContinueCard />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 sm:px-6">
        <section aria-labelledby="hub" className="space-y-5">
          <h2 id="hub" className="font-display text-3xl font-extrabold">Escolha sua aventura</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
