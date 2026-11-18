import { ImageResponse } from "next/og";

/** Imagem (PNG 1200 de largura) da coleção para postar ou mandar: título, total e as cartas mais valiosas. */
type Body = { title?: string; copies?: number; value?: number | null; cards?: { name: string; image: string | null; value: number | null; quantity: number }[] };

const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const ALLOWED = /^https:\/\/(assets\.tcgdex\.net|images\.pokemontcg\.io|images\.scrydex\.com)\//;

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }
  const title = String(body.title ?? "Minha coleção").slice(0, 60);
  const cards = (Array.isArray(body.cards) ? body.cards : []).slice(0, 12).map((c) => ({
    name: String(c.name ?? "").slice(0, 28),
    image: typeof c.image === "string" && ALLOWED.test(c.image) ? c.image : null,
    value: typeof c.value === "number" ? c.value : null,
    quantity: Math.max(1, Math.min(999, Number(c.quantity) || 1)),
  }));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: 56, background: "linear-gradient(160deg, #1b2450 0%, #121a3a 50%, #0d1230 100%)", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 26, letterSpacing: 6, color: "#9fb3ff", fontWeight: 800 }}>FORJA ARCANA</span>
            <span style={{ fontSize: 58, fontWeight: 900, marginTop: 6 }}>{title}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
          {typeof body.value === "number" && (
            <div style={{ display: "flex", flexDirection: "column", padding: "18px 28px", borderRadius: 28, background: "rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: 22, color: "#a8b2d8", fontWeight: 800 }}>VALE HOJE</span>
              <span style={{ fontSize: 56, fontWeight: 900, color: "#ffd43b" }}>{money(body.value)}</span>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", padding: "18px 28px", borderRadius: 28, background: "rgba(255,255,255,0.08)" }}>
            <span style={{ fontSize: 22, color: "#a8b2d8", fontWeight: 800 }}>CARTAS</span>
            <span style={{ fontSize: 56, fontWeight: 900 }}>{Number(body.copies) || cards.length}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 22, marginTop: 36 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", width: 250 }}>
              <div style={{ display: "flex", position: "relative", width: 250, height: 349, borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.08)" }}>
                {c.image ? <img src={c.image} width={250} height={349} alt="" style={{ objectFit: "cover" }} /> : <span style={{ margin: "auto", fontSize: 22 }}>{c.name}</span>}
                {c.quantity > 1 && (
                  <span style={{ position: "absolute", top: 10, right: 10, background: "#2563eb", borderRadius: 999, padding: "4px 12px", fontSize: 22, fontWeight: 900 }}>x{c.quantity}</span>
                )}
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{c.name}</span>
              {c.value != null && <span style={{ fontSize: 22, color: "#7dd3fc", fontWeight: 800 }}>{money(c.value)}</span>}
            </div>
          ))}
        </div>
        <span style={{ marginTop: "auto", fontSize: 22, color: "#8890b5" }}>forja-arcana.vercel.app · valores estimados em reais</span>
      </div>
    ),
    { width: 1200, height: 420 + Math.max(1, Math.ceil(cards.length / 4)) * 440 },
  );
}
