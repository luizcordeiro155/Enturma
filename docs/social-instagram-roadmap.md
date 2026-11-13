# Roadmap de paridade

1. Consolidar inventário e evidência; preservar mudanças existentes. Primeiro incremento: Feed com área de scroll correta para paginação e pull-to-refresh; cancelar gesto interrompido.
2. Validar composição em 320, 360, 390, 430, 768, 1024, 1280, 1440 e 1920 px e quatro temas antes de anunciar paridade visual. Usar navegador autorizado; não contornar restrições nem HTTP 429.
3. Auditar publicação/perfil/relações completos, autorização e rascunhos; reutilizar SocialPosts/People e contratos atuais.
4. Revalidar Stories/Clips/editor com FFmpeg real e storage privado; manter flags conforme capacidade. Utilizar infraestrutura existente sem contratar serviços ou aumentar custos.
5. Explorar: reutilizar busca autorizada; histórico opcional por conta, apagável; grade acessível. Coleções: tabelas aditivas de dono/item com acesso exclusivo e endpoints idempotentes.
6. Mensagens e notificações: reaproveitar chat e fanout; toda prévia revalida acesso ao conteúdo. Grupos exigem modelo explícito de membros e chaves antes de implementação.
7. Lives: definir autorização, participantes, moderação, retenção e capacidade LiveKit antes de criar endpoints/sessões. Audiência próxima exige lista persistente por dono e filtro central SocialAccess em todas as leituras.
8. Regressão, evidência visual e release. A missão Social 3.0 autoriza publicação não destrutiva nos serviços existentes após as verificações obrigatórias. Registrar o commit efetivamente servido e os smoke tests; autorização não substitui validação.

Testes mínimos de novos módulos: API com contas sintéticas, bloqueio bilateral, conta privada, idempotência, rede lenta/interrompida, teclado/toque e preservação das rotas acadêmicas. Resultados históricos em SOCIAL_2_IMPLEMENTATION.md não substituem execução nesta branch.
