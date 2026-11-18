-- Forja Arcana 007: coleção completa (idioma, versão, preço quando entrou e conquistas).
-- Pode rodar mais de uma vez sem problema.

alter table public.collection_cards add column if not exists language text not null default 'PT';
alter table public.collection_cards drop constraint if exists collection_cards_language_check;
alter table public.collection_cards add constraint collection_cards_language_check
  check (language in ('PT', 'EN', 'JP', 'ES', 'FR', 'DE', 'IT', 'KO', 'ZH', 'OUTRO'));

-- Versão da carta: normal, foil (holo), reverse, 1ª edição, promo…
alter table public.collection_cards add column if not exists variant text check (char_length(variant) <= 30);

-- Preço (R$, por unidade) no dia em que a carta entrou na coleção: base para "valiam ao entrar".
alter table public.collection_cards add column if not exists added_brl numeric(12, 2) check (added_brl >= 0);

comment on column public.collection_cards.language is 'Idioma da carta (PT, EN, JP...).';
comment on column public.collection_cards.variant is 'Versão: Normal, Foil, Reverse, 1ª edição, Promo...';
comment on column public.collection_cards.added_brl is 'Preço de mercado (R$, por unidade) quando a carta entrou na coleção.';

-- Cartas antigas: usa o primeiro preço gravado no histórico a partir do dia em que entraram.
update public.collection_cards c
set added_brl = (
  select h.brl from public.card_price_history h
  where h.card_id = c.card_id and h.day >= (c.created_at at time zone 'America/Sao_Paulo')::date and h.brl is not null
  order by h.day limit 1
)
where c.added_brl is null;
