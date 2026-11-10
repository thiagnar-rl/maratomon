import type { NewsItem } from "@/lib/news-types";
import { CATEGORY_COLOR } from "@/lib/news-types";

/** Faixa de últimas manchetes rolando, estilo portal de notícias. */
export function Ticker({ items }: { items: NewsItem[] }) {
  if (items.length === 0) return null;
  const list = items.slice(0, 10);
  return (
    <div className="relative flex items-center overflow-hidden border-y border-line bg-surface/80 backdrop-blur">
      <span className="z-10 flex shrink-0 items-center gap-2 bg-accent px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white">
        <span className="size-2 animate-pulse rounded-full bg-white" /> Agora
      </span>
      <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_4%,black_96%,transparent)]">
        <div className="animate-ticker flex w-max gap-8 py-2.5 pl-6">
          {[...list, ...list].map((item, i) => (
            <a
              key={`${item.id}-${i}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-hidden={i >= list.length ? true : undefined}
              tabIndex={i >= list.length ? -1 : undefined}
              className="flex shrink-0 items-center gap-2 text-sm font-semibold hover:text-accent"
            >
              <span className="size-2 rounded-full" style={{ background: CATEGORY_COLOR[item.category] }} />
              {item.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
