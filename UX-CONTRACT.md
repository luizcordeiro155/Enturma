# Contrato de experiência do Enturma Social

| Capacidade | Dono canônico | Fonte da verdade | Comportamento |
| --- | --- | --- | --- |
| Tema e preferências | experience-preferences / ThemeSync existentes | preferências do usuário | Não sobrescrever ao trocar de página |
| Navegação | Shell / NavigationLink | rotas e sessão | Fórum independente; Social em rota própria |
| Formulários | labels e controles nativos, Feedback | DTOs validados pela API | Preservar valores, impedir envio duplicado, apresentar erros reais |
| Seleção | select nativo | estado do formulário | Popup do sistema aceito, com rótulo |
| Diálogos | HTMLDialogElement + useOverlayHistory + playMotion | estado da ação | Foco, Escape, voltar e confirmação de descarte |
| Scrollbar | globals.css | tokens de tema | Não esconder; rolagem interna apenas em painéis delimitados |
| Feedback | Feedback / regiões role=status | resposta da API | Sucesso só depois da confirmação; erros permanecem visíveis |
| CRUD social | módulo social da API | PostgreSQL | Rascunho persistente; publicação explícita; exclusão confirmada |
| Compartilhar sala | RoomSharePanel | RoomShareController | Mesmas permissões e ações no mobile e desktop |

Não expor conteúdo privado por prévia, notificação, busca, contador, mídia ou URL. Fechar editor mantém rascunho; descartar pede confirmação. Atualização do Feed aparece como ação discreta, sem deslocar a leitura. Configuração adaptativa pode recomendar destaques, nunca reordenar botões durante a interação.
