# Enturma — contexto visual

## Overview

Comunidade acadêmica em português brasileiro, com a identidade de livro, verde e lima já existente. O Social é uma área de produto: autoria, mídia e ações prevalecem sobre decoração. O Fórum mantém sua identidade e sua navegação.

## Colors

A fonte canônica são as variáveis de `apps/web/src/app/globals.css` e os adaptadores de tema existentes. Usar `--bg`, `--surface`, `--soft`, `--ink`, `--muted`, `--accent`, `--on-accent` e `--border`; nenhuma paleta paralela. Claro, Escuro, Enturma e Sistema preservam alto contraste e preferências.

## Typography

Preservar as famílias do aplicativo. Títulos curtos e legíveis, corpo confortável para leitura, legendas com contraste verificável. Não carregar novas fontes para o Social.

## Layout

Feed central de leitura, Stories horizontais e Clips verticais. Dentro do Social, a navegação própria ocupa a lateral no Desktop e a base no mobile: Feed, Clips, Criar, Mensagens e Perfil. O retorno ao Início do Enturma permanece no cabeçalho. Cada aba retém sua própria posição e a ordem personalizada é preservada. Fora do Social, a barra mobile oferece Início, Salas, Social Entu, Comunidade, Amigos e Mais; Cadernos fica abaixo de Programação no Mais. Programação usa a mesma elegibilidade acadêmica no mobile e Desktop. O editor prioriza prévia e timeline; controles têm alternativa ao arraste.

A abertura do Social tem composição Remotion própria: páginas do livro formam as lâminas do símbolo Social. Executa uma vez por documento do aplicativo, herda os tokens de tema, permite pular e respeita redução de movimento. As animações de abertura geral e Caronas permanecem inalteradas.

## Elevation & Depth

Usar superfícies e bordas existentes. Dialog nativo modal, backdrop discreto, rolagem interna e safe areas. Movimento acompanha mudanças reais, pausa em segundo plano e respeita redução de movimento.

## Shapes

Avatares circulares, mídia com proporção reservada, controles e cartões com raios compatíveis com os componentes existentes.

## Components

Reutilizar Shell, Avatar/UserIdentity, Feedback, playMotion, RoomArtwork, RoomSharePanel, NavigationLink e o cliente autenticado api. O ícone de verificação social sempre inclui nome acessível e não substitui o selo acadêmico.

## Do's and Don'ts

Não criar números, seguidores, publicações ou aprovação fictícios. Fora do Social, limitar esta revisão aos encaixes de desktop em 1366×768 solicitados pelo usuário. Não iniciar dois vídeos simultaneamente nem tornar gestos a única forma de navegação.

## Studio e interacoes sociais

O Studio visual, capas, comentarios com midia, compartilhamento privado e lives seguem [o contrato de release](docs/SOCIAL_STUDIO_RELEASE.md). Fotos 3:4 permanecem inteiras no feed. Abertura Social em tela inteira; logo e fontes canonicos do Enturma.

## Revisão de feed e desktop — 12/11/2026

As referências fornecidas pelo usuário orientam a composição: feed geral central de até 500 px com posts e Clips, preservando filtros e ranking da API; visualizador de Clips com vídeo 9:16 estável, legenda à esquerda e ações à direita no desktop, sobreposição no mobile. A marca usa o mesmo SVG, peso, tamanho e tokens da Shell, sem superfície de hover exclusiva.

No Studio, manter Escolher → Editar → Detalhes e os rascunhos existentes. Editar e revisar usam prévia à esquerda e ferramentas/detalhes à direita no desktop; o mobile empilha. A revisão exibe a capa escolhida, inclusive a importada, e permite voltar ao vídeo sem perder mudanças. Seguidores separam identidade e ações em linhas para nomes longos. A Shell e o painel de estudo mantêm duas colunas a 1366×768 com espaçamento compacto, sem zoom global.

## Layout aprovado no Figma — 13/11/2026

Referência: https://www.figma.com/design/ayr0c9xHqgoOHSTqDI3M51?node-id=5-2.
No desktop, rail de 76 px e Feed com leitura de até 500 px, Stories de 64 px e coluna lateral de 290 px a partir de 1200 px. A coluna usa conexões reais (Sua turma), com convite para descobrir pessoas quando vazia; não simula sugestões algorítmicas. No mobile, cinco destinos no dock e Explorar no cabeçalho. O perfil mantém grade de três colunas com fotos 3:4; Explorar pode usar quatro colunas em telas largas. Painéis móveis usam alça visual e cantos de 24 px, preservando teclado, safe areas e fechamento acessível. Clips, editor, mensagens, câmera e compartilhamento reutilizam os fluxos existentes desta PR. A aparência herda os temas escolhidos pelo usuário.

## Caronas no celular e conversa da corrida — 18/11/2026

- O centro do mapa é o meio da parte visível, e não do mapa inteiro: o mapa recebe quanto de cada borda está sob a barra superior e sob o painel de pedir carona e centraliza no que sobra. “Recentralizar” fica logo acima do painel, onde quer que ele esteja.
- No celular o painel repousa em três alturas (espiada, meia tela, tela cheia). A alça é um botão: puxar para cima ou para baixo muda um degrau; tocar abre e, com o painel cheio, devolve o mapa. A partir de 761 px o painel é fixo ao lado do mapa e a alça some.
- Com a corrida em andamento, o painel no celular mostra primeiro quem vem, o tempo e o próximo passo; mensagem, navegação e cancelar vêm depois.
- A conversa com o motorista ou passageiro abre dentro do painel da corrida, com respostas rápidas e contador de não lidas. Ela é temporária: só existe durante a corrida, é encerrada quando a corrida termina ou é cancelada, e o histórico é apagado em até 24 horas. A animação de match não mudou.

## Mídia e perfil — revisão de 13/11/2026

Vídeos preenchem a largura do post com recorte central, sem faixas laterais adicionadas pelo player. A revisão do Studio permite alternar entre o enquadramento do feed e o vídeo completo. A grade do perfil ocupa a largura do painel; o cabeçalho usa banner, avatar, bio e mensagem do perfil principal, preservando GIFs. No desktop, abrir uma publicação reúne mídia e conversa lado a lado; no mobile, empilha.

Curtidas usam `--social-like`, definido em `social-studio.css`: vermelho escuro `#bf2542` no claro e `#ff526b` no escuro. O controle de volume usa branco sobre `#292d32e8`, independente do tema; expande por hover ou foco. Movimento respeita a preferência de redução. O foco da busca contorna o campo completo.

## Links e cor do nome no perfil — 18/11/2026

- O perfil aceita até seis links (páginas web ou e-mail). Cada um aparece como uma etiqueta com o nome do serviço reconhecido pelo endereço real (GitHub, Instagram, LinkedIn, WhatsApp, e-mail, site…) e o identificador público; o número de WhatsApp nunca é exibido. O antigo campo único “Site ou GitHub” entra nessa lista.
- As etiquetas usam a cor do texto do próprio cartão (`currentColor`), para continuarem legíveis em qualquer paleta escolhida pelo usuário.
- A cor escolhida para o nome vale no cartão do perfil; o cartão redefine o texto para `inherit`, então a regra da cor do nome precisa ter especificidade maior que essa redefinição.

## Perfil social no desktop — 18/11/2026

A partir de 761 px, o Perfil social usa a mesma superfície do perfil padrão (`ProfileCard` e as cores de `profileStyle`): cartão de identidade à esquerda, com banner, avatar, nome, status, bio e as ações de seguir, mensagem e copiar link; à direita, a coluna “Enturma Social” com os contadores reais, avisos, destaques, abas e a grade de três colunas. Os controles da coluna social derivam de `currentColor` (`--mural-copy`), para manter contraste nos temas Claro, Escuro, Enturma e Sistema e em murais personalizados. Até 760 px o perfil continua empilhado, sem mudanças.

No celular (até 760 px) o Perfil social usa a mesma superfície, empilhada: o cartão de identidade com a personalização do perfil (banner, avatar e decoração, fonte, efeito e cor do nome, insígnias, cores e fundo) e, abaixo, o bloco “Enturma Social” com contadores, destaques, abas e grade. A escolha entre duas colunas e uma coluna é feita só por CSS; não há mais uma árvore separada para o celular.

## Jogos de programação — 18/11/2026

- Termo Dev segue a estrutura do Termo: tabuleiro, célula selecionável e teclado próprio na tela. Não há campo de texto, então o teclado do celular não abre e a página não se desloca. O teclado físico continua valendo no computador (letras, setas, Backspace, Delete, Enter).
- O tabuleiro se dimensiona pelo número de letras (4 a 13) e pela altura da tela, para que tabuleiro e teclas caibam juntos. As cores de pista (certa, outra posição, fora) são fixas; todo o resto usa os tokens do tema.
- No Laboratório Binário cada bit é um interruptor; em telas de toque o campo de texto some. Campos dos jogos têm 16px no celular para o navegador não ampliar a página.
- No celular, os quatro jogos ficam em uma linha e as missões viram cinco passos numerados.
- Nível: cada missão (jogo + posição) tem o próprio nível, que sobe a cada dia em que ela foi concluída. Missão não concluída volta igual no dia seguinte. O nível diário conta os dias em que houve ao menos uma missão concluída.

## Cosméticos de perfil — 19/11/2026

- Um pacote tem quatro peças: moldura, decoração de avatar, efeito de perfil e cores. O estudante usa o pacote inteiro ou mistura peças de pacotes diferentes em "Molduras e efeitos", no editar perfil.
- Cada pacote libera num nível (nível = XP total ÷ 250 + 1). O servidor confere o nível ao salvar; um pacote bloqueado pode ser experimentado na prévia, nunca salvo.
- A arte é desenhada em canvas, um módulo por pacote, carregado só quando o perfil usa. A entrada toca toda vez que o perfil abre e depois a arte fica em repouso; com movimento reduzido vira uma imagem parada.
- No perfil que abre sobre a página, em tela larga, a moldura fica ao redor do cartão e passa das bordas, sem caixa por trás. No celular o perfil ocupa a largura toda e a moldura aparece acima e abaixo dele. Na prévia do editor o cartão abre espaço para a moldura.
- Cada pacote sugere duas cores (principal e realce). Usar o pacote aplica essas cores ao tema do próprio perfil; o estudante troca depois em "Tema e identidade".
- As camadas são decoração: `aria-hidden`, sem capturar toques, e nunca cobrem o texto do perfil.
- A arte nasce no protótipo e é exportada para `apps/web/src/cosmetics` por script; não se edita o arquivo gerado.

## Perfil no modelo de cartão e sala escura — 19/11/2026

- O perfil visto pelos outros é uma sala escura própria, igual nos dois temas do app: as duas cores do perfil (principal e realce) aparecem sob um véu escuro no fundo, no cartão e no botão principal, sempre com texto claro. Com uma cor só, o degradê vai dela para ela mesma.
- Ao clicar numa pessoa abre o cartão compacto: só a identidade, com a moldura ao redor. "Ver perfil completo" mostra o mural, a atividade e o que há em comum ao lado do cartão.
- No perfil completo o cartão fica afastado das bordas e arredondado; o conteúdo ao lado usa os componentes do Enturma sobre vidro escuro. Um mural com cores próprias tinge o seu lado da sala.
- A prévia do editor é a mesma sala, para o estudante ver o perfil como os outros vão ver. A tela de editar continua como era.

## Perfil completo único e cosméticos leves — 19/11/2026

- **Um desenho só para o perfil completo.** O perfil aberto por um nome ou foto (salas, mensagens, fórum, amigos, caronas) abre como cartão compacto e, em "Ver perfil completo", ocupa a mesma caixa do perfil social (`min(1240px, 100vw - 64px)` por `min(900px, 100dvh - 32px)`), sobre a página escurecida: cartão à esquerda com a moldura ao redor, conteúdo à direita em vidro, abas sublinhadas sem faixa de fundo.
- **Sem barra no topo.** O perfil social não tem mais a faixa com título e X: o título fica só para leitores de tela e o botão de fechar (42 px, vidro escuro) flutua dentro do painel, no mesmo lugar nos dois perfis e em qualquer largura.
- **A sala abre espaço para a moldura.** No perfil completo a sala recebe `--cosmetic-spill-top/bottom` e aumenta o respiro acima e abaixo do cartão, para a tela não cortar molduras altas (a cabeça do dragão).
- **Custo por quadro.** A entrada de um pacote roda na taxa da tela; em repouso, a 30 quadros por segundo. Se o aparelho não acompanha (média acima de 12 ms por quadro), o motor reduz a nitidez do canvas e depois a taxa (`cosmetics/pace.ts`). A arte que quase não se mexe é pintada numa camada própria algumas vezes por segundo (`Layer` no kit) e os brilhos são carimbos em vez de gradientes novos a cada chamada.

## Catálogo de cosméticos: 29 pacotes — 19/11/2026

- **Sete estantes.** Bichinhos (Gatinhos, Cachorrinhos, Coelhinho, Coelhinha), Estações (Primavera, Verão, Outono, Inverno), Datas comemorativas (Noite das Abóboras, Páscoa, Carnaval, Natal, Ano Novo), Cursos e casa (Enturma, Programação, Games, Medicina, Jardim de Rosas), Culturas (Sakura, Dragão Imperial, Samurai, Noite JDM), Dinossauros (Dino Fofinho, Dino Selvagem) e Terror e fantasia (Mecha, Masmorra, Grimório Arcano, Tinta Sombria, Pesadelo). O editor mostra as estantes uma embaixo da outra e um filtro por tema no topo; a prévia fica fixa ao lado da lista no desktop e, no celular, experimentar um pacote rola até ela.
- **Arte original.** Nenhum pacote usa personagem, símbolo ou traço de obra existente; os carros da Noite JDM e o robô do Mecha são desenhos próprios. Terror sem gore: tinta, sombra e osso estilizados.
- **Preto sobre escuro.** Pacotes de tinta e de sombra (Tinta Sombria, Pesadelo) levam um filete claro em toda forma preta, porque o perfil é uma sala escura.
- **Heróis em cima e embaixo.** No celular a moldura só aparece acima e abaixo do cartão, então os personagens ficam nessas duas faixas, dentro da largura do cartão; o que corre pelos lados é complemento do desktop. `reach` de cada pacote é a medida real da arte em repouso (`extent.mjs` no protótipo).
- **Peças compartilhadas no kit.** Fio que acompanha a borda com enfeites (`Strand`), partículas sem estado (`Drift`), camada lenta para o que assentou (`settle`), olhos, coelho, ovo pintado, margarida, trevo e pegada. Cada pacote novo custa entre 3 e 10 ms por quadro em repouso no teste de software.
- **Níveis.** De 1 (Sakura, Primavera, Enturma) a 22 (Pesadelo); a tabela vive no servidor (`SocialController.COSMETICS`) e um teste do web confere que as duas listas são a mesma.

## Rolagem do perfil social, salvar tema e Termo — 19/11/2026

- **No celular o perfil é uma página só.** As duas metades do perfil (`.profile-public-primary`, `.profile-public-advanced`) e a grade de publicações do perfil social deixam de segurar a rolagem para si (`overscroll-behavior: auto` até 760 px). Elas continuam sendo caixas de rolagem sem nada para rolar, e uma caixa assim, com `contain`, engole o dedo: o perfil social não descia até as publicações.
- **Salvar só o que o perfil ainda tem.** Perfis salvos enquanto o pacote tinha um campo de tema próprio guardavam `cosmeticTheme`; o editor devolvia esse campo e o servidor recusava o salvamento inteiro ("Confira os campos informados."). O editor envia apenas os campos atuais; o servidor lê o campo antigo, descarta e apaga do perfil. Qualquer outro campo desconhecido continua recusado.
- **Equipe com o catálogo inteiro.** Contas de equipe (ADMIN e SUPER_ADMIN) usam qualquer pacote sem depender do nível, para testar e mostrar o catálogo. Estudantes seguem a tabela de níveis.
- **Termo Dev vira letra por letra.** A tentativa jogada volta a girar uma letra de cada vez (0,4 s, 50 ms entre letras); com movimento reduzido aparece pronta. Uma regra quebrada do estilo antigo jogava as letras verdes e amarelas para fora do quadrado: saiu.

## Perfil e moldura rolam como uma peça só no desktop — 19/11/2026

- **Problema.** Em janelas baixas o cartão rolava por dentro de uma caixa fixa enquanto a moldura acompanhava o conteúdo: a caixa ficava parada e a moldura saía do lugar. No cartão compacto apareciam duas barras de rolagem.
- **Uma janela transparente, o cartão é a caixa.** No perfil social e no perfil completo, a coluna do cartão (`.profile-preview-identity`) vira uma janela transparente da altura da sala; quem tem borda arredondada e sombra é o próprio cartão. Quando não cabe, cartão e moldura sobem juntos e só a borda da sala os corta.
- **Cartão compacto.** O popover é uma coluna transparente da altura da tela: o cartão inteiro (com moldura e botão de fechar) rola dentro dela, e nada dentro do cartão rola sozinho. Clicar na coluna vazia fecha, como clicar fora.
- **Cartão compacto do tamanho do conteúdo.** No desktop o cartão compacto tem a altura do que ele mostra e fica no meio da tela: perfil com pouca coisa é cartão curto, sem um vazio até os botões. O botão de fechar entra no fluxo sem ocupar altura e acompanha o canto do cartão, esteja ele centralizado ou rolando. No celular nada mudou.
- **A moldura mora em quem rola o cartão.** O canvas da moldura fica dentro dessa janela, posicionado em volta do cartão, e nunca passa do que a janela já rola (não cria rolagem própria). Ao abrir o perfil completo ele muda de janela junto com o cartão.
- **Barra de rolagem.** A janela do cartão não mostra barra: ela ficaria solta ao lado da moldura. O cartão rola com a roda do mouse, o touchpad, o dedo e o teclado. O conteúdo ao lado (mural, publicações) tem uma linha de 6 px, sem setas, que só aparece com o ponteiro ou o foco em cima (`--profile-bar`).
- **Espaço para a arte.** A sala reserva à esquerda o que a moldura alcança (antes cortava em 44 px); em janelas até 980 px de largura volta aos 44 px para o conteúdo ao lado não apertar. A arte que deriva para o lado do conteúdo some em degradê em vez de terminar numa linha.

## Visto por último na conversa — 19/11/2026

- **A linha embaixo do nome.** No cabeçalho da conversa privada, sob o nome do amigo: "online" enquanto ele está com o Enturma aberto, senão "visto por último hoje às 22:03", "ontem às 23:50", "em 12/11 às 15:30" ou, em outro ano, só a data. Vale no desktop, no celular e nos apps, que usam a mesma tela. A linha se atualiza junto com a lista de amigos.
- **Reveza com o status.** Quando o amigo tem um status personalizado, a linha alterna: o status por uns 4,5 s, depois "online" ou o visto por último, e de volta. A linha que sai sobe e some enquanto a que entra sobe de baixo (com redução de movimento, só troca com um fade curto). Só "online" leva a cor de destaque. Com uma linha só, nada se move. Leitores de tela recebem as duas de uma vez, para o texto não ficar sendo anunciado.
- **Atualização.** Entrar e sair não gera evento, então com a conversa aberta e a aba visível a tela pergunta de novo a cada 20 s por aquele amigo (`/friends/{id}/last-seen`, com a mesma regra de privacidade da lista).
- **De onde vem.** A presença já existia (o soquete de atividade renova uma concessão curta). Agora ela também grava `app_user.last_seen_at`, no máximo uma vez por minuto por pessoa e na hora em que a conexão fecha.
- **Quem vê.** Só amigos aceitos; um convite pendente não mostra online nem visto por último. Em "Privacidade do perfil" há a opção "Online e visto por último", ligada por padrão. Quem desliga deixa de aparecer e também deixa de ver o dos amigos, e o servidor nem envia o dado. Um app antigo que salva o mural sem conhecer a opção não mexe nela.
- **O que a opção não esconde.** Os botões de ligação continuam ativos só quando o amigo está conectado, porque a chamada depende disso; o texto "Online/Offline" ao lado deles saiu, já que a linha sob o nome diz isso.

## Notificações agrupadas, prévia do editor, compartilhar perfil e dois dragões — 19/11/2026

- **Curtidas viram uma linha só.** Curtidas e republicações do Social e curtidas e reações do fórum sobre a mesma coisa chegam como uma entrada: os rostos de até três pessoas (as mais recentes primeiro) e a frase "Ana, Bruno e mais 4 pessoas curtiram sua publicação.". Quem agrupa é o servidor (`NotificationService.inbox`), então web e celular recebem a mesma lista; o contador de não lidas conta entradas, não curtidas, e abrir uma entrada marca o grupo inteiro como lido. Seguir, comentar e pedir para seguir continuam uma por pessoa, com a foto de quem fez.
- **O aviso no aparelho também não repete.** Depois do primeiro aviso de curtida numa publicação, as próximas curtidas na mesma publicação ficam uma hora sem tocar o celular ou o computador; elas continuam entrando na caixa de entrada.
- **A prévia do editor é o perfil de verdade.** Em "Meu perfil", no desktop, a prévia é a mesma sala do perfil aberto, na altura do editor (ele não cresce com o perfil). O cartão tem a altura do que mostra e rola na janela dele junto com a moldura; a coluna ao lado traz o que o visitante encontra (o botão do Social, as abas e o mural no mesmo arranjo) e rola dentro da sala com a barra fina que só aparece com o ponteiro em cima. O botão e as abas da prévia são só figura: não recebem foco nem clique. Na coluna estreita da prévia eles ficam numa linha e somem em degradê na borda. Com o editor estreito o mural desce para baixo do cartão e a sala rola como uma coluna só. No celular a prévia segue como era ("Seu mural").
- **Decoração do avatar saiu.** Anel, brilho e degradê em volta da foto deixaram de existir no editor (web e app do celular) e no desenho do avatar: os pacotes cuidam disso. O servidor continua aceitando o campo antigo de quem já tinha salvo; nenhum app o mostra mais.
- **Compartilhar perfil como se convida para uma sala.** O botão de compartilhar do perfil social abre a mesma folha do convite de sala: a pessoa compartilhada no topo, a lista de amigos com busca e "Enviar para …", e embaixo o link para copiar ou mandar por outro app. O envio usa a conversa privada que já existe (mesma criptografia). Na conversa o link vira um cartão do perfil (banner, foto, nome, @, status e "Ver perfil"); na lista de conversas aparece "Perfil compartilhado" em vez do endereço.
- **Dois dragões, uma estante nova.** "Dragões" reúne o Dragão Imperial, o Dragão da Tempestade (nível 19: escuro, pousa no topo do perfil, nuvens carregadas, chuva e raios azuis) e o Dragão da Lua (nível 21: branca, deitada olhando a lua cheia, névoa, estrelas e uma dragãozinha dormindo em cima da foto). São desenhos próprios, como o resto do catálogo, que passa a ter 31 pacotes em oito estantes. O kit ganhou `spine` e `bodyPath` (um corpo desenhado ao longo de uma curva) e `boltPath` (raio).

## Enturma Journey, fase 1: projetos com detalhe profissional e GitHub — 19/11/2026

Primeira das cinco fases da proposta "Enturma Journey — Portfólio Vivo". As outras (mentor de IA e competências com evidências, linha do tempo, projetos em equipe com colegas e professores, currículo) não começaram.

- **O que um projeto guarda agora.** Além de nome, descrição, link e arquivos: tipo (Faculdade, Pessoal, Código aberto, Pesquisa e extensão), até 12 tecnologias, disciplina, período, resultado, link do repositório separado do link da demonstração, e "Feito em equipe" com "Minha participação". A participação só existe em projeto de equipe e aparece junto do aviso "Projeto em equipe", para o trabalho do grupo não ser lido como autoria individual.
- **Objetivo profissional.** Um campo curto do portfólio (coluna `goal`, migração V83), mostrado no cabeçalho público. Um cliente que não envia o campo (o app do celular antigo) não o apaga.
- **Até 60 projetos, com destaque e arquivo.** O limite de 12 saiu. Até 6 projetos em destaque abrem a lista pública; os demais seguem na ordem que o estudante definiu com subir e descer. Projeto arquivado fica só para o dono: o servidor tira o projeto e os arquivos dele da resposta pública e nega o arquivo pelo endereço público. Os campos novos moram no `jsonb` de projetos que já existia, sem mudar os perfis atuais.
- **Editor em cartões que abrem.** Cada projeto é uma linha com nome, tipo e tecnologias que abre nos campos. Até três projetos, tudo abre pronto para editar; acima disso abre como lista. Projeto sem nome não é enviado: o editor abre o cartão, aponta qual é e põe o foco no campo.
- **Importar do GitHub sem conectar conta.** O estudante digita um usuário do GitHub e o navegador dele consulta a API pública do GitHub (sem token, sem cookies, sem passar pelo servidor do Enturma). Só aparecem repositórios públicos de que o usuário é dono; nada vem marcado. Os escolhidos viram rascunhos com nome, descrição, linguagens (por tamanho), tópicos, estrelas, site e link, e só valem depois de "Salvar portfólio". "Atualizar do GitHub" refaz a consulta de um projeto e não troca texto que o estudante já escreveu.
- **O que o selo do GitHub afirma.** Ele diz de qual repositório público o projeto veio, não que a conta é do estudante: ninguém faz login no GitHub aqui. Por isso um fork é sempre mostrado como "(fork)", o servidor só aceita o selo ao lado do endereço `github.com/dono/repositorio` que ele nomeia, e mudar o link do repositório remove o selo. Provar que a conta é do estudante (e ler repositórios privados) pede um aplicativo OAuth do GitHub, que fica para depois.
- **Página pública.** Objetivo no cabeçalho; destaques primeiro com selo; filtro por tipo quando há mais de um; cada cartão com contexto (tipo, disciplina, período), participação, resultado, tecnologias, "Repositório" e "Abrir projeto". Abrem oito projetos e o resto vem com "Mostrar mais projetos"; ao salvar em PDF todos saem.

## Enturma Journey, fase 2 (parte 1): competências com evidências — 19/11/2026

- **Dois níveis, sem inventar um terceiro.** Uma competência é **demonstrada** quando um projeto ativo do portfólio a mostra, e **declarada** quando só o estudante a informou. "Validada" (por professor ou instituição) não existe ainda: não há quem valide, então a palavra não aparece em lugar nenhum. XP, horas de estudo e sugestões não mudam nível.
- **O que conta como evidência.** Um projeto mostra uma competência se a usa como tecnologia (o nome bate, sem diferenciar maiúsculas) ou se o estudante a ligou ao projeto no cartão dele ("Competências que este projeto demonstra"). Projeto arquivado nunca é evidência, porque o visitante não o vê.
- **No editor.** As competências continuam sendo um campo de texto; embaixo, cada uma mostra na hora se está demonstrada (e em quantos projetos) ou declarada. Tirar uma competência da lista tira também as ligações dos projetos a ela ao salvar.
- **Na página pública.** A seção Competências lista primeiro as demonstradas, cada uma com os projetos que a mostram (o nome leva até o cartão do projeto, abrindo a lista se ele estiver recolhido), depois as declaradas, com uma linha explicando os dois termos.
- **Dados.** A ligação mora no projeto (`skills`, até 12, dentro do `jsonb` que já existia); o nível é calculado a partir disso, nunca gravado.

## Enturma Journey, fase 2 (parte 2): mentor do portfólio e estudo de caso — 20/11/2026

- **O que o mentor faz.** Dentro de cada projeto ativo, "Pedir sugestões ao mentor" devolve uma descrição mais clara, a participação e o resultado reescritos, um estudo de caso curto e até quatro perguntas sobre o que falta contar. Ele reescreve; não avalia, não dá nota e não distribui competências.
- **O que ele recebe.** Só o rascunho daquele projeto (nome, descrição, tecnologias, disciplina, se foi em equipe, participação, resultado) e o objetivo profissional digitado no topo. Nada mais da conta vai junto: nem bio, nem outros projetos, nem estudos, nem arquivos. O texto do estudante entra como dado não confiável, e instruções escritas dentro dele são ignoradas.
- **Nada inventado.** A instrução do modelo proíbe criar tecnologias, números, resultados, prêmios, cargos ou pessoas, e manda perguntar quando falta informação. O servidor reforça onde consegue: se o estudante não escreveu participação ou resultado, a sugestão para esse campo é descartada mesmo que o modelo a devolva. Isso não torna a IA infalível, e por isso o painel pede para conferir cada frase.
- **Sugestão, nunca alteração.** O painel mostra cada texto com "Usar este texto"; só então ele entra no campo, onde continua editável, e "Desfazer" devolve o que estava lá. Nada chega ao portfólio antes de "Salvar portfólio". O painel diz que os textos são gerados por IA.
- **Quando não aparece.** Sem serviço de IA configurado, o mentor simplesmente não é oferecido. Projeto arquivado não o mostra. O botão só habilita com nome e pelo menos uma frase de descrição; o servidor recusa o pedido antes de chamar o modelo se isso faltar. Cada pedido conta no limite diário de IA da conta (o mesmo das outras ajudas).
- **Estudo de caso.** Campo novo e opcional do projeto (`caseStudy`, até 1500 caracteres, no `jsonb` que já existia), escrito pelo estudante ou a partir de uma sugestão aceita. Na página pública aparece no cartão do projeto; textos longos abrem com "Ler inteiro", e a impressão sempre traz o texto completo.
- **Fora desta parte.** O mentor não lê README nem código do repositório, não reescreve a apresentação geral do portfólio e não sugere projetos para destacar. O app do celular preserva o estudo de caso ao salvar, mas ainda não o edita nem chama o mentor.

## Enturma Journey, fase 3: Minha Jornada — 20/11/2026

- **O que é.** Uma linha do tempo do estudante, com registros datados de oito tipos: marco, projeto, trabalho em equipe, disciplina, atividade acadêmica, certificado, conquista e objetivo. Fica no fim da página do portfólio e, para visitantes, numa seção própria da página pública.
- **O estudante decide o que aparece.** Cada registro tem "Mostrar no portfólio público". Sem essa marca ele é só do estudante: o servidor não o entrega a visitantes, e quando entrega não diz de onde o registro veio. Um registro escrito à mão abre com a marca ligada (dá para desligar antes de salvar); um registro vindo de sugestão abre com ela desligada.
- **Sugestões são ofertas, não registros.** O Enturma aponta o que já conhece: projetos ativos do portfólio, atividades do calendário cujo dia já passou (prova, trabalho, apresentação, grupo, evento; aula e bloco de estudo não, por serem rotina) e conquistas. "Revisar e adicionar" abre o formulário preenchido para o estudante conferir; "Dispensar" faz a oferta não voltar. As anotações privadas da atividade nunca entram na oferta.
- **O calendário não tem "concluída".** Nada no produto marca uma atividade como feita, então a oferta é "o dia passou", e quem diz que aconteceu é o estudante ao aceitar. O servidor confere que a origem é do próprio estudante e ainda está em oferta: atividade de outra pessoa, atividade futura ou projeto arquivado não viram registro, e a mesma origem não entra duas vezes.
- **Datas.** O registro guarda um dia; a tela mostra mês e ano. Semestre é calculado do dia (janeiro a junho, julho a dezembro). Projeto com período "2026.1" é sugerido em março daquele ano, "2026.2" em agosto; sem período, usa a última atualização do GitHub; sem nenhum dos dois, o formulário pede a data. Objetivos podem ficar até dez anos à frente.
- **Salvo na hora.** A jornada não faz parte do "Salvar portfólio": cada registro é gravado quando o estudante salva o formulário dele, e a seção avisa isso. Remover pede uma segunda confirmação no próprio registro, porque não há como desfazer.
- **Página pública.** Trilho vertical por semestre, mais recente primeiro; filtro por semestre quando há mais de um; oito registros abertos e o resto em "Mostrar a jornada inteira"; a impressão traz tudo. Registro que veio de um projeto visível leva ao cartão dele. Objetivo aparece como ponto vazado no trilho, por ainda não ter acontecido.
- **Dados.** Tabelas `portfolio_journey_entry` e `portfolio_journey_dismissal` (migração V85), até 200 registros por estudante. Entram na exportação de dados pessoais e são apagadas na exclusão da conta.
- **Fora desta fase.** Disciplinas cursadas não são sugeridas (o cadastro não tem data nem situação). O app do celular ainda não mostra nem edita a jornada. O mentor de IA não escreve registros.

## Portfólio: projetos fechados por padrão — 20/11/2026

- **A página abre como lista.** Todo projeto começa fechado, com nome, tipo, repositório e tecnologias na linha; o estudante abre o que quer conferir. Antes, portfólios com até três projetos abriam tudo de uma vez, o que escondia a lista atrás de formulários.
- **Importar não abre nada.** Projetos vindos do GitHub entram como linhas fechadas. Só o projeto em branco criado em "Adicionar projeto" abre sozinho, porque precisa de um nome.
- **Salvar recolhe.** Depois de "Salvar portfólio", os projetos voltam a ser lista. Se faltar nome em algum, só esse abre para ser corrigido.

## Enturma Journey, fase 4: equipe e compartilhamento — 20/11/2026

- **Quem fez junto.** Em um projeto marcado como "Feito em equipe" e já salvo, o autor usa "Marcar colega" e escolhe entre os amigos do Enturma. Só amigos, para ninguém receber convite de equipe de desconhecido; até 12 por projeto.
- **Marcar não é publicar.** O colega marcado fica como "Aguardando resposta" e não aparece para visitantes. Só depois de aceitar o nome dele entra no cartão público do projeto, e o texto sobre a parte dele é o que ele escreveu: o autor não escreve pela outra pessoa. Quem recusa não pode ser convidado de novo para o mesmo projeto.
- **O lado de quem foi marcado.** O portfólio dele ganha a seção "Projetos em equipe" (só existe quando há convite ou participação): aceitar ou recusar, escrever e corrigir a própria participação, sair da equipe com segunda confirmação. Uma notificação avisa do convite.
- **Levar para o próprio portfólio.** Quem aceitou pode "Adicionar ao meu portfólio": entra uma cópia com nome, descrição, tipo, tecnologias, disciplina, período e links, marcada como projeto em equipe e com a participação dele. Arquivos, estudo de caso, resultado e competências do autor não vão. A cópia guarda de quem é o projeto; se ele sair da equipe ou o autor arquivar, a cópia fica mas deixa de listar a equipe.
- **Autoria não se confunde.** No cartão público, "Minha participação" é do dono da página, e a lista "Com" traz as outras pessoas com a parte de cada uma. Na cópia de um integrante, o autor aparece na lista com a participação dele. O nome leva ao portfólio da pessoa só quando esse portfólio é público.
- **Garantido no servidor.** Só o próprio marcado responde ao convite; o vínculo da cópia com o projeto de origem só é mantido enquanto existir participação aceita (forjar o vínculo no salvar não funciona); visitantes não recebem ids de usuário. Projeto que sai do portfólio leva os registros de equipe junto. A tabela `portfolio_project_member` (V86) entra na exportação de dados e é apagada na exclusão da conta.
- **Compartilhar.** Na página pública, "Compartilhar" no topo (portfólio) e em cada projeto abre a mesma folha do compartilhamento de perfil: enviar a amigos pela conversa privada, copiar o link, compartilhar em outro app e LinkedIn (a página de compartilhamento do próprio LinkedIn, que só recebe o endereço). Visitante sem login vê só as saídas por link.
- **Publicar no Enturma Social.** Para o dono, a folha de um projeto tem "Publicar no Enturma Social": abre uma nova publicação com o link do projeto já vinculado, e ele escolhe a mídia e publica como qualquer post. Só projetos ativos de um portfólio público podem ser vinculados; a lista "Vincular projeto do meu portfólio" do editor do Social deixou de oferecer arquivados.
- **Fora desta fase.** Feedback e validação de professor (deixado de fora a pedido). Convidar quem não é amigo ou não tem conta. Cartão de prévia do projeto dentro do post e marcação automática da equipe na publicação. O app do celular preserva o vínculo da cópia ao salvar, mas não mostra convites nem equipe.

## Enturma Journey, fase 5: currículo e carreira — 20/11/2026

- **Página própria.** `/portfolio/curriculo`, com os controles de um lado e a folha do outro (no celular, um embaixo do outro). Chega-se por "Currículo", na linha de seções do portfólio, ou por "Montar currículo" ao lado de "Salvar portfólio".
- **Nada novo é escrito.** O currículo é montado com o que já está no portfólio e na jornada: projetos ativos, competências, registros da jornada (objetivos ficam de fora, por não serem experiência). O estudante marca o que entra; o que não está marcado não aparece. Objetivo e resumo começam com os do portfólio e podem ser ajustados só para o currículo.
- **Quatro modelos, os mesmos fatos.** Estágio, Primeiro emprego, Acadêmico e Tecnologia mudam a ordem e alguns títulos das seções. O de Tecnologia junta às competências as tecnologias dos projetos escolhidos, sem repetir.
- **Feito para ser lido por sistemas de recrutamento.** Uma coluna, texto de verdade, títulos comuns, fonte padrão, sem ícones, fotos ou tabelas, preto no branco. "Usar a cor do meu perfil nos títulos" é a única variação visual, e é opcional.
- **Contato é do currículo.** E-mail, telefone, cidade, LinkedIn, GitHub e site ficam guardados com as escolhas do currículo (`portfolio_resume`, V87) e aparecem só na folha e no PDF. Não existe rota pública para esses dados e o portfólio público não os recebe. Links só passam se forem http(s).
- **Saídas.** "Baixar em PDF" usa a impressão do navegador, que nessa página imprime somente a folha, em A4 com margens. "Copiar como texto" entrega o mesmo conteúdo em texto simples, para formulários de vaga e campos de perfil. "Compartilhar portfólio no LinkedIn" leva o link do portfólio público, e só aparece quando ele é público.
- **Editor do portfólio mais fácil de percorrer.** A página ganhou uma linha fixa de seções (Apresentação, Competências, Projetos, Jornada, Currículo). O botão "Gerar PDF pelo navegador" saiu do editor: ele imprimia o formulário; o PDF agora é o do currículo, e a página pública continua com "Salvar em PDF".
- **Fora desta fase.** A IA não escreve nem reordena o currículo. Formação é digitada (não vem do cadastro acadêmico). Não há envio do PDF para o LinkedIn nem candidatura a vagas: o LinkedIn recebe só o link. O app do celular não tem a página do currículo.

## Nível no perfil — 20/11/2026

- **Dois tamanhos.** No cartão do perfil, ao lado do @, um selo redondo com o número do nível e um anel que mostra o progresso. No mural, no lugar das fichas "Nível" e "XP", o mostrador completo: emblema com o número, barra do XP dentro do nível, "201 de 250 XP" e "Faltam 49 XP para o nível 16", com a sequência de dias logo abaixo.
- **O XP de hoje é um trecho à parte.** O que foi ganho no dia aparece mais claro na ponta da barra, com a ficha "+60 XP hoje". Ao abrir o perfil, a barra parte de onde o dia começou e sobe até onde está, com o número contando junto. Se o nível veio hoje, a barra sobe do zero e aparece "Subiu de nível hoje".
- **Toda vez que o XP sobe, na hora.** Quando o estudante ganha XP, o servidor avisa as telas dele (evento `xp_changed`, só para o próprio estudante e depois de o ganho estar gravado). O perfil dele, se estiver aberto, busca os números de novo: a barra continua de onde estava, o número conta até o novo valor e um "+40 XP" pousa na borda de cima do mostrador por uns segundos. O selo ao lado do @ e a sequência de dias acompanham. Fora isso, cada abertura do perfil no dia repete a subida do trecho de hoje.
- **Só o próprio perfil é ao vivo.** Quem está vendo o perfil de outra pessoa continua com os números de quando abriu: o aviso não sai para terceiros, para não transformar o perfil num indicador de atividade em tempo real.
- **Só anima quando dá para ver.** A subida espera o mostrador entrar na tela e a abertura do aplicativo sair da frente; antes disso a barra fica parada no ponto de partida. Com movimento reduzido, o mostrador aparece pronto, sem animação.
- **Cores do próprio perfil.** Barra e emblema usam a cor principal e a secundária do perfil; o número fica sobre fundo escuro para ser lido com qualquer cor escolhida.
- **De onde vêm os números.** O servidor passou a enviar, junto do nível, o XP dentro do nível, o tamanho do nível (250) e o XP ganho hoje, somado dos registros de XP do dia no fuso da rotina do estudante. Quem escondeu as estatísticas na privacidade do perfil continua sem mostrador nem selo.
