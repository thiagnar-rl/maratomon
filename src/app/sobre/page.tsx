import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { catalog } from "@/lib/catalog";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = { title: "Sobre o projeto" };

export default function AboutPage() {
  return (
    <ProsePage title="Sobre o Maratomon">
      <p>
        O Maratomon é um guia feito por fã para quem quer assistir (ou reassistir) o anime inteiro, dublado, na ordem
        certa. Você marca o que já viu, acompanha seu progresso e encontra onde assistir em fontes oficiais.
      </p>

      <h2>Como a lista foi montada</h2>
      <ul>
        <li>
          {catalog.totalEpisodes.toLocaleString("pt-BR")} episódios em {catalog.seasons.length} temporadas, na ordem de
          lançamento ocidental, que é a mesma da dublagem brasileira.
        </li>
        <li>Só entram episódios lançados com dublagem brasileira. Episódios banidos ou nunca dublados ficam de fora.</li>
        <li>
          Título em português quando existe título oficial brasileiro publicado. Nos demais, mostramos o título oficial
          em inglês até a versão brasileira ser confirmada.
        </li>
        <li>Filmes e especiais ainda não estão no catálogo.</li>
      </ul>

      <h2>De onde vêm os vídeos</h2>
      <p>
        Não hospedamos nenhum vídeo. Quando existe um episódio oficial e gratuito, ele é incorporado do canal oficial
        Pokémon TV no YouTube, com o player do próprio YouTube. Para o resto, indicamos os serviços oficiais onde a
        temporada está disponível.
      </p>

      <h2>Aviso</h2>
      <p>{siteConfig.disclaimer}</p>
      <p>
        Encontrou um erro ou é titular de direitos e quer que algo seja ajustado? Escreva para{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
      </p>
    </ProsePage>
  );
}
