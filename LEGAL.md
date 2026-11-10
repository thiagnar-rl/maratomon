# Checklist legal do Maratomon

> Isto não é aconselhamento jurídico. Antes de ganhar dinheiro com o site, converse com um(a) advogado(a) de propriedade intelectual.

## O que o projeto já faz

- **Não hospeda vídeos.** Só incorpora o player oficial do YouTube (permitido pelos Termos do YouTube) e linka serviços oficiais (Netflix etc.).
- **Só fontes oficiais e dubladas.** O script do YouTube aceita apenas vídeos do canal oficial Pokémon TV. Nada de sites piratas ou reuploads.
- **Identidade visual própria.** Sem logo, sprites, artes ou fontes oficiais. O nome "Maratomon" não usa a marca registrada.
- **Aviso de não afiliação** no rodapé de todas as páginas, na página Sobre e nos Termos.
- **Canal de remoção:** e-mail de contato para titulares de direitos (preencha `NEXT_PUBLIC_CONTACT_EMAIL`).
- **LGPD:** progresso sem conta fica só no navegador; com conta, coletamos só e-mail e episódios marcados; política de privacidade publicada; player do YouTube só carrega depois do clique (`youtube-nocookie`).
- **Dados factuais:** listas e títulos de episódios são informação pública. Não copiamos sinopses ou textos de outros sites.

## Antes de monetizar

A The Pokémon Company e a Nintendo protegem a marca com rigor. Uso comercial de personagens, imagens ou do nome como marca exige licença.

Caminhos de menor risco:

1. **Monetizar o que é seu:** recursos extras do próprio site (temas, estatísticas, listas compartilháveis), feitos com arte original.
2. **Apoio voluntário** (Apoia.se, Pix, Ko-fi), sem vender nada ligado à marca.
3. **Anúncios** só depois de: (a) banner de consentimento de cookies, (b) atualizar a Política de privacidade, (c) revisão jurídica. Algumas redes de anúncios recusam sites de marcas de terceiros.
4. **Afiliados de streaming oficial**, quando o programa permitir.

Evite:

- Vender produtos com personagens, nomes ou logos oficiais.
- Usar "Pokémon" no nome do site, no domínio ou em perfis de redes sociais.
- Anúncios dentro ou em volta do player de vídeo.
- Baixar, cortar ou reenviar episódios.

## Pendências

- [ ] Preencher e-mail de contato real.
- [ ] Revisão jurídica de Termos e Privacidade antes de monetizar.
- [ ] Confirmar a dublagem brasileira do episódio 18 da temporada 1 (marcar em `NOT_DUBBED` em `scripts/build-catalog.ts` se não houver).
- [ ] Revisar periodicamente `data/source/providers.json`: catálogos de streaming mudam.
