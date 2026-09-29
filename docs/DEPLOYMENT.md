# SquareCloud + Vercel

A API Java roda na SquareCloud e a interface Next.js roda na Vercel. PostgreSQL guarda identidade, catálogo, salas, histórico da conversa, progresso e estudos gerados.

## API / SquareCloud

Variáveis básicas:

```dotenv
DATABASE_URL=
APP_URL=https://enturma-flax.vercel.app
BFF_PROXY_SECRET=
```

Integrações opcionais:

```dotenv
OPENAI_API_KEY=
AI_WEB_SEARCH_ENABLED=false
AI_BASE_URL=https://api.openai.com/v1

VOICE_ENABLED=true
LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

O modelo da IA é definido no código como `gpt-5.6-sol`.

O Flyway aplica migrations automaticamente. A atualização v4 exige a migration `V10__persistent_room_history_and_study_summary.sql`.

## Web / Vercel

Projeto: **enturma**

Configuração esperada:

- Framework: Next.js;
- Root Directory: `apps/web`;
- Include source files outside Root Directory: ativado;
- Node.js 24.x;
- Install: `npm ci --prefix ../..`;
- Build: `npm run build`.

Variáveis:

```dotenv
API_URL=https://SEU-SUBDOMINIO.squareweb.app
BFF_PROXY_SECRET=O-MESMO-SEGREDO-DA-API
```

O WebSocket é derivado da URL da API.

## Checklist de publicação

1. CI verde em `main`.
2. API reiniciada com Flyway V10 aplicado.
3. `/actuator/health` da API retorna UP.
4. `/api/health` do Web retorna UP.
5. Criar duas contas e entrar na mesma sala.
6. Enviar texto, imagem, resposta e reação.
7. Entrar depois com outro participante e validar o histórico + botão **Entender o que perdi**.
8. Encerrar a sala e validar o estudo final.
9. Testar modo claro/escuro e acessibilidade em desktop e mobile.
10. Testar LiveKit em dois navegadores.

## Observação de storage

Materiais continuam em storage privado. Imagens de chat v4 ainda ficam persistidas no banco como data URL; para alto volume, migrar para object storage com URLs assinadas antes de escalar grandes comunidades.
