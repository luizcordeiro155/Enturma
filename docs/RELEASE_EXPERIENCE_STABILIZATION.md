# Estabilização da experiência — 30/10/2026

Escopo: autenticação pública, visitante Web, notificações, digitação, qualidade de chamadas e instalação Windows. Parte de `main` em `8d24584`, preservando as correções recentes de teclado móvel. Não é uma certificação de ausência de vulnerabilidades ou bugs em todo o produto.

## Comportamento implementado

- Login/cadastro usam o ícone oficial e a linguagem visual da apresentação. `/visitante` oferece catálogo público real e apresentação dos recursos. Ações de participação abrem um diálogo de cadastro/login; cancelar retorna ao início do visitante. Clientes nativos e sessões existentes seguem para Home.
- A visita não cria uma identidade provisória nem libera endpoints privados. Nenhuma autorização Java foi relaxada; não há consulta anônima a mensagens, participantes, caronas ou cadernos privados.
- Som em primeiro plano independe da permissão de notificações do sistema. Exige preferência ativa e áudio desbloqueado por interação; a primeira leitura de avisos antigos fica silenciosa. Inbox e service worker compartilham deduplicação por identificador.
- Digitação nas salas publica início/fim imediatamente, preservando autenticação, verificação acadêmica, vínculo à sala e bloqueios. Há limite de mensagens no WebSocket e expiração. Chats privados reconsultam eventos recebidos durante uma consulta em andamento; pausa de 1,8 s encerra o indicador.
- O diálogo de transmissão usa controles acessíveis de resolução/FPS e áudio opcional. A escolha afeta captura e codificação do LiveKit. A fonte continua sendo escolhida no seletor autorizado do navegador/sistema. Qualidade depende de hardware e rede.
- A borda externa do rodapé de chat foi retirada sem alterar o cálculo de teclado, safe areas ou rolagem.
- Desktop mostra somente o ícone de atualização na barra superior, com destaque breve e lembrete temporário. Após aumento confirmado da versão instalada, apresenta uma vez o filme Remotion existente e as notas fornecidas pelo próprio binário; clientes anteriores sem notas recebem o link oficial.
- Instalador, atualizador e desinstalador usam o ícone oficial. A remoção opcional de dados locais vem desmarcada; cancelar interrompe a desinstalação. Instalação silenciosa e atualização preservam os dados. A limpeza é restrita à pasta Roaming/Enturma, recusa links/junctions e não procura arquivos exportados nem apaga a conta.

## Provas e limites

Testes de regressão cobrem som independente de permissão, deduplicação, eventos de digitação concorrentes, autorização dos destinatários, presets/áudio, versão instalada e interfaces de atualização. E2E cobre visitante, rotas privadas, clientes nativos e capturas de login/cadastro/visitante em 390 e 1440 px, claro/escuro.

`isolated-load.spec.ts` executa 144 leituras em fases com concorrência 1/4/12 contra catálogo e conta sintética. Exige API em loopback e banco efêmero `enturma_e2e`; registra p50/p95/máximo/códigos em `isolated-load.json`. Não consulta SquareCloud, contas reais, modelos de IA, LiveKit ou fornecedores. O resultado não é uma estimativa de capacidade nem SLA de produção.

Os resultados de execução, imagens e auditorias ficam nos checks da PR e no artefato `interface-evidence`. Verificação local: suíte de unidades, TypeScript e lint; resultados finais da CI e pacote Windows devem ser consultados antes da promoção. Nenhuma migração de banco acompanha este ciclo.

## Implantação e limites operacionais

Publicar API e Web do mesmo commit após os checks; gerar binários com a versão calculada pelo fluxo de release existente. O arquivo local compilado com a versão de desenvolvimento não deve substituir o release público. Rollback de API/Web não exige reversão de esquema; instaladores antigos continuam compatíveis, sem a nova opção de limpeza.

Continuam necessárias homologação física de áudio/câmera/compartilhamento/teclado e instalação/atualização/desinstalação em Windows descartável. Não apagar dados locais do computador de desenvolvimento como teste. Authenticode e limitações de dependências constam em [DEPENDENCY_AUDIT](DEPENDENCY_AUDIT.md) e [PRODUCTION_READINESS](PRODUCTION_READINESS.md). A auditoria de dependências/segredos da CI não certifica conformidade jurídica LGPD.

A ausência de backup externo foi explicitamente dispensada pelo responsável. Não se declara restauração de produção testada; o ensaio sintético da CI tem escopo diferente. Consulte [operação](OPERATIONS_READINESS.md).
