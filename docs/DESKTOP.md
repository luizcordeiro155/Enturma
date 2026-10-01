# Enturma Desktop

O Enturma Desktop utiliza Electron para oferecer uma versão instalável do sistema sem duplicar o frontend.

A janela do aplicativo abre a versão Web oficial do Enturma. Dessa forma, conta, banco de dados, salas, mensagens, fórum, cadernos, IA, amigos e caronas continuam usando os mesmos serviços do site.

## Por que esse modelo

O Web atual depende do Next.js/BFF para autenticação e cookies HttpOnly. Empacotar uma cópia estática do frontend quebraria parte desses fluxos.

Por isso o Desktop funciona como cliente nativo da aplicação oficial:

```text
Enturma Desktop
       |
       v
Vercel / Next.js / BFF
       |
       v
API Java / SquareCloud
       |
       v
PostgreSQL / Railway
```

## Recursos nativos

- janela própria do Windows;
- sessão persistente separada do navegador;
- câmera e microfone;
- seletor de tela/janela para compartilhamento;
- captura de áudio do sistema no Windows quando solicitada;
- notificações do navegador permitidas para o domínio oficial;
- links externos abertos no navegador padrão;
- protocolo `enturma://`;
- tela local para falha de conexão;
- verificação de novas GitHub Releases;
- bloqueio de navegação não autorizada dentro da janela do app.

O renderer usa `contextIsolation`, `sandbox` e mantém `nodeIntegration` desativado.

## Desenvolvimento

```powershell
npm run dev:desktop
```

Por padrão o aplicativo usa:

```text
https://enturma-flax.vercel.app
```

Para desenvolvimento local, crie `apps/desktop/.env`:

```dotenv
ENTURMA_WEB_URL=http://localhost:3000
```

## Gerar Windows

Execute em um computador Windows com Node.js 22.14+:

```powershell
.\scripts\build-desktop-windows.ps1
```

Também é possível executar diretamente:

```powershell
npm run dist:desktop:win
```

Os arquivos ficam em:

```text
apps/desktop/dist/
```

A configuração gera:

- instalador NSIS;
- arquitetura x64.

## Publicar para download

O projeto não depende de GitHub Actions.

Depois de gerar os arquivos, com o GitHub CLI autenticado:

```powershell
.\scripts\publish-desktop-windows.ps1
```

O script publica os executáveis em uma GitHub Release. A página `/download` consulta a release mais recente e passa a mostrar o instalador automaticamente.

## Versão

A versão do Desktop fica em:

```text
apps/desktop/package.json
```

Antes de publicar uma atualização, altere `version` para uma nova versão.

## Assinatura digital

O aplicativo funciona sem certificado, mas o Windows pode exibir SmartScreen para um executável novo e não assinado.

Antes de uma distribuição pública maior, recomenda-se adquirir um certificado de Code Signing e configurar a assinatura do instalador.

## macOS e Linux

A configuração já possui alvos para DMG e AppImage. Eles devem ser gerados e testados no sistema correspondente antes de serem oferecidos como downloads oficiais.


## Download público atual

A versão Windows x64 também é gerada automaticamente em um ambiente Railway e disponibilizada em:

https://enturma-desktop-download-v5-production.up.railway.app/Enturma-Windows.zip

Para usar:

1. baixe o ZIP;
2. extraia todo o conteúdo para uma pasta;
3. abra `Enturma.exe`.

Esse pacote usa a mesma aplicação Web oficial e mantém conta e dados sincronizados. O instalador NSIS continua previsto para builds feitos diretamente em Windows.
