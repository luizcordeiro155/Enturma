# Comunidade 0.3.0

## Perfil e conquistas

profile_showcase, profile_widget, profile_privacy_setting e profile_featured_badge separam identidade, decoração e publicação. O servidor permite oito widgets distintos e quatro badges conquistados. Privacidade filtra respostas públicas e widgets que revelariam estatísticas/curso ocultos. Bloqueios continuam aplicados.

achievement_definition guarda versão, categoria, métrica, requisito, tier e XP. AchievementService calcula métricas persistidas; worker consome fila de usuários alterados. user_achievement e learning_xp_event impedem concessão/XP duplicados. Eventos privados são invalidações sem conteúdo de conversa.

## Monitor Enturma

Regras incluem flood, repetição, excesso de menções, domínios maliciosos cadastrados, phishing e ameaças. Primeira ocorrência pode gerar aviso; reincidência, mute. Rejeitar um envio não desfaz evidência da infração.

moderation_case/action/evidence registram regra, origem, confiança, responsável, duração e evidência. Ações administrativas têm requestId idempotente. MUTE/KICK exigem sala; BAN/SUSPENSION são de conta. Banimento é humano e auditado. Recurso do usuário e revisão administrativa exigem justificativa.

ENTURMA_MODERATION_CLASSIFIER_ENABLED=true habilita fila opcional. O classificador lê apenas room_message e seis mensagens recentes da mesma sala. Confiança >=0,85 cria REVIEW, nunca punição automática. Três tentativas limitadas; conteúdo é dado não confiável. Caso/evidência/conclusão da fila são atômicos. private_message e cofre/envelopes E2EE ficam excluídos.

Cards WELCOME/FAREWELL/encerramento mostram contexto acadêmico, avatar, host e prazo. Eventos são deduplicados e enviados somente aos participantes. Typing fica em memória com throttle/expiração.

## Preferências

ROOM_MESSAGE, ROOM_NOTICE, FORUM, ACHIEVEMENT, RIDE, FRIEND têm flags inApp/email independentes. Padrão: in-app habilitado, e-mail desabilitado. Outbox recebe categoria; EmailWorker confere novamente antes de enviar. E-mails de segurança não recebem categoria de comunidade e permanecem ativos.
