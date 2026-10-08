# Apresentação oficial do Enturma — edição quadrinhos

A composição compartilhada `EnturmaIntroComposition` agora apresenta **90 segundos, 2.160 frames a 24 fps**, em dezesseis cenas. `EnturmaIntroExperience` continua carregando o Player sob demanda. Os cortes acompanham uma tomada contínua de voz, sem inserir pausas para preencher blocos fixos.

## Formatos e narrativa

Mantivemos os formatos existentes conforme a revisão do briefing: `EnturmaPortrait` (600×860), `EnturmaDesktop` (1200×675), `EnturmaLandscape` (960×600) e `EnturmaUltrawide` (1600×640). O retrato mantém a proporção usada no aplicativo, em vez de impor 9:16.

O roteiro passa pela abertura, dúvida, falta de tempo, conexão com o Enturma, nove recursos, comunidade e convite final. Frequência e Pomodoro/rotina são identificados como **EM BREVE · PRÉVIA**, pois ainda não existem no produto. Posts, resultados, contadores e avatares desenhados são exemplos ilustrativos, não dados reais de estudantes. O CTA e o QR apontam para **https://enturma-flax.vercel.app/download**, com Android e Windows, sem selos de lojas não publicadas.

## Motion e apresentadora

Retícula Ben-Day, contornos pretos, sombras duras, tipografia Archivo Black, rasgos diagonais, impactos cromáticos e partículas compõem a linguagem de quadrinhos. A paleta inclui ciano, magenta, amarelo, verde, roxo e laranja. SVG e Canvas são determinísticos, calculados pelo frame; não há animação CSS independente nem segundo loop de requestAnimationFrame.

A abertura já mostra marca, título, apresentadora e recursos no primeiro frame. Cada uma das dezesseis cenas tem uma pose/expressão exclusiva: boas-vindas, dúvida, preocupação, solução, orgulho, curiosidade, conversa social, escuta, indicação da carona, chamada com fones, celebração, atenção à frequência, organização, aprovação, apresentação e convite final. Não existe ciclo de poses padronizado. Escala, direção, posição e ritmo de oscilação são definidos por cena, com áreas reservadas que mantêm os cards longe do rosto.

A atuação usa poses-chave ilustradas e movimento contínuo em 24 fps; não é gravação de uma pessoa nem sincronização labial por fonema. Nos painéis de recursos, os primeiros 12 frames de cada grupo de 36 seguram cada desenho por dois frames, simulando 12 fps; o restante usa 24 fps. O relógio separado da apresentadora preserva sua fluidez mesmo durante esses holds.

After Effects, OBS, Ableton, Suno e Udio não foram usados. As cenas são construídas em código, não capturas da interface.

## Narração e trilha

Arquivo: `apps/web/public/intro/comic/enturma-comic-90.mp3`, estéreo, 44,1 kHz, 160 kbps e 90 segundos.

A voz aprovada foi preservada: **pt-BR-FranciscaNeural**, feminina brasileira, velocidade `+5%`, pitch `+1Hz`. Uma única tomada termina em aproximadamente 87,5 segundos. As pausas internas medidas ficam entre 0,21 e 0,31 segundo, sem alongar o áudio nem reiniciar a apresentação a cada recurso.

A trilha instrumental original em 138 BPM usa bumbo, subgrave, percussão e sintetizadores gerados com NumPy. Efeitos acompanham confirmações, portal, conquistas e carona; a trilha baixa durante a voz. Há impactos em 0, 3, 12, 51 e 84 segundos, redução da percussão entre 39 e 51, uma interrupção musical de um beat em 78 e stinger final. A narração continua durante a pausa musical, atendendo à orientação de fluidez. A narradora feminina permanece como única voz.

Normalização: `loudnorm=I=-16:TP=-1.5:LRA=9`. O áudio é preparado antes da publicação; não há TTS nem síntese de voz no navegador. Legendas por cena e palavras destacadas compartilham os timestamps da tomada.

`scripts/comic-intro-script.json` contém o roteiro. `scripts/generate-comic-intro-audio.py` sintetiza a fala, verifica palavras, cria a trilha e grava o MP3, `intro-storyboard.json` e `comic/narration-words.json`. Reutiliza o cache em `.local/comic-intro` quando o hash do roteiro/voz coincide. Os cortes são calculados no meio das pequenas respirações.

Para reproduzir, use Python com NumPy, `edge-tts==7.2.8`, FFmpeg e ffprobe:

```powershell
python scripts/generate-comic-intro-audio.py
```

O antigo `generate-intro-narration.py` pertence à edição de 50 segundos e não deve ser executado sobre esta timeline. Mídias antigas permanecem para sessões com código anterior.

## Reprodução e acessibilidade

- Som ativado por padrão na apresentação e no replay, com opção de silenciar. Se o navegador bloquear o áudio automático, aguarda no início e oferece **Reproduzir com som**.
- Pausa, posição, teclado, minimização e replay continuam funcionando. Aba oculta ou Player fora da área visível pausam a reprodução.
- Ao pular ou terminar, fica a miniatura **Conheça o Enturma**, sem áudio, Canvas ou Player executando em segundo plano.
- Pouca animação e `prefers-reduced-motion` congelam cada cena em um estado legível, retiram partículas/transições e preservam as falas e legendas.
- O estado `enturma-intro:v0.3` não é reiniciado para quem já assistiu; o replay permite ver a edição nova.

## Assets e procedência

`ArchivoBlack-Regular.ttf` vem do repositório oficial Google Fonts e está acompanhado de `ArchivoBlack-OFL.txt`, sob SIL Open Font License.

As ilustrações em `public/intro/comic/` foram geradas com a ferramenta integrada de imagens. A referência original e as pranchas PNG ficam preservadas no diretório de geração; `presenter-poses.webp`, `presenter-story.webp`, `presenter-social.webp` e `presenter-finale.webp` são pranchas transparentes 2×2. Cada célula é enquadrada em React. Não representam usuários reais. As imagens originais estão preservadas no diretório de geração do Codex.

Prompt-base: “A precisely aligned 2 by 2 sprite sheet of four waist-up poses of the same fictional Afro-Brazilian university presenter. Preserve her identity, short curly black afro, warm brown skin, pearl earrings, cyan varsity jacket with magenta trim, yellow backpack straps, white top, rich detailed inked neon comic-book illustration and halftone. Same scale in equal square cells, transparent background, no text or borders. Distinct believable facial expressions, head angles, eye direction and gestures; hands inside each cell.”

Direção por prancha: saudação/palma aberta/indicação/aprovação; dúvida/preocupação com relógio/troféu/curiosidade com livro IA; compartilhamento no telefone/escuta/indicação com chaves/chamada com fones; comemoração/checklist verde/caderno aberto/convite com as mãos.

## Exportação e validação

Player e exports usam a mesma composição, com Remotion 4.0.530. A partir de `apps/web`:

```powershell
npx --package @remotion/cli@4.0.530 remotion studio src/remotion/index.tsx --port=3017
npx --package @remotion/cli@4.0.530 remotion render src/remotion/index.tsx EnturmaPortrait ../../dist/enturma-comic-90-portrait.mp4 --codec=h264 --scale=2 --crf=18
npx --package @remotion/cli@4.0.530 remotion render src/remotion/index.tsx EnturmaDesktop ../../dist/enturma-comic-90-desktop.mp4 --codec=h264 --scale=2 --crf=18
```

O fator 2 preserva as proporções, produz 1200×1720 e 2400×1350 e mantém dimensões pares para H.264. A entrega web não depende dos MP4.

Os testes cobrem duração/FPS, nove recursos, sincronização, enquadramento vertical, cards sem sobreposição no rosto, pausa, busca, minimização, replay, navegação, bloqueio de autoplay e movimento reduzido. Stills e exports permitem conferir os layouts e a sequência completa.
