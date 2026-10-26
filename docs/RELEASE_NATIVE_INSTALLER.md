# Instalador nativo e mídia nas conversas

## Alterações

- O instalador Windows, a remoção pelo Windows e a atualização usam filmes locais diferentes produzidos com Remotion. Não dependem do site nem de conexão para exibir a animação.
- O NSIS do electron-builder continua responsável por instalação, atalhos, registro, atualização e remoção. O pequeno programa WinForms só mostra o andamento e observa o código de saída do instalador. Não executa operações sobre os dados do usuário. Falha na abertura da janela animada mantém a interface padrão do NSIS.
- A janela Electron de download/atualização carrega arquivos locais, mostra o progresso recebido do download e só reinicia mediante ação do usuário. Possui contexto isolado, sandbox, CSP restritiva e IPC limitado à janela e ao arquivo exatos.
- Figurinhas e GIFs da biblioteca são enviados ao selecionar, sem consumir o texto ou a imagem que já estão no rascunho. A apresentação é preservada no histórico; o caminho privado mantém a criptografia existente.
- Nas chamadas, o usuário pode trocar entre as câmeras que o navegador/WebView disponibiliza após conceder permissão.

## Build e instalação

`npm run dist:win -w @enturma/desktop` compila o auxiliar com o compilador .NET Framework do Windows e empacota o NSIS. O build Linux da Railway usa Mono para compilar o mesmo código. Os GIFs renderizados ficam em `apps/desktop/assets/motion`; suas fontes são `apps/web/remotion/native-setup.tsx`.

Para regenerar os filmes, use Remotion CLI 4.0.530 com `apps/web/remotion/index.tsx`, composições `Native-install`, `Native-update` e `Native-uninstall`, codec `gif`. Os filmes não contêm percentuais fictícios. A instalação apresenta andamento indeterminado; o percentual do download vem dos bytes recebidos.

O desinstalador animado passa a existir depois da instalação desta versão. O desinstalador de versões anteriores continua com a interface que foi instalada naquela versão. A atualização com ZIP portátil mantém seu mecanismo de recuperação anterior; a janela animada de instalação usa o EXE NSIS, fornecido pelo manifesto atual.

## Migração e implantação

A V63 acrescenta `media_kind` opcional às mensagens de salas e privadas, com valores limitados a `STICKER` e `GIF` e exigência de anexo. Mensagens anteriores permanecem com o comportamento anterior. Não modifica usuários, senhas, sessões ou chaves privadas.

Faça backup PostgreSQL antes da implantação. Publique a API com V63 e o Web; verifique saúde da API, envio/leitura e as versões nos manifestos públicos da Railway. O pipeline existente incrementa os apps com base no commit. Em rollback, reverta o código e preserve as colunas aditivas; não remova dados de mensagens novas.

## Dependências e limites explícitos

- **Situação na data original deste release (superada pelas PRs #103 e #104): KLIPY ainda não ativada:** o proprietário informou que não tem chave. As [regras de integração](https://docs.klipy.com/integration-requirements) exigem chamadas e mídia diretamente do cliente, resultados separados e aprovação prévia para proxy/cache/re-hospedagem. A proposta inicial de chave secreta no backend precisa dessa aprovação; não foi criado um proxy incompatível nem cadastrada uma conta em nome do usuário. A coleção Enturma e favoritos pessoais seguem disponíveis.
- **Celular como câmera via QR:** não incluído nesta versão; precisa de pareamento com expiração, autorização no PC, publicação de câmera limitada e revogação no serviço de chamadas.
- **Compartilhar a tela inteira pelo APK:** continua limitado à capacidade do WebView. A captura nativa com MediaProjection não foi implementada. O Desktop mantém o seletor nativo de tela/janela e o Web usa a API suportada pelo navegador.
- Não houve teste com câmera física Android nem instalação/remoção real na conta Windows do usuário. O pacote foi compilado e a janela local validada em processo de teste sem alterar a instalação existente.
- Não há certificado Authenticode configurado. Compilar e verificar SHA-256 não substitui assinatura reconhecida pelo Windows.
- Permanecem os limites operacionais registrados em `RELEASE_CHAT_SECURITY.md`, incluindo o papel privilegiado do banco, dependências Expo e procedimentos organizacionais da LGPD. Esta entrega não representa certificação jurídica de conformidade.

---

## Correção de contexto: KLIPY habilitada em release posterior

A observação histórica acima "KLIPY ainda não ativada" se refere ao release da instalação nativa original. As PRs **#103** e **#104** adicionaram o seletor KLIPY com pesquisa/trending no navegador, lupa, **40 resultados por página**, paginação e mídia direta do provedor. O catálogo KLIPY aparece separado da biblioteca pessoal/favoritos. O backend não deve re-hospedar essa mídia; a app key pode ser acessível ao cliente autenticado, conforme o contrato do provedor. A disponibilidade externa precisa ser testada com a chave e o domínio reais.
