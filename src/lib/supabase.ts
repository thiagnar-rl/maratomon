import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** true quando as variáveis do Supabase estão configuradas (.env.local / Vercel). */
export const isSupabaseConfigured = Boolean(url && publishableKey);

let client: SupabaseClient | null = null;

/**
 * Cliente do Supabase para o navegador. Retorna null se o projeto ainda não foi
 * configurado: nesse caso o site funciona só com o progresso salvo no aparelho.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured || typeof window === "undefined") return null;
  client ??= createClient(url!, publishableKey!, {
    auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true },
  });
  return client;
}
