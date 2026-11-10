import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = { title: "Política de privacidade" };

/* Modelo inicial alinhado à LGPD (Lei 13.709/2018). Revise com um(a) profissional antes de monetizar. */
export default function PrivacyPage() {
  return (
    <ProsePage title="Política de privacidade" updated="10/11/2026">
      <p>Coletamos o mínimo necessário para o site funcionar, e nada é vendido para terceiros.</p>

      <h2>Dados que tratamos</h2>
      <ul>
        <li><strong>Sem conta:</strong> seu progresso fica só no seu navegador (armazenamento local). Não recebemos esses dados.</li>
        <li><strong>Com conta:</strong> seu e-mail, o que você marcou como assistido ou jogado e sua coleção (decks, pastas, cartas, preço pago).</li>
        <li><strong>Fotos e vídeos:</strong> os arquivos que você envia para a sua coleção ficam em armazenamento privado. Só você acessa, por links temporários. Você pode apagá-los quando quiser.</li>
        <li><strong>Vídeos:</strong> o player do YouTube só é carregado quando você clica para assistir. A partir daí, o Google pode tratar dados conforme a política dele.</li>
      </ul>

      <h2>Para que usamos</h2>
      <p>Para entrar na sua conta e sincronizar seu progresso entre aparelhos (base legal: execução do serviço que você pediu).</p>

      <h2>Onde ficam</h2>
      <p>Em provedores de infraestrutura (Supabase para banco e login, Vercel para hospedagem), que podem armazenar dados fora do Brasil com salvaguardas contratuais.</p>

      <h2>Seus direitos</h2>
      <p>
        Você pode pedir acesso, correção, portabilidade ou exclusão dos seus dados, e revogar o consentimento, escrevendo
        para <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>. Respondemos em até 15 dias.
      </p>

      <h2>Cookies</h2>
      <p>Usamos apenas armazenamento essencial (sessão de login e progresso). Se no futuro usarmos análise de audiência ou anúncios, pediremos seu consentimento antes.</p>

      <h2>Crianças</h2>
      <p>Para criar conta é preciso ter 18 anos ou mais, ou consentimento de um responsável legal. Sem conta, o site pode ser usado livremente.</p>
    </ProsePage>
  );
}
