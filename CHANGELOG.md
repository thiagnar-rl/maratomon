# Histórico de alterações — Maratomon TCG

Todas as mudanças do site, da mais nova para a mais antiga. Cada item corresponde a um ou mais commits no GitHub.
Site publicado: https://maratomon.vercel.app

---

## 17/11/2026

### Preços do Brasil (MYP Cards) no site todo
- **Varredura dos marketplaces brasileiros:**
  - **MYP Cards** (maior marketplace de card games do Brasil): as páginas públicas de edições e de produto podem ser lidas (permitidas no robots.txt) → **integrado**.
  - **Liga Pokémon:** bloqueia acesso automático com verificação anti-robô e não tem API pública → não dá para ler; continua só o link para a carta lá.
  - **Mercado Livre, Shopee, Magalu:** vendem cartas misturadas com kits e lotes, sem identificação confiável da carta (coleção e número) → não usados.
- **Preço principal do site** agora é o **menor anúncio no Brasil (MYP Cards)** quando a carta está à venda lá; sem oferta no Brasil, a média internacional (TCGplayer + Cardmarket). Cada preço nas grades mostra a etiqueta **BR** ou **INT**.
- **Página da carta:** destaque "Menor preço no Brasil" com médio, último vendido e internacional; na tabela de marketplaces, nova linha **🇧🇷 Brasil · MYP Cards** (menor / médio / maior oferta), último vendido, mediana de 30 dias e botão "Ver ofertas no MYP Cards".
- Cards em Alta/Queda e mais caros do dia usam o preço do Brasil quando houver.
- **Como funciona:** a carta é achada pela sigla da coleção e o número (ex.: `pokemon_pfl_129/094`). As grades usam 1 leitura por coleção (página da edição, que lista as cartas mais procuradas); a página da carta lê a ficha do produto. Tudo com cache de 6 horas (lista de edições: 24 h). Se o MYP Cards ficar fora do ar ou bloquear, o site volta sozinho para o preço internacional.
- O histórico de preço continua gravando o preço internacional, para o gráfico não misturar fontes.
- Arquivos: `src/lib/tcg/mypcards.ts` (novo), `src/app/api/tcg/prices/route.ts`, `src/lib/tcg/market.ts`, `src/lib/tcg/types.ts` (`BrPrice`, `abbreviation`), `src/app/tcg/cartas/[id]/page.tsx`, `src/components/tcg/marketplace-prices.tsx`, `src/components/tcg/card-tile.tsx`, `src/components/tcg/movers-board.tsx`.
- Houve um teste temporário (`/api/tcg/br-teste`) para confirmar que o servidor consegue ler o MYP Cards; já foi removido.

### Preço com base nos marketplaces (site todo)
- **Antes:** o preço em reais era só o preço de mercado do TCGplayer (EUA) convertido; sem ele, a tendência do Cardmarket.
- **Agora:** o preço do site é a **média dos marketplaces** — preço de mercado do TCGplayer e tendência do Cardmarket, em reais pela cotação do dia. Vale para a página da carta, grades, coleções, busca, Cards em Alta/Queda e mais caros do dia.
- **Nova seção na página da carta:** "Preço de venda nos marketplaces", no formato menor / médio / maior (verde, laranja, vermelho), com a média geral, uma linha por marketplace e versão (Normal, Holo, Reverse) e "Vendas recentes" do Cardmarket (ontem, 7 e 30 dias).
- O "maior anúncio" do TCGplayer só entra quando é até 3× o preço médio (evita valores irreais como US$ 999).
- **Variação de 7 e 30 dias** agora compara a tendência do Cardmarket com as médias de venda (antes usava a média de um único dia, que oscilava demais — ex.: Dawn mostrava −38,7%).
- Raridade da página da carta em português.
- Observação: a Liga Pokémon bloqueia acesso automático e não tem API pública, então os preços dela não podem ser lidos pelo site. No gráfico de histórico, o valor em reais pode dar um salto hoje por causa da mudança de cálculo.
- Arquivos: `src/lib/tcg/prices.ts` (`marketplaceQuote`), `src/components/tcg/marketplace-prices.tsx` (novo), `src/app/tcg/cartas/[id]/page.tsx`, `src/lib/tcg/market.ts`, `src/components/tcg/movers-board.tsx`, `src/components/tcg/priced-card-grid.tsx`.

### Correção: filtro de coleção mostrava poucas coleções
- **Problema:** as cartas clássicas (Charizard da Coleção Básica etc.) ficavam fora do limite de cartas acompanhadas, e o filtro mostrava só 6 coleções.
- **Correção:** os clássicos entram primeiro; o mercado passou a acompanhar as 8 coleções mais recentes (antes 6), com limite de 320 cartas (antes 240).
- O filtro lista todas as coleções acompanhadas, ordenadas pela quantidade de cartas. As que não têm carta na lista atual (ex.: nenhuma subiu no período) aparecem apagadas com 0.
- Observação: o mercado acompanha as cartas mais disputadas, não as 221 coleções inteiras. Para ver qualquer coleção, use **Coleções** no menu.
- Arquivos: `src/lib/tcg/market.ts`, `src/components/tcg/card-filters.tsx`, `src/components/tcg/movers-board.tsx`.

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
