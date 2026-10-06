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
- refinamento da experiência de Enturma Caronas.

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

A aplicação nativa fica em `apps/mobile`.

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

## Pull requests

Um bom PR deve responder claramente:

- Qual problema está sendo resolvido?
- O que mudou?
- Há impacto em banco, API, Web, Android ou Desktop?
- Como a alteração foi validada?
- Existem limitações conhecidas?
- Há screenshots quando a mudança é visual?

Contribuições menores, focadas e verificáveis são mais fáceis de revisar e manter.

---

Ao contribuir, mantenha a pergunta principal em mente: **isso torna o Enturma mais confiável e melhor para o estudante?**
