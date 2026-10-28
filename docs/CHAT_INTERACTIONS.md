> Atualização 27/10/2026: conversas privadas usam custódia cifrada por conta para sincronização automática; não anunciar E2EE inacessível ao servidor. A implementação e os limites atuais estão em [Privacidade do chat](CHAT_PRIVACY.md) e [Revisão desta entrega](RELEASE_PUBLIC_START_SECURITY.md).

# Conversas, emojis e navegação

As mensagens de amigos e salas usam o mesmo menu: clique com o botão direito ou nas reticências no computador; toque prolongado ou reticências no celular. O menu oferece cópia, reação, edição da própria mensagem e exclusão. Nas salas também permite responder. Editar e excluir para todos seguem as permissões da API; a moderação da sala mantém sua autorização existente.

**Excluir para todos** remove o conteúdo e as reações, preservando um marcador de mensagem removida para sincronizar os dispositivos. **Excluir para mim** grava a ocultação na conta, sem afetar os demais participantes; sair e entrar novamente não restaura a mensagem. O segundo passo sempre oferece **Cancelar**. As tabelas e colunas da migration V43 são aditivas e compatíveis com os clientes anteriores.

O conteúdo e as imagens compatíveis das conversas privadas são cifrados no cliente. A sincronização atual usa custódia recuperável pela API, portanto não garante E2EE inacessível ao serviço. As reações são metadados visíveis ao servidor, como remetente e horário; não são texto cifrado. O servidor valida cada sequência contra o catálogo Unicode e aplica a autorização da conversa antes de qualquer alteração.

O seletor carrega o catálogo Emojibase 17 em português somente ao abrir. Oferece pesquisa sem distinção de acentos, categorias, tons de pele, recentes locais e uma seleção de emojis com movimento. Mensagens de até três emojis podem ser exibidas em destaque; os movimentos são finitos e respeitam a preferência de animação reduzida. O fórum utiliza o mesmo catálogo de reações. A licença está em `EMOJI_LICENSE.txt`; `node scripts/generate-emoji-reactions.cjs` regenera a lista aceita pelo servidor quando a dependência mudar.

Voltar fecha o menu/seletor ou a imagem antes de sair da conversa. Escape fecha no desktop, Tab permanece dentro do menu, e o foco retorna à origem. O visualizador oferece pinça e arraste, roda do mouse, duplo clique e atalhos `+`, `-`, `0` e setas. O zoom fica entre 1× e 5×. A viewport móvel evita zoom da página e dos campos; o zoom de imagens é independente. Navegadores que ignoram a restrição da viewport podem manter seus recursos de acessibilidade.

Web, Electron e o WebView móvel usam estes componentes compartilhados. Não há alteração do binário nativo nesta entrega. A verificação automatizada cobre Chromium desktop e emulação com toque (incluindo eventos reais de pinça via CDP); a emulação não substitui uma rodada manual em aparelhos Android/iOS e no aplicativo desktop instalado.

---

## Nota de atualização — 25/10/2026

Este documento preserva o contexto técnico do release em que foi escrito. Para funcionalidades atuais até a PR #104 e migrations V63, use [Estado atual](STATUS.md), [Arquitetura](ARCHITECTURE.md), [API](API.md), [Segurança](SECURITY.md), [Mobile](MOBILE.md) e [Desktop](DESKTOP.md). Entre as atualizações posteriores estão identidade acadêmica, Caronas, chats/figurinhas, KLIPY com busca, Cadernos IA, animações Remotion e melhorias em instaladores. A existência de código não comprova homologação em produção/aparelhos físicos.
