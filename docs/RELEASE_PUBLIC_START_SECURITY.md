# Apresentação pública e segurança — 27/10/2026

Base revisada: `7146d3e`. Revisão estática de fronteiras críticas, com 71 arquivos no levantamento independente e revisão adicional das correções. Não é auditoria exaustiva, pentest externo, certificação ou homologação física.

## Entrega

- `/` e `/start`: apresentação pública e CTA animado; `/start/poster.png`: imagem 1200 × 630 para compartilhamento. Sessões seguem para Home e o shell Android ignora a apresentação.
- Contraste no visualizador, links de autenticação, seleção de tema, saída das animações e abas acessíveis de emoji/figurinhas/GIFs. Posicionamento relativo ao teclado preservado.
- Conversas sincronizadas por conta sem senha adicional: [modelo, migração e limites](CHAT_PRIVACY.md).
- V64 adiciona custódia cifrada sem alterar identidades, sessões, aprovação acadêmica ou `email_verified`. V65 adiciona índices para quotas/limpeza de anexos.

## Auditoria técnica

| Controle | Evidência e limite |
| --- | --- |
| Rate limit / bots | PostgreSQL por operação/ator, criação de treinos em GET/HEAD limitada, quotas transacionais de sessões/anexos e limites de WebSocket. WAF e observabilidade operacional continuam necessários em escala. |
| Secrets | Gitleaks: 1.119 commits, nenhum vazamento detectado pelas regras/configuração atuais. Não equivale a prova universal; valores reais ficam fora do Git. |
| Public key DB / RLS | Browser sem credenciais PostgreSQL. V62/V64 default-deny para papéis comuns. Proprietário/runtime ignora RLS: segregação de papel e isolamento por usuário no banco não foram implantados. |
| Criptografia | HTTPS/WSS, AES-GCM, tokens hasheados e chave mestra somente na API. O serviço tem custódia das chaves; cifragem de discos/backups depende da infraestrutura. |
| Auth / mass assignment / SQL | Ator da sessão, autorização por recurso, DTOs, rejeição de campos extras e parâmetros SQL. KLIPY agora verifica sessão, não só presença de cookie. |
| Cookies / senhas | HttpOnly/SameSite/Secure em produção, Origin no BFF, BCrypt 12 e rotação/revogação. Token usado em tempo real fica acessível ao cliente autenticado por design. |
| Respostas / leaks | Respostas por titular, chave individual sem cache, DTOs e logs sem conteúdo/credenciais. Não é garantia universal contra vazamentos. |
| Headers / HTTPS | CSP, anti-framing, nosniff, HSTS. API remota exige HTTPS também fora da Vercel; loopback permitido para testes locais. |
| Dependências | `npm audit`: 8 alertas (5 altos, 3 moderados) na cadeia Expo/CLI/router, incluindo node-forge, zod e decode-uri-component. Sugestões exigem mudanças principais/downgrade; não aplicado `--force`. Pendência explícita. |
| LGPD | Exportação autenticada, exclusão/anonimização e política de custódia. Exclusão serializa operações de chave. Retenção em backups/fornecedores, base legal e revisão jurídica continuam operacionais. Sem alegação de certificação. |

## Validação e implantação

Testes novos: migração, dispositivo sem chave local, adulteração, isolamento, troca da versão da senha, imutabilidade do envelope, exclusão, limites de armazenamento/treinos e preservação de anexos publicados. Playwright cobre apresentação, PNG, login, shell mobile, redução de movimento e temas. O check do commit executa Maven, lint, TypeScript, testes unitários, build, export Android/iOS e E2E; os resultados finais serão registrados antes da entrega.

Backup anterior às migrations com baseline de usuários/sessões/status. Configurar `CHAT_ACCOUNT_MASTER_KEY` (32 bytes aleatórios em base64) apenas na SquareCloud, com cópia segura. Publicar API/V64/V65, conferir health e depois Web. Cliente antigo permanece compatível; novo faz fallback se a capacidade ainda não estiver disponível. Shells Android/Desktop recebem a atualização Web sem novo instalador.

Rollback de código preserva tabelas aditivas e cofres antigos. Não apagar a chave mestra nem identidades para reverter interface. Trocar a chave mestra requer recifragem, não uma troca simples de variável.
