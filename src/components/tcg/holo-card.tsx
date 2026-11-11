"use client";

import { useRef } from "react";

/**
 * Carta com efeito holográfico: inclina em 3D seguindo o mouse e ganha brilho de arco-íris,
 * como uma carta rara de verdade. Respeita "reduzir movimento" do sistema.
 */
export function HoloCard({ children, className = "", strong = false }: { children: React.ReactNode; className?: string; strong?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  function move(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - y) * (strong ? 22 : 14)}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * (strong ? 26 : 18)}deg`);
    el.dataset.active = "true";
  }

  function leave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.dataset.active = "false";
  }

  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={`holo-card ${className}`}>
      {children}
      <span aria-hidden="true" className="holo-sheen" />
      <span aria-hidden="true" className="holo-glare" />
    </div>
  );
}
