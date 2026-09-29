# Histórico das salas

O chat atual persiste texto, respostas, reações e referências de imagens no PostgreSQL, com acesso autorizado por associação à sala. Participantes que chegam depois podem consultar mensagens anteriores. Encerrar uma sessão bloqueia novos envios e preserva o histórico.

O transporte usa HTTPS/WSS. Este fluxo persistente não é criptografia ponta a ponta: o backend processa o conteúdo para autorização, armazenamento e recursos de IA. Não anunciar E2EE para o chat atual.

Imagens ficam no Object Storage configurado ou, na ausência dele, em bytes no PostgreSQL. O cliente aceita até 8 MB e otimiza imagens grandes antes de atravessar a Vercel. GIFs acima de 3 MB precisam ser reduzidos pelo usuário. Aplicar backups e controle de acesso também a esses dados.

A IA recebe contexto da sala quando configurada. Checkpoints incrementais são gravados somente após sucesso do provedor. Falhas não removem conversa nem produzem relatérios fictícios. Imagens não são interpretadas visualmente pelo contexto textual atual.

Chamadas usam LiveKit/WebRTC com criptografia de transporte, sem promessa de E2EE de mídia. Na carona, apenas as duas pessoas de um match aceito e não bloqueado recebem acesso. Ao encerrar a carona, novas entradas são recusadas e a chamada é reconciliada pelo servidor.

## Conversas privadas entre amigos

O fluxo `/friends` é separado das salas e da IA. As chaves ECDH P-256 são geradas no navegador e guardadas no IndexedDB local. O backend registra somente a chave pública; não permite substituição silenciosa. ECDH + HKDF-SHA256 deriva uma chave AES-GCM-256 por amizade. Cada mensagem usa IV aleatório de 96 bits e autentica amizade, remetente e identificador da mensagem como AAD. O servidor guarda ciphertext e metadados, nunca o texto desse fluxo.

Ambos os participantes podem comparar a impressão digital SHA-256 por outro canal para confirmar as chaves no primeiro contato. O backup usa PBKDF2-SHA256 (250 mil iterações), salt aleatório e AES-GCM; a senha não é transmitida. Sem chave ou backup, um novo dispositivo não recupera o histórico. A implementação não usa Double Ratchet e não oferece forward secrecy. Como toda aplicação web, depende da integridade do JavaScript entregue e do dispositivo. Metadados de amizades, horários e remetentes são conhecidos pelo serviço.

Remover uma amizade exige confirmação e remove o histórico cifrado daquela conversa no servidor. Bloqueios impedem acesso e novos envios. A IA não consulta mensagens privadas.
