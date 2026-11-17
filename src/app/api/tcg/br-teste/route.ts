// Diagnóstico temporário da leitura do MYP Cards.
export const dynamic = "force-dynamic";
const H = { "User-Agent": "MaratomonTCG/1.0 (+https://maratomon.vercel.app)", Accept: "text/html" };

export async function GET() {
  const out: Record<string, unknown> = {};
  for (const path of ["/pokemon/edicoes?page=1&per-page=48", "/pokemon/edicoes?page=5&per-page=48", "/pokemon/mega-evolucao-fogo-fantasmagorico", "/pokemon/produto/300735"]) {
    try {
      const r = await fetch(`https://mypcards.com${path}`, { headers: H, cache: "no-store" });
      const t = await r.text();
      out[path] = { status: r.status, length: t.length, challenge: /Just a moment|cf-chl/i.test(t), title: t.match(/<title>([^<]*)/)?.[1], medio: t.match(/resumo-preco--menor"[^>]*title="([^"]*)"/)?.[1], skus: (t.match(/pokemon_pfl_\d+\/\d+/g) ?? []).length };
    } catch (e) {
      out[path] = { error: String(e) };
    }
  }
  return Response.json(out);
}
