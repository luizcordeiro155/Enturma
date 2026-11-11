# Enturma Social 2.0

Branch `codex/enturma-social-2`, baseada na main `410a740`, entregue pela PR #144. O Social usa `/social`; o Fórum continua independente em `/forum`. O responsável autorizou a integração na main em 11/11/2026, condicionada às validações. Ativar mídia exige a configuração externa descrita abaixo.

## Implementação

| Área | Comportamento entregue no código |
| --- | --- |
| Feed | Para Você, Seguindo e Minha Faculdade; cursor, busca de pessoas/textos/hashtags, páginas sem duplicação, atualização explícita sem deslocar a leitura, posições independentes |
| Publicações | Texto, imagem, vídeo, carrossel ordenável, hashtags, menções, links HTTPS e seleção de projetos do portfólio público; rascunhos locais por conta e no servidor |
| Clips | Até 90 segundos após exportação; player vertical, um vídeo ativo, som inicialmente desligado, teclado, botões, duplo toque para curtir e carga apenas do ativo e vizinhos |
| Editor | Galeria, arrastar arquivo, captura/alternância de câmera, cortes, divisão/remoção/reordenação, crop 9:16, zoom, posição, rotação, volume/silêncio, textos temporizados, capa, desfazer/refazer e revisão do resultado processado |
| Stories | Texto, imagem/vídeo e elementos de texto/emoji posicionáveis; expiração no servidor, progresso/pausa, visualizações, resposta privada entre amigos, curtida, compartilhamento e destaques próprios |
| Relações | Seguidores separados de amizades, conta privada, solicitações e decisões, remover seguidor, seguir de volta, “Te segue”, silêncio e bloqueio existente |
| Perfil | Contadores reais; Posts, Clips, Republicações, Marcados aprovados; salvos privados, até três posts fixados, destaques e compartilhamento. Perfil personalizável existente preservado |
| Interações | Curtidas, comentários/respostas, menções, republicações com autoria original, salvamento, ocultar, denúncias e envio para amigos pelo chat cifrado existente |
| Verificação | Solicitação, análise administrativa, justificativa, recusa, recurso/nova solicitação após sete dias, revogação e auditoria. 100 mil seguidores ativos aceitos iniciam análise, nunca concedem selo |
| Notificações | Conteúdo de criadores com aviso ativado, relações, interações e verificação; avatar, destino contextual e seguir de volta; categorias reaproveitam Web/Android/Desktop |
| Recomendações | Ranqueamento local determinístico: interesses, seguidos, atualidade e diversidade; com consentimento, atividades dos últimos 30 dias, afinidade acadêmica e vídeos ignorados |
| Navegação | Feed/Clips/criação preservados ao alternar; gesto horizontal fora de controles/carrosséis, navegação vertical, Alt+1/2/3, ordem manual persistente e destaque automático opcional |
| Convites | Mesmo RoomSharePanel no Mobile/Desktop: amigos, convite cifrado, estado enviado, código, copiar código/link, QR e compartilhamento Android/Web; safe areas e altura do teclado |

## Banco, autorização e privacidade

- `V69__enturma_social.sql`: tabelas `social_profile`, `social_follow`, `social_mute`, `social_post`, `social_reaction`, `social_comment`, `social_mention`, `social_story_view`, `social_highlight`, `social_feedback`, `social_report`, `social_verification`, `social_media`, `social_media_part` e `social_fanout`; constraints, índices e categorias sociais de notificação.
- `V70__social_story_overlays.sql`: elementos posicionados do Story, com JSON limitado e validação tipada.
- Nenhuma migration altera destrutivamente tabelas do Fórum. Nenhuma foi aplicada por esta tarefa ao banco de produção.
- RLS ativada nas novas tabelas e privilégios `PUBLIC` revogados. A conexão proprietária da API pode contornar RLS; a autorização por usuário é obrigatória em `SocialAccess`. Não há chave privilegiada no navegador.
- Autor ativo, bloqueios nos dois sentidos, conta privada e relação aceita são verificados em detalhe, feed, comentários, notificações e mídia, inclusive ranges e miniaturas. O cliente não concede permissão por flag.
- Stories expiram após 24 horas pelo PostgreSQL. Destaques são autorização explícita do dono e continuam sujeitos à privacidade do perfil.
- Histórico de recomendações e visualizações de Stories: 30 dias. Desativar personalização apaga o histórico de visualização. Uploads abandonados/falhos e mídias prontas sem post: sete dias. Stories expirados sem destaque: remoção após 30 dias. Tombstones de arquivos são reprocessados até excluir os objetos.
- Exportação/exclusão de conta incluem o Social. Decisões administrativas têm auditoria. Bloqueio reaproveita a moderação existente e remove relações sociais nos dois sentidos. Amizades não viram seguidores automaticamente; selo social não substitui identidade acadêmica.
- Mensagens privadas e materiais pessoais não são sinais do ranqueador. A conta pode controlar coleta de recomendações, autoplay e categorias de notificação.

## APIs e contratos

Base da API `/api/v1/social`, acessada no Web pelo BFF `/api/backend/social`. Autenticação e identidade acadêmica existentes continuam obrigatórias.

| Endpoint | Contrato |
| --- | --- |
| `GET /capabilities` | `enabled`, `media`, `maxClipSeconds` |
| `GET /feed` | `tab=for-you|following|campus`, `kind=POST|CLIP|STORY|ALL`, `q`, `cursor`, `author`, `collection=posts|reposts|tagged|saved|pinned`; retorna `items`, `nextCursor`, `snapshot` |
| `GET /posts/{id}`, `GET /drafts`, `GET /drafts/{id}` | Detalhe autorizado ou rascunhos exclusivos do dono |
| `PUT /drafts` | UUID, `kind`, `body`, `visibility`, `projectUrl`, `version`, `mediaIds`, `storyOverlays`; trava de dono e versão otimista |
| `POST /posts/{id}/publish` | `{version}`; exige mídias READY, valida duração; repetição não duplica publicação/eventos |
| `DELETE /posts/{id}` | Autor; remove conteúdo e marca arquivos para exclusão |
| `PUT /posts/{id}/reactions/{kind}` | `LIKE|SAVE|REPOST|HIDE`, `{active}`; constraint impede duplicação |
| `GET/POST /posts/{id}/comments` | Paginação; UUID idempotente, texto e `parentId` opcional; respostas de um nível |
| `DELETE /posts/{id}/comments/{comment}` | Autor do comentário, dono da publicação ou administrador |
| `PUT /posts/{id}/pin`, `/mention`, `/highlight`, `/view` | Fixação, aprovação de marcação, título do destaque, tempo assistido/conclusão |
| `GET /mentions`, `/posts/{id}/viewers`, `/people/{id}/highlights` | Marcações pendentes próprias, visualizadores próprios ou destaques autorizados |
| `GET /people`, `/people/{id}`, `/people/{id}/connections` | Busca e perfis; listas `followers|following|requests`, paginação e privacidade |
| `PUT /people/{id}/follow`, `/request`, `/mute`, `/notifications` | Estado explícito de relação, decisão, silêncio e aviso |
| `GET/PUT /preferences` | Privacidade, autoplay, consentimento, interesses e navegação; campos explícitos |
| `POST /posts/{id}/report`, `GET/POST /verification` | Denúncias e verificação com justificativa |
| `/api/v1/admin/social/review`, `/verification/{id}`, `/reports/{id}` | Filas e decisões administrativas; autoaprovação proibida |
| `POST /media`, `GET/DELETE /media/{id}` | UUID, tamanho/tipo, estado/progresso e exclusão autorizada |
| `PUT /media/{id}/parts/{part}` | Bloco binário ≤2 MiB; sequência, tamanho e hash; retry consistente aceito |
| `POST /media/{id}/export` | Receita declarativa e fila transacional |
| `GET /media/{id}/content?thumbnail=true` | Stream autorizado, ranges validados e `Cache-Control: no-store`; originais não são públicos |

O cursor inclui snapshot e último par data/UUID e pertence aos filtros. Cada lote cronológico de até 20 candidatos é classificado após autorização; o próximo cursor é calculado antes do ranking. É um ranking determinístico por lote, não de todo o banco. Há limites próprios para publicação, upload, exportação, follow, comentários e denúncias, além dos controles de autenticação existentes.

## Mídia e custo

O responsável autorizou custo adicional e integração Cloudflare. Foi criado o bucket **privado `enturma-social`** na conta `80ceceff716db11e0a3a081d35eb6c13`, classe Standard, região ENAM. O acesso público `r2.dev` está desativado e não há domínio público associado. O bucket `enturma-materials` existente permanece separado. `SOCIAL_ENABLED=false` e `SOCIAL_MEDIA_ENABLED=false` continuam sendo os padrões; provisionar armazenamento não ativa o Social em produção.

O cliente S3 existente é reutilizado com configuração independente `SOCIAL_STORAGE_*`. A API lê/grava R2; o navegador recebe mídia somente pelo endpoint autenticado, com a mesma autorização do Post/Story e suporte a Range. As credenciais nunca vão ao frontend. Não é necessário contratar Cloudflare Stream para esta entrega: a API processa MP4 e R2 armazena os resultados. Isso não oferece streaming adaptativo HLS nem elimina o tráfego pelo servidor da API.

Configuração do serviço Java:

```dotenv
SOCIAL_STORAGE_ENDPOINT=https://80ceceff716db11e0a3a081d35eb6c13.r2.cloudflarestorage.com
SOCIAL_STORAGE_REGION=auto
SOCIAL_STORAGE_BUCKET=enturma-social
SOCIAL_STORAGE_ACCESS_KEY=<credencial R2 restrita ao bucket>
SOCIAL_STORAGE_SECRET_KEY=<segredo R2 restrito ao bucket>
SOCIAL_FFMPEG=ffmpeg
SOCIAL_FFPROBE=ffprobe
```

O conector não possui a permissão Account API Tokens Write. O responsável forneceu credenciais R2, armazenadas somente no arquivo local ignorado `.local/social-r2.env`. Elas ainda precisam ser configuradas no ambiente Java da SquareCloud, com acesso Object Read & Write somente ao novo bucket. Não reutilizar nem substituir as variáveis `OBJECT_STORAGE_*` dos materiais e chats. O teste opt-in `SocialR2LiveTest`, com `SOCIAL_R2_SMOKE=true`, passou em 10/11/2026: gravou 128 KiB no bucket real, verificou todos os bytes e o intervalo 1021–5097 e removeu seu objeto aleatório. Nenhum dado de usuário foi utilizado.

O R2 cobra armazenamento/operações segundo a [tabela oficial](https://developers.cloudflare.com/r2/pricing/); a implementação usa o [SDK Java compatível](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-java/). Não há orçamento ilimitado implícito: quotas por arquivo/conta e fila serial limitam abuso, mas não estabelecem um teto financeiro global.

1. Navegador/WebView/Electron lê metadados e guarda receita/rascunho. Não carrega o vídeo inteiro na memória para exportar.
2. Upload privado em blocos de 2 MiB; máximo de 128 MiB por arquivo, dez mídias por Post e uma por Clip/Story. Quota atual de originais: 512 MiB por conta.
3. Fila PostgreSQL, sem Redis adicional; um worker por instância, lease de 20 minutos renovado entre etapas limitadas por timeout, até três tentativas e timeout de oito minutos por comando de exportação. A tentativa é conferida antes de cada etapa e na finalização: um worker substituído não grava nem altera o estado do novo trabalho. Processamento pendente não é publicável.
4. FFmpeg/ffprobe locais à API: processos sem shell, nomes gerados, protocolos `file,pipe`, formatos permitidos, dois threads, input até uma hora/33 megapixels. Corte, concatenação, enquadramento, textos e áudio são realmente exportados. WebM de MediaRecorder sem Duration recebe remux sem recodificação, limitado a 30 segundos de processamento/144 MiB, e nova medição antes da exportação; a duração informada pelo cliente não é prova.
5. H.264/AAC, 720×1280, 30 FPS, MP4 faststart e capa JPEG. Probe final exige ≤90.000 ms e duração coerente; arquivo truncado não é sucesso. Imagens viram JPEG até 1600 px com metadados removidos.
6. Erros preservam o rascunho. Temporários locais são apagados ao terminar; exclusão remota usa tombstone durável.

A quota conta originais, não derivados. Ambos coexistem até a exclusão da mídia. Duplicação, tráfego pelo BFF, disco temporário e CPU precisam ser avaliados na capacidade atual antes de ativar mídia. Não se promete upload ilimitado nem custo zero em qualquer volume. A flag permanece fechada durante essa avaliação.

O processamento remoto entrega a mesma receita essencial nas quatro plataformas. Captura depende de permissões e codecs; importação da galeria permanece disponível. Reedição após exportação concluída requer nova cópia; o arquivo local fica no rascunho.

O Dockerfile da API inclui FFmpeg/ffprobe e fontes DejaVu. O pacote Java da SquareCloud não instala pacotes de sistema: esse ambiente precisa disponibilizar os dois executáveis e uma fonte compatível com `drawtext`. A API verifica os executáveis antes de anunciar suporte a uploads; se faltarem, mídia permanece indisponível e rascunhos/textos continuam funcionando. Após instalar o runtime é necessário reiniciar a API. A disponibilidade desse runtime na SquareCloud ainda não foi confirmada.

## Arquivos e integração

- `components/social`: streams, cards, player, Stories, editor/captura, perfil, preferências, revisão e diálogo acessível.
- `lib/social.ts`, `social-draft.ts`: contratos, geometria equivalente à exportação, gestos e IndexedDB por conta.
- `SocialPosts`, `SocialPeople`, `SocialAccess`, `SocialReview`: domínio e autorização. `SocialMedia`, `SocialTranscoder`, `VideoRecipe`: pipeline. `SocialMaintenance`: fanout, retenção e elegibilidade.
- Shell, navegação mobile e perfil exibem acesso ao Social quando habilitado. O roteador existente reconhece links sociais, inclusive recebidos no chat cifrado.
- Dentro do Social, uma navegação própria reúne Feed, Clips, criação, mensagens e perfil: lateral no Desktop e inferior no Mobile, com saída explícita para o início do Enturma. A ordem personalizada dos ambientes e a posição de leitura são preservadas.
- A barra mobile principal usa Início, Salas, Social Entu, Comunidade e Amigos, com acesso a Mais. Cadernos IA fica abaixo de Programação no menu; a elegibilidade de Programação vem do mesmo estado autenticado usado no Desktop.
- Uma composição Remotion exclusiva transforma o livro em símbolo do Social na primeira entrada de cada documento do aplicativo. Navegação e retorno do segundo plano não repetem a abertura. Movimento reduzido dispensa a animação; há botão para avançar e limite de espera. As animações existentes de abertura do Enturma e Caronas não foram alteradas.
- RoomSharePanel, CSS de convites, cabeçalho da sala e bridge Android compartilham a mesma API.
- `DESIGN.md`, `UX-CONTRACT.md`, `premium-ui.json`: tokens existentes, rolagem, teclado, diálogos e estados. O audit estático é limitado às novas telas sociais, não certifica todo o aplicativo.

## Validação

A integração com `main` no commit `fcceadf` passou na [CI 42943252908](https://github.com/luizcordeiro155/Enturma/actions/runs/42943252908). A mudança posterior de navegação passou localmente em 194 testes Web, TypeScript e lint sem erros. Os testes E2E adicionados cobrem a navegação nas larguras 390/820/1440 px, elegibilidade acadêmica e abertura do Social uma vez por documento; o resultado da revisão final fica nos checks da PR #144. A inspeção visual corrigiu a prioridade do CSS da navegação mobile e passou a verificar sua altura. A regressão também revelou uma corrida no catálogo: o worker agora aguarda o job mais antigo, impedindo importar uma grade enquanto o curso pai está sendo processado por outro worker. Um teste concorrente reproduz a trava e verifica o vínculo final.

A [CI 42941050089](https://github.com/luizcordeiro155/Enturma/actions/runs/42941050089), commit `6df0bc8`, terminou com sucesso em 10/11/2026 (horário de São Paulo): 164 testes Java, sem falhas/erros e um opt-in R2 não executado na CI; 183 testes Web e quatro de contratos; 57 E2E; dois testes Python; lint, TypeScript, build Web, exports Android/iOS, compilação Android e segurança do desinstalador Windows aprovados. O teste R2 foi executado separadamente no bucket real, conforme descrito acima. O ensaio de restauração e os testes de banco usam PostgreSQL efêmero; não representam backup de produção.

As capturas no artefato `interface-evidence` foram inspecionadas: Feed e Clips em 390/1440 px, temas Claro/Escuro/Enturma, editor e convite mobile. O player manteve vídeo único, controles visíveis e posição após redimensionamento. Uma correção adicional deixa a duração do trecho herdar o contraste do botão selecionado no editor. A integração posterior com `main` `410a740` passou nos testes locais de links/perfis, TypeScript e compilação de testes Java; o resultado da suíte dessa integração fica nos checks da [PR #144](https://github.com/luizcordeiro155/Enturma/pull/144).

No ensaio limitado de carga dessa execução, 144 leituras de catálogo/conta em ambiente efêmero retornaram HTTP 200; p95 de 7/19/42 ms para concorrência 1/4/12. Não mede capacidade de produção nem processamento/tráfego de vídeos. O inventário de dependências registrou 22 entradas npm (seis altas, 15 moderadas, uma baixa) e dois advisories em Spring MVC. Não é uma auditoria limpa; a [triagem de dependências](DEPENDENCY_AUDIT.md) explica as cadeias herdadas e os limites. A CI coleta esses relatórios, sem confundir aprovação funcional com ausência de vulnerabilidades.

Testes usam contas sintéticas e armazenamento simulado apenas na fronteira S3; FFmpeg/ffprobe são reais. O teste de player usa mídia de contrato no navegador; a integração Spring verifica processamento, autorização e publicação.

- Unidade: crop/rotação, timeline, undo/redo, duração, captions, cursor, ranking, links internos, gestos, duração de Story e deduplicação.
- Integração: propriedade/privacidade, bloqueio, seguidores privados, marcação, expiração/destaque/overlay, idempotência, versão, consentimento, feeds diferentes e decisões administrativas.
- Mídia: retry de bloco, hash/ordem, arquivo inválido, falha com rascunho preservado, READY, ranges, miniatura, publicação, bloqueio e exclusão. Exportação de 90 segundos com áudio valida o limite final.
- E2E: estado preservado, publicação/comentário/follow reais, temas em duas larguras, editor, player único e pausa; convite mobile entre amigos, cópia, QR e ingresso com consentimento.
- Regressão: suíte existente de autenticação, Fórum, amigos, chamadas, salas, cadernos, caronas, perfil e navegação; build Web, export Android/iOS, compilação Android e desinstalador Windows na CI.

## Limitações e ativação

- Produção de mídia depende da configuração das credenciais do bucket provisionado, capacidade de FFmpeg, CPU, disco e tráfego, seguida de aprovação. R2 foi provisionado; nenhuma aplicação foi implantada nem flag de produção ativada.
- Música licenciada, narração adicional, ASR, transições, filtros, velocidade e templates avançados permanecem fora desta entrega. Não há controles fictícios desses recursos. O editor entrega as ferramentas essenciais enumeradas acima.
- Sem ML nem afirmação de detectar automaticamente seguidores fraudulentos. A análise de identidade/legitimidade é administrativa antes do selo.
- Ordem manual é salva na conta; destaque automático considera uso da sessão e nunca reposiciona os botões durante interação.
- Compartilhamento/resposta privada usa o chat entre amigos. Destinatário sem identidade de chat inicializada produz erro real orientando inicialização; o Social não inventa uma chave em seu nome.
- Builds/exportações/Chromium não homologam câmera, codecs e compartilhamento nativo em aparelhos físicos. Não houve publicação de APK/EXE nesta entrega.
- Controles técnicos não são certificação jurídica LGPD. Moderação operacional, política editorial e tratamento de menores precisam acompanhar a liberação.

Na integração autorizada, publicar código e migrations aditivas com flags desligadas, verificar saúde/regressão, habilitar Social sem mídia e avaliar ativação limitada de mídia. Rollback funcional: desligar flags; não apagar tabelas, objetos ou contas. O binário anterior ignora tabelas adicionais. Publicação do código não significa que uploads já estejam habilitados; a ativação depende das configurações e verificações acima.
