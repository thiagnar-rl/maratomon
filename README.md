# Maratomon

Plataforma de fãs de Pokémon:

- **Anime:** checklist dos 1.361 episódios dublados, temporada por temporada, com os Pokémon marcantes de cada uma.
- **Filmes:** todos os longas em ordem, com onde assistir no Brasil.
- **Jogos clássicos:** Game Boy, Color e Advance, onde jogar oficialmente e emuladores legais.
- **TCG:** todas as coleções desde 1999 (TCGdex), preços do TCGplayer e do Cardmarket em reais, painel do mercado, comparador e gráficos.
- **Minha coleção:** decks e pastas com cartas, fotos e vídeos, e o valor atualizado.

🌐 **No ar:** https://maratomon.vercel.app

> Projeto de fãs, independente e não oficial. Sem ligação com Nintendo, Game Freak, Creatures ou The Pokémon Company. O site não hospeda vídeos.

## Tecnologias

| Parte | Ferramenta | Para quê |
| --- | --- | --- |
| Front end | **Next.js 16** (App Router) + **React 19** + **TypeScript** | Páginas estáticas rápidas e boas para SEO (1.361 páginas de episódio geradas no build) |
| Estilo | **Tailwind CSS 4** + fontes Bricolage Grotesque e Plus Jakarta Sans | Visual próprio, tema claro/escuro automático |
| Login e banco | **Supabase** (Postgres + Auth por link mágico) | Progresso na nuvem, com segurança por linha (RLS) |
| Vídeos | **YouTube Data API v3** (script) + player `youtube-nocookie` | Liga cada episódio ao vídeo oficial dublado |
| Cartas e preços | **TCGdex** (sem chave) + **AwesomeAPI** (câmbio) | Catálogo do TCG, preços TCGplayer/Cardmarket e conversão para R$ |
| Gráficos | **Recharts** | Painel do mercado, comparador e dashboard da coleção |
| Arquivos | **Supabase Storage** (bucket privado `colecao`) | Fotos e vídeos dos decks e pastas |
| Hospedagem | **Vercel** | Deploy automático a cada `git push` |

## Rodando no seu computador

Pré-requisito: [Node.js 20 ou mais novo](https://nodejs.org).

```bash
npm install
cp .env.example .env.local   # no Windows: copy .env.example .env.local
npm run dev
```

Abra http://localhost:3000. Sem configurar nada, o site já funciona com o progresso salvo no navegador.

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera o catálogo e o site de produção |
| `npm run catalog` | Recria `src/data/catalog.json` a partir de `data/source/` |
| `npm run sync:youtube` | Busca os vídeos oficiais dublados e liga aos episódios |
| `npm run lint` / `npm run typecheck` / `npm run format` | Qualidade de código |

## Estrutura

```
data/source/          dados editáveis (episódios, onde assistir, links do YouTube)
scripts/              build-catalog.ts e sync-youtube.ts
supabase/schema.sql   tabela de progresso + regras de segurança
src/app/              páginas (rotas do Next.js)
src/components/       componentes de interface
src/lib/              catálogo, Supabase e store de progresso
```

## Supabase (login e progresso na nuvem)

1. Crie um projeto grátis em https://supabase.com.
2. Em **SQL Editor**, cole e rode `supabase/schema.sql` e depois `supabase/002_colecao.sql` (coleção, fotos e vídeos).
3. Em **Authentication › URL Configuration**, coloque o endereço do site em *Site URL* e adicione `http://localhost:3000/**` e `https://SEU-DOMINIO/**` em *Redirect URLs*.
4. Copie a *Project URL* (Project Settings › General) e a *Publishable key* (Project Settings › API Keys) para `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no `.env.local`.

## Vídeos oficiais gratuitos

1. No [Google Cloud Console](https://console.cloud.google.com), crie um projeto, ative a **YouTube Data API v3** e gere uma chave de API.
2. Coloque em `YOUTUBE_API_KEY` no `.env.local`.
3. Rode `npm run sync:youtube` e depois `npm run catalog`.
4. Confira o resultado em `data/source/youtube-links.json` e faça commit.

O script só aceita vídeos publicados pelo canal oficial Pokémon TV, nunca reuploads. Os vídeos desse canal têm várias faixas de áudio, e o site orienta a escolher **Português (Brasil)** no player.

## Publicando na Vercel

1. Entre em https://vercel.com com sua conta do GitHub e importe o repositório `maratomon`.
2. Em *Environment Variables*, adicione as mesmas variáveis do `.env.local`, menos a `YOUTUBE_API_KEY`, e ajuste `NEXT_PUBLIC_SITE_URL` para o domínio final.
3. Clique em **Deploy**. A partir daí, cada `git push` publica uma nova versão.

## Regras do projeto (legal)

Veja [LEGAL.md](LEGAL.md). Resumo: o site usa imagens oficiais por escolha do dono (risco assumido, principalmente se monetizar), não hospeda episódios nem ROMs e segue a LGPD.
