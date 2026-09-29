# Segurança e limites operacionais

Implementado: validação de DTOs, rejeição de campos extras, hashes BCrypt, tokens opacos hasheados, rotação/revogação, autorização por recurso, CORS restrito, CSRF por Origin no BFF, cookies HttpOnly/SameSite/Secure em produção, parâmetros SQL, limites de tamanho, rate limit no PostgreSQL, páginas sem HTML arbitrário, rastreio por requestId e auditoria administrativa.

API usa Bearer; não deve ser colocada atrás de um proxy que transforme credenciais em parâmetros de URL. Não registrar bodies, headers Authorization, cookies, tokens ou documentos. E-mails não enviados contêm links de uso único na outbox; proteger backups e limitar acesso ao banco.

O rate limit padrão usa usuário autenticado ou IP de conexão, sem confiar em X-Forwarded-For fornecido pelo cliente. Atrás do BFF, logins podem compartilhar IP; configurar limitação de borda e identificação de origem por proxy confiável antes da escala. A tabela de rate limit necessita expurgo. Há teto de 1.000 conexões WebSocket por instância, mas falta quota por usuário/IP.

Este repositório não representa certificação de segurança ou conformidade LGPD. Antes de operação pública: consentimento/termos revisados, exportação/exclusão de conta, política de retenção, controle de acessos operacionais, alertas, testes de carga, antivírus, análise de dependências, teste de restauração e revisão dos provedores externos.

Bloqueios/denúncias têm API e aplicação nas interações suportadas. A interface completa de moderação e resolução de denúncias ainda está pendente. Para relatar vulnerabilidade, não publique tokens ou dados pessoais em issues públicas; combine um canal privado com o mantenedor.
