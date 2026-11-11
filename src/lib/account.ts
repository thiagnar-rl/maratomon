"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getSupabase } from "./supabase";

function client() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("O login ainda não está configurado.");
  return supabase;
}

const redirect = (path: string) => `${window.location.origin}${path}`;

/** Conta atual, atualizada quando a pessoa entra ou sai. undefined = carregando. */
export function useUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      queueMicrotask(() => setUser(null));
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data }) => active && setUser(data.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return user;
}

// ---------- Entrar / criar conta ----------

export async function signUpWithEmail(input: { name: string; email: string; password: string; marketing: boolean }) {
  const { data, error } = await client().auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: redirect("/conta"),
      data: { full_name: input.name, terms_accepted: true, marketing_opt_in: input.marketing },
    },
  });
  if (error) throw new Error(translate(error.message));
  // Sem sessão = o Supabase pediu confirmação por e-mail.
  return { needsConfirmation: !data.session };
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await client().auth.signInWithPassword({ email, password });
  if (error) throw new Error(translate(error.message));
}

export async function sendPasswordReset(email: string) {
  const { error } = await client().auth.resetPasswordForEmail(email, { redirectTo: redirect("/conta/nova-senha") });
  if (error) throw new Error(translate(error.message));
}

export async function updatePassword(password: string) {
  const { error } = await client().auth.updateUser({ password });
  if (error) throw new Error(translate(error.message));
}

export async function signOut() {
  await client().auth.signOut();
}

// ---------- Perfil ----------

export type Profile = {
  id: string;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  phone: string | null;
  favorite_pokemon: number | null;
  marketing_opt_in: boolean;
  terms_accepted_at: string | null;
};

export async function getProfile(): Promise<Profile | null> {
  const supabase = client();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
  if (error) throw new Error(translate(error.message));
  if (data) return data as Profile;
  // Conta criada antes da tabela de perfis: cria agora.
  const meta = auth.user.user_metadata ?? {};
  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: auth.user.id, full_name: meta.full_name ?? meta.name ?? null, avatar_url: meta.avatar_url ?? meta.picture ?? null })
    .select()
    .single();
  if (insertError) throw new Error(translate(insertError.message));
  return created as Profile;
}

export async function updateProfile(patch: Partial<Omit<Profile, "id">>) {
  const supabase = client();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Entre na sua conta.");
  const { error } = await supabase.from("profiles").update(patch).eq("id", auth.user.id);
  if (error) throw new Error(translate(error.message));
}

// ---------- Endereços ----------

export type Address = {
  id: string;
  label: string;
  recipient: string;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  is_default: boolean;
};
export type AddressInput = Omit<Address, "id" | "is_default">;

export async function listAddresses(): Promise<Address[]> {
  const { data, error } = await client().from("addresses").select("*").order("is_default", { ascending: false }).order("created_at");
  if (error) throw new Error(translate(error.message));
  return (data ?? []) as Address[];
}

export async function saveAddress(input: AddressInput, id?: string) {
  const supabase = client();
  const { error } = id ? await supabase.from("addresses").update(input).eq("id", id) : await supabase.from("addresses").insert(input);
  if (error) throw new Error(translate(error.message));
}

export async function deleteAddress(id: string) {
  const { error } = await client().from("addresses").delete().eq("id", id);
  if (error) throw new Error(translate(error.message));
}

export async function setDefaultAddress(id: string) {
  const supabase = client();
  const { error: clearError } = await supabase.from("addresses").update({ is_default: false }).neq("id", id);
  if (clearError) throw new Error(translate(clearError.message));
  const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
  if (error) throw new Error(translate(error.message));
}

/** Preenche rua, bairro, cidade e UF pelo CEP (ViaCEP, gratuito). */
export async function lookupCep(cep: string): Promise<Partial<AddressInput> | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  try {
    const data = (await (await fetch(`https://viacep.com.br/ws/${digits}/json/`)).json()) as Record<string, string> & { erro?: boolean };
    if (data.erro) return null;
    return { street: data.logradouro, district: data.bairro, city: data.localidade, state: data.uf };
  } catch {
    return null;
  }
}

// ---------- Exclusão da conta (LGPD) ----------

export async function deleteMyAccount() {
  const supabase = client();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  // Apaga fotos e vídeos da coleção (o banco apaga o resto em cascata).
  const uid = auth.user.id;
  const { data: folders } = await supabase.storage.from("colecao").list(uid, { limit: 1000 });
  for (const folder of folders ?? []) {
    const { data: files } = await supabase.storage.from("colecao").list(`${uid}/${folder.name}`, { limit: 1000 });
    const paths = (files ?? []).map((f) => `${uid}/${folder.name}/${f.name}`);
    if (paths.length) await supabase.storage.from("colecao").remove(paths);
  }
  const { error } = await supabase.rpc("delete_my_account");
  if (error) throw new Error(translate(error.message));
  await supabase.auth.signOut();
  localStorage.clear();
}

/** Mensagens do Supabase em português. */
function translate(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (m.includes("user already registered")) return "Já existe uma conta com esse e-mail. Entre ou recupere a senha.";
  if (m.includes("password should be")) return "A senha precisa ter pelo menos 8 caracteres, com letras e números.";
  if (m.includes("rate limit") || m.includes("security purposes")) return "Muitas tentativas. Espere um minuto e tente de novo.";
  if (m.includes("profiles_nickname_key") || m.includes("duplicate key")) return "Esse apelido já está em uso.";
  if (m.includes("nickname")) return "Apelido: 3 a 24 letras, números, ponto ou _.";
  if (m.includes("phone")) return "Telefone inválido.";
  if (m.includes("limite de 5")) return "Você pode salvar até 5 endereços.";
  return message;
}
