# Enturma Social 3 - editor visual e release

> Executar com superpowers:executing-plans. Pedido de 11/11/2026 autoriza publicar na main depois da validacao.

**Goal:** Editor visual com miniaturas, arraste, cortes e textos temporizados, capas e enquadramento de fotos, Social atualizado continuamente, comentarios/compartilhamento, lives autorizadas e correcao de temas, avatar, teclado e abertura.
**Architecture:** Preservar Next/React, API Java, R2 privado, worker FFmpeg e LiveKit existentes. Extensoes retrocompativeis; migrations aditivas. Dados e permissoes reais. Mesma web compartilhada por WebView Android e Electron.
**Spec:** ../specs/2026-11-11-enturma-social-3-design.md mais pedido atual. Publicacao autorizada; o escopo antigo 'frontend somente' nao se aplica a extensoes de API explicitamente solicitadas.

## Global constraints
- Preservar historico da PR 148; sem force-push. Main so recebe revisao validada.
- Video final ate 90 s. Original maior e permitido para corte; limites de bytes/CPU continuam necessarios e explicitos, nunca promessa de ilimitado.
- Usar componentes e tokens existentes. Texto sobre video fica branco com sombra independente do tema; superficies claras usam tinta escura.
- Preservar privacidade, contas privadas, bloqueios, cifragem de DMs e autorizacao de todas as midias.
- Gestos tambem tem controles de teclado acessiveis; respeitar reducao de movimento.
- Novas publicacoes aparecem sem mudar o Clip atual nem deslocar a leitura. Nao inventar videos quando nao ha conteudo permitido.

## Tasks
1. Baseline/QA: fonte e dependencias isoladas; testes, capturas atuais e contrato visual. Nenhum segredo no artefato.
2. Editor: regras puras de geometria/recorte/timeline testadas primeiro; miniaturas reais e controles pointer, capas por quadro/galeria, fotos com proporcoes e arraste; texto com posicao e duracao.
3. API/worker: receita retrocompativel, formatos, capas privadas e testes de limites, propriedade e exportacao real. Migracao aditiva se necessaria.
4. UI: avatar com largura/altura iguais e flex:none; acoes sem caixas, temas, logo canonica, abertura fullscreen, folhas com teclado/gesto/animacao.
5. Feed/compartilhamento: eventos existentes + refresh discreto, merge sem duplicacao, novas midias sem recarregar, revalidacao ao reciclar; grid de destinatarios e cartoes autorizados nas DMs; seletor de emoji/GIF existente em comentarios.
6. Lives: estado persistido, autorizacao via SocialAccess, LiveKit com publisher/spectator separados, heartbeat/reconciliacao, anel animado, chat efemero, encerrar/reconectar; feature flag controla ativacao.
7. QA/release: lint, tipos, unidade, build, CI Java/E2E, capturas mobile/desktop/claro/escuro. Corrigir falhas; remover workflow temporario; publicar main e verificar Vercel/SquareCloud/worker.

## Review focus
- Arraste de timeline nao vira gesto de pagina; um unico undo por gesto; capa acompanha tempo de saida apos cortes.
- Falha de upload preserva original e rascunho; nunca anunciar publicacao antes da API.
- Nenhum GIF/cover/card/live pode revelar conteudo privado a quem perdeu acesso.
- Atualizacao do stream nao troca o video assistido; hide/delete invalida copias.
- Teclado nao redimensiona o fundo do Social; compositor permanece acima dele sem interferir nos chats existentes.
