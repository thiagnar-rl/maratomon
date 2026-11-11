/**
 * Progresso do usuário (episódios marcados).
 *
 * - Só conta com a pessoa conectada: o progresso vive na conta (tabela `watched_episodes`).
 * - Sem login, marcar um episódio abre o convite para criar conta. O que ela tentou marcar
 *   fica guardado e é aplicado assim que a conta é criada ou acessada.
 * - Progresso antigo salvo no aparelho (versões anteriores do site) é juntado à conta no 1º login.
 *
 * Store simples compatível com `useSyncExternalStore`, sem bibliotecas extras.
 */
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

const LEGACY_KEY = "maratomon:watched:v1";
const PENDING_KEY = "maratomon:pending:v1";
const cacheKey = (uid: string) => `maratomon:watched:${uid}`;

export type SyncStatus = "anonimo" | "syncing" | "synced" | "error";

/** Por que o convite de conta apareceu (muda o texto do modal). */
export type PromptReason = { kind: "marcar"; count: number } | { kind: "geral" } | null;

type State = {
  watched: ReadonlySet<string>;
  ready: boolean;
  status: SyncStatus;
  email: string | null;
  loggedIn: boolean;
  prompt: PromptReason;
};

const EMPTY: ReadonlySet<string> = new Set();
let state: State = { watched: EMPTY, ready: false, status: "anonimo", email: null, loggedIn: false, prompt: null };
const listeners = new Set<() => void>();
let userId: string | null = null;

function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function readJSON<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeCache(watched: ReadonlySet<string>) {
  if (!userId) return;
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify([...watched]));
  } catch {
    // modo privado / cota cheia: segue só em memória
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

  if (!supabase || !userId) {
    // Saiu da conta: some com o progresso deste aparelho (computador compartilhado, por exemplo).
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith("maratomon:watched:") && key !== LEGACY_KEY)
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      // ignorado
    }
    setState({ watched: EMPTY, email: null, loggedIn: false, status: "anonimo", ready: true });
    return;
  }

  // Mostra na hora o último progresso conhecido desta conta, enquanto busca o atualizado.
  setState({
    email: session?.user.email ?? null,
    loggedIn: true,
    prompt: null,
    watched: new Set(readJSON<string[]>(localStorage, cacheKey(userId), [])),
    status: "syncing",
    ready: true,
  });

  const { data, error } = await supabase.from("watched_episodes").select("episode_key").eq("user_id", userId);
  if (error) {
    setState({ status: "error" });
    return;
  }
  const cloud = new Set(data.map((row) => row.episode_key as string));

  // Junta o que ficou no aparelho (versão antiga) e o que a pessoa tentou marcar antes de entrar.
  const legacy = readJSON<string[]>(localStorage, LEGACY_KEY, []);
  const pending = readJSON<{ keys: string[]; watched: boolean } | null>(sessionStorage, PENDING_KEY, null);
  const toAdd = [...legacy, ...(pending?.watched ? pending.keys : [])].filter((key) => !cloud.has(key));
  try {
    localStorage.removeItem(LEGACY_KEY);
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // ignorado
  }

  const merged = new Set([...cloud, ...toAdd]);
  writeCache(merged);
  setState({ watched: merged });
  if (toAdd.length > 0) await pushToCloud(toAdd, true);
  else setState({ status: "synced" });
}

let started = false;
/** Liga o store. Chamado uma vez pelo ProgressProvider. */
export function startProgress() {
  if (started) return;
  started = true;

  const supabase = getSupabase();
  if (!supabase) {
    setState({ ready: true });
    return;
  }
  supabase.auth.getSession().then(({ data }) => onSession(data.session));
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT") void onSession(session);
  });
}

/** Marca/desmarca. Sem login, não conta: guarda a intenção e abre o convite de conta. */
export function setWatched(keys: string[], watched: boolean) {
  if (!state.loggedIn) {
    if (watched) {
      try {
        sessionStorage.setItem(PENDING_KEY, JSON.stringify({ keys, watched }));
      } catch {
        // ignorado
      }
    }
    setState({ prompt: { kind: "marcar", count: keys.length } });
    return;
  }
  const next = new Set(state.watched);
  const changed = keys.filter((key) => next.has(key) !== watched);
  if (changed.length === 0) return;
  changed.forEach((key) => (watched ? next.add(key) : next.delete(key)));
  writeCache(next);
  setState({ watched: next });
  void pushToCloud(changed, watched);
}

export const toggleWatched = (key: string) => setWatched([key], !state.watched.has(key));

export const openAccountPrompt = () => setState({ prompt: { kind: "geral" } });
export const closeAccountPrompt = () => setState({ prompt: null });

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getSnapshot = () => state;

const serverState: State = { watched: EMPTY, ready: false, status: "anonimo", email: null, loggedIn: false, prompt: null };
export const getServerSnapshot = () => serverState;
