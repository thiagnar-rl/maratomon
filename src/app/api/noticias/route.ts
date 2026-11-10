import { getNews } from "@/lib/news";

export const revalidate = 3600;

/** Diagnóstico das fontes de notícias (quantos itens cada uma trouxe). */
export async function GET() {
  const { items, sources, updatedAt } = await getNews(10);
  return Response.json({ updatedAt, sources, latest: items.map((i) => ({ title: i.title, source: i.source, category: i.category })) });
}
