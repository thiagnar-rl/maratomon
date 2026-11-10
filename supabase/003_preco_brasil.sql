-- Maratomon TCG 003: valor de mercado no Brasil (R$) informado por carta da coleção.
-- Quando preenchido, o dashboard usa este valor no lugar da conversão de TCGplayer/Cardmarket.
alter table public.collection_cards
  add column if not exists market_brl numeric(12, 2) check (market_brl >= 0);

comment on column public.collection_cards.market_brl is 'Preço de mercado no Brasil (R$), por unidade, conferido pelo dono (ex.: Liga Pokémon).';
