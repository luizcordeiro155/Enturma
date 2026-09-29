# Deploy

Não foi criado recurso pago nem realizado deploy de produção. Backend e frontend são aplicações distintas.

## Railway

Criar serviço PostgreSQL e serviço backend com root `services/api`, Dockerfile local. Configurar `DATABASE_URL` em formato **JDBC** (`jdbc:postgresql://host:port/database`), `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `APP_URL`, `CORS_ORIGINS` e provedores. A URL `postgresql://user:pass@...` do Railway não é JDBC: separar credenciais, não colar diretamente sem conversão. Usar rede privada/TLS conforme o ambiente. PORT é lido automaticamente. Healthcheck `/actuator/health`. Não expor endpoints adicionais do Actuator.

## Vercel

Projeto Next.js com root `apps/web`, instalação a partir do lockfile do monorepo (`npm ci` na raiz quando configurar o build). Configurar `API_URL` para o backend HTTPS, `APP_URL` para o domínio canônico e `WEBSOCKET_URL=wss://backend/ws`. Cookies são Secure em produção. Alinhar `CORS_ORIGINS` no backend. Não usar wildcard para preview domains; provisionar staging separado.

O BFF encaminha uploads e limita a 16 MB, mas a plataforma de hospedagem pode aplicar limite menor de request. Para arquivos acima do limite efetivo da Vercel, implementar upload direto por URL pré-assinada com confirmação/validação no backend antes de habilitar publicamente; não anunciar 15 MB em produção até resolver isso.

LiveKit precisa de domínio próprio/cloud e TLS. Bucket S3 deve ser privado, sem listagem pública. Criar bucket previamente, configurar CORS apenas se for adotado upload direto. Configure SMTP real e monitore falhas/retentativas da outbox. IA e voz permanecem desabilitadas sem credenciais.

## Mobile

Expo SDK 55, Router e SecureStore. Configurar EXPO_PUBLIC_API_URL com a API HTTPS. Exportação JS não substitui compilação nativa, assinatura e testes em Android/iOS reais. EAS/lojas não foram configurados. Voz nativa requer integração LiveKit React Native e development build, ainda pendente.

## Backup e operação

Ativar backups PostgreSQL do provedor, manter cópia criptografada independente e definir RPO/RTO antes do lançamento. Testar restauração em banco separado com `pg_restore`, aplicar migrations e executar smoke/E2E. Nunca testar recuperação sobre produção. Versionar objetos S3 quando suportado e alinhar ciclo de vida/retention com exclusão de conta. Monitorar disponibilidade, filas, falhas de SMTP/IA/voz, saturação de conexões e custo por usuário. Não publicar esta fase como produção completa.
