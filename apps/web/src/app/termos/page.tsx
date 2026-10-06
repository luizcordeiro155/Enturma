import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = {
  title: "Termos de Uso | Enturma",
  description: "Regras para utilização do site e dos aplicativos do Enturma.",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Termos de Uso"
      summary="Estes termos definem as regras básicas para utilizar o Enturma, incluindo conta, comunidade, recursos acadêmicos, inteligência artificial e caronas universitárias."
      updatedAt="06 de outubro de 2026"
    >
      <section>
        <h2>1. Aceitação</h2>
        <p>
          Ao criar uma conta ou utilizar o Enturma, você concorda em usar a
          plataforma de acordo com estes Termos de Uso, com a{" "}
          <Link href="/privacidade">Política de Privacidade</Link> e com a
          legislação aplicável.
        </p>
        <p>
          Se você não concordar com estes termos, não utilize os recursos que
          exigem conta ou tratamento de dados.
        </p>
      </section>

      <section>
        <h2>2. O que é o Enturma</h2>
        <p>
          O Enturma é uma plataforma acadêmica em desenvolvimento ativo para
          organização de estudos, comunidade, salas, comunicação, inteligência
          artificial, portfólio e mobilidade universitária.
        </p>
        <p>
          Recursos podem mudar, ser aprimorados, ficar temporariamente
          indisponíveis ou exigir atualização do aplicativo.
        </p>
      </section>

      <section>
        <h2>3. Conta e segurança</h2>
        <ul>
          <li>forneça informações verdadeiras e mantenha sua conta atualizada;</li>
          <li>não compartilhe senha, token ou sessão com terceiros;</li>
          <li>você é responsável pelas ações realizadas com sua conta enquanto ela estiver sob seu controle;</li>
          <li>avise o projeto se perceber acesso indevido ou vulnerabilidade.</li>
        </ul>
      </section>

      <section>
        <h2>4. Uso aceitável</h2>
        <p>Não é permitido utilizar o Enturma para:</p>
        <ul>
          <li>assediar, ameaçar, discriminar ou perseguir outras pessoas;</li>
          <li>publicar conteúdo ilegal ou violar direitos de terceiros;</li>
          <li>tentar acessar conta, sala, arquivo ou dado sem autorização;</li>
          <li>explorar falhas, automatizar abuso ou prejudicar a disponibilidade do serviço;</li>
          <li>distribuir malware, spam, fraude ou conteúdo enganoso;</li>
          <li>contornar medidas de segurança, moderação ou limitação técnica.</li>
        </ul>
      </section>

      <section>
        <h2>5. Conteúdo enviado por usuários</h2>
        <p>
          Você continua responsável pelo conteúdo que envia ao Enturma e deve
          possuir autorização para compartilhá-lo.
        </p>
        <p>
          Ao publicar ou enviar conteúdo em uma área que precisa armazená-lo,
          você autoriza o Enturma a processar, armazenar e exibir esse conteúdo
          apenas na medida necessária para operar o recurso escolhido.
        </p>
      </section>

      <section>
        <h2>6. Informações acadêmicas</h2>
        <p>
          O Enturma busca utilizar fontes verificadas quando apresenta dados
          acadêmicos como oficiais. Mesmo assim, calendários, grades, horários,
          requisitos e demais informações institucionais podem mudar.
        </p>
        <p>
          Sempre confirme decisões acadêmicas importantes nos canais oficiais
          da sua instituição. O Enturma não representa uma universidade ou
          faculdade salvo quando isso for informado expressamente.
        </p>
      </section>

      <section>
        <h2>7. Enturma IA</h2>
        <p>
          Respostas geradas por inteligência artificial podem conter erros,
          omissões ou interpretações incorretas. Elas servem como apoio ao
          estudo e não substituem professores, fontes oficiais, orientação
          profissional ou avaliação acadêmica.
        </p>
        <p>
          O usuário é responsável por revisar respostas antes de utilizá-las em
          trabalhos, decisões ou atividades avaliativas.
        </p>
      </section>

      <section>
        <h2>8. Enturma Caronas</h2>
        <p>
          O Enturma Caronas facilita o encontro entre estudantes interessados
          em compartilhar deslocamentos. O Enturma não é empresa de transporte,
          não emprega motoristas e não assume a condução do veículo.
        </p>
        <ul>
          <li>motorista e passageiro decidem livremente se desejam realizar a viagem;</li>
          <li>o motorista é responsável pelo veículo, habilitação, condução e cumprimento das leis de trânsito;</li>
          <li>o passageiro deve avaliar com cuidado as informações disponíveis antes do embarque;</li>
          <li>recursos como PIN, reputação, localização e compartilhamento de segurança reduzem riscos, mas não garantem segurança absoluta;</li>
          <li>o Enturma não garante disponibilidade de motorista, horário de chegada, rota ou conclusão de uma viagem;</li>
          <li>o fluxo atual não deve ser interpretado como serviço de transporte remunerado do Enturma.</li>
        </ul>
      </section>

      <section>
        <h2>9. Moderação e medidas de proteção</h2>
        <p>
          O Enturma pode restringir conteúdo, recursos ou contas quando houver
          indícios razoáveis de abuso, risco à segurança, violação destes
          termos ou necessidade técnica de proteção da plataforma e de seus
          usuários.
        </p>
      </section>

      <section>
        <h2>10. Propriedade intelectual</h2>
        <p>
          A marca, interface, código, documentação e materiais originais do
          Enturma permanecem sujeitos aos direitos de seus respectivos
          titulares. O repositório público não concede automaticamente licença
          para copiar, distribuir ou comercializar o projeto.
        </p>
        <p>
          Bibliotecas e componentes de terceiros continuam sujeitos às suas
          próprias licenças.
        </p>
      </section>

      <section>
        <h2>11. Disponibilidade e responsabilidade</h2>
        <p>
          O Enturma está em evolução contínua e pode apresentar indisponibilidade
          temporária, bugs ou limitações. O projeto procura corrigir falhas e
          proteger dados, mas não promete funcionamento ininterrupto.
        </p>
        <p>
          Na medida permitida pela legislação aplicável, o Enturma não se
          responsabiliza por decisões tomadas exclusivamente com base em
          conteúdo de usuários, respostas de IA, dados acadêmicos desatualizados
          ou acordos de carona feitos diretamente entre participantes.
        </p>
      </section>

      <section>
        <h2>12. Encerramento da conta</h2>
        <p>
          Você pode solicitar a exclusão da conta pelos controles disponibilizados
          pelo Enturma. A plataforma também pode restringir ou encerrar acesso
          em casos graves de abuso, fraude, risco de segurança ou violação
          reiterada destes termos.
        </p>
      </section>

      <section>
        <h2>13. Alterações e legislação aplicável</h2>
        <p>
          Estes termos podem ser atualizados conforme o produto evolui. A data
          exibida no início da página indica a versão vigente.
        </p>
        <p>
          Estes termos devem ser interpretados conforme a legislação brasileira
          aplicável, sem afastar direitos que não possam ser limitados por
          contrato.
        </p>
      </section>

      <section>
        <h2>14. Contato</h2>
        <p>
          Dúvidas sobre o projeto ou estes termos podem ser encaminhadas pelo
          canal oficial do Enturma no GitHub:{" "}
          <Link href="https://github.com/luizcordeiro155/Enturma">
            github.com/luizcordeiro155/Enturma
          </Link>.
        </p>
      </section>
    </LegalDocument>
  );
}
