# Verificação visual

Referência Image Gen: `dashboard-concept.png`. Capturas Playwright: `dashboard-render.png` e `mobile-render.png`. Browser/IAB não estava disponível nesta sessão; usou-se Chromium do Playwright. A referência e as capturas foram inspecionadas com view_image.

Comparação em 1487×1058, equivalente ao tamanho nativo da referência, e 390×844 no mobile:

| Critério | Evidência/ajuste |
|---|---|
| Layout | Sidebar ajustada para 245px, painel de orientação para 363px e coluna principal alinhada à referência |
| Tipografia | Título ajustado de 46 para 56px; hierarquia de seções e corpo preservada |
| Paleta | Branco verdadeiro, verde escuro e lima, sem gradientes ou fotos adicionados |
| Conteúdo | Textos principais, ações e estado vazio conferidos; catálogo e estudantes não simulados |
| Componentes | Banner de onboarding, borda pontilhada do vazio, botões e orientação lateral comparados |
| Responsividade | Overflow detectado pelo E2E e corrigido com minmax(0,1fr) e sidebar sem largura mínima implícita |
| Interação | Fluxo real de cadastro/onboarding/estudo testado com API e banco, sem interceptações/mock no E2E |

Desvios deliberados: ícones Lucide consistentes; Arial como fonte de sistema; telefone sobreposto da composição é referência de responsividade e não um elemento do produto; navegação mobile permanece acessível em faixa horizontal; não há miniatura de avatar sem perfil fornecido. O banner muda após onboarding. Diferenças de rasterização/tipografia impedem uma alegação de igualdade pixel a pixel.

Conferência de texto acima da dobra: preservados título, subtítulo, chamada para completar perfil, seção de salas, texto vazio e CTA. Não foram incluídas métricas ou instituições fictícias. Sem problemas materiais de corte ou overflow na tela inicial verificada.

---

## Nota histórica — 25/10/2026

A identidade inicial e a inspeção visual desta etapa permanecem registradas aqui. Para o design/UX atual, considerar temas claro/escuro/sistema, perfis com mural e capa, componentes compartilhados de chat, GIFs KLIPY, animações do livro/Guia em Remotion, Motion de tema/caronas e instalador Windows. As especificações e imagens históricas deste diretório não descrevem por completo o resultado atual; consultar [Estado atual](../STATUS.md), [Arquitetura](../ARCHITECTURE.md), [Mobile](../MOBILE.md) e [Desktop](../DESKTOP.md). Validar contraste, teclado, safe areas e redução de movimento com dispositivos reais.
