# Materiais e Enturma AI

A Enturma AI usa OpenAI Responses API com o modelo `gpt-5.6-sol` definido no backend.

## Variáveis

```dotenv
OPENAI_API_KEY=
AI_WEB_SEARCH_ENABLED=false
AI_BASE_URL=https://api.openai.com/v1
```

A chave nunca vai para o browser.

## Modos da sala

O tutor suporta pergunta, resumo, flashcards, quiz, explicação simples, plano de estudo e pesquisa externa com fontes quando habilitada.

Materiais PDF/TXT são armazenados em storage privado e seus chunks ficam associados ao `roomId`.

## Recuperação de contexto

A versão v4 adiciona um fluxo separado em `POST /study-rooms/{room}/study-summary/recap`.

Ele é oferecido quando `messagesBeforeJoin > 0` e usa apenas a conversa anterior ao horário de entrada daquele estudante. A resposta organiza conceitos, exemplos, dúvidas resolvidas, decisões, pontos em aberto e próximos passos.

## Estudo final da sessão

Quando uma sala termina, `room_study_summary` recebe estado `PENDING`. Um job agendado tenta gerar um guia completo com:

- visão geral;
- conceitos estudados;
- explicações passo a passo;
- exemplos;
- dúvidas e respostas;
- pontos de atenção;
- checklist de revisão;
- exercícios;
- autoavaliação;
- plano de revisão.

Estados possíveis: `PENDING`, `PROCESSING`, `READY` e `FAILED`.

A geração pode ser solicitada novamente por `POST /study-rooms/{room}/study-summary`.

## Segurança

Materiais e histórico são tratados como dados não confiáveis para o modelo. Autorização é determinada pelo backend. Não registrar API keys, documentos completos ou conversas privadas em logs.
