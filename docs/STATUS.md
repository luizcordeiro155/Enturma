# Enturma 0.3.0

Implementação em `codex/enturma-v0.3.0`, baseada em `937a3be`. Publicação prevista em um PR e squash único, pelas integrações Git existentes. Nenhum GitHub Actions foi acrescentado.

## Funcionalidades

- Perfil com identidade e recorte preservados, tema secundário, efeitos, privacidade, até oito widgets ordenáveis e quatro insígnias conquistadas em destaque.
- Conquistas server-side sobre salas, fórum, cadernos e jogos; concessão única e XP no ledger existente.
- UFMG ampliada de 35 para 78 disciplinas: 43 optativas da mesma fonte oficial, em grupo sem semestre. UNA e PUC preservados.
- Dezoito templates de desafios acadêmicos associados às matérias verificadas selecionadas; cinco missões por jogo/dia, prática, tentativas e dificuldade progressiva. Os quatro jogos de programação existentes permanecem disponíveis.
- Salas rápidas com grace period, salas de 1–5 dias, presença, reservas, controle do anfitrião e avisos de prazo.
- Chamada global Web/nativa, chat persistente de salas, typing efêmero, mensagens enriquecidas e cards do Monitor Enturma.
- Moderação determinística, fila opcional de classificação para revisão humana, evidências, medidas auditadas e recurso. Conversas privadas E2EE excluídas do processamento.
- Preferências in-app/e-mail por categoria, verificadas novamente antes de enviar a outbox; segurança e autenticação não entram no opt-out.
- Desktop com bridge isolada, download verificado, atualização integrada à UI, instalador NSIS por usuário e ZIP com formato compatível com o manifesto 0.2.0 (gate de execução abaixo).
- Mobile com navegação inferior, temas, salas/chat/imagens/chamadas, fórum, cadernos, desafios, perfil, amigos e caronas. APK/AAB configurados; nenhuma publicação em loja realizada.

## Evidências locais

64 testes Java aprovados no PostgreSQL isolado; migrations V1–V25 aplicadas do zero, catálogo importado sem falhas. Playwright: nove fluxos aprovados no conjunto e reexecuções dirigidas. Dois usuários com mídia LiveKit local real, compartilhamento de tela e navegação preservando conexão; câmera/microfone sintéticos do Chromium.

Responsividade: 320×568, 390×844, 1024×600, 1376×766/768, 1920×1080 e 3440×1440, com acesso por foco/scroll a Configurações e sem overflow horizontal. TypeScript Web/Mobile, bundles Android/iOS Hermes, prebuild Android, NSIS/ZIP Windows validados. Teste de caderno usa fornecedor de IA controlado, sem homologar resposta paga real.

## Limites operacionais

- iOS requer macOS/Linux para gerar o projeto e assinatura real para distribuir. A página informa “em preparação”; nenhum certificado Apple inventado.
- EAS exige `EXPO_PUBLIC_API_URL` HTTPS real. Configurar `ANDROID_DOWNLOAD_URL` apenas depois de publicar um APK. Exportação JS não equivale a teste em aparelho físico.
- Não houve homologação em Android/iOS físico. Push nativo não é substituído por notificações in-app/WS.
- Mídia usa criptografia de transporte WebRTC; não se anuncia E2EE de mídia. Privado entre amigos mantém E2EE/cofre no Web; salas e caronas têm autorização/retenção próprias.
- Snapshots WS permanecem por instância; escala horizontal exige barramento. Teste de carga não realizado.

Checklist e publicação: [V0_3_IMPLEMENTATION](V0_3_IMPLEMENTATION.md).

### Recuperação do Desktop legado

A versão 0.2.0 recebe uma orientação dentro do app para baixar o instalador oficial quando o iniciador antigo falha. A recuperação inicial exige executar o EXE, sem excluir conta/dados. A instalação da bridge nova foi validada; não se afirma que o código antigo foi corrigido remotamente. Produção é publicada via PR #21 e squash, conforme a solicitação de liberação de 02/10/2026.
