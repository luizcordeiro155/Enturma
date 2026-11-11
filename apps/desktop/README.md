# Enturma Desktop

Aplicativo Desktop do Enturma baseado em Electron. Ele carrega a aplicação Web oficial dentro de uma janela nativa segura, mantendo conta, salas e dados sincronizados com a versão Web.

## Desenvolvimento

No Windows PowerShell:

```powershell
cd apps/desktop
copy .env.example .env
npm run dev
```

Para usar a Web local, altere `ENTURMA_WEB_URL` para `http://localhost:3000`.

## Gerar Windows

```powershell
npm run dist:win
```

Os arquivos ficam em `apps/desktop/dist` e incluem instalador NSIS.

## Distribuição

O instalador pode ser anexado manualmente a uma GitHub Release ou disponibilizado pela página de downloads do Enturma. O projeto não depende de GitHub Actions para gerar o aplicativo.

Para uma distribuição pública sem alertas do Windows SmartScreen, recomenda-se assinar o instalador com certificado de assinatura de código.


## Download público atual

**Release confirmada:** Windows **0.4.424** (`9270a5f`), deployment `ce120d56-57f0-4692-b9f2-7e6382606eef` em `SUCCESS`. A versão de workspace `0.3.15` continua declarada em `apps/desktop/package.json` e não deve ser confundida com a versão distribuída.

A versão Windows x64 também é gerada automaticamente em um ambiente Railway e disponibilizada em:

- EXE: https://enturma-desktop-download-v5-production.up.railway.app/Enturma-Windows.exe
- ZIP: https://enturma-desktop-download-v5-production.up.railway.app/Enturma-Windows.zip
- Manifesto: https://enturma-desktop-download-v5-production.up.railway.app/latest.json

Para usar:

Para instalar, baixe o **EXE** e execute o instalador NSIS. Para usar o ZIP portátil, baixe-o, extraia completamente e abra `Enturma.exe`.

Esse pacote usa a mesma aplicação Web oficial e mantém conta e dados sincronizados. O instalador NSIS também é construído pelo serviço Railway, além dos builds locais Windows. O distribuidor fornece EXE, ZIP e manifesto `/latest.json`; SHA-256 não substitui assinatura Authenticode.


## Atualizações automáticas

Desde a versão 0.2.0, o app consulta o manifesto oficial da Railway, baixa atualizações do Desktop, valida SHA-256 e permite aplicar a nova versão com **Atualizar e reiniciar**.

Alterações somente na aplicação Web continuam aparecendo sem reinstalar o Desktop.
