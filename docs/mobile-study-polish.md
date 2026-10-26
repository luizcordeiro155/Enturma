# Conversas nos cadernos e experiência mobile

## Comportamento

- Um toque no tema alterna claro/escuro. Pressionar por 480 ms abre Claro, Escuro e Sistema; mouse, teclado e redução de movimento também são suportados.
- Cadernos exibem a conversa salva em ordem, com fontes selecionadas, ferramentas de estudo e citações. O contexto da IA inclui 16 respostas recentes e até seis interações anteriores relevantes, entre as últimas 100. O histórico visível permanece salvo, mas não representa memória ilimitada do modelo.
- Foto e banner são opcionais, limitados a 3 MB e acessíveis somente ao dono do caderno. A pesquisa externa usa a ferramenta real do provedor e guarda seus links; exige `AI_WEB_SEARCH_ENABLED=true` e um provedor compatível.
- O QR abre o convite existente para confirmar a entrada. A câmera para após leitura, fechamento ou ocultação da página. Links de outra origem são rejeitados.
- Ao finalizar uma carona recente, o participante recebe a avaliação com estrelas contrastantes. Enviar retorna ao mapa; adiar mantém a opção de avaliar pela carona.
- O Guia usa nove composições curtas diferentes, com loops e pausa em segundo plano.
- O widget Portfólio usa a edição atual do mural e só oferece link para portfólio publicado; respeita a privacidade dos widgets.
- Web Push e eventos recebidos com o navegador aberto usam o mesmo identificador para evitar avisos duplicados entre abas. Apenas a conversa efetivamente focada suprime seu alerta. Permissão do navegador e preferências de notificação continuam sendo respeitadas.

## Implantação

1. Validar CI e obter backup PostgreSQL verificável.
2. Publicar backend com Flyway V59, que acrescenta mídia privada dos cadernos, flags de pesquisa e citações externas. Não altera usuários, sessões ou verificações acadêmicas.
3. Confirmar saúde da API e V59 antes de promover o deployment de produção Web na Vercel.
4. Conferir permissões, preferências, configuração VAPID e IA. Notificações com o navegador fechado dependem da entrega Web Push e das políticas do sistema operacional.
5. Os shells Android/Desktop recebem a interface hospedada. A alteração no lockfile também aciona os builders existentes da Railway; conferir SHA, versão e checksums dos manifests antes de anunciar os instaladores.

Rollback: reverter a aplicação preservando V59 e seus dados. O schema é compatível com o release anterior; não executar exclusão de tabelas para rollback.

## Validação

Testes de integração cobrem conversa, ordem do contexto, pesquisa real do provedor, idempotência, mídia privada, formatos inválidos e privacidade do portfólio. Testes de frontend cobrem gestos do tema, estrelas, convites e deduplicação/supressão de notificações. Playwright percorre notebook, persistência de banner, câmera com frames de um QR gerado pelo backend, confirmação de entrada e avaliação com volta ao mapa.

O teste de notificações usa navegador completo em modo headless: o Chromium Headless Shell não implementa entrega nativa de notificações. Verificação em navegador e export dos apps não substituem homologação de câmera, teclado e notificações em aparelhos físicos.

---

## Nota de atualização — 25/10/2026

Este documento é preservado como registro histórico da implementação original. Para o estado atual da branch `main` até a PR #104, ver [Estado atual](STATUS.md), [Arquitetura](ARCHITECTURE.md), [Banco V1–V63](DATABASE.md), [API](API.md), [Segurança](SECURITY.md), [Mobile 0.3.30](MOBILE.md) e [Desktop 0.3.15](DESKTOP.md). Versões, limites e pendências registrados nesta entrega podem ter sido atualizados posteriormente (KLIPY, Caronas, perfis, chats, Cadernos IA, animações e instaladores). Não interpretar validação de código como homologação completa em produção.
