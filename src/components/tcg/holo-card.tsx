"use client";

import { useRef } from "react";
import { CardBack } from "./card-back";

/**
 * Carta interativa:
 * - passe o mouse: inclina em 3D e brilha como holográfica;
 * - segure e arraste para os lados: gira 360° e mostra o verso;
 * - ao soltar, volta sempre virada para a frente.
 */
export function HoloCard({
  children,
  className = "",
  faceClassName = "",
  strong = false,
}: {
  children: React.ReactNode;
  className?: string;
  faceClassName?: string;
  strong?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; angle: number; moved: boolean } | null>(null);
  const spin = useRef(0);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);

  const set = (name: string, value: string) => ref.current?.style.setProperty(name, value);

  function tilt(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    set("--mx", `${x * 100}%`);
    set("--my", `${y * 100}%`);
    set("--rx", `${(0.5 - y) * (strong ? 22 : 14)}deg`);
    set("--ry", `${(x - 0.5) * (strong ? 26 : 18)}deg`);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    clearTimeout(settle.current);
    drag.current = { x: e.clientX, angle: spin.current, moved: false };
    ref.current!.dataset.mode = "drag";
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (d) {
      const dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) > 6) {
        d.moved = true;
        ref.current!.setPointerCapture(e.pointerId);
        set("--rx", "0deg");
        set("--ry", "0deg");
      }
      if (d.moved) {
        spin.current = d.angle + dx * (strong ? 0.9 : 1.6);
        set("--spin", `${spin.current}deg`);
      }
      return;
    }
    if (e.pointerType === "mouse") {
      ref.current!.dataset.mode = "tilt";
      tilt(e);
    }
  }

  function release() {
    const d = drag.current;
    drag.current = null;
    const el = ref.current;
    if (!el) return;
    if (!d?.moved) {
      el.dataset.mode = "tilt";
      return;
    }
    // Volta para a frente pelo caminho mais curto (múltiplo de 360°).
    el.dataset.mode = "settle";
    spin.current = Math.round(spin.current / 360) * 360;
    set("--spin", `${spin.current}deg`);
    settle.current = setTimeout(() => {
      el.dataset.mode = "idle";
      spin.current = 0;
      set("--spin", "0deg");
    }, 750);
  }

  function leave() {
    if (drag.current) return;
    set("--rx", "0deg");
    set("--ry", "0deg");
    if (ref.current?.dataset.mode === "tilt") ref.current.dataset.mode = "idle";
  }

  return (
    <div
      ref={ref}
      data-mode="idle"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={leave}
      // Se arrastou para girar, não abre o link da carta.
      onClickCapture={(e) => {
        if (ref.current?.dataset.mode === "settle") {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onDragStart={(e) => e.preventDefault()}
      className={`holo-card ${className}`}
      title="Arraste para girar a carta"
    >
      <div className={`holo-face relative ${faceClassName}`}>
        {children}
        <span aria-hidden="true" className="holo-sheen" />
        <span aria-hidden="true" className="holo-glare" />
      </div>
      <div aria-hidden="true" className={`holo-face holo-back absolute inset-0 ${faceClassName}`}>
        <CardBack />
      </div>
    </div>
  );
}
