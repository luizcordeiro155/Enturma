# Apresentação oficial do Enturma

`EnturmaIntroExperience` carrega o `@remotion/player` somente quando a apresentação está aberta. A composição compartilhada `EnturmaIntroComposition` conduz dez cenas em 3.000 frames a 60 FPS (50 segundos). GSAP controla a entrada e a saída do contêiner e as microinterações da aplicação; não conduz a narrativa do Player.

A direção de motion usa o livro como ligação entre cenas: páginas vetoriais atravessam os cortes, palavras surgem por máscaras, matérias se montam em perspectiva, a rede se conecta ao avatar real, a comunidade ganha camadas e a rota da carona se desenha. Partículas, trilhas, pulsos e ondas são calculados pelo frame. A paleta cinematográfica de verde profundo, lima, menta e azul permanece consistente nos dois temas; os controles seguem o tema da aplicação. O layout vertical separa texto e arte e amplia a marca nos momentos de abertura/fechamento.

SVG desenha a marca e as conexões. O Canvas desenha partículas determinísticas a partir do frame do Remotion, sem criar um segundo loop de animação. O scanner inicial apresenta o manifesto real dos módulos; não simula uma consulta ao GitHub.

O Player recebe nome, avatar, matérias e período da sessão atual. Não expõe dados privados. Como ainda não existe uma autorização específica para usar uma lista pública de estudantes nessa apresentação, os nós secundários mostram recursos do Enturma. Não são apresentados estudantes fictícios em produção.

## Reprodução e acessibilidade

- Primeira apresentação por dispositivo/versão: `enturma-intro:v0.3` no armazenamento local. O estado é registrado quando o contêiner entra na área visível.
- Repetição manual: **Guia do Enturma → Ver apresentação novamente**.
- **Pular** pausa, encerra a transição e desmonta o Player; o foco retorna ao guia no celular e às matérias no desktop. O término automático não muda o foco do usuário.
- Ao terminar ou pular, permanece uma miniatura **Conheça o Enturma**, com botão **Assistir apresentação**. Ela não mantém Canvas/Player executando. O replay reabre a apresentação no início, na própria Home.
- Controles de pausa e posição permitem explorar a timeline com mouse, toque e teclado.
- A narração feminina em português brasileiro é um MP3 local de 50 segundos, sincronizado pelo mesmo relógio do Remotion. A apresentação e o replay começam com o som ativado. **Silenciar narração** permite desligá-lo; reativar mantém a posição. Quando a política do navegador bloqueia áudio automático, o vídeo aguarda no início e oferece **Reproduzir com som**, que libera a fala pelo gesto do usuário. Não avançamos silenciosamente enquanto essa permissão está pendente.
- Uma legenda acompanha cada cena e permanece disponível sem áudio. Pausar, avançar, ocultar a aba ou minimizar também controla a narração; não há sintetizador de voz nem requisições a serviços de TTS no dispositivo do usuário.
- Reprodução pausa fora da área visível ou com a aba oculta.
- A preferência de pouca animação do Enturma e `prefers-reduced-motion` usam as mesmas dez cenas e a mesma duração, com cada cena congelada e sem partículas ou transições. Assim, a narração completa continua acessível sem movimento.
- Memória, número de núcleos e largura selecionam qualidade alta, otimizada ou baixa. Layouts lógicos específicos atendem retrato, paisagem, desktop e ultrawide.
- Eventos, observadores, tweens GSAP e o Player são descartados ao desmontar. Não há Player oculto executando em segundo plano.

## Reutilização em vídeo

`apps/web/src/remotion/index.tsx` registra a mesma composição, sem uma segunda implementação, nos formatos `EnturmaDesktop`, `EnturmaPortrait`, `EnturmaLandscape` e `EnturmaUltrawide`. O Player e o Remotion estão fixados na versão `4.0.530`.

Para uma exportação de marketing, use o CLI/Renderer da mesma versão, instalado no ambiente de renderização; ele não integra o bundle web. Por exemplo, a partir da raiz:

```powershell
npx --package @remotion/cli@4.0.530 remotion render apps/web/src/remotion/index.tsx EnturmaDesktop out/enturma-intro.mp4 --public-dir apps/web/public
```

As propriedades padrão usam recursos reais do produto, sem perfis fictícios. Uma exportação com perfis reais exige autorização para essa mídia; URLs de avatar autenticadas devem ser substituídas por arquivos acessíveis ao renderizador. A entrega web não depende de gerar MP4.

## Livro e encerramento

Depois das oito cenas de apresentação, `BookShowcaseScene` abre um livro em perspectiva. Quatro páginas demonstram feed, salas, caronas e cadernos com IA: cartões e reações surgem em sequência, conversas se montam, uma rota é desenhada e materiais viram etapas de estudo. As viradas usam duas faces, rotação no eixo Y, sombra de dobra e camadas de papel. O livro tem proporções e índice próprios no retrato; os textos essenciais permanecem dentro da área visível.

`PresenterClosingScene` reúne as páginas, desenha o símbolo do livro e revela a marca e a frase: **Se enturme com o Enturma! Fique por dentro da sua faculdade conosco.** Tipografia, símbolos e recursos entram em tempos distintos. Todo movimento deriva dos frames, inclusive a exportação. Em movimento reduzido, as quatro páginas mudam sem animação na hora correspondente da fala e o encerramento aparece estático.

## Narração

Arquivo atual: `apps/web/public/intro/enturma-pt-br-presenter-v3.mp3`, mono, 44,1 kHz, 96 kbps. A voz aprovada foi preservada: **pt-BR-FranciscaNeural**, feminina brasileira, com velocidade `+5%` e pitch `+1Hz`. É voz sintética da Microsoft, preparada antes da publicação, sem clonagem ou síntese no navegador.

O roteiro agora é uma **única tomada contínua**. As frases conectam os recursos sem reiniciar a apresentação em cada corte. No livro final, a narração demonstra ações (comentar, discutir, combinar o ponto de encontro e estudar com fontes) em vez de repetir a lista de recursos. A interpretação mantém suas respirações naturais; não há silêncio inserido entre cenas, aceleração na mixagem ou cortes de palavras.

`scripts/intro-narration.json` contém o roteiro e a configuração da voz. `scripts/generate-intro-narration.py` sintetiza o parágrafo inteiro e alinha cada deixa pelos timestamps de palavras recebidos do provedor. Os cortes visuais ficam no meio da respiração entre frases. O `intro-storyboard.json` gerado conduz cenas, legendas, áudio e viradas do livro; desktop, retrato, paisagem e ultrawide compartilham os mesmos tempos.

A composição passou de 66 para **50 segundos**. Nesta gravação, as pausas internas detectadas acima de 180 ms ficam entre **0,21 e 0,31 segundo** (`silencedetect`, limiar −42 dB). Restam cerca de 0,4 segundo de respiro após a última palavra. A normalização usa `highpass=f=65,loudnorm=I=-17:TP=-1.5:LRA=8`, sem alterar a velocidade; ffprobe confere a duração do arquivo. Uma transcrição independente conferiu a sequência das falas, com as variações esperadas na grafia da marca.

| Início visual | Roteiro                                                                      |
| ------------- | ---------------------------------------------------------------------------- |
| 0.00 s        | Que tal ter a faculdade inteira mais perto de você?                          |
| 2.88 s        | Com o Enturma, cada conexão vira uma nova possibilidade.                     |
| 6.33 s        | Comece pelas suas matérias e organize o semestre em um só lugar.             |
| 10.23 s       | Daí, encontre colegas com os mesmos interesses e forme sua turma.            |
| 14.33 s       | No feed, compartilhe novidades e descubra o que acontece no campus.          |
| 18.25 s       | Quando for estudar, abra uma sala e reúna a galera com seus materiais.       |
| 22.33 s       | Na hora de sair, combine uma carona e divida o caminho.                      |
| 25.83 s       | E continue a conversa por voz, vídeo ou compartilhando a tela.               |
| 29.63 s       | Olha como é simples: curta e comente as publicações que te interessam,       |
| 33.63 s       | resolva aquela dúvida em grupo e acompanhe a discussão,                      |
| 36.78 s       | combine o ponto de encontro com seu motorista pelo chat,                     |
| 39.93 s       | e transforme documentos, links e imagens em explicações nos cadernos com IA. |
| 45.50 s       | Se enturme com o Enturma! Fique por dentro da sua faculdade conosco.         |

Para reproduzir a preparação, use Python com `edge-tts==7.2.8`, FFmpeg e ffprobe no PATH:

```powershell
python scripts/generate-intro-narration.py
# Remixar a mesma tomada sem solicitar uma nova síntese:
python scripts/generate-intro-narration.py --reuse
```

O cache em `.local/intro-continuous` guarda a tomada original e os timestamps. A opção `--reuse` verifica o hash do roteiro antes de reutilizar o áudio. O nome versionado do MP3 evita servir a narração anterior pelo cache; a mídia v2 permanece disponível para sessões com código antigo. O estado de primeira exibição não é reiniciado por esta atualização.
