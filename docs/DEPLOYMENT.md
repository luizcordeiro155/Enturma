# SquareCloud + Vercel

A API Java roda na SquareCloud; a interface Next.js roda na Vercel. O navegador usa o BFF da Vercel para HTTP e conecta diretamente ao WebSocket da SquareCloud. PostgreSQL guarda os dados e precisa existir antes do primeiro boot. Nenhum banco pago é criado pelos scripts.

## 1. API: preparar o ZIP

O CI publica o artefato **squarecloud-api**, contendo `enturma-squarecloud.zip` e seu SHA-256, somente depois dos testes. Baixe em GitHub → Actions → execução aprovada → Artifacts. Extraia o arquivo de artefatos do GitHub e envie o ZIP interno à SquareCloud.

Para gerar localmente (Java 21+, Maven 3.9+, Python 3.11+):

```sh
mvn -f services/api/pom.xml verify
python scripts/package-squarecloud.py --subdomain SEU-SUBDOMINIO
```

Os testes Maven exigem PostgreSQL separado, conforme README. O script empacota somente o fat JAR, `squarecloud.app`, `.env` modelo e instruções; não procura nem inclui segredos locais. O parâmetro de subdomínio é opcional: pode ser escolhido no painel. O ZIP fica em `dist/enturma-squarecloud.zip`.

A configuração define Java `recommended`, 1024 MB, reinício automático, heap limitado a 65% e perfil `squarecloud`. O serviço escuta em `0.0.0.0:80` e aplica migrations Flyway automaticamente. A SquareCloud recebe o JAR pronto, sem Maven no servidor. Confira a memória disponível no seu plano antes do upload. [Runtime Java](https://squarecloud.app/en/runtimes/java) · [Spring Boot e porta 80](https://help.squarecloud.app/en-us/article/how-to-host-a-spring-boot-application-java-vhja1m/)

## 2. API: somente cinco variáveis básicas

Preencha `.env` dentro do ZIP, ou use as variáveis do painel da SquareCloud (têm precedência). A aplicação lê `.env` na pasta do JAR como propriedades UTF-8, com valores sem aspas. Para valores com barras invertidas, prefira o painel ou escape cada barra como `\\`.

| Variável | Valor |
|---|---|
| `DATABASE_URL` | URL JDBC do PostgreSQL, sem senha: `jdbc:postgresql://HOST:PORT/BANCO?...` |
| `DATABASE_USERNAME` | Usuário do banco |
| `DATABASE_PASSWORD` | Senha do banco |
| `APP_URL` | URL HTTPS web; modelo: `https://enturma-flax.vercel.app` |
| `BFF_PROXY_SECRET` | Chave aleatória de 32+ caracteres, igual à configurada na Vercel |

Gere a chave localmente com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Não a coloque no Git. Ela autentica a identidade anônima que o BFF encaminha para os limites de requisição; evita que todos os visitantes compartilhem o limite do proxy e não substitui a autenticação de usuário.

`PORT`, `CORS_ORIGINS` e flags de provedores não são necessários na configuração básica. A porta vem do perfil; CORS e WebSocket usam `APP_URL`. SMTP, storage, IA e voz estão separados em `deploy/optional.env.example`. Sem SMTP, confirmação/recuperação de senha não conseguem entregar e-mails. O núcleo de cadastro, login, catálogo, salas, chat e caronas usa PostgreSQL.

### PostgreSQL existente no Railway (esta instalação)

No serviço PostgreSQL do Railway, use os dados de **Connect → Public Network** / `DATABASE_PUBLIC_URL`. O endereço privado `*.railway.internal` não funciona fora do Railway. Se o acesso público ainda estiver desligado, habilite o TCP Proxy nas configurações de rede do serviço. Não crie outro banco só para hospedar a API na SquareCloud. [Conexão externa no Railway](https://docs.railway.com/databases/postgresql)

Separe os dados da URI pública:

```text
postgresql://USUARIO:SENHA@HOST-PUBLICO:PORTA/BANCO
```

No `.env`:

```dotenv
DATABASE_URL=jdbc:postgresql://HOST-PUBLICO:PORTA/BANCO?sslmode=require
DATABASE_USERNAME=USUARIO
DATABASE_PASSWORD=SENHA
```

Use a porta pública exibida, que pode ser diferente de 5432. Se a senha na URI estiver codificada com `%xx`, use a senha original do campo de credenciais no `DATABASE_PASSWORD`. `sslmode=require` exige criptografia, mas não valida a identidade do certificado; para essa validação, forneça a CA e use `verify-full` conforme a configuração TLS do banco. O template Railway vem com SSL habilitado; nenhum certificado cliente da SquareCloud é necessário para conectar a esse banco. [Imagem PostgreSQL do Railway](https://github.com/railwayapp-templates/postgres-ssl) · [Modos TLS JDBC](https://jdbc.postgresql.org/documentation/ssl/)

### Alternativa: PostgreSQL da SquareCloud e certificados

O serviço PostgreSQL da SquareCloud exige certificados. Baixe os arquivos privados pelo painel e guarde fora do Git. A conexão JDBC deve usar o formato aceito pelo driver Java; não cole uma URI `postgresql://usuario:senha@...` diretamente. [Guia SquareCloud](https://help.squarecloud.app/pt-br/article/como-criar-um-banco-postgresql-e-conectar-ma6gn5/)

Para compatibilidade entre versões do driver, crie um PKCS12 com alias `user` usando o certificado e a chave disponibilizados pelo provedor:

```sh
openssl pkcs12 -export -name user -in client-cert.crt -inkey client-key.key -out client.p12 -passout pass:
```

Se o certificado tiver intermediários, inclua a cadeia com `-certfile`. O arquivo sem senha continua sendo uma credencial privada: mantenha-o apenas no servidor/pacote de upload privado. Coloque `client.p12` e a CA fornecida como `root.crt` em `certs/` e use:

```text
jdbc:postgresql://HOST:PORT/squarecloud?sslmode=verify-full&sslrootcert=certs/root.crt&sslkey=certs/client.p12&sslpassword=
```

Use a CA correta fornecida pelo painel, não um arquivo aleatório. O guia SquareCloud apresenta `verify-ca`; se o certificado emitido não tiver o hostname, confirme essa limitação com o provedor antes de optar por `verify-ca`. Nunca use `NonValidatingFactory` ou desative TLS. [SSL do driver PostgreSQL JDBC](https://jdbc.postgresql.org/documentation/ssl/)

Para incluir deliberadamente suas configurações/certificados no ZIP privado:

```sh
python scripts/package-squarecloud.py --env-file .env --cert-dir CAMINHO-PRIVADO --subdomain SEU-SUBDOMINIO
```

O script só inclui os nomes de certificado documentados. Esse ZIP privado não deve ser publicado em releases ou artifacts públicos.

## 3. Vercel: projeto existente `enturma`

No projeto conectado a `luizcordeiro155/Enturma`, configure:

| Campo | Valor |
|---|---|
| Framework | Next.js |
| Root Directory | `apps/web` |
| Include source files outside Root Directory | Ativado (contratos compartilhados) |
| Node.js | 24.x |
| Install Command | `npm ci --prefix ../..` |
| Build Command | `npm run build` |
| Output Directory | Padrão do Next.js; não usar `out` |

`apps/web/vercel.json` versiona o framework, os comandos e a região São Paulo. O Root Directory é uma configuração do projeto na Vercel, não uma propriedade de `vercel.json`. A branch selecionada para produção precisa conter este código; o commit inicial com somente README não consegue gerar o app. [Monorepos na Vercel](https://vercel.com/docs/monorepos)

Configure somente:

```dotenv
API_URL=https://SEU-SUBDOMINIO.squareweb.app
BFF_PROXY_SECRET=O-MESMO-SEGREDO-DA-API
```

`API_URL` é a origem HTTPS, sem `/api/v1`. O WebSocket é derivado como `wss://.../ws`. Os domínios de produção e preview vêm das variáveis de sistema da Vercel, sem wildcard. Para domínio próprio que não esteja nessas variáveis, adicione `APP_URL` também ao web. Cookies de sessão são HttpOnly/Secure. Nunca use `NEXT_PUBLIC_` para essas chaves. Faça redeploy após alterar variáveis.

Previews devem apontar para uma API/banco de staging. Para chat no preview, adicione sua origem **exata** a `CORS_ORIGINS` da API de staging; não autorize todos os `*.vercel.app`.

No web, upload é limitado a **4 MB** antes do envio, abaixo do limite de payload da Vercel. Downloads são transmitidos em streaming. Arquivos maiores exigem um fluxo futuro de upload direto autenticado. [Limites das Functions](https://vercel.com/docs/functions/limitations)

## 4. Conferir a publicação

1. SquareCloud: `/actuator/health` retorna `{"status":"UP"}`.
2. Vercel: `/api/health` retorna `{"status":"UP"}` somente quando alcança a API e o banco está disponível.
3. Cadastre uma conta, importe o catálogo verificado com um administrador e conclua o onboarding.
4. Em dois navegadores, entre na mesma sala, troque mensagens, encerre a sala e confira o encerramento em ambos.
5. Configure SMTP e valide recuperação de senha antes de abrir o serviço ao público.

O CI usa build web de produção e executa o JAR compilado para Java 21 no runtime Java 25, com o perfil SquareCloud. Isso verifica compatibilidade local/Linux; não substitui conferir credenciais, TLS, domínio e WebSocket na conta SquareCloud real.

## Operação e mobile

Ative backups do PostgreSQL, teste restauração em banco separado e acompanhe saúde, memória, conexões e falhas de provedores. A API não depende de arquivo local permanente para dados dos usuários. Certificados de conexão são configuração privada.

O app Expo continua usando a mesma API por `EXPO_PUBLIC_API_URL=https://SEU-SUBDOMINIO.squareweb.app/api/v1`. Não participa do build da Vercel. A prioridade desta configuração é web; não houve publicação em lojas.
