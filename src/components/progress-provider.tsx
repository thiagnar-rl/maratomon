"use client";

import { useEffect } from "react";
import { startProgress } from "@/lib/progress/store";
import { AccountPrompt } from "./account-prompt";

/** Liga o store de progresso (ligado à conta) e o convite para criar conta. */
export function ProgressProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => startProgress(), []);
  return (
    <>
      {children}
      <AccountPrompt />
    </>
  );
}
