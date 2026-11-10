# Enturma Social 2.0 — implementação

O Social é um domínio independente do Fórum. A branch `codex/enturma-social-2` não deve ser implantada automaticamente: publicação depende de testes, revisão e aprovação. `SOCIAL_ENABLED=false` mantém o domínio fechado; processamento de vídeo exige infraestrutura validada separadamente.

## Invariantes

- Autorizações são decididas na API, inclusive mídia, cursores, stories e notificações. Bloqueios valem nos dois sentidos. Contas privadas exigem acompanhamento aceito.
- Amizades não são convertidas em seguidores. Selo social é independente da identidade acadêmica.
- Stories expiram no relógio do PostgreSQL. Destaques próprios são uma autorização explícita e não estendem implicitamente a disponibilidade de todos os stories.
- Curtir, salvar e seguir usam operações idempotentes e constraints; contadores vêm dos registros reais.
- O Fórum e suas tabelas permanecem intactos. Nenhuma operação depende da confiança em flags do cliente.
- Vídeos ficam em armazenamento privado, nunca no PostgreSQL. Duração do Clip é conferida após exportação; máximo de 90 segundos.
- Não usar mensagens privadas ou arquivos de estudo como sinais de recomendação.

## Entrega em fases

1. Estrutura, permissões, migrations e flags.
2. Seguidores, Feed, rascunhos, publicações e interações.
3. Clips, timeline e processamento seguro de mídia.
4. Stories e destaques.
5. Verificação social, moderação e notificações.
6. Recomendações e navegação opcional e persistente.
7. Perfil, portfólio e compartilhamento interno.
8. Compartilhamento de salas em todas as plataformas, reutilizando o componente existente.
9. Provas de integração, acessibilidade, segurança e regressão.

O estado real de cada fase, comandos executados e limitações serão registrados aqui antes da PR. Não interpretar esta lista como funcionalidades já concluídas.
