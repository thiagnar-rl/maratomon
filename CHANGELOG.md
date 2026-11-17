# Histórico de alterações — Maratomon TCG

Todas as mudanças do site, da mais nova para a mais antiga. Cada item corresponde a um ou mais commits no GitHub.
Site publicado: https://maratomon.vercel.app

---

## 17/11/2026

### TCG: variação em reais nos Cards em Alta e em Queda
- Cada card mostra, além da porcentagem, quanto subiu ou caiu em reais (ex.: ▲ 49,5% · +R$ 38).
- Na grade, o valor em reais aparece embaixo do preço.
- O resumo mostra quanto os 50 cards subiram ou caíram somados no período ("+R$ 758 na semana").
- Arquivos: `src/lib/tcg/prices.ts` (`priceDelta`, `formatDelta`), `src/components/tcg/movers-board.tsx`, `src/components/tcg/card-tile.tsx`.

### TCG: filtro por coleção
- Nova seção **Coleção** nos filtros, com quantidade de cartas e busca quando há mais de 8 coleções.
- Combina com os outros filtros; não aparece dentro da página de uma única coleção.
- Arquivos: `src/components/tcg/card-filters.tsx`, `src/lib/tcg/types.ts` (`CardMeta.set`), `src/lib/tcg/prices.ts`.

### TCG: mercado ao vivo no topo da guia
- Removido o banner "Pokémon TCG" (Eevee e Umbreon com a busca). A busca continua no menu **Cartas**.
- A guia TCG abre com: Cards em Alta/Queda → Painel do mercado (dólar, euro, Índice Maratomon, cartas subindo/caindo hoje, gráfico TCGplayer × Cardmarket) → Cards mais caros do dia (top 12).
- Tudo se atualiza sozinho a cada 5 minutos e quando a aba volta a ficar visível.
- A página `/tcg/mercado` mostra o mesmo conteúdo.
- Arquivos: `src/components/tcg/market-live.tsx` (novo), `src/app/tcg/page.tsx`, `src/app/tcg/mercado/page.tsx`.

### Mercado: correções na variação do dia
- A variação do dia passou a usar o preço da carta em dólar/euro (antes misturava a variação do câmbio e todas as cartas apareciam com o mesmo %).
- Variações acima de 75% em um único dia são descartadas (venda isolada ou erro de anúncio).
- Dólar e euro mostram a variação do dia também quando a cotação vem da fonte reserva (Frankfurter).
- Arquivos: `src/lib/tcg/market.ts`, `src/lib/tcg/api.ts`.

### TCG: Cards em Alta e em Queda + filtros no estilo das lojas
- Lista dos 50 cards que mais subiram ou caíram, com período **Dia / Semana / Mês**, lista ou grade, selo "AO VIVO" e botão "Atualizar agora".
- Resumo com três somas: menor anúncio, valor de mercado e preço médio alto.
- Carteira acompanhada ampliada para até 240 cartas (raras das 6 coleções mais recentes + clássicos).
- Filtros na lateral (gaveta no celular): **Raridade** e **Energia** em botões com quantidade e nomes em português, além de Preço, Versão e Ilustrador. Filtros ativos aparecem como etiquetas com ×.
- Nova API `/api/tcg/mercado` para a atualização automática.
- Arquivos: `src/components/tcg/card-filters.tsx` e `movers-board.tsx` (novos), `src/lib/tcg/labels.ts` (novo), `src/lib/tcg/market.ts`, `src/components/tcg/priced-card-grid.tsx`. Removido `multi-select.tsx`.

---

## 11/11/2026

- **Filtros combináveis e ordem de preço:** "Maior → menor" / "Menor → maior" e vários filtros ao mesmo tempo; faixas de preço marcadas em sequência não se perdem.
- **Guias Filmes e Jogos removidas** (`/filmes` e `/jogos` redirecionam).
- **Logo:** volta o mascote original (fantasminha roxo segurando uma carta) com o selo TCG em destaque.
- **Carta:** volta o efeito holográfico ao passar o mouse (o giro 360° foi desfeito).
- **Filtros por raridade, versão, ilustrador e preço** nas cartas.
- **Termômetro Brasil** sem atalhos para a Liga Pokémon.
- **TCG:** subguias (Coleções, Cartas, Mercado, Minha área), preço do dia embaixo de cada carta, página completa da carta com histórico de preços e painel do mercado.
- **Progresso dos episódios** só conta com conta conectada; convite para criar conta.
- **Contas** só com e-mail e senha (perfil, endereços, segurança, excluir conta). Confirmação de e-mail em espera até a compra do domínio.

## 10/11/2026

- **TCG:** imagens das cartas e capas das coleções que faltavam (inclui kits de treinador, promos, energias e TCG Pocket via Scrydex); 3 logos quebrados corrigidos.
- **Home de notícias** com fontes oficiais, nova marca com mascote e episódios assistidos dentro do site.
- **Episódios:** 531 vídeos oficiais (temporadas 1 a 11) tocam no site; títulos em português e dica de áudio dublado.
- **Coleção:** Radar BR, lista de desejos com preço-alvo, lista de compras e valor da coleção em reais.
- **Nome Maratomon TCG** e segunda fonte de cotação.
- **Plataforma de fãs:** visual Pokémon, TCG e coleção.
- Criação do Maratomon: checklist dos episódios dublados; Supabase com publishable key.

---

## Como este arquivo é mantido
Toda alteração no site entra aqui no mesmo commit em que é feita, com data, o que mudou para quem usa o site e os principais arquivos.
