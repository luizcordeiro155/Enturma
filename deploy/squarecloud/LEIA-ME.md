# Enturma API — upload na SquareCloud

Este ZIP contém o JAR executável e a configuração da API. A interface web é hospedada na Vercel.

1. Preencha `DATABASE_URL` no `.env` com a URI pública do PostgreSQL (`postgresql://usuario:senha@host-publico:porta/banco`). Também aceita URL JDBC com `DATABASE_USERNAME` e `DATABASE_PASSWORD` separados. Não coloque aspas nos valores. O banco deve estar acessível e vazio na primeira instalação; Flyway cria as tabelas automaticamente.
2. `APP_URL` deve ser a URL HTTPS da interface web. O modelo usa `https://enturma-flax.vercel.app`.
3. Gere `BFF_PROXY_SECRET` com 32+ caracteres aleatórios e copie o mesmo valor para a Vercel. Ele permite aplicar limites por cliente web sem confiar em headers falsificados.
4. Envie o ZIP pelo painel da SquareCloud, ative a publicação web e escolha um subdomínio disponível. A configuração usa 1024 MB; confira a disponibilidade no seu plano. O runtime Java executa `app.jar` na porta 80, em todas as interfaces.
5. Abra `https://SEU-SUBDOMINIO.squareweb.app/actuator/health`. O resultado deve ser `{"status":"UP"}`.
6. Na Vercel, configure `API_URL=https://SEU-SUBDOMINIO.squareweb.app` (sem `/api/v1`) e `BFF_PROXY_SECRET`. Faça redeploy e confira `/api/health` na URL web.

As variáveis do painel da SquareCloud têm precedência sobre o arquivo `.env`. O ZIP gerado pelo CI contém somente o modelo vazio; credenciais locais nunca são empacotadas automaticamente.

O banco escolhido para esta instalação é o PostgreSQL existente no Railway. Copie `DATABASE_PUBLIC_URL` de Connect → Public Network; endereços `*.railway.internal` não são acessíveis pela SquareCloud. A API converte a URI pública para JDBC internamente, preservando as opções da URL e extraindo usuário/senha. Quando a URI contém credenciais, elas têm precedência sobre os campos separados. Para exigir TLS, use `?sslmode=require`; para validar o certificado, configure `verify-full` com a CA do provedor. Consulte `docs/DEPLOYMENT.md` para os detalhes.

Cadastro, login, perfil, catálogo, salas, chat e caronas precisam somente do PostgreSQL. Confirmação de e-mail e recuperação de senha exigem SMTP. Materiais, IA e voz dependem de seus provedores; os blocos opcionais estão em `deploy/optional.env.example` no repositório.

O catálogo inclui matrizes verificadas de UNA (com prioridade Aimorés), PUC Minas e UFMG. No primeiro início desta atualização, jobs em lotes carregam os registros; aguarde a conclusão em `/admin/catalog/imports`. Matrículas, salas e dados antigos são preservados pelas migrations V6/V7. Faça backup do PostgreSQL antes de atualizar. Nenhum administrador ou dado acadêmico falso é criado automaticamente.

Após o início, selecione UNA → Campus Sede Aimorés → Análise e Desenvolvimento de Sistemas (modalidade correta) → E2A Radial → Fundamental (semestres 1–2). Marque as UCs atuais, por exemplo Exploração digital e fundamentos tecnológicos e Matemática computacional aplicada. A matriz pública é organizada por níveis; confira a versão com sua matrícula no Ulife.

O laboratório de programação tem 12 desafios e aparece para matrículas em TI ou UCs de programação. O progresso é salvo no mesmo PostgreSQL. Catálogo e jogos não precisam de novas variáveis no `.env`. O frontend atualizado na Vercel requer este novo backend.
