import { CATEGORY_COLOR, CATEGORY_LABEL, type NewsItem } from "@/lib/news-types";
import { newsDate } from "./news-utils";

export function CategoryPill({ item }: { item: Pick<NewsItem, "category"> }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-black"
      style={{ background: CATEGORY_COLOR[item.category] }}
    >
      {CATEGORY_LABEL[item.category]}
    </span>
  );
}

function Meta({ item, light = false }: { item: NewsItem; light?: boolean }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-2 text-xs font-semibold ${light ? "text-white/80" : "text-ink-soft"}`}>
      <span>{item.source}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={item.publishedAt}>{newsDate(item.publishedAt)}</time>
      {item.lang === "en" && <span className="rounded bg-black/30 px-1.5 text-[10px] font-bold text-white">EN</span>}
      {item.kind === "video" && <span aria-label="vídeo">▶</span>}
    </p>
  );
}

const linkProps = { target: "_blank", rel: "noopener noreferrer" } as const;

/** Manchete grande, com imagem de fundo. */
export function FeaturedNews({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.url}
      {...linkProps}
      className="group relative flex min-h-[22rem] overflow-hidden rounded-[2rem] border border-line bg-black shadow-[var(--glow)] sm:min-h-[26rem]"
    >
      {item.image && (
        <img
          src={item.image}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
      <div className="relative mt-auto space-y-3 p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-white">Destaque</span>
          <CategoryPill item={item} />
        </div>
        <h3 className="font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">{item.title}</h3>
        <Meta item={item} light />
      </div>
    </a>
  );
}

/** Cartão padrão da grade. */
export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.url}
      {...linkProps}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface transition hover:-translate-y-1 hover:border-accent/60 hover:shadow-[var(--glow)] motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-video overflow-hidden bg-surface-2">
        {item.image ? (
          <img src={item.image} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid size-full place-items-center text-4xl">📰</div>
        )}
        <span className="absolute left-3 top-3">
          <CategoryPill item={item} />
        </span>
        {item.kind === "video" && (
          <span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-black/70 text-white">▶</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-3 font-bold leading-snug group-hover:text-accent">{item.title}</h3>
        <div className="mt-auto">
          <Meta item={item} />
        </div>
      </div>
    </a>
  );
}

/** Linha compacta (lista lateral "Agora"). */
export function NewsRow({ item, index }: { item: NewsItem; index: number }) {
  return (
    <a href={item.url} {...linkProps} className="group flex gap-3 rounded-2xl p-2 transition hover:bg-surface-2">
      <span className="font-display text-2xl font-extrabold leading-none text-accent/70">{String(index + 1).padStart(2, "0")}</span>
      {item.image && <img src={item.image} alt="" loading="lazy" className="aspect-video w-24 shrink-0 rounded-xl object-cover" />}
      <span className="min-w-0 space-y-1">
        <span className="line-clamp-2 text-sm font-bold leading-snug group-hover:text-accent">{item.title}</span>
        <span className="block text-[11px] font-semibold text-ink-soft">
          {item.source} · {newsDate(item.publishedAt)}
        </span>
      </span>
    </a>
  );
}
