import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProgressProvider } from "@/components/progress-provider";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} — anime, cartas e coleção`, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  openGraph: { siteName: siteConfig.name, locale: "pt_BR", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0a12" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh flex flex-col">
        <ProgressProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ProgressProvider>
      </body>
    </html>
  );
}
