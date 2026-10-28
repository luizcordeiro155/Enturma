# Contribuindo com o Enturma

Obrigado pelo interesse em contribuir com o **Enturma**.

O projeto está em desenvolvimento ativo e reúne Web, Android, Desktop e uma API Java compartilhada. Contribuições devem preservar a proposta do produto: criar uma experiência acadêmica integrada, confiável, acessível e consistente entre plataformas.

> Este repositório é público, mas não possui licença open source. Enviar uma contribuição não altera os termos de [LICENSE](LICENSE).

## Prioridades atuais

Neste momento, prefira contribuições que melhorem o que já existe:

- estabilidade e correção de bugs;
- paridade entre Web, Android e Desktop;
- performance e tempo real;
- acessibilidade e responsividade;
- consistência visual;
- testes e segurança;
- qualidade dos fluxos acadêmicos;
- refinamento da experiência de Enturma Caronas;
- chats, emojis, GIFs, anexos e biblioteca pessoal;
- Motion Design, intro, guias, instaladores e atualizações;
- notificações e proteção de integrações externas.

Evite adicionar novos módulos grandes sem alinhamento prévio. A prioridade atual é **polimento e confiabilidade do produto existente**.

## Fluxo de contribuição

1. Parta da versão atual de `main`.
2. Use uma branch descritiva, como `feat/<assunto>`, `fix/<assunto>` ou `docs/<assunto>`.
3. Mantenha a alteração focada em um problema ou objetivo claro.
4. Inclua ou atualize testes quando houver mudança de comportamento.
5. Execute localmente as validações relacionadas à mudança.
6. Abra o pull request explicando problema, solução, impacto e como foi validado.

Commits seguem preferencialmente o padrão convencional:

- `feat:` nova capacidade;
- `fix:` correção;
- `refactor:` reorganização sem mudança intencional de comportamento;
- `test:` testes;
- `docs:` documentação;
- `chore:` manutenção;
- `security:` correção relacionada à segurança.

## Qualidade esperada

Uma mudança não está pronta apenas porque compila.

Considere como parte da definição de pronto:

- estados de loading, vazio, sucesso e erro;
- comportamento em telas pequenas e grandes;
- navegação por teclado quando aplicável;
- redução de movimento e preferências de acessibilidade;
- reconexão e recuperação em recursos realtime;
- ausência de reloads desnecessários;
- mensagens claras para o usuário;
- nenhum dado fictício apresentado como dado acadêmico oficial;
- nenhum segredo ou dado pessoal enviado ao repositório.

## Backend e banco

Mudanças no backend ficam em `services/api`.

Regras importantes:

- use queries parametrizadas;
- preserve autorização no servidor;
- não confie apenas em validação de frontend;
- alterações de schema exigem uma nova migration Flyway;
- migrations já aplicadas em ambientes compartilhados não devem ser reescritas;
- concorrência, idempotência e transações devem ser consideradas nos fluxos sensíveis.

## Web

A aplicação Web fica em `apps/web`.

Ao alterar UI:

- preserve a identidade visual do Enturma;
- teste mobile e desktop;
- evite componentes falsos ou botões sem função;
- mantenha o comportamento real conectado ao backend;
- respeite as preferências de acessibilidade;
- evite reintroduzir recarregamentos de página em fluxos que já funcionam por estado/realtime.

## Android

O workspace Expo fica em `apps/mobile`. O APK distribuído usa a Activity WebView gerada por `deploy/android-download/install-web-shell.cjs`; exportar o workspace Expo não homologa esse APK. As duas rotas de execução exigem configuração e testes próprios, conforme [Mobile](docs/MOBILE.md).

Mudanças devem considerar:

- teclado e safe areas;
- reconexão ao voltar do background;
- permissões nativas;
- comportamento em aparelho real;
- paridade de dados com Web/Desktop;
- limitações de rede local em desenvolvimento.

## Desktop

O Desktop fica em `apps/desktop` e utiliza Electron.

Tenha atenção especial a:

- segurança da bridge/preload;
- origem confiável da Web carregada;
- notificações do sistema;
- atualização do aplicativo;
- comportamento no Windows;
- permissões de câmera, microfone, tela e localização.

## Dados acadêmicos

O Enturma não deve inventar instituições, matrizes, disciplinas, endereços de campus ou outras informações como se fossem oficiais.

Quando uma contribuição depender de dados acadêmicos:

- use uma fonte oficial verificável;
- preserve a origem da informação;
- trate dado desconhecido como desconhecido;
- não complete lacunas por suposição.

## Fluxos recentes: chats, mídias e integrações

Ao mexer no compositor, preserve rascunho, posição de rolagem, foco do teclado, anexos e seleção de emojis/figurinhas. Teste salas, mensagens privadas, layouts estreitos e desktop. **Não re-hospede conteúdo de KLIPY ou de outro provedor** sem direitos e aprovação adequados. Resultados externos precisam de atribuição e devem permanecer separados da biblioteca pessoal. Confirme o comportamento criptográfico existente: o texto privado é cifrado; conteúdo de sala e mídia de chamadas têm garantias diferentes.

## Animações, vídeos e experiência de aplicativos

- Use o motor e os componentes já presentes, evitando duplicar Remotion Player, arquivos de áudio ou loops concorrentes.
- A intro, o Guia, as animações de abertura, perfis e caronas devem pausar/cancelar quando necessário e respeitar `prefers-reduced-motion`.
- Componentes de motion não devem causar piscadas de páginas, foco perdido, rolagem involuntária ou travamento do teclado.
- Alterações do Windows devem considerar Electron, preload, sandbox, IPC, NSIS, atualização/rollback e arquivos de animação locais.
- Alterações do Android exigem revisão de WebView, safe area, IME, links, lifecycle, permissões e instalador APK.
- Não renderize porcentagens inventadas para downloads/atualizações; utilize progresso real do sistema.

## Segurança e proteção de dados

- Revise sessões, permissões, endpoints administrativos, rate limits, uploads e URLs externas com risco de SSRF.
- Uma política RLS não substitui autorização server-side; confirme qual papel PostgreSQL faz cada operação.
- Não inclua tokens de backend em um `NEXT_PUBLIC_` ou bundle do navegador. Distingua chaves de cliente de segredos privados.
- Considere vazamento por notificações, logs, prévias, portfólios e localização de caronas.
- Testes de vulnerabilidade devem ocorrer em ambiente autorizado; não faça varreduras agressivas em produção.
- Atualizações de documentos de privacidade e licenciamento precisam preservar os direitos já existentes e ser revisadas pelos mantenedores.

## Publicação e documentação

O fluxo de publicação deve preservar compatibilidade com migrações Flyway, validar **Maven, lint, TypeScript, testes Web, E2E e builds das plataformas afetadas**, e confirmar o SHA implantado. Frontend na Vercel, API e serviços de distribuição possuem ciclos distintos; não declarar produção concluída só porque a PR foi integrada. Para fluxos que dependem de aparelhos reais, registrar explicitamente o que foi e o que não foi homologado.

Documentos do diretório `docs/` podem conter registros históricos de versões específicas. Ao corrigir documentação de referência, não transforme notas de releases antigos em afirmações atuais. Atualize os links do README e preserve as orientações de [Segurança](SECURITY.md) e [Licença](LICENSE).

## Privacidade e segurança

Nunca faça commit de:

- `.env`;
- tokens;
- senhas;
- chaves privadas;
- dumps de produção;
- dados pessoais de usuários;
- credenciais de banco;
- arquivos de sessão.

Vulnerabilidades devem seguir o processo em [SECURITY.md](SECURITY.md), e não uma issue pública com detalhes exploráveis.

## Validação local

Execute o conjunto relacionado à sua alteração. Para uma revisão ampla:

```text
mvn -f services/api/pom.xml verify
npm run lint
npm run typecheck
npm test
npm run build
```

Testes E2E devem usar ambiente e banco exclusivos para testes. Nunca execute suites destrutivas contra produção.

Comandos adicionais usados pela CI, a partir da raiz:

```text
npm ci
node scripts/check-doc-links.mjs
npm run test:e2e -w @enturma/web
npm run test:updaters
node scripts/audit-java-dependencies.mjs
```

A auditoria Java requer Maven no PATH; em Windows pode receber o inventário Maven por `AUDIT_DEPENDENCIES_FILE`. Os E2E exigem API, Web, SMTP de teste e `E2E_DATABASE_URL`; use o provisionamento de `.github/workflows/ci.yml` como referência. O ensaio de restore é restrito ao PostgreSQL sintético de CI. Não reutilize credenciais de produção.

Em `apps/mobile`, `npx expo export --platform android` e `npx expo export --platform ios` validam bundles. Na raiz, `npm run dist:desktop:win` gera o instalador sem publicar; instalação, upgrade, rollback e assinatura precisam de homologação separada. Não há script que certifique capacidade de produção: a medição BFF da suíte é sequencial, com um usuário sintético. Consulte [readiness](docs/PRODUCTION_READINESS.md) e [operação](docs/OPERATIONS_READINESS.md) antes de promover uma release.

## Pull requests

Um bom PR deve responder claramente:

- Foi alterado o esquema do banco, a API ou a criptografia?
- O fluxo foi testado nos temas claro/escuro, desktop e teclado mobile, quando aplicável?
- Há impacto em GIFs externos, voz, câmera, notificações, mapas ou atualização nativa?
- A documentação informa corretamente se o deploy e os testes reais foram concluídos?

- Qual problema está sendo resolvido?
- O que mudou?
- Há impacto em banco, API, Web, Android ou Desktop?
- Como a alteração foi validada?
- Existem limitações conhecidas?
- Há screenshots quando a mudança é visual?

Contribuições menores, focadas e verificáveis são mais fáceis de revisar e manter.

---

Ao contribuir, mantenha a pergunta principal em mente: **isso torna o Enturma mais confiável e melhor para o estudante?**
