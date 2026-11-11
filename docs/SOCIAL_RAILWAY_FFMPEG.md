# Processamento de mídia do Enturma Social no Railway

## Arquitetura

- Web, PWA, APK Android e aplicativo Desktop continuam chamando a mesma API autenticada `/api/v1/social/*`; **nenhum token de worker vai para os clientes**.
- A API Spring Boot do Enturma na SquareCloud mantém autorização, metadados, filas, multipart, banco PostgreSQL e armazenamento no bucket privado Cloudflare R2 `enturma-social`.
- O serviço Railway `enturma-social-media / enturma-ffmpeg-worker` executa FFmpeg e FFprobe em contêiner Java 21 com acesso público HTTPS protegido por Bearer para operações de processamento. Os arquivos são transmitidos pela API, não lidos diretamente do bucket.
- O worker NÃO recebe credenciais de R2, PostgreSQL, JWT de usuários ou segredos do BFF. Só contém `SOCIAL_FFMPEG_WORKER_TOKEN`.
- A API envia o arquivo de origem temporário ao worker, recebe ZIP com conteúdo/miniatura/metadados, valida o retorno e grava os resultados no R2; o restante do fluxo permanece inalterado.
- Os limites do pipeline original são mantidos: fonte até 128 MiB, exportação até 90 segundos, no máximo uma transcodificação por instância, verificação dos formatos por FFprobe, controles de CPU e limite de execução.

## Railway — serviço criado

| Item | Valor |
| --- | --- |
| Projeto | `enturma-social-media` |
| Serviço | `enturma-ffmpeg-worker` |
| Repositório | `luizcordeiro155/Enturma` |
| Dockerfile | `services/api/Dockerfile.media-worker` |
| Root directory | `/services/api` |
| Porta | `3000` |
| Domínio | `https://enturma-ffmpeg-worker-production.up.railway.app` |
| Healthcheck | `GET /health` |
| Fonte | `feat/railway-social-ffmpeg-worker` enquanto em validação |

O deploy é acionado pela conexão do repositório no Railway. Verifique `GET /health` retornando HTTP 200 e `{"ready":true}` antes de habilitar a API.

### Variáveis do Railway

- `SOCIAL_FFMPEG_WORKER_TOKEN` — segredo forte (mínimo 32 caracteres) já provisionado na Railway. **Não publique esse valor em GitHub, Vercel ou aplicativos**.
- `PORT` — fornecida automaticamente pela Railway.

## SquareCloud — configuração necessária na API principal

Depois de a nova versão Java estar publicada na SquareCloud, configure no ambiente da API (não nos clientes):

```dotenv
SOCIAL_ENABLED=true
SOCIAL_MEDIA_ENABLED=true
SOCIAL_FFMPEG_WORKER_URL=https://enturma-ffmpeg-worker-production.up.railway.app
SOCIAL_FFMPEG_WORKER_TOKEN=<copie com segurança o valor da variável homônima no painel Railway>
SOCIAL_STORAGE_BUCKET=enturma-social
SOCIAL_STORAGE_REGION=auto
SOCIAL_STORAGE_ENDPOINT=<endpoint privado do R2 já usado>
SOCIAL_STORAGE_ACCESS_KEY=<chave existente>
SOCIAL_STORAGE_SECRET_KEY=<segredo existente>
```

Atenção: a API lê `SOCIAL_FFMPEG_WORKER_URL` e `SOCIAL_FFMPEG_WORKER_TOKEN`; não altere `SOCIAL_FFMPEG` para uma URL, pois aquela variável continua indicando executável local no fallback.

A configuração deve ser aplicada **somente à API Java** que usa o storage e o banco existentes. Depois, reinicie a API, consulte `https://enturma-flax.vercel.app/api/backend/social/capabilities` e exija `"enabled":true,"media":true`.

## Verificação antes de liberar para todos

1. Verificar no Railway deployment `SUCCESS`, healthcheck e logs sem exceções; FFmpeg e FFprobe respondem.
2. Na SquareCloud confirmar deploy do código novo, migrations e as variáveis acima, sem exibir segredos.
3. Testar foto JPG ou PNG pequena, confirmar criação, upload, processamento `READY`, publicação, exibição pelo feed e remoção.
4. Testar vídeo MP4 de 5–10 segundos, confirmar `READY`, reprodução, thumbnail e publicação em Clips/Stories.
5. Repetir Web desktop/mobile e aplicativos instalados já atualizados, nos temas claro e escuro.
6. Inspecionar erros HTTP 401 (token incorreto), 429 (worker ocupado), 503 (FFmpeg indisponível) e 5xx; validar limites e consumo de CPU/RAM/disco antes de ampliar o uso.

## Rollback

- Desabilitar `SOCIAL_MEDIA_ENABLED=false` na SquareCloud e reiniciar; feed textual e Social continuam disponíveis.
- Remover `SOCIAL_FFMPEG_WORKER_URL` e `SOCIAL_FFMPEG_WORKER_TOKEN` quando quiser voltar ao modo FFmpeg local (somente se runtime local suportar ambos os executáveis).
- Não apagar o bucket R2, nem as tabelas do Social, nem o banco Railway.
- Alterações de código e de variáveis devem ser promovidas separadamente, com validação em preview sempre que disponível.

**Limites:** este documento descreve integração e operação. Serviço Railway criado não significa que a SquareCloud tenha recebido as variáveis nem que upload de mídia já esteja habilitado em produção. O worker de instância única tem fila limitada; dimensionar antes de carga sustentada.
