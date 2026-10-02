# Segurança e limites operacionais

Implementado: validação de DTOs, rejeição de campos extras, hashes BCrypt, tokens opacos hasheados, rotação/revogação, autorização por recurso, CORS restrito, CSRF por Origin no BFF, cookies HttpOnly/SameSite/Secure em produção, parâmetros SQL, limites de tamanho, rate limit no PostgreSQL, páginas sem HTML arbitrário, rastreio por requestId e auditoria administrativa.

API usa Bearer; não deve ser colocada atrás de um proxy que transforme credenciais em parâmetros de URL. Não registrar bodies, headers Authorization, cookies, tokens ou documentos. E-mails não enviados contêm links de uso único na outbox; proteger backups e limitar acesso ao banco.

O rate limit padrão usa usuário autenticado ou IP de conexão, sem confiar em X-Forwarded-For fornecido pelo cliente. Atrás do BFF, logins podem compartilhar IP; configurar limitação de borda e identificação de origem por proxy confiável antes da escala. A tabela de rate limit necessita expurgo. Há teto de 1.000 conexões WebSocket por instância, mas falta quota por usuário/IP.

Este repositório não representa certificação de segurança ou conformidade LGPD. Antes de operação pública: consentimento/termos revisados, exportação/exclusão de conta, política de retenção, controle de acessos operacionais, alertas, testes de carga, antivírus, análise de dependências, teste de restauração e revisão dos provedores externos.

Bloqueios/denúncias têm API e aplicação nas interações suportadas. A revisão administrativa de casos/penalidades está disponível; denúncias seguem os endpoints existentes. Para relatar vulnerabilidade, não publique tokens ou dados pessoais em issues públicas; combine um canal privado com o mantenedor.

## Chat e retenção

O fluxo atual persiste conversas e anexos com autorização por sala. HTTPS/WSS protege o transporte; não é E2EE. Não registrar conteúdo em logs ou analytics. Consultar [CHAT_PRIVACY](CHAT_PRIVACY.md) para armazenamento e acesso pela IA.

## Proteções de autenticação

Login, cadastro e recuperação possuem janelas específicas de rate limit. E-mail e username possuem validação de duplicidade no serviço e constraints únicas no banco. Em escala, adicionar limitação distribuída/borda, alertas de credential stuffing e observabilidade de abuso sem registrar senhas.

## Moderação, cliente Desktop e dependências 0.3.0

A UI administrativa permite revisar evidências, registrar sanção com requestId e justificativa e responder ao recurso. Classificação opcional de sala cria caso para revisão; nunca bane automaticamente. E2EE/cofre privado não passa pela fila ou regras. Detalhes em COMMUNITY_V03.md.

Electron mantém contextIsolation/sandbox, sem nodeIntegration. IPC exige main frame da janela/origem autorizada. Manifesto/ZIP exigem HTTPS, origem idêntica, tamanho limitado e SHA-256; sem redirects. Instalador valida caminhos, entrada ZIP e junções, preserva arquivos não substituídos e mantém backup para rollback. ENTURMA_PORTABLE=1 evita registrar protocolo em execução portátil/testes. Nenhuma chave privada é embutida no app.

Audit de dependências do Expo ainda aponta advisories transitivos em node-forge (ferramenta de assinatura do CLI; versão publicada 1.4.0 sem correção para GHSA-86w9-cpqp-85rv) e decode-uri-component/query-string (GHSA-vcc3-ghjq-m6fr). Não se aplicou downgrade inseguro do Expo sugerido por audit --force. uuid de xcode foi atualizado via override compatível 11.1.1. Reavaliar patches upstream antes da distribuição nativa pública; não anunciar ausência de vulnerabilidades.
