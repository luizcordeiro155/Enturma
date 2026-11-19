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
