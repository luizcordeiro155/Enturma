# Histórico das salas

O chat atual persiste texto, respostas, reações e referências de imagens no PostgreSQL, com acesso autorizado por associação à sala. Participantes que chegam depois podem consultar mensagens anteriores. Encerrar uma sessão bloqueia novos envios e preserva o histórico.

O transporte usa HTTPS/WSS. Este fluxo persistente não é criptografia ponta a ponta: o backend processa o conteúdo para autorização, armazenamento e recursos de IA. Não anunciar E2EE para o chat atual.

Imagens ficam no Object Storage configurado ou, na ausência dele, em bytes no PostgreSQL. O cliente aceita até 8 MB e otimiza imagens grandes antes de atravessar a Vercel. GIFs acima de 3 MB precisam ser reduzidos pelo usuário. Aplicar backups e controle de acesso também a esses dados.

A IA recebe contexto da sala quando configurada. Checkpoints incrementais são gravados somente após sucesso do provedor. Falhas não removem conversa nem produzem relatérios fictícios. Imagens não são interpretadas visualmente pelo contexto textual atual.

Chamadas usam LiveKit/WebRTC com criptografia de transporte, sem promessa de E2EE de mídia. Na carona, apenas as duas pessoas de um match aceito e não bloqueado recebem acesso. Ao encerrar a carona, novas entradas são recusadas e a chamada é reconciliada pelo servidor.

## Conversas privadas entre amigos

O fluxo `/friends` é separado das salas e da IA. As chaves ECDH P-256 são geradas no navegador e guardadas no IndexedDB local. O backend registra a chave pública e, quando ativada a sincronização, um cofre cifrado da chave privada; não permite substituição silenciosa. ECDH + HKDF-SHA256 deriva uma chave AES-GCM-256 por amizade. Cada mensagem usa IV aleatório de 96 bits e autentica amizade, remetente e identificador da mensagem como AAD. O servidor guarda ciphertext e metadados, nunca o texto desse fluxo.

Ambos os participantes podem comparar a impressão digital SHA-256 por outro canal para confirmar as chaves no primeiro contato. O backup usa PBKDF2-SHA256 (250 mil iterações), salt aleatório e AES-GCM; a senha não é transmitida. Sem chave local, cofre desbloqueável ou backup, não é possível recuperar o histórico. A implementação não usa Double Ratchet e não oferece forward secrecy. Como toda aplicação web, depende da integridade do JavaScript entregue e do dispositivo. Metadados de amizades, horários e remetentes são conhecidos pelo serviço.

Remover uma amizade exige confirmação e remove o histórico cifrado daquela conversa no servidor. Bloqueios impedem acesso e novos envios. A IA não consulta mensagens privadas.

## Sincronização entre navegadores e dispositivos

Com `CHAT_ACCOUNT_MASTER_KEY`, a sincronização ocorre automaticamente após login ou abertura de Amigos, sem senha adicional. `POST /api/v1/private-account-vault/session` libera a proteção exclusivamente para o ator autenticado, sem cache. V64 guarda uma chave aleatória por conta sob AES-GCM, com IV aleatório e AAD vinculado ao ID da conta; a identidade privada continua cifrada no envelope. O serviço pode recuperar essa proteção: **não anunciar E2EE inacessível ao servidor**. Troca/recuperação da senha preserva a chave. A IA não consulta mensagens privadas.

O cofre v2 usa PBKDF2-SHA256 com 600 mil iterações, salt aleatório de 32 bytes, AES-GCM-256 e IV aleatório de 12 bytes. O AAD vincula versão, ID da conta e chave pública. A senha e a chave privada em claro nunca são enviadas à API. GET/PUT `/api/v1/private-vault` operam exclusivamente sobre o usuário autenticado. A API valida a chave pública contra a identidade existente e permite apenas a criação do cofre, recusando substituições (inclusive simultâneas). Migration V21; nenhuma variável de ambiente nova.

V2 descrito acima e V3 (derivado da senha de login) permanecem para compatibilidade. Uma chave local válida ou um cofre antigo que o login consegue abrir migra automaticamente sem recriar a identidade. Se a chave privada antiga nunca foi sincronizada e foi perdida, o servidor não consegue reconstruí-la: preserva histórico/identidade e permite restaurar backup existente. Não simular recuperação ou substituir silenciosamente a chave. O backup manual continua opcional.

Guardar cópia segura de `CHAT_ACCOUNT_MASTER_KEY` somente na API. Alterá-la sem recifrar os registros torna-os ilegíveis; a API falha explicitamente, sem substituir chaves. Rotação requer procedimento de recifragem e restauração testado. Exclusão de conta apaga a chave e serializa requisições concorrentes. Logout não remove cópias já obtidas por um dispositivo autorizado.

---

## Nota de atualização — 25/10/2026

Este documento preserva o contexto técnico do release em que foi escrito. Para funcionalidades atuais até a PR #104 e migrations V63, use [Estado atual](STATUS.md), [Arquitetura](ARCHITECTURE.md), [API](API.md), [Segurança](SECURITY.md), [Mobile](MOBILE.md) e [Desktop](DESKTOP.md). Entre as atualizações posteriores estão identidade acadêmica, Caronas, chats/figurinhas, KLIPY com busca, Cadernos IA, animações Remotion e melhorias em instaladores. A existência de código não comprova homologação em produção/aparelhos físicos.
