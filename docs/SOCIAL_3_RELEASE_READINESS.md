# Social 3 — prontidão de publicação

## Publicação verificada — 13/11/2026

Este estado prevalece sobre o histórico abaixo. PRs #150 e #151 **MERGED**; main `30a434b299645b38ed96ce78b56aa79b3c5a7036`, incluindo integralmente o trabalho anterior. Head aprovado da #151: `e2276665a57c6b57d674b9da4d894c89c1bbc19e`; CIs `43535098339` e `43535103011` aprovadas, todos os checks verdes antes do merge. CI adicional da main `43540279660` em acompanhamento.

| Entrega | Resultado comprovado |
| --- | --- |
| API SquareCloud | Atualização automática pela main observada. `/actuator/health` 200/UP; `/api/v1/public/social-release` 200, release `social-figma-2026-11-13`, ready=true. Consulta READ ONLY confirmou V72/V73 bem-sucedidas e RLS. O probe comprova contrato/schema, não expõe SHA do binário. |
| Web Vercel | Deployment production `dpl_7XJmiMENyhdpSAtpn7Qq1Cydd2iq`, READY, SHA `30a434b`. Promovido após API pronta. Domínios `enturma-flax.vercel.app` e `enturmaa.vercel.app` com aliases concluídos. Atribuição automática restaurada. |
| Windows Railway | Deployment `ddebac78-a503-46e4-882c-59abe5ed0710` SUCCESS; versão **0.4.519**, sourceCommit `30a434b`. ZIP e EXE baixados: tamanhos e SHA256 conferem com manifesto. |
| Android Railway | Build oficial `2003de78-64c1-4dc2-812f-c576e7da8b60`, sourceCommit `30a434b`, em acompanhamento. Primeiro agendamento `619bf045-7aef-4418-87ae-32e8d010f9c2` foi SKIPPED pelo filtro de mudanças; reexecutado esse mesmo novo SHA, sem reutilizar o commit antigo. |

URLs oficiais: [Web](https://enturma-flax.vercel.app), [API](https://enturma-api.squareweb.app/actuator/health), [downloads](https://enturma-flax.vercel.app/download), [manifesto Android](https://enturma-android-download-v3-production.up.railway.app/latest-android.json), [manifesto Windows](https://enturma-desktop-download-v5-production.up.railway.app/latest.json).

Provas: 191 testes Java, zero falhas/erros e um ignorado; 309 testes Web/79 arquivos; 76 E2E aprovados, incluindo fluxo de coleções, retorno ao Feed, exportação de mídia e LiveKit isolado. Lint, TypeScript, builds, exportações mobile, compilação Android e teste de segurança do instalador Windows aprovados. Matriz de 160 capturas em dez larguras/quatro temas inspecionada; capturas finais de Clips 390/1366/1920 presentes. Os últimos ajustes corrigiram altura intrínseca dos vídeos, cabeçalho 320px e gutter duplicado. A última falha era a medição antes da rolagem automática do Playwright; o trace comprovou posição idêntica antes/depois da navegação, mantendo a asserção exata corrigida.

Smoke em produção: saúde Web/API 200; gate de schema via BFF 200/ready; Feed/coleções sem autenticação respondem 401. Chromium real validou login desktop e cadastro mobile, acesso aos downloads e Voltar, sem overflow/pageerror. Vercel sem registros error/fatal na janela consultada após promoção. Nenhuma operação de teste gravou publicações ou contas em produção.

Limites: não houve smoke autenticado com conta de produção nem instalação física Android/Windows. Lives passaram com LiveKit isolado na CI; a flag de produção estava desativada na observação anterior e não foi alterada. Não declarar paridade visual integral com Instagram: composição e identidade Enturma são preservadas; perfil/menus/editor apresentam diferenças registradas. Enquetes/perguntas de Stories, grupos sociais e ferramentas avançadas de descoberta/criadores não foram declarados concluídos. A auditoria npm desta release registra 22 entradas (6 altas, 15 moderadas, 1 baixa, 0 críticas), com cadeias Expo já triadas em `DEPENDENCY_AUDIT.md`; não é auditoria limpa. RLS não substitui autorização da API: o papel runtime observado tem bypass RLS.

Rollback imediato Web: `dpl_CnFppYpQTuihAFHHmeE6A5fcyQRa` (`ed43287`). Manter tabelas aditivas V72/V73 em qualquer reversão de código. Distribuidores anteriores preservados no histórico Railway. Não houve troca de segredos, nova infraestrutura, contratação ou migração destrutiva.

## Histórico anterior à publicação

13/11/2026. A missão autoriza publicação não destrutiva após os gates. Os registros seguintes descrevem a preparação anterior.

## Estado observado

- Main remoto `ed4328719faa9242c5da1ac53b82a459725ce45d`.
- Vercel produção `dpl_CnFppYpQTuihAFHHmeE6A5fcyQRa`, READY, main acima; https://enturma-flax.vercel.app/api/health respondeu 200/UP.
- API SquareCloud usa `scripts/SquareCloudStart.java`, build/fingerprint do código Java e Flyway no startup. O responsável confirmou nesta execução que a API atualiza automaticamente pela main. Confirmar versão e V72 aplicada após integração; health sozinho não confirma versão.
- Worker FFmpeg Railway `5c334b9e-d358-44df-aa35-f1e3659bcc60`, SUCCESS. `/health` respondeu 200/ready. `VideoRecipe` e `SocialTranscoder` não diferem entre SHA do worker `4d4a3fd` e a branch integrada; não há necessidade demonstrada de mudar sua infraestrutura.
- Windows distribuição Railway `ce120d56-57f0-4692-b9f2-7e6382606eef`, versão 0.4.424, source `9270a5f`; health e manifesto 200. Os fontes executáveis do shell não diferem; a Web é compartilhada. Nova publicação solicitada será validada pelo pipeline oficial, sem afirmar instalação física.
- Android distribuição Railway `1d2b55ca-01e5-4798-8163-348dd4ebccdb`, SUCCESS, source `2743072`. Verificar artefato, manifesto e integração da Web na release final.

## Gates restantes

1. E2E completo no SHA final, revisão visual e regressões; checks obrigatórios e revisões do GitHub.
2. API/V72/V73 antes do cliente de coleções; validar autorização, persistência e exportação. Ver mapa de migração em `SOCIAL_3_IMPLEMENTATION_PROGRESS.md`.
3. Confirmar capacidades reais de R2, FFmpeg e LiveKit sem imprimir segredos. Não habilitar flag de recurso indisponível.
4. Merge da PR consolidada, confirmar main e deployments oficiais; smoke autenticado e logs.
5. Verificar manifesto/download/hash dos distribuidores e registrar o alcance dos testes Android/Windows.

## Rollback

Vercel anterior conhecido: `dpl_3iLK7SKQf5K2mjedqV9epPszxR1d` (2743072); o deployment atual acima também pode ser preservado como base imediatamente anterior. Reverter cliente e API mantendo dados/tabelas aditivas. Não trocar credenciais, contratar recursos ou executar restauração destrutiva de produção. Backup/restauração sintéticos passaram na CI; isso não comprova backup externo recente de dados reais.

## Continuação autorizada — layout Figma e gate de schema

O usuário autorizou implementar o layout aprovado e publicar em produção. O incremento adapta rail de 76 px, dock de cinco destinos, perfil de três colunas, coluna lateral de conexões reais e painéis móveis, preservando os fluxos completos já presentes na PR.

Antes da promoção da Web, chamar `GET /api/backend/public/social-release` no domínio atual da Vercel. O BFF encaminha à API SquareCloud. Exigir HTTP 200 e `{"release":"social-figma-2026-11-13","ready":true}`. A resposta confirma o código do probe, V72/V73 bem-sucedidas no histórico Flyway e RLS nas cinco tabelas protegidas. Não comprova capacidades de mídia, concessões de papéis, LiveKit ou a versão do frontend: estes gates permanecem separados. Falha responde 503; API antiga não responde com esse contrato. Nenhum segredo ou dado pessoal é exposto.

O deploy automático deve construir a produção sem atribuir os domínios até a API estar pronta (`autoAssignCustomDomains=false` durante o gate). Promover somente o deployment de produção do SHA integrado com CI aprovada e restaurar a atribuição automática após a promoção. Em falha, manter o domínio na produção anterior e registrar o bloqueio; não executar down migrations.

Validação local do incremento: build Web, typecheck, lint sem erros e 303 testes Web aprovados. O SHA final ainda depende da CI integrada, evidência visual e observação do deploy. Este parágrafo não declara publicação concluída.
