# Estado da implementação

Última atualização funcional: **sala colaborativa v4 + aprendizagem v4**.

## Implementado

- Java/Spring Boot + PostgreSQL/Flyway;
- Next.js Web + Expo;
- autenticação, sessões, catálogo, onboarding, matérias e salas;
- WebSocket autenticado;
- chat persistente privado por sala;
- imagens de chat até 8 MB com prévia;
- respostas, exclusão e reações;
- histórico para participantes que entram depois;
- resumo de entrada tardia com Enturma AI;
- estudo final de sessão com estados PENDING/PROCESSING/READY/FAILED;
- LiveKit Web para voz, câmera e compartilhamento de tela;
- materiais PDF/TXT e tutor com fontes;
- modo claro/escuro;
- modo de acessibilidade;
- layout de sala responsivo desktop/mobile web;
- XP, níveis, streak e desafio diário;
- Rota do algoritmo com programa textual e limite de operações;
- Código Secreto com Solo/Dueto/Quarteto;
- Detetive de código;
- caronas e moderação já existentes.

## Banco

Migrations atuais chegam à **V10**. V9 removeu as tabelas antigas do chat efêmero. V10 cria o novo histórico privado persistente e os estudos consolidados.

## Pontos ainda pendentes

- upload direto de imagens de chat para object storage para escala maior;
- política formal de retenção e exclusão;
- pub/sub para WebSocket em múltiplas réplicas;
- paridade total das funções de colaboração no app Expo nativo;
- testes reais de LiveKit/OpenAI/storage com credenciais de produção;
- embeddings/pgvector e processamento assíncrono de materiais grandes;
- push notification e i18n centralizado.

O Web responsivo é a experiência principal publicada na Vercel. O app Expo não participa do deploy Web.
