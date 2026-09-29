# Privacidade do chat das salas

O chat da sala é **privado aos participantes autorizados**, mas não é mais efêmero nem E2EE de conteúdo na versão v4.

## O que é armazenado

O backend persiste:

- texto da mensagem;
- imagem enviada e seus metadados;
- resposta a outra mensagem;
- horário e autor;
- exclusão lógica;
- reações por emoji.

Esse histórico permite leitura por participantes que entram depois e revisão após o encerramento.

## Quem pode acessar

A API verifica associação à sala antes de entregar histórico. Usuários removidos não têm acesso. O conteúdo não deve ser exposto por endpoints públicos, logs de aplicação, analytics ou telemetria.

## IA

Quando o usuário solicita **Entender o que perdi**, apenas mensagens anteriores ao horário de entrada daquele participante são usadas no contexto.

Quando uma sessão termina, a Enturma AI pode gerar um estudo consolidado usando conversa e materiais da sala. Esse conteúdo também fica restrito a participantes autorizados.

## Retenção

A implementação atual mantém o histórico enquanto a sala existir no banco. Antes da abertura pública em escala, definir e documentar uma política formal de retenção/exclusão e implementar exportação/exclusão de conta conforme requisitos legais aplicáveis.

## Chamadas

Áudio/vídeo usam LiveKit/WebRTC e não são gravados pela aplicação Enturma nesta versão. A mídia possui criptografia de transporte, mas não deve ser descrita como E2EE do conteúdo sem a camada E2EE própria do LiveKit.
