# Enturma Social 3 — design

Data: 11/11/2026. Base: `main` em `07f87a9` (Social 2.0 ativo em produção, ver [STATUS](../../STATUS.md)).

## Objetivo

Dar ao Enturma Social a experiência de uso que estudantes já conhecem das redes de foto e vídeo curto: feed centrado em mídia, Clips em tela cheia com rolagem contínua, Stories de toque, perfil em grade, descoberta, mensagens, ferramentas de criação e interações ao vivo. Vale para Web, Android (WebView) e Desktop (Electron), em celular e em desktop.

**Sucesso:** um estudante que nunca abriu o Social consegue, sem instrução, rolar o feed, assistir Clips em sequência, ver Stories, publicar foto/vídeo/Story, achar pessoas e assuntos, conversar e reagir, no celular e no desktop.

## Pedido e suposições

Pedido pelo responsável:

- As cinco partes abaixo entram na mesma atualização.
- Feed, Clips e rolagem contínua funcionam como nas redes de referência.
- Responsivo no celular e no desktop.
- Gestos no celular: no Feed, arrastar da esquerda para a direita abre Clips; da direita para a esquerda abre Criar. Em Clips, arrastar da direita para a esquerda volta ao Feed.

Suposições desta spec (corrigir se estiverem erradas):

- A identidade visual continua sendo a do Enturma ([DESIGN](../../../DESIGN.md)). Replica-se o funcionamento, não marca, ícones ou telas de terceiros.
- Mensagens diretas continuam restritas a amigos, que é a regra do chat cifrado atual.
- Não há catálogo de música comercial. Sons são áudios originais de Clips do próprio Enturma.
- Lives ficam atrás de uma flag própria e não são gravadas.
- Não existe API de homologação; partes com backend são validadas na CI antes do release.

## Fora de escopo

Música licenciada, efeitos de rosto (AR), recomendação por aprendizado de máquina, anúncios e loja, gravação/replay de lives, streaming adaptativo (HLS), DM para não amigos, novos instaladores nativos (salvo se um recurso exigir).

## Entrega

- Branch de release `feat/social-3`. Cada parte entra por PR própria nessa branch, com CI verde. Um único merge na `main` ao final: uma atualização para os usuários e um único reinício da API.
- Migrations só aditivas (V71 em diante). Nenhuma tabela existente é alterada de forma destrutiva.
- `SOCIAL_LIVE_ENABLED` (padrão `false`) controla lives. `capabilities` passa a informar `live`.
- Rollback: flags existentes (`SOCIAL_ENABLED`, `SOCIAL_MEDIA_ENABLED`) e a nova. Tabelas e objetos nunca são apagados no rollback.
- A parte 1 é só frontend e pode ser revisada pelo preview da Vercel, contra a API de produção.

## Navegação, gestos e responsividade

**Ambientes:** Feed, Explorar, Criar, Clips, Perfil. Mensagens e notificações ficam no topo do Feed, com contador de não lidas. A saída para o início do Enturma permanece.

**Faixas de largura:**

| Largura | Navegação | Conteúdo |
| --- | --- | --- |
| até 767 px | barra inferior com cinco itens, respeitando safe areas | uma coluna, mídia de ponta a ponta |
| 768 a 1199 px | trilho lateral só com ícones | coluna central de leitura |
| 1200 px ou mais | trilho lateral com rótulos | coluna central e coluna lateral de sugestões |

Clips no desktop ocupam uma coluna 9:16 centralizada, com setas, roda do mouse e teclado. Diálogos viram painéis laterais no desktop e folhas inferiores no celular.

**Gestos horizontais no celular** (ordem das páginas: Clips, Feed, Criar; o Feed fica no meio):

- Feed: arrastar para a direita abre Clips; arrastar para a esquerda abre Criar.
- Clips: arrastar para a esquerda volta ao Feed. Arrastar para a direita não faz nada.
- Criar: arrastar para a direita volta ao Feed. O rascunho é preservado, sem confirmação.
- A página acompanha o dedo. A troca confirma ao passar de 25% da largura ou com velocidade suficiente; caso contrário, volta.
- O eixo é travado nos primeiros pixels: movimento vertical dominante cancela o gesto horizontal. Em Clips, vertical troca de vídeo e horizontal troca de ambiente.
- O gesto não começa em carrosséis, listas horizontais, campos de texto, controles de linha do tempo, diálogos abertos nem nos 28 px das bordas da tela (gesto de voltar do sistema).
- Todo gesto tem alternativa por botão na barra de navegação. Com movimento reduzido, a troca é imediata.

## Parte 1 — telas principais (frontend)

Usa a API existente. Unidades novas ou reescritas, cada uma com uma responsabilidade:

| Unidade | Responsabilidade | Depende de |
| --- | --- | --- |
| `social-pager` | Páginas Clips/Feed/Criar, gesto horizontal, estado preservado de cada página | `lib/social` (regra do gesto, testável sem DOM) |
| `social-feed-card` | Um post no feed: autor, mídia, ações, legenda, prévia de comentários | `social-media-carousel`, `socialWrite` |
| `social-media-carousel` | Uma ou mais mídias com proporção reservada, pontos, deslize e setas | `mediaUrl` |
| `social-clips` | Página de Clips em tela cheia, um vídeo ativo, ações laterais | `useSocialStream` |
| `social-story-viewer` | Stories em tela cheia, progresso, toques, resposta | API de Stories |
| `social-profile` | Cabeçalho, destaques e grades por aba | API de pessoas e feed por autor |
| `social-comments` | Painel de comentários com respostas e campo fixo | API de comentários |
| `social-create-flow` | Etapas escolher/gravar, editar, detalhes, publicar | editor e captura existentes |

Comportamentos:

- **Feed:** coluna única; mídia de ponta a ponta com proporção entre 1,91:1 e 4:5; carrossel com pontos; duplo toque curte com animação; vídeo toca sem som quando 60% visível e pausa ao sair; legenda recolhida com "mais"; "ver todos os N comentários"; tempo relativo; puxar para atualizar no celular; esqueletos durante a carga; aviso discreto de novas publicações sem deslocar a leitura (regra atual).
- **Clips:** cada Clip ocupa a área útil inteira com encaixe ao rolar; um único vídeo ativo; toque pausa, duplo toque curte; ações à direita (perfil com seguir, curtir, comentar, enviar, salvar, mais); autor, legenda e som embaixo; barra de progresso; som ligado/desligado lembrado na sessão; pré-carga apenas do vizinho; abas "Para você" e "Seguindo".
- **Stories:** bandeja com anel para não vistos; visualizador em tela cheia com barras segmentadas; toque à direita/esquerda avança/volta; segurar pausa; deslizar para baixo fecha; deslizar na horizontal troca de autor; campo de resposta e reações rápidas embaixo.
- **Perfil:** avatar, contadores reais, bio, seguir/mensagem; destaques; abas Posts (grade 3 colunas), Clips (grade 9:16), Republicações, Marcados; tocar abre a publicação no contexto da lista.
- **Criar:** etapas com envio em segundo plano e indicador de progresso; a pessoa pode voltar ao Feed enquanto processa. Falha preserva o rascunho.

## Parte 2 — Explorar

- `GET /social/explore?cursor=`: grade mista de posts e Clips públicos, ordenada por engajamento recente (curtidas, comentários, republicações e conclusões nos últimos 7 dias, com decaimento por idade). Exclui autores bloqueados, silenciados, contas privadas não seguidas e publicações ocultadas pela pessoa.
- `GET /social/tags/trending`: até 20 hashtags por número de publicações públicas distintas em 7 dias.
- `GET /social/tags?q=`: busca de hashtags por prefixo, com contagem.
- Página de hashtag reutiliza `GET /social/feed?q=#tag`.
- Busca com abas Contas, Tags e Publicações; buscas recentes ficam só no aparelho.

## Parte 3 — ferramentas de criação

- **Filtros:** sete aparências fixas: original, vívido, quente, frio, P&B, desbotado e contraste. Prévia por CSS no cliente; exportação equivalente por filtros do FFmpeg no worker. `VideoRecipe` ganha `filter`; imagens ganham o mesmo campo.
- **Velocidade:** `VideoRecipe.speed` de 0,5 a 2. A duração exportada considera a velocidade e continua limitada a 90 s. Áudio acompanha a velocidade sem mudar o tom.
- **Figurinhas de Story:** `story_overlays` passa a aceitar elementos tipados: `TEXT` (atual), `POLL` (2 a 4 opções), `QUESTION`, `MENTION`, `HASHTAG`. Tabelas novas `social_story_poll_vote` e `social_story_answer`. Um voto por pessoa; resultados agregados visíveis a quem votou; quem votou em quê e as respostas são visíveis só ao autor.
- **Sons:** publicar um Clip com áudio cria um `social_sound` (áudio extraído no worker). "Usar este áudio" abre o editor com o som escolhido; a receita ganha `soundId` e `soundVolume`, e o worker mistura ou substitui o áudio. Página do som lista os Clips que o usam. O autor pode impedir a reutilização do seu áudio.
- O protocolo do worker passa a aceitar um segundo arquivo opcional no mesmo pedido (som ou vídeo original do dueto), com os mesmos limites e validações.

## Parte 4 — mensagens

- Ambiente Mensagens dentro do Social reutilizando o chat privado cifrado e seus componentes; nada muda no modelo de chaves.
- Enviar post, Clip ou Story para amigos gera um cartão com miniatura e autor na conversa. A miniatura só carrega se quem recebe tem permissão de ver a publicação.
- Resposta e reação a Story chegam como mensagem na conversa com o autor.
- Contador de não lidas no ícone de Mensagens.
- Botão Mensagem no perfil: abre a conversa se forem amigos; caso contrário, oferece o pedido de amizade.

## Parte 5 — interações avançadas

- **Curtir comentário:** tabela `social_comment_like`; contagem e estado no retorno dos comentários.
- **Reações em Story:** seis reações rápidas; contam para o autor e geram mensagem.
- **Dueto:** grava ou importa um vídeo ao lado do Clip original; o worker monta lado a lado em 720×1280. `social_post.duet_of` guarda a origem, com crédito visível. Preferência `allowDuets` no perfil; conta privada nunca permite.
- **Lives:** `social_live` (anfitrião, título, estado, início, fim, pico). `POST /social/live` inicia; `POST /social/live/{id}/token` entrega credencial LiveKit somente de assinatura para espectadores; `POST /social/live/{id}/end` encerra; `GET /social/live` lista as ativas visíveis. Chat e corações usam o canal de dados da sala e não são persistidos. Anel "ao vivo" na bandeja de Stories e notificação aos seguidores com aviso ativado. Uma live por anfitrião; encerramento automático sem anfitrião por 60 s.

## Recomendação e rolagem contínua

- "Para você" continua determinístico: seguidos, interesses, engajamento recente, tempo assistido (só com o consentimento já existente) e recência, com a diversidade por autor atual.
- Em Clips, quando os candidatos novos acabam, a API continua com Clips mais antigos ainda permitidos, marcando a página como reciclada; o cliente não exibe "fim" enquanto houver conteúdo.

## Privacidade e autorização

- Todo endpoint novo passa por `SocialAccess`: autor ativo, bloqueio nos dois sentidos, conta privada e relação aceita. O cliente nunca concede permissão por flag.
- Explorar, tendências, sons e duetos só consideram publicações públicas.
- Lives de conta privada só para seguidores aceitos; pessoas bloqueadas não recebem credencial. Lives podem ser denunciadas pelo fluxo de denúncias existente.
- Votos, respostas e reações entram na exportação e na exclusão de conta.
- Mensagens privadas continuam fora dos sinais de recomendação.

## Erros

- Estados reais: sucesso só depois da confirmação da API; erros ficam visíveis e não apagam o que a pessoa escreveu.
- Mídia que falha no processamento mantém o rascunho e oferece nova tentativa.
- Sem rede: Feed e Clips mostram o que já carregou e um aviso; ações ficam desabilitadas em vez de falhar em silêncio.
- Live: queda do anfitrião mostra "reconectando"; fim da live fecha o player com mensagem.

## Testes

- **Unidade (Vitest):** regra do gesto e do travamento de eixo, proporção de mídia, estado do carrossel, duração com velocidade, tipos de figurinha, deduplicação de páginas.
- **Integração (Spring):** autorização e privacidade de cada endpoint novo, idempotência de voto e curtida, tendências, reciclagem de Clips, duetos desativados, credencial de live para bloqueado/privado.
- **Mídia (FFmpeg real):** filtro, velocidade, mistura de som e dueto lado a lado, com limites de duração e tamanho.
- **E2E (Playwright), em 390 e 1440 px:** gestos entre Clips/Feed/Criar, rolagem contínua, Stories por toque, perfil em grade, comentários, criação em etapas, Explorar, mensagens com cartão, enquete e pergunta, dueto; sem overflow horizontal.
- **Regressão:** suíte existente inteira. **Produção:** conferência manual após o release, registrando o que foi e o que não foi conferido.

## Riscos e limites

- A API tem 1 GB de memória e o worker processa uma mídia por vez; uso simultâneo alto vai enfileirar.
- Lives dependem da capacidade e do custo da instância LiveKit; por isso a flag separada.
- Sem API de homologação, as partes 2 a 5 só são navegáveis pelo responsável depois do release.
- Moderação de conteúdo, inclusive ao vivo, continua sendo responsabilidade operacional do responsável.

## Documentos a atualizar no release

[DESIGN](../../../DESIGN.md), [UX-CONTRACT](../../../UX-CONTRACT.md), [SOCIAL_2_IMPLEMENTATION](../../SOCIAL_2_IMPLEMENTATION.md), [STATUS](../../STATUS.md) e [API](../../API.md).
