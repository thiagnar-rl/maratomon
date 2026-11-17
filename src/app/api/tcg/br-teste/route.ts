// Teste temporário: o servidor consegue ler o MYP Cards?
export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {};
  for (const url of ["https://mypcards.com/pokemon/edicoes", "https://mypcards.com/pokemon/produto/300735/dawn"]) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "MaratomonBot/1.0 (+https://maratomon.vercel.app)", Accept: "text/html" }, cache: "no-store" });
      const t = await r.text();
      out[url] = { status: r.status, length: t.length, hasSku: t.includes("pokemon_pfl_129/094"), challenge: /Just a moment|cf-chl/i.test(t) };
    } catch (e) {
      out[url] = { error: String(e) };
    }
  }
  return Response.json(out);
}
