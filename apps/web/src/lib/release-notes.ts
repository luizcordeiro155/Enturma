/**
 * What changed since the previous announcement (02/11/2026). Shown after a desktop or Android
 * update and in Configurações. Keep it short, in the student's words, newest areas first.
 */
export const RELEASE_NOTES_DATE = "16 de novembro de 2026";

export const RELEASE_NOTES: { area: string; items: string[] }[] = [
  {
    area: "Enturma Study",
    items: [
      "Calendário acadêmico com aulas, provas, feriados, férias e lembrete 2 horas antes de cada aula.",
      "Presença e faltas por semestre, aula concluída e matérias separadas por período letivo.",
      "Sessões de estudo com tutor de IA, quiz e convite para colegas, além do modo foco.",
    ],
  },
  {
    area: "Enturma Social",
    items: [
      "Feed, Clips e Stories: vídeos de até 3 minutos, enquadramento automático e rascunhos.",
      "Explorar com as hashtags em alta, coleções privadas e perfil social sincronizado.",
      "Amigos e notificações no estilo WhatsApp, agrupadas por conversa ou publicação.",
    ],
  },
  {
    area: "Conta e privacidade",
    items: [
      "Entrar com e-mail pessoal e aceite dos Termos e da Política de Privacidade por versão.",
      "Exportação completa dos seus dados, histórico de aceites e senhas mais seguras.",
      "Configurações reorganizadas em seções, com menu que acompanha a página e a sua foto ou GIF de perfil.",
      "Sessões mostram se o acesso é pelo navegador, app desktop ou app Android, quais estão ativas agora e o último acesso.",
      "O Enturma funciona dentro da Vitrine Virtual Mostra+, com login e uso normal.",
    ],
  },
  {
    area: "Desempenho",
    items: [
      "Respostas mais rápidas e menos consultas em segundo plano, inclusive nas chamadas.",
      "Fotos e vídeos da galeria do Android chegam ao Enturma sem falhas.",
    ],
  },
];
