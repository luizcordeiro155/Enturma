> Atualização 27/10/2026: conversas privadas usam custódia cifrada por conta para sincronização automática; não anunciar E2EE inacessível ao servidor. A implementação e os limites atuais estão em [Privacidade do chat](CHAT_PRIVACY.md) e [Revisão desta entrega](RELEASE_PUBLIC_START_SECURITY.md).

# Segurança e limites operacionais

Implementado: validação de DTOs, rejeição de campos extras, hashes BCrypt, tokens opacos hasheados, rotação/revogação, autorização por recurso, CORS restrito, CSRF por Origin no BFF, cookies HttpOnly/SameSite/Secure em produção, parâmetros SQL, limites de tamanho, rate limit no PostgreSQL, páginas sem HTML arbitrário, rastreio por requestId e auditoria administrativa.

API usa Bearer; não deve ser colocada atrás de um proxy que transforme credenciais em parâmetros de URL. Não registrar bodies, headers Authorization, cookies, tokens ou documentos. E-mails não enviados contêm links de uso único na outbox; proteger backups e limitar acesso ao banco.

O rate limit padrão usa usuário autenticado ou IP de conexão, sem confiar em X-Forwarded-For fornecido pelo cliente. Atrás do BFF, logins podem compartilhar IP; configurar limitação de borda e identificação de origem por proxy confiável antes da escala. A tabela de rate limit é expurgada diariamente desde 16/11/2026. O WebSocket limita 2.000 conexões por instância, 64 pendentes por endereço, 24 por usuário e 24 quadros a cada 10 segundos. O BFF pode enviar identidade de origem assinada com BFF_PROXY_SECRET; sem configuração válida, usa-se o endereço da conexão.

Este repositório não representa certificação de segurança ou conformidade LGPD. Antes de operação pública: consentimento/termos revisados, exportação/exclusão de conta, política de retenção, controle de acessos operacionais, alertas, testes de carga, antivírus, análise de dependências, teste de restauração e revisão dos provedores externos.

Bloqueios/denúncias têm API e aplicação nas interações suportadas. A revisão administrativa de casos/penalidades está disponível; denúncias seguem os endpoints existentes. Para relatar vulnerabilidade, não publique tokens ou dados pessoais em issues públicas; combine um canal privado com o mantenedor.

## Chat e retenção

O fluxo atual persiste conversas e anexos com autorização por sala. HTTPS/WSS protege o transporte; não é E2EE. Não registrar conteúdo em logs ou analytics. Consultar [CHAT_PRIVACY](CHAT_PRIVACY.md) para armazenamento e acesso pela IA.

## Proteções de autenticação

Login, cadastro e recuperação possuem janelas específicas de rate limit. E-mail e username possuem validação de duplicidade no serviço e constraints únicas no banco. Em escala, adicionar limitação distribuída/borda, alertas de credential stuffing e observabilidade de abuso sem registrar senhas.

## Moderação, cliente Desktop e dependências 0.3.0

A UI administrativa permite revisar evidências, registrar sanção com requestId e justificativa e responder ao recurso. Classificação opcional de sala cria caso para revisão; nunca bane automaticamente. O conteúdo cifrado do cofre privado não passa pela fila de moderação de salas. Detalhes em COMMUNITY_V03.md.

Electron mantém contextIsolation/sandbox, sem nodeIntegration. IPC exige main frame da janela/origem autorizada. Manifesto/ZIP exigem HTTPS, origem idêntica, tamanho limitado e SHA-256; sem redirects. Instalador valida caminhos, entrada ZIP e junções, preserva arquivos não substituídos e mantém backup para rollback. ENTURMA_PORTABLE=1 evita registrar protocolo em execução portátil/testes. Nenhuma chave privada é embutida no app.

Auditoria atual: node-forge atualizado para 1.4.3 (16/11/2026); permanecem alertas transitivos do toolchain Expo. Veja versões, condições e limites em [DEPENDENCY_AUDIT](DEPENDENCY_AUDIT.md). Não usar audit --force nem declarar auditoria limpa.

---

### Revisão 25/10/2026 — limites demonstráveis

Além de controles de autenticação, rate limits, queries parametrizadas e verificações de upload, o código introduziu RLS default-deny em V62 **para papéis comuns**. Um runtime com papel proprietário/superusuário ou `BYPASSRLS` pode ignorar RLS; é necessário separar papéis e auditar permissões para obter isolamento pelo banco. A autorização por objeto continua obrigatória na API.

Conversas privadas têm cifragem no cliente com custódia recuperável pela API, sem garantia E2EE inacessível ao serviço; chat das salas e mídia LiveKit não devem ser descritos como E2EE. `KLIPY_API_KEY` é chave de app acessível ao browser autenticado; não deve ser reutilizada como segredo privilegiado. GIFs externos são servidos pelo provedor. Validar atualização Windows com hash/URL, armazenamento seguro, push, localização temporária e segregação de sessões.

A exportação/exclusão de dados e medidas técnicas não são certificação LGPD. Não prometer ausência absoluta de vazamentos, malware, bugs ou observabilidade completa. Consulte `SECURITY.md` da raiz para reportar vulnerabilidades.

## Revisão de 28/10/2026

IA adaptativa agora compartilha a cota diária transacional, limita concorrência e não mantém transação durante o provedor. O [relatório](PRODUCTION_READINESS.md) separa revisão estática, testes e riscos operacionais. A role do pacote disponível é superusuária: RLS habilitado não comprova isolamento do runtime. Veja [preparação operacional](OPERATIONS_READINESS.md).

## Revisão de 16/11/2026

- **Segredos:** varredura do histórico Git e dos bundles de produção sem chaves privadas expostas; source maps de produção retornam 403. Chaves públicas por desenho: Firebase Web e KLIPY (app key do navegador). gitleaks continua na CI sobre todo o histórico.
- **Cabeçalhos:** HSTS, `nosniff` e CSP parcial (sem `script-src`) confirmados em produção. Enquadramento só pelo próprio Enturma e pela Vitrine Virtual Mostra+: `frame-ancestors 'self' https://mostraplus.com.br https://*.mostraplus.com.br` (substitui o antigo `X-Frame-Options: DENY`). No iframe, os cookies de sessão ficam particionados (CHIPS) e as escritas continuam exigindo `Origin` do próprio Enturma.
- **Endereço do cliente:** na Square Cloud todas as conexões diretas chegavam à API pelo IP do proxy da plataforma, então limites anônimos (cadastro 5/15 min, login 8/min, Explorar público) e o limite de 64 WebSockets pendentes por endereço eram globais. `ProxiedAddress` passou a usar `CF-Connecting-IP`/último `X-Forwarded-For` somente quando o par TCP é de rede privada (o proxy); clientes da internet e processos locais (loopback) não conseguem falsificar o endereço. Requisições do BFF continuam identificadas pela assinatura `BFF_PROXY_SECRET`.
- **Senhas:** 8 a 64 caracteres e recusa de senhas comuns.
- **Retenção:** expurgo diário de limites, sessões, tokens, e-mails e notificações (ver [LGPD](LGPD.md)).
- **Dependências:** `npm audit` sem alertas no runtime Web; os alertas restantes são do toolchain Expo (`apps/mobile`). `node-forge` 1.4.3 por override. Java: dois advisories do Spring MVC 6.2.19 sem caminho alcançável (ver [DEPENDENCY_AUDIT](DEPENDENCY_AUDIT.md)).
- **Pendente:** papel do banco em produção é superusuário (RLS ignorado); CSP com `script-src` exige revisão dos scripts inline do Next.js.
