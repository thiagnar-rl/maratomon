import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = { title: "Termos de uso" };

/*
 * Modelo inicial. Antes de monetizar o site, peça para um(a) advogado(a) revisar este texto
 * e a Política de privacidade.
 */
export default function TermsPage() {
  return (
    <ProsePage title="Termos de uso" updated="10/11/2026">
      <p>Ao usar o Maratomon TCG você concorda com estes termos.</p>

      <h2>1. O que é o serviço</h2>
      <p>
        Um guia gratuito e não oficial para acompanhar episódios de anime. {siteConfig.disclaimer}
      </p>

      <h2>2. Conteúdo de terceiros</h2>
      <p>
        Os vídeos exibidos são incorporados de plataformas oficiais (como o YouTube) e seguem os termos dessas
        plataformas. Links externos levam a serviços que não controlamos. A disponibilidade de episódios pode mudar sem
        aviso.
      </p>

      <h2>3. Sua conta</h2>
      <p>
        A conta é opcional e serve para guardar seu progresso. Você é responsável pelo acesso ao seu e-mail e pode pedir
        a exclusão da conta a qualquer momento.
      </p>

      <h2>4. Uso aceitável</h2>
      <p>Não use o site para atividades ilegais, nem tente prejudicar seu funcionamento ou o de outras pessoas.</p>

      <h2>5. Direitos de terceiros</h2>
      <p>
        Respeitamos direitos autorais e de marca. Se você é titular de direitos e acredita que algo aqui viola seus
        direitos, escreva para <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a> e
        removeremos o conteúdo prontamente após análise.
      </p>

      <h2>6. Sem garantias</h2>
      <p>O site é oferecido como está. Fazemos o possível para manter as informações corretas, sem garantia de exatidão.</p>

      <h2>7. Mudanças</h2>
      <p>Podemos atualizar estes termos. A data no topo indica a versão em vigor. Lei aplicável: legislação brasileira.</p>
    </ProsePage>
  );
}
