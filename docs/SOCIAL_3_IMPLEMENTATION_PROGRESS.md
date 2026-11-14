# Social 3 — progresso verificável

## Release atual — 13/11/2026 (prevalece sobre o histórico)

PRs #150/#151 integradas na main `30a434b299645b38ed96ce78b56aa79b3c5a7036`. CIs finais da PR `43535098339`/`43535103011` aprovadas: 76 E2E, 309 Web e 191 Java (um ignorado). Web publicada no deployment production `dpl_7XJmiMENyhdpSAtpn7Qq1Cydd2iq`; domínio oficial confirmado no SHA integrado. API atualizou automaticamente; V72/V73 e probe ready=true verificados. AutoAssignCustomDomains restaurado. Windows 0.4.519 publicado; ZIP/EXE baixados e hashes conferidos. Android build `2003de78-64c1-4dc2-812f-c576e7da8b60` ainda em acompanhamento. Não afirmar instalação física ou smoke autenticado de produção.

Próximo comando exato: consultar o deployment Android acima e, após SUCCESS, executar `node .local/social3-verify-native.cjs 30a434b299645b38ed96ce78b56aa79b3c5a7036 android`; confirmar também CI da main `43540279660`. Atualizar o resultado no documento `SOCIAL_3_RELEASE_READINESS.md`, que contém URLs, evidências, rollback e limitações. Nenhum dado de teste foi gravado em produção; premium-audit.json preservado.

## Checkpoint vigente — histórico de painéis, 13/11/2026

CI `43369840229` do SHA `416fbcd`: Java, auditoria, lint, TypeScript, unitários, builds, Android e Windows aprovados; 73/74 E2E aprovados. As 160 capturas da matriz concluíram, inclusive largura desktop >1100px. A falha remanescente revelou bug real no histórico compartilhado: substituir Opções por Coleções fechava também Explorar/visualizador. Corrigido em `useOverlayHistory`: somente o painel superior atende Voltar; travessia causada por fechamento não fecha ancestrais. Três testes reproduziram a falha antes e passaram depois; 12 testes focados de histórico/chat aprovados, TypeScript e lint aprovados. Nenhum teste removido ou limite de API relaxado.

Próximo passo: acompanhar CI do próximo commit, concluir E2E de criação/renomeação/exclusão de coleção, inspecionar capturas, integrar #151 preservando #150 e publicar. Produção ainda permanece na base anterior; V72/V73 não aplicadas. `premium-audit.json` permanece intocado.

## Complemento: exportação, proteção do banco e geometria

V73 habilita RLS default-deny e revoga PUBLIC em tabelas V71/V72, seguindo V62/V69. API confiável dona das tabelas mantém autorização por objeto; nenhum FORCE RLS, exclusão ou alteração de dados. Caso runtime restrito tenha sido configurado pelo operador, confirmar grants/policies antes do release. Rollback mantém tabelas aditivas e dados.

Catálogo autenticado `/account/privacy/export/sections` torna a API dona da lista exportável, incluindo coleções e dados Studio. Cliente consulta catálogo e usa lista anterior somente em 404, permitindo sobreposição de versões. Teste verifica isolamento de exportação entre donos. Max-width legado corrigido para grades desktop; matriz reaproveita montagem entre temas para evitar requisições redundantes.

Atualizado em 13/11/2026 durante a execução; publicação deste incremento ainda pendente.

## Recuperação e integração

- Branch `codex/social-instagram-parity`; trabalho local preservado em `4f096e5`.
- PR #150 (`codex/social-feed-studio-polish`, `8b7ad63`) consultada, Draft, CI aprovada, sem threads de revisão encontradas. Incorporada por merge `1bb0ff0`, preservando ambas as correções de scroll e os testes anteriores.
- PR #151 consolida o trabalho: https://github.com/luizcordeiro155/Enturma/pull/151. Último commit enviado antes das coleções: `ecb2215`.
- Feed misto POST/CLIP, composição desktop de Clips, prévias/capas do Studio e listas paginadas de seguidores da PR #150 foram reaproveitados.

## Incrementos desta execução

- Observer, atualização por gesto e inserção de novidades usam o scroll real; posição preservada ao alternar abas.
- Explorar usa feed, busca, autorização e visualizador existentes; grades de três colunas mobile e quatro desktop, proporção 3:4.
- Navegação inclui Explorar e acesso ao chat existente.
- Inventário individual das 24 referências originais em `SOCIAL_3_VISUAL_REFERENCES.md`; arquivos copiados apenas localmente e ignorados pelo Git.
- Matriz Playwright cobre dez larguras, incluindo notebook 1366×768, quatro temas e Feed/Explorar/perfil/criação. Imagens originais sintéticas somente no teste isolado; nenhuma mídia de terceiros na aplicação.
- Coleções privadas nomeadas: criar, renomear, excluir, adicionar/remover publicações e navegar. Persistência aditiva V72; isolamento por proprietário; limite de 50 coleções e 5.000 itens; retries idempotentes. Exportação e exclusão da conta incluem os novos dados.

## Invariantes de coleções e migração

Leitor/escritor anterior: `SocialPosts` e cliente de Salvos, tabela `social_reaction`, `kind=SAVE`. Leitor/escritor novo: `SocialCollections`, `SocialPosts.feed` com `collectionId`, UI Coleções. Novas tabelas `social_collection` e `social_collection_item`; nenhuma linha antiga é reescrita. Acesso à coleção não concede acesso à publicação: a regra central de bloqueio/conta privada/expiração continua obrigatória.

Expandir via Flyway V72, publicar API, verificar os endpoints, então Web. Clientes antigos continuam usando SAVE. Adicionar à coleção salva o post; retirar da coleção não desfaz SAVE; desfazer SAVE retira das coleções. As escritas novas serializam pelo perfil do proprietário para preservar quotas e concorrência. Excluir coleção preserva publicações e Salvos. Não há backfill obrigatório nem etapa de contração.

Rollback: reverter cliente antes da API; manter tabelas e dados V72. Uma API antiga ignora as novas tabelas e não limpa associações ao desfazer SAVE; durante rollback a interface antiga não exibe coleções. Ao retomar a API nova, leituras da coleção continuam filtrando SAVE e autorização. Nenhuma migração reversa destrutiva autorizada.

## Limites ainda em verificação

Paridade visual integral não está declarada. A auditoria inclui câmera/galeria, mensagens, interações de Stories, lives e métricas; existência de código não comprova habilitação em produção. Grupos privados, enquetes/perguntas em Stories e histórico de busca não têm entrega comprovada por este checkpoint. Android/Electron compilados não equivalem a homologação em aparelho físico. Ver testes e prontidão nos documentos específicos.
