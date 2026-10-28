# Chat, chamadas e tempo real

## Limite de escala observado em 28/10/2026

As conexões e a digitação ficam em memória da instância. A reconciliação periódica consulta snapshots; comparar o JSON antes de enviar economiza rede, mas não elimina o trabalho SQL de reconstrução. Os limites de 2.000 conexões por processo, 24 por usuário e 24 quadros/10s são controles de abuso, não benchmark de capacidade. Fanout, revogação e reconexão entre réplicas ainda exigem ensaio distribuído. O [runbook](OPERATIONS_READINESS.md) define métricas e os limites de evidência desta revisão.

## Chat Web persistente

Mensagens são enviadas via REST autenticado. O WebSocket envia snapshots autorizados para sincronizar participantes; reconexão recupera o histórico no banco. Texto, respostas, imagens e reações não usam E2EE neste fluxo. Ver [privacidade do chat](CHAT_PRIVACY.md).

Encerrar a sala bloqueia envios e preserva as mensagens para participantes. O conteúdo não é apagado quando a IA está indisponível.

## Chamadas Web

Chamadas usam LiveKit/WebRTC. O backend emite grants curtos somente para participantes ativos da sala. O cliente Web suporta:

- microfone e mute;
- câmera;
- participantes remotos;
- indicador visual de quem está falando em tempo real;
- lista completa de participantes da chamada;
- compartilhamento de tela com destaque do transmissor e lista de participantes que estão recebendo a transmissão;
- áudio de screen share quando suportado pelo navegador;
- reconexão do LiveKit;
- encerramento quando a sala termina.

O token permite as fontes `microphone`, `camera`, `screen_share` e `screen_share_audio`. O navegador sempre pede consentimento do usuário para microfone, câmera e tela.

O reconciliador da API remove identidades que não pertencem mais à sala e apaga a sala LiveKit quando a sessão do Enturma termina.

WebRTC fornece criptografia de transporte. Não documentar a mídia como E2EE de conteúdo até que a camada E2EE de mídia do LiveKit seja habilitada e testada explicitamente.

## Escala

O relay atual é em memória por instância. Antes de executar várias réplicas da API, introduzir um barramento/pub-sub compatível com envelopes cifrados sem descriptografá-los. O conteúdo deve continuar opaco ao broker.

## Eventos 0.3.0

A conexão activity emite invalidações privadas achievement_unlocked, moderation_action, room_member_joined, room_member_left e room_expiring somente aos usuários autorizados. Eventos não incluem corpo de mensagens. Fórum pode invalidar listagem pública; notificações continuam privadas.

Typing usa frames da conexão da sala com throttle de 2s e validade de 5s. Não há tabela de digitação. Reconexão recupera snapshot e histórico autorizado. Heartbeat/presença continuam independentes da digitação.

CallSessionProvider reside no layout raiz e preserva a instância LiveKit entre rotas. Logout, saída explícita, perda irrecuperável ou encerramento terminam mídia. Trocar abas/rotas move a visualização, sem reconectar ou recriar os elementos de mídia.

---

### Revisão 25/10/2026 — mensagens privadas, chamadas e mídias

O projeto mantém WebSocket de eventos autenticados, estado de presença e reconciliação de histórico. `PrivateCallController` gerencia convites, aceite/recusa, tokens LiveKit e heartbeat por dispositivo; chamados encerrados não devem reaparecer após reinício. A sala permanece com chat persistente **não E2EE**; conversas privadas de amigos têm criptografia no cliente para conteúdo compatível. Metadados de reações e presença não recebem necessariamente o mesmo nível de cifragem.

O compositor compartilhado inclui emojis, reações, mídia pessoal e GIFs KLIPY (pesquisa direta/paginação); mensagens remotas KLIPY usam URL original, não upload local. Na Web e no APK, validar foco do teclado, scroll até as últimas mensagens sem ocultá-las, transições para chamadas, cancelamento de sessões e supressão correta de notificações.
