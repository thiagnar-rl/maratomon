-- Maratomon TCG 005: contas de usuário (perfil + endereços para compras futuras).
-- Rode no Supabase: SQL Editor › New query › colar › Run. Pode rodar de novo sem problema.

-- 1) Perfil público mínimo de cada conta (1 linha por usuário).
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  full_name        text check (char_length(full_name) <= 120),
  nickname         text check (nickname ~ '^[A-Za-z0-9_.]{3,24}$'),
  avatar_url       text check (char_length(avatar_url) <= 500),
  phone            text check (phone ~ '^\+?[0-9 ()-]{8,20}$'),
  favorite_pokemon integer check (favorite_pokemon between 1 and 1100),
  marketing_opt_in boolean not null default false,
  terms_accepted_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index if not exists profiles_nickname_key on public.profiles (lower(nickname));

alter table public.profiles enable row level security;
drop policy if exists "perfil: dono le" on public.profiles;
drop policy if exists "perfil: dono altera" on public.profiles;
drop policy if exists "perfil: dono cria" on public.profiles;
create policy "perfil: dono le" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "perfil: dono cria" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "perfil: dono altera" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- Cria o perfil automaticamente quando a conta nasce, com o nome informado no cadastro.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, terms_accepted_at, marketing_opt_in)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 120),
    left(coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'), 500),
    case when (new.raw_user_meta_data ->> 'terms_accepted') = 'true' then now() end,
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Perfis para contas que já existiam antes desta migração.
insert into public.profiles (id, full_name, avatar_url)
select u.id, left(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'), 120),
       left(coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'), 500)
from auth.users u
on conflict (id) do nothing;

-- 2) Endereços de entrega (para a loja, no futuro).
create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label       text not null default 'Casa' check (char_length(label) <= 30),
  recipient   text not null check (char_length(recipient) between 2 and 120),
  cep         text not null check (cep ~ '^[0-9]{5}-?[0-9]{3}$'),
  street      text not null check (char_length(street) <= 160),
  number      text not null check (char_length(number) <= 20),
  complement  text check (char_length(complement) <= 80),
  district    text not null check (char_length(district) <= 80),
  city        text not null check (char_length(city) <= 80),
  state       char(2) not null check (state ~ '^[A-Z]{2}$'),
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists addresses_user_idx on public.addresses (user_id);

alter table public.addresses enable row level security;
drop policy if exists "endereco: dono le" on public.addresses;
drop policy if exists "endereco: dono cria" on public.addresses;
drop policy if exists "endereco: dono altera" on public.addresses;
drop policy if exists "endereco: dono apaga" on public.addresses;
create policy "endereco: dono le" on public.addresses for select to authenticated using ((select auth.uid()) = user_id);
create policy "endereco: dono cria" on public.addresses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "endereco: dono altera" on public.addresses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "endereco: dono apaga" on public.addresses for delete to authenticated using ((select auth.uid()) = user_id);

-- No máximo 5 endereços por conta.
create or replace function public.addresses_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.addresses where user_id = new.user_id) >= 5 then
    raise exception 'Limite de 5 endereços por conta.';
  end if;
  return new;
end $$;
drop trigger if exists addresses_limit on public.addresses;
create trigger addresses_limit before insert on public.addresses for each row execute function public.addresses_limit();

-- 3) Exclusão de conta pelo próprio usuário (LGPD): apaga o usuário e, em cascata, tudo dele.
--    As fotos e vídeos do Storage são apagados antes pelo site (a API do Storage não deixa apagar via SQL).
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Não autenticado.'; end if;
  delete from auth.users where id = uid;
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
