# Enturma Desktop 0.3.0

Electron 44 abre a aplicação oficial Next.js/BFF, compartilhando API, conta e dados com o Web. O renderer mantém contextIsolation e sandbox, sem Node. IPC valida o frame/origem; links externos passam pelo fluxo de confirmação do Enturma. O protocolo é `enturma://`.

## Build e distribuição

No Windows, execute `scripts/build-desktop-windows.ps1 -SkipInstall` após `npm ci`. O electron-builder gera `apps/desktop/dist/Enturma-Setup-0.3.0.exe` (NSIS por usuário, atalhos, desinstalador e protocolo) e `Enturma-0.3.0-win-x64.zip` (atualizações). Não há assinatura Code Signing configurada; o instalador pode receber aviso do Windows.

A página Web `/download` oferece o executável, não o ZIP. Dentro do Desktop, a bridge/UA ocultam Download e a rota redireciona para Início. Android aparece disponível apenas quando existe uma URL HTTPS de APK configurada; iOS permanece em preparação.

`deploy/desktop-download/Dockerfile` compila os artefatos para o serviço Railway existente. `server.cjs` fornece `/latest.json`, `/Enturma-Setup.exe`, o nome versionado e `/Enturma-Windows.zip`. A URL do ZIP e os campos version/downloadUrl/size/sha256 continuam compatíveis com 0.2.0. O manifesto só anuncia um par instalador/ZIP da mesma versão. Não usa GitHub Actions nem GitHub Releases como origem do atualizador.

## Atualização integrada

### Compilação Linux do instalador

Na Railway, `build-windows.cjs` usa o `UninstallerReader` do próprio electron-builder 26.15.3 para extrair e validar o desinstalador PE/NSIS, como no caminho de compilação macOS da ferramenta. O kernel do builder não executa o bootstrap de 32 bits via Wine. O adaptador aceita somente o bootstrap esperado, rejeita outras operações e mantém o script NSIS padrão e suas verificações. Antes de atualizar electron-builder, revisar essa integração interna; uma versão diferente falha explicitamente. O build Windows local convencional continua disponível.

O serviço Railway precisa da GitHub App autorizada no repositório para redeploy automático por push; configurar apenas `source.branch=main` não instala essa autorização. Enquanto essa integração estiver ausente, publicar explicitamente o SHA aprovado no serviço existente.

O main publica checking, available, downloading (progress), ready, installing e error por uma bridge restrita. O React mostra o progresso, permite adiar e solicita o reinício; uma chamada ativa recebe aviso antes da instalação. O renderer não recebe acesso a arquivos ou comandos. Acessibilidade e reduced motion continuam ativos.

Downloads exigem HTTPS na origem permitida, tamanho limitado e SHA-256. O ZIP é validado novamente antes de extrair; entradas fora do diretório, expansões excessivas e pontos de reanálise são recusados. O instalador usa backup/rollback e preserva arquivos alheios ao pacote. Logs ficam em userData/updates. PowerShell é iniciado por caminho absoluto e Start-Process oculto; não se usa DETACHED_PROCESS, que no teste Windows encerrava o PowerShell 5.1 sem executar o arquivo.

## Homologação e compatibilidade legada

Testes Node cobrem manifesto, origem, nomes de arquivo, IPC e servidor HTTP. A verificação Electron usa aplicativo empacotado, servidor HTTPS local e download/hash/instalação reais em diretório isolado; não é apenas um mock visual.

**Recuperação 0.2.0:** o iniciador já distribuído com `detached: true` pode fechar sem aplicar o ZIP no Windows. O site identifica a bridge antiga e oferece “Baixar atualização oficial”, usando exclusivamente o instalador HTTPS do serviço Enturma. O usuário fecha a versão antiga, executa o EXE e abre o novo atalho; não deve excluir a conta nem desinstalar/limpar dados. A mesma identidade Electron e a partição persistente são preservadas. Essa recuperação inicial é assistida, não uma migração silenciosa; as próximas versões usam o iniciador corrigido. O formato do manifesto e a URL do ZIP continuam disponíveis para clientes legados em que o iniciador funciona.

Atualizações somente do Web não exigem trocar o binário. macOS/Linux ainda precisam de build e homologação próprios antes de oferecer download público.

Validação final do novo iniciador em 02/10/2026: um manifesto e um download HTTPS, SHA-256 `84465771468944056b17c3e960565eb8b8f69d391fbadd5cb9c83e46fa16bbf3`, ZIP 152868743 bytes. A cópia isolada passou de 0.2.9 (bridge nova) para 0.3.0 e preservou arquivo alheio ao pacote. Essa prova cobre a bridge nova, não o iniciador antigo 0.2.0.
