import Link from "next/link";
import { mainNav } from "@/lib/nav";
import { Logo } from "./logo";
import { HeaderProgress } from "./header-progress";

export function Header() {
  return (
    <header className="sticky top-0 z-40">
      {/* Faixa vermelha estilo Pokédex */}
      <div className="h-1.5 bg-gradient-to-r from-accent via-accent-2 to-accent-3" aria-hidden="true" />
      <div className="border-b border-line/70 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="Maratomon, página inicial">
            <Logo />
          </Link>
          <nav aria-label="Principal" className="ml-auto hidden items-center gap-1 lg:flex">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-bold text-ink-soft transition hover:bg-surface-2 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto lg:ml-2">
            <HeaderProgress />
          </div>
        </div>
        <nav aria-label="Principal (celular)" className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold text-ink-soft"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
