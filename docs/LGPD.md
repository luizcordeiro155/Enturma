# LGPD — registro de tratamento e operação

> Revisado em 16/11/2026. Este documento descreve o que o código e a operação fazem hoje. Ele não é parecer jurídico nem certificação de conformidade; os pontos marcados como **revisão jurídica** precisam de um advogado.

Política pública: [`/privacidade`](https://enturma-flax.vercel.app/privacidade) · Termos: [`/termos`](https://enturma-flax.vercel.app/termos) · Versão vigente: `2026-11-16` (`apps/web/src/lib/legal.ts` e `LegalConsents.VERSION`).

## Agentes de tratamento

| Papel | Quem | Contato |
| --- | --- | --- |
| Controlador | Luiz Cordeiro | enturmaflax@gmail.com |
| Encarregado (DPO) | Luiz Cordeiro | enturmaflax@gmail.com |

O canal de privacidade recebe pedidos de titulares, dúvidas e comunicações de incidentes. Os pedidos são respondidos em até 15 dias (art. 19, II).

## Inventário de dados e bases legais

| Finalidade | Dados | Base legal (art. 7º / 11) |
| --- | --- | --- |
| Conta, sincronização e recursos | nome, usuário, e-mail, senha (hash BCrypt), foto, preferências, conteúdo criado | execução de contrato (V) |
| Vínculo acadêmico | instituição, curso, e-mail institucional ou comprovante (apagado após análise) | execução de contrato (V) e legítimo interesse (IX) |
| Caronas | origem/destino, localização ao vivo durante a viagem, veículo, avaliações | execução de contrato (V); localização por consentimento (I) via permissão do aparelho |
| Chamadas, microfone, câmera, notificações | mídia em tempo real (não gravada), tokens de push | consentimento (I) via permissão do sistema |
| Enturma AI e Cadernos | perguntas, materiais enviados pelo usuário | execução de contrato (V) |
| Segurança e moderação | registros de sessão, limites de uso, denúncias, auditoria administrativa | legítimo interesse (IX); prevenção à fraude (art. 11, II, g) |
| Prova de aceite | documento, versão, data e origem do aceite (`consent_record`) | cumprimento de obrigação legal (II) e exercício regular de direitos (VI) |

Não há publicidade, venda de dados, analytics de terceiros nem cookies não essenciais. Cookies: somente sessão (`enturma_access`, `enturma_refresh`, `enturma_remember`), HttpOnly.

## Operadores e transferência internacional

Vercel (Web), Square Cloud (API, EUA — Nova York), Railway (PostgreSQL e downloads), Cloudflare R2 (mídia do Social), LiveKit (chamadas), OpenAI (IA), Firebase Cloud Messaging (push Android), KLIPY (GIFs, chamado direto pelo navegador), OpenStreetMap/Nominatim, OSRM e Esri (mapas) e o provedor SMTP. Vários processam dados fora do Brasil; a política informa a transferência com base no art. 33. **Revisão jurídica:** confirmar cláusulas contratuais/DPA de cada operador (art. 33, II) em vez de depender apenas de informação ao titular.

## Consentimento e versões

- Cadastro Web exige marcar "Li e aceito os Termos de Uso e a Política de Privacidade e declaro ter 18 anos ou mais"; a API grava `TERMS`, `PRIVACY` e `AGE_18` com origem `SIGN_UP`.
- `GET/POST /api/v1/account/privacy/consents` mostra a versão vigente, o que foi aceito e o histórico; Configurações → Privacidade oferece "Li e aceito" quando há versão nova. A V81 notificou todos os usuários ativos sobre a atualização.
- Para publicar nova versão: alterar `LEGAL_VERSION`/`LEGAL_VERSION_LABEL` na Web e `LegalConsents.VERSION` na API no mesmo PR, criar migration com nova notificação e registrar aqui o que mudou.
- O app Expo antigo pode cadastrar sem o campo `acceptedTerms`; nesse caso nenhum aceite é gravado e o usuário vê o pedido de aceite em Configurações.

## Idade mínima

Idade mínima de 18 anos por autodeclaração. **Revisão jurídica:** o ECA Digital (Lei 15.211/2025, vigente desde 17/03/2026) não aceita autodeclaração como mecanismo de verificação de idade onde ele se aplica, e o Enunciado CD/ANPD 1/2023 trata de dados de crianças e adolescentes. Se o Enturma for aberto a menores ou enquadrado no ECA Digital, será preciso verificação etária e consentimento parental.

## Direitos do titular (art. 18)

| Direito | Como atender |
| --- | --- |
| Confirmação, acesso, portabilidade | Configurações → Privacidade → exportar (JSON). A exportação cobre todas as tabelas ligadas à conta; `PrivacyComplianceIntegrationTest` falha quando surge tabela nova sem exportação ou isenção justificada (`PersonalDataExport.EXEMPT`). Colunas de segredo (hash, token, chave, cifra) nunca saem |
| Correção | edição de perfil no app; casos especiais pelo e-mail do encarregado |
| Eliminação | Configurações → Privacidade → excluir conta (agendada ou imediata). Dados pessoais são apagados ou anonimizados; o registro de aceite fica ligado a um identificador anonimizado |
| Revogação de consentimento | permissões do aparelho (localização, câmera, microfone, notificações) |
| Informação sobre compartilhamento | seção 9 da política |
| Revisão de decisão automatizada | a moderação automática apenas abre casos; decisões são humanas |

## Retenção

`DataRetention` roda diariamente às 04:17 (America/Sao_Paulo):

| Dado | Prazo |
| --- | --- |
| `rate_limit` | 1 dia após expirar |
| `user_session` | 30 dias após revogada ou expirada |
| `account_token` | 1 dia após expirar |
| `email_outbox` | 30 dias após envio; 90 dias no máximo |
| `notification` | 180 dias após lida; 365 dias no máximo |
| Localização ao vivo da carona | até 15 minutos sem atualização (rotina própria das caronas) |
| Comprovante de verificação acadêmica | apagado após a análise |

Backups: o banco Railway não tem backup externo configurado (decisão do responsável em 28/10/2026). Se houver backup, ele precisa seguir os mesmos prazos.

## Incidentes de segurança

1. Conter: revogar credenciais/sessões afetadas, rotacionar segredos (`BFF_PROXY_SECRET`, banco, R2, OpenAI, LiveKit, FCM) e preservar evidências sem copiar dados pessoais.
2. Avaliar risco ou dano relevante aos titulares (Resolução CD/ANPD 15/2024).
3. Se houver risco relevante: comunicar a ANPD e os titulares em até **3 dias úteis** do conhecimento (prazo em dobro para agentes de pequeno porte), com natureza dos dados, titulares afetados, medidas e riscos; complementar em até 20 dias úteis.
4. Registrar o incidente e as decisões, mesmo quando não comunicado, e guardar o registro por no mínimo 5 anos.

## Medidas técnicas

HTTPS/HSTS, cookies HttpOnly/SameSite, senhas BCrypt (8–64 caracteres, senhas comuns recusadas), tokens opacos com hash, autorização por objeto na API, rate limit no PostgreSQL por cliente real (endereço resolvido atrás do proxy da Square Cloud), CSP e cabeçalhos de segurança, gitleaks em todo o histórico na CI, chat privado cifrado no cliente com custódia recuperável pela API (não é E2EE inacessível ao servidor).

## Pendências conhecidas

- Papel do banco em produção é superusuário: RLS existe (V62) mas é ignorado; separar papéis de migração e runtime.
- Revisão jurídica dos Termos, da Política, da idade mínima e dos contratos com operadores.
- Relatório de impacto (RIPD) recomendado para localização em caronas e IA.
- Backup externo com retenção definida e teste de restauração.
