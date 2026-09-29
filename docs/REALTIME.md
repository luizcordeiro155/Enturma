# Chat e tempo real

Conectar em `/ws`, origem autorizada, e enviar em até 5 segundos `{ "token": "access", "roomId": "uuid" }`. Nunca enviar tokens em URL. O servidor autentica e valida associação à sala; cada snapshot repete a autorização e verifica revogação.

Mensagens entram via REST transacional. O WebSocket envia snapshots das últimas 30 mensagens e participantes a cada 1,5 s, apenas quando mudam. Isso permite que múltiplas instâncias enxerguem mudanças pelo PostgreSQL. Clientes usam backoff exponencial limitado a seis tentativas, com atualização manual na web.

Editar exige autoria e sala aberta. Exclusão por autor/host/moderador é soft delete com auditoria. Mensagens de usuários bloqueados são filtradas. Reações, anexos de mensagem, typing indicator, paginação de histórico na UI e presença detalhada ainda não existem.

Voz usa LiveKit: tokens de até 60 s, roomJoin, apenas microfone, sem publicação de dados. O backend verifica associação e expiração; rotina a cada 10 s remove participantes que saíram/foram removidos/banidos e encerra salas expiradas. A limpeza é repetida até passar a validade dos grants; falhas são tentadas novamente. LiveKit self-hosted pode aceitar um grant já emitido até expirar, por isso há uma janela limitada de revogação. Validar esse comportamento em staging.

Implementação segue [RoomService](https://docs.livekit.io/reference/other/roomservice-api/) e [grants](https://docs.livekit.io/frontends/reference/tokens-grants/). Nenhuma chamada real foi validada sem credenciais de infraestrutura.
