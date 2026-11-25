import { PROJECT_KINDS, type ProjectKind } from "./portfolio-projects";

/** The area a portfolio is shaped for. The server works it out from the enrolled course. */
export type TrackId =
  | "TECH"
  | "HEALTH"
  | "LAW"
  | "BUSINESS"
  | "ENGINEERING"
  | "DESIGN"
  | "COMMUNICATION"
  | "EDUCATION"
  | "SCIENCE"
  | "GENERAL";

type Field = { label: string; placeholder: string };

export type Track = {
  id: TrackId;
  label: string;
  /** Repositories are the work itself only where the course is about code. */
  github: boolean;
  accent: string;
  /** The kinds of work offered, most common first. */
  kinds: ProjectKind[];
  /** What the list of work is called, and the button that adds to it. */
  heading: string;
  add: string;
  /** Shown while the list is empty. */
  empty: string;
  /** Kinds of work worth showing, as a nudge. */
  ideas: string[];
  /** Competencies students of the area usually have. */
  suggested: string[];
  profile: { headline: string; goal: string; skills: string };
  fields: {
    name: string;
    description: string;
    tools: Field;
    /** Where the work itself is kept: a repository, a file, a publication. */
    link: Field;
    /** Where it can be seen running, played or read. */
    demo: Field;
    subject: string;
    role: string;
    outcome: string;
  };
};

export const TRACKS: Track[] = [
  {
    id: "TECH",
    label: "Tecnologia e Jogos",
    github: true,
    accent: "#1d6a4a",
    kinds: ["ACADEMIC", "PERSONAL", "OPEN_SOURCE", "RESEARCH", "COMPETITION", "INTERNSHIP"],
    heading: "Projetos",
    add: "Adicionar projeto",
    empty:
      "Adicione projetos da faculdade, pessoais, open source ou trabalhos em equipe. Cada projeto pode ter tecnologias, sua participação, links, imagens e PDFs.",
    ideas: [
      "Aplicativo ou site",
      "Jogo",
      "API ou automação",
      "Projeto integrador",
      "Contribuição em código aberto",
    ],
    suggested: [
      "Java",
      "Python",
      "JavaScript",
      "SQL",
      "Git",
      "Lógica de programação",
      "UI/UX",
      "Trabalho em equipe",
    ],
    profile: {
      headline: "Estudante de ADS · Java · UX",
      goal: "Ex.: estágio em desenvolvimento back-end",
      skills: "Java, SQL, Git, UI/UX",
    },
    fields: {
      name: "Ex.: App de caronas universitárias",
      description: "Que problema o projeto resolve e como ele funciona.",
      tools: { label: "Tecnologias", placeholder: "Java, PostgreSQL, React" },
      link: { label: "Repositório", placeholder: "https://github.com/voce/projeto" },
      demo: { label: "Demonstração ou site", placeholder: "https://meu-projeto.com" },
      subject: "Ex.: Engenharia de Software",
      role: "Ex.: modelei o banco e escrevi a API de reservas.",
      outcome: "O que ficou pronto, quem usou, que nota ou retorno teve.",
    },
  },
  {
    id: "HEALTH",
    label: "Saúde",
    github: false,
    accent: "#0f8a8a",
    kinds: [
      "INTERNSHIP",
      "ACADEMIC",
      "CASE_STUDY",
      "RESEARCH",
      "VOLUNTEER",
      "PUBLICATION",
      "COMPETITION",
      "PERSONAL",
    ],
    heading: "Práticas e trabalhos",
    add: "Adicionar trabalho",
    empty:
      "Adicione estágios, ligas acadêmicas, estudos de caso e projetos de extensão. Conte o que você fez e aprendeu, sem dados de pacientes.",
    ideas: [
      "Estágio supervisionado",
      "Liga acadêmica",
      "Estudo de caso",
      "Projeto de extensão",
      "Pôster em congresso",
    ],
    suggested: [
      "Atendimento humanizado",
      "Anamnese",
      "Biossegurança",
      "Educação em saúde",
      "Trabalho em equipe multiprofissional",
      "Primeiros socorros",
    ],
    profile: {
      headline: "Estudante de Enfermagem · Saúde coletiva",
      goal: "Ex.: estágio em hospital-escola",
      skills: "Anamnese, Primeiros socorros, Trabalho em equipe",
    },
    fields: {
      name: "Ex.: Estágio em atenção básica na UBS Centro",
      description:
        "O que você acompanhou ou fez, em que contexto e com qual supervisão. Não inclua dados de pacientes.",
      tools: {
        label: "Procedimentos e métodos",
        placeholder: "Anamnese, curativos, educação em saúde",
      },
      link: { label: "Link do trabalho", placeholder: "https://… (artigo, pôster ou certificado)" },
      demo: { label: "Vídeo, pôster ou página", placeholder: "https://…" },
      subject: "Ex.: Saúde Coletiva",
      role: "Ex.: fiz a triagem e orientei 30 pacientes com a preceptora.",
      outcome: "Carga horária, público atendido, nota ou retorno do supervisor.",
    },
  },
  {
    id: "LAW",
    label: "Direito",
    github: false,
    accent: "#8a2b3c",
    kinds: [
      "INTERNSHIP",
      "ACADEMIC",
      "CASE_STUDY",
      "PUBLICATION",
      "COMPETITION",
      "RESEARCH",
      "VOLUNTEER",
      "PERSONAL",
    ],
    heading: "Peças e experiências",
    add: "Adicionar trabalho",
    empty:
      "Adicione peças, pareceres, júris simulados, estágios e artigos. Preserve nomes e dados das partes.",
    ideas: [
      "Peça processual",
      "Parecer",
      "Júri simulado",
      "Núcleo de prática jurídica",
      "Artigo",
    ],
    suggested: [
      "Redação jurídica",
      "Pesquisa de jurisprudência",
      "Oratória",
      "Argumentação",
      "Direito Civil",
      "Negociação",
    ],
    profile: {
      headline: "Estudante de Direito · Civil e Consumidor",
      goal: "Ex.: estágio em escritório de contencioso cível",
      skills: "Redação jurídica, Pesquisa de jurisprudência, Oratória",
    },
    fields: {
      name: "Ex.: Parecer sobre responsabilidade civil em aplicativos",
      description:
        "Qual era a questão jurídica, que tese você sustentou e com base em quê. Preserve nomes e dados das partes.",
      tools: {
        label: "Áreas e instrumentos",
        placeholder: "Direito Civil, petição inicial, pesquisa de jurisprudência",
      },
      link: { label: "Link do trabalho", placeholder: "https://… (artigo ou peça anonimizada)" },
      demo: { label: "Vídeo ou publicação", placeholder: "https://…" },
      subject: "Ex.: Direito Processual Civil",
      role: "Ex.: redigi a contestação e sustentei no júri simulado.",
      outcome: "Resultado do júri simulado, nota, publicação ou retorno do orientador.",
    },
  },
  {
    id: "BUSINESS",
    label: "Gestão e Negócios",
    github: false,
    accent: "#1f5fa8",
    kinds: [
      "ACADEMIC",
      "CASE_STUDY",
      "INTERNSHIP",
      "PERSONAL",
      "COMPETITION",
      "RESEARCH",
      "VOLUNTEER",
      "PUBLICATION",
    ],
    heading: "Cases e projetos",
    add: "Adicionar projeto",
    empty:
      "Adicione planos de negócio, estudos de caso, projetos de empresa júnior e análises. Mostre o desafio, o que você analisou e o resultado.",
    ideas: [
      "Plano de negócio",
      "Estudo de caso",
      "Empresa júnior",
      "Pesquisa de mercado",
      "Análise financeira",
    ],
    suggested: [
      "Excel",
      "Análise de dados",
      "Planejamento",
      "Comunicação",
      "Gestão de projetos",
      "Finanças",
    ],
    profile: {
      headline: "Estudante de Administração · Marketing e dados",
      goal: "Ex.: estágio em planejamento financeiro",
      skills: "Excel, Análise de dados, Comunicação",
    },
    fields: {
      name: "Ex.: Plano de marketing para uma cafeteria do bairro",
      description: "Qual era o desafio do negócio, o que você analisou e o que recomendou.",
      tools: {
        label: "Ferramentas e métodos",
        placeholder: "Excel, Canvas, análise SWOT, pesquisa de mercado",
      },
      link: {
        label: "Link do trabalho",
        placeholder: "https://… (relatório, planilha ou apresentação)",
      },
      demo: { label: "Apresentação ou página", placeholder: "https://…" },
      subject: "Ex.: Gestão de Marketing",
      role: "Ex.: fiz a pesquisa com 80 clientes e montei o plano financeiro.",
      outcome: "Números alcançados, decisão tomada, nota ou retorno do cliente.",
    },
  },
  {
    id: "ENGINEERING",
    label: "Engenharias",
    github: false,
    accent: "#c2600f",
    kinds: [
      "ACADEMIC",
      "PERSONAL",
      "INTERNSHIP",
      "COMPETITION",
      "RESEARCH",
      "CASE_STUDY",
      "VOLUNTEER",
      "PUBLICATION",
    ],
    heading: "Projetos",
    add: "Adicionar projeto",
    empty:
      "Adicione protótipos, projetos integradores, equipes de competição e memoriais de cálculo. Mostre o problema, o dimensionamento e os testes.",
    ideas: [
      "Protótipo",
      "Projeto integrador",
      "Equipe de competição",
      "Memorial de cálculo",
      "Iniciação científica",
    ],
    suggested: [
      "AutoCAD",
      "SolidWorks",
      "MATLAB",
      "Excel",
      "Leitura de normas",
      "Gestão de projetos",
    ],
    profile: {
      headline: "Estudante de Engenharia Civil · Estruturas",
      goal: "Ex.: estágio em projetos estruturais",
      skills: "AutoCAD, Cálculo estrutural, Excel",
    },
    fields: {
      name: "Ex.: Ponte de macarrão que suportou 48 kg",
      description: "Que problema o projeto resolve, como foi dimensionado e como foi testado.",
      tools: { label: "Ferramentas e normas", placeholder: "AutoCAD, SolidWorks, MATLAB, NBR 6118" },
      link: {
        label: "Arquivos do projeto",
        placeholder: "https://… (memorial, desenhos ou modelo)",
      },
      demo: { label: "Vídeo ou página", placeholder: "https://…" },
      subject: "Ex.: Resistência dos Materiais",
      role: "Ex.: fiz o cálculo estrutural e o modelo 3D.",
      outcome: "Medições, carga suportada, colocação na competição ou nota.",
    },
  },
  {
    id: "DESIGN",
    label: "Design e Artes",
    github: false,
    accent: "#9a3fb5",
    kinds: [
      "CREATIVE",
      "ACADEMIC",
      "PERSONAL",
      "INTERNSHIP",
      "COMPETITION",
      "CASE_STUDY",
      "RESEARCH",
      "VOLUNTEER",
    ],
    heading: "Trabalhos",
    add: "Adicionar trabalho",
    empty:
      "Adicione identidades visuais, ilustrações, maquetes, coleções e exposições. As imagens contam muito aqui: anexe as melhores em cada trabalho.",
    ideas: [
      "Identidade visual",
      "Ilustração",
      "Maquete ou projeto arquitetônico",
      "Coleção",
      "Exposição",
    ],
    suggested: ["Figma", "Illustrator", "Photoshop", "Desenho", "Tipografia", "Fotografia"],
    profile: {
      headline: "Estudante de Design · Identidade visual",
      goal: "Ex.: estágio em estúdio de design",
      skills: "Figma, Ilustração, Tipografia",
    },
    fields: {
      name: "Ex.: Identidade visual de uma feira de bairro",
      description: "Qual era o pedido, como foi o processo e que decisões você tomou.",
      tools: { label: "Ferramentas e técnicas", placeholder: "Figma, Illustrator, aquarela, maquete" },
      link: { label: "Link do trabalho", placeholder: "https://behance.net/voce/trabalho" },
      demo: { label: "Vídeo ou página", placeholder: "https://…" },
      subject: "Ex.: Tipografia",
      role: "Ex.: criei o conceito, o logotipo e os cartazes.",
      outcome: "Onde foi usado ou exposto, quem viu e que retorno teve.",
    },
  },
  {
    id: "COMMUNICATION",
    label: "Comunicação",
    github: false,
    accent: "#d2462a",
    kinds: [
      "CREATIVE",
      "ACADEMIC",
      "PUBLICATION",
      "INTERNSHIP",
      "PERSONAL",
      "COMPETITION",
      "RESEARCH",
      "VOLUNTEER",
    ],
    heading: "Trabalhos",
    add: "Adicionar trabalho",
    empty:
      "Adicione reportagens, campanhas, vídeos, podcasts e trabalhos em redes. Conte a pauta ou o briefing e onde o trabalho saiu.",
    ideas: ["Reportagem", "Campanha", "Vídeo ou documentário", "Podcast", "Gestão de redes"],
    suggested: [
      "Redação",
      "Edição de vídeo",
      "Fotografia",
      "Redes sociais",
      "Entrevista",
      "Roteiro",
    ],
    profile: {
      headline: "Estudante de Jornalismo · Vídeo e redes",
      goal: "Ex.: estágio em redação ou agência",
      skills: "Redação, Edição de vídeo, Redes sociais",
    },
    fields: {
      name: "Ex.: Reportagem sobre transporte universitário",
      description: "Qual era a pauta ou o briefing, como você apurou ou criou e onde saiu.",
      tools: {
        label: "Formatos e ferramentas",
        placeholder: "Reportagem, Premiere, redes sociais, podcast",
      },
      link: { label: "Link da publicação", placeholder: "https://…" },
      demo: { label: "Vídeo ou áudio", placeholder: "https://youtube.com/…" },
      subject: "Ex.: Redação Jornalística",
      role: "Ex.: fiz a apuração, as entrevistas e a edição.",
      outcome: "Alcance, veículo em que saiu, prêmio ou retorno do professor.",
    },
  },
  {
    id: "EDUCATION",
    label: "Educação e Humanas",
    github: false,
    accent: "#b7791f",
    kinds: [
      "INTERNSHIP",
      "ACADEMIC",
      "RESEARCH",
      "VOLUNTEER",
      "PUBLICATION",
      "CASE_STUDY",
      "COMPETITION",
      "PERSONAL",
    ],
    heading: "Práticas e trabalhos",
    add: "Adicionar trabalho",
    empty:
      "Adicione planos de aula, estágios docentes, pesquisas, artigos e projetos de extensão. Conte para quem foi e o que mudou.",
    ideas: [
      "Plano de aula",
      "Estágio docente",
      "PIBID ou residência pedagógica",
      "Artigo",
      "Projeto de extensão",
    ],
    suggested: [
      "Planejamento de aulas",
      "Didática",
      "Pesquisa",
      "Escrita acadêmica",
      "Mediação",
      "Inclusão",
    ],
    profile: {
      headline: "Estudante de Pedagogia · Alfabetização",
      goal: "Ex.: estágio em escola de ensino fundamental",
      skills: "Planejamento de aulas, Didática, Pesquisa",
    },
    fields: {
      name: "Ex.: Sequência didática sobre frações para o 5º ano",
      description: "Para quem foi, qual era o objetivo e como você conduziu.",
      tools: {
        label: "Métodos e recursos",
        placeholder: "Sequência didática, jogos, pesquisa de campo",
      },
      link: { label: "Link do trabalho", placeholder: "https://… (plano de aula ou artigo)" },
      demo: { label: "Vídeo ou página", placeholder: "https://…" },
      subject: "Ex.: Didática",
      role: "Ex.: planejei e dei quatro aulas no estágio.",
      outcome: "Turma atendida, o que os alunos aprenderam, nota ou retorno do supervisor.",
    },
  },
  {
    id: "SCIENCE",
    label: "Ciências",
    github: false,
    accent: "#4b56c7",
    kinds: [
      "RESEARCH",
      "ACADEMIC",
      "PUBLICATION",
      "INTERNSHIP",
      "COMPETITION",
      "VOLUNTEER",
      "CASE_STUDY",
      "PERSONAL",
    ],
    heading: "Pesquisas e projetos",
    add: "Adicionar projeto",
    empty:
      "Adicione iniciações científicas, relatórios de laboratório, trabalhos de campo e pôsteres. Mostre a pergunta, o método e o que você encontrou.",
    ideas: [
      "Iniciação científica",
      "Relatório de laboratório",
      "Trabalho de campo",
      "Pôster em congresso",
      "Monitoria",
    ],
    suggested: [
      "Método científico",
      "Estatística",
      "Escrita acadêmica",
      "Trabalho de campo",
      "Excel",
      "R",
    ],
    profile: {
      headline: "Estudante de Ciências Biológicas · Ecologia",
      goal: "Ex.: iniciação científica em laboratório",
      skills: "Método científico, Estatística, Escrita acadêmica",
    },
    fields: {
      name: "Ex.: Qualidade da água em três córregos da cidade",
      description: "Qual era a pergunta, que método você usou e o que encontrou.",
      tools: {
        label: "Métodos e equipamentos",
        placeholder: "Coleta em campo, espectrofotometria, R, estatística",
      },
      link: { label: "Link do trabalho", placeholder: "https://… (artigo, relatório ou dados)" },
      demo: { label: "Pôster, vídeo ou página", placeholder: "https://…" },
      subject: "Ex.: Ecologia",
      role: "Ex.: fiz as coletas e a análise estatística.",
      outcome: "Resultado, apresentação em evento, publicação ou nota.",
    },
  },
  {
    id: "GENERAL",
    label: "Geral",
    github: false,
    accent: "#1d6a4a",
    kinds: [
      "ACADEMIC",
      "PERSONAL",
      "INTERNSHIP",
      "RESEARCH",
      "VOLUNTEER",
      "CASE_STUDY",
      "PUBLICATION",
      "CREATIVE",
      "COMPETITION",
    ],
    heading: "Projetos e trabalhos",
    add: "Adicionar projeto",
    empty:
      "Adicione trabalhos da faculdade, estágios, pesquisas, voluntariado e projetos pessoais. Cada um pode ter sua participação, links, imagens e PDFs.",
    ideas: ["Trabalho da faculdade", "Estágio", "Pesquisa", "Voluntariado", "Projeto pessoal"],
    suggested: [
      "Comunicação",
      "Trabalho em equipe",
      "Organização",
      "Excel",
      "Escrita",
      "Apresentação",
    ],
    profile: {
      headline: "Estudante universitário · suas áreas de interesse",
      goal: "Ex.: primeiro estágio na minha área",
      skills: "Comunicação, Trabalho em equipe, Excel",
    },
    fields: {
      name: "Ex.: Trabalho de conclusão sobre mobilidade no campus",
      description: "O que era o trabalho, como você fez e o que resultou.",
      tools: {
        label: "Ferramentas e métodos",
        placeholder: "Excel, entrevistas, pesquisa bibliográfica",
      },
      link: { label: "Link do trabalho", placeholder: "https://…" },
      demo: { label: "Vídeo ou página", placeholder: "https://…" },
      subject: "Ex.: Metodologia Científica",
      role: "Ex.: organizei a equipe e escrevi o relatório.",
      outcome: "O que ficou pronto, quem usou, que nota ou retorno teve.",
    },
  },
];

/**
 * The area for what the server sent. An API from before areas existed sends nothing, and
 * those portfolios stay as they were; an area this app does not know yet is the general one.
 */
export function trackOf(id?: string | null): Track {
  if (!id) return TRACKS[0];
  return TRACKS.find((track) => track.id === id) ?? TRACKS[TRACKS.length - 1];
}

/** The kinds an area offers, plus the one a project already has when the area leaves it out. */
export function kindsFor(track: Track, current?: ProjectKind) {
  const offered = track.kinds
    .map((id) => PROJECT_KINDS.find((kind) => kind.id === id))
    .filter((kind): kind is (typeof PROJECT_KINDS)[number] => Boolean(kind));
  const extra = PROJECT_KINDS.find((kind) => kind.id === current);
  return extra && !track.kinds.includes(extra.id) ? [...offered, extra] : offered;
}
