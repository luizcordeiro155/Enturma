# Estabilização da experiência — 30/10/2026

Escopo: autenticação pública, visitante Web, notificações, digitação, qualidade de chamadas e instalação Windows. Parte de `main` em `8d24584`, preservando as correções recentes de teclado móvel. Não é uma certificação de ausência de vulnerabilidades ou bugs em todo o produto.

## Comportamento implementado

- Login/cadastro usam o ícone oficial e a linguagem visual da apresentação. `/visitante` oferece catálogo público real e apresentação dos recursos. Ações de participação abrem um diálogo de cadastro/login; cancelar retorna ao início do visitante. Clientes nativos e sessões existentes seguem para Home.
- A visita não cria uma identidade provisória nem libera endpoints privados. Nenhuma autorização Java foi relaxada; não há consulta anônima a mensagens, participantes, caronas ou cadernos privados.
- Som em primeiro plano independe da permissão de notificações do sistema. Exige preferência ativa e áudio desbloqueado por interação; a primeira leitura de avisos antigos fica silenciosa. Inbox e service worker compartilham deduplicação por identificador.
- Digitação nas salas publica início/fim imediatamente, preservando autenticação, verificação acadêmica, vínculo à sala e bloqueios. Há limite de mensagens no WebSocket e expiração. Chats privados reconsultam eventos recebidos durante uma consulta em andamento; pausa de 1,8 s encerra o indicador.
- O diálogo de transmissão usa controles acessíveis de resolução/FPS e áudio opcional. A escolha afeta captura e codificação do LiveKit. A fonte continua sendo escolhida no seletor autorizado do navegador/sistema. Qualidade depende de hardware e rede.
- A borda externa do rodapé de chat foi retirada sem alterar o cálculo de teclado, safe areas ou rolagem. O atalho para novas mensagens preserva o foco do campo quando o usuário já está digitando, evitando dispensar o teclado ao saltar para o final.
- Desktop mostra somente o ícone de atualização na barra superior, com destaque breve e lembrete temporário. Após aumento confirmado da versão instalada, apresenta uma vez o filme Remotion existente e as notas fornecidas pelo próprio binário; clientes anteriores sem notas recebem o link oficial.
- Instalador, atualizador e desinstalador usam o ícone oficial. A remoção opcional de dados locais vem desmarcada; cancelar interrompe a desinstalação. Instalação silenciosa e atualização preservam os dados. A limpeza é restrita à pasta Roaming/@enturma/desktop, recusa links/junctions e não procura arquivos exportados nem apaga a conta.

## Provas e limites

Testes de regressão cobrem som independente de permissão, deduplicação, eventos de digitação concorrentes, autorização dos destinatários, presets/áudio, versão instalada e interfaces de atualização. E2E cobre visitante, rotas privadas, clientes nativos e capturas de login/cadastro/visitante em 390 e 1440 px, claro/escuro.

`isolated-load.spec.ts` executa 144 leituras em fases com concorrência 1/4/12 contra catálogo e conta sintética. Exige API em loopback e banco efêmero `enturma_e2e`; registra p50/p95/máximo/códigos em `isolated-load.json`. Não consulta SquareCloud, contas reais, modelos de IA, LiveKit ou fornecedores. O resultado não é uma estimativa de capacidade nem SLA de produção.

Código validado: `38fc662f165c56e1e56fbbaacd78d3b287ebf876`. A [CI 41003618017](https://github.com/luizcordeiro155/Enturma/actions/runs/41003618017) concluiu com sucesso em 30/10/2026. Os commits documentais posteriores não alteram esse código. Nenhuma migração de banco acompanha este ciclo.

| Verificação | Resultado desta execução |
| --- | --- |
| Maven | 124 testes, zero falhas/erros/skips |
| Unidades | 113 Web, 4 Mobile, 14 Desktop e 9 updater; passaram |
| Navegação E2E | 43 passaram, incluindo teclado/chat, visitante, sessão, permissões e claro/escuro |
| TypeScript / lint | passaram; zero erros, 35 avisos Web e 3 Mobile preexistentes |
| Builds | Web, exports Android/iOS e pacote API passaram; exports não homologam dispositivos |
| Windows | compilação e teste de limpeza descartável passaram no job Windows; NSIS/ZIP compilados localmente |
| Recuperação sintética | contagens, Flyway e papel restrito passaram em 2 s; não é restauração de produção |
| Segredos | [Gitleaks no histórico](https://github.com/luizcordeiro155/Enturma/actions/runs/41003618008) passou |
| Dependências | 155 Java inventariadas, 2 alertas residuais; npm: 11 entradas (6 altas, 5 baixas), conforme [triagem](DEPENDENCY_AUDIT.md) |

Carga no runner isolado: **144/144 respostas HTTP 200**, sem repetição automática. Concorrência 1/4/12 com 48 leituras por fase: p50 **5/11/27 ms**, p95 **36/26/46 ms**, máximo **41/63/86 ms**. São leituras de catálogo e perfil próprio em loopback; não medem entrega de chat, mídia, rede de usuários ou capacidade de produção.

O artefato `interface-evidence` dessa execução guarda as imagens claro/escuro em 390 e 1440 px, `isolated-load.json` e os relatórios de dependências/recuperação. A prévia Vercel desse SHA ficou READY; revisão visual de login, cadastro e visitante não apresentou overflow horizontal nem erros JavaScript nas páginas percorridas. A verificação não equivale a uma auditoria visual manual de todas as combinações de dados do aplicativo.

Windows: NSIS/ZIP compilados localmente; `SetupUX.Tests.cs` passou com uma raiz descartável dentro de `.local`, verificando remoção da pasta correta, preservação de pasta vizinha e repetição idempotente. O job `windows-uninstall-safety` repete a prova no GitHub. Nenhuma instalação real nem dados da conta foram removidos no computador do responsável.

## Implantação e limites operacionais

Publicar API e Web do mesmo commit após os checks; gerar binários com a versão calculada pelo fluxo de release existente. O arquivo local compilado com a versão de desenvolvimento não deve substituir o release público. Rollback de API/Web não exige reversão de esquema; instaladores antigos continuam compatíveis, sem a nova opção de limpeza.

Continuam necessárias homologação física de áudio/câmera/compartilhamento/teclado e instalação/atualização/desinstalação em Windows descartável. Não apagar dados locais do computador de desenvolvimento como teste. Authenticode e limitações de dependências constam em [DEPENDENCY_AUDIT](DEPENDENCY_AUDIT.md) e [PRODUCTION_READINESS](PRODUCTION_READINESS.md). A auditoria de dependências/segredos da CI não certifica conformidade jurídica LGPD.

A ausência de backup externo foi explicitamente dispensada pelo responsável. Não se declara restauração de produção testada; o ensaio sintético da CI tem escopo diferente. Consulte [operação](OPERATIONS_READINESS.md).

## Revisão solicitada em 30/10/2026 — mobile e consistência

- Cartões do Início respeitam a largura disponível; navegação mobile prioriza Amigos. Mais organiza Desafios, Programação, Caronas, Portfólio, Perfil, download Web e Configurações por último.
- Chamadas e chat acompanhante usam a paleta semântica; seletores de transmissão têm checkboxes de largura fixa e rótulos responsivos.
- Cadastro/redefinição aceitam 6–30 caracteres; login continua aceitando as senhas antigas. BCrypt e limites de tentativas permanecem.
- Notificações Desktop usam o som e a preferência do Web, inclusive em segundo plano; toast nativo silencioso evita som duplo.
- Picker preserva teclado aberto e respeita dispensa manual; GIFs/figurinhas sem moldura, com controles de favoritos acessíveis. Chrome compacto libera espaço para os emojis.
- Câmera alterna frontal/traseira usando a direção real da captura, sem percorrer lentes traseiras intermediárias.
- Navegação privada renova sessão pelo mutex existente antes de solicitar a rota, sem cachear redirecionamentos de sessão expirada. Limite absoluto de sessão continua 30 dias, sem renovação indefinida.
- Visitante reutiliza Dashboard, Shell, navegação e CatalogSearch; nenhum perfil fictício, conversa ou sala privada é exposto. Login/cadastro reutilizam a animação Remotion do guia, sem corte da ilustração.

Provas locais desta revisão: TypeScript e lint (35 avisos preexistentes, zero erros); 18 testes focados Web; teste Java dos limites de senha. CI completa e publicação serão registradas após sua execução.

O responsável dispensou homologação física, assinatura Windows e validações operacionais como condição de publicação. A ausência dessas provas permanece documentada; a dispensa não significa execução nem certificação de segurança absoluta.
