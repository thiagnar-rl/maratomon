import Link from "next/link";
import { Logo } from "./logo";
import { HeaderProgress } from "./header-progress";

const nav = [
  { href: "/temporadas", label: "Temporadas" },
  { href: "/minha-jornada", label: "Minha jornada" },
  { href: "/sobre", label: "Sobre" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Maratomon, página inicial">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="ml-auto hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-surface-2 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto md:ml-2">
          <HeaderProgress />
        </div>
      </div>
      <nav aria-label="Principal (celular)" className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-soft"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
