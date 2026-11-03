# Importação acadêmica — estado atual

O Enturma **já inclui snapshots revisados** de fontes oficiais UNA, PUC Minas e UFMG, carregados por jobs persistidos em `services/api/src/main/resources/catalog`. Isso **não** significa que todas as ofertas ou grades dessas instituições tenham sido verificadas. Fixtures sintéticas continuam restritas aos testes.

## API e revisão administrativa

As rotas abaixo usam o prefixo `/api/v1` e exigem `ADMIN` ou `SUPER_ADMIN`:

- `POST /admin/catalog/imports`: documento JSON `{provider,entries}`, com retorno `202` e ID de job.
- `POST /admin/catalog/imports/csv?provider=UNA`: importação CSV `text/csv`, até 3,5 MB (RFC 4180).
- `GET /admin/catalog/imports/{id}?page=0`: status e itens paginados, incluindo falhas.
- `POST /admin/catalog/imports/{id}/pause|resume|cancel|retry`: controle do processamento.
- Rotas de `review` exigem conferir procedência, versão, hash SHA-256, datas e hierarquia antes de marcar `VERIFIED`.

Não publicar conteúdo com status `PENDING_VERIFICATION`, `OUTDATED`, `ARCHIVED` ou `REJECTED` como matriz oficial. A API também inspeciona PDFs e URLs de fontes autorizadas, **sem** publicar automaticamente candidatos extraídos. Não executar imports de teste contra produção.

Consulte [API](../../docs/API.md), [Importações](../../docs/ACADEMIC_IMPORTS.md), [Providers](../../docs/ACADEMIC_PROVIDERS.md) e [Cobertura](../../docs/ACADEMIC_CATALOG.md).

> Esta revisão corrige a referência antiga a `/admin/academics/import` e a afirmação ultrapassada de que CSV não havia sido implementado.
