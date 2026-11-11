"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  deleteAddress,
  deleteMyAccount,
  getProfile,
  linkProvider,
  listAddresses,
  lookupCep,
  PROVIDER_LABEL,
  saveAddress,
  setDefaultAddress,
  signOut,
  SOCIAL,
  unlinkProvider,
  updatePassword,
  updateProfile,
  useUser,
  type Address,
  type AddressInput,
  type Profile,
} from "@/lib/account";
import { artwork } from "@/lib/pokemon";
import { Mascot } from "@/components/mascot";
import { ProviderIcon } from "./social-buttons";

const input = "w-full rounded-xl border border-line bg-bg px-4 py-2.5 outline-none transition focus:border-accent";
const card = "space-y-4 rounded-[2rem] border border-line bg-surface p-6";

function useFlash() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const flash = useCallback((ok: boolean, text: string) => {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 4000);
  }, []);
  const node = msg && (
    <p role="status" className={`rounded-xl px-4 py-2 text-sm font-semibold ${msg.ok ? "bg-good/15 text-good" : "bg-accent/10 text-accent"}`}>
      {msg.text}
    </p>
  );
  return [flash, node] as const;
}

export function AccountDashboard() {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user === null) router.replace("/entrar");
  }, [user, router]);

  if (!user) return <p className="text-ink-soft">Carregando…</p>;
  return <Dashboard user={user} />;
}

function Dashboard({ user }: { user: User }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getProfile()
      .then((p) => active && setProfile(p))
      .catch((e) => active && setError(e instanceof Error ? e.message : "Erro ao carregar o perfil."));
    return () => {
      active = false;
    };
  }, []);

  const name = profile?.full_name || user.email?.split("@")[0] || "Treinador";
  const avatar = profile?.favorite_pokemon ? artwork(profile.favorite_pokemon) : profile?.avatar_url;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-5 rounded-[2rem] border border-line bg-gradient-to-br from-accent/25 via-surface to-surface p-6">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2 ring-4 ring-accent/40">
          {avatar ? <img src={avatar} alt="" className="size-full object-cover" referrerPolicy="no-referrer" /> : <Mascot className="size-16" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-accent">Sua conta</p>
          <h1 className="truncate font-display text-3xl font-extrabold">Olá, {name}!</h1>
          <p className="truncate text-sm text-ink-soft">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/minha-jornada" className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold hover:border-ink-soft">Minha jornada</Link>
          <Link href="/colecao" className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold hover:border-ink-soft">Minha coleção</Link>
          <button type="button" onClick={() => void signOut()} className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-bg">Sair</button>
        </div>
      </header>

      {error && <p role="alert" className="text-accent">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        {profile && <ProfileForm profile={profile} onSaved={setProfile} />}
        <LinkedAccounts user={user} />
        <Addresses defaultRecipient={profile?.full_name ?? ""} />
        <Security user={user} />
      </div>
    </div>
  );
}

function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    nickname: profile.nickname ?? "",
    phone: profile.phone ?? "",
    favorite_pokemon: profile.favorite_pokemon ? String(profile.favorite_pokemon) : "",
    marketing_opt_in: profile.marketing_opt_in,
  });
  const [busy, setBusy] = useState(false);
  const [flash, node] = useFlash();
  const dex = Number(form.favorite_pokemon);

  return (
    <form
      className={card}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const patch = {
          full_name: form.full_name.trim() || null,
          nickname: form.nickname.trim() || null,
          phone: form.phone.trim() || null,
          favorite_pokemon: dex >= 1 && dex <= 1100 ? dex : null,
          marketing_opt_in: form.marketing_opt_in,
          terms_accepted_at: profile.terms_accepted_at ?? new Date().toISOString(),
        };
        try {
          await updateProfile(patch);
          onSaved({ ...profile, ...patch });
          flash(true, "Perfil salvo!");
        } catch (err) {
          flash(false, err instanceof Error ? err.message : "Não foi possível salvar.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="font-display text-xl font-extrabold">Perfil</h2>
      <label className="block space-y-1 text-sm font-semibold">
        Nome
        <input className={input} value={form.full_name} maxLength={120} onChange={(e) => setForm({ ...form, full_name: e.target.value })} autoComplete="name" />
      </label>
      <label className="block space-y-1 text-sm font-semibold">
        Apelido de treinador
        <input className={input} value={form.nickname} placeholder="ex.: ash_ketchum" pattern="[A-Za-z0-9_.]{3,24}" title="3 a 24 letras, números, ponto ou _" onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
      </label>
      <label className="block space-y-1 text-sm font-semibold">
        Celular (para entregas)
        <input className={input} type="tel" value={form.phone} placeholder="(11) 91234-5678" autoComplete="tel" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </label>
      <label className="block space-y-1 text-sm font-semibold">
        Pokémon favorito (nº da Pokédex) — vira sua foto
        <span className="flex items-center gap-3">
          <input className={input} type="number" min={1} max={1025} value={form.favorite_pokemon} placeholder="ex.: 94" onChange={(e) => setForm({ ...form, favorite_pokemon: e.target.value })} />
          {dex >= 1 && dex <= 1025 && <img src={artwork(dex)} alt="" className="size-12 shrink-0" />}
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm text-ink-soft">
        <input type="checkbox" checked={form.marketing_opt_in} onChange={(e) => setForm({ ...form, marketing_opt_in: e.target.checked })} className="mt-1 accent-[var(--accent)]" />
        Quero receber novidades e ofertas da loja por e-mail.
      </label>
      <button disabled={busy} className="rounded-full bg-accent px-5 py-2.5 font-bold text-white disabled:opacity-50">{busy ? "Salvando…" : "Salvar perfil"}</button>
      {node}
    </form>
  );
}

function LinkedAccounts({ user }: { user: User }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, node] = useFlash();
  const linked = new Set((user.identities ?? []).map((i) => i.provider));

  return (
    <section className={card}>
      <h2 className="font-display text-xl font-extrabold">Formas de entrar</h2>
      <p className="text-sm text-ink-soft">Vincule suas contas para entrar com qualquer uma delas.</p>
      <ul className="space-y-2">
        <li className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3">
          <span className="text-lg">✉️</span>
          <span className="flex-1 font-semibold">{PROVIDER_LABEL.email}</span>
          <span className="text-xs font-bold text-good">{linked.has("email") ? "Vinculado" : "—"}</span>
        </li>
        {SOCIAL.map((provider) => {
          const on = linked.has(provider);
          return (
            <li key={provider} className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3">
              <ProviderIcon provider={provider} />
              <span className="flex-1 font-semibold">{PROVIDER_LABEL[provider]}</span>
              <button
                type="button"
                disabled={busy !== null}
                onClick={async () => {
                  setBusy(provider);
                  try {
                    if (on) {
                      await unlinkProvider(user, provider);
                      flash(true, `${PROVIDER_LABEL[provider]} desvinculado.`);
                    } else await linkProvider(provider);
                  } catch (err) {
                    flash(false, err instanceof Error ? err.message : "Não foi possível.");
                  } finally {
                    setBusy(null);
                  }
                }}
                className={`rounded-full px-3 py-1 text-xs font-bold ${on ? "border border-line text-ink-soft hover:text-accent" : "bg-accent text-white"} disabled:opacity-50`}
              >
                {on ? "Desvincular" : "Vincular"}
              </button>
            </li>
          );
        })}
      </ul>
      {node}
    </section>
  );
}

const emptyAddress = (recipient: string): AddressInput => ({
  label: "Casa",
  recipient,
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
});

function Addresses({ defaultRecipient }: { defaultRecipient: string }) {
  const [list, setList] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<{ id?: string; data: AddressInput } | null>(null);
  const [flash, node] = useFlash();

  const load = useCallback(async () => {
    try {
      setList(await listAddresses());
    } catch {
      setList([]);
    }
  }, []);
  useEffect(() => {
    let active = true;
    listAddresses()
      .then((l) => active && setList(l))
      .catch(() => active && setList([]));
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className={card}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-extrabold">Endereços de entrega</h2>
        {!editing && (list?.length ?? 0) < 5 && (
          <button type="button" onClick={() => setEditing({ data: emptyAddress(defaultRecipient) })} className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">
            + Adicionar
          </button>
        )}
      </div>
      <p className="text-sm text-ink-soft">Para quando a loja abrir: suas compras já saem com o endereço certo.</p>

      {editing ? (
        <AddressForm
          value={editing.data}
          onCancel={() => setEditing(null)}
          onSave={async (data) => {
            try {
              await saveAddress(data, editing.id);
              setEditing(null);
              await load();
              flash(true, "Endereço salvo!");
            } catch (err) {
              flash(false, err instanceof Error ? err.message : "Não foi possível salvar.");
            }
          }}
        />
      ) : list === null ? (
        <p className="text-sm text-ink-soft">Carregando…</p>
      ) : list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-4 text-center text-sm text-ink-soft">Nenhum endereço ainda.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((a) => (
            <li key={a.id} className="rounded-2xl bg-surface-2 p-4 text-sm">
              <p className="font-bold">
                {a.label} {a.is_default && <span className="ml-1 rounded-full bg-accent-2 px-2 text-[10px] font-black uppercase text-black">Principal</span>}
              </p>
              <p className="text-ink-soft">
                {a.recipient} · {a.street}, {a.number}
                {a.complement ? ` – ${a.complement}` : ""} · {a.district} · {a.city}/{a.state} · CEP {a.cep}
              </p>
              <div className="mt-2 flex gap-3 text-xs font-bold">
                <button type="button" onClick={() => setEditing({ id: a.id, data: { ...a, complement: a.complement ?? "" } })} className="text-accent">Editar</button>
                {!a.is_default && (
                  <button type="button" onClick={async () => { await setDefaultAddress(a.id); await load(); }} className="text-ink-soft hover:text-ink">
                    Tornar principal
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm("Remover este endereço?")) return;
                    await deleteAddress(a.id);
                    await load();
                  }}
                  className="text-ink-soft hover:text-accent"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {node}
    </section>
  );
}

function AddressForm({ value, onSave, onCancel }: { value: AddressInput; onSave: (a: AddressInput) => Promise<void>; onCancel: () => void }) {
  const [a, setA] = useState(value);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement>) => setA({ ...a, [k]: e.target.value });

  return (
    <form
      className="grid grid-cols-6 gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await onSave({ ...a, state: a.state.toUpperCase(), complement: a.complement || null });
        setBusy(false);
      }}
    >
      <input className={`${input} col-span-2`} required placeholder="Apelido" value={a.label} onChange={set("label")} maxLength={30} aria-label="Apelido do endereço" />
      <input className={`${input} col-span-4`} required placeholder="Destinatário" value={a.recipient} onChange={set("recipient")} autoComplete="name" aria-label="Destinatário" />
      <input
        className={`${input} col-span-2`}
        required
        placeholder="CEP"
        inputMode="numeric"
        pattern="[0-9]{5}-?[0-9]{3}"
        value={a.cep}
        autoComplete="postal-code"
        aria-label="CEP"
        onChange={set("cep")}
        onBlur={async () => {
          const found = await lookupCep(a.cep);
          if (found) setA((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(found).filter(([, v]) => v)) }));
        }}
      />
      <input className={`${input} col-span-4`} required placeholder="Rua" value={a.street} onChange={set("street")} autoComplete="address-line1" aria-label="Rua" />
      <input className={`${input} col-span-2`} required placeholder="Número" value={a.number} onChange={set("number")} aria-label="Número" />
      <input className={`${input} col-span-4`} placeholder="Complemento" value={a.complement ?? ""} onChange={set("complement")} autoComplete="address-line2" aria-label="Complemento" />
      <input className={`${input} col-span-3`} required placeholder="Bairro" value={a.district} onChange={set("district")} aria-label="Bairro" />
      <input className={`${input} col-span-2`} required placeholder="Cidade" value={a.city} onChange={set("city")} autoComplete="address-level2" aria-label="Cidade" />
      <input className={`${input} col-span-1 uppercase`} required placeholder="UF" maxLength={2} pattern="[A-Za-z]{2}" value={a.state} onChange={set("state")} aria-label="UF" />
      <div className="col-span-6 flex gap-2 pt-1">
        <button disabled={busy} className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? "Salvando…" : "Salvar endereço"}</button>
        <button type="button" onClick={onCancel} className="rounded-full border border-line px-5 py-2 text-sm font-bold">Cancelar</button>
      </div>
    </form>
  );
}

function Security({ user }: { user: User }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, node] = useFlash();
  const hasEmail = (user.identities ?? []).some((i) => i.provider === "email");

  return (
    <section className={card}>
      <h2 className="font-display text-xl font-extrabold">Segurança e privacidade</h2>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await updatePassword(password);
            setPassword("");
            flash(true, hasEmail ? "Senha alterada!" : "Senha criada! Agora você também pode entrar com e-mail e senha.");
          } catch (err) {
            flash(false, err instanceof Error ? err.message : "Não foi possível.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <input
          className={`${input} min-w-0 flex-1`}
          type="password"
          required
          minLength={8}
          pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,}"
          title="Pelo menos 8 caracteres, com letras e números"
          autoComplete="new-password"
          placeholder={hasEmail ? "Nova senha" : "Criar uma senha"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label="Nova senha"
        />
        <button disabled={busy} className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-bg disabled:opacity-50">{hasEmail ? "Alterar senha" : "Criar senha"}</button>
      </form>
      {node}
      <div className="space-y-2 border-t border-line pt-4 text-sm text-ink-soft">
        <p>
          Seus dados são tratados conforme a <Link href="/privacidade" className="underline">Política de privacidade</Link> (LGPD).
        </p>
        <button
          type="button"
          onClick={async () => {
            const typed = window.prompt('Isso apaga sua conta, progresso, coleção, fotos e endereços para sempre. Digite "EXCLUIR" para confirmar:');
            if (typed !== "EXCLUIR") return;
            try {
              await deleteMyAccount();
              window.location.href = "/";
            } catch (err) {
              flash(false, err instanceof Error ? err.message : "Não foi possível excluir.");
            }
          }}
          className="font-bold text-accent"
        >
          Excluir minha conta
        </button>
      </div>
    </section>
  );
}
