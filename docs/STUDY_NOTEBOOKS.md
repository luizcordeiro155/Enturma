# Cadernos de estudo e missões diárias

`/notebooks` oferece cadernos privados e persistidos, acessíveis a qualquer estudante. Aceita texto, links HTTPS públicos, PDF, DOCX, TXT, MD e imagens JPG/PNG/WEBP. Cada arquivo tem limite de 3 MB; são até 20 fontes por caderno e 20 cadernos por usuário. O conteúdo extraído permanece salvo; os bytes originais são descartados após a extração. PDFs digitalizados sem texto precisam ser enviados como imagens.

O estudante seleciona até dez fontes e pede aulas, resumos, explicações simples, flashcards, quizzes comentados, planos de estudo ou respostas. A primeira fonte pronta inicia uma aula quando o caderno está aberto. As respostas mantêm citações com os trechos usados, histórico, identificador na URL e exportação Markdown. Textos extensos usam uma seleção de trechos; a interface permite consultar o conteúdo extraído completo. Apagar uma fonte não apaga citações já salvas; apagar o caderno remove tudo.

Usa a configuração de IA existente da API. O provedor deve suportar Responses API e imagens para transcrição. Sem credencial, fontes textuais continuam utilizáveis, mas geração e leitura de imagens informam indisponibilidade. O limite compartilhado é de 40 pedidos de IA por usuário/dia. Há dois trabalhadores de processamento e no máximo duas gerações pendentes por usuário. Erros e interrupções ficam visíveis, sem simular respostas.

A API valida propriedade em todas as operações. Links não acessam IPs privados, credenciais, portas personalizadas ou redirecionamentos para redes locais; a resolução DNS também é validada na conexão. Dados das fontes são enviados ao provedor configurado, conforme indicado na interface.

`/learn` oferece Termo Dev, Rota do Algoritmo, Laboratório Binário e Detetive de Código para estudantes elegíveis de TI. Cada jogo tem cinco missões diárias, renovadas à meia-noite de São Paulo. A dificuldade avança desde o primeiro dia de acesso, com limites próprios de cada mecânica. O servidor valida tentativas, sequência e XP; recarregar mantém o progresso. Termo Dev apresenta a definição, aceita tentativas digitadas do tamanho pedido e nunca revela a palavra secreta. Não há lista clicável de respostas.

As migrações V15 e V16 são aplicadas automaticamente na inicialização da API. Nenhuma variável nova é necessária. A publicação mantém a sincronização Git nativa da SquareCloud e da Vercel.

## Validação

Os testes de integração PostgreSQL cobrem propriedade dos cadernos, citações, persistência, idempotência, vinte missões, progressão e nomes com acentos. Os testes de extração cobrem TXT/MD/DOCX e bloqueio de URLs privadas. O E2E de cadernos exige IA habilitada; no ambiente de teste, use um provedor Responses local controlado para validar geração e transcrição sem custos. Esse provedor não faz parte da configuração de produção. O E2E também verifica mobile, desktop, teclado, imagens e citações.
