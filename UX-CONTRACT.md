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

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Select/Listbox | HTML select e botões com aria-pressed | Estado React | Popup nativo e grupos pequenos de opções | Teclado e rótulos no Playwright |
| Form | Controles HTML com label | DTO Java e estado React | Timeline com controles range e number | video-editor.test.tsx e SocialIntegrationTest |
| Scrollbar | globals.css | Tokens de tema | Scroll interno dos diálogos, Feed e Clips | Overflow a 390 e 1440 px no Playwright |
| Toast | Regiões role=status/alert existentes | Resposta da API | Feedback inline persistente | Estados reais de erro e publicação nos E2E |
| CRUD | SocialPosts/SocialMedia e editor | PostgreSQL, versão e rascunho IndexedDB | Confirmação de remoção e descarte | Testes de autorização, idempotência e mídia |
