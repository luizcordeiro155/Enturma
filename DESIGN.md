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
