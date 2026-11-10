# Checklist legal do Maratomon TCG

> Isto não é aconselhamento jurídico. Antes de ganhar dinheiro com o site, converse com um(a) advogado(a) de propriedade intelectual.

## Decisão do dono do projeto (10/11/2026)

O site usa **imagens oficiais de Pokémon e de cartas** (via PokeAPI e TCGdex) por escolha do dono do projeto, que assumiu esse risco. Elas são obras protegidas da The Pokémon Company, Nintendo, Game Freak e Creatures. Na prática:

- Sites de fãs **sem fins lucrativos** costumam ser tolerados, mas a empresa pode pedir a remoção a qualquer momento.
- **Monetizar** (anúncios, assinatura, venda) usando essas imagens e o nome Pokémon aumenta muito o risco de notificação, bloqueio de conta em redes de anúncio ou processo.
- Onde as imagens entram no código: `src/lib/pokemon.ts` (artes da PokeAPI) e `src/lib/tcg/prices.ts` (cartas da TCGdex). Trocar essas duas funções troca todas as imagens do site.

## O que o projeto continua fazendo

- **Não hospeda episódios, filmes nem jogos.** Vídeos só pelo player oficial do YouTube. Filmes apontam para o JustWatch e serviços oficiais.
- **Sem ROMs.** A página de jogos lista emuladores legais (mGBA, SameBoy, RetroArch, Delta), leitores para copiar os próprios cartuchos e onde jogar oficialmente (Nintendo Switch Online). Não adicione links de download de ROMs: é pirataria e derruba o site rápido.
- **Preços** vêm da TCGdex, que repassa os preços públicos do TCGplayer e do Cardmarket. Nada de raspagem de lojas.
- **Aviso de não afiliação** no rodapé de todas as páginas.
- **LGPD:** progresso sem conta fica só no navegador; com conta, guardamos e-mail, progresso e coleção. Fotos e vídeos ficam em armazenamento **privado** (só o dono acessa, por links temporários). Política de privacidade publicada.

## Marca "Maratomon TCG" e a loja física

- O nome **não usa** a marca "Pokémon", o que ajuda, mas **não protege sozinho**: o risco jurídico vem das imagens e do uso da marca Pokémon no conteúdo, não do nome do site.
- **Registre a marca no INPI** antes de abrir a loja: faça a busca de anterioridade em busca.inpi.gov.br e registre "Maratomon TCG" nas classes **28** (jogos e cartas), **35** (comércio varejista) e **41** (eventos e torneios).
- **Revender produtos oficiais é legal.** No Brasil, o Pokémon TCG é distribuído pela **Copag**: compre de distribuidores autorizados e guarde as notas.
- **Na fachada, nas redes e nos anúncios da loja**, não use logos, personagens ou o nome Pokémon como se fossem seus. Para mostrar os produtos, use fotos dos produtos que você vende.
- **Torneios oficiais:** lojas podem se cadastrar no programa **Play! Pokémon** para sediar eventos oficiais. É um caminho legítimo para atrair público e usar o material de divulgação autorizado.

## Antes de monetizar

1. Troque as imagens oficiais por arte própria ou licenciada (ou aceite conscientemente o risco).
2. Tire "Pokémon" de nomes de domínio, marca e perfis.
3. Coloque um banner de consentimento de cookies antes de qualquer anúncio ou análise de audiência.
4. Peça revisão jurídica dos Termos e da Privacidade.
5. Prefira monetizar recursos próprios (estatísticas da coleção, exportações, temas) a anúncios em volta de conteúdo de terceiros.

## Pendências

- [ ] Preencher e-mail de contato real (`NEXT_PUBLIC_CONTACT_EMAIL`).
- [ ] Ativar 2FA na Vercel e no GitHub.
- [ ] Confirmar a dublagem brasileira do episódio 18 da temporada 1.
- [ ] Revisar `data/source/providers.json` e `src/data/movies.ts` periodicamente: catálogos de streaming mudam.
- [ ] Configurar SMTP próprio no Supabase (o gratuito manda poucos e-mails por hora).
