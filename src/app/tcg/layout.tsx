import { TcgMegaNav } from "@/components/tcg/tcg-mega-nav";

export default function TcgLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TcgMegaNav />
      {children}
    </>
  );
}
