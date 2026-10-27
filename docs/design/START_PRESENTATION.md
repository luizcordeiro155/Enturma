# Apresentação pública — refinamento visual

Superfície: `/`, `/start` e `/start/poster.png?v=2`. Modo: apresentação e participação.

A identidade verde-floresta, lima e papel claro permanece. A arte do livro aberto substitui a composição de cartões sobrepostos. A fonte Archivo Black, já utilizada pelo Enturma, é hospedada localmente e compartilhada com o pôster. Texto, logo e links continuam nativos, legíveis e acessíveis.

As abas Salas de estudo, Cadernos IA e Vida acadêmica apresentam recursos reais, com seleção por clique/toque e teclado (setas, Home/End). A imagem tem dimensões reservadas, prioridade de carregamento e animação leve via Web Animations API; movimentos param em segundo plano e respeitam redução de movimento. O fluxo de entrada, sessões e desvio do shell Android não foi modificado.

## Arte original

Gerada com a ferramenta integrada de geração de imagens, sem chave de API externa. Assets entregues:

- `apps/web/public/start/book-world.webp`: 1000 × 1250, aproximadamente 75 KB, ilustração da página.
- `apps/web/public/start/book-world-share.jpg`: 640 × 800, aproximadamente 47 KB, fonte local do pôster PNG 1200 × 630.

O parâmetro `v=2` atualiza a URL de Open Graph/Twitter para diferenciar a imagem anterior nos caches de compartilhamento. Plataformas que já armazenaram uma prévia podem exigir nova coleta.

Prompt usado:

> Create a premium original 3D editorial brand illustration for Enturma, a Brazilian university student community. Intended as the hero artwork of an elegant website and the right half of a social sharing poster. Portrait 4:5 composition. A beautifully crafted open academic book floating above a low circular forest-green podium, viewed three-quarter from above. Thick softly curved warm ivory paper pages with subtle pale-green ruled marks, rich lime-yellow-green cloth cover (#d8ef79), softly rounded edges, exceptional material detail. The open pages elegantly curl upward to suggest two people connecting. A small matching green pencil and one small abstract speech-bubble object float nearby, carefully restrained. Deep forest green (#173f35) seamless architectural studio background, warm directional sunlight from upper left, delicate paper shadows, soft ambient occlusion, sophisticated photographic CGI quality, tactile matte materials, cinematic depth, crisp silhouette. Large central open book occupies 65 percent of image. Composition is clean and deliberate, sculptural and welcoming, playful but grown-up. No characters, no UI cards, no random symbols, no words, no lettering, no logos, no watermarks, no grain, no neon. Bottom and top have generous clean breathing space. Use forest green, lime green and ivory only. The result should look like a bespoke award-winning educational brand campaign, not a generic icon.

## Verificação

O teste `public-start.spec.ts` cobre imagem de compartilhamento, seleção das abas com teclado, acesso ao login, temas, largura mobile, redução de movimento e desvio do shell Android. Os checks da PR e a inspeção da prévia registram o resultado do commit entregue; código de teste por si só não comprova aprovação.
