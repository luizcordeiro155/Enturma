# Social 3 — prontidão de publicação

13/11/2026. A missão autoriza publicação não destrutiva após os gates. Este registro ainda não declara o incremento publicado.

## Estado observado

- Main remoto `ed4328719faa9242c5da1ac53b82a459725ce45d`.
- Vercel produção `dpl_CnFppYpQTuihAFHHmeE6A5fcyQRa`, READY, main acima; https://enturma-flax.vercel.app/api/health respondeu 200/UP.
- API SquareCloud usa `scripts/SquareCloudStart.java`, build/fingerprint do código Java e Flyway no startup. O responsável confirmou nesta execução que a API atualiza automaticamente pela main. Confirmar versão e V72 aplicada após integração; health sozinho não confirma versão.
- Worker FFmpeg Railway `5c334b9e-d358-44df-aa35-f1e3659bcc60`, SUCCESS. `/health` respondeu 200/ready. `VideoRecipe` e `SocialTranscoder` não diferem entre SHA do worker `4d4a3fd` e a branch integrada; não há necessidade demonstrada de mudar sua infraestrutura.
- Windows distribuição Railway `ce120d56-57f0-4692-b9f2-7e6382606eef`, versão 0.4.424, source `9270a5f`; health e manifesto 200. Os fontes executáveis do shell não diferem; a Web é compartilhada. Nova publicação solicitada será validada pelo pipeline oficial, sem afirmar instalação física.
- Android distribuição Railway `1d2b55ca-01e5-4798-8163-348dd4ebccdb`, SUCCESS, source `2743072`. Verificar artefato, manifesto e integração da Web na release final.

## Gates restantes

1. E2E completo no SHA final, revisão visual e regressões; checks obrigatórios e revisões do GitHub.
2. API/V72 antes do cliente de coleções; validar autorização, persistência e exportação. Ver mapa de migração em `SOCIAL_3_IMPLEMENTATION_PROGRESS.md`.
3. Confirmar capacidades reais de R2, FFmpeg e LiveKit sem imprimir segredos. Não habilitar flag de recurso indisponível.
4. Merge da PR consolidada, confirmar main e deployments oficiais; smoke autenticado e logs.
5. Verificar manifesto/download/hash dos distribuidores e registrar o alcance dos testes Android/Windows.

## Rollback

Vercel anterior conhecido: `dpl_3iLK7SKQf5K2mjedqV9epPszxR1d` (2743072); o deployment atual acima também pode ser preservado como base imediatamente anterior. Reverter cliente e API mantendo dados/tabelas aditivas. Não trocar credenciais, contratar recursos ou executar restauração destrutiva de produção. Backup/restauração sintéticos passaram na CI; isso não comprova backup externo recente de dados reais.
