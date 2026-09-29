# Segurança e limites operacionais

Implementado: validação de DTOs, rejeição de campos extras, hashes BCrypt, tokens opacos hasheados, rotação/revogação, autorização por recurso, CORS restrito, CSRF por Origin no BFF, cookies HttpOnly/SameSite/Secure em produção, parâmetros SQL, limites de tamanho, rate limit no PostgreSQL, páginas sem HTML arbitrário, rastreio por requestId e auditoria administrativa.

API usa Bearer; não deve ser colocada atrás de um proxy que transforme credenciais em parâmetros de URL. Não registrar bodies, headers Authorization, cookies, tokens ou documentos. E-mails não enviados contêm links de uso único na outbox; proteger backups e limitar acesso ao banco.

O rate limit padrão usa usuário autenticado ou IP de conexão, sem confiar em X-Forwarded-For fornecido pelo cliente. Atrás do BFF, logins podem compartilhar IP; configurar limitação de borda e identificação de origem por proxy confiável antes da escala. A tabela de rate limit necessita expurgo. Há teto de 1.000 conexões WebSocket por instância, mas falta quota por usuário/IP.

Este repositório não representa certificação de segurança ou conformidade LGPD. Antes de operação pública: consentimento/termos revisados, exportação/exclusão de conta, política de retenção, controle de acessos operacionais, alertas, testes de carga, antivírus, análise de dependências, teste de restauração e revisão dos provedores externos.

Bloqueios/denúncias têm API e aplicação nas interações suportadas. A interface completa de moderação e resolução de denúncias ainda está pendente. Para relatar vulnerabilidade, não publique tokens ou dados pessoais em issues públicas; combine um canal privado com o mantenedor.


## Chat privado e conteúdo efêmero

O chat Web não persiste conversas. Texto, imagens, respostas e reações são cifrados no cliente com AES-GCM; a chave da sala é distribuída entre participantes com ECDH P-256. O backend atua como relay autenticado e não recebe a chave privada dos clientes nem a chave simétrica em claro.

A migration V9 remove o histórico legado armazenado no PostgreSQL. Não adicionar bodies de chat a logs, analytics, auditoria ou tracing.

A criptografia de chat não torna o cliente Web imutável. Um operador capaz de alterar o JavaScript servido poderia tentar publicar uma versão maliciosa. A documentação e a interface não devem prometer segurança absoluta além do modelo implementado.

## Proteções de autenticação

Login, cadastro e recuperação possuem janelas específicas de rate limit. E-mail e username possuem validação de duplicidade no serviço e constraints únicas no banco. Em escala, adicionar limitação distribuída/borda, alertas de credential stuffing e observabilidade de abuso sem registrar senhas.
