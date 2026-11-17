# Histórico de alterações — Forja Arcana (antigo Maratomon TCG)

Todas as mudanças do site, da mais nova para a mais antiga. Cada item corresponde a um ou mais commits no GitHub.
Site publicado: https://forja-arcana.vercel.app

---

## 17/11/2026

### Anime dublado dentro do site (sem ir para o YouTube)
- O usuário não quer que ninguém saia do site: **removido o botão "Assistir dublado no app do YouTube"** (entrada logo abaixo).
- **Novo player** (`src/components/youtube-dub-player.tsx`): usa a API do player do YouTube e, nos vídeos com várias dublagens, **procura a faixa de áudio em português e troca sozinho**, no celular e no computador; quando consegue, desliga a legenda automática e mostra o selo "🇧🇷 Dublado" no canto do vídeo. Tenta por ~6 s (as faixas aparecem depois que o vídeo começa) e confirma de novo quando o vídeo volta a tocar.
- Importante: a troca de faixa usa funções internas do player do YouTube (não documentadas). Se o YouTube não permitir em algum aparelho, o vídeo toca normalmente e aparece o aviso "Ficou em inglês?" — no computador com o caminho ⚙ › Faixa de áudio › Português; no celular, a orientação de recarregar ou usar o computador. Nenhum link manda para o YouTube.
- Arquivos: `src/components/youtube-dub-player.tsx` (novo), `src/components/watch-panel.tsx`.

### Anime no celular: opção de assistir dublado (substituído pela entrada acima)
- **Problema:** no celular, os episódios do canal oficial Pokémon TV tocavam em inglês (às vezes com legenda), sem opção de trocar para português. Esses vídeos têm várias dublagens, mas o YouTube não deixa sites escolherem a faixa de áudio, e o player embutido no celular não mostra o menu "Faixa de áudio" (só no computador).
- **Correção:** em celular e tablet (tela de toque), nos episódios com várias dublagens, aparece o aviso "Está em inglês ou legendado?" com o botão **Assistir dublado no app do YouTube**. O app do YouTube toca o mesmo vídeo oficial em português (ou pelo menu ⚙ › Faixa de áudio › Português). No computador continua a dica de trocar pela engrenagem do próprio player.
- Observação: este botão abre fora do site só nesse caso (vídeo com várias dublagens, no celular), porque é o único jeito de ouvir dublado ali.
- Arquivo: `src/components/watch-panel.tsx`.

### Painel do mercado: cada marketplace na própria moeda
- **Problema:** o painel convertia os preços dos EUA (dólar) e da Europa (euro) para real pela cotação, sem frete nem impostos de importação — a comparação com o preço do Brasil ficava distorcida.
- **Agora:** sem conversão. Botões **Brasil R$ · EUA US$ · Europa €** escolhem o marketplace do gráfico, e cada um aparece na sua moeda: Brasil (MYP Cards) em real, TCGplayer em dólar e Cardmarket em euro. A tabela mostra as três colunas lado a lado, cada uma na sua moeda; clicar no título da coluna troca o gráfico e ordena por ela. A coluna de variação passou a se chamar "Europa 30 dias" (é a do Cardmarket).
- Removido o seletor antigo R$/US$/€ que convertia tudo.
- O painel aparece na guia TCG e na página Mercado (mesmo componente), então as duas mudaram juntas. Nenhuma outra guia foi alterada.
- Arquivos: `src/components/tcg/market-dashboard.tsx`, `src/components/tcg/market-live.tsx`.

### Correção: "Mais valiosas" abria em Cards em Alta/Queda
- **Problema:** o link "Mais valiosas" (e "Câmbio do dia") do menu Mercado levava ao topo da página, onde ficam os Cards em Alta/Queda. Como o painel do mercado carrega em segundo plano, a seção pedida ainda não existia quando a página abria, e o navegador não rolava até ela.
- **Correção:** quando o painel termina de carregar, a página rola sozinha até a seção do link (`#valiosas`, `#painel`, `#cambio`, `#altas`, `#baixas`). Também funciona clicando de novo no menu com a página já aberta.
- Arquivo: `src/components/tcg/market-live.tsx` (`useScrollToHash`).

### Cards mais caros do Brasil (todas as coleções) e Brasil no painel do mercado
- **Problema:** "Cards mais caros do dia" só considerava as cartas acompanhadas pelo site (coleções recentes + clássicos), então faltavam cartas caras de verdade, como o **Mew R/RGB** (30th Celebration, R$ 13.000 no Brasil).
- **Varredura dos marketplaces brasileiros:** o MYP Cards tem uma lista pública de Pokémon que pode ser ordenada do mais caro para o mais barato (`/pokemon?sort=-preco`, permitida no robots.txt). A Liga Pokémon continua bloqueando acesso automático (verificação anti-robô) e sem API, por isso não é lida.
- **Novo ranking "Cards mais caros do dia":** os cards mais caros **à venda no Brasil agora**, de qualquer coleção (as 3 primeiras páginas do MYP, ~120 cartas), com:
  - filtros **Sem graduadas** (ligado por padrão) e **Só português e inglês**;
  - etiquetas **Graduada** e **Outro idioma**, unidades à venda e o preço internacional quando a carta está no catálogo;
  - botão "Ver mais"; a carta abre a página dela no site (ou a oferta no MYP Cards quando não está no catálogo).
- As cartas desse ranking que existem no catálogo entram também no mercado (Cards em Alta/Queda e filtros).
- **Painel do mercado:** nova barra e coluna **Brasil (MYP Cards)** ao lado de TCGplayer e Cardmarket; a ordenação por valor usa o preço do Brasil.
- **Correção junto:** ao publicar, a leitura do MYP Cards falhou durante a montagem do site e o mercado ficou guardado **sem preços do Brasil** por 15 minutos. Agora:
  - leituras do MYP Cards só são guardadas quando dão certo (falhou → a próxima visita tenta de novo);
  - se o MYP não responder, o mercado não é guardado assim; o site mostra o mercado internacional (cache de 5 min) até o Brasil voltar;
  - as páginas do TCG e do Mercado são montadas na hora (o cálculo pesado continua em cache de 15 min, entregando o último resultado enquanto atualiza).
- Arquivos: `src/lib/tcg/mypcards.ts` (`mypTopExpensive`, `linkToCatalog`), `src/lib/tcg/market.ts` (`top`), `src/components/tcg/br-top-cards.tsx` (novo), `src/components/tcg/market-live.tsx`, `src/components/tcg/market-dashboard.tsx`, `src/app/api/tcg/mercado/route.ts`.

### Novo endereço: forja-arcana.vercel.app
- O site passou a ser **https://forja-arcana.vercel.app** (domínio adicionado no projeto da Vercel, ligado à produção).
- O endereço antigo **maratomon.vercel.app redireciona** para o novo (redirecionamento permanente 308), então links já compartilhados continuam funcionando.
- No código, o endereço oficial (`PRODUCTION_URL` em `src/lib/site.ts`) é usado no ar para o mapa do site, o robots e as imagens de compartilhamento; identificação do site nas leituras de notícias e do MYP Cards atualizada.
- **Supabase (login):** Site URL trocado para o endereço novo e `https://forja-arcana.vercel.app/**` adicionado às URLs de redirecionamento, para os links de senha e de conta voltarem ao endereço certo.
- O nome do projeto na Vercel e o repositório no GitHub continuam "maratomon" (não aparecem para quem usa o site).

### Correção: guia TCG não abria (demorava ~16 s)
- **Problema:** a página do TCG (e a do Mercado) recalculava o mercado inteiro a cada visita — mais de 300 cartas, câmbio, histórico e as páginas do MYP Cards —, levando cerca de 16 segundos. No celular, parecia que o link não abria. A causa: a gravação do histórico de preços usava `cache: "no-store"`, o que fazia a página deixar de sair do cache.
- **Correção:**
  - o mercado agora é calculado **uma vez a cada 15 minutos** e guardado em cache (`unstable_cache`); as visitas recebem o resultado pronto;
  - a gravação do histórico não usa mais `no-store`;
  - a página abre na hora e o painel do mercado carrega logo em seguida, com um esqueleto animado no lugar (`<Suspense>`);
  - novo `src/app/tcg/loading.tsx`: ao clicar em qualquer página do TCG aparece um carregamento imediato.
- Arquivos: `src/lib/tcg/market.ts`, `src/lib/tcg/history.ts`, `src/components/tcg/market-section.tsx` (novo), `src/app/tcg/page.tsx`, `src/app/tcg/mercado/page.tsx`, `src/app/tcg/loading.tsx` (novo).

### Logo do site: monograma da Forja Arcana
- **Correção da marca:** os logos base são o **monograma** (o "A" com a carta da runa no hexágono), o **escudo**, o **minimalista** e o **minimalista escuro**. O site usa **o monograma**.
- **Trocado o selo do martelo pelo monograma** no cabeçalho, ícone da aba, ícone do celular, imagem de compartilhamento e em todo lugar onde o selo aparecia (home, notícias, entrar, conta, convite de conta, cartas sem imagem).
- **Arquivos em `public/brand/`:** `forja-arcana-monograma.png`, `-escudo.png`, `-minimalista.png`, `-minimalista-escuro.png` e `forja-arcana-simbolo.png` (hexágono recortado, fundo transparente). Saíram os arquivos do selo do martelo (`-logo`, `-logo-transparente`, `-horizontal`, `-icone`, `-selo`).

### Nova marca: Forja Arcana
- **Nome do site:** "Maratomon TCG" passa a ser **Forja Arcana** em todo o site (títulos das páginas, cabeçalho, conta, termos, sobre, mercado — "Índice Forja" —, lista de compras, histórico de preços e README).
- **Logo:** o selo da carta com a runa sendo forjada pelo martelo, com a faixa "TCG · NERD". No cabeçalho: selo + "FORJA ARCANA" em serifa (fonte Noto Serif), nas cores do logo (roxo e dourado; no tema escuro, creme e dourado). Faixa do topo em roxo → laranja → dourado.
- **Ícones:** ícone da aba (`src/app/icon.png`, o círculo do selo), ícone do iPhone/atalho (`src/app/apple-icon.png`) e imagem de compartilhamento (`src/app/opengraph-image.png`, o logo horizontal). O `icon.svg` antigo foi removido.
- **Mascote:** o fantasminha foi substituído pelo selo em todos os lugares (home, notícias, entrar, conta, convite de conta e cartas sem imagem). Removido `src/components/mascot.tsx`; novo `src/components/brand-mark.tsx`.
- **Arquivos da marca** em `public/brand/`: `forja-arcana-logo.png`, `-logo-transparente.png`, `-horizontal.png`, `-icone.png`, `-selo.png` (selo recortado, fundo transparente) e `-simbolo.png` (círculo). Os SVGs do Maratomon foram removidos.
- **Mantido de propósito:** o endereço `maratomon.vercel.app`, o repositório `thiagnar-rl/maratomon` e as chaves internas de progresso salvas no navegador (para ninguém perder o que já assistiu).

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
- Houve uma rota temporária de diagnóstico (`/api/tcg/br-teste`) para confirmar que o servidor lê o MYP Cards e conferir a leitura; já foi removida.
- Ajustes: leitura do preço médio e do número de ofertas mais robusta (entidades HTML); o "maior" do Brasil só aparece quando as ofertas visíveis passam da média (a página do MYP mostra só as primeiras ofertas).

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
