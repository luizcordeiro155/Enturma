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
- Reprodução pausa fora da área visível ou com a aba oculta.
- A preferência de pouca animação do Enturma e `prefers-reduced-motion` usam uma apresentação estática de três segundos, sem partículas.
- Memória, número de núcleos e largura selecionam qualidade alta, otimizada ou baixa. Layouts lógicos específicos atendem retrato, paisagem, desktop e ultrawide.
- Eventos, observadores, tweens GSAP e o Player são descartados ao desmontar. Não há Player oculto executando em segundo plano.

## Reutilização em vídeo

`apps/web/src/remotion/index.tsx` registra a mesma composição, sem uma segunda implementação, nos formatos `EnturmaDesktop`, `EnturmaPortrait`, `EnturmaLandscape` e `EnturmaUltrawide`. O Player e o Remotion estão fixados na versão `4.0.530`.

Para uma exportação de marketing, use o CLI/Renderer da mesma versão, instalado no ambiente de renderização; ele não integra o bundle web. Por exemplo, a partir da raiz:

```powershell
npx --package @remotion/cli@4.0.530 remotion render apps/web/src/remotion/index.tsx EnturmaDesktop out/enturma-intro.mp4
```

As propriedades padrão usam recursos reais do produto, sem perfis fictícios. Uma exportação com perfis reais exige autorização para essa mídia; URLs de avatar autenticadas devem ser substituídas por arquivos acessíveis ao renderizador. A entrega web não depende de gerar MP4.
