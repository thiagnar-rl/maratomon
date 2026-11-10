-- Maratomon 002: filmes/jogos no progresso + Minha coleção (decks, pastas, cartas, fotos e vídeos).
-- Rode uma vez no Supabase: SQL Editor › New query › colar › Run.

-- 1) Progresso agora também guarda filmes ("f-1") e jogos ("g-pokemon-red-e-blue").
alter table public.watched_episodes drop constraint if exists watched_episodes_episode_key_check;
alter table public.watched_episodes add constraint watched_episodes_episode_key_check
  check (episode_key ~ '^([0-9]{1,2}-[0-9]{1,3}|f-[0-9]{1,3}|g-[a-z0-9-]{1,80})$');

-- 2) Decks e pastas
create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('deck', 'pasta')),
  name        text not null check (char_length(name) between 1 and 80),
  description text check (char_length(description) <= 1000),
  created_at  timestamptz not null default now()
);
create index if not exists collections_user_idx on public.collections (user_id);

-- 3) Cartas dentro de cada deck/pasta
create table if not exists public.collection_cards (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id       text not null check (char_length(card_id) <= 40),
  card_name     text not null,
  set_name      text,
  image         text,
  quantity      integer not null default 1 check (quantity between 1 and 999),
  condition     text check (condition in ('NM', 'LP', 'MP', 'HP', 'DMG', 'Gradeada')),
  paid_brl      numeric(12, 2) check (paid_brl >= 0),
  created_at    timestamptz not null default now()
);
create index if not exists collection_cards_collection_idx on public.collection_cards (collection_id);

-- 4) Fotos e vídeos (arquivos ficam no Storage, bucket "colecao")
create table if not exists public.collection_media (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  path          text not null,
  mime          text not null,
  caption       text check (char_length(caption) <= 200),
  created_at    timestamptz not null default now()
);
create index if not exists collection_media_collection_idx on public.collection_media (collection_id);

-- 5) Segurança: cada pessoa só vê e mexe no que é seu.
alter table public.collections enable row level security;
alter table public.collection_cards enable row level security;
alter table public.collection_media enable row level security;

do $$
declare t text;
begin
  foreach t in array array['collections', 'collection_cards', 'collection_media'] loop
    execute format('drop policy if exists "dono le" on public.%I', t);
    execute format('drop policy if exists "dono cria" on public.%I', t);
    execute format('drop policy if exists "dono edita" on public.%I', t);
    execute format('drop policy if exists "dono apaga" on public.%I', t);
    execute format('create policy "dono le" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "dono cria" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "dono edita" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "dono apaga" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- 6) Bucket privado para fotos e vídeos (até 50 MB por arquivo).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('colecao', 'colecao', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Arquivos ficam em colecao/<id do usuário>/<id da coleção>/<arquivo>; só o dono acessa.
drop policy if exists "colecao: dono le" on storage.objects;
drop policy if exists "colecao: dono envia" on storage.objects;
drop policy if exists "colecao: dono apaga" on storage.objects;
create policy "colecao: dono le" on storage.objects for select to authenticated
  using (bucket_id = 'colecao' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "colecao: dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'colecao' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "colecao: dono apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'colecao' and (storage.foldername(name))[1] = (select auth.uid())::text);
