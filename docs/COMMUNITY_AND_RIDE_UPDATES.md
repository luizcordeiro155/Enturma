# Fórum e acompanhamento de caronas

O fórum fica em `/forum`, com publicações por assunto, pesquisa textual em português, ordenação por data/votos/relevância, posts semelhantes, comentários encadeados (até quatro níveis), votos e reações. O autor pode editar ou excluir; moderadores podem excluir e recebem denúncias pelo fluxo existente. Excluir um comentário preserva suas respostas; excluir um post remove a discussão e as reações. Bloqueios entre usuários também se aplicam ao fórum. Código é exibido como texto, sem executar HTML.

Criar uma oferta, publicar uma busca ou demonstrar interesse redireciona para `/caronas/matches`. A conexão autenticada `/ws`, com escopo `rides`, envia apenas invalidações após a confirmação da transação. A interface busca novamente os dados autorizados. Publicações novas atualizam a lista e aceites abrem a celebração para ambos, inclusive durante a navegação por outras páginas.

Ofertas com vagas e solicitações pendentes aparecem no painel de busca. Na página de caronas há uma animação de radar; nas demais páginas privadas há um indicador inferior que pode ser minimizado. Ele não representa localização GPS nem promete um motorista: o aceite continua sendo feito pelos participantes. Buscas saem do painel ao cancelar, completar, preencher as vagas ou passar o horário de saída.

As animações usam a Web Animations API em JavaScript, respeitam movimento reduzido e param quando a aba fica oculta. A conexão é mantida durante a navegação. Quando ela cai, há reconexão com espera progressiva e atualização de contingência a cada cinco segundos. A celebração é lembrada por usuário no navegador para evitar repetição depois de dispensada.

A migração V18 cria as tabelas e índices do fórum automaticamente no boot. Não são necessárias novas variáveis de ambiente. A publicação usa GitHub → sincronização nativa SquareCloud e Vercel, sem depender de Actions.

Validação: testes da API cobrem busca, bloqueios, autoria, votos idempotentes, reações, respostas, exclusões e notificações após commit. Playwright verifica a chegada de uma nova carona em outra sessão sem reload, redirecionamento, indicador durante navegação, celebração nos dois usuários, conversa e o fluxo completo do fórum em desktop/mobile.
