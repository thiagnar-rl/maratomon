import Link from "next/link";

const links = [
  { href: "/tcg", label: "Coleções e mercado" },
  { href: "/tcg/comparar", label: "Comparador" },
  { href: "/colecao", label: "Minha coleção" },
];

export function TcgNav() {
  return (
    <nav aria-label="TCG" className="flex flex-wrap gap-2">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold hover:border-ink-soft">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
