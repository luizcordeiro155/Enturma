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

O catálogo começa vazio. Cadastre sua conta, promova o administrador pelo procedimento em `docs/AUTHENTICATION.md` e importe dados verificados em `/admin`. Nenhum administrador ou dado acadêmico falso é criado automaticamente.
