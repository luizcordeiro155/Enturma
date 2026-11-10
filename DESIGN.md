# Enturma — contexto visual

## Overview

Comunidade acadêmica em português brasileiro, com a identidade de livro, verde e lima já existente. O Social é uma área de produto: autoria, mídia e ações prevalecem sobre decoração. O Fórum mantém sua identidade e sua navegação.

## Colors

A fonte canônica são as variáveis de `apps/web/src/app/globals.css` e os adaptadores de tema existentes. Usar `--bg`, `--surface`, `--soft`, `--ink`, `--muted`, `--accent`, `--on-accent` e `--border`; nenhuma paleta paralela. Claro, Escuro, Enturma e Sistema preservam alto contraste e preferências.

## Typography

Preservar as famílias do aplicativo. Títulos curtos e legíveis, corpo confortável para leitura, legendas com contraste verificável. Não carregar novas fontes para o Social.

## Layout

Feed central de leitura, coluna contextual em telas largas, Stories horizontais e Clips verticais. Uma barra local mantém Feed, Clips e Criar visíveis sem substituir a navegação principal. Cada aba retém sua própria posição. O editor prioriza prévia e timeline; controles têm alternativa ao arraste.

## Elevation & Depth

Usar superfícies e bordas existentes. Dialog nativo modal, backdrop discreto, rolagem interna e safe areas. Movimento acompanha mudanças reais, pausa em segundo plano e respeita redução de movimento.

## Shapes

Avatares circulares, mídia com proporção reservada, controles e cartões com raios compatíveis com os componentes existentes.

## Components

Reutilizar Shell, Avatar/UserIdentity, Feedback, playMotion, RoomArtwork, RoomSharePanel, NavigationLink e o cliente autenticado api. O ícone de verificação social sempre inclui nome acessível e não substitui o selo acadêmico.

## Do's and Don'ts

Não criar números, seguidores, publicações ou aprovação fictícios. Não mudar páginas alheias ao Social. Não iniciar dois vídeos simultaneamente nem tornar gestos a única forma de navegação.
