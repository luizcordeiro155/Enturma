# Importações acadêmicas

Requer ADMIN ou SUPER_ADMIN. `POST /api/v1/admin/catalog/imports` recebe JSON; retorna HTTP 202 com `{id}`. Limite: 10.000 itens e 4 MB pelo BFF web. CSV: `POST /admin/catalog/imports/csv?provider=UNA`, `Content-Type: text/csv`, até 3,5 MB. Campos com vírgulas, aspas e quebras de linha seguem RFC 4180.

Documento JSON tem `provider` (A–Z, 0–9 e sublinhado) e `entries`. Cada entrada:

| Campo | Regra |
|---|---|
| externalId | Identidade estável da fonte, até 240 caracteres |
| kind | INSTITUTION, CAMPUS, COURSE, CURRICULUM, PERIOD, SUBJECT, TOPIC |
| parentExternalId | Obrigatório exceto para instituição |
| name | Nome factual até 400 caracteres |
| code | Código oficial opcional; nunca inventar |
| curriculumVersion | Obrigatório para grade, até 40 caracteres |
| periodNumber | Obrigatório para período/nível, 1–30 |
| status | VERIFIED, PENDING_VERIFICATION, OUTDATED, ARCHIVED, REJECTED |
| source | url HTTPS, name, type, contentHash SHA-256, retrievedAt, verifiedAt |
| attributes | Metadados tipados; ver snapshots reais e CatalogRecord |

VERIFIED exige hash e verificação com data não futura. `source.type`: EMEC, OFFICIAL_WEBPAGE, OFFICIAL_PDF, OFFICIAL_API, MANUAL_VERIFIED, CSV_IMPORT, JSON_IMPORT, OTHER. Tipos não dispensam conferência humana. O estudante nunca pode enviar imports.

Cabeçalho CSV: `externalId,kind,parentExternalId,name,code,curriculumVersion,periodNumber,status,sourceUrl,sourceName,sourceType,sourceContentHash,retrievedAt,verifiedAt,attributes`. Metadados são JSON dentro da célula; datas ISO-8601 UTC.

## Processamento

Fila persistida com PENDING, RUNNING, PAUSED, COMPLETED, COMPLETED_WITH_ERRORS, FAILED e CANCELLED. Worker seleciona job com `FOR UPDATE SKIP LOCKED`, processa 100 itens e usa savepoint por registro. Pais entram antes de filhos; pré-requisitos do mesmo lote devem preceder dependentes. UUID determinístico + índice único + advisory lock previnem criação duplicada. Item idêntico vira SKIPPED_UNCHANGED; alteração detectada vira PENDING_VERIFICATION. Um item inválido não descarta os demais.

`GET /admin/catalog/imports/{id}?page=0` mostra job e 30 itens. `POST /imports/{id}/pause|resume|cancel|retry`; retry repete somente FAILED, preservando sucesso/revisão. Cancelamento preserva registros já publicados. Eventos e logs registram encerramento e necessidade de revisão.

`GET /review` retorna payload proposto e registro atual. `POST /review/{itemId}` recebe `{action:"approve",correction:<CatalogRecord>}` ou reject/archive. Aprovação exige VERIFIED e procedência; pais e pré-requisitos precisam existir. Correção não pode sobrescrever a estrutura de matriz publicada. Nova versão exige nova identidade.

Snapshots em `services/api/src/main/resources/catalog` são instalados automaticamente uma vez por hash. `POST /providers/UNA/imports` (também PUCMINAS/UFMG) repete a importação para inspeção de idempotência. Não enviar snapshots com credenciais.

## Documentos e fontes

`POST /documents/inspect` recebe `{url}` oficial; `/documents/pdf` recebe multipart `file` e `source`. Parser PDF retorna candidatos, confiança, avisos e status PENDING_VERIFICATION; não publica automaticamente. Limites: 8 MB na API direta, 4 MB pelo web, 150 páginas, 200 mil caracteres extraídos. `POST /sources/{id}/check` compara hash e gera SOURCE_CHANGED, preservando a versão publicada.

Configuração opcional Spring: `enturma.catalog.sync-enabled=true`, `enturma.catalog.sync-days=14` (mínimo 7). Desligada por padrão; confere até três fontes por execução e registra falhas. Não requer novas variáveis no `.env` para usar o catálogo e os jogos. Bootstrap pode ser desativado com `enturma.catalog.bootstrap=false` em ambientes de teste controlados.
