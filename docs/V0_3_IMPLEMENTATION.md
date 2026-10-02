# Enturma v0.3.0 — implementação e gates

Base main `937a3be`; branch `codex/enturma-v0.3.0`. Um único PR, squash somente após fechar os gates de produção.

## Implementado

- Perfil 2.0, privacidade, widgets, badges e conquistas calculadas no servidor com XP idempotente.
- Catálogo UFMG: 43 optativas adicionais da fonte oficial existente, sem inventar semestre.
- Registry de desafios acadêmicos fora de TI, missões diárias e treino.
- Salas rápidas/com vários dias, presença, grace period, reservas, encerramento, preferências e outbox.
- CallSessionProvider global, mídia persistente entre rotas, sala com painéis, typing efêmero e mensagens enriquecidas.
- Automod público com auditoria, revisão humana, recurso, bloqueio de domínios e cards Monitor Enturma. Classificador opcional não pune.
- Bridge Desktop, UI de atualização, NSIS e ZIP compatível no formato; download oculto no Electron.
- Expo com abas, perfil, salas, fórum, cadernos, caronas, chamadas persistentes e configuração APK/AAB/iOS.

## Evidência local

- 64 testes Java aprovados; migrations V1–V25 em banco de teste limpo.
- 9 fluxos Playwright aprovados (6 na suíte + 3 com banco E2E configurado), incluindo dois Chromium com mídia LiveKit real, navegação e screen share.
- 23 testes Web, 5 Desktop e 4 de sessão mobile.
- Typecheck Web/mobile e lint Web. Bundles Hermes Android/iOS; prebuild Android; NSIS/ZIP Windows.
- IA de cadernos no E2E usa provedor local controlado; não é homologação de qualidade de um modelo externo.

## Publicação e limites

- Recuperação assistida para Desktop 0.2.0 via instalador oficial; não exige apagar conta ou dados. A primeira recuperação não é silenciosa. O novo iniciador e as próximas atualizações foram validados com instalação real.
- PR #21 será publicado com squash único e verificação Vercel/SquareCloud/Railway; sem Actions.
- Android/iOS: configuração e bundles preparados. Assinatura, lojas e homologação em aparelhos físicos permanecem etapas próprias; downloads não anunciados sem artefato.

Nenhuma credencial, banco de teste ou binário local entra no Git.
