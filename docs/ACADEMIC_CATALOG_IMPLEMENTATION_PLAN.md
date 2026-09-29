# Execução do catálogo acadêmico V2

Prioridade: UNA Aimorés, ADS, ingresso em fevereiro de 2026. Usar somente fontes oficiais; a matriz pública E2A Radial organiza componentes em níveis que abrangem vários semestres. Não atribuir uma UC a um semestre específico quando o documento não o faz.

1. Preservar IDs e vínculos legados, criar tabelas normalizadas e relatório de migração. Migrar matrícula e contexto das salas sem apagar histórico.
2. Implementar importação persistida em lotes, retomada, revisão, auditoria, identidade externa, hash e versionamento. Validar integridade, concorrência e privilégios.
3. Publicar APIs paginadas, busca, solicitações de cobertura, fontes, cobertura objetiva e leitura de disciplinas. Manter a API legada documentada como compatibilidade.
4. Integrar providers independentes, snapshots oficiais verificáveis e exportações governamentais. Adicionar coleta segura, parser de documentos, detecção de mudança e sincronização opcional.
5. Carregar matrizes verificadas de UNA, PUC Minas e UFMG. Ampliar Minas Gerais onde houver evidência suficiente. Registrar lacunas sem inventar grades.
6. Entregar painel administrativo, revisão e controles de jobs. Atualizar onboarding web/mobile, perfil e disciplinas.
7. Renovar interações e animações da interface com preferência por movimento reduzido. Implementar minigames JavaScript de programação com acesso decidido pelo backend a partir da matrícula e progresso persistido.
8. Executar testes de migração, imports, idempotência, concorrência, acesso, jogos, onboarding e fluxo E2E; lint, tipos, builds web/backend e verificações mobile.
9. Atualizar documentação, publicar código e deploy web, aplicar importação verificada e renovar o pacote privado da SquareCloud preservando o `.env` atual.

Estado: catálogo, importações, APIs, painel, onboarding web/mobile, animações e minigames implementados. Validação local: 34 testes Java, 13 testes web, 4 mobile, 2 de empacotamento e 2 fluxos Playwright passaram; lint, tipos, build web e exportações Android/iOS concluídos. Pacote SquareCloud validado contra PostgreSQL isolado. As novas migrations ainda não foram aplicadas ao banco de produção: serão executadas no upload do novo JAR. As versões oficiais não foram renomeadas como “2026” sem comprovação da vigência; cada captura registra fonte, SHA-256 e data.

Limites explícitos desta carga: três instituições com matrizes publicadas; e-MEC por exportação oficial manual; demais providers nacionais entram progressivamente conforme fontes verificadas. Tópicos sem fonte não foram inventados. A captura UNA organiza níveis, não a sequência individual dos semestres de cada aluno.
