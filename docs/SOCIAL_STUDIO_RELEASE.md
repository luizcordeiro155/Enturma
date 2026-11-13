# Enturma Social - Studio e interacoes

## Interface

O Studio usa a mesma receita validada pelo FFmpeg para a previa e para o arquivo final. A linha do tempo mostra quadros locais, tem cortes e cursor arrastaveis, selecao visual da capa e intervalos dos textos. Mouse, toque e teclado continuam disponiveis. Os formatos sao 9:16, 4:5, 3:4, 1:1 e 1.91:1. Ha sete filtros, velocidade de 0.5x a 2x, volume, rotacao, zoom e alinhamento. Uma foto da galeria pode ser a capa do video, depois de reprocessada sem metadados.

Originais de ate uma hora podem ser recortados, respeitando 128 MiB por arquivo. A exportacao final continua limitada a 90 segundos; nao ha promessa de arquivos ou processamento ilimitados. Videos maiores que 90 segundos abrem o editor normalmente. A capa da galeria aceita ate 16 MiB no cliente e e reduzida antes do envio; a API aceita apenas JPEG de ate 4 MiB e quatro megapixels.

O perfil usa avatares quadrados com recorte circular e sem encolhimento flex. Acoes sociais sobre video sao transparentes e brancas, com sombra, independentemente do tema; fora do video seguem os tokens claro/escuro. A abertura Remotion permanece em tela inteira e so abre o dialogo quando o player esta montado, sem um icone provisorio antes da composicao. Pular ou atingir o timeout impede uma abertura tardia; reducao de movimento continua respeitada.

Os controles de proporcao e modo do Studio usam a superficie neutra nos itens inativos e a cor de destaque somente no selecionado, com altura minima de toque de 44 px. A galeria tem capturas em 390/1440 px nos temas Claro, Escuro e Enturma; o teste aplica Enturma como tema escuro com a paleta propria, conforme o aplicativo.

## Feed e Clips

Eventos sociais, retorno da conexao e atualizacao periodica inserem novas publicacoes sem deslocar a leitura. O autor recebe sua publicacao na aba correspondente apos confirmacao da API. No fim dos Clips, uma nova consulta autorizada permite rever conteudo disponivel; nao se inventam videos nem se mantem uma lista privada acessivel para sempre. Sem conteudo, o estado vazio permanece explicito.

## Comentarios e mensagens

A folha de comentarios usa o seletor existente de emojis, GIFs e figurinhas. Anexos sao privados, limitados a 1.4 MiB, vinculados a uma unica publicacao e visiveis apenas quando o usuario pode ver o post. Rascunho e anexo sobrevivem a falha de envio. Curtidas de comentario sao idempotentes.

Compartilhar seleciona ate 20 amizades aceitas e reutiliza o chat cifrado. Os cartoes nas conversas buscam a publicacao pela API autenticada do destinatario: um link nao concede acesso. Nao sao exibidas contagens ficticias de compartilhamentos nem presencia inventada.

O modo de teclado do Social reutiliza a ponte nativa existente e VisualViewport/VirtualKeyboard. A janela permanece estavel no celular enquanto o compositor acompanha a area visivel. Movimento reduzido desativa transicoes.

## Lives e seguranca

`SOCIAL_LIVE_ENABLED` e `false` por padrao. Tambem sao necessarios `VOICE_ENABLED=true`, `LIVEKIT_URL`, `LIVEKIT_API_KEY` e `LIVEKIT_API_SECRET` ja usados nas chamadas. As chaves nunca chegam ao cliente.

Uma live por anfitriao, inicio idempotente, privacidade de perfil e bloqueios nos dois sentidos. O publico so ve a live depois de o anfitriao realmente entrar na sala. Espectadores recebem token de 120 segundos sem permissao para publicar camera/microfone; podem enviar mensagens e coracoes pelo canal de dados. Contagens vem do servidor LiveKit. Host ausente por mais de 60 segundos encerra a transmissao. A exclusao da conta encerra suas lives. O chat efemero nao e gravado.

## Publicacao e rollback

1. Validar a CI, exportacao FFmpeg real, permissoes e capturas de 390/1440 px.
2. Publicar o worker FFmpeg com a mesma revisao antes da API (novos campos opcionais da receita).
3. Atualizar a API SquareCloud: migration aditiva V71, sem remover dados. Confirmar health, storage e autenticacao do worker.
4. Publicar o frontend pelo merge em main e verificar que a Vercel atribuiu o dominio de producao ao commit esperado.
5. Habilitar lives somente depois de verificar a instancia LiveKit e o caminho real de host/espectador. Nao substituir chaves existentes.

Rollback: desligar `SOCIAL_LIVE_ENABLED` e/ou `SOCIAL_MEDIA_ENABLED`, manter migration e objetos. Reverter o frontend/API a uma versao compativel sem apagar tabelas. O worker continua aceitando receitas anteriores.

## Limites de validacao

Os testes usam banco e usuarios sinteticos locais/CI, FFmpeg real e uma instancia LiveKit local na CI. Isso nao substitui teste fisico em Android/Electron, rede movel, camera real, consumo sob carga ou disponibilidade do provedor de producao. As partes de Explorar, sons reutilizaveis e duetos da especificacao ampla nao fazem parte deste incremento.
