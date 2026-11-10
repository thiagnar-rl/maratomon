-- Maratomon TCG 004: Radar BR (preços do Brasil registrados pela comunidade),
-- lista de desejos com preço-alvo.

-- 1) Lista de desejos é um novo tipo de coleção + preço-alvo por carta.
alter table public.collections drop constraint if exists collections_kind_check;
alter table public.collections add constraint collections_kind_check check (kind in ('deck', 'pasta', 'desejos'));
alter table public.collection_cards add column if not exists target_brl numeric(12, 2) check (target_brl >= 0);

-- 2) Registros de preço vistos no Brasil (loja física, evento, marketplace…).
create table if not exists public.br_price_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id     text not null check (char_length(card_id) <= 40),
  price_brl   numeric(12, 2) not null check (price_brl > 0 and price_brl < 1000000),
  language    text not null default 'PT' check (language in ('PT', 'EN', 'JP', 'Outro')),
  condition   text not null default 'NM' check (condition in ('NM', 'LP', 'MP', 'HP', 'DMG', 'Gradeada')),
  source      text not null default 'loja' check (source in ('loja', 'evento', 'online', 'troca', 'outro')),
  observed_on date not null default current_date check (observed_on <= current_date + 1),
  created_at  timestamptz not null default now()
);
create index if not exists br_price_notes_card_idx on public.br_price_notes (card_id, observed_on desc);

alter table public.br_price_notes enable row level security;
drop policy if exists "radar: dono le" on public.br_price_notes;
drop policy if exists "radar: dono cria" on public.br_price_notes;
drop policy if exists "radar: dono apaga" on public.br_price_notes;
create policy "radar: dono le" on public.br_price_notes for select to authenticated using ((select auth.uid()) = user_id);
create policy "radar: dono cria" on public.br_price_notes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "radar: dono apaga" on public.br_price_notes for delete to authenticated using ((select auth.uid()) = user_id);

-- Limite anti-spam: no máximo 20 registros por pessoa por dia.
create or replace function public.br_price_notes_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.br_price_notes where user_id = new.user_id and created_at > now() - interval '1 day') >= 20 then
    raise exception 'Limite de 20 registros por dia atingido.';
  end if;
  return new;
end $$;
drop trigger if exists br_price_notes_limit on public.br_price_notes;
create trigger br_price_notes_limit before insert on public.br_price_notes
  for each row execute function public.br_price_notes_limit();

-- 3) Resumo público e ANÔNIMO por carta (ninguém vê quem registrou).
--    Mediana dos últimos 90 dias em NM, ignorando valores fora da curva (fora de 1/3x–3x da mediana geral).
create or replace function public.br_price_summary(card_ids text[])
returns table (card_id text, median_brl numeric, min_brl numeric, max_brl numeric, notes integer, last_seen date)
language sql stable security definer set search_path = public as $$
  with recent as (
    select n.card_id, n.price_brl, n.observed_on
    from public.br_price_notes n
    where n.card_id = any(card_ids) and n.observed_on >= current_date - 90 and n.condition = 'NM'
  ), base as (
    select r.card_id, percentile_cont(0.5) within group (order by r.price_brl) as med from recent r group by r.card_id
  ), clean as (
    select r.* from recent r join base b using (card_id)
    where r.price_brl between b.med / 3 and b.med * 3
  )
  select c.card_id,
         round(percentile_cont(0.5) within group (order by c.price_brl)::numeric, 2),
         min(c.price_brl), max(c.price_brl), count(*)::int, max(c.observed_on)
  from clean c group by c.card_id having count(*) >= 2;
$$;

-- Série semanal (mediana por semana) para o gráfico do Radar BR.
create or replace function public.br_price_weekly(p_card_id text)
returns table (week date, median_brl numeric, notes integer)
language sql stable security definer set search_path = public as $$
  select date_trunc('week', observed_on)::date,
         round(percentile_cont(0.5) within group (order by price_brl)::numeric, 2),
         count(*)::int
  from public.br_price_notes
  where card_id = p_card_id and condition = 'NM' and observed_on >= current_date - 365
  group by 1 having count(*) >= 2 order by 1;
$$;

-- Cartas mais registradas nos últimos 7 dias (termômetro do mercado BR).
create or replace function public.br_price_trending(max_rows integer default 10)
returns table (card_id text, notes integer, median_brl numeric)
language sql stable security definer set search_path = public as $$
  select card_id, count(*)::int, round(percentile_cont(0.5) within group (order by price_brl)::numeric, 2)
  from public.br_price_notes
  where observed_on >= current_date - 7 and condition = 'NM'
  group by card_id having count(*) >= 2 order by count(*) desc, card_id limit least(max_rows, 50);
$$;

revoke all on function public.br_price_summary(text[]) from public;
revoke all on function public.br_price_weekly(text) from public;
revoke all on function public.br_price_trending(integer) from public;
grant execute on function public.br_price_summary(text[]) to anon, authenticated;
grant execute on function public.br_price_weekly(text) to anon, authenticated;
grant execute on function public.br_price_trending(integer) to anon, authenticated;
