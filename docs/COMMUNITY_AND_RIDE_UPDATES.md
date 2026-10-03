# Fórum e acompanhamento de caronas

O fórum fica em `/forum`, com publicações por assunto, pesquisa textual em português, ordenação por data/votos/relevância, posts semelhantes, comentários encadeados (até quatro níveis), votos e reações. O autor pode editar ou excluir; moderadores podem excluir e recebem denúncias pelo fluxo existente. Excluir um comentário preserva suas respostas; excluir um post remove a discussão e as reações. Bloqueios entre usuários também se aplicam ao fórum. Código é exibido como texto, sem executar HTML.

O início exibe quatro destaques abaixo das salas abertas. `/api/v1/forum/highlights` seleciona posts dos últimos 30 dias pela soma de votos positivos e reações, desempata pela data mais recente e respeita os mesmos bloqueios e status dos autores. Os cartões mostram autor, resumo, curtidas, reações e comentários; a prévia atualiza a cada minuto enquanto a página está visível e ao retornar à aba. Não há conteúdo fictício quando o fórum está vazio.

Criar uma oferta, publicar uma busca ou demonstrar interesse redireciona para `/caronas/matches`. A conexão autenticada `/ws`, com escopo `rides`, envia apenas invalidações após a confirmação da transação. A interface busca novamente os dados autorizados. Publicações novas atualizam a lista e aceites abrem a celebração para ambos, inclusive durante a navegação por outras páginas.

Ofertas com vagas e solicitações pendentes aparecem no painel de busca. Na página de caronas há uma animação de radar; nas demais páginas privadas há um indicador inferior que pode ser minimizado. Ele não representa localização GPS nem promete um motorista: o aceite continua sendo feito pelos participantes. Buscas saem do painel ao cancelar, completar, preencher as vagas ou passar o horário de saída.

As animações usam a Web Animations API em JavaScript, respeitam movimento reduzido e param quando a aba fica oculta. A conexão é mantida durante a navegação. Quando ela cai, há reconexão com espera progressiva e atualização de contingência a cada cinco segundos. A celebração é lembrada por usuário no navegador para evitar repetição depois de dispensada.

A migração V18 cria as tabelas e índices do fórum automaticamente no boot. Não são necessárias novas variáveis de ambiente. A publicação usa GitHub → sincronização nativa SquareCloud e Vercel, sem depender de Actions.

Validação: testes da API cobrem busca, bloqueios, autoria, votos idempotentes, reações, respostas, exclusões e notificações após commit. Playwright verifica a chegada de uma nova carona em outra sessão sem reload, redirecionamento, indicador durante navegação, celebração nos dois usuários, conversa e o fluxo completo do fórum em desktop/mobile.


## Otimizações de tempo real

O transporte de caronas no Web/Desktop/WebView usa uma única conexão WebSocket por aba, compartilhada pelos componentes que precisam de atualização. Ao receber `rides_changed`, o cliente invalida imediatamente os caches de `/rides` e `/matches` antes de buscar o estado confirmado, evitando exibir dados antigos por até 15 segundos.

A abertura de WebSocket força validação sem cache de `/users/me`, então a renovação de access token acontece antes de autenticar o canal em tempo real. Isso evita janelas de reconexão com token expirado. O app nativo também fecha o socket ao ir para segundo plano e cria uma conexão limpa ao voltar.

No backend, conexões globais de atividades/caronas deixaram de consultar a sessão no loop de snapshot das salas a cada 1,2 s. Eventos de conversa de uma carona agora são direcionados somente aos dois participantes daquele match, reduzindo fan-out e refetches desnecessários. A migração V29 adiciona índices para as consultas quentes de caronas e matches.
