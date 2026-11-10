/**
 * Progresso do usuário (episódios assistidos).
 *
 * - Sempre salva no aparelho (localStorage), então funciona sem login.
 * - Com login no Supabase, sincroniza com a tabela `watched_episodes`
 *   e junta o que estava no aparelho com o que estava na conta.
 *
 * É um store simples compatível com `useSyncExternalStore`, sem bibliotecas extras.
 */
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

const STORAGE_KEY = "maratomon:watched:v1";

export type SyncStatus = "local" | "syncing" | "synced" | "error";

type State = {
  watched: ReadonlySet<string>;
  ready: boolean;
  status: SyncStatus;
  email: string | null;
};

let state: State = { watched: new Set(), ready: false, status: "local", email: null };
const listeners = new Set<() => void>();
let userId: string | null = null;

function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function readLocal(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(watched: ReadonlySet<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...watched]));
  } catch {
    // Armazenamento indisponível (modo privado, cota cheia): segue só em memória.
  }
}

async function pushToCloud(keys: string[], watched: boolean) {
  const supabase = getSupabase();
  if (!supabase || !userId || keys.length === 0) return;
  setState({ status: "syncing" });
  const query = watched
    ? supabase
        .from("watched_episodes")
        .upsert(keys.map((episode_key) => ({ user_id: userId, episode_key })), { ignoreDuplicates: true })
    : supabase.from("watched_episodes").delete().eq("user_id", userId).in("episode_key", keys);
  const { error } = await query;
  setState({ status: error ? "error" : "synced" });
}

async function onSession(session: Session | null) {
  const supabase = getSupabase();
  userId = session?.user.id ?? null;
  setState({ email: session?.user.email ?? null });
  if (!supabase || !userId) {
    setState({ status: "local" });
    return;
  }

  setState({ status: "syncing" });
  const { data, error } = await supabase.from("watched_episodes").select("episode_key").eq("user_id", userId);
  if (error) {
    setState({ status: "error" });
    return;
  }
  const cloud = new Set(data.map((row) => row.episode_key as string));
  const onlyLocal = [...state.watched].filter((key) => !cloud.has(key));
  const merged = new Set([...cloud, ...state.watched]);
  writeLocal(merged);
  setState({ watched: merged });
  if (onlyLocal.length > 0) await pushToCloud(onlyLocal, true);
  else setState({ status: "synced" });
}

let started = false;
/** Carrega o progresso salvo e liga a sincronização. Chamado uma vez pelo ProgressProvider. */
export function startProgress() {
  if (started) return;
  started = true;
  setState({ watched: new Set(readLocal()), ready: true });

  const supabase = getSupabase();
  if (!supabase) return;
  supabase.auth.getSession().then(({ data }) => onSession(data.session));
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT") void onSession(session);
  });

  // Mudanças feitas em outra aba do mesmo navegador.
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) setState({ watched: new Set(readLocal()) });
  });
}

export function setWatched(keys: string[], watched: boolean) {
  const next = new Set(state.watched);
  const changed = keys.filter((key) => next.has(key) !== watched);
  if (changed.length === 0) return;
  changed.forEach((key) => (watched ? next.add(key) : next.delete(key)));
  writeLocal(next);
  setState({ watched: next });
  void pushToCloud(changed, watched);
}

export const toggleWatched = (key: string) => setWatched([key], !state.watched.has(key));

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getSnapshot = () => state;

const serverState: State = { watched: new Set(), ready: false, status: "local", email: null };
export const getServerSnapshot = () => serverState;
