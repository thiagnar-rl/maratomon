-- Maratomon: progresso dos usuários.
-- Rode este arquivo uma vez no Supabase: Dashboard › SQL Editor › New query › colar › Run.

create table if not exists public.watched_episodes (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  episode_key text        not null check (episode_key ~ '^[0-9]{1,2}-[0-9]{1,3}$'),
  watched_at  timestamptz not null default now(),
  primary key (user_id, episode_key)
);

comment on table public.watched_episodes is 'Episódios marcados como assistidos. episode_key = "temporada-episódio", ex.: "1-25".';

-- Segurança: cada pessoa só enxerga e altera as próprias linhas.
alter table public.watched_episodes enable row level security;

drop policy if exists "ler o próprio progresso" on public.watched_episodes;
create policy "ler o próprio progresso" on public.watched_episodes
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "marcar o próprio progresso" on public.watched_episodes;
create policy "marcar o próprio progresso" on public.watched_episodes
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "desmarcar o próprio progresso" on public.watched_episodes;
create policy "desmarcar o próprio progresso" on public.watched_episodes
  for delete to authenticated using ((select auth.uid()) = user_id);
