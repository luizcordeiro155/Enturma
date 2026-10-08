# Apresentação oficial do Enturma — edição quadrinhos

A composição compartilhada `EnturmaIntroComposition` agora apresenta **90 segundos, 2.160 frames a 24 fps**, em dezesseis cenas. `EnturmaIntroExperience` continua carregando o Player sob demanda. Os cortes acompanham uma tomada contínua de voz, sem inserir pausas para preencher blocos fixos.

## Formatos e narrativa

Mantivemos os formatos existentes conforme a revisão do briefing: `EnturmaPortrait` (600×860), `EnturmaDesktop` (1200×675), `EnturmaLandscape` (960×600) e `EnturmaUltrawide` (1600×640). O retrato mantém a proporção usada no aplicativo, em vez de impor 9:16.

O roteiro passa pela abertura, dúvida, falta de tempo, conexão com o Enturma, nove recursos, comunidade e convite final. O vídeo apresenta apenas recursos disponíveis: XP/conquistas, cadernos IA, feed, salas/chats, caronas, chamadas, minigames, amigos/perfil e matérias. Frequência e Pomodoro foram retirados da imagem e da narração. Posts, resultados, contadores e avatares desenhados são exemplos ilustrativos, não dados reais de estudantes. O CTA e o QR apontam para **https://enturma-flax.vercel.app/download**, com Android e Windows, sem selos de lojas não publicadas.

## Motion e apresentadora

Retícula Ben-Day, contornos pretos, sombras duras, tipografia Archivo Black, rasgos diagonais, impactos cromáticos e partículas compõem a linguagem de quadrinhos. A paleta inclui ciano, magenta, amarelo, verde, roxo e laranja. SVG e Canvas são determinísticos, calculados pelo frame; não há animação CSS independente nem segundo loop de requestAnimationFrame.

A abertura já mostra marca, título, apresentadora e recursos no primeiro frame. As dezesseis cenas têm coreografias próprias, com gestos, objetos, tempos de antecipação e acomodação diferentes. A personagem fica apoiada em um card, com a cintura fixa. Os cards de conteúdo têm áreas reservadas que mantêm o rosto livre.

A personagem agora é uma ilustração articulada em camadas: tronco, cabeça, braços, antebraços e mãos separados. A cinemática conecta os punhos aos antebraços; os limites evitam dobras excessivas e a solução de dois segmentos mantém os comprimentos dos membros. Os pontos de apoio das mãos variam conforme palma, indicador, polegar, telefone, livro e chaves. Não há oscilação vertical do corpo inteiro nem ciclo de olhadas laterais.

Os movimentos são calculados a 24 fps em cada cena, com desenhos de boca e olhos substituídos durante a fala/piscada. A boca acompanha aproximadamente as vogais e as pausas nos timestamps da voz, sem alegar alinhamento fonético exato. É animação 2D articulada, não 2.160 desenhos feitos à mão. Nos painéis, os primeiros 12 frames de cada grupo de 36 seguram cada desenho por dois frames; o relógio separado da apresentadora preserva seus 24 fps.

Confetes ficam invisíveis antes do disparo e depois da dissipação, inclusive ao buscar para trás. Há uma única legenda visível, dentro da composição: grupos curtos de até quatro palavras, alto contraste, palavra atual destacada e entrada suave. A faixa externa do Player foi removida. Um texto visualmente oculto preserva a frase para leitores de tela.

After Effects, OBS, Ableton, Suno e Udio não foram usados. As cenas são construídas em código, não capturas da interface.

## Narração e trilha

Arquivo: `apps/web/public/intro/comic/enturma-comic-90-presenter-v2.mp3`, estéreo, 44,1 kHz, 160 kbps e 90 segundos.

A voz aprovada foi preservada: **pt-BR-FranciscaNeural**, feminina brasileira, velocidade `+5%`, pitch `+1Hz`. Uma única tomada termina em aproximadamente 88,6 segundos. As pausas internas medidas ficam entre 0,21 e 0,31 segundo, sem alongar o áudio nem reiniciar a apresentação a cada recurso.

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

As ilustrações foram geradas com a ferramenta integrada de imagens, preservando a identidade da apresentadora fictícia. Os novos arquivos de produção são `presenter-body.webp`, `presenter-faces.webp` e `presenter-hands.webp`, pranchas transparentes 4×2. As versões antigas permanecem para compatibilidade com clientes já abertos. Os PNGs originais estão preservados no diretório de geração do Codex.

Prompts usados nesta revisão (imagem integrada, sem API/CLI):
- Corpo: “Technical animation puppet sprite atlas of the same Afro-Brazilian Enturma presenter. Preserve rich inked neon comic artwork, brown skin, black curly afro, pearl earrings, cyan/magenta varsity jacket, yellow straps and purple trousers. Exact 4×2 equal transparent cells: armless headless torso, head, two upper arms, two forearms, two hands. Separate organic parts, no labels or mechanical joints.”
- Correção: “Remove shiny cyan mechanical joint balls, replace with normal jacket fabric or skin wrists. Preserve positions, scale, identity and transparency; remove grid lines.”
- Rosto: “Eight identical aligned heads, fixed camera and same hair silhouette. Change only facial features: closed smile, A vowel, E vowel, O vowel, full blink, concern, enthusiasm, half blink. Transparent 4×2 atlas.”
- Mãos: “Eight isolated brown hands with magenta nails, consistent wrist anchors: wave, presenting palm, pointing index, thumbs up, fist, magenta phone, study notebook, car keys. Rich comic inks; transparent 4×2 atlas.”

## Exportação e validação

Player e exports usam a mesma composição, com Remotion 4.0.530. A partir de `apps/web`:

```powershell
npx --package @remotion/cli@4.0.530 remotion studio src/remotion/index.tsx --no-open --port=3017
npx --package @remotion/cli@4.0.530 remotion render src/remotion/index.tsx EnturmaPortrait ../../dist/enturma-comic-90-portrait.mp4 --codec=h264 --scale=2 --crf=18
npx --package @remotion/cli@4.0.530 remotion render src/remotion/index.tsx EnturmaDesktop ../../dist/enturma-comic-90-desktop.mp4 --codec=h264 --scale=2 --crf=18
```

Exports antigos em `dist/` não são atualizados automaticamente quando a composição muda. A publicação usa o Player com o código e os assets desta revisão.

O fator 2 preserva as proporções, produz 1200×1720 e 2400×1350 e mantém dimensões pares para H.264. A entrega web não depende dos MP4.

Os testes cobrem duração/FPS, nove recursos, sincronização, enquadramento vertical, cards sem sobreposição no rosto, pausa, busca, minimização, replay, navegação, bloqueio de autoplay e movimento reduzido. Stills e exports permitem conferir os layouts e a sequência completa.
