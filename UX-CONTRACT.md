# Contrato de experiência do Enturma Social

| Capacidade | Dono canônico | Fonte da verdade | Comportamento |
| --- | --- | --- | --- |
| Tema e preferências | experience-preferences / ThemeSync existentes | preferências do usuário | Não sobrescrever ao trocar de página |
| Navegação | Shell / NavigationLink / SocialNavigation | rotas e preferências sociais | Fórum independente; Social usa rail/dock próprio e saída explícita para Home; mantém estado das abas |
| Programação | AppShellStateProvider / learning/access | elegibilidade acadêmica do backend | Mesma visibilidade no Desktop e menu Mais mobile |
| Abertura Social | SocialOpening / SocialOpeningComposition | ciclo de vida do AppShellStateProvider | Uma vez por abertura, pular e timeout seguros; animações gerais e Caronas intactas |
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
| Menções | SocialMentionInput | SocialPeople.mentionSuggestions | Legenda e comentário, lista autoral com avatar; @ sugere conexões, texto busca contas ativas sem bloqueios | Testes de composição IME, respostas antigas, toque, teclado e autorização |

No mobile, arrastar para a esquerda abre Clips e para a direita abre Criar a partir do Feed. A seleção animada da navegação acompanha o estado do pager, mantendo a ordem personalizada dos botões. O conteúdo do Social só monta após a abertura terminar ou ser pulada. Com teclado aberto, ações de publicação e navegação ficam ocultas, com espaço preservado; comentários mantêm seu envio junto ao campo. Notificações usam avatar de 40 px e ferramentas compactas; o perfil mobile separa identidade e ações em linhas.

## Studio, teclado e transmissao

Ver [Studio Social](docs/SOCIAL_STUDIO_RELEASE.md). O compositor acompanha a area util do teclado sem rolar o shell; interfaces de toque mantem alternativas por teclado. Feed silencioso nao desloca a leitura e reciclagem consulta novamente as permissoes. Lives usam grants distintos para anfitriao/espectador, sem gravacao de chat.


## Feed geral e revisão de publicação

`SocialPosts` já define `kind=ALL` como POST e CLIP, com as mesmas permissões, filtros, busca e ranking. `Social` usa esse contrato no feed geral; o perfil mantém coleções e filtros próprios. `SocialDraftPreview` só lê a mídia privada do rascunho, revoga URLs locais e mostra a capa/quadro selecionado sem reaplicar cortes à capa importada ou à mídia já exportada. Publicar permanece explícito e confirmado pela API. A prévia de reprodução não pode ser arrastada; o recorte na etapa Editar permanece intencional e acessível por controles alternativos. A lista de seguidores conserva todas as ações e o nome acessível completo, mesmo quando o texto visual precisa de reticências.

## Perfil, conversa e visualizações

`MessageActionPopover` mantém seletores dentro do diálogo modal que contém seu botão, preservando a camada interativa, posicionamento na área visível e Escape apenas no seletor. `SocialPostViewer` monta uma publicação por vez e reutiliza `SocialComments` para a conversa integrada.

`SocialPeople.profile` lê a identidade diretamente de `app_user`; não mantém cópia dos campos do perfil. Avatar e banner usam a versão da mídia e os arquivos originais, inclusive GIFs. `SocialProfileGrid` apresenta curtidas e comentários por hover, foco ou toque, e visualizações dos vídeos quando fornecidas pela API.

`useVideoView` mede tempo reproduzido no feed, Clips e visualizador, ignorando saltos de reprodução e segundo plano. `SocialPosts.view` registra um espectador único após três segundos ou conclusão de vídeo curto; exclui o autor, texto e Stories. `social_video_view` deduplica por publicação e usuário, com exclusão em cascata, RLS e as mesmas permissões de leitura da publicação. O contador não lista espectadores e começa com esta versão; não inventa dados históricos. O feedback para recomendações continua condicionado ao consentimento existente.
