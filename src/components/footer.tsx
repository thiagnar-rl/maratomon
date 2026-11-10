import Link from "next/link";
import { Logo } from "./logo";
import { siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-bg-elevated">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-prose text-sm leading-relaxed text-ink-soft">{siteConfig.disclaimer}</p>
        </div>
        <nav aria-label="Rodapé" className="grid grid-cols-2 gap-2 text-sm font-semibold">
          <Link className="text-ink-soft hover:text-ink" href="/temporadas">Temporadas</Link>
          <Link className="text-ink-soft hover:text-ink" href="/minha-jornada">Minha jornada</Link>
          <Link className="text-ink-soft hover:text-ink" href="/sobre">Sobre o projeto</Link>
          <Link className="text-ink-soft hover:text-ink" href="/termos">Termos de uso</Link>
          <Link className="text-ink-soft hover:text-ink" href="/privacidade">Privacidade (LGPD)</Link>
        </nav>
      </div>
    </footer>
  );
}
