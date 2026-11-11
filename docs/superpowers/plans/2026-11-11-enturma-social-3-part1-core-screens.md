# Enturma Social 3 — Parte 1 (telas principais) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refazer Feed, Clips, Stories, Perfil, Comentários, Criar e a navegação do Social no frontend, com gestos horizontais no celular e três faixas de largura, usando somente a API que já existe.

**Architecture:** A regra de gestos e de mídia vira funções puras em `apps/web/src/lib`, testadas sem DOM. Um componente `SocialPager` passa a ser dono das páginas Clips/Feed/Criar; o cartão do feed, o carrossel, os comentários e as ações de publicação saem do arquivo único `social-post.tsx` para unidades próprias. O visual novo fica em `social-3.css`, carregado depois de `social.css`.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS puro com os tokens de `globals.css`, lucide-react, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-11-enturma-social-3-design.md` (seções "Navegação, gestos e responsividade" e "Parte 1").

**Escopo deste plano:** só a Parte 1. As partes 2 a 5 recebem um plano cada, escrito quando a anterior estiver na branch de release. Ficam para a Parte 2, por dependerem de backend: item Explorar na navegação, coluna de sugestões a partir de 1200 px, reciclagem de Clips e novo ranqueamento. Contador de não lidas fica para a Parte 4; reações rápidas em Story, para a Parte 5.

## Global Constraints

- Branch de trabalho `feat/social-3-part1`, criada de `feat/social-3`; PR com base em `feat/social-3`. Nada vai para `main` neste plano.
- Nenhuma mudança em `services/api`, em migrations ou em páginas fora de `/social`.
- Cores, fontes e raios só pelos tokens existentes (`--bg`, `--surface`, `--soft`, `--ink`, `--muted`, `--accent`, `--on-accent`, `--border`). Nenhuma fonte nova, nenhuma marca, ícone ou tela de terceiros.
- Faixas de largura: até 767 px, 768 a 1199 px, 1200 px ou mais.
- Todo gesto tem alternativa por botão. `prefers-reduced-motion: reduce` remove transições.
- Um único vídeo tocando por vez em todo o Social.
- Manter os nomes acessíveis já usados pelos E2E: `Curtir · N`, `Comentários · N`, `Republicar · N`, `Compartilhar publicação`, `Salvar publicação`, `Opções da publicação`, `Próximo Clip`, `Clip anterior`, `Excluir meu Story`, `Escolher mídia`, `Enviar e publicar`.
- Textos de interface em português do Brasil. Não inventar números ou conteúdo fictício.
- Cada commit termina com as linhas `Co-Authored-By` e `Claude-Session` da sessão.

Comandos (na raiz do repositório):

- Unidade: `npm run test -w @enturma/web -- <arquivo>`
- Tipos e lint: `npm run typecheck -w @enturma/web` e `npm run lint -w @enturma/web`
- E2E: rodam na CI da PR (precisam de PostgreSQL e da API). Falhas: `gh run view <id> --log-failed`.

## Review Focus

1. Arrastar na horizontal começando num carrossel de várias fotos rola o carrossel e não troca de página (Task 2).
2. Arrastar a partir dos 28 px da borda da tela (voltar do Android) não troca de página (Task 1 e Task 2).
3. Duplo toque numa publicação já curtida não descurte (Task 4).
4. Publicação só de texto aparece no feed e na grade do perfil sem área de mídia vazia (Task 4 e Task 7).
5. Com autoplay desligado nas preferências, ou aba em segundo plano, nenhum vídeo do feed começa sozinho (Task 4).

---

### Task 1: Regras puras de gesto e de mídia

**Files:**
- Create: `apps/web/src/lib/social-pager.ts`, `apps/web/src/lib/social-pager.test.ts`
- Create: `apps/web/src/lib/social-media.ts`, `apps/web/src/lib/social-media.test.ts`

**Interfaces:**
- Consumes: `SocialView`, `SocialPost` de `lib/social.ts`.
- Produces:
  - `PAGER_ORDER: readonly SocialView[]` = `["clips", "feed", "create"]`
  - `EDGE_GUARD = 28`, `AXIS_LOCK = 10`
  - `pagerNeighbor(view: SocialView, dx: number): SocialView | null` (`dx > 0` é o dedo indo para a direita)
  - `lockAxis(dx: number, dy: number): "x" | "y" | null`
  - `pagerSettles(dx: number, ms: number, width: number): boolean`
  - `gestureStartAllowed(startX: number, width: number): boolean`
  - `mediaAspect(width?: number, height?: number): number` (largura/altura, limitada a 0,8–1,91; sem dados = 1)
  - `relativeTime(iso: string, now: Date): string`
  - `groupStories(items: SocialPost[]): { authorId: string; items: SocialPost[] }[]`
  - `storyTapZone(x: number, width: number): "back" | "forward"`

- [ ] **Step 1: Escrever os testes que falham**

```ts
// social-pager.test.ts
it("mapeia o arrasto para a página vizinha, com o Feed no meio", () => {
  expect(pagerNeighbor("feed", 80)).toBe("clips");
  expect(pagerNeighbor("feed", -80)).toBe("create");
  expect(pagerNeighbor("clips", -80)).toBe("feed");
  expect(pagerNeighbor("clips", 80)).toBeNull();
  expect(pagerNeighbor("create", 80)).toBe("feed");
  expect(pagerNeighbor("create", -80)).toBeNull();
});
it("trava o eixo só depois de 10 px e prefere o vertical em diagonal", () => {
  expect(lockAxis(6, 3)).toBeNull();
  expect(lockAxis(30, 8)).toBe("x");
  expect(lockAxis(8, 30)).toBe("y");
  expect(lockAxis(20, 20)).toBe("y");
});
it("confirma a troca com 25% da largura ou com velocidade", () => {
  expect(pagerSettles(100, 400, 390)).toBe(true); // 25,6%
  expect(pagerSettles(90, 400, 390)).toBe(false);
  expect(pagerSettles(60, 80, 390)).toBe(true); // 0,75 px/ms
  expect(pagerSettles(20, 20, 390)).toBe(false); // rápido, mas menos de 24 px
});
it("ignora gestos que começam na borda do sistema", () => {
  expect(gestureStartAllowed(27, 390)).toBe(false);
  expect(gestureStartAllowed(28, 390)).toBe(true);
  expect(gestureStartAllowed(363, 390)).toBe(false);
});
```

```ts
// social-media.test.ts
const now = new Date("2026-11-11T12:00:00Z");
it("limita a proporção entre 4:5 e 1,91:1", () => {
  expect(mediaAspect(1080, 1920)).toBe(0.8);
  expect(mediaAspect(1920, 800)).toBe(1.91);
  expect(mediaAspect(1080, 1080)).toBe(1);
  expect(mediaAspect()).toBe(1);
});
it("escreve o tempo relativo em português", () => {
  expect(relativeTime("2026-11-11T11:59:40Z", now)).toBe("agora");
  expect(relativeTime("2026-11-11T11:55:00Z", now)).toBe("há 5 min");
  expect(relativeTime("2026-11-11T09:00:00Z", now)).toBe("há 3 h");
  expect(relativeTime("2026-11-09T12:00:00Z", now)).toBe("há 2 d");
  expect(relativeTime("2026-10-01T12:00:00Z", now)).toMatch(/1 de out/);
});
it("agrupa Stories por autor, do mais antigo ao mais novo, na ordem de chegada", () => {
  const s = (id: string, authorId: string, publishedAt: string) =>
    ({ id, authorId, publishedAt }) as SocialPost;
  expect(
    groupStories([
      s("b2", "b", "2026-11-11T10:00:00Z"),
      s("a1", "a", "2026-11-11T09:00:00Z"),
      s("b1", "b", "2026-11-11T08:00:00Z"),
    ]).map((g) => [g.authorId, g.items.map((i) => i.id)]),
  ).toEqual([["b", ["b1", "b2"]], ["a", ["a1"]]]);
});
it("divide o toque do Story em voltar (30% à esquerda) e avançar", () => {
  expect(storyTapZone(100, 390)).toBe("back");
  expect(storyTapZone(118, 390)).toBe("forward");
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npm run test -w @enturma/web -- src/lib/social-pager.test.ts src/lib/social-media.test.ts`. Esperado: FAIL por módulo inexistente.
- [ ] **Step 3: Implementar as funções.** `pagerSettles`: `Math.abs(dx) >= 0.25 * width`, ou `Math.abs(dx) >= 24` com `Math.abs(dx) / Math.max(ms, 1) >= 0.5`. `lockAxis`: `x` somente se `|dx| > |dy| * 1.2`. `relativeTime`: "agora" abaixo de 60 s; minutos abaixo de 60 min; horas abaixo de 24 h; dias abaixo de 7 d; depois `toLocaleDateString("pt-BR", { day: "numeric", month: "short" })`.
- [ ] **Step 4: Rodar e ver passar** — mesmo comando do Step 2, mais `npm run typecheck -w @enturma/web`. Esperado: PASS.
- [ ] **Step 5: Commit** — `feat(social): add pager, media and story rules`

### Task 2: `SocialPager` — páginas Clips/Feed/Criar com gesto

**Files:**
- Create: `apps/web/src/components/social/social-pager.tsx`, `apps/web/src/components/social/social-pager.test.tsx`
- Create: `apps/web/src/components/social/social-3.css`
- Modify: `apps/web/src/components/social/social.tsx` (trocar as três `<section>` e os handlers `onTouchStart/onTouchEnd` pelo pager), `apps/web/src/app/social/page.tsx` (importar `social-3.css` depois de `social.css`)
- Modify: `apps/web/src/components/social/social-clips.tsx` (remover `data-social-gesture="ignore"` de `.social-clip-video`)
- Modify: `apps/web/src/lib/social.ts` (remover `socialGesture`, que fica sem uso), `apps/web/src/lib/social.test.ts` (remover o teste "distinguishes horizontal navigation…", substituído pelos da Task 1)

**Interfaces:**
- Consumes: Task 1 (`PAGER_ORDER`, `pagerNeighbor`, `lockAxis`, `pagerSettles`, `gestureStartAllowed`).
- Produces:
  - `SocialPager({ view, select, peek, children }: { view: SocialView; select: (v: SocialView) => void; peek: (v: SocialView) => void; children: (page: SocialView) => React.ReactNode })`
  - `PAGER_IGNORE = "[data-social-gesture],input,textarea,select,[contenteditable],[role=slider],dialog"`
  - Marcação: `div.social-pager[data-view]` com três `section.social-pager-page[data-page]`; a página ativa não tem `inert`, as outras têm `inert` e `aria-hidden="true"`.
  - `peek(v)` é chamado quando o arrasto começa em direção a `v`, para o workspace montar a página antes de ela aparecer.

Comportamento que o teste não fixa: o gesto só é ligado quando `matchMedia("(max-width: 767px)")` casa; a faixa acompanha o dedo com `transform: translateX`; depois de travar em `x`, o `click` seguinte é suprimido uma vez; acima de 767 px só a página ativa é exibida, sem faixa.

- [ ] **Step 1: Escrever o teste que falha** (`social-pager.test.tsx`, com `matchMedia` simulando 390 px; `Pager` é um invólucro de teste que renderiza `SocialPager` com três páginas simples, a do Feed contendo um `div[data-testid=carousel][data-social-gesture]` e um `<textarea>`; `page(nome)` devolve a `section[data-page]`; `swipe(el, fromX, toX, y = 300, ms = 200)` dispara `touchStart`, dois `touchMove` e `touchEnd`):

```tsx
it("troca de página conforme a direção, com o Feed no meio", () => {
  const select = vi.fn();
  const { rerender } = render(<Pager view="feed" select={select} />);
  swipe(page("feed"), 100, 300); // dedo para a direita
  expect(select).toHaveBeenLastCalledWith("clips");
  swipe(page("feed"), 300, 100);
  expect(select).toHaveBeenLastCalledWith("create");
  rerender(<Pager view="clips" select={select} />);
  swipe(page("clips"), 300, 100);
  expect(select).toHaveBeenLastCalledWith("feed");
  select.mockClear();
  swipe(page("clips"), 100, 300);
  expect(select).not.toHaveBeenCalled();
});
it("não troca quando o gesto começa em carrossel, campo de texto ou borda", () => {
  const select = vi.fn();
  render(<Pager view="feed" select={select} />); // o Feed de teste contém um [data-social-gesture] e um <textarea>
  swipe(screen.getByTestId("carousel"), 300, 100);
  swipe(screen.getByRole("textbox"), 300, 100);
  swipe(page("feed"), 10, 300);
  expect(select).not.toHaveBeenCalled();
});
it("movimento vertical dominante não troca de página", () => {
  const select = vi.fn();
  render(<Pager view="feed" select={select} />);
  swipeDiagonal(page("feed"), { dx: 40, dy: 200 });
  expect(select).not.toHaveBeenCalled();
});
it("as páginas inativas ficam inertes", () => {
  render(<Pager view="feed" select={() => {}} />);
  expect(page("clips")).toHaveAttribute("inert");
  expect(page("feed")).not.toHaveAttribute("inert");
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npm run test -w @enturma/web -- src/components/social/social-pager.test.tsx`.
- [ ] **Step 3: Implementar `SocialPager`** e as regras de `.social-pager` em `social-3.css` (faixa flex de três colunas de 100% até 767 px, `touch-action: pan-y`; `display: none` nas inativas a partir de 768 px).
- [ ] **Step 4: Ligar no workspace** — em `social.tsx`, `select` continua sendo a única forma de mudar `view`; `peek` adiciona a página a `opened`. Remover o `ref` `gesture` e o import de `socialGesture`.
- [ ] **Step 5: Rodar e ver passar** — testes da Task 2, `social-navigation.test.tsx`, typecheck e lint.
- [ ] **Step 6: Commit** — `feat(social): swipe pager between Clips, Feed and Create`

### Task 3: Navegação e faixas de largura

**Files:**
- Modify: `apps/web/src/components/social/social-navigation.tsx`, `apps/web/src/components/social/social-navigation.test.tsx`
- Modify: `apps/web/src/components/social/social.tsx` (cabeçalho), `apps/web/src/components/social/social-3.css`
- Modify: `apps/web/src/components/social/social.css` (trocar `760px` por `767px`, `761px` por `768px` e `1060px` por `1199px` nas media queries)
- Modify: `apps/web/e2e/enturma-social.spec.ts` (teste "Social navigation: mobile dock…", linha 93)

**Interfaces:**
- Consumes: props atuais de `SocialNavigation` (inalteradas).
- Produces: barra/trilho com Feed, Criar, Clips e Perfil, na ordem salva em `prefs.navigation.order` seguida de Perfil. O link `Mensagens` (`href="/friends"`) sai da navegação e vira link com ícone e nome acessível `Mensagens` dentro de `header.social-header`. A troca entre barra, trilho compacto e trilho com rótulos é feita só por CSS.

- [ ] **Step 1: Atualizar os testes para o novo contrato.** Em `social-navigation.test.tsx`, o teste "Social uses the existing selection handlers…" passa a afirmar que `nav` não contém link `Mensagens`. No E2E, a linha 93 passa a procurar o link em `page.locator(".social-header")`. Acrescentar ao mesmo E2E, para 390, 820 e 1440 px:

```ts
const nav = page.locator(".social-navigation");
const box = await nav.boundingBox();
if (width <= 767) expect(box!.y).toBeGreaterThan(400); // barra inferior
else expect(box!.x).toBeLessThan(40); // trilho lateral
const labelVisible = await nav.getByText("Feed", { exact: true }).isVisible();
expect(labelVisible).toBe(width <= 767 || width >= 1200);
expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
```

- [ ] **Step 2: Rodar a unidade e ver falhar** — `npm run test -w @enturma/web -- src/components/social/social-navigation.test.tsx`.
- [ ] **Step 3: Implementar.** Barra inferior até 767 px (altura atual, safe area preservada); trilho de 72 px só com ícones (rótulos em `sr-only`, `title` com o nome) de 768 a 1199 px; trilho com rótulos a partir de 1200 px. Conteúdo: coluna central de até 470 px para o Feed a partir de 768 px.
- [ ] **Step 4: Rodar e ver passar** — unidade, typecheck, lint.
- [ ] **Step 5: Commit** — `feat(social): responsive navigation in three width bands`

### Task 4: Cartão do feed, carrossel e ações

**Files:**
- Create: `apps/web/src/components/social/use-post-actions.ts`
- Create: `apps/web/src/components/social/social-media-carousel.tsx`, `apps/web/src/components/social/social-media-carousel.test.tsx`
- Create: `apps/web/src/components/social/use-autoplay-in-view.ts`
- Modify: `apps/web/src/components/social/social-post.tsx` (o `SocialPost` passa a usar as unidades acima; remover a prop `children`; a prop `clip` sai na Task 5), `apps/web/src/components/social/social-stream.tsx` (esqueletos e puxar para atualizar), `apps/web/src/components/social/social-3.css`
- Test: `apps/web/src/components/social/social-post.test.tsx` (novo)

**Interfaces:**
- Consumes: `mediaAspect`, `relativeTime` (Task 1).
- Produces:
  - `usePostActions(item: Post, changed: (p: Post) => void): { busy: boolean; error: string; react(kind: "LIKE" | "SAVE" | "REPOST"): Promise<void>; like(): Promise<void>; act(path: string, body?: unknown, method?: string): Promise<void> }` — `like()` só envia `{ active: true }` e não faz nada se `item.mine` já tem `LIKE`.
  - `SocialMediaCarousel({ media, authorName, autoplay }: { media: SocialMedia[]; authorName: string; autoplay: boolean })` — raiz com `data-social-gesture="ignore"` apenas quando `media.length > 1`; pontos `role="tablist"` com um `role="tab"` por mídia; setas `Mídia anterior`/`Próxima mídia` a partir de 768 px.
  - `useAutoplayInView(ref: RefObject<HTMLVideoElement | null>, enabled: boolean): void` — toca sem som com 60% visível, documento visível e nenhum `dialog[open]`; pausa ao sair; pausa os outros vídeos de `.social-page`.
  - `SocialPost` mantém `{ item, me, person, changed }`.

- [ ] **Step 1: Escrever os testes que falham**

```tsx
// social-post.test.tsx (socialWrite simulado)
it("duplo toque curte e nunca descurte", async () => {
  renderPost({ mine: [] });
  await doubleTap(screen.getByTestId("post-media"));
  expect(socialWrite).toHaveBeenCalledWith("/posts/p1/reactions/LIKE", { active: true });
  socialWrite.mockClear();
  renderPost({ mine: ["LIKE"] });
  await doubleTap(screen.getAllByTestId("post-media")[1]);
  expect(socialWrite).not.toHaveBeenCalled();
});
it("publicação só de texto não reserva área de mídia", () => {
  renderPost({ media: [], body: "Só texto" });
  expect(screen.queryByTestId("post-media")).toBeNull();
  expect(screen.getByText("Só texto")).toBeVisible();
});
it("recolhe legendas longas e mostra todos os comentários por um botão", async () => {
  renderPost({ body: "a".repeat(300), comments: 12 });
  expect(screen.getByRole("button", { name: "mais" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Ver todos os 12 comentários" })).toBeVisible();
});
```

```tsx
// social-media-carousel.test.tsx
it("só bloqueia o gesto de página quando há mais de uma mídia", () => {
  const { container, rerender } = render(<SocialMediaCarousel media={[img("a")]} authorName="Ana" autoplay />);
  expect(container.querySelector("[data-social-gesture]")).toBeNull();
  rerender(<SocialMediaCarousel media={[img("a"), img("b")]} authorName="Ana" autoplay />);
  expect(container.querySelector("[data-social-gesture]")).not.toBeNull();
  expect(screen.getAllByRole("tab")).toHaveLength(2);
});
it("com autoplay desligado o vídeo não recebe o observador", () => {
  render(<SocialMediaCarousel media={[video("v")]} authorName="Ana" autoplay={false} />);
  expect(IntersectionObserver).not.toHaveBeenCalled();
});
it("com a aba em segundo plano o vídeo visível não começa a tocar", () => {
  Object.defineProperty(document, "hidden", { value: true, configurable: true });
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  render(<SocialMediaCarousel media={[video("v")]} authorName="Ana" autoplay />);
  intersect(screen.getByTestId("post-video"), 0.8); // aciona o callback do observador simulado
  expect(play).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar.** Ordem do cartão: autor e opções; mídia de ponta a ponta com `aspect-ratio: mediaAspect(...)` da primeira mídia; linha de ações (curtir, comentar, republicar, enviar; salvar à direita); "N curtidas" quando `likes > 0`; legenda com o nome do autor, recolhida em 125 caracteres com botão `mais`; `Ver todos os N comentários` quando `comments > 0`; `relativeTime`. Animação de coração no duplo toque, desligada com movimento reduzido. `SocialStream`: três esqueletos enquanto `busy` sem itens; puxar para atualizar até 767 px chama `load(true)` quando o painel está no topo e o arrasto vertical passa de 70 px. `autoplay` vem de `prefs.autoplay`, repassado pelo workspace.
- [ ] **Step 4: Rodar e ver passar** — testes novos, typecheck, lint.
- [ ] **Step 5: Commit** — `feat(social): media-first feed card with carousel and double-tap like`

### Task 5: Clips em tela cheia

**Files:**
- Create: `apps/web/src/components/social/social-clip-overlay.tsx`
- Modify: `apps/web/src/components/social/social-clips.tsx`, `apps/web/src/components/social/social-post.tsx` (remover a prop `clip`), `apps/web/src/components/social/social-3.css`
- Modify: `apps/web/e2e/enturma-social.spec.ts` (teste "player Clips: um vídeo ativo…")

**Interfaces:**
- Consumes: `usePostActions` (Task 4); `FollowButton`, `SocialShare` de `social-post.tsx`; `SocialComments` chega na Task 8 (até lá, o diálogo de comentários atual).
- Produces:
  - `SocialClipOverlay({ item, me, person, changed, progress }: { item: Post; me: string; person: (id: string) => void; changed: (p: Post) => void; progress: number })` — trilho de ações à direita (avatar com seguir, curtir, comentar, enviar, salvar, opções), autor e legenda embaixo, barra `role="progressbar"` com `aria-label="Progresso do Clip"`.
  - `SocialClips` ganha abas `Para você` (`kind=CLIP&tab=for-you`) e `Seguindo` (`kind=CLIP&tab=following`), cada uma com seu `useSocialStream` e sua posição.
  - Som ligado/desligado em `sessionStorage["enturma-social-clips-muted"]` (`"0"`/`"1"`, padrão `"1"`).

- [ ] **Step 1: Atualizar o E2E que falha.** No teste "player Clips…", além das afirmações atuais (um só vídeo tocando, teclado, pausa ao sair), afirmar em 390 px:

```ts
const clip = page.locator(".social-clip-page").first();
const size = await clip.boundingBox();
const view = page.viewportSize()!;
expect(size!.width).toBeGreaterThanOrEqual(view.width - 1);
expect(size!.height).toBeGreaterThan(view.height * 0.8);
await expect(clip.getByRole("progressbar", { name: "Progresso do Clip" })).toBeVisible();
await expect(page.getByRole("tab", { name: "Seguindo" })).toBeVisible();
```

e em 1440 px: `expect(size!.width / size!.height).toBeCloseTo(9 / 16, 1)`.

- [ ] **Step 2: Implementar.** Página do Clip com `height` igual à área útil (`100dvh` menos cabeçalho compacto e barra inferior até 767 px), `scroll-snap-align: start` e `scroll-snap-stop: always`. De 768 px em diante, coluna 9:16 centralizada com as setas atuais ao lado. O vídeo usa `object-fit: cover`. O cabeçalho `social-header` fica oculto na página de Clips até 767 px. `near` continua `|i - index| <= 1`.
- [ ] **Step 3: Rodar** unidade, typecheck e lint. Esperado: PASS (o E2E roda na CI da PR).
- [ ] **Step 4: Commit** — `feat(social): full-screen Clips with side actions and tabs`

### Task 6: Stories em tela cheia por toque

**Files:**
- Modify: `apps/web/src/components/social/social-stories.tsx`, `apps/web/src/components/social/social-3.css`
- Test: `apps/web/src/components/social/social-stories.test.tsx` (novo)

**Interfaces:**
- Consumes: `groupStories`, `storyTapZone`, `lockAxis` (Task 1).
- Produces: `StoryViewer` mantém as props atuais. Internamente navega por grupos de autor; uma barra de progresso por Story do autor atual.

- [ ] **Step 1: Escrever o teste que falha**

```tsx
it("toque à direita avança, à esquerda volta e passa para o próximo autor no fim", () => {
  renderViewer([story("a1", "a"), story("a2", "a"), story("b1", "b")]);
  expect(current()).toBe("a1");
  tap(stage(), 300); expect(current()).toBe("a2");
  tap(stage(), 50); expect(current()).toBe("a1");
  tap(stage(), 300); tap(stage(), 300); expect(current()).toBe("b1");
  expect(screen.getAllByRole("progressbar")).toHaveLength(1);
});
it("deslizar para baixo fecha e segurar pausa", () => {
  const close = vi.fn();
  renderViewer([story("a1", "a")], { close });
  hold(stage()); expect(screen.getByRole("button", { name: "Reproduzir Story" })).toBeVisible();
  release(stage());
  swipeDown(stage(), 120); expect(close).toHaveBeenCalled();
});
```

- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar.** Visualizador em tela cheia até 767 px e cartão 9:16 centralizado acima disso. Toque curto (menos de 250 ms, menos de 10 px) usa `storyTapZone`; segurar pausa; arrasto vertical para baixo acima de 90 px fecha; arrasto horizontal troca de autor. Os botões atuais (anterior, pausar, curtir, responder, visualizações, destaque, excluir, próximo) permanecem com os mesmos nomes acessíveis, numa barra inferior. O anel de Story não visto usa `--accent`; o visto, `--border`.
- [ ] **Step 4: Rodar e ver passar** — teste novo, typecheck, lint.
- [ ] **Step 5: Commit** — `feat(social): tap-through full-screen Stories grouped by author`

### Task 7: Perfil em grade

**Files:**
- Create: `apps/web/src/components/social/social-profile-grid.tsx`, `apps/web/src/components/social/social-profile-grid.test.tsx`
- Create: `apps/web/src/components/social/social-post-viewer.tsx`
- Modify: `apps/web/src/components/social/social-profile.tsx`, `apps/web/src/components/social/social-3.css`

**Interfaces:**
- Consumes: `useSocialStream` (`social-stream.tsx`), `SocialPost` (Task 4), `mediaUrl`.
- Produces:
  - `SocialProfileGrid({ query, active, shape, open }: { query: string; active: boolean; shape: "square" | "portrait"; open: (items: Post[], index: number) => void })` — lista `role="list"`; cada célula é um botão com nome acessível `Abrir publicação de <data>`; rolagem contínua com o mesmo sentinela do feed.
  - `SocialPostViewer({ items, start, me, person, changed, close }: { items: Post[]; start: number; me: string; person: (id: string) => void; changed: (p: Post) => void; close: () => void })` — diálogo com os `SocialPost` da lista, rolado até `start`.
  - Abas do perfil: Posts (`shape="square"`), Clips (`shape="portrait"`), Republicações e Marcados (`square`). Fixados aparecem primeiro na aba Posts, com marca "Fixado".

- [ ] **Step 1: Escrever o teste que falha**

```tsx
it("mostra miniatura para mídia e bloco de texto para publicação sem mídia", () => {
  renderGrid([post("p1", { media: [img("m1")] }), post("p2", { media: [], body: "Só texto" })]);
  const cells = screen.getAllByRole("listitem");
  expect(within(cells[0]).getByRole("img")).toHaveAttribute("src", expect.stringContaining("/media/m1/content?thumbnail=true"));
  expect(within(cells[1]).queryByRole("img")).toBeNull();
  expect(within(cells[1]).getByText("Só texto")).toBeVisible();
});
it("abre a publicação tocada no contexto da lista", async () => {
  const open = vi.fn();
  renderGrid([post("p1"), post("p2")], { open });
  await userEvent.click(screen.getAllByRole("button")[1]);
  expect(open).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: "p2" })]), 1);
});
```

- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar.** Grade de 3 colunas com 2 px de intervalo; células `aspect-ratio: 1` (ou `9 / 16` em Clips); selo de carrossel quando `media.length > 1` e de vídeo quando a primeira mídia é `VIDEO`. O perfil ocupa a tela inteira até 767 px e mantém o diálogo largo acima disso. Cabeçalho: avatar, contadores reais, botões seguir e `Mensagem` (link para `/friends`), destaques. A revisão de marcações pendentes continua na aba Marcados.
- [ ] **Step 4: Rodar e ver passar** — teste novo, typecheck, lint.
- [ ] **Step 5: Commit** — `feat(social): profile grid with in-context post viewer`

### Task 8: Comentários em painel

**Files:**
- Create: `apps/web/src/components/social/social-comments.tsx` (o componente `Comments` sai de `social-post.tsx` sem mudança de comportamento)
- Modify: `apps/web/src/components/social/social-post.tsx`, `apps/web/src/components/social/social-clip-overlay.tsx`, `apps/web/src/components/social/social-dialog.tsx` (nova prop `variant?: "sheet" | "panel"`), `apps/web/src/components/social/social-3.css`

**Interfaces:**
- Consumes: `SocialDialog`, API de comentários atual.
- Produces: `SocialComments({ item, me, changed, close }: { item: Post; me: string; changed: (p: Post) => void; close: () => void })`. Até 767 px: folha inferior com no máximo `75dvh`. A partir de 768 px: painel à direita com 420 px e altura total. Lista rola por dentro; o campo de envio fica fixo embaixo e acompanha o teclado.

- [ ] **Step 1: Acrescentar ao E2E "Social real: publicar, comentar, seguir…"**, logo depois de abrir os comentários:

```ts
const sheet = page.getByRole("dialog", { name: "Conversa da publicação" });
const box = await sheet.boundingBox();
const view = page.viewportSize()!;
if (view.width <= 767) {
  expect(box!.y + box!.height).toBeGreaterThanOrEqual(view.height - 1);
  expect(box!.height).toBeLessThanOrEqual(view.height * 0.75 + 1);
} else {
  expect(box!.x + box!.width).toBeGreaterThanOrEqual(view.width - 1);
  expect(box!.width).toBeLessThanOrEqual(421);
}
```

- [ ] **Step 2: Extrair e estilizar.** O título do diálogo continua "Conversa da publicação".
- [ ] **Step 3: Rodar** unidade, typecheck e lint. Esperado: PASS.
- [ ] **Step 4: Commit** — `refactor(social): comments as bottom sheet and side panel`

### Task 9: Criar em etapas com envio em segundo plano

**Files:**
- Modify: `apps/web/src/components/social/social-editor.tsx`, `apps/web/src/components/social/social.tsx`, `apps/web/src/components/social/social-3.css`
- Modify: `apps/web/e2e/enturma-social.spec.ts` (testes "Social real…", "editor de vídeo real…", "câmera: gravação WebM…")
- Test: `apps/web/src/components/social/social-editor-steps.test.tsx` (novo)

**Interfaces:**
- Consumes: `SocialEditor` atual (rascunho, `save`, `publish`).
- Produces:
  - Estado `step: "pick" | "edit" | "details"` dentro de `SocialEditor`. `pick`: tipo (Post, Story, Clip), `Escolher mídia`, `Gravar`, rascunhos salvos, campo de texto para publicar só texto. `edit`: prévia, ordem do carrossel, editor de vídeo, textos do Story. `details`: legenda, visibilidade, projeto, `Salvar rascunho`, `Exportar e revisar` e a ação principal (`Publicar <tipo>` ou `Enviar e publicar`).
  - Botões `Avançar` e `Voltar`. Escolher ou gravar mídia leva a `edit`; texto sem mídia pula `edit`.
  - Nova prop `onProgress?: (p: { state: "idle" | "working" | "done" | "error"; label: string }) => void`. O workspace mostra um `p.social-upload-chip[role=status]` no cabeçalho do Feed enquanto `state === "working"`, e o erro com link "Abrir rascunho" quando `state === "error"`.
  - Em `save(true, true)`, a página Criar pode ficar oculta: o envio continua, porque a página permanece montada.

- [ ] **Step 1: Escrever o teste que falha**

```tsx
it("percorre escolher, editar e detalhes, e publica só nos detalhes", async () => {
  renderEditor({ mediaEnabled: true });
  expect(screen.queryByRole("button", { name: /publicar/i })).toBeNull();
  await chooseFile(jpeg("foto.jpg"));
  expect(screen.getByRole("button", { name: "Avançar" })).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Avançar" }));
  expect(screen.getByRole("button", { name: "Enviar e publicar" })).toBeEnabled();
  await userEvent.click(screen.getByRole("button", { name: "Voltar" }));
  expect(screen.queryByRole("button", { name: "Enviar e publicar" })).toBeNull();
});
it("texto sem mídia vai direto aos detalhes", async () => {
  renderEditor({ mediaEnabled: true });
  await userEvent.type(screen.getByRole("textbox"), "Só texto");
  await userEvent.click(screen.getByRole("button", { name: "Avançar" }));
  expect(screen.getByRole("button", { name: "Publicar Post" })).toBeEnabled();
});
it("avisa o workspace enquanto envia e ao terminar", async () => {
  const onProgress = vi.fn();
  renderEditor({ mediaEnabled: true, onProgress });
  await publishWithMedia();
  expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ state: "working" }));
  expect(onProgress).toHaveBeenLastCalledWith(expect.objectContaining({ state: "done" }));
});
```

- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar as etapas** sem mudar `save`, `publish` nem o formato do rascunho. Depois de `Enviar e publicar`, o workspace volta ao Feed imediatamente e o indicador assume.
- [ ] **Step 4: Ajustar os três E2E** para clicar em `Avançar` antes de afirmar ou acionar `Publicar Post`, `Exportar e revisar` e `Enviar e publicar`.
- [ ] **Step 5: Rodar e ver passar** — teste novo, `video-editor.test.tsx`, typecheck, lint.
- [ ] **Step 6: Commit** — `feat(social): step-based creation with background publishing`

### Task 10: E2E de gestos e responsividade, documentos e PR

**Files:**
- Modify: `apps/web/e2e/enturma-social.spec.ts` (teste novo), `DESIGN.md`, `UX-CONTRACT.md`
- Modify: `apps/web/playwright.config.ts` somente se o projeto `chromium-social` precisar de `hasTouch: true` (preferir `browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } })` dentro do teste)

**Interfaces:**
- Consumes: tudo das Tasks 1 a 9.
- Produces: helper local `swipe(page, from: { x: number; y: number }, to: { x: number; y: number })` via `page.context().newCDPSession(page)` e `Input.dispatchTouchEvent` (`touchStart`, oito `touchMove`, `touchEnd`).

- [ ] **Step 1: Escrever o E2E "gestos no celular: Clips, Feed e Criar"** (390×844, com toque):

```ts
const current = () => page.locator(".social-pager").getAttribute("data-view");
await page.goto("/social");
expect(await current()).toBe("feed");
await swipe(page, { x: 80, y: 500 }, { x: 320, y: 500 });
await expect.poll(current).toBe("clips");
await swipe(page, { x: 80, y: 500 }, { x: 320, y: 500 });
expect(await current()).toBe("clips"); // nada à esquerda de Clips
await swipe(page, { x: 320, y: 500 }, { x: 80, y: 500 });
await expect.poll(current).toBe("feed");
await swipe(page, { x: 320, y: 500 }, { x: 80, y: 500 });
await expect.poll(current).toBe("create");
await swipe(page, { x: 80, y: 500 }, { x: 320, y: 500 });
await expect.poll(current).toBe("feed");
await swipe(page, { x: 5, y: 500 }, { x: 320, y: 500 }); // borda do sistema
expect(await current()).toBe("feed");
```

Com uma publicação de duas imagens criada pela API no início do teste: arrastar sobre `.social-carousel` muda o `aria-selected` do segundo ponto e mantém `data-view="feed"`. Em 390, 820 e 1440 px, em Feed, Clips, Criar e Perfil: `document.documentElement.scrollWidth <= innerWidth + 1`.

- [ ] **Step 2: Atualizar `DESIGN.md`** (seção Layout: faixas 767/768/1200, navegação Feed, Criar, Clips, Perfil, Mensagens no cabeçalho, ordem das páginas e gestos) **e `UX-CONTRACT.md`** (linha Navegação: `SocialPager` como dono das páginas e do gesto; linha nova "Gestos" com as exclusões e a alternativa por botão).
- [ ] **Step 3: Rodar tudo que roda localmente** — `npm run test -w @enturma/web`, `npm run typecheck -w @enturma/web`, `npm run lint -w @enturma/web`, `npm run build -w @enturma/web`, `node scripts/check-doc-links.mjs`. Esperado: tudo PASS.
- [ ] **Step 4: Commit, push e PR** — `git push -u origin feat/social-3-part1`; `gh pr create --base feat/social-3 --title "feat(social): telas principais do Social 3"`. Esperar a CI; corrigir até ficar verde. Conferir o preview da Vercel em 390 e 1440 px e registrar na PR o que foi e o que não foi conferido.
- [ ] **Step 5: Parar para revisão do responsável** antes do merge em `feat/social-3`.

---

## Planos seguintes

| Parte | Conteúdo | Observação |
| --- | --- | --- |
| 2 | Explorar, hashtags, busca, sugestões a partir de 1200 px, ranqueamento, reciclagem de Clips | primeiro plano com backend e migration |
| 3 | Filtros, velocidade, figurinhas de Story, sons | muda `VideoRecipe` e o protocolo do worker |
| 4 | Mensagens dentro do Social, cartões, contador de não lidas | reutiliza o chat cifrado |
| 5 | Curtir comentário, reações em Story, dueto, lives | lives atrás de `SOCIAL_LIVE_ENABLED` |
