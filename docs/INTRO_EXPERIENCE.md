# Apresentação oficial do Enturma

`EnturmaIntroExperience` carrega o `@remotion/player` somente quando a apresentação está aberta. A composição compartilhada `EnturmaIntroComposition` conduz nove cenas em 1.800 frames a 60 FPS (30 segundos). GSAP controla a entrada e a saída do contêiner e as microinterações da aplicação; não conduz a narrativa do Player.

A direção de motion usa o livro como ligação entre cenas: páginas vetoriais atravessam os cortes, palavras surgem por máscaras, matérias se montam em perspectiva, a rede se conecta ao avatar real, a comunidade ganha camadas e a rota da carona se desenha. Partículas, trilhas, pulsos e ondas são calculados pelo frame. A paleta cinematográfica de verde profundo, lima, menta e azul permanece consistente nos dois temas; os controles seguem o tema da aplicação. O layout vertical separa texto e arte e amplia a marca nos momentos de abertura/fechamento.

SVG desenha a marca e as conexões. O Canvas desenha partículas determinísticas a partir do frame do Remotion, sem criar um segundo loop de animação. O scanner inicial apresenta o manifesto real dos módulos; não simula uma consulta ao GitHub.

O Player recebe nome, avatar, matérias e período da sessão atual. Não expõe dados privados. Como ainda não existe uma autorização específica para usar uma lista pública de estudantes nessa apresentação, os nós secundários mostram recursos do Enturma. Não são apresentados estudantes fictícios em produção.

## Reprodução e acessibilidade

- Primeira apresentação por dispositivo/versão: `enturma-intro:v0.3` no armazenamento local. O estado é registrado quando o contêiner entra na área visível.
- Repetição manual: **Guia do Enturma → Ver apresentação novamente**.
- **Pular** pausa, encerra a transição e desmonta o Player; o foco retorna ao guia no celular e às matérias no desktop. O término automático não muda o foco do usuário.
- Ao terminar ou pular, permanece uma miniatura **Conheça o Enturma**, com botão **Assistir apresentação**. Ela não mantém Canvas/Player executando. O replay reabre a apresentação no início, na própria Home.
- Controles de pausa e posição permitem explorar a timeline com mouse, toque e teclado.
- A narração feminina em português brasileiro é um MP3 local de 30 segundos, sincronizado pelo mesmo relógio do Remotion. O carregamento automático começa sem som. **Ouvir narração** inicia a fala desde o começo na primeira ativação; depois, silenciar/reativar mantém a posição. Replay começa sem som novamente.
- Uma legenda acompanha cada cena e permanece disponível sem áudio. Pausar, avançar, ocultar a aba ou minimizar também controla a narração; não há sintetizador de voz nem requisições a serviços de TTS no dispositivo do usuário.
- Reprodução pausa fora da área visível ou com a aba oculta.
- A preferência de pouca animação do Enturma e `prefers-reduced-motion` usam as mesmas nove cenas e a mesma duração, com cada cena congelada e sem partículas ou transições. Assim, a narração completa continua acessível sem movimento.
- Memória, número de núcleos e largura selecionam qualidade alta, otimizada ou baixa. Layouts lógicos específicos atendem retrato, paisagem, desktop e ultrawide.
- Eventos, observadores, tweens GSAP e o Player são descartados ao desmontar. Não há Player oculto executando em segundo plano.

## Reutilização em vídeo

`apps/web/src/remotion/index.tsx` registra a mesma composição, sem uma segunda implementação, nos formatos `EnturmaDesktop`, `EnturmaPortrait`, `EnturmaLandscape` e `EnturmaUltrawide`. O Player e o Remotion estão fixados na versão `4.0.530`.

Para uma exportação de marketing, use o CLI/Renderer da mesma versão, instalado no ambiente de renderização; ele não integra o bundle web. Por exemplo, a partir da raiz:

```powershell
npx --package @remotion/cli@4.0.530 remotion render apps/web/src/remotion/index.tsx EnturmaDesktop out/enturma-intro.mp4 --public-dir apps/web/public
```

As propriedades padrão usam recursos reais do produto, sem perfis fictícios. Uma exportação com perfis reais exige autorização para essa mídia; URLs de avatar autenticadas devem ser substituídas por arquivos acessíveis ao renderizador. A entrega web não depende de gerar MP4.

## Narração

Arquivo: `apps/web/public/intro/enturma-pt-br-dora-v1.mp3` (aproximadamente 361 KB, mono, 44,1 kHz, 96 kbps). Voz sintética feminina brasileira `pf_dora`, do [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M), gerada localmente com HyperFrames TTS, idioma `pt-br` e velocidade `0.96`. Não é uma gravação de locutora humana nem uma clonagem de voz. O modelo é disponibilizado sob Apache 2.0.

Cada tomada foi gerada separadamente e inserida 160 ms após o início da respectiva cena, sem acelerar nem cortar palavras. As durações foram medidas com ffprobe; todas terminam antes do próximo corte. A mixagem usa `highpass=f=65,loudnorm=I=-18:TP=-1.5:LRA=7`, preenchimento até 30 segundos e codificação MP3. Pico medido do arquivo final: -1,9 dBFS. A transcrição independente do áudio foi conferida contra o roteiro.

| Cena | Início da fala | Fala | Duração da tomada |
| --- | --- | --- | --- |
| Conexão | 0,16 s | Sua próxima conexão começa aqui. | 2,197 s |
| Marca | 2,66 s | Enturma. Aprender nos aproxima. | 2,091 s |
| Matérias | 5,16 s | Suas matérias, organizadas em um só lugar. | 2,795 s |
| Pessoas | 8,66 s | Encontre quem aprende com você. | 2,176 s |
| Comunidade | 12,16 s | Compartilhe ideias e descubra novas perspectivas. | 3,093 s |
| Estudos | 16,16 s | Estude com materiais e inteligência artificial. | 3,115 s |
| Caronas | 19,66 s | Combine caronas e compartilhe o caminho. | 2,517 s |
| Chamadas | 23,16 s | Voz, vídeo e tela. Colabore de perto. | 2,389 s |
| Encerramento | 26,66 s | Enturma. Aprenda em boa companhia. | 2,240 s |

Para refazer uma tomada, use `npx hyperframes tts "Fala da cena" --voice pf_dora --lang pt-br --speed 0.96 --output scene.wav`, com `HYPERFRAMES_PYTHON` apontando para um Python com `kokoro-onnx` e `soundfile`. Remixe as tomadas nas posições acima e atualize conjuntamente o MP3, `INTRO_NARRATION` e `INTRO_SCENE_FRAMES` se o roteiro mudar. O aplicativo mantém uma única faixa montada durante toda a apresentação, por isso não necessita de tags de áudio auxiliares do Player.
