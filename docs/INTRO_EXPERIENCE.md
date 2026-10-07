# Apresentação oficial do Enturma

`EnturmaIntroExperience` carrega o `@remotion/player` somente quando a apresentação está aberta. A composição compartilhada `EnturmaIntroComposition` conduz dez cenas em 3.960 frames a 60 FPS (1 minuto e 6 segundos). GSAP controla a entrada e a saída do contêiner e as microinterações da aplicação; não conduz a narrativa do Player.

A direção de motion usa o livro como ligação entre cenas: páginas vetoriais atravessam os cortes, palavras surgem por máscaras, matérias se montam em perspectiva, a rede se conecta ao avatar real, a comunidade ganha camadas e a rota da carona se desenha. Partículas, trilhas, pulsos e ondas são calculados pelo frame. A paleta cinematográfica de verde profundo, lima, menta e azul permanece consistente nos dois temas; os controles seguem o tema da aplicação. O layout vertical separa texto e arte e amplia a marca nos momentos de abertura/fechamento.

SVG desenha a marca e as conexões. O Canvas desenha partículas determinísticas a partir do frame do Remotion, sem criar um segundo loop de animação. O scanner inicial apresenta o manifesto real dos módulos; não simula uma consulta ao GitHub.

O Player recebe nome, avatar, matérias e período da sessão atual. Não expõe dados privados. Como ainda não existe uma autorização específica para usar uma lista pública de estudantes nessa apresentação, os nós secundários mostram recursos do Enturma. Não são apresentados estudantes fictícios em produção.

## Reprodução e acessibilidade

- Primeira apresentação por dispositivo/versão: `enturma-intro:v0.3` no armazenamento local. O estado é registrado quando o contêiner entra na área visível.
- Repetição manual: **Guia do Enturma → Ver apresentação novamente**.
- **Pular** pausa, encerra a transição e desmonta o Player; o foco retorna ao guia no celular e às matérias no desktop. O término automático não muda o foco do usuário.
- Ao terminar ou pular, permanece uma miniatura **Conheça o Enturma**, com botão **Assistir apresentação**. Ela não mantém Canvas/Player executando. O replay reabre a apresentação no início, na própria Home.
- Controles de pausa e posição permitem explorar a timeline com mouse, toque e teclado.
- A narração feminina em português brasileiro é um MP3 local de 66 segundos, sincronizado pelo mesmo relógio do Remotion. O carregamento automático começa sem som. **Ouvir narração** inicia a fala desde o começo na primeira ativação; depois, silenciar/reativar mantém a posição. Replay começa sem som novamente.
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

Arquivo atual: `apps/web/public/intro/enturma-pt-br-presenter-v2.mp3`, mono, 44,1 kHz, 96 kbps. Voz sintética feminina brasileira **pt-BR-FranciscaNeural**, sintetizada pelo serviço de fala da Microsoft durante a preparação da mídia. Substitui a interpretação Kokoro anterior. O roteiro usa convites, perguntas, pausas e frases completas para apresentar o aplicativo. A voz foi gerada com velocidade `+5%` e pitch `+1Hz`, sem esticar ou acelerar o áudio na mixagem. Não é gravação de uma locutora humana nem clonagem de voz.

As 13 tomadas começam 11 frames após sua deixa visual. A duração das cenas foi definida a partir da fala, com margem para respiração antes do próximo corte. `intro-storyboard.json` é a fonte única para áudio, cenas, legendas e viradas de página. As durações são medidas com ffprobe e verificadas nos testes para evitar cortes e sobreposição. A faixa final foi normalizada com `highpass=f=65,loudnorm=I=-17:TP=-1.5:LRA=8`, preenchida até 66 segundos e transcrita independentemente para conferir o roteiro.

| Início da cena | Roteiro |
| --- | --- |
| 0 s | Ei! Que tal viver a faculdade mais conectado? |
| 4.5 s | Esse é o Enturma! Seu ponto de encontro na faculdade. |
| 9 s | Organize suas matérias e encontre sua próxima turma de estudos. |
| 14.5 s | Conheça colegas, troque experiências e aprenda em boa companhia. |
| 20 s | No feed, compartilhe novidades, faça perguntas e participe da conversa. |
| 26 s | Entre nas salas! Reúna seus materiais e estude com inteligência artificial. |
| 32 s | Vai pra faculdade? Combine uma carona e encontre companhia no caminho. |
| 37.5 s | Converse por voz, vídeo ou compartilhe a tela. É só se conectar! |
| 43 s | As novidades da faculdade, no seu feed. |
| 47 s | Salas pra aprender em companhia. |
| 50.5 s | Caronas pra compartilhar o caminho. |
| 54 s | E cadernos com inteligência artificial, pra estudar do seu jeito! |
| 59 s | Se enturme com o Enturma! Fique por dentro da sua faculdade conosco. |

Para refazer uma tomada, o comando usado foi `python -m edge_tts --voice pt-BR-FranciscaNeural --rate=+5% --pitch=+1Hz --text "Fala da cena" --write-media take.mp3`. A ferramenta é de preparação, não uma dependência da aplicação. Remixe as tomadas com os offsets de `voiceStartFrame`, meça as durações e atualize conjuntamente o áudio e o storyboard. O player mantém uma única faixa durante toda a apresentação, sem sintetizador no navegador ou chamadas de TTS durante o uso.
