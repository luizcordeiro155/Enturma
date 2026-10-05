# Sincronização nativa SquareCloud + GitHub

Mantenha a integração automática com este repositório e a branch `main`.
Não é necessário GitHub Actions, PAT ou token adicional para publicar.

O arquivo `squarecloud.app` da raiz define o comando:

```
java -Xmx128m scripts/SquareCloudStart.java
```

Na aplicação existente, confira esse comando no campo START / comando de
inicialização do painel SquareCloud. Se o painel mantiver o antigo `java -jar
app.jar`, substitua-o pelo comando acima uma única vez e reinicie. A plataforma
pode preservar configurações da aplicação existente durante a sincronização.
Mantenha o runtime Java, MAIN `app.jar`, o domínio e o `.env` atuais.

O inicializador usa somente o JDK instalado: baixa Maven 3.9.11 do Maven Central,
verifica seu SHA-512 fixo, compila `services/api` e inicia o perfil `squarecloud`.
Se o build falhar, não inicia o JAR antigo. Não lê nem altera `.env` ou certificados.
As dependências ficam em cache; reinícios sem mudanças reutilizam o JAR após
conferir seu SHA-256. Não há binários grandes no Git.

O primeiro build precisa de acesso ao Maven Central e pode levar alguns minutos.
Há 384 MB de heap para o Maven e 128 MB para o inicializador; a API inicia depois
que a compilação termina. Configuração inicial: 1024 MB de memória.
Os testes continuam no desenvolvimento ou CI existente; o build da hospedagem
não executa testes contra o banco real.

Procure no log `[Enturma Git] API atualizada:`, migrações V6/V7 na primeira
atualização e a inicialização do catálogo UNA. O frontend continua com deploy
automático do `main` na Vercel (`apps/web`).

O log anterior mostrava inicialização normal, mas um JAR antigo com V1–V5.
Copiar código Java não substitui um JAR compilado. O warning do Flyway sobre
PostgreSQL 18 não era uma falha de conexão.

Referências: [START e runtime](https://docs.squarecloud.app/en/getting-started/config-file),
[integração automática](https://help.squarecloud.app/en-us/article/how-to-connect-your-github-repository-and-deploy-automatically-mr6srt/).

## Deploy trigger

A integração automática deve iniciar um deploy a cada novo push na branch `main`.
