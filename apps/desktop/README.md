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

A versão Windows x64 também é gerada automaticamente em um ambiente Railway e disponibilizada em:

https://enturma-desktop-download-v5-production.up.railway.app/Enturma-Windows.zip

Para usar:

1. baixe o ZIP;
2. extraia todo o conteúdo para uma pasta;
3. abra `Enturma.exe`.

Esse pacote usa a mesma aplicação Web oficial e mantém conta e dados sincronizados. O instalador NSIS continua previsto para builds feitos diretamente em Windows.


## Atualizações automáticas

Desde a versão 0.2.0, o app consulta o manifesto oficial da Railway, baixa atualizações do Desktop, valida SHA-256 e permite aplicar a nova versão com **Atualizar e reiniciar**.

Alterações somente na aplicação Web continuam aparecendo sem reinstalar o Desktop.
