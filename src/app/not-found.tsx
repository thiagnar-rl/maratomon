import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-xl place-items-center gap-4 px-4 py-24 text-center">
      <p className="font-display text-8xl font-black text-accent">404</p>
      <h1 className="font-display text-3xl font-bold">Esse episódio fugiu da lista</h1>
      <p className="text-ink-soft">A página que você procura não existe ou mudou de endereço.</p>
      <Link href="/temporadas" className="rounded-full bg-accent px-5 py-3 font-bold text-accent-ink">
        Ver temporadas
      </Link>
    </div>
  );
}
