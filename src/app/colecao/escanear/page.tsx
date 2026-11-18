import type { Metadata } from "next";
import { CardScanner } from "@/components/collection/card-scanner";
import { RequireLogin } from "@/components/collection/require-login";

export const metadata: Metadata = {
  title: "Escanear cartas",
  description: "Aponte a câmera para a carta e adicione à sua coleção em segundos.",
  robots: { index: false },
};

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-3xl px-0 py-0 sm:px-6 sm:py-8">
      <RequireLogin>
        <CardScanner />
      </RequireLogin>
    </div>
  );
}
