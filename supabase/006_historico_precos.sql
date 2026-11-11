-- Maratomon TCG 006: histórico diário de preços das cartas (gráfico de oscilação).
-- O site grava 1 ponto por carta por dia quando alguém abre a carta ou o painel do mercado.

create table if not exists public.card_price_history (
  card_id   text not null check (char_length(card_id) <= 40),
  day       date not null default (now() at time zone 'America/Sao_Paulo')::date,
  usd       numeric(12, 2) check (usd >= 0 and usd < 1000000),
  eur       numeric(12, 2) check (eur >= 0 and eur < 1000000),
  brl       numeric(12, 2) check (brl >= 0 and brl < 10000000),
  usd_brl   numeric(8, 4) check (usd_brl > 0 and usd_brl < 100),
  primary key (card_id, day)
);

alter table public.card_price_history enable row level security;
drop policy if exists "historico: todos leem" on public.card_price_history;
create policy "historico: todos leem" on public.card_price_history for select to anon, authenticated using (true);
-- Ninguém escreve direto na tabela: só pela função abaixo.

-- Grava o preço de hoje (só o primeiro registro do dia vale; não sobrescreve).
create or replace function public.record_card_price(p_card_id text, p_usd numeric, p_eur numeric, p_brl numeric, p_usd_brl numeric)
returns void language sql security definer set search_path = public as $$
  insert into public.card_price_history (card_id, usd, eur, brl, usd_brl)
  select p_card_id, p_usd, p_eur, p_brl, p_usd_brl
  where p_card_id ~ '^[A-Za-z0-9.\-]{2,40}$'
    and coalesce(p_usd, p_eur, p_brl) is not null
    -- coerência: o real tem de bater com dólar ou euro convertidos (evita valores inventados)
    and (p_brl is null or p_usd_brl is null or p_usd is null or abs(p_brl - p_usd * p_usd_brl) <= greatest(1, p_brl * 0.6))
  on conflict (card_id, day) do nothing;
$$;
revoke all on function public.record_card_price(text, numeric, numeric, numeric, numeric) from public;
grant execute on function public.record_card_price(text, numeric, numeric, numeric, numeric) to anon, authenticated;

-- Versão em lote (até 300 cartas por chamada), usada nas grades de coleção e no painel do mercado.
create or replace function public.record_card_prices(items jsonb, p_usd_brl numeric)
returns void language plpgsql security definer set search_path = public as $$
declare item jsonb;
begin
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) > 300 then return; end if;
  for item in select * from jsonb_array_elements(items) loop
    perform public.record_card_price(item ->> 'id', (item ->> 'usd')::numeric, (item ->> 'eur')::numeric, (item ->> 'brl')::numeric, p_usd_brl);
  end loop;
end $$;
revoke all on function public.record_card_prices(jsonb, numeric) from public;
grant execute on function public.record_card_prices(jsonb, numeric) to anon, authenticated;
