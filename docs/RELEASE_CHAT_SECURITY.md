# Conversas, navegação e proteção — outubro de 2026

## Entrega

Compositor compartilhado para salas, conversas privadas e cadernos, pesquisa web por ícone, biblioteca pessoal de figurinhas/GIFs, favoritos e coleção original Enturma. Imagens recebidas podem ser copiadas para a biblioteca. Essa cópia é privada à conta, mas não usa a criptografia ponta a ponta das mensagens; o envio no privado continua cifrado.

Navegação principal com prefetch e consulta de sessão mínima no servidor. Abertura com duração reduzida, saída imediata após carregamento demorado e limite de espera. Retorno do portfólio público ao ponto de origem. Desktop com barra integrada, controles nativos e animações Remotion distintas para download e atualização; percentuais só vêm de eventos reais do atualizador.

## Banco e implantação

1. Guardar backup de banco e configuração do serviço antes da atualização.
2. Publicar o backend primeiro: a Web passa a consultar `/auth/session-view`.
3. V60 cria a biblioteca privada com quota, validação de arquivo e deduplicação.
4. V61 renova os convites de salas em andamento; membros continuam na sala e podem gerar um novo convite. Links/códigos antigos deixam de funcionar.
5. V62 revoga permissões de PUBLIC e ativa RLS com negação por padrão para papéis comuns nas tabelas do schema da aplicação. O backend continua fazendo autorização por conta e por recurso.
6. Publicar a Web e aguardar os builds Android/Desktop automáticos. Validar os manifests, assinatura Android existente e sessões persistentes antes de anunciar a conclusão.

**Limite de RLS:** proprietário, superusuário e papéis BYPASSRLS continuam ignorando RLS. A configuração atual de produção foi verificada com TLS e proprietário/superusuário; esta migração não oferece isolamento entre usuários para esse papel. Não há chave pública de banco destinada ao navegador. Separar futuramente o papel de migração do papel de runtime exige configurar credenciais distintas e políticas/grants explícitos, com ensaio de rollback; trocar apenas o usuário sem essas políticas bloqueia a autenticação.

## Segurança e privacidade

Autenticação e aprovação acadêmica continuam verificadas no Java e no servidor Next. Os DTOs rejeitam campos desconhecidos; queries de dados usam parâmetros. Senhas usam BCrypt, sessões e tokens são armazenados por hash. A atualização limita uploads, trabalho de IA, recuperação, inscrições push e conexões em tempo real; valida o destino dos serviços push, rejeita redirects e restringe links internos do Desktop à origem do aplicativo. Cabeçalhos CSP básicos, HSTS em produção, nosniff e anti-framing complementam os controles existentes.

A exportação paginada contém cadastro, portfólio, fontes, conversas de cadernos e metadados da biblioteca, sem hashes, sessões ou conteúdos de outros usuários. Não é um arquivo completo de todos os registros do serviço: documentos binários são baixados pelos recursos existentes; outras solicitações seguem o canal da política de privacidade. Exclusão também remove imediatamente biblioteca pessoal, atividade e anexos do portfólio. Pedidos de contas suspensas precisam ser atendidos pelo canal de suporte, pois não podem autenticar.

Esses controles técnicos não constituem certificação de conformidade com a LGPD. O controlador ainda deve manter bases legais e registros de tratamento, contatos, contratos dos operadores, prazos de retenção/backups e processo de resposta a incidentes atualizados.

## Dependências e segredos

Next e dependências compatíveis foram atualizados com base no audit; jose4j e Bouncy Castle foram atualizados para versões mantidas. Restam alertas transitivos do ferramental Expo para os quais o resolvedor propõe mudanças incompatíveis (decode-uri-component, node-forge e zod da CLI). A distribuição Android oficial usa a WebView gerada e a Web hospedada; esses utilitários Expo não são o servidor público. Manter entradas de build confiáveis e acompanhar correções compatíveis; não usar `npm audit fix --force` para mascarar os alertas.

Gitleaks verificou todo o histórico disponível. As quatro ocorrências eram senhas sintéticas em duas revisões de um teste E2E; somente seus fingerprints exatos foram dispensados. Nenhuma credencial real foi encontrada nessa verificação. O workflow de secrets impede novas ocorrências no Git; o resultado não substitui rotação de qualquer segredo que venha a ser identificado por outros meios.
