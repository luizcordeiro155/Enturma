import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = {
  title: "Política de Privacidade | Enturma",
  description: "Como o Enturma trata dados pessoais, acadêmicos e de mobilidade.",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Política de Privacidade"
      summary="Esta política explica quais dados o Enturma utiliza, por que eles são necessários e quais controles você possui sobre sua conta, seus conteúdos e sua localização."
      updatedAt="06 de outubro de 2026"
    >
      <section>
        <h2>1. Sobre esta política</h2>
        <p>
          O Enturma é uma plataforma acadêmica em desenvolvimento ativo. Esta
          política se aplica ao site, ao aplicativo Desktop e ao aplicativo
          Android oficial quando eles utilizam os serviços do Enturma.
        </p>
        <p>
          O objetivo é tratar somente os dados necessários para entregar os
          recursos escolhidos pelo usuário e manter a plataforma segura.
        </p>
      </section>

      <section>
        <h2>2. Dados que podem ser tratados</h2>
        <ul>
          <li>
            <strong>Conta e autenticação:</strong> nome, nome de usuário,
            e-mail, credenciais protegidas, sessões e informações necessárias
            para recuperação e segurança da conta.
          </li>
          <li>
            <strong>Perfil e vida acadêmica:</strong> instituição, campus,
            curso, período, matérias selecionadas, preferências, conquistas,
            portfólio e demais informações que você decidir adicionar.
          </li>
          <li>
            <strong>Comunidade e estudo:</strong> mensagens, publicações,
            reações, arquivos, cadernos, atividades e outros conteúdos enviados
            por você nos recursos em que existe persistência.
          </li>
          <li>
            <strong>Dados técnicos:</strong> informações de dispositivo,
            versão do aplicativo, sessão, registros de erro, segurança,
            notificações e eventos necessários para operar o serviço.
          </li>
          <li>
            <strong>Caronas e mobilidade:</strong> campus, direção da viagem,
            pontos escolhidos, dados de veículo quando cadastrados e
            localização quando você conceder permissão para recursos que
            realmente dependem dela.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Como usamos esses dados</h2>
        <p>Os dados podem ser usados para:</p>
        <ul>
          <li>criar e proteger sua conta;</li>
          <li>sincronizar sua experiência entre Web, Desktop e Android;</li>
          <li>conectar estudantes a matérias, turmas, salas e comunidades;</li>
          <li>entregar chat, chamadas, materiais, notificações e portfólio;</li>
          <li>processar recursos de IA solicitados por você;</li>
          <li>operar matching, rota e segurança do Enturma Caronas;</li>
          <li>prevenir abuso, fraude, acesso indevido e falhas de segurança;</li>
          <li>diagnosticar erros e melhorar estabilidade e desempenho.</li>
        </ul>
      </section>

      <section>
        <h2>4. Localização e Enturma Caronas</h2>
        <p>
          O acesso à localização depende da sua permissão. A localização exata
          não deve ser exibida publicamente na descoberta de caronas.
        </p>
        <p>
          Quando uma corrida utiliza acompanhamento ao vivo, a posição é
          compartilhada apenas nos estados autorizados da viagem e entre os
          participantes que possuem acesso ao match. O Enturma busca manter
          somente o necessário para o funcionamento desse acompanhamento e
          encerrar o compartilhamento quando a viagem, o match ou a permissão
          correspondente deixam de estar ativos.
        </p>
      </section>

      <section>
        <h2>5. Inteligência artificial</h2>
        <p>
          Quando você usa um recurso de IA, o conteúdo necessário para atender
          à solicitação pode ser enviado ao provedor de IA configurado pelo
          Enturma. Materiais e contexto devem respeitar as permissões do recurso
          que originou a solicitação.
        </p>
        <p>
          Não envie para a IA senhas, documentos sigilosos ou informações
          pessoais que não sejam necessárias para sua atividade.
        </p>
      </section>

      <section>
        <h2>6. Fornecedores e integrações</h2>
        <p>
          Para operar seus recursos, o Enturma pode utilizar provedores de
          hospedagem, banco de dados, armazenamento, chamadas em tempo real,
          inteligência artificial e notificações. Atualmente o projeto possui
          integrações que podem envolver serviços como LiveKit, armazenamento
          compatível com S3, OpenAI e Firebase Cloud Messaging.
        </p>
        <p>
          Cada integração deve receber somente os dados necessários para a
          finalidade técnica correspondente e também está sujeita aos termos e
          políticas do respectivo fornecedor.
        </p>
      </section>

      <section>
        <h2>7. Cookies, sessão e preferências</h2>
        <p>
          O Enturma utiliza cookies e armazenamento local para autenticação,
          manutenção de sessão, preferências de aparência, acessibilidade e
          estados necessários ao funcionamento do aplicativo.
        </p>
        <p>
          Esses mecanismos são utilizados para operar a plataforma e não são
          apresentados como uma rede de publicidade comportamental.
        </p>
      </section>

      <section>
        <h2>8. Retenção e exclusão</h2>
        <p>
          O Enturma possui controles de exclusão de conta. Quando disponíveis
          no aplicativo, você pode solicitar exclusão imediata ou agendada com
          janela para cancelamento.
        </p>
        <p>
          Alguns registros podem precisar ser anonimizados ou preservados pelo
          período estritamente necessário para integridade, segurança,
          prevenção de abuso, cumprimento de obrigações aplicáveis ou defesa de
          direitos.
        </p>
      </section>

      <section>
        <h2>9. Seus controles e direitos</h2>
        <p>
          Você pode atualizar informações do seu perfil e utilizar os controles
          disponíveis para preferências, notificações, sessão e exclusão.
          Solicitações relacionadas a acesso, correção, eliminação ou demais
          direitos previstos pela legislação de proteção de dados podem ser
          encaminhadas pelo canal oficial do projeto.
        </p>
        <p>
          O repositório oficial do Enturma está disponível em{" "}
          <Link href="https://github.com/luizcordeiro155/Enturma">
            github.com/luizcordeiro155/Enturma
          </Link>.
        </p>
      </section>

      <section>
        <h2>10. Segurança</h2>
        <p>
          O Enturma adota controles técnicos e de autorização para reduzir
          acesso indevido a contas e dados. Nenhum sistema é completamente
          imune a falhas, por isso vulnerabilidades devem ser reportadas de
          forma responsável e sem exposição pública de dados de terceiros.
        </p>
      </section>

      <section>
        <h2>11. Alterações desta política</h2>
        <p>
          Esta política pode ser atualizada conforme o Enturma evolui. Mudanças
          relevantes devem ser refletidas nesta página com uma nova data de
          atualização.
        </p>
      </section>
    </LegalDocument>
  );
}
