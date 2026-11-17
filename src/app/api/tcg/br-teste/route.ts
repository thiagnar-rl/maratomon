// Diagnóstico temporário da leitura do MYP Cards.
import { brPrices, mypDebug, mypProduct } from "@/lib/tcg/mypcards";
export const dynamic = "force-dynamic";

export async function GET() {
  const [debug, product, list] = await Promise.all([
    mypDebug({ setId: "me02", localId: "129" }),
    mypProduct({ setId: "me02", localId: "129" }),
    brPrices([{ id: "me02-129", setId: "me02", localId: "129" }, { id: "base1-4", setId: "base1", localId: "4" }]),
  ]);
  return Response.json({ debug, product, list });
}
