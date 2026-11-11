"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Ícones simples em traço (estilo Lucide), desenhados aqui para não depender de biblioteca. */
const ICONS: Record<string, React.ReactNode> = {
  layers: <path d="m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5" />,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  phone: <path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3 17h2" />,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
  search: <path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm9 16-4-4" />,
  gem: <path d="M6 3h12l3 6-9 12L3 9l3-6Zm-3 6h18M9 3l3 18 3-18" />,
  compare: <path d="M8 3v18M16 3v18M3 8l5-5 5 5M11 16l5 5 5-5" />,
  chart: <path d="M3 3v18h18M7 15l4-4 3 3 6-7" />,
  up: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  down: <path d="M3 7l6 6 4-4 8 8M15 17h6v-6" />,
  coin: <path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm3 6.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2-1.4 0-2.5-.5-3-1.5M12 6v12" />,
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  folder: <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" />,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  cart: <path d="M3 4h2l2.4 11h10.2L20 7H6.2M9 20a1 1 0 1 0 0-.1M17 20a1 1 0 1 0 0-.1" />,
  link: <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />,
};

function Icon({ name, className = "size-5" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

type Item = { href: string; title: string; text: string; icon: string; color: string; external?: boolean };
type Tab = { id: string; label: string; icon: string; items: Item[]; match: (path: string) => boolean };

const TABS: Tab[] = [
  {
    id: "colecoes",
    label: "Coleções",
    icon: "layers",
    match: (p) => p === "/tcg" || p.startsWith("/tcg/colecoes"),
    items: [
      { href: "/tcg#colecoes", title: "Todas as coleções", text: "Os 221 sets desde 1999, por série.", icon: "layers", color: "#8b5cf6" },
      { href: "/tcg/colecoes/me06", title: "Lançamentos", text: "A coleção mais nova e as últimas da série.", icon: "spark", color: "#ff5c8a" },
      { href: "/tcg#serie-tcgp", title: "TCG Pocket", text: "As coleções do jogo digital.", icon: "phone", color: "#2fd6a4" },
      { href: "/tcg/colecoes/svp", title: "Promos", text: "Cartas promocionais Black Star.", icon: "star", color: "#ffcb05" },
    ],
  },
  {
    id: "cartas",
    label: "Cartas",
    icon: "search",
    match: (p) => p.startsWith("/tcg/busca") || p.startsWith("/tcg/cartas") || p.startsWith("/tcg/comparar"),
    items: [
      { href: "/tcg/busca", title: "Buscar cartas", text: "Encontre qualquer carta pelo nome.", icon: "search", color: "#8b5cf6" },
      { href: "/tcg/mercado#valiosas", title: "Mais valiosas", text: "As cartas mais caras do momento.", icon: "gem", color: "#ffcb05" },
      { href: "/tcg/comparar", title: "Comparador", text: "Compare preços de até 4 cartas.", icon: "compare", color: "#5b9bff" },
    ],
  },
  {
    id: "mercado",
    label: "Mercado",
    icon: "chart",
    match: (p) => p.startsWith("/tcg/mercado"),
    items: [
      { href: "/tcg/mercado", title: "Painel do mercado", text: "Preços do dia em dólar e em real.", icon: "chart", color: "#8b5cf6" },
      { href: "/tcg/mercado#altas", title: "Maiores altas", text: "Cartas que mais subiram na semana.", icon: "up", color: "#2fd6a4" },
      { href: "/tcg/mercado#baixas", title: "Maiores baixas", text: "Cartas que mais caíram na semana.", icon: "down", color: "#ff5c8a" },
      { href: "/tcg/mercado#cambio", title: "Câmbio do dia", text: "Dólar e euro com a variação de hoje.", icon: "coin", color: "#ffcb05" },
    ],
  },
  {
    id: "minha",
    label: "Minha área",
    icon: "folder",
    match: (p) => p.startsWith("/colecao"),
    items: [
      { href: "/colecao", title: "Minha coleção", text: "Decks e pastas com valor em reais.", icon: "folder", color: "#8b5cf6" },
      { href: "/colecao", title: "Lista de desejos", text: "Preço-alvo e alerta quando baixar.", icon: "heart", color: "#ff5c8a" },
      { href: "/tcg#termometro", title: "Termômetro Brasil", text: "Quanto as cartas custam aqui.", icon: "flag", color: "#2fd6a4" },
      { href: "/tcg/comparar", title: "Comparador", text: "Compare preços de até 4 cartas.", icon: "compare", color: "#ffcb05" },
    ],
  },
];

/** Subguias do TCG: abas com painel de atalhos (estilo mega menu). */
export function TcgMegaNav() {
  const pathname = usePathname();
  const current = TABS.find((t) => t.match(pathname))?.id ?? "colecoes";
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !nav.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setOpen(null), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  const panel = TABS.find((t) => t.id === open);
  const hover = (id: string | null) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(id), id ? 80 : 180);
  };

  return (
    <nav ref={nav} aria-label="Subguias do TCG" className="sticky top-[6.6rem] z-30 lg:top-[4.375rem]" onMouseLeave={() => hover(null)}>
      <div className="border-b border-line bg-bg/85 backdrop-blur-xl">
        <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6 [scrollbar-width:none]">
          {TABS.map((tab) => {
            const active = tab.id === current;
            const expanded = open === tab.id;
            return (
              <li key={tab.id} className="flex-1">
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls="tcg-subguias"
                  onMouseEnter={() => hover(tab.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(expanded ? null : tab.id);
                  }}
                  className={`relative flex w-full items-center justify-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-bold transition ${
                    active || expanded ? "text-ink" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <span className={`grid size-7 place-items-center rounded-lg ${active ? "bg-accent text-white" : "bg-surface-2"}`}>
                    <Icon name={tab.icon} className="size-4" />
                  </span>
                  {tab.label}
                  <svg viewBox="0 0 24 24" className={`size-3.5 transition ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  <span className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full transition ${active ? "bg-accent" : expanded ? "bg-line" : "bg-transparent"}`} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div
        id="tcg-subguias"
        onMouseEnter={() => clearTimeout(timer.current)}
        className={`absolute inset-x-0 top-full origin-top transition duration-200 ${panel ? "visible scale-y-100 opacity-100" : "invisible scale-y-95 opacity-0"}`}
      >
        <div className="border-b border-line bg-surface/95 shadow-2xl backdrop-blur-xl">
          <ul className="mx-auto grid max-w-6xl gap-1 px-4 py-3 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {panel?.items.map((item) => {
              const content = (
                <>
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-full text-white shadow-lg transition group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${item.color}, color-mix(in oklab, ${item.color} 55%, black))` }}
                  >
                    <Icon name={item.icon} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold leading-tight group-hover:text-accent">
                      {item.title}
                      {item.external && " ↗"}
                    </span>
                    <span className="block text-xs leading-snug text-ink-soft">{item.text}</span>
                  </span>
                </>
              );
              const cls = "group flex items-center gap-3 rounded-2xl p-3 transition hover:bg-surface-2";
              return (
                <li key={item.title}>
                  {item.external ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
                      {content}
                    </a>
                  ) : (
                    <Link href={item.href} className={cls} onClick={() => setOpen(null)}>
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
