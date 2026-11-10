"use client";

import { useEffect } from "react";
import { startProgress } from "@/lib/progress/store";

/** Liga o store de progresso (aparelho + conta) assim que o site abre no navegador. */
export function ProgressProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => startProgress(), []);
  return children;
}
