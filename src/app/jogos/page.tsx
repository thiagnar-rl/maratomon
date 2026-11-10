import type { Metadata } from "next";
import { dumpers, emulators, games, type Platform } from "@/data/games";
import { MonArt } from "@/components/mon-art";
import { CheckButton } from "@/components/check-button";
import { CollectionProgress } from "@/components/collection-progress";

export const metadata: Metadata = {
  title: "Jogos clássicos (Game Boy, Color e Advance)",
  description: "Todos os jogos Pokémon de Game Boy, Game Boy Color e Game Boy Advance, onde jogar oficialmente e emuladores legais.",
};

const platformStyle: Record<Platform, string> = {
  "Game Boy": "linear-gradient(135deg, #9bbc0f, #306230)",
  "Game Boy Color": "linear-gradient(135deg, #f8b500, #e3350d)",
  "Game Boy Advance": "linear-gradient(135deg, #5b6cff, #2a1f7a)",
};

export default function GamesPage() {
  const platforms: Platform[] = ["Game Boy", "Game Boy Color", "Game Boy Advance"];

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6">
      <header className="relative flex flex-col gap-6 overflow-hidden rounded-[2rem] p-8 text-white sm:flex-row sm:items-end sm:justify-between sm:p-10" style={{ background: "linear-gradient(135deg, #306230, #0f380f)" }}>
        <MonArt mon={{ id: 6, name: "Charizard" }} size={230} eager className="animate-float pointer-events-none absolute -right-6 -top-8 opacity-95" />
        <div className="relative max-w-xl space-y-2">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#9bbc0f]">Press Start</p>
          <h1 className="font-display text-5xl font-extrabold tracking-tight">Jogos clássicos</h1>
          <p className="opacity-85">
            Os {games.length} jogos Pokémon de Game Boy, Game Boy Color e Game Boy Advance, com onde jogar oficialmente
            hoje e como emular os seus cartuchos.
          </p>
        </div>
        <div className="relative sm:mr-48">
          <CollectionProgress keys={games.map((g) => g.key)} label="jogos zerados" />
        </div>
      </header>

      {platforms.map((platform) => (
        <section key={platform} className="space-y-4">
          <h2 className="flex items-center gap-3 font-display text-3xl font-extrabold">
            <span className="h-8 w-2 rounded-full" style={{ background: platformStyle[platform] }} />
            {platform}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.filter((g) => g.platform === platform).map((game) => (
              <li key={game.key} className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface">
                <div className="relative grid h-40 place-items-center" style={{ background: platformStyle[platform] }}>
                  <MonArt mon={game.mon} size={140} className="transition duration-300 group-hover:scale-110" />
                  <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white">
                    {game.year}
                    {game.generation ? ` · ${game.generation}ª geração` : ""}
                  </span>
                  {game.japanOnly && (
                    <span className="absolute right-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-black">Só no Japão</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                    {game.kind} · {game.region}
                  </p>
                  <h3 className="font-display text-xl font-bold leading-tight">{game.title}</h3>
                  <p className="text-sm text-ink-soft">{game.summary}</p>
                  <p className="rounded-2xl bg-surface-2 p-3 text-xs">
                    <strong>Jogar oficialmente:</strong>{" "}
                    {game.officialToday ?? "Sem relançamento oficial atual. Só no cartucho original."}
                  </p>
                  <div className="mt-auto pt-2">
                    <CheckButton itemKey={game.key} label={`Marcar "${game.title}" como zerado`} doneText="Zerado" todoText="Não zerei" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="grid gap-6 rounded-[2rem] border border-line bg-surface p-6 sm:p-8 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Emuladores legais</h2>
          <p className="text-sm text-ink-soft">
            Emuladores são programas legais. O que não é permitido é baixar ROMs de jogos que você não tem: aqui não há
            links para isso. Use cópias dos seus próprios cartuchos.
          </p>
          <ul className="space-y-2">
            {emulators.map((emu) => (
              <li key={emu.name}>
                <a href={emu.url} target="_blank" rel="noopener noreferrer" className="block rounded-2xl border border-line p-4 transition hover:border-ink-soft">
                  <span className="flex items-baseline justify-between gap-2">
                    <strong>{emu.name}</strong>
                    <span className="text-xs text-ink-soft">{emu.platforms}</span>
                  </span>
                  <span className="block text-xs text-ink-soft">{emu.systems}</span>
                  <span className="block text-sm">{emu.note}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Copie seus próprios cartuchos</h2>
          <p className="text-sm text-ink-soft">
            Com um leitor USB você transforma o cartucho que já tem em um arquivo para o emulador e ainda faz backup do
            save (aquele time de 1999 continua vivo).
          </p>
          <ul className="space-y-2">
            {dumpers.map((d) => (
              <li key={d.name}>
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="block rounded-2xl border border-line p-4 transition hover:border-ink-soft">
                  <strong>{d.name}</strong>
                  <span className="block text-sm text-ink-soft">{d.note}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="rounded-2xl bg-surface-2 p-4 text-sm">
            <strong>Atalho oficial:</strong> o Nintendo Switch Online tem o <em>Pokémon Trading Card Game</em> (Game Boy
            Color, plano básico) e o <em>Mystery Dungeon: Red Rescue Team</em> (Game Boy Advance, Pacote de Expansão).
          </p>
        </div>
      </section>
    </div>
  );
}
