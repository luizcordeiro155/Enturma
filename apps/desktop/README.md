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
