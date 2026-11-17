import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/legal-document";
import {
  CONTROLLER_NAME,
  LEGAL_VERSION,
  LEGAL_VERSION_LABEL,
  MINIMUM_AGE,
  PRIVACY_EMAIL,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de Privacidade | Enturma",
  description:
    "Como o Enturma trata dados pessoais, com quem compartilha, por quanto tempo guarda e como você exerce seus direitos pela LGPD.",
  robots: { index: false, follow: false },
};

const mail = `mailto:${PRIVACY_EMAIL}?subject=${encodeURIComponent("LGPD - solicitação do titular")}`;

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Política de Privacidade"
      summary="Esta política explica quais dados pessoais o Enturma trata, para quê, com qual base legal, com quem compartilha, por quanto tempo guarda e como você exerce os seus direitos previstos na Lei Geral de Proteção de Dados (Lei 13.709/2018)."
      updatedAt={`${LEGAL_VERSION_LABEL} (versão ${LEGAL_VERSION})`}
    >
      <section>
        <h2>1. Quem trata os seus dados</h2>
        <p>
          O controlador dos dados pessoais tratados no Enturma é{" "}
          <strong>{CONTROLLER_NAME}</strong>, responsável pelo projeto. Esta
          política vale para o site, o aplicativo Desktop e o aplicativo
          Android oficiais.
        </p>
        <p>
          O encarregado pelo tratamento de dados pessoais (DPO) é{" "}
          {CONTROLLER_NAME}, pelo e-mail{" "}
          <a href={mail}>{PRIVACY_EMAIL}</a>. Use esse canal para qualquer
          dúvida, solicitação ou reclamação sobre os seus dados.
        </p>
      </section>

      <section>
        <h2>2. Dados que tratamos</h2>
        <ul>
          <li>
            <strong>Conta:</strong> nome, nome de usuário, e-mail, senha
            protegida por hash, sessões e dispositivos conectados (se é o
            navegador, o app desktop ou o app Android, o navegador e o sistema,
            e quando foi o login e o último acesso).
          </li>
          <li>
            <strong>Vida acadêmica:</strong> instituição, campus, curso, período,
            semestres, matérias, grade de aulas, presenças e faltas que você
            registra, tarefas, provas, metas e sessões de estudo.
          </li>
          <li>
            <strong>Verificação acadêmica:</strong> e-mail institucional e,
            quando você escolhe esse caminho, o comprovante de vínculo enviado.
          </li>
          <li>
            <strong>Comunidade:</strong> publicações, comentários, reações,
            mensagens em salas, fórum, conversas privadas, chamadas, arquivos,
            cadernos, portfólio, conquistas e o que mais você decidir publicar.
          </li>
          <li>
            <strong>Caronas:</strong> pontos de partida e destino, rota,
            veículo, avaliações e, apenas durante uma viagem com a sua
            permissão, a localização ao vivo.
          </li>
          <li>
            <strong>Dados técnicos:</strong> tipo de dispositivo e de
            aplicativo, registros de segurança e de erro, preferências de
            aparência, acessibilidade e notificações.
          </li>
        </ul>
        <p>
          Não pedimos dados pessoais sensíveis (como saúde, religião ou origem
          racial). Não os inclua em publicações ou comprovantes.
        </p>
      </section>

      <section>
        <h2>3. Para que usamos e com qual base legal</h2>
        <div className="legal-table-wrap">
          <table className="legal-table">
            <thead>
              <tr>
                <th scope="col">Finalidade</th>
                <th scope="col">Base legal (LGPD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Criar e manter a conta, sincronizar Web, Desktop e Android, entregar os recursos que você usa</td>
                <td>Execução do contrato (art. 7º, V)</td>
              </tr>
              <tr>
                <td>Verificar o vínculo acadêmico e manter a comunidade restrita a estudantes</td>
                <td>Execução do contrato (art. 7º, V) e legítimo interesse (art. 7º, IX)</td>
              </tr>
              <tr>
                <td>Localização ao vivo nas caronas, microfone, câmera e notificações no aparelho</td>
                <td>Consentimento (art. 7º, I), dado pela permissão do sistema e revogável a qualquer momento</td>
              </tr>
              <tr>
                <td>Recursos de inteligência artificial que você aciona</td>
                <td>Execução do contrato (art. 7º, V)</td>
              </tr>
              <tr>
                <td>Segurança, prevenção de fraude e abuso, moderação e limites de uso</td>
                <td>Legítimo interesse (art. 7º, IX) e garantia da prevenção à fraude e da segurança do titular (art. 11, II, g, quando aplicável)</td>
              </tr>
              <tr>
                <td>Guardar registros de acesso quando a lei exigir</td>
                <td>Cumprimento de obrigação legal ou regulatória (art. 7º, II)</td>
              </tr>
              <tr>
                <td>Defender direitos em processos e responder autoridades</td>
                <td>Exercício regular de direitos (art. 7º, VI)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          O Enturma não vende dados pessoais, não exibe publicidade
          comportamental e não usa os seus dados para criar perfis de anúncios.
        </p>
      </section>

      <section>
        <h2>4. O que fica visível para outras pessoas</h2>
        <p>
          Publicações e comentários públicos da comunidade podem ser lidos por
          visitantes do site, com o nome e o nome de usuário de quem publicou.
          A descoberta de salas mostra título, matéria, imagens da sala e
          quantidade de participantes; não mostra participantes, convites,
          mensagens, materiais ou perfis completos. Contas privadas e
          configurações de perfil controlam o restante.
        </p>
      </section>

      <section>
        <h2>5. Conversas privadas</h2>
        <p>
          As conversas privadas são cifradas no seu dispositivo. Para que você
          possa abri-las em outros aparelhos, inclusive depois de recuperar a
          senha, o serviço guarda uma cópia cifrada da identidade das conversas
          protegida por uma chave da API. Por isso esse modelo{" "}
          <strong>não é criptografia ponta a ponta inacessível ao servidor</strong>.
          Mensagens de salas e chamadas são protegidas no transporte (HTTPS/WSS),
          sem cifragem ponta a ponta. A IA não recebe conversas privadas entre
          amigos.
        </p>
      </section>

      <section>
        <h2>6. Localização e caronas</h2>
        <p>
          A localização só é usada com a sua permissão. A posição ao vivo é
          compartilhada apenas com os participantes da viagem, nos estados
          autorizados, e é apagada automaticamente em até 15 minutos sem
          atualização. A localização exata nunca aparece na descoberta pública
          de caronas.
        </p>
        <p>
          Para buscar endereços e calcular rotas, o endereço digitado ou as
          coordenadas do trajeto são enviados a serviços de mapas: OpenStreetMap
          (mapas e Nominatim), OSRM (rotas) e Esri ArcGIS (busca de endereços).
        </p>
      </section>

      <section>
        <h2>7. Inteligência artificial</h2>
        <p>
          Quando você usa um recurso de IA (tutor, cadernos, revisão de
          estudos), o conteúdo necessário para responder é enviado ao provedor
          configurado, hoje a OpenAI. Os materiais respeitam as permissões do
          recurso que originou o pedido. Não envie à IA senhas, documentos
          sigilosos ou dados pessoais de outras pessoas.
        </p>
      </section>

      <section>
        <h2>8. Verificação acadêmica</h2>
        <p>
          Novas contas confirmam um e-mail acadêmico autorizado ou enviam um
          comprovante para análise. A confirmação do e-mail prova o controle do
          endereço, não uma matrícula ativa. Comprovantes ficam em
          armazenamento privado, acessível apenas à equipe responsável, e são
          apagados após a decisão ou em até 14 dias. A decisão, o método, a
          instituição e o registro de auditoria são mantidos para controle de
          acesso.
        </p>
      </section>

      <section>
        <h2>9. Com quem compartilhamos e transferência internacional</h2>
        <p>
          Os dados são tratados por operadores contratados apenas para operar
          o serviço, cada um recebendo o mínimo necessário:
        </p>
        <ul>
          <li><strong>Vercel</strong> — hospedagem do site e do app web;</li>
          <li><strong>Square Cloud</strong> — hospedagem da API;</li>
          <li><strong>Railway</strong> — banco de dados e downloads dos aplicativos;</li>
          <li><strong>Cloudflare R2</strong> — armazenamento de fotos e vídeos do Social;</li>
          <li><strong>LiveKit</strong> — chamadas de voz e vídeo;</li>
          <li><strong>OpenAI</strong> — recursos de inteligência artificial;</li>
          <li><strong>Google Firebase</strong> — notificações no Android;</li>
          <li><strong>KLIPY</strong> — busca de GIFs e figurinhas;</li>
          <li><strong>OpenStreetMap, OSRM e Esri ArcGIS</strong> — mapas, endereços e rotas;</li>
          <li><strong>Provedor de e-mail (SMTP)</strong> — mensagens de confirmação e recuperação de conta.</li>
        </ul>
        <p>
          Vários desses fornecedores mantêm servidores fora do Brasil,
          principalmente nos Estados Unidos e na Europa. Essas transferências
          internacionais são feitas para executar o serviço que você contratou
          (art. 33, IX) e com fornecedores que adotam cláusulas contratuais e
          medidas de segurança próprias. Também podemos compartilhar dados
          quando a lei ou uma autoridade competente exigir.
        </p>
      </section>

      <section>
        <h2>10. Cookies e armazenamento no aparelho</h2>
        <p>
          Usamos apenas cookies e armazenamento local necessários ao
          funcionamento: cookies de sessão protegidos (HttpOnly, Secure e
          SameSite), preferências de tema, acessibilidade, idioma,
          notificações e estados de tela. Não usamos cookies de publicidade,
          de rastreamento entre sites ou ferramentas de analytics de
          terceiros.
        </p>
      </section>

      <section>
        <h2>11. Por quanto tempo guardamos</h2>
        <div className="legal-table-wrap">
          <table className="legal-table">
            <thead>
              <tr>
                <th scope="col">Dado</th>
                <th scope="col">Prazo</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Conta e conteúdos</td><td>Enquanto a conta existir; depois da exclusão, são apagados ou anonimizados</td></tr>
              <tr><td>Sessões encerradas ou expiradas</td><td>30 dias</td></tr>
              <tr><td>E-mails de confirmação e recuperação</td><td>30 dias após o envio</td></tr>
              <tr><td>Notificações</td><td>180 dias após lidas; 1 ano no máximo</td></tr>
              <tr><td>Localização ao vivo da carona</td><td>Até 15 minutos sem atualização</td></tr>
              <tr><td>Comprovante de verificação acadêmica</td><td>Até a decisão ou 14 dias</td></tr>
              <tr><td>Contadores antiabuso</td><td>1 dia após expirarem</td></tr>
              <tr><td>Registros técnicos de acesso e de erro nos provedores de hospedagem</td><td>Conforme a retenção de cada provedor, sem conteúdo de mensagens, senhas ou tokens</td></tr>
              <tr><td>Registro de aceite destes termos</td><td>Mantido após a exclusão, sem identificação, para comprovar o consentimento</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          Cópias de segurança seguem o próprio ciclo de retenção do provedor e
          não são usadas para recuperar dados que você excluiu.
        </p>
      </section>

      <section>
        <h2>12. Seus direitos</h2>
        <p>Pela LGPD (art. 18), você pode, a qualquer momento:</p>
        <ul>
          <li>confirmar se tratamos seus dados e acessá-los;</li>
          <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
          <li>pedir anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
          <li>receber uma cópia dos seus dados (portabilidade);</li>
          <li>eliminar os dados tratados com consentimento;</li>
          <li>saber com quem compartilhamos seus dados;</li>
          <li>saber que pode não consentir e quais as consequências;</li>
          <li>revogar o consentimento;</li>
          <li>se opor a um tratamento feito sem consentimento, quando houver descumprimento da lei;</li>
          <li>pedir revisão de decisões automatizadas (art. 20).</li>
        </ul>
        <p>
          <strong>Como exercer:</strong> em <Link href="/settings#privacidade">Configurações › Privacidade</Link>{" "}
          você exporta todos os seus dados em JSON, corrige o perfil, revoga
          sessões e exclui a conta (na hora ou em 5 dias). Permissões de
          localização, microfone, câmera e notificações são revogadas nas
          configurações do aparelho ou do navegador. Para qualquer outro
          pedido, escreva para <a href={mail}>{PRIVACY_EMAIL}</a>: respondemos
          em até 15 dias. Você também pode reclamar à Autoridade Nacional de
          Proteção de Dados (ANPD) em{" "}
          <Link href="https://www.gov.br/anpd">gov.br/anpd</Link>.
        </p>
      </section>

      <section>
        <h2>13. Decisões automatizadas</h2>
        <p>
          Filtros automáticos ajudam a identificar spam e conteúdo que viola as
          regras, e a IA pode sugerir revisões. Penalidades em contas passam por
          revisão humana e podem ser contestadas pelo recurso disponível no
          aviso ou pelo e-mail do encarregado.
        </p>
      </section>

      <section>
        <h2>14. Idade mínima</h2>
        <p>
          O Enturma é voltado a estudantes do ensino superior e exige{" "}
          {MINIMUM_AGE} anos ou mais. Ao criar a conta você declara ter essa
          idade. Se soubermos que uma conta pertence a uma pessoa menor de{" "}
          {MINIMUM_AGE} anos, ela será encerrada e os dados excluídos. Responsáveis
          podem nos avisar pelo e-mail do encarregado.
        </p>
      </section>

      <section>
        <h2>15. Segurança e incidentes</h2>
        <p>
          Usamos senhas com hash, tokens de sessão com hash e rotação, cookies
          protegidos, HTTPS em todo o tráfego, autorização por recurso,
          limites de uso, registros de auditoria e varredura de segredos no
          código. Nenhum sistema é imune a falhas. Se ocorrer um incidente de
          segurança que possa causar risco ou dano relevante, comunicaremos a
          ANPD e as pessoas afetadas nos prazos da regulamentação. Para relatar
          uma vulnerabilidade, escreva para <a href={mail}>{PRIVACY_EMAIL}</a>{" "}
          sem expor dados de terceiros publicamente.
        </p>
      </section>

      <section>
        <h2>16. Alterações desta política</h2>
        <p>
          Quando esta política ou os <Link href="/termos">Termos de Uso</Link>{" "}
          mudarem, a data e a versão acima serão atualizadas e você será
          avisado no aplicativo. O aceite de cada versão fica registrado e pode
          ser consultado em Configurações › Privacidade.
        </p>
      </section>
    </LegalDocument>
  );
}
