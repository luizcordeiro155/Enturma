# Apresentação oficial — o livro apresenta o Enturma

A composição compartilhada `EnturmaIntroComposition` apresenta **90 segundos, 2.160 frames a 24 fps**, em dezesseis cenas. O Player carrega sob demanda. A edição atual remove a personagem e mantém a tomada contínua de narração aprovada, sem pausas artificiais entre recursos.

## Formatos e conteúdo

Mantidos os formatos do aplicativo: `EnturmaPortrait` (600×860), `EnturmaDesktop` (1200×675), `EnturmaLandscape` (960×600) e `EnturmaUltrawide` (1600×640). Não foi imposta proporção 9:16.

Abertura, problemas da rotina, conexão, recompensas, cadernos IA, feed, salas/conversas, caronas, voz/vídeo/tela, minigames, amigos/perfil, matérias e convite final. Apenas funcionalidades existentes: sem frequência, Pomodoro ou promessas de “em breve”. Painéis e contadores desenhados são exemplos ilustrativos, não dados reais de estudantes. CTA e QR usam https://enturma-flax.vercel.app/download, com Android e Windows, sem selos de lojas não publicadas.

## Motion

`components/intro/book/` contém a nova direção: livro com perspectiva e páginas virando, painéis em camadas, portais de documentos, cartas em 3D, rota/carro com orientação pelo caminho, chamadas em mosaico, conexões e montagem final. Verde/lima da marca combina com ciano, violeta, rosa e laranja. Retícula, sombras gráficas, raios, câmera com paralaxe e acentos por batida mantêm a linguagem de quadrinhos.

Os frames são determinísticos em Remotion. Cada cena tem sua coreografia; o livro aparece como guia durante os capítulos. A abertura já contém marca, título e conteúdo. Áreas reservadas separam título, animação e legenda nos quatro formatos. Confetes só existem no DOM durante a explosão e dissipação, inclusive após buscar para trás. A única legenda visível fica dentro do vídeo, em blocos curtos com palavra atual destacada e placa de alto contraste.

As animações são construídas em código. Não são exportações de After Effects nem capturas OBS. Assets antigos da personagem permanecem para clientes com código anterior, mas a nova composição não os monta.

## Áudio

Arquivo de produção: `apps/web/public/intro/comic/enturma-book-cinema-90-v1.mp3`, estéreo, 44,1 kHz, 192 kbps e 90 segundos. A narração feminina brasileira já aprovada foi preservada, com os mesmos timestamps de palavras/cortes. Não há TTS em tempo de execução.

`scripts/generate-book-intro-audio.py` cria uma trilha instrumental original inspirada em phonk, a 138 BPM: 808, cowbell, percussão e efeitos sintetizados. Passagens de página, confirmações, conquistas, portal e motor da carona acompanham as cenas. O instrumental abaixa sob a narração; a pausa musical não interrompe a voz. Normalização `loudnorm=I=-16:TP=-1.5:LRA=8`. Não usa samples musicais, Suno, Udio ou gravações de terceiros.

O MP3 pronto está versionado e o build não depende de geração de áudio. Para refazer a mixagem, instale Python/NumPy e FFmpeg no PATH e restaure a gravação aprovada em `.local/comic-intro/continuous.mp3` (arquivo de trabalho, fora do Git):

```powershell
py scripts/generate-book-intro-audio.py
```

O script recusa continuar sem essa gravação para não trocar a voz silenciosamente. Os scripts antigos de geração pertencem às edições anteriores e não devem sobrescrever o storyboard atual.

## Reprodução e acessibilidade

- Som ativado por padrão. Quando o navegador impede autoplay sonoro, a apresentação aguarda o toque em **Reproduzir com som**.
- Pausa, avanço, teclado, minimização e replay preservados. Aba oculta/Player fora da área visível pausa a reprodução.
- Pular ou terminar mantém a miniatura **Conheça o Enturma**, sem Player ativo em segundo plano.
- Redução de movimento congela a cena em posição legível, remove partículas/transições e mantém narração/legendas.
- O estado `enturma-intro:v0.3` não é reiniciado; quem já assistiu pode ver a edição nova pelo replay.
- O APK WebView e o Desktop compartilham o Player Web.

## Exportação e validação

Remotion 4.0.530, composição idêntica no Studio, Player e render. A partir de `apps/web`:

```powershell
npx --package @remotion/cli@4.0.530 remotion studio src/remotion/index.tsx --no-open --port=3017
npx --package @remotion/cli@4.0.530 remotion render src/remotion/index.tsx EnturmaPortrait ../../dist/enturma-book-90-portrait.mp4 --codec=h264 --crf=18
npx --package @remotion/cli@4.0.530 remotion render src/remotion/index.tsx EnturmaDesktop ../../dist/enturma-book-90-desktop.mp4 --codec=h264 --crf=18
```

A entrega Web usa o Player e o MP3 versionado, não depende de MP4. Exports antigos não se atualizam sozinhos. `--scale=2` permite renderizar com o dobro da resolução mantendo a proporção.

Testes verificam duração/FPS, nove recursos, ausência da personagem, movimento do livro entre frames, confetes somente no disparo, limites de título/arte/legenda, formatos mobile/desktop, áudio, avanço, pausa, replay, minimização e redução de movimento. Frames foram inspecionados visualmente. A fonte Archivo Black permanece com a licença OFL no diretório público.

---

### Revisão 25/10/2026 — abertura, Guia e aplicativos

A apresentação oficial de 90 segundos é separada das **animações curtas de abertura do app** em `components/motion/launch-player.tsx`, que têm 120 frames para caronas ou 144 frames para a abertura geral na composição vigente. `components/motion/guide-scenes.tsx` oferece cenas distintas de recursos em loop, com duração de 180 frames por composição. `theme-motion.ts` implementa transição visual responsiva com suporte a `prefers-reduced-motion`.

O Android também dispõe de efeitos nativos de tema e carona em `apps/mobile/src/experience-motion.tsx`; os filmes do instalador NSIS ficam em `apps/desktop/assets/motion`. **Não misturar** intro de 90s, abertura do aplicativo, Guia e animações de instalação em uma única peça. Cada elemento deve pausar no background, não provocar recarregamento ou deslocamento de chat e respeitar acessibilidade.
