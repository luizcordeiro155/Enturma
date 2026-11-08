---
description: "Inventário auditável dos commits da branch main do Enturma, com datas, autores, SHAs, mensagens e links para cada alteração."
icon: git-commit
layout:
  width: wide
  tableOfContents:
    visible: true
---

# Enturma — Histórico integral de commits para auditoria

> **Corte do histórico:** 8 de novembro de 2026 · **Repositório:** [luizcordeiro155/Enturma](https://github.com/luizcordeiro155/Enturma) · **Branch auditada:** `main` · **Commit de referência:** [`410a740c05027cec8742f3c189a9b6d3f33b0965`](https://github.com/luizcordeiro155/Enturma/commit/410a740c05027cec8742f3c189a9b6d3f33b0965) · **Total:** **432 commits únicos**.

## Como ler esta auditoria

Este documento foi composto a partir do histórico de commits registrado no GitHub na branch `main`, consultado em 08/11/2026. Contém **todos os 432 commits alcançáveis na listagem paginada dessa branch** no momento da consulta (cinco páginas de até 100 commits), **sem omitir commits**. A data principal é a **data de gravação do commit (committer date)**, exibida no horário de Brasília (**UTC−03:00**), além do horário UTC original. Quando diferente, a data original de autoria também é apresentada.

{% hint style="info" %}
**Critério de auditoria:** “O que foi feito” reproduz o resumo informado na mensagem do commit; o detalhamento reproduz a mensagem complementar original. Isso **não equivale a verificar manualmente cada diff, execução de teste ou implantação em produção**. Para confirmar arquivos, alterações e linhas, use o link do SHA de cada registro. Commits exclusivos de outras branches que não constem de `main` não estão incluídos neste recorte; tampouco o commit que criou este documento de auditoria em branch separada.
{% endhint %}

## Panorama do histórico

- **Primeiro commit do recorte:** [`dcfda562a488a4eeed209dcb4afaf3df1f818fff`](https://github.com/luizcordeiro155/Enturma/commit/dcfda562a488a4eeed209dcb4afaf3df1f818fff) — 2026-09-28 21:46 BRT (2026-09-29T00:46:24.000Z UTC).
- **Último commit do recorte:** [`410a740c05027cec8742f3c189a9b6d3f33b0965`](https://github.com/luizcordeiro155/Enturma/commit/410a740c05027cec8742f3c189a9b6d3f33b0965) — 2026-11-07 02:26 BRT (2026-11-07T05:26:20.000Z UTC).
- **Quantidade de commits:** 432; **SHAs duplicados:** 0.
- **Fonte primária:** [histórico GitHub da `main`](https://github.com/luizcordeiro155/Enturma/commits/main).
- **Validação do registro:** SHA completo, autor, data, mensagem e link individuais.

### Commits por mês

| Mês (horário de Brasília) | Commits |
| --- | ---: |
| Novembro de 2026 | 35 |
| Outubro de 2026 | 359 |
| Setembro de 2026 | 38 |
| **Total** | **432** |

### Classificação por tipo de mensagem

| Tipo declarado ou inferido pelo prefixo | Commits |
| --- | ---: |
| Correção | 188 |
| Funcionalidade | 127 |
| Alteração geral | 39 |
| Release | 24 |
| Manutenção | 24 |
| Documentação | 11 |
| Testes | 6 |
| Estilo/UI | 5 |
| Integração | 4 |
| Desempenho | 4 |

### Autores identificados nas mensagens do Git

| Autor | Commits |
| --- | ---: |
| Luiz Cordeiro | 383 |
| luiz | 49 |

### Áreas identificadas nas mensagens (não exclusivas)

| Área | Menções em commits |
| --- | ---: |
| Mobile e Android | 175 |
| Conversas, salas e chamadas | 115 |
| Desktop e instaladores | 111 |
| Interface, animações e acessibilidade | 96 |
| Infraestrutura e publicação | 90 |
| Perfil, personalização e temas | 71 |
| Segurança e autenticação | 46 |
| Caronas e mobilidade | 37 |
| Catálogo e aprendizagem acadêmica | 33 |

> Um commit pode abordar mais de uma área; esses totais não devem ser somados. A classificação foi feita automaticamente por termos presentes nas mensagens e não representa uma revisão de arquivos.

## Marcos de referência para a auditoria

- **PR #143:** feat(catalog): amplia ofertas e grades PUC Minas UFMG Newton (#143) — 2026-11-07 02:26 BRT. [Commit `410a740c0`](https://github.com/luizcordeiro155/Enturma/commit/410a740c05027cec8742f3c189a9b6d3f33b0965) · [Pull Request](https://github.com/luizcordeiro155/Enturma/pull/143).
- **PR #142:** fix(catalog): publica grades acadêmicas e corrige importações (#142) — 2026-11-07 01:40 BRT. [Commit `62a7b0baf`](https://github.com/luizcordeiro155/Enturma/commit/62a7b0baf16c926c775922ad5b8a04db9da8206a) · [Pull Request](https://github.com/luizcordeiro155/Enturma/pull/142).
- **PR #141:** feat(catalog): amplia cursos e disciplinas de UNA, UFMG, PUC Minas e Newton (#141) — 2026-11-07 00:25 BRT. [Commit `edb5b8f35`](https://github.com/luizcordeiro155/Enturma/commit/edb5b8f352ef0d4f0684859fc5e785b3f761d664) · [Pull Request](https://github.com/luizcordeiro155/Enturma/pull/141).
- **PR #140:** feat(download): guia de instalação e segurança dos apps (#140) — 2026-11-06 17:42 BRT. [Commit `e62c18494`](https://github.com/luizcordeiro155/Enturma/commit/e62c184946e89e8766e732c6fd7cce8b3f36f6cd) · [Pull Request](https://github.com/luizcordeiro155/Enturma/pull/140).

{% hint style="warning" %}
**Nota sobre releases:** uma mensagem de merge, publicação, CI aprovado ou `release` indica o que foi registrado no controle de versões. Ela não prova, isoladamente, que Vercel, SquareCloud, Railway, Android ou Desktop estavam operacionais. O processo de auditoria de produção exige logs e identificadores de deployment correspondentes.
{% endhint %}

## Relação completa, commit a commit

O histórico abaixo está em ordem da **data de commit mais recente para a mais antiga**. Em cada registro, o link do SHA permite auditar a alteração no GitHub, inclusive os arquivos modificados.


## Novembro de 2026


### 07/11/2026 — 3 commit(s)

#### 001. 02:26 BRT — [`410a740c05`](https://github.com/luizcordeiro155/Enturma/commit/410a740c05027cec8742f3c189a9b6d3f33b0965)

- **O que foi feito (mensagem do commit):** feat(catalog): amplia ofertas e grades PUC Minas UFMG Newton (#143)
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `410a740c05027cec8742f3c189a9b6d3f33b0965`
- **Data de commit:** 2026-11-07 02:26 BRT · `2026-11-07T05:26:20.000Z` UTC.
- **Pull Request associada à mensagem:** [#143](https://github.com/luizcordeiro155/Enturma/pull/143).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* feat(catalog): broaden documented course offerings for UFMG

* feat(catalog): broaden documented course offerings for UFMG

* feat(catalog): broaden documented course offerings for PUCMINAS

* feat(catalog): broaden documented course offerings for PUCMINAS

* feat(catalog): broaden documented course offerings for NEWTON

* feat(catalog): broaden documented course offerings for NEWTON

* fix(catalog): align PUC offerings and campus assignments with institutional list

* feat(catalog): add officially listed PUC Minas offerings by eight units

* feat(catalog): seed sourced cross-university course list snapshots on bootstrap

* feat(catalog): add full Newton Psychology 2021 official ten-semester curriculum

* feat(catalog): add full Newton Psychology 2021 official ten-semester curriculum

* feat(catalog): seed Newton psychology complete historical curriculum after course offerings

* feat(catalog): add complete eight-semester PUC Minas Uberlandia SI 2023 published grade

* feat(catalog): add complete eight-semester PUC Minas Uberlandia SI 2023 published grade

* fix(catalog): source UFMG offerings from official Belo Horizonte and Montes Claros lists

* feat(catalog): group UFMG degrees correctly by city without inventing campuses

* fix(catalog): document exact Newton Paiva 2025 official offer table

* feat(catalog): replace inferred Newton programs with 44 source-backed offers

* fix(catalog): link Newton historical psychology curriculum to officially offered 2025 course

* fix(catalog): exclude duplicate offers already supported by dedicated PUC curricula

* feat(catalog): import full PUC Minas Uberlandia historical SI curriculum

* test(catalog): verify official cross-university coverage, evidence hashes and full historical curricula

* test(catalog): check full new university offering counts and selectable grades in PostgreSQL

* feat(catalog): add UFMG Statistics 2024 curriculum with semester-specific subjects

* feat(catalog): add UFMG Statistics 2024 curriculum with semester-specific subjects

* feat(catalog): add complete Newton Computer Science 2023 eight-period grid

* feat(catalog): add complete Newton Computer Science 2023 eight-period grid

* feat(catalog): seed new official UFMG Statistics and Newton Computer Science curricula

* test(catalog): assert complete UFMG statistics and Newton computer science grids

* test(catalog): validate student onboarding for four newly complete degree matrices

* docs(catalog): document new PUC UFMG Newton coverage and source limitations

* docs(catalog): summarize sourced PUC Minas, UFMG and Newton course expansion

* docs(catalog): separate Newton presencial reenrollment source from EAD annex

* fix(catalog): use modality-specific Newton official evidence on course offerings

* docs(catalog): cite separate Newton presencial and EAD admission sources

* test(catalog): surface failed curriculum import items and diagnosis in CI

* test(catalog): drain expanded bootstrap queue before asserting manual import jobs
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/410a740c05027cec8742f3c189a9b6d3f33b0965)

#### 002. 01:40 BRT — [`62a7b0baf1`](https://github.com/luizcordeiro155/Enturma/commit/62a7b0baf16c926c775922ad5b8a04db9da8206a)

- **O que foi feito (mensagem do commit):** fix(catalog): publica grades acadêmicas e corrige importações (#142)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `62a7b0baf16c926c775922ad5b8a04db9da8206a`
- **Data de commit:** 2026-11-07 01:40 BRT · `2026-11-07T04:40:23.000Z` UTC.
- **Pull Request associada à mensagem:** [#142](https://github.com/luizcordeiro155/Enturma/pull/142).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* docs(catalog): record auditable official transcription for NEWTON

* feat(catalog): import reviewed NEWTON courses and real subjects

* docs(catalog): record auditable official transcription for UNA

* feat(catalog): import reviewed UNA courses and real subjects

* docs(catalog): record auditable official transcription for PUCMINAS

* feat(catalog): import reviewed PUCMINAS courses and real subjects

* docs(catalog): record auditable official transcription for UFMG

* feat(catalog): import reviewed UFMG courses and real subjects

* test(catalog): verify real catalog snapshots, source digests and parent hierarchy

* test(catalog): prove verified courses, curricula and subjects are actually available

* test(catalog): enforce evidence SHA-256 integrity and real enrollment data

* docs(catalog): explain real enrollment imports, provenance and historical grades

* fix(catalog): preserve Newton course workload from published semester grid

* fix(catalog): restore all official Newton ADS subject workload hours

* fix(test): allow verified PUC campus parent from existing base snapshot

* feat(catalog): allow Newton reimport in academic administration

* docs(catalog): distinguish verified expansion coverage from historical snapshot totals

* test(catalog): verify new university offerings are visible in student catalog search

* test(ai): scope room access verification to QUESTION calls, excluding memory summaries
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/62a7b0baf16c926c775922ad5b8a04db9da8206a)

#### 003. 00:25 BRT — [`edb5b8f352`](https://github.com/luizcordeiro155/Enturma/commit/edb5b8f352ef0d4f0684859fc5e785b3f761d664)

- **O que foi feito (mensagem do commit):** feat(catalog): amplia cursos e disciplinas de UNA, UFMG, PUC Minas e Newton (#141)
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `edb5b8f352ef0d4f0684859fc5e785b3f761d664`
- **Data de commit:** 2026-11-07 00:25 BRT · `2026-11-07T03:25:51.000Z` UTC.
- **Pull Request associada à mensagem:** [#141](https://github.com/luizcordeiro155/Enturma/pull/141).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* feat(catalog): seed incremental official curriculum expansions

* feat(catalog): register Newton Paiva academic provider

* feat(catalog): stage official UNA courses and subjects for verification

* feat(catalog): stage official UFMG courses and subjects for verification

* feat(catalog): stage official PUCMINAS courses and subjects for verification

* feat(catalog): stage official NEWTON courses and subjects for verification

* test(catalog): validate sourced expansion snapshots remain unverified

* docs(catalog): audit trail, source URLs and review gate for four institutions

* fix(test): register Jackson JavaTimeModule for catalog snapshot dates
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/edb5b8f352ef0d4f0684859fc5e785b3f761d664)


### 06/11/2026 — 2 commit(s)

#### 004. 17:42 BRT — [`e62c184946`](https://github.com/luizcordeiro155/Enturma/commit/e62c184946e89e8766e732c6fd7cce8b3f36f6cd)

- **O que foi feito (mensagem do commit):** feat(download): guia de instalação e segurança dos apps (#140)
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `e62c184946e89e8766e732c6fd7cce8b3f36f6cd`
- **Data de commit:** 2026-11-06 17:42 BRT · `2026-11-06T20:42:45.000Z` UTC.
- **Pull Request associada à mensagem:** [#140](https://github.com/luizcordeiro155/Enturma/pull/140).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* test(download): documenta avisos e valida hashes oficiais no guia de instalação

* feat(download): mostra SHA-256 oficial dos instaladores Windows e Android

* feat(download): inclui guia Windows Android e alertas de assinatura

* style(download): guia de instalação responsivo e verificação de integridade
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e62c184946e89e8766e732c6fd7cce8b3f36f6cd)

#### 005. 00:00 BRT — [`01f676aabf`](https://github.com/luizcordeiro155/Enturma/commit/01f676aabf3f11d7afd0317b287bd8cb92461915)

- **O que foi feito (mensagem do commit):** fix(desktop): restaura rolagem do portfólio público (#139)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `01f676aabf3f11d7afd0317b287bd8cb92461915`
- **Data de commit:** 2026-11-06 00:00 BRT · `2026-11-06T03:00:48.000Z` UTC.
- **Pull Request associada à mensagem:** [#139](https://github.com/luizcordeiro155/Enturma/pull/139).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* test(desktop): reproduz portfolio publico sem rolagem no Electron

* fix(desktop): restaura scroll do documento no portfolio publico
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/01f676aabf3f11d7afd0317b287bd8cb92461915)


### 05/11/2026 — 2 commit(s)

#### 006. 17:35 BRT — [`46257fb495`](https://github.com/luizcordeiro155/Enturma/commit/46257fb495901768bd3c535e9e5d07a781311df0)

- **O que foi feito (mensagem do commit):** fix: rolagem de confirmação Desktop, Start e safe area Android (#138)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `46257fb495901768bd3c535e9e5d07a781311df0`
- **Data de commit:** 2026-11-05 17:35 BRT · `2026-11-05T20:35:01.000Z` UTC.
- **Pull Request associada à mensagem:** [#138](https://github.com/luizcordeiro155/Enturma/pull/138).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* test(desktop): regressão Start e rolagem de e-mail acadêmico

* test(desktop): regressão Start e rolagem de e-mail acadêmico

* fix(desktop): evita apresentação Start ao abrir app

* fix(desktop): libera rolagem da confirmação acadêmica

* test(android): cobranca das barras do sistema no login, cadastro e recuperação

* test(e2e): inclui cenarios Android de area segura na CI

* fix(android): respeita insets nativos em login, cadastro e recuperar senha

* test(desktop): simula atualizador completo para não bloquear verificação acadêmica

* test(android): simula insets do WebView após cada navegação

* test(desktop): isola rolagem acadêmica de seleção assíncrona da instituição
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/46257fb495901768bd3c535e9e5d07a781311df0)

#### 007. 12:11 BRT — [`8460066329`](https://github.com/luizcordeiro155/Enturma/commit/8460066329bd9f4cfba10268410b8b425a7076d6)

- **O que foi feito (mensagem do commit):** fix: corrigir confirmação de links externos e navegação interna Enturma (#137)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8460066329bd9f4cfba10268410b8b425a7076d6`
- **Data de commit:** 2026-11-05 12:11 BRT · `2026-11-05T15:11:03.000Z` UTC.
- **Pull Request associada à mensagem:** [#137](https://github.com/luizcordeiro155/Enturma/pull/137).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* test(web): reproduz fechamento indevido do aviso externo no perfil

* fix(web): preserva confirmação e abre links externos via app nativo

* fix(web): mantém comentário fora dos atributos JSX

* test(web): verifica nova aba após consentimento explícito

* test(web): define regressão de navegação interna Enturma e convites

* fix(web): identifica rotas internas e domínio canônico Enturma

* fix(web): mantém convites e links Enturma na janela atual

* test(web): preserva convites de salas e links internos sem nova aba
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8460066329bd9f4cfba10268410b8b425a7076d6)


### 03/11/2026 — 1 commit(s)

#### 008. 20:52 BRT — [`4f6435218e`](https://github.com/luizcordeiro155/Enturma/commit/4f6435218ef2c50a49ec804db7caf94f33977440)

- **O que foi feito (mensagem do commit):** docs: auditoria completa e alinhamento com Enturma 0.4.424 (#136)
- **Tipo:** Documentação · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `4f6435218ef2c50a49ec804db7caf94f33977440`
- **Data de commit:** 2026-11-03 20:52 BRT · `2026-11-03T23:52:31.000Z` UTC.
- **Pull Request associada à mensagem:** [#136](https://github.com/luizcordeiro155/Enturma/pull/136).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* docs: alinha status, migrations e distribuicao 0.4.424

* docs: alinha runbooks, releases, catalogo e indice documental

* docs: adiciona relatorio de auditoria dos 57 arquivos Markdown
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4f6435218ef2c50a49ec804db7caf94f33977440)


### 02/11/2026 — 27 commit(s)

#### 009. 13:10 BRT — [`9270a5fe08`](https://github.com/luizcordeiro155/Enturma/commit/9270a5fe08afd51e1b38926c11431587bfc5ad26)

- **O que foi feito (mensagem do commit):** Merge pull request #135 from luizcordeiro155/codex/theme-invites-calls-20261102
- **Tipo:** Integração · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `9270a5fe08afd51e1b38926c11431587bfc5ad26`
- **Data de commit:** 2026-11-02 13:10 BRT · `2026-11-02T16:10:11.000Z` UTC.
- **Tipo de integração:** commit de merge com 2 pais.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Corrige temas persistentes, convites, chamadas e telas de acesso
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9270a5fe08afd51e1b38926c11431587bfc5ad26)

#### 010. 12:51 BRT — [`d832e55485`](https://github.com/luizcordeiro155/Enturma/commit/d832e554852aa36a0882fb0c438225d276aa8416)

- **O que foi feito (mensagem do commit):** test: scope theme navigation checks to the active cached page
- **Tipo:** Testes · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `d832e554852aa36a0882fb0c438225d276aa8416`
- **Data de commit:** 2026-11-02 12:51 BRT · `2026-11-02T15:51:37.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d832e554852aa36a0882fb0c438225d276aa8416)

#### 011. 12:37 BRT — [`200f1576dc`](https://github.com/luizcordeiro155/Enturma/commit/200f1576dcbbfc0ed2e25c094bcbb30ca529d09c)

- **O que foi feito (mensagem do commit):** fix: name accessibility dialog directly for assistive navigation
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `200f1576dcbbfc0ed2e25c094bcbb30ca529d09c`
- **Data de commit:** 2026-11-02 12:37 BRT · `2026-11-02T15:37:30.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/200f1576dcbbfc0ed2e25c094bcbb30ca529d09c)

#### 012. 12:20 BRT — [`5c685d2a38`](https://github.com/luizcordeiro155/Enturma/commit/5c685d2a38413f4668ad679d39601126f85e81cc)

- **O que foi feito (mensagem do commit):** fix: resolve invitation sizing and call contrast regressions
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `5c685d2a38413f4668ad679d39601126f85e81cc`
- **Data de commit:** 2026-11-02 12:20 BRT · `2026-11-02T15:20:44.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/5c685d2a38413f4668ad679d39601126f85e81cc)

#### 013. 11:57 BRT — [`0d4b994e22`](https://github.com/luizcordeiro155/Enturma/commit/0d4b994e223279b356e462bec42bfbbd7b35f55b)

- **O que foi feito (mensagem do commit):** fix: stabilize themes, room invitations, calls and access layouts
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `0d4b994e223279b356e462bec42bfbbd7b35f55b`
- **Data de commit:** 2026-11-02 11:57 BRT · `2026-11-02T14:57:09.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/0d4b994e223279b356e462bec42bfbbd7b35f55b)

#### 014. 09:07 BRT — [`6cfcbfbcc8`](https://github.com/luizcordeiro155/Enturma/commit/6cfcbfbcc8d67e50a5c634f95d48a575ced62099)

- **O que foi feito (mensagem do commit):** Merge pull request #134 from luizcordeiro155/codex/chat-theme-polish-20261102
- **Tipo:** Integração · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `6cfcbfbcc8d67e50a5c634f95d48a575ced62099`
- **Data de commit:** 2026-11-02 09:07 BRT · `2026-11-02T12:07:01.000Z` UTC.
- **Tipo de integração:** commit de merge com 2 pais.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
fix: temas, barra de áudio e perfis públicos do Enturma
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/6cfcbfbcc8d67e50a5c634f95d48a575ced62099)

#### 015. 08:48 BRT — [`02ed131bf2`](https://github.com/luizcordeiro155/Enturma/commit/02ed131bf2a3385b88375da0cead3ec58bfd2860)

- **O que foi feito (mensagem do commit):** fix(profile): retain mural spacing for public visitors
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `02ed131bf2a3385b88375da0cead3ec58bfd2860`
- **Data de commit:** 2026-11-02 08:48 BRT · `2026-11-02T11:48:10.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/02ed131bf2a3385b88375da0cead3ec58bfd2860)

#### 016. 08:46 BRT — [`2d026c7778`](https://github.com/luizcordeiro155/Enturma/commit/2d026c77787b08d2822b3523ae491b74f977529a)

- **O que foi feito (mensagem do commit):** fix(chat): preserve latest message through viewport resizing
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `2d026c77787b08d2822b3523ae491b74f977529a`
- **Data de commit:** 2026-11-02 08:46 BRT · `2026-11-02T11:46:16.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/2d026c77787b08d2822b3523ae491b74f977529a)

#### 017. 08:42 BRT — [`836c65ad3e`](https://github.com/luizcordeiro155/Enturma/commit/836c65ad3ed8b9faa7b3d4769a053f8f99418e53)

- **O que foi feito (mensagem do commit):** test(auth): isolate brand contrast from selected theme control
- **Tipo:** Testes · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `836c65ad3ed8b9faa7b3d4769a053f8f99418e53`
- **Data de commit:** 2026-11-02 08:42 BRT · `2026-11-02T11:42:37.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/836c65ad3ed8b9faa7b3d4769a053f8f99418e53)

#### 018. 08:26 BRT — [`453450c11a`](https://github.com/luizcordeiro155/Enturma/commit/453450c11a41c5066ec704e462e912005cd26ef7)

- **O que foi feito (mensagem do commit):** test(profile): use a valid PNG avatar fixture
- **Tipo:** Testes · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `453450c11a41c5066ec704e462e912005cd26ef7`
- **Data de commit:** 2026-11-02 08:26 BRT · `2026-11-02T11:26:12.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/453450c11a41c5066ec704e462e912005cd26ef7)

#### 019. 08:22 BRT — [`4e0641d4fe`](https://github.com/luizcordeiro155/Enturma/commit/4e0641d4fe1ef4d12af0154937640ccb3c1d2f74)

- **O que foi feito (mensagem do commit):** fix(api): return not found for unknown public resources
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `4e0641d4fe1ef4d12af0154937640ccb3c1d2f74`
- **Data de commit:** 2026-11-02 08:22 BRT · `2026-11-02T11:22:29.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4e0641d4fe1ef4d12af0154937640ccb3c1d2f74)

#### 020. 08:17 BRT — [`cb0e5d40ca`](https://github.com/luizcordeiro155/Enturma/commit/cb0e5d40ca938d97a7053c03a2b6e625f038d136)

- **O que foi feito (mensagem do commit):** fix(chat): preserve microphone contrast on hover
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `cb0e5d40ca938d97a7053c03a2b6e625f038d136`
- **Data de commit:** 2026-11-02 08:17 BRT · `2026-11-02T11:17:04.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/cb0e5d40ca938d97a7053c03a2b6e625f038d136)

#### 021. 08:16 BRT — [`a96593fa06`](https://github.com/luizcordeiro155/Enturma/commit/a96593fa06ef295951cd48423a7078a6a02f623b)

- **O que foi feito (mensagem do commit):** test(e2e): isolate room participants and mobile card fixtures
- **Tipo:** Testes · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `a96593fa06ef295951cd48423a7078a6a02f623b`
- **Data de commit:** 2026-11-02 08:16 BRT · `2026-11-02T11:16:07.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a96593fa06ef295951cd48423a7078a6a02f623b)

#### 022. 08:13 BRT — [`75c9d719b6`](https://github.com/luizcordeiro155/Enturma/commit/75c9d719b67cc76590cbeff9b68f6329c17b5f52)

- **O que foi feito (mensagem do commit):** fix(chat): inline voice recording and public author profiles
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `75c9d719b67cc76590cbeff9b68f6329c17b5f52`
- **Data de commit:** 2026-11-02 08:13 BRT · `2026-11-02T11:13:55.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/75c9d719b67cc76590cbeff9b68f6329c17b5f52)

#### 023. 07:45 BRT — [`e5572a8dcb`](https://github.com/luizcordeiro155/Enturma/commit/e5572a8dcb16aaa4fcd5dc295b6aa00aeb61da64)

- **O que foi feito (mensagem do commit):** fix: preserve theme contrast in auth animation and compact chat layout
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `e5572a8dcb16aaa4fcd5dc295b6aa00aeb61da64`
- **Data de commit:** 2026-11-02 07:45 BRT · `2026-11-02T10:45:47.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e5572a8dcb16aaa4fcd5dc295b6aa00aeb61da64)

#### 024. 07:27 BRT — [`589cd65802`](https://github.com/luizcordeiro155/Enturma/commit/589cd658028b588aaf68f2baa1ce37265f235f8b)

- **O que foi feito (mensagem do commit):** fix: sync Android system surfaces with Enturma palette
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `589cd658028b588aaf68f2baa1ce37265f235f8b`
- **Data de commit:** 2026-11-02 07:27 BRT · `2026-11-02T10:27:46.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/589cd658028b588aaf68f2baa1ce37265f235f8b)

#### 025. 07:25 BRT — [`ab90d71212`](https://github.com/luizcordeiro155/Enturma/commit/ab90d71212f155578cc4a44cb7c7e413cb378fcc)

- **O que foi feito (mensagem do commit):** fix: synchronize themes and refine chat composition and receipts
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `ab90d71212f155578cc4a44cb7c7e413cb378fcc`
- **Data de commit:** 2026-11-02 07:25 BRT · `2026-11-02T10:25:20.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/ab90d71212f155578cc4a44cb7c7e413cb378fcc)

#### 026. 06:33 BRT — [`03ce2fb9cd`](https://github.com/luizcordeiro155/Enturma/commit/03ce2fb9cd4bf146ac64d23bf67149ba23878d96)

- **O que foi feito (mensagem do commit):** Merge pull request #133 from luizcordeiro155/codex/experience-stabilization-20261030
- **Tipo:** Integração · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `03ce2fb9cd4bf146ac64d23bf67149ba23878d96`
- **Data de commit:** 2026-11-02 06:33 BRT · `2026-11-02T09:33:39.000Z` UTC.
- **Tipo de integração:** commit de merge com 2 pais.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
feat: experiência compartilhada, áudios e convites do Enturma
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/03ce2fb9cd4bf146ac64d23bf67149ba23878d96)

#### 027. 06:33 BRT — [`43c3e2494a`](https://github.com/luizcordeiro155/Enturma/commit/43c3e2494a551d2db31709068ef49357d2ff6cfc)

- **O que foi feito (mensagem do commit):** docs: clarify verification scope and load measurements
- **Tipo:** Documentação · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `43c3e2494a551d2db31709068ef49357d2ff6cfc`
- **Data de commit:** 2026-11-02 06:33 BRT · `2026-11-02T09:33:13.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/43c3e2494a551d2db31709068ef49357d2ff6cfc)

#### 028. 06:32 BRT — [`8a9a721523`](https://github.com/luizcordeiro155/Enturma/commit/8a9a7215236c0bc02da7cb14647d1aefdf03aaaf)

- **O que foi feito (mensagem do commit):** docs: record validated release evidence for November experience update
- **Tipo:** Documentação · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `8a9a7215236c0bc02da7cb14647d1aefdf03aaaf`
- **Data de commit:** 2026-11-02 06:32 BRT · `2026-11-02T09:32:39.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8a9a7215236c0bc02da7cb14647d1aefdf03aaaf)

#### 029. 06:15 BRT — [`6d9ae4b030`](https://github.com/luizcordeiro155/Enturma/commit/6d9ae4b030505acbc98df4adc3b04abe565c39fd)

- **O que foi feito (mensagem do commit):** fix: serialize session recovery and reject stale navigation checks
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `6d9ae4b030505acbc98df4adc3b04abe565c39fd`
- **Data de commit:** 2026-11-02 06:15 BRT · `2026-11-02T09:15:41.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/6d9ae4b030505acbc98df4adc3b04abe565c39fd)

#### 030. 06:12 BRT — [`78aff2c95a`](https://github.com/luizcordeiro155/Enturma/commit/78aff2c95a24d346914c9a8c28e2ef23ea4f3206)

- **O que foi feito (mensagem do commit):** fix: verify access cookie before reusing session renewal
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `78aff2c95a24d346914c9a8c28e2ef23ea4f3206`
- **Data de commit:** 2026-11-02 06:12 BRT · `2026-11-02T09:12:14.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/78aff2c95a24d346914c9a8c28e2ef23ea4f3206)

#### 031. 05:54 BRT — [`4549f5bf0e`](https://github.com/luizcordeiro155/Enturma/commit/4549f5bf0e90cce7eb4ec584494b3c14882360a2)

- **O que foi feito (mensagem do commit):** fix: keep narrow chat composers and message headers readable
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `4549f5bf0e90cce7eb4ec584494b3c14882360a2`
- **Data de commit:** 2026-11-02 05:54 BRT · `2026-11-02T08:54:10.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4549f5bf0e90cce7eb4ec584494b3c14882360a2)

#### 032. 05:45 BRT — [`9a76d6f6a2`](https://github.com/luizcordeiro155/Enturma/commit/9a76d6f6a2e68c0c42511a51c450fb95bd8d2459)

- **O que foi feito (mensagem do commit):** fix: preserve mobile settings heading outside profile editor
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `9a76d6f6a2e68c0c42511a51c450fb95bd8d2459`
- **Data de commit:** 2026-11-02 05:45 BRT · `2026-11-02T08:45:49.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9a76d6f6a2e68c0c42511a51c450fb95bd8d2459)

#### 033. 05:40 BRT — [`b634113fa1`](https://github.com/luizcordeiro155/Enturma/commit/b634113fa15e35cc1783cb924a9e82902ef9151c)

- **O que foi feito (mensagem do commit):** fix: gate background messaging on confirmed account sessions
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `b634113fa15e35cc1783cb924a9e82902ef9151c`
- **Data de commit:** 2026-11-02 05:40 BRT · `2026-11-02T08:40:02.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/b634113fa15e35cc1783cb924a9e82902ef9151c)

#### 034. 05:30 BRT — [`21ac899e28`](https://github.com/luizcordeiro155/Enturma/commit/21ac899e28125323d58861467c94b3435e61c347)

- **O que foi feito (mensagem do commit):** test: align visitor authorization checks with API contract
- **Tipo:** Testes · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `21ac899e28125323d58861467c94b3435e61c347`
- **Data de commit:** 2026-11-02 05:30 BRT · `2026-11-02T08:30:20.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/21ac899e28125323d58861467c94b3435e61c347)

#### 035. 05:21 BRT — [`6f53413c00`](https://github.com/luizcordeiro155/Enturma/commit/6f53413c005b81ae1a347ac5ab5c267438e7fa1a)

- **O que foi feito (mensagem do commit):** feat: shared visitor experience, voice messages and room invitations
- **Tipo:** Funcionalidade · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `6f53413c005b81ae1a347ac5ab5c267438e7fa1a`
- **Data de commit:** 2026-11-02 05:21 BRT · `2026-11-02T08:21:18.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/6f53413c005b81ae1a347ac5ab5c267438e7fa1a)


## Outubro de 2026


### 30/10/2026 — 7 commit(s)

#### 036. 02:25 BRT — [`a31b9c0638`](https://github.com/luizcordeiro155/Enturma/commit/a31b9c0638d64953f8d610f93dbfa03ef47d23e1)

- **O que foi feito (mensagem do commit):** fix: unlock desktop notification audio on interaction
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `a31b9c0638d64953f8d610f93dbfa03ef47d23e1`
- **Data de commit:** 2026-10-30 02:25 BRT · `2026-10-30T05:25:24.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a31b9c0638d64953f8d610f93dbfa03ef47d23e1)

#### 037. 02:22 BRT — [`5e3ef504eb`](https://github.com/luizcordeiro155/Enturma/commit/5e3ef504ebbc6ca0f41657c7922a24f0b883276a)

- **O que foi feito (mensagem do commit):** fix: mobile layouts, account sessions and call experience
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `5e3ef504ebbc6ca0f41657c7922a24f0b883276a`
- **Data de commit:** 2026-10-30 02:22 BRT · `2026-10-30T05:22:09.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/5e3ef504ebbc6ca0f41657c7922a24f0b883276a)

#### 038. 01:48 BRT — [`d62df3776c`](https://github.com/luizcordeiro155/Enturma/commit/d62df3776c019997d13c064be799ab9addfb99b6)

- **O que foi feito (mensagem do commit):** docs: record verified experience tests and isolated load results
- **Tipo:** Documentação · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `d62df3776c019997d13c064be799ab9addfb99b6`
- **Data de commit:** 2026-10-30 01:48 BRT · `2026-10-30T04:48:17.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d62df3776c019997d13c064be799ab9addfb99b6)

#### 039. 01:33 BRT — [`38fc662f16`](https://github.com/luizcordeiro155/Enturma/commit/38fc662f165c56e1e56fbbaacd78d3b287ebf876)

- **O que foi feito (mensagem do commit):** fix: preserve composer focus and verify actual public routes
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `38fc662f165c56e1e56fbbaacd78d3b287ebf876`
- **Data de commit:** 2026-10-30 01:33 BRT · `2026-10-30T04:33:49.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/38fc662f165c56e1e56fbbaacd78d3b287ebf876)

#### 040. 01:26 BRT — [`cfe47989dd`](https://github.com/luizcordeiro155/Enturma/commit/cfe47989ddc7b374a7dccd865ab12eb6573c9226)

- **O que foi feito (mensagem do commit):** fix: validate native data cleanup and public interface contrast
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `cfe47989ddc7b374a7dccd865ab12eb6573c9226`
- **Data de commit:** 2026-10-30 01:26 BRT · `2026-10-30T04:26:10.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/cfe47989ddc7b374a7dccd865ab12eb6573c9226)

#### 041. 01:11 BRT — [`cae843d7c9`](https://github.com/luizcordeiro155/Enturma/commit/cae843d7c904f7a2b4ae40b315db0f2bda941cdb)

- **O que foi feito (mensagem do commit):** feat: refine guest access chat feedback and desktop update experience
- **Tipo:** Funcionalidade · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `cae843d7c904f7a2b4ae40b315db0f2bda941cdb`
- **Data de commit:** 2026-10-30 01:11 BRT · `2026-10-30T04:11:37.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/cae843d7c904f7a2b4ae40b315db0f2bda941cdb)

#### 042. 00:44 BRT — [`df99cce9a4`](https://github.com/luizcordeiro155/Enturma/commit/df99cce9a4fe617a88557eab277c97732165b3f0)

- **O que foi feito (mensagem do commit):** docs: record owner's external backup waiver
- **Tipo:** Documentação · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `df99cce9a4fe617a88557eab277c97732165b3f0`
- **Data de commit:** 2026-10-30 00:44 BRT · `2026-10-30T03:44:35.000Z` UTC.
- **Data de autoria:** `2026-10-30T03:44:34.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/df99cce9a4fe617a88557eab277c97732165b3f0)


### 29/10/2026 — 14 commit(s)

#### 043. 20:09 BRT — [`8d24584e97`](https://github.com/luizcordeiro155/Enturma/commit/8d24584e974dfa984392bd24f2dd06e2bae0ca6f)

- **O que foi feito (mensagem do commit):** fix(web mobile): stable chat composer and room navbar during keyboard transitions (#131)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8d24584e974dfa984392bd24f2dd06e2bae0ca6f`
- **Data de commit:** 2026-10-29 20:09 BRT · `2026-10-29T23:09:41.000Z` UTC.
- **Pull Request associada à mensagem:** [#131](https://github.com/luizcordeiro155/Enturma/pull/131).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Preserve the message composer above the bottom room tabs before the IME opens; anchor it to visualViewport once the keyboard appears; restore tab layout on dismissal. Includes geometry-based regression coverage. The preview was validated on mobile.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8d24584e974dfa984392bd24f2dd06e2bae0ca6f)

#### 044. 19:16 BRT — [`92fae506b4`](https://github.com/luizcordeiro155/Enturma/commit/92fae506b4eaaf8bd9b485499ef0e8a7feb1f1e7)

- **O que foi feito (mensagem do commit):** fix(mobile): stabilize chat IME and eliminate Android window flash (#130)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `92fae506b4eaaf8bd9b485499ef0e8a7feb1f1e7`
- **Data de commit:** 2026-10-29 19:16 BRT · `2026-10-29T22:16:36.000Z` UTC.
- **Pull Request associada à mensagem:** [#130](https://github.com/luizcordeiro155/Enturma/pull/130).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Unify private and room chat viewport handling on mobile browsers; retain native WebView drawing surface while keyboard animates and resize the flex conversation. Includes automated focus and viewport regression tests. GitHub CI and Vercel Preview passed.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/92fae506b4eaaf8bd9b485499ef0e8a7feb1f1e7)

#### 045. 18:47 BRT — [`48206afd55`](https://github.com/luizcordeiro155/Enturma/commit/48206afd55fa6108753710b9eaaaf07e680ed4c0)

- **O que foi feito (mensagem do commit):** fix: stabilize mobile keyboard in chats and native Android window (#129)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `48206afd55fa6108753710b9eaaaf07e680ed4c0`
- **Data de commit:** 2026-10-29 18:47 BRT · `2026-10-29T21:47:33.000Z` UTC.
- **Pull Request associada à mensagem:** [#129](https://github.com/luizcordeiro155/Enturma/pull/129).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Keep private mobile Web composer anchored on first keyboard focus; eliminate native Android window flash; retain working room chat layout and add keyboard regression tests. CI and security scans passed.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/48206afd55fa6108753710b9eaaaf07e680ed4c0)

#### 046. 17:26 BRT — [`8d55098bb4`](https://github.com/luizcordeiro155/Enturma/commit/8d55098bb4295df84dde444c39f24e0b1102dbb5)

- **O que foi feito (mensagem do commit):** fix(web): remove unused keyboard animation frame causing Vercel lint failure
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8d55098bb4295df84dde444c39f24e0b1102dbb5`
- **Data de commit:** 2026-10-29 17:26 BRT · `2026-10-29T20:26:42.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8d55098bb4295df84dde444c39f24e0b1102dbb5)

#### 047. 17:13 BRT — [`d0bb3ca4fc`](https://github.com/luizcordeiro155/Enturma/commit/d0bb3ca4fc06f8a7fc12c02e56165a41752f2659)

- **O que foi feito (mensagem do commit):** fix(chat): share mobile web keyboard anchor for rooms and DMs (#128)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d0bb3ca4fc06f8a7fc12c02e56165a41752f2659`
- **Data de commit:** 2026-10-29 17:13 BRT · `2026-10-29T20:13:59.000Z` UTC.
- **Pull Request associada à mensagem:** [#128](https://github.com/luizcordeiro155/Enturma/pull/128).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Pin both web mobile chat composers to visualViewport keyboard boundary, handle visual-only and layout viewport resize without double insets, keep message history scroll independent and leave Android native IME untouched.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d0bb3ca4fc06f8a7fc12c02e56165a41752f2659)

#### 048. 16:57 BRT — [`3447342830`](https://github.com/luizcordeiro155/Enturma/commit/344734283029e98d415db40be24f925fef07a81d)

- **O que foi feito (mensagem do commit):** fix(mobile-web): stabilize room composer above keyboard (#127)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `344734283029e98d415db40be24f925fef07a81d`
- **Data de commit:** 2026-10-29 16:57 BRT · `2026-10-29T19:57:30.000Z` UTC.
- **Pull Request associada à mensagem:** [#127](https://github.com/luizcordeiro155/Enturma/pull/127).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Use visual viewport top/height for mobile browser room chat, isolate message scrolling, preserve Android app and private conversation behavior.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/344734283029e98d415db40be24f925fef07a81d)

#### 049. 14:43 BRT — [`88ec5cd3a8`](https://github.com/luizcordeiro155/Enturma/commit/88ec5cd3a8e845ed382d154bbaf8fc7cae75aa82)

- **O que foi feito (mensagem do commit):** fix(rooms): compact study room header for more chat space (#126)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `88ec5cd3a8e845ed382d154bbaf8fc7cae75aa82`
- **Data de commit:** 2026-10-29 14:43 BRT · `2026-10-29T17:43:19.000Z` UTC.
- **Pull Request associada à mensagem:** [#126](https://github.com/luizcordeiro155/Enturma/pull/126).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Reduce desktop room heading height and spacing, compact room identity and metadata, keep actions accessible across widths; preserve mobile toolbar and add regression layout assertions.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/88ec5cd3a8e845ed382d154bbaf8fc7cae75aa82)

#### 050. 13:06 BRT — [`448a5f1dd3`](https://github.com/luizcordeiro155/Enturma/commit/448a5f1dd37fe49b42af0edad4e879a825d909d7)

- **O que foi feito (mensagem do commit):** fix(rides): synchronize driver profile selection (#125)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `448a5f1dd37fe49b42af0edad4e879a825d909d7`
- **Data de commit:** 2026-10-29 13:06 BRT · `2026-10-29T16:06:42.000Z` UTC.
- **Pull Request associada à mensagem:** [#125](https://github.com/luizcordeiro155/Enturma/pull/125).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Preserve chosen driver/passenger mode across map and navigation; pass explicit mode to profile settings; prevent initial passenger state from overwriting saved driver mode. Add shared mode tests.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/448a5f1dd37fe49b42af0edad4e879a825d909d7)

#### 051. 12:56 BRT — [`1ef3c390f2`](https://github.com/luizcordeiro155/Enturma/commit/1ef3c390f27e116586d66f98e83f8641cd111a5f)

- **O que foi feito (mensagem do commit):** fix(rides): independent scrolling for profiles and ride history (#124)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `1ef3c390f27e116586d66f98e83f8641cd111a5f`
- **Data de commit:** 2026-10-29 12:56 BRT · `2026-10-29T15:56:18.000Z` UTC.
- **Pull Request associada à mensagem:** [#124](https://github.com/luizcordeiro155/Enturma/pull/124).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Allow main desktop ride content to scroll on passenger/driver profiles and history pages; keep fixed navigation and map behavior, preserve mobile.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/1ef3c390f27e116586d66f98e83f8641cd111a5f)

#### 052. 12:47 BRT — [`9f8fea7126`](https://github.com/luizcordeiro155/Enturma/commit/9f8fea71263b867c563df1d675d9225c1027ed33)

- **O que foi feito (mensagem do commit):** fix(rides): preserve visible map center and refine light sidebar (#123)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `9f8fea71263b867c563df1d675d9225c1027ed33`
- **Data de commit:** 2026-10-29 12:47 BRT · `2026-10-29T15:47:09.000Z` UTC.
- **Pull Request associada à mensagem:** [#123](https://github.com/luizcordeiro155/Enturma/pull/123).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Move planner into desktop side dock, reserve map viewing area, keep zoom inside map and refine light mode sidebar. Preserve mobile and ride interactions.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9f8fea71263b867c563df1d675d9225c1027ed33)

#### 053. 12:33 BRT — [`48ecae3f6a`](https://github.com/luizcordeiro155/Enturma/commit/48ecae3f6a71090c415e0ce1714e560168b4df14)

- **O que foi feito (mensagem do commit):** fix(rides): fixed desktop navigation and refined map planner (#122)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `48ecae3f6a71090c415e0ce1714e560168b4df14`
- **Data de commit:** 2026-10-29 12:33 BRT · `2026-10-29T15:33:31.000Z` UTC.
- **Pull Request associada à mensagem:** [#122](https://github.com/luizcordeiro155/Enturma/pull/122).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Constrain ride hub to the usable Electron/browser viewport, prevent sidebar/page scroll, keep safety and back links in view and refine floating driver/passenger sheet. Preserve mobile, ride flow and existing animations.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/48ecae3f6a71090c415e0ce1714e560168b4df14)

#### 054. 12:18 BRT — [`f0611c13a0`](https://github.com/luizcordeiro155/Enturma/commit/f0611c13a0b26d43db6e45c53c4587edf57911ee)

- **O que foi feito (mensagem do commit):** fix(chat): clean compact private chat header on desktop (#121)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f0611c13a0b26d43db6e45c53c4587edf57911ee`
- **Data de commit:** 2026-10-29 12:18 BRT · `2026-10-29T15:18:12.000Z` UTC.
- **Pull Request associada à mensagem:** [#121](https://github.com/luizcordeiro155/Enturma/pull/121).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Reduce desktop private chat header height and spacing; replace highlighted back button with subtle transparent control; preserve call buttons and mobile layout.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f0611c13a0b26d43db6e45c53c4587edf57911ee)

#### 055. 12:07 BRT — [`0c9c0e980d`](https://github.com/luizcordeiro155/Enturma/commit/0c9c0e980dd5e6ac277a8937d2bd2de77686fd9d)

- **O que foi feito (mensagem do commit):** fix(chat): full-height desktop private conversations (#120)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `0c9c0e980dd5e6ac277a8937d2bd2de77686fd9d`
- **Data de commit:** 2026-10-29 12:07 BRT · `2026-10-29T15:07:28.000Z` UTC.
- **Pull Request associada à mensagem:** [#120](https://github.com/luizcordeiro155/Enturma/pull/120).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Remove desktop-only DM border, outer whitespace and footer, isolate message-history scrolling, keep header and composer anchored. Preserve mobile layouts and add E2E layout assertions.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/0c9c0e980dd5e6ac277a8937d2bd2de77686fd9d)

#### 056. 10:39 BRT — [`028b214bda`](https://github.com/luizcordeiro155/Enturma/commit/028b214bdaffd5890e262bf5d1e76e4c80b62a33)

- **O que foi feito (mensagem do commit):** feat(calls): improve voice processing and HD video screen quality (#119)
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `028b214bdaffd5890e262bf5d1e76e4c80b62a33`
- **Data de commit:** 2026-10-29 10:39 BRT · `2026-10-29T13:39:08.000Z` UTC.
- **Pull Request associada à mensagem:** [#119](https://github.com/luizcordeiro155/Enturma/pull/119).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Enable noise suppression, echo cancellation and automatic gain, publish camera with HD capture and bitrate tiers, allow room/private call screen share resolutions/FPS with matching uplink encoding. Preserve adaptive streaming and add quality tests.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/028b214bdaffd5890e262bf5d1e76e4c80b62a33)


### 28/10/2026 — 10 commit(s)

#### 057. 23:25 BRT — [`b7042fa88e`](https://github.com/luizcordeiro155/Enturma/commit/b7042fa88e8fe39fa7df40ca8664620bfe6118c1)

- **O que foi feito (mensagem do commit):** fix(desktop): strengthen update badge and room menu contrast (#118)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `b7042fa88e8fe39fa7df40ca8664620bfe6118c1`
- **Data de commit:** 2026-10-28 23:25 BRT · `2026-10-29T02:25:29.000Z` UTC.
- **Pull Request associada à mensagem:** [#118](https://github.com/luizcordeiro155/Enturma/pull/118).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Set visible white updater button outline, icon and progress in dark mode; dark green in light mode. Fix room participant three-dot trigger dark contrast without changing light theme; preserve existing animations and updater behavior.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/b7042fa88e8fe39fa7df40ca8664620bfe6118c1)

#### 058. 23:19 BRT — [`f8d220d1a8`](https://github.com/luizcordeiro155/Enturma/commit/f8d220d1a8fe33c1a3438766a37debe529449870)

- **O que foi feito (mensagem do commit):** fix(room): add participants as friends instead of inviting to room (#117)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f8d220d1a8fe33c1a3438766a37debe529449870`
- **Data de commit:** 2026-10-28 23:19 BRT · `2026-10-29T02:19:43.000Z` UTC.
- **Pull Request associada à mensagem:** [#117](https://github.com/luizcordeiro155/Enturma/pull/117).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Use existing friendship endpoint, show pending/accepted relationship states and let participants send friend requests. Preserve host-only kick action with confirmation.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f8d220d1a8fe33c1a3438766a37debe529449870)

#### 059. 23:14 BRT — [`a615877be4`](https://github.com/luizcordeiro155/Enturma/commit/a615877be458700c15175af2bab01a84d7d8feeb)

- **O que foi feito (mensagem do commit):** fix(room): restore participant menu contrast and animated hover (#116)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `a615877be458700c15175af2bab01a84d7d8feeb`
- **Data de commit:** 2026-10-28 23:14 BRT · `2026-10-29T02:14:56.000Z` UTC.
- **Pull Request associada à mensagem:** [#116](https://github.com/luizcordeiro155/Enturma/pull/116).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Use isolated theme-specific styles for portaled member menu actions, prevent global primary-button colors from overriding labels and icons, and retain accessible hover/focus animations in dark and light themes.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a615877be458700c15175af2bab01a84d7d8feeb)

#### 060. 23:06 BRT — [`aa8a18f90a`](https://github.com/luizcordeiro155/Enturma/commit/aa8a18f90aef8678d523553da1747b21ef688fd6)

- **O que foi feito (mensagem do commit):** fix(desktop): improve update indicator contrast and scrollbar placement (#115)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `aa8a18f90aef8678d523553da1747b21ef688fd6`
- **Data de commit:** 2026-10-28 23:06 BRT · `2026-10-29T02:06:08.000Z` UTC.
- **Pull Request associada à mensagem:** [#115](https://github.com/luizcordeiro155/Enturma/pull/115).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Improve native update indicator visibility in dark/light themes, preserve click-to-download and progress, remove Electron scrollbar gutter and trigger Windows native release rebuild.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/aa8a18f90aef8678d523553da1747b21ef688fd6)

#### 061. 22:52 BRT — [`db1abd03c1`](https://github.com/luizcordeiro155/Enturma/commit/db1abd03c1a65ec6dd8549b9f3d97b03e297c129)

- **O que foi feito (mensagem do commit):** fix(desktop): isolate Electron scrolling and pin sidebar brand (#114)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `db1abd03c1a65ec6dd8549b9f3d97b03e297c129`
- **Data de commit:** 2026-10-28 22:52 BRT · `2026-10-29T01:52:43.000Z` UTC.
- **Pull Request associada à mensagem:** [#114](https://github.com/luizcordeiro155/Enturma/pull/114).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Prevent document scroll in Electron, constrain the app to the viewport beneath the titlebar, scroll only workspace contents, and add a regression E2E test for sidebar brand position. Web browser and mobile unchanged.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/db1abd03c1a65ec6dd8549b9f3d97b03e297c129)

#### 062. 22:36 BRT — [`862256e781`](https://github.com/luizcordeiro155/Enturma/commit/862256e781b36e2acfb3ec1611c703cc7dc593c3)

- **O que foi feito (mensagem do commit):** fix(desktop): pinned sidebar and opt-in animated update download (#113)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `862256e781b36e2acfb3ec1611c703cc7dc593c3`
- **Data de commit:** 2026-10-28 22:36 BRT · `2026-10-29T01:36:49.000Z` UTC.
- **Pull Request associada à mensagem:** [#113](https://github.com/luizcordeiro155/Enturma/pull/113).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Keep Electron side navigation fixed with internal overflow on short screens. Surface download indicator only when updates exist; start verified download and existing native updater animation only on click. Avoid unsolicited updater popups and preserve web/mobile behavior.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/862256e781b36e2acfb3ec1611c703cc7dc593c3)

#### 063. 22:11 BRT — [`4b24ad2077`](https://github.com/luizcordeiro155/Enturma/commit/4b24ad20778809e60c63466d15a4435077cc1ae0)

- **O que foi feito (mensagem do commit):** feat(room): personalized room artwork and safe participant actions (#112)
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `4b24ad20778809e60c63466d15a4435077cc1ae0`
- **Data de commit:** 2026-10-28 22:11 BRT · `2026-10-29T01:11:55.000Z` UTC.
- **Pull Request associada à mensagem:** [#112](https://github.com/luizcordeiro155/Enturma/pull/112).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Display room banner and avatar, highlight room management, add animated invite/remove participant menus with confirmation, hide empty typing bar and allow dismissing AI context notices.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4b24ad20778809e60c63466d15a4435077cc1ae0)

#### 064. 21:46 BRT — [`d87fa1e1b6`](https://github.com/luizcordeiro155/Enturma/commit/d87fa1e1b69ab9ce0ceabbb1d440f91f4ff31b54)

- **O que foi feito (mensagem do commit):** fix(room): restore desktop chat, call and study panel geometry (#111)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d87fa1e1b69ab9ce0ceabbb1d440f91f4ff31b54`
- **Data de commit:** 2026-10-28 21:46 BRT · `2026-10-29T00:46:28.000Z` UTC.
- **Pull Request associada à mensagem:** [#111](https://github.com/luizcordeiro155/Enturma/pull/111).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Replace nested main with semantic section to avoid global page padding. Repair message composer, fullscreen call-stage proportions, participant rows, study materials, Enturma AI and header styling.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d87fa1e1b69ab9ce0ceabbb1d440f91f4ff31b54)

#### 065. 21:24 BRT — [`8725c9905d`](https://github.com/luizcordeiro155/Enturma/commit/8725c9905d50dd8f649d94420695405701b85728)

- **O que foi feito (mensagem do commit):** fix(room): polish study-room layout and mobile browser keyboard (#110)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8725c9905d50dd8f649d94420695405701b85728`
- **Data de commit:** 2026-10-28 21:24 BRT · `2026-10-29T00:24:11.000Z` UTC.
- **Pull Request associada à mensagem:** [#110](https://github.com/luizcordeiro155/Enturma/pull/110).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Contain desktop room scrolling within the message pane, improve message and participant cards, and keep mobile Web composer attached to visual viewport while preserving native Android keyboard behavior.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8725c9905d50dd8f649d94420695405701b85728)

#### 066. 18:12 BRT — [`07d989964a`](https://github.com/luizcordeiro155/Enturma/commit/07d989964a4ab98031703c13c81f03e853090557)

- **O que foi feito (mensagem do commit):** Release candidate: estabilidade de temas, notificações e proteção de IA (#109)
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `07d989964a4ab98031703c13c81f03e853090557`
- **Data de commit:** 2026-10-28 18:12 BRT · `2026-10-28T21:12:54.000Z` UTC.
- **Pull Request associada à mensagem:** [#109](https://github.com/luizcordeiro155/Enturma/pull/109).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* fix: harden theme transitions, notifications and AI execution budget

* chore: document release gates and rehearse isolated database recovery

* test: follow accessible notebook web search states

* docs: consolidate verified release candidate evidence and operational gates

* fix(web): retain route titles and cap unread badge consistently

* test(web): cover title metadata and notification badge cleanup
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/07d989964a4ab98031703c13c81f03e853090557)


### 27/10/2026 — 1 commit(s)

#### 067. 00:21 BRT — [`f3f19a0310`](https://github.com/luizcordeiro155/Enturma/commit/f3f19a03103621db91e78b8a23f47625e6eeaca4)

- **O que foi feito (mensagem do commit):** feat: refine public presentation and sharing artwork (#108)
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f3f19a03103621db91e78b8a23f47625e6eeaca4`
- **Data de commit:** 2026-10-27 00:21 BRT · `2026-10-27T03:21:09.000Z` UTC.
- **Pull Request associada à mensagem:** [#108](https://github.com/luizcordeiro155/Enturma/pull/108).

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f3f19a03103621db91e78b8a23f47625e6eeaca4)


### 26/10/2026 — 1 commit(s)

#### 068. 23:50 BRT — [`1742460b6d`](https://github.com/luizcordeiro155/Enturma/commit/1742460b6d7fb26195a6eca7898d934aa56e9172)

- **O que foi feito (mensagem do commit):** feat: public presentation, account chat sync and security hardening (#107)
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `1742460b6d7fb26195a6eca7898d934aa56e9172`
- **Data de commit:** 2026-10-26 23:50 BRT · `2026-10-27T02:50:44.000Z` UTC.
- **Pull Request associada à mensagem:** [#107](https://github.com/luizcordeiro155/Enturma/pull/107).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* feat: public presentation and automatic encrypted account chat sync

* test: send authenticated origin for account vault synchronization

* fix: keep presentation cards readable and record release checks
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/1742460b6d7fb26195a6eca7898d934aa56e9172)


### 25/10/2026 — 7 commit(s)

#### 069. 23:40 BRT — [`7146d3ef46`](https://github.com/luizcordeiro155/Enturma/commit/7146d3ef4624fe35fb43627c4c2d6175212bf0aa)

- **O que foi feito (mensagem do commit):** docs: sync all 40 Enturma technical documentation files (#106)
- **Tipo:** Documentação · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `7146d3ef4624fe35fb43627c4c2d6175212bf0aa`
- **Data de commit:** 2026-10-25 23:40 BRT · `2026-10-26T02:40:43.000Z` UTC.
- **Pull Request associada à mensagem:** [#106](https://github.com/luizcordeiro155/Enturma/pull/106).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Reconcile current Web/Android/Desktop/API state with October 2026 technical docs, update migration inventory through V63, correct AI model description, KLIPY, motion, carpool, security, deployment and historic references. Documentation-only change. Secret scan passed; CI was running during merge.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/7146d3ef4624fe35fb43627c4c2d6175212bf0aa)

#### 070. 23:22 BRT — [`8d234a9f04`](https://github.com/luizcordeiro155/Enturma/commit/8d234a9f0443a22c0276cb80ec6dec59afb1cf3e)

- **O que foi feito (mensagem do commit):** docs: refresh Enturma README, contribution, license and security (#105)
- **Tipo:** Documentação · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8d234a9f0443a22c0276cb80ec6dec59afb1cf3e`
- **Data de commit:** 2026-10-25 23:22 BRT · `2026-10-26T02:22:04.000Z` UTC.
- **Pull Request associada à mensagem:** [#105](https://github.com/luizcordeiro155/Enturma/pull/105).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Documentation-only update for current Web, Android, Desktop, multimedia, KLIPY, carpool, privacy and release practices. Preserve existing proprietary licensing terms. Secret scanning passed; CI verification was in progress at merge.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8d234a9f0443a22c0276cb80ec6dec59afb1cf3e)

#### 071. 17:48 BRT — [`cbd2de0dae`](https://github.com/luizcordeiro155/Enturma/commit/cbd2de0daedd33dc7ede1750d0cff4510043d282)

- **O que foi feito (mensagem do commit):** Release KLIPY GIF search and pagination enhancements (#104)
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `cbd2de0daedd33dc7ede1750d0cff4510043d282`
- **Data de commit:** 2026-10-25 17:48 BRT · `2026-10-25T20:48:47.000Z` UTC.
- **Pull Request associada à mensagem:** [#104](https://github.com/luizcordeiro155/Enturma/pull/104).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Add KLIPY magnifier search, debounced queries, 40 results per page, Load More, responsive gallery and search pagination tests.

Validated: GitHub Enturma CI success and security scanning success for 0ee9bea; Vercel preview READY.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/cbd2de0daedd33dc7ede1750d0cff4510043d282)

#### 072. 17:09 BRT — [`9a30f264f8`](https://github.com/luizcordeiro155/Enturma/commit/9a30f264f8b8a17237c9f831115938dcf2600af4)

- **O que foi feito (mensagem do commit):** Release KLIPY GIF integration for Enturma (#103)
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `9a30f264f8b8a17237c9f831115938dcf2600af4`
- **Data de commit:** 2026-10-25 17:09 BRT · `2026-10-25T20:09:40.000Z` UTC.
- **Pull Request associada à mensagem:** [#103](https://github.com/luizcordeiro155/Enturma/pull/103).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Enable KLIPY direct-client GIF discovery and sharing in chat composer, rooms and encrypted private messages. Use configured production KLIPY_API_KEY and preserve Enturma's personal media library.

Validated: CI successful, secret scanning successful, Vercel preview READY for 61d5933.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9a30f264f8b8a17237c9f831115938dcf2600af4)

#### 073. 16:15 BRT — [`d35d22d281`](https://github.com/luizcordeiro155/Enturma/commit/d35d22d281b49f6e8d06e1d34a4e8cbe5a5c59d1)

- **O que foi feito (mensagem do commit):** Fix mobile emoji picker positioning and keyboard focus (#102)
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d35d22d281b49f6e8d06e1d34a4e8cbe5a5c59d1`
- **Data de commit:** 2026-10-25 16:15 BRT · `2026-10-25T19:15:00.000Z` UTC.
- **Pull Request associada à mensagem:** [#102](https://github.com/luizcordeiro155/Enturma/pull/102).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* fix: keep mobile emoji picker anchored without dismissing keyboard

* fix: preserve text focus when touching picker background
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d35d22d281b49f6e8d06e1d34a4e8cbe5a5c59d1)

#### 074. 15:18 BRT — [`1e072a3dca`](https://github.com/luizcordeiro155/Enturma/commit/1e072a3dca7e53112c66c978a6b7d06b5e6d6160)

- **O que foi feito (mensagem do commit):** fix: derive native versions without GitHub API quota (#101)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `1e072a3dca7e53112c66c978a6b7d06b5e6d6160`
- **Data de commit:** 2026-10-25 15:18 BRT · `2026-10-25T18:18:46.000Z` UTC.
- **Pull Request associada à mensagem:** [#101](https://github.com/luizcordeiro155/Enturma/pull/101).

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/1e072a3dca7e53112c66c978a6b7d06b5e6d6160)

#### 075. 14:54 BRT — [`5b02c1f8e3`](https://github.com/luizcordeiro155/Enturma/commit/5b02c1f8e332e2f494fd15c8dc499bb7b03970fe)

- **O que foi feito (mensagem do commit):** Native animated installer, direct stickers and camera switching (#100)
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `5b02c1f8e332e2f494fd15c8dc499bb7b03970fe`
- **Data de commit:** 2026-10-25 14:54 BRT · `2026-10-25T17:54:15.000Z` UTC.
- **Pull Request associada à mensagem:** [#100](https://github.com/luizcordeiro155/Enturma/pull/100).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* feat: native animated installer and direct chat media

* test: verify immediate encrypted media delivery across devices
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/5b02c1f8e332e2f494fd15c8dc499bb7b03970fe)


### 24/10/2026 — 2 commit(s)

#### 076. 02:04 BRT — [`f8e4830c56`](https://github.com/luizcordeiro155/Enturma/commit/f8e4830c563b868b678ab5e218e3d66f8e934e49)

- **O que foi feito (mensagem do commit):** Fix Enturma launch and rides animation pacing (#99)
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f8e4830c563b868b678ab5e218e3d66f8e934e49`
- **Data de commit:** 2026-10-24 02:04 BRT · `2026-10-24T05:04:31.000Z` UTC.
- **Pull Request associada à mensagem:** [#99](https://github.com/luizcordeiro155/Enturma/pull/99).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Release validated animation timing fix. Delay splash completion until Remotion player mounts, respect visibility, and slow rides book-to-car transition. CI and secret scan green.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f8e4830c563b868b678ab5e218e3d66f8e934e49)

#### 077. 01:33 BRT — [`acd96214bd`](https://github.com/luizcordeiro155/Enturma/commit/acd96214bd12f15d6553d4bd0dac56583c51898f)

- **O que foi feito (mensagem do commit):** Release Enturma: chat, native UX and security fixes (#98)
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `acd96214bd12f15d6553d4bd0dac56583c51898f`
- **Data de commit:** 2026-10-24 01:33 BRT · `2026-10-24T04:33:48.000Z` UTC.
- **Pull Request associada à mensagem:** [#98](https://github.com/luizcordeiro155/Enturma/pull/98).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Merge validated Codex release candidate. CI and secret scanning passed on dfe659bc. Includes corrected Playwright selectors, chat experience refinements and security migrations.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/acd96214bd12f15d6553d4bd0dac56583c51898f)


### 20/10/2026 — 7 commit(s)

#### 078. 22:29 BRT — [`3f78085cdf`](https://github.com/luizcordeiro155/Enturma/commit/3f78085cdf75bfb624f1ed37410844664485f0b1)

- **O que foi feito (mensagem do commit):** Corrigir interface dos cadernos IA e interações do perfil (#97)
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `3f78085cdf75bfb624f1ed37410844664485f0b1`
- **Data de commit:** 2026-10-20 22:29 BRT · `2026-10-21T01:29:44.000Z` UTC.
- **Pull Request associada à mensagem:** [#97](https://github.com/luizcordeiro155/Enturma/pull/97).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* fix: notebook chat layout and profile interactions

* fix: respect native safe areas in notebook panels
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/3f78085cdf75bfb624f1ed37410844664485f0b1)

#### 079. 21:27 BRT — [`0fb7aa4f0d`](https://github.com/luizcordeiro155/Enturma/commit/0fb7aa4f0dddbdd3c5d7d867dcbe291db19fb599)

- **O que foi feito (mensagem do commit):** Conversas nos cadernos e melhorias de tema, QR, caronas e notificações (#96)
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `0fb7aa4f0dddbdd3c5d7d867dcbe291db19fb599`
- **Data de commit:** 2026-10-20 21:27 BRT · `2026-10-21T00:27:40.000Z` UTC.
- **Pull Request associada à mensagem:** [#96](https://github.com/luizcordeiro155/Enturma/pull/96).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* feat: notebook conversations and mobile interaction polish

* fix: smooth guide loops and keep submitted ride reviews closed

* test: assert the configured profile action accent

* Retry academic catalogs when the network reconnects
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/0fb7aa4f0dddbdd3c5d7d867dcbe291db19fb599)

#### 080. 02:04 BRT — [`2f6f2c4022`](https://github.com/luizcordeiro155/Enturma/commit/2f6f2c40224bef2e365adedf3b5e7becb2771107)

- **O que foi feito (mensagem do commit):** Fix dark-mode profile action text contrast
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `2f6f2c40224bef2e365adedf3b5e7becb2771107`
- **Data de commit:** 2026-10-20 02:04 BRT · `2026-10-20T05:04:32.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Use a dark readable foreground on lime Edit profile / Start conversation buttons in both themes. Guard the computed dark-mode styles with an E2E regression assertion.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/2f6f2c40224bef2e365adedf3b5e7becb2771107)

#### 081. 01:55 BRT — [`7de7fd2a24`](https://github.com/luizcordeiro155/Enturma/commit/7de7fd2a24ece6bae78fedbff51399127a9f01f2)

- **O que foi feito (mensagem do commit):** Polish profile status highlight and unify public profile action surface
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `7de7fd2a24ece6bae78fedbff51399127a9f01f2`
- **Data de commit:** 2026-10-20 01:55 BRT · `2026-10-20T04:55:16.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Keep the high-contrast status badge visible in light/dark themes and move public profile actions inside the same themed card as the preview. Add desktop/mobile regression checks.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/7de7fd2a24ece6bae78fedbff51399127a9f01f2)

#### 082. 01:41 BRT — [`9a41467fd8`](https://github.com/luizcordeiro155/Enturma/commit/9a41467fd80beab5e7d1057a72a4277a8a9c0854)

- **O que foi feito (mensagem do commit):** Fix mobile profile and mural preview scrolling
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `9a41467fd80beab5e7d1057a72a4277a8a9c0854`
- **Data de commit:** 2026-10-20 01:41 BRT · `2026-10-20T04:41:57.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* reset mobile profile preview scroller when switching edit, profile and mural

* restore full touch scroll of mobile profile and mural preview

* regression test mobile mural preview scroll reaches long content
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9a41467fd80beab5e7d1057a72a4277a8a9c0854)

#### 083. 00:43 BRT — [`4b11c458ff`](https://github.com/luizcordeiro155/Enturma/commit/4b11c458ff2525b2a922ea8e8a8b61a1e58c5548)

- **O que foi feito (mensagem do commit):** Fix profile editor card contrast in light and dark modes
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `4b11c458ff2525b2a922ea8e8a8b61a1e58c5548`
- **Data de commit:** 2026-10-20 00:43 BRT · `2026-10-20T03:43:31.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* fix light and dark profile editor card icon, label and thumbnail contrast

* test profile edit card text and icons across themes
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4b11c458ff2525b2a922ea8e8a8b61a1e58c5548)

#### 084. 00:13 BRT — [`7d17f26999`](https://github.com/luizcordeiro155/Enturma/commit/7d17f269998f7308702bdd22b852197990128799)

- **O que foi feito (mensagem do commit):** Fix mobile light and dark theme contrast regressions
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `7d17f269998f7308702bdd22b852197990128799`
- **Data de commit:** 2026-10-20 00:13 BRT · `2026-10-20T03:13:41.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* restore theme-picker icon/text contrast and personalized profile readability

* load targeted light/dark contrast fix after existing styles

* regression test dark theme picker legibility
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/7d17f269998f7308702bdd22b852197990128799)


### 19/10/2026 — 1 commit(s)

#### 085. 23:21 BRT — [`a107953e33`](https://github.com/luizcordeiro155/Enturma/commit/a107953e33ba7c38bc8e52e13337bd54da76d417)

- **O que foi feito (mensagem do commit):** Experiencia conectada: perfis, conversas, salas e caronas (#92)
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `a107953e33ba7c38bc8e52e13337bd54da76d417`
- **Data de commit:** 2026-10-19 23:21 BRT · `2026-10-20T02:21:50.000Z` UTC.
- **Pull Request associada à mensagem:** [#92](https://github.com/luizcordeiro155/Enturma/pull/92).

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a107953e33ba7c38bc8e52e13337bd54da76d417)


### 18/10/2026 — 2 commit(s)

#### 086. 00:29 BRT — [`9c26f20196`](https://github.com/luizcordeiro155/Enturma/commit/9c26f20196877a96254c90e08ef6067cb611990b)

- **O que foi feito (mensagem do commit):** Hotfix private calls cancelling before acceptance
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `9c26f20196877a96254c90e08ef6067cb611990b`
- **Data de commit:** 2026-10-18 00:29 BRT · `2026-10-18T03:29:27.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* prevent refresh from cancelling ringing calls and separate stale-call recovery

* only close confirmed media sessions on actual page exit

* regression tests for preventing premature call cancellation

* verify incoming call survives realtime refresh before accepting
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9c26f20196877a96254c90e08ef6067cb611990b)

#### 087. 00:11 BRT — [`90e03e7245`](https://github.com/luizcordeiro155/Enturma/commit/90e03e7245d696533820192b7925636b1179e260)

- **O que foi feito (mensagem do commit):** Fix private call hangup, loading and app restart recovery
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `90e03e7245d696533820192b7925636b1179e260`
- **Data de commit:** 2026-10-18 00:11 BRT · `2026-10-18T03:11:41.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* model call route ownership and orphan recovery

* model call route ownership and orphan recovery

* keep private call state on call route

* clear private call immediately on hangup including loading screen

* always show hangup control while private call is connecting

* reconcile leftover private call after app reload

* best effort hangup when app tab closes or reloads
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/90e03e7245d696533820192b7925636b1179e260)


### 16/10/2026 — 5 commit(s)

#### 088. 20:48 BRT — [`1424cd3e71`](https://github.com/luizcordeiro155/Enturma/commit/1424cd3e71984a7f6b55e56f7364be4884ed85e4)

- **O que foi feito (mensagem do commit):** Unify public profile with customized preview and remove open flash
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `1424cd3e71984a7f6b55e56f7364be4884ed85e4`
- **Data de commit:** 2026-10-16 20:48 BRT · `2026-10-16T23:48:18.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* share exact profile preview and public visual structure

* use shared profile surface in editor preview

* open public profile after loading and reuse editor visual surface

* remove duplicate action container in shared profile

* make public and preview profile use exactly the same layout and colors
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/1424cd3e71984a7f6b55e56f7364be4884ed85e4)

#### 089. 20:16 BRT — [`09b6ae85ad`](https://github.com/luizcordeiro155/Enturma/commit/09b6ae85adb775fbca68d23ca7713dd724d05c5b)

- **O que foi feito (mensagem do commit):** Unify profile mural and accelerate private messaging
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `09b6ae85adb775fbca68d23ca7713dd724d05c5b`
- **Data de commit:** 2026-10-16 20:16 BRT · `2026-10-16T23:16:56.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* default new profile murals to system theme without changing existing users

* unify profile entrance and default mural selection

* unify profile entrance and default mural selection

* unify profile entrance and default mural selection

* share profile display styling and remove custom entrance selector

* share profile display styling and remove custom entrance selector

* unify mural and profile color surface

* apply linked mural palette only when using profile colors

* apply linked mural palette only when using profile colors

* render encrypted private messages optimistically with retry and acknowledgement

* avoid reading pending-send ref during render

* update visual E2E for single standard profile entrance

* add monotonically increasing profile media revision

* return profile media revision and invalidate cached avatar/GIF after uploads

* return profile media revision and invalidate cached avatar/GIF after uploads

* match public mural heading to editor and unify gradient contrast

* keep legacy migration snapshot stable across new media revision column

* remove configurable profile opening animation from native editor

* standardize native profile opening transition

* remove obsolete native custom profile entrance modes

* avoid resend on refresh failures and restore unsent drafts safely

* deduplicate confirmed private messages by client ID

* assert unified profile gradient at shared surface

* preserve selected mural gradient image while keeping shared surface seamless
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/09b6ae85adb775fbca68d23ca7713dd724d05c5b)

#### 090. 17:43 BRT — [`cb86d0c514`](https://github.com/luizcordeiro155/Enturma/commit/cb86d0c514ebb2e27155d3ac9c5f35876981ae37)

- **O que foi feito (mensagem do commit):** Restore delayed animated book entrance
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `cb86d0c514ebb2e27155d3ac9c5f35876981ae37`
- **Data de commit:** 2026-10-16 17:43 BRT · `2026-10-16T20:43:47.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* Keep animated Enturma book visible from first frame

* Start launch motion enabled while respecting accessibility updates

* Preserve delayed book entrance and page-turn animation
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/cb86d0c514ebb2e27155d3ac9c5f35876981ae37)

#### 091. 16:54 BRT — [`50a64e2a07`](https://github.com/luizcordeiro155/Enturma/commit/50a64e2a07ce3a693bb253782995716d38c7ca5c)

- **O que foi feito (mensagem do commit):** Fix consistent launch timing and lightweight motion
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `50a64e2a07ce3a693bb253782995716d38c7ca5c`
- **Data de commit:** 2026-10-16 16:54 BRT · `2026-10-16T19:54:36.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* keep launch visible and choose lightweight effects for modest devices

* keep launch visible and choose lightweight effects for modest devices

* preserve opening until animation is visible independent of API latency

* keep recovery splash visible before going to Home

* adapt launch motion effects to device resources

* reduce decorative layers on modest hardware without removing book animation

* fix lint rules for adaptive motion setup

* fix lint rules for adaptive motion setup

* fix lint rules for adaptive motion setup

* remove leftover state update from launch effect
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/50a64e2a07ce3a693bb253782995716d38c7ca5c)

#### 092. 15:30 BRT — [`05b4d314b5`](https://github.com/luizcordeiro155/Enturma/commit/05b4d314b5c3a3864bf5dc4d41b0143396782bf5)

- **O que foi feito (mensagem do commit):** Fix single launch animation during persistent session recovery
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `05b4d314b5c3a3864bf5dc4d41b0143396782bf5`
- **Data de commit:** 2026-10-16 15:30 BRT · `2026-10-16T18:30:29.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* use one animated launch for automatic session recovery

* keep launch animation during session recovery

* keep launch animation during session recovery

* avoid replaying app launch after recovery

* fix recovery timer TypeScript typing
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/05b4d314b5c3a3864bf5dc4d41b0143396782bf5)


### 15/10/2026 — 3 commit(s)

#### 093. 22:34 BRT — [`9ac60fc9a9`](https://github.com/luizcordeiro155/Enturma/commit/9ac60fc9a9e1dbddf761bb30adfdcf5a707d7673)

- **O que foi feito (mensagem do commit):** fix(web): responsive profile editor and readable mural (#84)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `9ac60fc9a9e1dbddf761bb30adfdcf5a707d7673`
- **Data de commit:** 2026-10-15 22:34 BRT · `2026-10-16T01:34:55.000Z` UTC.
- **Pull Request associada à mensagem:** [#84](https://github.com/luizcordeiro155/Enturma/pull/84).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* fix(web): rebuild responsive profile studio and readable mural

* fix(web): keep mobile profile controls readable in dark mode
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9ac60fc9a9e1dbddf761bb30adfdcf5a707d7673)

#### 094. 22:18 BRT — [`9b27996c83`](https://github.com/luizcordeiro155/Enturma/commit/9b27996c8339091dc4661dffbdcdc734fe8469d2)

- **O que foi feito (mensagem do commit):** fix(web): readable academic verification across themes (#83)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `9b27996c8339091dc4661dffbdcdc734fe8469d2`
- **Data de commit:** 2026-10-15 22:18 BRT · `2026-10-16T01:18:43.000Z` UTC.
- **Pull Request associada à mensagem:** [#83](https://github.com/luizcordeiro155/Enturma/pull/83).

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9b27996c8339091dc4661dffbdcdc734fe8469d2)

#### 095. 21:59 BRT — [`46d07141fd`](https://github.com/luizcordeiro155/Enturma/commit/46d07141fd638d5e8a10173a0fceaeacde5f85d8)

- **O que foi feito (mensagem do commit):** feat: academic identity and integrated Enturma experience (#82)
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `46d07141fd638d5e8a10173a0fceaeacde5f85d8`
- **Data de commit:** 2026-10-15 21:59 BRT · `2026-10-16T00:59:01.000Z` UTC.
- **Pull Request associada à mensagem:** [#82](https://github.com/luizcordeiro155/Enturma/pull/82).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* feat: verify academic identity and refresh Enturma experience

* test: wait for completed academic approval navigation

* fix: preserve account erasure during academic verification
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/46d07141fd638d5e8a10173a0fceaeacde5f85d8)


### 13/10/2026 — 1 commit(s)

#### 096. 11:21 BRT — [`66be413f44`](https://github.com/luizcordeiro155/Enturma/commit/66be413f44c3ee95d875cab55b179bf4f0860e56)

- **O que foi feito (mensagem do commit):** Allow removing saved ride routines from profiles
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `66be413f44c3ee95d875cab55b179bf4f0860e56`
- **Data de commit:** 2026-10-13 11:21 BRT · `2026-10-13T14:21:48.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* allow removing passenger and driver routines from ride profile

* style mobile-friendly saved ride routine removal
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/66be413f44c3ee95d875cab55b179bf4f0860e56)


### 09/10/2026 — 2 commit(s)

#### 097. 12:00 BRT — [`9829515a67`](https://github.com/luizcordeiro155/Enturma/commit/9829515a679c0ab437809a530e367f85ccab8f50)

- **O que foi feito (mensagem do commit):** Hotfix login loop after successful authentication
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `9829515a679c0ab437809a530e367f85ccab8f50`
- **Data de commit:** 2026-10-09 12:00 BRT · `2026-10-09T15:00:16.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* fix login redirect by navigating after session cookies commit

* pass trusted client identity in session route guard
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9829515a679c0ab437809a530e367f85ccab8f50)

#### 098. 10:36 BRT — [`cc8a7f5b6f`](https://github.com/luizcordeiro155/Enturma/commit/cc8a7f5b6ff18461cb4c072009a4e907946d3854)

- **O que foi feito (mensagem do commit):** Fix login-first navigation and persistent session restoration
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `cc8a7f5b6ff18461cb4c072009a4e907946d3854`
- **Data de commit:** 2026-10-09 10:36 BRT · `2026-10-09T13:36:31.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Protect initial routes before rendering private content, coordinate refresh recovery and improve native saved-session startup.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/cc8a7f5b6ff18461cb4c072009a4e907946d3854)


### 08/10/2026 — 9 commit(s)

#### 099. 13:38 BRT — [`ebc45d764e`](https://github.com/luizcordeiro155/Enturma/commit/ebc45d764e3d23711eccd009a2167f002334dd95)

- **O que foi feito (mensagem do commit):** Fix moderation timers, flood lock and AI appeals
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `ebc45d764e3d23711eccd009a2167f002334dd95`
- **Data de commit:** 2026-10-08 13:38 BRT · `2026-10-08T16:38:25.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Penalidades temporárias com contador, recurso único analisado pela IA, bloqueio do compositor durante mute/flood, aviso apenas em Salas e notificações e expiração automática.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/ebc45d764e3d23711eccd009a2167f002334dd95)

#### 100. 13:02 BRT — [`f40165f227`](https://github.com/luizcordeiro155/Enturma/commit/f40165f22700840969f5564654168de01780d877)

- **O que foi feito (mensagem do commit):** Release Android 0.3.30
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f40165f22700840969f5564654168de01780d877`
- **Data de commit:** 2026-10-08 13:02 BRT · `2026-10-08T16:02:26.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Bump mobile to 0.3.30 with Android versionCode 33 so 0.3.29 installations detect and notify the update.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f40165f22700840969f5564654168de01780d877)

#### 101. 12:07 BRT — [`ec26793b48`](https://github.com/luizcordeiro155/Enturma/commit/ec26793b484fb6f045304602ada3b93e895a40c0)

- **O que foi feito (mensagem do commit):** Fix: dedicated Salas page on mobile/web
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `ec26793b484fb6f045304602ada3b93e895a40c0`
- **Data de commit:** 2026-10-08 12:07 BRT · `2026-10-08T15:07:04.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Corrige /rooms para usar uma tela própria de descoberta de salas, separada da Home, com contexto acadêmico e layout mobile dedicado.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/ec26793b484fb6f045304602ada3b93e895a40c0)

#### 102. 11:22 BRT — [`5150ea5d48`](https://github.com/luizcordeiro155/Enturma/commit/5150ea5d487bd44d5bc73b306679525c726ea197)

- **O que foi feito (mensagem do commit):** guard mobile room recommendations against legacy API responses
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `5150ea5d487bd44d5bc73b306679525c726ea197`
- **Data de commit:** 2026-10-08 11:22 BRT · `2026-10-08T14:22:44.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/5150ea5d487bd44d5bc73b306679525c726ea197)

#### 103. 10:44 BRT — [`db2d1fcf04`](https://github.com/luizcordeiro155/Enturma/commit/db2d1fcf04a90c9f7c39b698bff422b812e1608f)

- **O que foi feito (mensagem do commit):** allow existing members to re-enter full recommended rooms
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `db2d1fcf04a90c9f7c39b698bff422b812e1608f`
- **Data de commit:** 2026-10-08 10:44 BRT · `2026-10-08T13:44:40.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/db2d1fcf04a90c9f7c39b698bff422b812e1608f)

#### 104. 10:42 BRT — [`fa228ee71a`](https://github.com/luizcordeiro155/Enturma/commit/fa228ee71a20e244f1b2313d16fe0a4230ab4f0a)

- **O que foi feito (mensagem do commit):** Mobile: prioritize study rooms by academic context
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `fa228ee71a20e244f1b2313d16fe0a4230ab4f0a`
- **Data de commit:** 2026-10-08 10:42 BRT · `2026-10-08T13:42:58.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Prioriza salas abertas relacionadas às matérias e ao curso do aluno no mobile, com contexto acadêmico, ocupação e tempo restante.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/fa228ee71a20e244f1b2313d16fe0a4230ab4f0a)

#### 105. 02:14 BRT — [`f7dd0c255f`](https://github.com/luizcordeiro155/Enturma/commit/f7dd0c255fdedf6d384f5e220802fed39c676d61)

- **O que foi feito (mensagem do commit):** Corrige articulação da apresentadora e refina a intro do Enturma (#74)
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f7dd0c255fdedf6d384f5e220802fed39c676d61`
- **Data de commit:** 2026-10-08 02:14 BRT · `2026-10-08T05:14:55.000Z` UTC.
- **Pull Request associada à mensagem:** [#74](https://github.com/luizcordeiro155/Enturma/pull/74).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* fix(intro): articulate presenter safely and refine captions

* fix(intro): keep closing layout clear at wider aspect ratios
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f7dd0c255fdedf6d384f5e220802fed39c676d61)

#### 106. 01:21 BRT — [`9fcd7acfb0`](https://github.com/luizcordeiro155/Enturma/commit/9fcd7acfb09fcf726f6172934462c06a815a14bb)

- **O que foi feito (mensagem do commit):** feat: apresentação Enturma em quadrinhos e narração contínua (#73)
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `9fcd7acfb09fcf726f6172934462c06a815a14bb`
- **Data de commit:** 2026-10-08 01:21 BRT · `2026-10-08T04:21:29.000Z` UTC.
- **Pull Request associada à mensagem:** [#73](https://github.com/luizcordeiro155/Enturma/pull/73).

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9fcd7acfb09fcf726f6172934462c06a815a14bb)

#### 107. 00:16 BRT — [`6e58f6ba67`](https://github.com/luizcordeiro155/Enturma/commit/6e58f6ba67a2e33fd7839babc6d452c694f47f52)

- **O que foi feito (mensagem do commit):** feat: narração contínua e sincronizada na apresentação (#72)
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `6e58f6ba67a2e33fd7839babc6d452c694f47f52`
- **Data de commit:** 2026-10-08 00:16 BRT · `2026-10-08T03:16:49.000Z` UTC.
- **Pull Request associada à mensagem:** [#72](https://github.com/luizcordeiro155/Enturma/pull/72).

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/6e58f6ba67a2e33fd7839babc6d452c694f47f52)


### 07/10/2026 — 15 commit(s)

#### 108. 22:41 BRT — [`d29e14ae64`](https://github.com/luizcordeiro155/Enturma/commit/d29e14ae6478c764ddc85155fe8d2ab5dbff2b51)

- **O que foi feito (mensagem do commit):** feat: conversas, emojis, narração e acesso aos aplicativos (#71)
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d29e14ae6478c764ddc85155fe8d2ab5dbff2b51`
- **Data de commit:** 2026-10-07 22:41 BRT · `2026-10-08T01:41:56.000Z` UTC.
- **Pull Request associada à mensagem:** [#71](https://github.com/luizcordeiro155/Enturma/pull/71).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* feat(chat): add message menus, emoji reactions and image gestures

* test(api): isolate scheduled workers between integration contexts

* fix(chat): restore focus after overlay navigation and align browser checks

* feat(auth): link app downloads from login and registration

* fix(intro): recover suspended audio context on first playback

* test(intro): handle browser audio activation when replaying
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d29e14ae6478c764ddc85155fe8d2ab5dbff2b51)

#### 109. 20:57 BRT — [`4ed8f2ddbf`](https://github.com/luizcordeiro155/Enturma/commit/4ed8f2ddbf1fd4f870c392d11e6950cd7114c9bf)

- **O que foi feito (mensagem do commit):** feat(web): aprimora narração e encerramento animado da apresentação (#70)
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `4ed8f2ddbf1fd4f870c392d11e6950cd7114c9bf`
- **Data de commit:** 2026-10-07 20:57 BRT · `2026-10-07T23:57:25.000Z` UTC.
- **Pull Request associada à mensagem:** [#70](https://github.com/luizcordeiro155/Enturma/pull/70).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Narração feminina brasileira com roteiro conversado, treze falas sincronizadas e encerramento responsivo com páginas animadas de feed, salas, caronas e cadernos IA.

Build, TypeScript, 32 testes unitários e Playwright aprovados. ESLint sem erros. Vercel preview READY no commit validado.

[skip ci]
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4ed8f2ddbf1fd4f870c392d11e6950cd7114c9bf)

#### 110. 20:39 BRT — [`9c679dac3f`](https://github.com/luizcordeiro155/Enturma/commit/9c679dac3f6f77a84637f22e7ca89cbd82844943)

- **O que foi feito (mensagem do commit):** Adiciona narração feminina sincronizada à apresentação do Enturma
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `9c679dac3f6f77a84637f22e7ca89cbd82844943`
- **Data de commit:** 2026-10-07 20:39 BRT · `2026-10-07T23:39:52.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Adiciona narração feminina em português brasileiro, legendas e controle de som à intro. Validação: 31 testes unitários, cenário E2E de áudio e acessibilidade, tipos, lint e build; prévia Vercel READY. Sem alterações de API ou binários nativos. [skip ci]
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9c679dac3f6f77a84637f22e7ca89cbd82844943)

#### 111. 20:19 BRT — [`ffbac8bc4e`](https://github.com/luizcordeiro155/Enturma/commit/ffbac8bc4e0b0b4af8deabc51d8e13fa88c9d2e8)

- **O que foi feito (mensagem do commit):** Corrige chamadas e navegação e aprimora a apresentação do Enturma
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `ffbac8bc4e0b0b4af8deabc51d8e13fa88c9d2e8`
- **Data de commit:** 2026-10-07 20:19 BRT · `2026-10-07T23:19:08.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Corrige encerramento de chamadas, navegação do chat e visualização de imagens. Amplia a intro Remotion e mantém replay minimizado. Validação local: 30 testes unitários, seis cenários E2E, TypeScript, lint e build; prévia Vercel READY. Sem alterações de API ou binário nativo. [skip ci]
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/ffbac8bc4e0b0b4af8deabc51d8e13fa88c9d2e8)

#### 112. 19:30 BRT — [`11ae868ee4`](https://github.com/luizcordeiro155/Enturma/commit/11ae868ee4165512954060d2a698f9f6d533d3ef)

- **O que foi feito (mensagem do commit):** Refina chats e chamadas e adiciona intro oficial com Remotion (#67)
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `11ae868ee4165512954060d2a698f9f6d533d3ef`
- **Data de commit:** 2026-10-07 19:30 BRT · `2026-10-07T22:30:07.000Z` UTC.
- **Pull Request associada à mensagem:** [#67](https://github.com/luizcordeiro155/Enturma/pull/67).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Remotion Player como timeline oficial, temas e chat responsivo, chamadas privadas reais e mídia LiveKit independente. Migrações V41/V42 aditivas.

Validação local: 77 testes API, 30 unitários web, sete cenários Playwright, TypeScript, ESLint e builds web/API. Sem alterações nativas. [skip ci]
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/11ae868ee4165512954060d2a698f9f6d533d3ef)

#### 113. 15:42 BRT — [`588af6ba98`](https://github.com/luizcordeiro155/Enturma/commit/588af6ba989d8cc2ef3baf865aa381e19d2b2a0f)

- **O que foi feito (mensagem do commit):** fix(room): keep short conversations anchored above composer
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `588af6ba989d8cc2ef3baf865aa381e19d2b2a0f`
- **Data de commit:** 2026-10-07 15:42 BRT · `2026-10-07T18:42:04.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Mantém conversas curtas das salas próximas ao compositor no mobile, sem fazer a última mensagem subir demais, preservando o scroll normal de históricos longos.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/588af6ba989d8cc2ef3baf865aa381e19d2b2a0f)

#### 114. 01:54 BRT — [`643d94c511`](https://github.com/luizcordeiro155/Enturma/commit/643d94c51188b6a147ba8d6abc8d16e485eca9c9)

- **O que foi feito (mensagem do commit):** fix(chat): anchor mobile actions and fully reveal newest message
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `643d94c51188b6a147ba8d6abc8d16e485eca9c9`
- **Data de commit:** 2026-10-07 01:54 BRT · `2026-10-07T04:54:38.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Corrige o corte da última mensagem nas salas, ancora editar/excluir/cancelar em um popover animado acima da mensagem selecionada e remove o aviso de nova mensagem assim que o usuário rola manualmente até o fim da conversa.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/643d94c51188b6a147ba8d6abc8d16e485eca9c9)

#### 115. 01:25 BRT — [`8e7c3b091e`](https://github.com/luizcordeiro155/Enturma/commit/8e7c3b091efa252408acf9653a5ea97d60f76193)

- **O que foi feito (mensagem do commit):** fix(chat): polish message cards, quiet active notifications and add mobile actions
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8e7c3b091efa252408acf9653a5ea97d60f76193`
- **Data de commit:** 2026-10-07 01:25 BRT · `2026-10-07T04:25:40.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Refina cards de mensagens, corrige corte do compositor, silencia aviso inline quando o chat privado já está no fim e adiciona editar/excluir por pressão longa no mobile, incluindo suporte da API para mensagens privadas.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8e7c3b091efa252408acf9653a5ea97d60f76193)

#### 116. 01:14 BRT — [`b033dada83`](https://github.com/luizcordeiro155/Enturma/commit/b033dada8356f7a193f7b7c46d91f64026337459)

- **O que foi feito (mensagem do commit):** fix(ime): stabilize all mobile text fields and multiline chat
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `b033dada8356f7a193f7b7c46d91f64026337459`
- **Data de commit:** 2026-10-07 01:14 BRT · `2026-10-07T04:14:56.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Generaliza o resize nativo do WebView para campos de texto, mantém campos focados visíveis acima do teclado e faz Enter no mobile inserir nova linha nos chats privado e de salas.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/b033dada8356f7a193f7b7c46d91f64026337459)

#### 117. 01:01 BRT — [`e851a4bef9`](https://github.com/luizcordeiro155/Enturma/commit/e851a4bef9496added2e80ad377f19bd8885b587)

- **O que foi feito (mensagem do commit):** fix(chat): finalize mobile composer spacing and private images
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `e851a4bef9496added2e80ad377f19bd8885b587`
- **Data de commit:** 2026-10-07 01:01 BRT · `2026-10-07T04:01:36.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Mantém o placeholder das salas compacto, remove espaçamento residual abaixo do compositor privado no Android e converte anexos cifrados para Base64 em blocos seguros para evitar Maximum call stack size exceeded.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e851a4bef9496added2e80ad377f19bd8885b587)

#### 118. 00:46 BRT — [`d9ebe9cb2d`](https://github.com/luizcordeiro155/Enturma/commit/d9ebe9cb2dec4e4e5c1341dd7791ffc8d2e542d2)

- **O que foi feito (mensagem do commit):** fix(vercel): restore room chat IME import
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d9ebe9cb2dec4e4e5c1341dd7791ffc8d2e542d2`
- **Data de commit:** 2026-10-07 00:46 BRT · `2026-10-07T03:46:56.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Adiciona o import ausente de setNativeChatComposerFocused em room-chat.tsx para corrigir TS2304 no build de produção.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d9ebe9cb2dec4e4e5c1341dd7791ffc8d2e542d2)

#### 119. 00:45 BRT — [`565ba87c4a`](https://github.com/luizcordeiro155/Enturma/commit/565ba87c4a91cd421ffc34a181d151b81885d283)

- **O que foi feito (mensagem do commit):** fix(vercel): unblock production deploys
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `565ba87c4a91cd421ffc34a181d151b81885d283`
- **Data de commit:** 2026-10-07 00:45 BRT · `2026-10-07T03:45:11.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Remove atualização síncrona de estado React disparada por clearMedia dentro de effects, mantendo a limpeza de mídia e derivando a tela ativa sem violar react-hooks/set-state-in-effect.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/565ba87c4a91cd421ffc34a181d151b81885d283)

#### 120. 00:38 BRT — [`fef9048241`](https://github.com/luizcordeiro155/Enturma/commit/fef9048241772b3a3cb3e36ff742db798a9f5189)

- **O que foi feito (mensagem do commit):** fix(android): resize chat viewport above IME
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `fef9048241772b3a3cb3e36ff742db798a9f5189`
- **Data de commit:** 2026-10-07 00:38 BRT · `2026-10-07T03:38:10.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Redimensiona nativamente a WebView até o topo do teclado somente quando o compositor de chat está focado, transforma o privado em tela dedicada e mantém o composer das salas acima do IME sem fechar o teclado. Android 0.3.29 (versionCode 32).
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/fef9048241772b3a3cb3e36ff742db798a9f5189)

#### 121. 00:32 BRT — [`a905ff0463`](https://github.com/luizcordeiro155/Enturma/commit/a905ff04630fd541556450308014aaf5069ad4d0)

- **O que foi feito (mensagem do commit):** fix(profile-call): restore crop editor and Discord-style screen share
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `a905ff04630fd541556450308014aaf5069ad4d0`
- **Data de commit:** 2026-10-07 00:32 BRT · `2026-10-07T03:32:30.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Corrige o ajuste de foto/banner após escolher imagem da galeria no WebView Android e altera a chamada para compartilhamento de tela selecionável: participante fica marcado, Ver tela abre o foco principal e ao parar de transmitir a visualização é removida.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a905ff04630fd541556450308014aaf5069ad4d0)

#### 122. 00:25 BRT — [`0fea2a4075`](https://github.com/luizcordeiro155/Enturma/commit/0fea2a40759b8b381c14109f8506d3900e252c47)

- **O que foi feito (mensagem do commit):** fix(mobile): lock chats to dedicated conversation viewports
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `0fea2a40759b8b381c14109f8506d3900e252c47`
- **Data de commit:** 2026-10-07 00:25 BRT · `2026-10-07T03:25:55.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Transforma conversas privadas em tela própria no mobile, prende o compositor ao chat, mantém o teclado ativo após envio e reestrutura o chat das salas como uma conversa de grupo com histórico rolável e campo fixo no rodapé.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/0fea2a40759b8b381c14109f8506d3900e252c47)


### 06/10/2026 — 21 commit(s)

#### 123. 23:58 BRT — [`36a70d1780`](https://github.com/luizcordeiro155/Enturma/commit/36a70d1780cd1874574a3624a5a2ccd320687acf)

- **O que foi feito (mensagem do commit):** fix(mobile): stabilize keyboard and unify chat composer
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `36a70d1780cd1874574a3624a5a2ccd320687acf`
- **Data de commit:** 2026-10-06 23:58 BRT · `2026-10-07T02:58:33.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Remove loops concorrentes de visualViewport/IME, unifica os compositores de salas e conversas privadas, adiciona emoji/imagem/prévia, suporte E2E a anexos privados e permissões nativas de galeria. Publica Android 0.3.28 (versionCode 31).
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/36a70d1780cd1874574a3624a5a2ccd320687acf)

#### 124. 23:22 BRT — [`1986b3a9bf`](https://github.com/luizcordeiro155/Enturma/commit/1986b3a9bfbb2b2160a53962f880eacfcbcfaccc)

- **O que foi feito (mensagem do commit):** fix(android): keep only chat composer above IME
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `1986b3a9bfbb2b2160a53962f880eacfcbcfaccc`
- **Data de commit:** 2026-10-06 23:22 BRT · `2026-10-07T02:22:07.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Corrige o shell Android para não reduzir o WebView inteiro quando o teclado abre, move apenas os campos de chat acima do IME, preserva o envio por Enter e mantém o foco nas salas. Publica Android 0.3.27 (versionCode 30).
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/1986b3a9bfbb2b2160a53962f880eacfcbcfaccc)

#### 125. 23:08 BRT — [`00a86efdf4`](https://github.com/luizcordeiro155/Enturma/commit/00a86efdf406e46945d8daf031c10f48674fceec)

- **O que foi feito (mensagem do commit):** fix(mobile): keep chats attached to Android keyboard
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `00a86efdf406e46945d8daf031c10f48674fceec`
- **Data de commit:** 2026-10-06 23:08 BRT · `2026-10-07T02:08:50.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Reaproveita a detecção do IME das salas nos chats privados, fixa os compositores acima do teclado e mantém salas/chats acompanhando as últimas mensagens durante a digitação e envio.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/00a86efdf406e46945d8daf031c10f48674fceec)

#### 126. 22:52 BRT — [`26bc202743`](https://github.com/luizcordeiro155/Enturma/commit/26bc2027433963041c941cb16a6971ca5808793b)

- **O que foi feito (mensagem do commit):** fix(theme): repair dark mode globally
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `26bc2027433963041c941cb16a6971ca5808793b`
- **Data de commit:** 2026-10-06 22:52 BRT · `2026-10-07T01:52:30.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Adiciona uma camada global carregada por último para corrigir superfícies claras legadas, contraste de cards, botões, formulários, tabelas, modais e módulos acadêmicos no modo escuro, preservando acentos e componentes específicos.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/26bc2027433963041c941cb16a6971ca5808793b)

#### 127. 22:46 BRT — [`a7ef783186`](https://github.com/luizcordeiro155/Enturma/commit/a7ef7831866f417e9b210c3a3cbe61c9abbde43c)

- **O que foi feito (mensagem do commit):** fix(chat): follow latest messages and repair dark mode
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `a7ef7831866f417e9b210c3a3cbe61c9abbde43c`
- **Data de commit:** 2026-10-06 22:46 BRT · `2026-10-07T01:46:53.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Abre chats privados nas mensagens mais recentes, guia o usuário ao compositor, acompanha novos envios automaticamente e corrige contraste no modo escuro da área de conversas.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a7ef7831866f417e9b210c3a3cbe61c9abbde43c)

#### 128. 19:34 BRT — [`6ce10b9ee8`](https://github.com/luizcordeiro155/Enturma/commit/6ce10b9ee8517486e23f5d85ce7c00726d4fb747)

- **O que foi feito (mensagem do commit):** feat(auth): add theme selector and fix dark legal footer
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `6ce10b9ee8517486e23f5d85ce7c00726d4fb747`
- **Data de commit:** 2026-10-06 19:34 BRT · `2026-10-06T22:34:42.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Adiciona seletor Claro/Escuro/Sistema às telas de autenticação usando a mesma preferência do Enturma e mantém o rodapé legal transparente sobre a faixa verde no tema escuro.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/6ce10b9ee8517486e23f5d85ce7c00726d4fb747)

#### 129. 18:45 BRT — [`f050e190d1`](https://github.com/luizcordeiro155/Enturma/commit/f050e190d1ab4a30a1f07c795b87a2b91c4f1846)

- **O que foi feito (mensagem do commit):** fix(rides): correct address focus and current location
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f050e190d1ab4a30a1f07c795b87a2b91c4f1846`
- **Data de commit:** 2026-10-06 18:45 BRT · `2026-10-06T21:45:26.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Remove o contorno azul duplicado do campo de endereço e melhora o reverse geocoding para rua/número e estabelecimentos.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f050e190d1ab4a30a1f07c795b87a2b91c4f1846)

#### 130. 18:26 BRT — [`9c0b65c7c7`](https://github.com/luizcordeiro155/Enturma/commit/9c0b65c7c763ec251c4f7d459866d3bda086707a)

- **O que foi feito (mensagem do commit):** fix(web): close mobile portfolio CSS block
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `9c0b65c7c763ec251c4f7d459866d3bda086707a`
- **Data de commit:** 2026-10-06 18:26 BRT · `2026-10-06T21:26:39.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9c0b65c7c763ec251c4f7d459866d3bda086707a)

#### 131. 18:22 BRT — [`4f298a1f46`](https://github.com/luizcordeiro155/Enturma/commit/4f298a1f462b71f998453ee220b67aa48cf396ca)

- **O que foi feito (mensagem do commit):** fix(mobile): protect every surface from Android system bars
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `4f298a1f462b71f998453ee220b67aa48cf396ca`
- **Data de commit:** 2026-10-06 18:22 BRT · `2026-10-06T21:22:39.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4f298a1f462b71f998453ee220b67aa48cf396ca)

#### 132. 18:12 BRT — [`6ec5561e5c`](https://github.com/luizcordeiro155/Enturma/commit/6ec5561e5c750013fa3581881664905e9b625aab)

- **O que foi feito (mensagem do commit):** feat(legal): add privacy policy and terms of use
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `6ec5561e5c750013fa3581881664905e9b625aab`
- **Data de commit:** 2026-10-06 18:12 BRT · `2026-10-06T21:12:00.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/6ec5561e5c750013fa3581881664905e9b625aab)

#### 133. 17:46 BRT — [`ba1645f6d6`](https://github.com/luizcordeiro155/Enturma/commit/ba1645f6d614d05de5561f0664eb33099d527cfb)

- **O que foi feito (mensagem do commit):** docs: refresh Enturma project presentation and status
- **Tipo:** Documentação · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `ba1645f6d614d05de5561f0664eb33099d527cfb`
- **Data de commit:** 2026-10-06 17:46 BRT · `2026-10-06T20:46:45.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/ba1645f6d614d05de5561f0664eb33099d527cfb)

#### 134. 16:49 BRT — [`76e7092524`](https://github.com/luizcordeiro155/Enturma/commit/76e7092524901a8965c336a24e2b5fed49ca521a)

- **O que foi feito (mensagem do commit):** fix(rides): remove duplicate focus ring from place search
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `76e7092524901a8965c336a24e2b5fed49ca521a`
- **Data de commit:** 2026-10-06 16:49 BRT · `2026-10-06T19:49:18.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/76e7092524901a8965c336a24e2b5fed49ca521a)

#### 135. 16:47 BRT — [`8504d4f773`](https://github.com/luizcordeiro155/Enturma/commit/8504d4f773b7fef52f51ab6df392f387a02484a8)

- **O que foi feito (mensagem do commit):** fix(rides): simplify search field copy
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8504d4f773b7fef52f51ab6df392f387a02484a8`
- **Data de commit:** 2026-10-06 16:47 BRT · `2026-10-06T19:47:58.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8504d4f773b7fef52f51ab6df392f387a02484a8)

#### 136. 16:47 BRT — [`ac6aa6353f`](https://github.com/luizcordeiro155/Enturma/commit/ac6aa6353f03d9fda0744cf2e1c16fc46bedb0b7)

- **O que foi feito (mensagem do commit):** fix(rides): improve place search ranking
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `ac6aa6353f03d9fda0744cf2e1c16fc46bedb0b7`
- **Data de commit:** 2026-10-06 16:47 BRT · `2026-10-06T19:47:42.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/ac6aa6353f03d9fda0744cf2e1c16fc46bedb0b7)

#### 137. 16:25 BRT — [`caa2331511`](https://github.com/luizcordeiro155/Enturma/commit/caa23315116dbfa0b836e6cdc5b7756b3dddff4b)

- **O que foi feito (mensagem do commit):** fix(rides): compile unified nearby search ordering
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `caa23315116dbfa0b836e6cdc5b7756b3dddff4b`
- **Data de commit:** 2026-10-06 16:25 BRT · `2026-10-06T19:25:54.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/caa23315116dbfa0b836e6cdc5b7756b3dddff4b)

#### 138. 16:23 BRT — [`ebe28c963d`](https://github.com/luizcordeiro155/Enturma/commit/ebe28c963df86d9ff3188ad9845a6d0fa820347b)

- **O que foi feito (mensagem do commit):** feat(rides): unify address and nearby place search
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `ebe28c963df86d9ff3188ad9845a6d0fa820347b`
- **Data de commit:** 2026-10-06 16:23 BRT · `2026-10-06T19:23:15.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/ebe28c963df86d9ff3188ad9845a6d0fa820347b)

#### 139. 15:49 BRT — [`eacb401bd3`](https://github.com/luizcordeiro155/Enturma/commit/eacb401bd36f4da4cb4df5cc1716e49b04b7eb67)

- **O que foi feito (mensagem do commit):** fix(rides): use residential geocoder without rate-limit spam
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `eacb401bd36f4da4cb4df5cc1716e49b04b7eb67`
- **Data de commit:** 2026-10-06 15:49 BRT · `2026-10-06T18:49:25.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/eacb401bd36f4da4cb4df5cc1716e49b04b7eb67)

#### 140. 15:35 BRT — [`b3336fb07b`](https://github.com/luizcordeiro155/Enturma/commit/b3336fb07bb316ba943b087804a0f85802165b01)

- **O que foi feito (mensagem do commit):** fix(rides): require exact house-number geocoding
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `b3336fb07bb316ba943b087804a0f85802165b01`
- **Data de commit:** 2026-10-06 15:35 BRT · `2026-10-06T18:35:57.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/b3336fb07bb316ba943b087804a0f85802165b01)

#### 141. 15:29 BRT — [`cc662c191f`](https://github.com/luizcordeiro155/Enturma/commit/cc662c191fc326f5533860e152b760aca7d25d22)

- **O que foi feito (mensagem do commit):** feat(rides): use street and house number for precise pickup
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `cc662c191fc326f5533860e152b760aca7d25d22`
- **Data de commit:** 2026-10-06 15:29 BRT · `2026-10-06T18:29:28.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/cc662c191fc326f5533860e152b760aca7d25d22)

#### 142. 11:43 BRT — [`d71912bd00`](https://github.com/luizcordeiro155/Enturma/commit/d71912bd00e43dfc9e5a9280f7e1e67ae38cab1f)

- **O que foi feito (mensagem do commit):** fix(rides): remove ghost passenger search dock
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d71912bd00e43dfc9e5a9280f7e1e67ae38cab1f`
- **Data de commit:** 2026-10-06 11:43 BRT · `2026-10-06T14:43:47.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d71912bd00e43dfc9e5a9280f7e1e67ae38cab1f)

#### 143. 00:28 BRT — [`d6a3b215b5`](https://github.com/luizcordeiro155/Enturma/commit/d6a3b215b523f383116e75c854aebf7bdede761e)

- **O que foi feito (mensagem do commit):** fix(rides): confirm boarding without refresh and prioritize active trip
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d6a3b215b523f383116e75c854aebf7bdede761e`
- **Data de commit:** 2026-10-06 00:28 BRT · `2026-10-06T03:28:50.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d6a3b215b523f383116e75c854aebf7bdede761e)


### 05/10/2026 — 9 commit(s)

#### 144. 23:57 BRT — [`7bbbf546e8`](https://github.com/luizcordeiro155/Enturma/commit/7bbbf546e823a2327e6a502826dc2e0398070b93)

- **O que foi feito (mensagem do commit):** fix(rides): stabilize post-match React effects
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `7bbbf546e823a2327e6a502826dc2e0398070b93`
- **Data de commit:** 2026-10-05 23:57 BRT · `2026-10-06T02:57:58.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/7bbbf546e823a2327e6a502826dc2e0398070b93)

#### 145. 23:57 BRT — [`cc42dd887b`](https://github.com/luizcordeiro155/Enturma/commit/cc42dd887baf44f8deb4a2ee5d144c0bd6bfe919)

- **O que foi feito (mensagem do commit):** feat(rides): finalize post-match tracking and boarding flow
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `cc42dd887baf44f8deb4a2ee5d144c0bd6bfe919`
- **Data de commit:** 2026-10-05 23:57 BRT · `2026-10-06T02:57:01.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/cc42dd887baf44f8deb4a2ee5d144c0bd6bfe919)

#### 146. 23:15 BRT — [`93499b56f9`](https://github.com/luizcordeiro155/Enturma/commit/93499b56f9218faa5d7ddf4df902b0378c5cd9db)

- **O que foi feito (mensagem do commit):** feat: finalizar Caronas com navegação própria e UX responsiva
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `93499b56f9218faa5d7ddf4df902b0378c5cd9db`
- **Data de commit:** 2026-10-05 23:15 BRT · `2026-10-06T02:15:34.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Consolida fluxo funcional de solicitação, navegação exclusiva de Caronas, perfis Passageiro/Motorista, cadastro de veículo, responsividade mobile/desktop e correções de atualização realtime.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/93499b56f9218faa5d7ddf4df902b0378c5cd9db)

#### 147. 22:46 BRT — [`61e7744ffc`](https://github.com/luizcordeiro155/Enturma/commit/61e7744ffce928b1f7a2eedcdadb1982ec1827b1)

- **O que foi feito (mensagem do commit):** fix: liberar Carona com localização manual do campus
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `61e7744ffce928b1f7a2eedcdadb1982ec1827b1`
- **Data de commit:** 2026-10-05 22:46 BRT · `2026-10-06T01:46:24.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Permite confirmar o ponto da faculdade no mapa/endereço quando o catálogo não possui coordenadas, liberando rotas casa-faculdade nos modos passageiro e motorista.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/61e7744ffce928b1f7a2eedcdadb1982ec1827b1)

#### 148. 22:34 BRT — [`c773f9eda2`](https://github.com/luizcordeiro155/Enturma/commit/c773f9eda222055ebf2f6dc204279232a6c31804)

- **O que foi feito (mensagem do commit):** fix: estabilizar Caronas no celular e desktop
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `c773f9eda222055ebf2f6dc204279232a6c31804`
- **Data de commit:** 2026-10-05 22:34 BRT · `2026-10-06T01:34:57.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Corrige contraste, responsividade, controles ocultos e localização ausente de campus no fluxo de Caronas.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/c773f9eda222055ebf2f6dc204279232a6c31804)

#### 149. 22:11 BRT — [`2c6d8a4b91`](https://github.com/luizcordeiro155/Enturma/commit/2c6d8a4b9121cb51882ae4d4b2c3e1c5e949a281)

- **O que foi feito (mensagem do commit):** feat: finalizar mobilidade universitária de Caronas
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `2c6d8a4b9121cb51882ae4d4b2c3e1c5e949a281`
- **Data de commit:** 2026-10-05 22:11 BRT · `2026-10-06T01:11:36.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Entrega consolidada do novo sistema de Caronas do Enturma, validado em Web, Mobile typecheck, backend e deploy de QA.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/2c6d8a4b9121cb51882ae4d4b2c3e1c5e949a281)

#### 150. 18:38 BRT — [`5e7cc4b103`](https://github.com/luizcordeiro155/Enturma/commit/5e7cc4b10351edbf2e1e6ce78a01e323247178a1)

- **O que foi feito (mensagem do commit):** chore(squarecloud): trigger automatic GitHub deploy
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `5e7cc4b10351edbf2e1e6ce78a01e323247178a1`
- **Data de commit:** 2026-10-05 18:38 BRT · `2026-10-05T21:38:36.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/5e7cc4b10351edbf2e1e6ce78a01e323247178a1)

#### 151. 18:35 BRT — [`e8b7fb1617`](https://github.com/luizcordeiro155/Enturma/commit/e8b7fb161754d1fc3b307f87508f061842086acc)

- **O que foi feito (mensagem do commit):** chore(squarecloud): trigger Git sync redeploy
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `e8b7fb161754d1fc3b307f87508f061842086acc`
- **Data de commit:** 2026-10-05 18:35 BRT · `2026-10-05T21:35:40.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e8b7fb161754d1fc3b307f87508f061842086acc)

#### 152. 13:30 BRT — [`14d1ba1c17`](https://github.com/luizcordeiro155/Enturma/commit/14d1ba1c174dd278ed7d101af7219a908d8dde89)

- **O que foi feito (mensagem do commit):** feat(rides): evolve Enturma Caronas into university mobility
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `14d1ba1c174dd278ed7d101af7219a908d8dde89`
- **Data de commit:** 2026-10-05 13:30 BRT · `2026-10-05T16:30:20.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Implements automatic OFFER/REQUEST matching, transparent route compatibility, waitlist, full trip lifecycle, participant confirmation, boarding PIN, multi-passenger stop ordering, recurring rides, vehicle and reputation profiles, official campus pickup zones, temporary consent-based live location, trusted-contact safety sharing, no-show handling, responsive Web/Desktop/Android flows, native geolocation permissions, and JavaScript-driven animations with reduced-motion support.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/14d1ba1c174dd278ed7d101af7219a908d8dde89)


### 04/10/2026 — 9 commit(s)

#### 153. 16:57 BRT — [`4a4d441d4e`](https://github.com/luizcordeiro155/Enturma/commit/4a4d441d4ec7069ce35700db9bf4149510f4a1aa)

- **O que foi feito (mensagem do commit):** Restore Salas in mobile bottom navigation
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `4a4d441d4ec7069ce35700db9bf4149510f4a1aa`
- **Data de commit:** 2026-10-04 16:57 BRT · `2026-10-04T19:57:37.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4a4d441d4ec7069ce35700db9bf4149510f4a1aa)

#### 154. 16:40 BRT — [`a5e1ad0de4`](https://github.com/luizcordeiro155/Enturma/commit/a5e1ad0de4021e646162906796f1f9fb2c4f8a43)

- **O que foi feito (mensagem do commit):** Bump Desktop after removing agenda and professor modules
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `a5e1ad0de4021e646162906796f1f9fb2c4f8a43`
- **Data de commit:** 2026-10-04 16:40 BRT · `2026-10-04T19:40:56.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a5e1ad0de4021e646162906796f1f9fb2c4f8a43)

#### 155. 16:40 BRT — [`68f3d4bb84`](https://github.com/luizcordeiro155/Enturma/commit/68f3d4bb84a403ea6080013168bdde2d069ca164)

- **O que foi feito (mensagem do commit):** Bump Android build after feature removal
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `68f3d4bb84a403ea6080013168bdde2d069ca164`
- **Data de commit:** 2026-10-04 16:40 BRT · `2026-10-04T19:40:53.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/68f3d4bb84a403ea6080013168bdde2d069ca164)

#### 156. 16:40 BRT — [`69df6f78fb`](https://github.com/luizcordeiro155/Enturma/commit/69df6f78fba631334d0f23793768bb548551c8eb)

- **O que foi feito (mensagem do commit):** Bump Android after removing agenda and professor modules
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `69df6f78fba631334d0f23793768bb548551c8eb`
- **Data de commit:** 2026-10-04 16:40 BRT · `2026-10-04T19:40:50.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/69df6f78fba631334d0f23793768bb548551c8eb)

#### 157. 16:39 BRT — [`e3a66da554`](https://github.com/luizcordeiro155/Enturma/commit/e3a66da554722bd01efac7e201e75b5d1fb83f38)

- **O que foi feito (mensagem do commit):** Fix realtime event type after feature removal
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `e3a66da554722bd01efac7e201e75b5d1fb83f38`
- **Data de commit:** 2026-10-04 16:39 BRT · `2026-10-04T19:39:15.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e3a66da554722bd01efac7e201e75b5d1fb83f38)

#### 158. 16:38 BRT — [`28d70f8fa1`](https://github.com/luizcordeiro155/Enturma/commit/28d70f8fa10299a96f7069f64eaca94862f3e4e5)

- **O que foi feito (mensagem do commit):** Remove Hoje / Agenda e Turmas / Professor
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `28d70f8fa10299a96f7069f64eaca94862f3e4e5`
- **Data de commit:** 2026-10-04 16:38 BRT · `2026-10-04T19:38:35.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Remove completamente as duas superfícies da Web e dos apps, elimina rotas, navegação, componentes e controladores dedicados, sem reutilizar ou substituir por novos recursos.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/28d70f8fa10299a96f7069f64eaca94862f3e4e5)

#### 159. 13:36 BRT — [`3bd217da12`](https://github.com/luizcordeiro155/Enturma/commit/3bd217da12792fd6bf58d24339add4a80411a316)

- **O que foi feito (mensagem do commit):** Enturma Final Polish / QA follow-up
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `3bd217da12792fd6bf58d24339add4a80411a316`
- **Data de commit:** 2026-10-04 13:36 BRT · `2026-10-04T16:36:25.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Finaliza o polish sem recursos novos: reduz polling redundante de caronas com realtime saudável e alinha a barra de chamada Android aos temas e preferências de acessibilidade.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/3bd217da12792fd6bf58d24339add4a80411a316)

#### 160. 01:33 BRT — [`1eb55dfedf`](https://github.com/luizcordeiro155/Enturma/commit/1eb55dfedf1419bbce8b954d1a7d56df96d55e6e)

- **O que foi feito (mensagem do commit):** Enturma Final Polish / QA
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `1eb55dfedf1419bbce8b954d1a7d56df96d55e6e`
- **Data de commit:** 2026-10-04 01:33 BRT · `2026-10-04T04:33:58.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/1eb55dfedf1419bbce8b954d1a7d56df96d55e6e)

#### 161. 01:02 BRT — [`2295ccc007`](https://github.com/luizcordeiro155/Enturma/commit/2295ccc00712a47012cb97b1ef2f1d9625038c40)

- **O que foi feito (mensagem do commit):** Enturma Stabilization / Polish
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `2295ccc00712a47012cb97b1ef2f1d9625038c40`
- **Data de commit:** 2026-10-04 01:02 BRT · `2026-10-04T04:02:13.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/2295ccc00712a47012cb97b1ef2f1d9625038c40)


### 03/10/2026 — 140 commit(s)

#### 162. 22:04 BRT — [`d08972c492`](https://github.com/luizcordeiro155/Enturma/commit/d08972c49267801feeda20965bddbb9a805669b8)

- **O que foi feito (mensagem do commit):** feat: redesign Today Agenda across web desktop and mobile
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d08972c49267801feeda20965bddbb9a805669b8`
- **Data de commit:** 2026-10-03 22:04 BRT · `2026-10-04T01:04:00.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d08972c49267801feeda20965bddbb9a805669b8)

#### 163. 21:34 BRT — [`8e8250806b`](https://github.com/luizcordeiro155/Enturma/commit/8e8250806b7782bff4043c1c075249555240d3b1)

- **O que foi feito (mensagem do commit):** feat: unify student suite design and harden classroom flows
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8e8250806b7782bff4043c1c075249555240d3b1`
- **Data de commit:** 2026-10-03 21:34 BRT · `2026-10-04T00:34:34.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8e8250806b7782bff4043c1c075249555240d3b1)

#### 164. 21:25 BRT — [`4d62381d59`](https://github.com/luizcordeiro155/Enturma/commit/4d62381d59dadfd3a6ed872ac25b9edc89ba8701)

- **O que foi feito (mensagem do commit):** fix: expose portfolio and teacher pages in mobile More menu
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `4d62381d59dadfd3a6ed872ac25b9edc89ba8701`
- **Data de commit:** 2026-10-03 21:25 BRT · `2026-10-04T00:25:07.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4d62381d59dadfd3a6ed872ac25b9edc89ba8701)

#### 165. 21:11 BRT — [`e0506e8e02`](https://github.com/luizcordeiro155/Enturma/commit/e0506e8e0267483a4482a6302da73e42125e2c8f)

- **O que foi feito (mensagem do commit):** fix: make realtime updates invisible and event-driven
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `e0506e8e0267483a4482a6302da73e42125e2c8f`
- **Data de commit:** 2026-10-03 21:11 BRT · `2026-10-04T00:11:54.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e0506e8e0267483a4482a6302da73e42125e2c8f)

#### 166. 21:11 BRT — [`e2c975b296`](https://github.com/luizcordeiro155/Enturma/commit/e2c975b2965c5e2fc8d93e155012db4878035403)

- **O que foi feito (mensagem do commit):** fix: make realtime updates invisible and event-driven
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `e2c975b2965c5e2fc8d93e155012db4878035403`
- **Data de commit:** 2026-10-03 21:11 BRT · `2026-10-04T00:11:52.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e2c975b2965c5e2fc8d93e155012db4878035403)

#### 167. 21:11 BRT — [`57b6f2783e`](https://github.com/luizcordeiro155/Enturma/commit/57b6f2783e4aef1314172a49daedf92c03648c9c)

- **O que foi feito (mensagem do commit):** fix: make realtime updates invisible and event-driven
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `57b6f2783e4aef1314172a49daedf92c03648c9c`
- **Data de commit:** 2026-10-03 21:11 BRT · `2026-10-04T00:11:49.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/57b6f2783e4aef1314172a49daedf92c03648c9c)

#### 168. 21:11 BRT — [`e927576366`](https://github.com/luizcordeiro155/Enturma/commit/e9275763661814be8b0fd422ef8b1b82ed163c27)

- **O que foi feito (mensagem do commit):** fix: make realtime updates invisible and event-driven
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `e9275763661814be8b0fd422ef8b1b82ed163c27`
- **Data de commit:** 2026-10-03 21:11 BRT · `2026-10-04T00:11:47.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e9275763661814be8b0fd422ef8b1b82ed163c27)

#### 169. 21:11 BRT — [`3a4c777de9`](https://github.com/luizcordeiro155/Enturma/commit/3a4c777de9f15eabe0d42d2379ddcefa5251747f)

- **O que foi feito (mensagem do commit):** fix: make realtime updates invisible and event-driven
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `3a4c777de9f15eabe0d42d2379ddcefa5251747f`
- **Data de commit:** 2026-10-03 21:11 BRT · `2026-10-04T00:11:45.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/3a4c777de9f15eabe0d42d2379ddcefa5251747f)

#### 170. 21:11 BRT — [`bb90cb789f`](https://github.com/luizcordeiro155/Enturma/commit/bb90cb789f948473de1f81a74c17f7d136f46a5f)

- **O que foi feito (mensagem do commit):** fix: make realtime updates invisible and event-driven
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `bb90cb789f948473de1f81a74c17f7d136f46a5f`
- **Data de commit:** 2026-10-03 21:11 BRT · `2026-10-04T00:11:42.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/bb90cb789f948473de1f81a74c17f7d136f46a5f)

#### 171. 21:02 BRT — [`7b3d3251df`](https://github.com/luizcordeiro155/Enturma/commit/7b3d3251df4c880eae3a1ec802710fb61f4f2ba2)

- **O que foi feito (mensagem do commit):** release: updater recovery mobile 0.3.21 desktop 0.3.10
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `7b3d3251df4c880eae3a1ec802710fb61f4f2ba2`
- **Data de commit:** 2026-10-03 21:02 BRT · `2026-10-04T00:02:23.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/7b3d3251df4c880eae3a1ec802710fb61f4f2ba2)

#### 172. 21:02 BRT — [`326d76d738`](https://github.com/luizcordeiro155/Enturma/commit/326d76d738f2795ef059cda450aae48cf9e432e5)

- **O que foi feito (mensagem do commit):** release: updater recovery mobile 0.3.21 desktop 0.3.10
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `326d76d738f2795ef059cda450aae48cf9e432e5`
- **Data de commit:** 2026-10-03 21:02 BRT · `2026-10-04T00:02:20.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/326d76d738f2795ef059cda450aae48cf9e432e5)

#### 173. 21:02 BRT — [`879912ae8d`](https://github.com/luizcordeiro155/Enturma/commit/879912ae8dbd36cdc9b8efac471871a657568f99)

- **O que foi feito (mensagem do commit):** release: updater recovery mobile 0.3.21 desktop 0.3.10
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `879912ae8dbd36cdc9b8efac471871a657568f99`
- **Data de commit:** 2026-10-03 21:02 BRT · `2026-10-04T00:02:16.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/879912ae8dbd36cdc9b8efac471871a657568f99)

#### 174. 21:02 BRT — [`5f288b4de2`](https://github.com/luizcordeiro155/Enturma/commit/5f288b4de2aaf1fa3a4c0fbaa1b7cb6f2d8d641f)

- **O que foi feito (mensagem do commit):** release: updater recovery mobile 0.3.21 desktop 0.3.10
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `5f288b4de2aaf1fa3a4c0fbaa1b7cb6f2d8d641f`
- **Data de commit:** 2026-10-03 21:02 BRT · `2026-10-04T00:02:14.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/5f288b4de2aaf1fa3a4c0fbaa1b7cb6f2d8d641f)

#### 175. 21:02 BRT — [`46678bb146`](https://github.com/luizcordeiro155/Enturma/commit/46678bb1467ecb0f7afcf7711510dcdce3529d4a)

- **O que foi feito (mensagem do commit):** fix: allow retrying Android install after user cancellation
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `46678bb1467ecb0f7afcf7711510dcdce3529d4a`
- **Data de commit:** 2026-10-03 21:02 BRT · `2026-10-04T00:02:03.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/46678bb1467ecb0f7afcf7711510dcdce3529d4a)

#### 176. 21:01 BRT — [`58a3412609`](https://github.com/luizcordeiro155/Enturma/commit/58a34126097725ac62a2fd10a87e3e7ed856601f)

- **O que foi feito (mensagem do commit):** release: updater recovery mobile 0.3.20 desktop 0.3.9
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `58a34126097725ac62a2fd10a87e3e7ed856601f`
- **Data de commit:** 2026-10-03 21:01 BRT · `2026-10-04T00:01:03.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/58a34126097725ac62a2fd10a87e3e7ed856601f)

#### 177. 21:00 BRT — [`214895fe20`](https://github.com/luizcordeiro155/Enturma/commit/214895fe20002abe544d6a7a01b53ff8b92e41f8)

- **O que foi feito (mensagem do commit):** release: updater recovery mobile 0.3.20 desktop 0.3.9
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `214895fe20002abe544d6a7a01b53ff8b92e41f8`
- **Data de commit:** 2026-10-03 21:00 BRT · `2026-10-04T00:00:59.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/214895fe20002abe544d6a7a01b53ff8b92e41f8)

#### 178. 21:00 BRT — [`95fef2c3ef`](https://github.com/luizcordeiro155/Enturma/commit/95fef2c3ef2817b3584f64580883093b0f545651)

- **O que foi feito (mensagem do commit):** release: updater recovery mobile 0.3.20 desktop 0.3.9
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `95fef2c3ef2817b3584f64580883093b0f545651`
- **Data de commit:** 2026-10-03 21:00 BRT · `2026-10-04T00:00:56.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/95fef2c3ef2817b3584f64580883093b0f545651)

#### 179. 21:00 BRT — [`5f78cee73c`](https://github.com/luizcordeiro155/Enturma/commit/5f78cee73c3421ef12300f5fd6b4808ca3557e24)

- **O que foi feito (mensagem do commit):** release: updater recovery mobile 0.3.20 desktop 0.3.9
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `5f78cee73c3421ef12300f5fd6b4808ca3557e24`
- **Data de commit:** 2026-10-03 21:00 BRT · `2026-10-04T00:00:54.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/5f78cee73c3421ef12300f5fd6b4808ca3557e24)

#### 180. 21:00 BRT — [`a067182b98`](https://github.com/luizcordeiro155/Enturma/commit/a067182b9859cdb6a8eb6ef1d437a9957eef58dd)

- **O que foi feito (mensagem do commit):** fix: restore Android update action after cancelled install
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `a067182b9859cdb6a8eb6ef1d437a9957eef58dd`
- **Data de commit:** 2026-10-03 21:00 BRT · `2026-10-04T00:00:37.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a067182b9859cdb6a8eb6ef1d437a9957eef58dd)

#### 181. 20:59 BRT — [`a606ef1641`](https://github.com/luizcordeiro155/Enturma/commit/a606ef16416a0b949c2efc884a71c9b72993a7fb)

- **O que foi feito (mensagem do commit):** release: Enturma mobile 0.3.19 and desktop 0.3.8
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `a606ef16416a0b949c2efc884a71c9b72993a7fb`
- **Data de commit:** 2026-10-03 20:59 BRT · `2026-10-03T23:59:45.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a606ef16416a0b949c2efc884a71c9b72993a7fb)

#### 182. 20:59 BRT — [`f1853b0b45`](https://github.com/luizcordeiro155/Enturma/commit/f1853b0b45c41424b8997dd7b2189f59df1d3671)

- **O que foi feito (mensagem do commit):** release: Enturma mobile 0.3.19 and desktop 0.3.8
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f1853b0b45c41424b8997dd7b2189f59df1d3671`
- **Data de commit:** 2026-10-03 20:59 BRT · `2026-10-03T23:59:42.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f1853b0b45c41424b8997dd7b2189f59df1d3671)

#### 183. 20:59 BRT — [`4c05767ae1`](https://github.com/luizcordeiro155/Enturma/commit/4c05767ae1694eaab5be468ca7fe143bd8df4be9)

- **O que foi feito (mensagem do commit):** release: Enturma mobile 0.3.19 and desktop 0.3.8
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `4c05767ae1694eaab5be468ca7fe143bd8df4be9`
- **Data de commit:** 2026-10-03 20:59 BRT · `2026-10-03T23:59:39.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4c05767ae1694eaab5be468ca7fe143bd8df4be9)

#### 184. 20:59 BRT — [`0ff48af05a`](https://github.com/luizcordeiro155/Enturma/commit/0ff48af05a211310ce5d3f442dbc5cd2b35a1c66)

- **O que foi feito (mensagem do commit):** release: Enturma mobile 0.3.19 and desktop 0.3.8
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `0ff48af05a211310ce5d3f442dbc5cd2b35a1c66`
- **Data de commit:** 2026-10-03 20:59 BRT · `2026-10-03T23:59:36.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/0ff48af05a211310ce5d3f442dbc5cd2b35a1c66)

#### 185. 20:59 BRT — [`315daf3bd5`](https://github.com/luizcordeiro155/Enturma/commit/315daf3bd560c34f5d77bde4011d1d7c8daa02f5)

- **O que foi feito (mensagem do commit):** fix: let Android update resume after installer cancellation
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `315daf3bd560c34f5d77bde4011d1d7c8daa02f5`
- **Data de commit:** 2026-10-03 20:59 BRT · `2026-10-03T23:59:26.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/315daf3bd560c34f5d77bde4011d1d7c8daa02f5)

#### 186. 20:59 BRT — [`874730bf60`](https://github.com/luizcordeiro155/Enturma/commit/874730bf60ebf6623bc8e51a3c79813bbdf4128e)

- **O que foi feito (mensagem do commit):** fix: make desktop update checks manually retryable
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `874730bf60ebf6623bc8e51a3c79813bbdf4128e`
- **Data de commit:** 2026-10-03 20:59 BRT · `2026-10-03T23:59:06.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/874730bf60ebf6623bc8e51a3c79813bbdf4128e)

#### 187. 20:58 BRT — [`8ecb511b15`](https://github.com/luizcordeiro155/Enturma/commit/8ecb511b1507978cac0c38280908ab827b8cd6d9)

- **O que foi feito (mensagem do commit):** fix: make Android updater retryable and relaunch after install
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8ecb511b1507978cac0c38280908ab827b8cd6d9`
- **Data de commit:** 2026-10-03 20:58 BRT · `2026-10-03T23:58:55.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8ecb511b1507978cac0c38280908ab827b8cd6d9)

#### 188. 20:51 BRT — [`2925f232d8`](https://github.com/luizcordeiro155/Enturma/commit/2925f232d8f143506e0f5bae641dab69f2997e3f)

- **O que foi feito (mensagem do commit):** fix: keep mobile subjects section last on home
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `2925f232d8f143506e0f5bae641dab69f2997e3f`
- **Data de commit:** 2026-10-03 20:51 BRT · `2026-10-03T23:51:21.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/2925f232d8f143506e0f5bae641dab69f2997e3f)

#### 189. 20:40 BRT — [`72c2a5fcee`](https://github.com/luizcordeiro155/Enturma/commit/72c2a5fcee4e0b4db9b0384da9175303c741e595)

- **O que foi feito (mensagem do commit):** fix: defer installed app detection without effect cascade
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `72c2a5fcee4e0b4db9b0384da9175303c741e595`
- **Data de commit:** 2026-10-03 20:40 BRT · `2026-10-03T23:40:37.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/72c2a5fcee4e0b4db9b0384da9175303c741e595)

#### 190. 20:40 BRT — [`d5c46c0ed2`](https://github.com/luizcordeiro155/Enturma/commit/d5c46c0ed2f2c3eb1b7d890c13022ffbfe177a72)

- **O que foi feito (mensagem do commit):** fix: defer installed app detection without effect cascade
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d5c46c0ed2f2c3eb1b7d890c13022ffbfe177a72`
- **Data de commit:** 2026-10-03 20:40 BRT · `2026-10-03T23:40:34.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d5c46c0ed2f2c3eb1b7d890c13022ffbfe177a72)

#### 191. 20:37 BRT — [`b27b28c177`](https://github.com/luizcordeiro155/Enturma/commit/b27b28c177401cdb8267b9d96fe788eedbdff22f)

- **O que foi feito (mensagem do commit):** feat: refresh profile cards live after media changes
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `b27b28c177401cdb8267b9d96fe788eedbdff22f`
- **Data de commit:** 2026-10-03 20:37 BRT · `2026-10-03T23:37:37.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/b27b28c177401cdb8267b9d96fe788eedbdff22f)

#### 192. 20:37 BRT — [`ccf26a758d`](https://github.com/luizcordeiro155/Enturma/commit/ccf26a758d7e44bc1d1764c55c3fe703a1e5e451)

- **O que foi feito (mensagem do commit):** feat: broadcast profile media and enrollment changes
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `ccf26a758d7e44bc1d1764c55c3fe703a1e5e451`
- **Data de commit:** 2026-10-03 20:37 BRT · `2026-10-03T23:37:29.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/ccf26a758d7e44bc1d1764c55c3fe703a1e5e451)

#### 193. 20:37 BRT — [`ffe0267863`](https://github.com/luizcordeiro155/Enturma/commit/ffe0267863f9cf3d1c72b9da869394b95d3c968d)

- **O que foi feito (mensagem do commit):** fix: broadcast profile appearance changes
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `ffe0267863f9cf3d1c72b9da869394b95d3c968d`
- **Data de commit:** 2026-10-03 20:37 BRT · `2026-10-03T23:37:21.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/ffe0267863f9cf3d1c72b9da869394b95d3c968d)

#### 194. 20:35 BRT — [`e7076510a5`](https://github.com/luizcordeiro155/Enturma/commit/e7076510a56faab33a78e8e9d1be0648c287cada)

- **O que foi feito (mensagem do commit):** release: Enturma mobile 0.3.18 and desktop 0.3.7
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `e7076510a56faab33a78e8e9d1be0648c287cada`
- **Data de commit:** 2026-10-03 20:35 BRT · `2026-10-03T23:35:36.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e7076510a56faab33a78e8e9d1be0648c287cada)

#### 195. 20:35 BRT — [`b30be47dd7`](https://github.com/luizcordeiro155/Enturma/commit/b30be47dd73b287afca367175718daff3e00b7f4)

- **O que foi feito (mensagem do commit):** release: Enturma mobile 0.3.18 and desktop 0.3.7
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `b30be47dd73b287afca367175718daff3e00b7f4`
- **Data de commit:** 2026-10-03 20:35 BRT · `2026-10-03T23:35:33.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/b30be47dd73b287afca367175718daff3e00b7f4)

#### 196. 20:35 BRT — [`7c18b98bf1`](https://github.com/luizcordeiro155/Enturma/commit/7c18b98bf126906a18d56db1d25c9e671a753d2f)

- **O que foi feito (mensagem do commit):** release: Enturma mobile 0.3.18 and desktop 0.3.7
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `7c18b98bf126906a18d56db1d25c9e671a753d2f`
- **Data de commit:** 2026-10-03 20:35 BRT · `2026-10-03T23:35:30.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/7c18b98bf126906a18d56db1d25c9e671a753d2f)

#### 197. 20:35 BRT — [`ccce428697`](https://github.com/luizcordeiro155/Enturma/commit/ccce428697ef43b0019cae263228e742cd98a733)

- **O que foi feito (mensagem do commit):** release: Enturma mobile 0.3.18 and desktop 0.3.7
- **Tipo:** Release · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `ccce428697ef43b0019cae263228e742cd98a733`
- **Data de commit:** 2026-10-03 20:35 BRT · `2026-10-03T23:35:28.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/ccce428697ef43b0019cae263228e742cd98a733)

#### 198. 20:34 BRT — [`98d44ff651`](https://github.com/luizcordeiro155/Enturma/commit/98d44ff6515bce75a728417020240e24563becd3)

- **O que foi feito (mensagem do commit):** fix: avoid installed app hydration mismatch
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `98d44ff6515bce75a728417020240e24563becd3`
- **Data de commit:** 2026-10-03 20:34 BRT · `2026-10-03T23:34:39.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/98d44ff6515bce75a728417020240e24563becd3)

#### 199. 20:34 BRT — [`c5002baaa8`](https://github.com/luizcordeiro155/Enturma/commit/c5002baaa8370929232c92cb9c25f24ea8589628)

- **O que foi feito (mensagem do commit):** fix: hide download nav safely inside installed apps
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `c5002baaa8370929232c92cb9c25f24ea8589628`
- **Data de commit:** 2026-10-03 20:34 BRT · `2026-10-03T23:34:36.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/c5002baaa8370929232c92cb9c25f24ea8589628)

#### 200. 20:34 BRT — [`785e2455ab`](https://github.com/luizcordeiro155/Enturma/commit/785e2455abe563419fab8e21fafca26d1cc7cffe)

- **O que foi feito (mensagem do commit):** feat: start focus sessions with proactive AI guidance
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `785e2455abe563419fab8e21fafca26d1cc7cffe`
- **Data de commit:** 2026-10-03 20:34 BRT · `2026-10-03T23:34:23.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/785e2455abe563419fab8e21fafca26d1cc7cffe)

#### 201. 20:34 BRT — [`7562dd82ac`](https://github.com/luizcordeiro155/Enturma/commit/7562dd82ac0f357dc838c2e513fbb55ccccb4522)

- **O que foi feito (mensagem do commit):** fix: make proactive tutor effect stable
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `7562dd82ac0f357dc838c2e513fbb55ccccb4522`
- **Data de commit:** 2026-10-03 20:34 BRT · `2026-10-03T23:34:16.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/7562dd82ac0f357dc838c2e513fbb55ccccb4522)

#### 202. 20:34 BRT — [`47a2b12453`](https://github.com/luizcordeiro155/Enturma/commit/47a2b124534016dbf4ff4804162613129bc50934)

- **O que foi feito (mensagem do commit):** feat: let focus tutor proactively start teaching
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `47a2b124534016dbf4ff4804162613129bc50934`
- **Data de commit:** 2026-10-03 20:34 BRT · `2026-10-03T23:34:05.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/47a2b124534016dbf4ff4804162613129bc50934)

#### 203. 20:33 BRT — [`ec248ac7a4`](https://github.com/luizcordeiro155/Enturma/commit/ec248ac7a4d60b521adf4280df89ff88414157a5)

- **O que foi feito (mensagem do commit):** feat: refresh mobile friendships live
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `ec248ac7a4d60b521adf4280df89ff88414157a5`
- **Data de commit:** 2026-10-03 20:33 BRT · `2026-10-03T23:33:51.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/ec248ac7a4d60b521adf4280df89ff88414157a5)

#### 204. 20:33 BRT — [`f254d16b24`](https://github.com/luizcordeiro155/Enturma/commit/f254d16b24c2d866b1530f79c77d8afd0f4459d8)

- **O que foi feito (mensagem do commit):** feat: refresh friendships live
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f254d16b24c2d866b1530f79c77d8afd0f4459d8`
- **Data de commit:** 2026-10-03 20:33 BRT · `2026-10-03T23:33:48.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f254d16b24c2d866b1530f79c77d8afd0f4459d8)

#### 205. 20:33 BRT — [`c6e9fb7bc0`](https://github.com/luizcordeiro155/Enturma/commit/c6e9fb7bc03f7648c8a2f373706b1faf9e7ca54e)

- **O que foi feito (mensagem do commit):** feat: add realtime adaptive tutor to mobile focus
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `c6e9fb7bc03f7648c8a2f373706b1faf9e7ca54e`
- **Data de commit:** 2026-10-03 20:33 BRT · `2026-10-03T23:33:29.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/c6e9fb7bc03f7648c8a2f373706b1faf9e7ca54e)

#### 206. 20:33 BRT — [`2e767e3d25`](https://github.com/luizcordeiro155/Enturma/commit/2e767e3d2574065f5d66a640262c52388382ccf4)

- **O que foi feito (mensagem do commit):** feat: refresh mobile rooms in realtime
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `2e767e3d2574065f5d66a640262c52388382ccf4`
- **Data de commit:** 2026-10-03 20:33 BRT · `2026-10-03T23:33:13.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/2e767e3d2574065f5d66a640262c52388382ccf4)

#### 207. 20:33 BRT — [`f78e04c2b2`](https://github.com/luizcordeiro155/Enturma/commit/f78e04c2b2c263664fbbe66dc08f65177b9bbfef)

- **O que foi feito (mensagem do commit):** feat: expand teacher classrooms on mobile
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f78e04c2b2c263664fbbe66dc08f65177b9bbfef`
- **Data de commit:** 2026-10-03 20:33 BRT · `2026-10-03T23:33:00.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f78e04c2b2c263664fbbe66dc08f65177b9bbfef)

#### 208. 20:32 BRT — [`5c1901f309`](https://github.com/luizcordeiro155/Enturma/commit/5c1901f3096d84fdd300a79e70c5a1bc7fca45d7)

- **O que foi feito (mensagem do commit):** style: complete teacher student workspace
- **Tipo:** Estilo/UI · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `5c1901f3096d84fdd300a79e70c5a1bc7fca45d7`
- **Data de commit:** 2026-10-03 20:32 BRT · `2026-10-03T23:32:25.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/5c1901f3096d84fdd300a79e70c5a1bc7fca45d7)

#### 209. 20:32 BRT — [`46b080d444`](https://github.com/luizcordeiro155/Enturma/commit/46b080d444cc0ab598e4cd11e28766a94d1a9dfd)

- **O que foi feito (mensagem do commit):** feat: build complete teacher student classroom workspace
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `46b080d444cc0ab598e4cd11e28766a94d1a9dfd`
- **Data de commit:** 2026-10-03 20:32 BRT · `2026-10-03T23:32:09.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/46b080d444cc0ab598e4cd11e28766a94d1a9dfd)

#### 210. 20:31 BRT — [`47ef8c92e1`](https://github.com/luizcordeiro155/Enturma/commit/47ef8c92e1818663932b4eb3aaf87f0c80d5e16b)

- **O que foi feito (mensagem do commit):** feat: expand teacher classroom management
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `47ef8c92e1818663932b4eb3aaf87f0c80d5e16b`
- **Data de commit:** 2026-10-03 20:31 BRT · `2026-10-03T23:31:31.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/47ef8c92e1818663932b4eb3aaf87f0c80d5e16b)

#### 211. 20:31 BRT — [`7408b30b02`](https://github.com/luizcordeiro155/Enturma/commit/7408b30b02e9ba4ab99be0994e6b3ce9947c3efc)

- **O que foi feito (mensagem do commit):** feat: add teacher feedback and grading schema
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `7408b30b02e9ba4ab99be0994e6b3ce9947c3efc`
- **Data de commit:** 2026-10-03 20:31 BRT · `2026-10-03T23:31:10.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/7408b30b02e9ba4ab99be0994e6b3ce9947c3efc)

#### 212. 20:31 BRT — [`c8ee979def`](https://github.com/luizcordeiro155/Enturma/commit/c8ee979defd03d2d40e1402f96452b56e10d2e2b)

- **O que foi feito (mensagem do commit):** feat: broadcast friendship and profile changes
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `c8ee979defd03d2d40e1402f96452b56e10d2e2b`
- **Data de commit:** 2026-10-03 20:31 BRT · `2026-10-03T23:31:01.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/c8ee979defd03d2d40e1402f96452b56e10d2e2b)

#### 213. 20:30 BRT — [`9e2726847c`](https://github.com/luizcordeiro155/Enturma/commit/9e2726847c370fbfebd8f9f2d563387d4e0e83e0)

- **O que foi feito (mensagem do commit):** feat: refresh study rooms live on home
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `9e2726847c370fbfebd8f9f2d563387d4e0e83e0`
- **Data de commit:** 2026-10-03 20:30 BRT · `2026-10-03T23:30:48.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9e2726847c370fbfebd8f9f2d563387d4e0e83e0)

#### 214. 20:30 BRT — [`d96d2162d1`](https://github.com/luizcordeiro155/Enturma/commit/d96d2162d1b9aba9bcd795fed6a0bb6227000cf3)

- **O que foi feito (mensagem do commit):** feat: broadcast room list changes in realtime
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d96d2162d1b9aba9bcd795fed6a0bb6227000cf3`
- **Data de commit:** 2026-10-03 20:30 BRT · `2026-10-03T23:30:41.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d96d2162d1b9aba9bcd795fed6a0bb6227000cf3)

#### 215. 20:30 BRT — [`4285f63c44`](https://github.com/luizcordeiro155/Enturma/commit/4285f63c4471f9811f3b2012356febdb6d7bd444)

- **O que foi feito (mensagem do commit):** feat: publish realtime campus changes
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `4285f63c4471f9811f3b2012356febdb6d7bd444`
- **Data de commit:** 2026-10-03 20:30 BRT · `2026-10-03T23:30:23.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4285f63c4471f9811f3b2012356febdb6d7bd444)

#### 216. 20:30 BRT — [`3e40407efa`](https://github.com/luizcordeiro155/Enturma/commit/3e40407efa70c5717c5f9cb227e50629f6d3eac2)

- **O que foi feito (mensagem do commit):** style: polish adaptive campus tutor
- **Tipo:** Estilo/UI · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `3e40407efa70c5717c5f9cb227e50629f6d3eac2`
- **Data de commit:** 2026-10-03 20:30 BRT · `2026-10-03T23:30:03.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/3e40407efa70c5717c5f9cb227e50629f6d3eac2)

#### 217. 20:29 BRT — [`6ee789a983`](https://github.com/luizcordeiro155/Enturma/commit/6ee789a983728d3e4bfb36b99a0d949eb6209fcc)

- **O que foi feito (mensagem do commit):** feat: add AI tutor to smart plans and flashcards
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `6ee789a983728d3e4bfb36b99a0d949eb6209fcc`
- **Data de commit:** 2026-10-03 20:29 BRT · `2026-10-03T23:29:51.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/6ee789a983728d3e4bfb36b99a0d949eb6209fcc)

#### 218. 20:29 BRT — [`e117c8c453`](https://github.com/luizcordeiro155/Enturma/commit/e117c8c453d9b2b36b81920c7c813ee83385403a)

- **O que foi feito (mensagem do commit):** feat: embed adaptive tutor in focus sessions
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `e117c8c453d9b2b36b81920c7c813ee83385403a`
- **Data de commit:** 2026-10-03 20:29 BRT · `2026-10-03T23:29:41.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e117c8c453d9b2b36b81920c7c813ee83385403a)

#### 219. 20:28 BRT — [`cee57145b8`](https://github.com/luizcordeiro155/Enturma/commit/cee57145b845889db139771bafd3eb88e957802c)

- **O que foi feito (mensagem do commit):** feat: add adaptive AI tutor component
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `cee57145b845889db139771bafd3eb88e957802c`
- **Data de commit:** 2026-10-03 20:28 BRT · `2026-10-03T23:28:32.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/cee57145b845889db139771bafd3eb88e957802c)

#### 220. 20:28 BRT — [`c559a105d4`](https://github.com/luizcordeiro155/Enturma/commit/c559a105d44d1eb2df10b06f109eaa8a7de84ac8)

- **O que foi feito (mensagem do commit):** feat: add adaptive campus tutor API
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `c559a105d44d1eb2df10b06f109eaa8a7de84ac8`
- **Data de commit:** 2026-10-03 20:28 BRT · `2026-10-03T23:28:13.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/c559a105d44d1eb2df10b06f109eaa8a7de84ac8)

#### 221. 20:27 BRT — [`989de93e95`](https://github.com/luizcordeiro155/Enturma/commit/989de93e95d5afd1cf915f3b039fc79ab48ade50)

- **O que foi feito (mensagem do commit):** feat: add adaptive campus tutor schema
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `989de93e95d5afd1cf915f3b039fc79ab48ade50`
- **Data de commit:** 2026-10-03 20:27 BRT · `2026-10-03T23:27:56.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/989de93e95d5afd1cf915f3b039fc79ab48ade50)

#### 222. 20:27 BRT — [`67f737265d`](https://github.com/luizcordeiro155/Enturma/commit/67f737265d44ed5a088a8cb4f72d96dd2c51529e)

- **O que foi feito (mensagem do commit):** feat: improve study match profiles and installed app navigation
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `67f737265d44ed5a088a8cb4f72d96dd2c51529e`
- **Data de commit:** 2026-10-03 20:27 BRT · `2026-10-03T23:27:17.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/67f737265d44ed5a088a8cb4f72d96dd2c51529e)

#### 223. 20:27 BRT — [`340f0f836f`](https://github.com/luizcordeiro155/Enturma/commit/340f0f836f2fa78c201f4d2325d2cb77402209ea)

- **O que foi feito (mensagem do commit):** feat: improve study match profiles and installed app navigation
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `340f0f836f2fa78c201f4d2325d2cb77402209ea`
- **Data de commit:** 2026-10-03 20:27 BRT · `2026-10-03T23:27:15.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/340f0f836f2fa78c201f4d2325d2cb77402209ea)

#### 224. 20:27 BRT — [`6481717209`](https://github.com/luizcordeiro155/Enturma/commit/6481717209f9dbe763d13a221dca2785a4fa4ff2)

- **O que foi feito (mensagem do commit):** feat: improve study match profiles and installed app navigation
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `6481717209f9dbe763d13a221dca2785a4fa4ff2`
- **Data de commit:** 2026-10-03 20:27 BRT · `2026-10-03T23:27:12.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/6481717209f9dbe763d13a221dca2785a4fa4ff2)

#### 225. 20:27 BRT — [`d34e71c355`](https://github.com/luizcordeiro155/Enturma/commit/d34e71c355400ae608ff239b39ae90c9e5c4baf9)

- **O que foi feito (mensagem do commit):** feat: improve study match profiles and installed app navigation
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d34e71c355400ae608ff239b39ae90c9e5c4baf9`
- **Data de commit:** 2026-10-03 20:27 BRT · `2026-10-03T23:27:10.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d34e71c355400ae608ff239b39ae90c9e5c4baf9)

#### 226. 20:27 BRT — [`3e4df1668e`](https://github.com/luizcordeiro155/Enturma/commit/3e4df1668e09dc0530728a024731a96195009595)

- **O que foi feito (mensagem do commit):** feat: improve study match profiles and installed app navigation
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `3e4df1668e09dc0530728a024731a96195009595`
- **Data de commit:** 2026-10-03 20:27 BRT · `2026-10-03T23:27:07.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/3e4df1668e09dc0530728a024731a96195009595)

#### 227. 20:26 BRT — [`f7b7b409ec`](https://github.com/luizcordeiro155/Enturma/commit/f7b7b409eccda5cdb9b25f2d6eabab2346b1486c)

- **O que foi feito (mensagem do commit):** feat: broaden realtime app invalidations
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f7b7b409eccda5cdb9b25f2d6eabab2346b1486c`
- **Data de commit:** 2026-10-03 20:26 BRT · `2026-10-03T23:26:18.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f7b7b409eccda5cdb9b25f2d6eabab2346b1486c)

#### 228. 20:09 BRT — [`1cfb374616`](https://github.com/luizcordeiro155/Enturma/commit/1cfb374616c94b6cb88556c7f1ee4c751290a523)

- **O que foi feito (mensagem do commit):** fix: use supported mobile icon in adaptive practice
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `1cfb374616c94b6cb88556c7f1ee4c751290a523`
- **Data de commit:** 2026-10-03 20:09 BRT · `2026-10-03T23:09:50.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/1cfb374616c94b6cb88556c7f1ee4c751290a523)

#### 229. 20:04 BRT — [`89b3bd07e0`](https://github.com/luizcordeiro155/Enturma/commit/89b3bd07e0d0d796df11bbf604df4957d857187a)

- **O que foi feito (mensagem do commit):** feat: consolidate study hubs and publish app updates
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `89b3bd07e0d0d796df11bbf604df4957d857187a`
- **Data de commit:** 2026-10-03 20:04 BRT · `2026-10-03T23:04:40.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/89b3bd07e0d0d796df11bbf604df4957d857187a)

#### 230. 19:39 BRT — [`9aee04b099`](https://github.com/luizcordeiro155/Enturma/commit/9aee04b099e405a3c6c8cf37c8a9e05264d41093)

- **O que foi feito (mensagem do commit):** fix: use answer root id when accepting forum solution
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `9aee04b099e405a3c6c8cf37c8a9e05264d41093`
- **Data de commit:** 2026-10-03 19:39 BRT · `2026-10-03T22:39:10.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9aee04b099e405a3c6c8cf37c8a9e05264d41093)

#### 231. 19:39 BRT — [`6fd2b385b9`](https://github.com/luizcordeiro155/Enturma/commit/6fd2b385b9cb83bd6cc9116bd9191435054e647d)

- **O que foi feito (mensagem do commit):** fix: align rooms page with consolidated home discovery
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `6fd2b385b9cb83bd6cc9116bd9191435054e647d`
- **Data de commit:** 2026-10-03 19:39 BRT · `2026-10-03T22:39:07.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/6fd2b385b9cb83bd6cc9116bd9191435054e647d)

#### 232. 19:36 BRT — [`42a2ebc47b`](https://github.com/luizcordeiro155/Enturma/commit/42a2ebc47bd45739fc4150f6b80e67257a65ec21)

- **O que foi feito (mensagem do commit):** fix: satisfy React effect lint rules
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `42a2ebc47bd45739fc4150f6b80e67257a65ec21`
- **Data de commit:** 2026-10-03 19:36 BRT · `2026-10-03T22:36:01.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/42a2ebc47bd45739fc4150f6b80e67257a65ec21)

#### 233. 19:35 BRT — [`18caab897c`](https://github.com/luizcordeiro155/Enturma/commit/18caab897c8e3fb3f5b03627cafd0c1a9a873a8a)

- **O que foi feito (mensagem do commit):** fix: satisfy React effect lint rules
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `18caab897c8e3fb3f5b03627cafd0c1a9a873a8a`
- **Data de commit:** 2026-10-03 19:35 BRT · `2026-10-03T22:35:58.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/18caab897c8e3fb3f5b03627cafd0c1a9a873a8a)

#### 234. 19:35 BRT — [`53d4e387af`](https://github.com/luizcordeiro155/Enturma/commit/53d4e387af902b47dc59bea46242d1b0cd3efdab)

- **O que foi feito (mensagem do commit):** fix: satisfy React effect lint rules
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `53d4e387af902b47dc59bea46242d1b0cd3efdab`
- **Data de commit:** 2026-10-03 19:35 BRT · `2026-10-03T22:35:56.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/53d4e387af902b47dc59bea46242d1b0cd3efdab)

#### 235. 19:35 BRT — [`4f53c5c920`](https://github.com/luizcordeiro155/Enturma/commit/4f53c5c9205296205e22faa5ac3ed94aec2c7c54)

- **O que foi feito (mensagem do commit):** fix: satisfy React effect lint rules
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `4f53c5c9205296205e22faa5ac3ed94aec2c7c54`
- **Data de commit:** 2026-10-03 19:35 BRT · `2026-10-03T22:35:54.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4f53c5c9205296205e22faa5ac3ed94aec2c7c54)

#### 236. 19:35 BRT — [`c84c385f40`](https://github.com/luizcordeiro155/Enturma/commit/c84c385f402240745848977795354c683d2aaaff)

- **O que foi feito (mensagem do commit):** fix: satisfy React effect lint rules
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `c84c385f402240745848977795354c683d2aaaff`
- **Data de commit:** 2026-10-03 19:35 BRT · `2026-10-03T22:35:52.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/c84c385f402240745848977795354c683d2aaaff)

#### 237. 19:35 BRT — [`8a24cad408`](https://github.com/luizcordeiro155/Enturma/commit/8a24cad408ec47099a3b4a312f97ae7cec9be63f)

- **O que foi feito (mensagem do commit):** fix: satisfy React effect lint rules
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8a24cad408ec47099a3b4a312f97ae7cec9be63f`
- **Data de commit:** 2026-10-03 19:35 BRT · `2026-10-03T22:35:50.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8a24cad408ec47099a3b4a312f97ae7cec9be63f)

#### 238. 19:35 BRT — [`be3ea2fd7a`](https://github.com/luizcordeiro155/Enturma/commit/be3ea2fd7abdcaddc6c04dd8d5eebe40fcd83c88)

- **O que foi feito (mensagem do commit):** fix: satisfy React effect lint rules
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `be3ea2fd7abdcaddc6c04dd8d5eebe40fcd83c88`
- **Data de commit:** 2026-10-03 19:35 BRT · `2026-10-03T22:35:48.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/be3ea2fd7abdcaddc6c04dd8d5eebe40fcd83c88)

#### 239. 19:33 BRT — [`678684c94f`](https://github.com/luizcordeiro155/Enturma/commit/678684c94f95d35de097fde3563243b3e4a5464d)

- **O que foi feito (mensagem do commit):** fix: restore Maven dependency formatting
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `678684c94f95d35de097fde3563243b3e4a5464d`
- **Data de commit:** 2026-10-03 19:33 BRT · `2026-10-03T22:33:05.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/678684c94f95d35de097fde3563243b3e4a5464d)

#### 240. 19:30 BRT — [`698ddfd818`](https://github.com/luizcordeiro155/Enturma/commit/698ddfd818d377b52ab4307f04d41bbdd4c6944c)

- **O que foi feito (mensagem do commit):** feat: consolidate discovery and complete student product suite
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `698ddfd818d377b52ab4307f04d41bbdd4c6944c`
- **Data de commit:** 2026-10-03 19:30 BRT · `2026-10-03T22:30:48.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/698ddfd818d377b52ab4307f04d41bbdd4c6944c)

#### 241. 19:08 BRT — [`7ea03201c8`](https://github.com/luizcordeiro155/Enturma/commit/7ea03201c8bd065a0ec5bed6bbbc7ba811d2d724)

- **O que foi feito (mensagem do commit):** privacy: erase private learning ride and device history
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `7ea03201c8bd065a0ec5bed6bbbc7ba811d2d724`
- **Data de commit:** 2026-10-03 19:08 BRT · `2026-10-03T22:08:55.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/7ea03201c8bd065a0ec5bed6bbbc7ba811d2d724)

#### 242. 19:08 BRT — [`5d3c668544`](https://github.com/luizcordeiro155/Enturma/commit/5d3c668544b7589ba00b8f2ac78995c16d86fff5)

- **O que foi feito (mensagem do commit):** feat: expose study groups in mobile menu
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `5d3c668544b7589ba00b8f2ac78995c16d86fff5`
- **Data de commit:** 2026-10-03 19:08 BRT · `2026-10-03T22:08:14.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/5d3c668544b7589ba00b8f2ac78995c16d86fff5)

#### 243. 19:05 BRT — [`7b4cd7d7d7`](https://github.com/luizcordeiro155/Enturma/commit/7b4cd7d7d7d55d4759960d639d67bb9456faf06f)

- **O que foi feito (mensagem do commit):** feat: add permanent groups to mobile
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `7b4cd7d7d7d55d4759960d639d67bb9456faf06f`
- **Data de commit:** 2026-10-03 19:05 BRT · `2026-10-03T22:05:49.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/7b4cd7d7d7d55d4759960d639d67bb9456faf06f)

#### 244. 19:05 BRT — [`d071a5d002`](https://github.com/luizcordeiro155/Enturma/commit/d071a5d002091a54290e7607d49bb36a76b2ae55)

- **O que foi feito (mensagem do commit):** feat: add study groups to navigation
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d071a5d002091a54290e7607d49bb36a76b2ae55`
- **Data de commit:** 2026-10-03 19:05 BRT · `2026-10-03T22:05:35.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d071a5d002091a54290e7607d49bb36a76b2ae55)

#### 245. 19:05 BRT — [`f10ef1baa8`](https://github.com/luizcordeiro155/Enturma/commit/f10ef1baa8f5bb52fce596f23eee523262c61065)

- **O que foi feito (mensagem do commit):** style: load permanent groups styles
- **Tipo:** Estilo/UI · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f10ef1baa8f5bb52fce596f23eee523262c61065`
- **Data de commit:** 2026-10-03 19:05 BRT · `2026-10-03T22:05:33.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f10ef1baa8f5bb52fce596f23eee523262c61065)

#### 246. 19:05 BRT — [`6ba630cb33`](https://github.com/luizcordeiro155/Enturma/commit/6ba630cb330ed8067af6229159c7d68ad7f4e351)

- **O que foi feito (mensagem do commit):** feat: add permanent study groups
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `6ba630cb330ed8067af6229159c7d68ad7f4e351`
- **Data de commit:** 2026-10-03 19:05 BRT · `2026-10-03T22:05:30.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/6ba630cb330ed8067af6229159c7d68ad7f4e351)

#### 247. 19:05 BRT — [`bfb604dca1`](https://github.com/luizcordeiro155/Enturma/commit/bfb604dca1a89a473c2bbc9b15a18b5e7439e5c9)

- **O que foi feito (mensagem do commit):** feat: add permanent study groups
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `bfb604dca1a89a473c2bbc9b15a18b5e7439e5c9`
- **Data de commit:** 2026-10-03 19:05 BRT · `2026-10-03T22:05:28.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/bfb604dca1a89a473c2bbc9b15a18b5e7439e5c9)

#### 248. 19:05 BRT — [`8af828084e`](https://github.com/luizcordeiro155/Enturma/commit/8af828084e8c73fd3f1c40e9f563146996cb73a8)

- **O que foi feito (mensagem do commit):** feat: add permanent study groups
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8af828084e8c73fd3f1c40e9f563146996cb73a8`
- **Data de commit:** 2026-10-03 19:05 BRT · `2026-10-03T22:05:26.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8af828084e8c73fd3f1c40e9f563146996cb73a8)

#### 249. 19:05 BRT — [`64b4a631d6`](https://github.com/luizcordeiro155/Enturma/commit/64b4a631d680075c4474fbeaa974e1eaa25d486c)

- **O que foi feito (mensagem do commit):** fix: normalize Campus component imports
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `64b4a631d680075c4474fbeaa974e1eaa25d486c`
- **Data de commit:** 2026-10-03 19:05 BRT · `2026-10-03T22:05:07.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/64b4a631d680075c4474fbeaa974e1eaa25d486c)

#### 250. 19:04 BRT — [`d49ef417cb`](https://github.com/luizcordeiro155/Enturma/commit/d49ef417cb9cf907992da30d89852cccfb51911e)

- **O que foi feito (mensagem do commit):** style: polish Campus study planning tools
- **Tipo:** Estilo/UI · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d49ef417cb9cf907992da30d89852cccfb51911e`
- **Data de commit:** 2026-10-03 19:04 BRT · `2026-10-03T22:04:49.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d49ef417cb9cf907992da30d89852cccfb51911e)

#### 251. 19:04 BRT — [`8e42ad31e1`](https://github.com/luizcordeiro155/Enturma/commit/8e42ad31e1b49182b9271e93002b16695c6a1c77)

- **O que foi feito (mensagem do commit):** feat: integrate study planning tools into Campus
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8e42ad31e1b49182b9271e93002b16695c6a1c77`
- **Data de commit:** 2026-10-03 19:04 BRT · `2026-10-03T22:04:47.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8e42ad31e1b49182b9271e93002b16695c6a1c77)

#### 252. 19:04 BRT — [`0c9f256c2f`](https://github.com/luizcordeiro155/Enturma/commit/0c9f256c2fbb5c30501a069f44d8d11d3517c071)

- **O que foi feito (mensagem do commit):** feat: add exam planning flashcards and study match controls
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `0c9f256c2fbb5c30501a069f44d8d11d3517c071`
- **Data de commit:** 2026-10-03 19:04 BRT · `2026-10-03T22:04:43.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/0c9f256c2fbb5c30501a069f44d8d11d3517c071)

#### 253. 19:04 BRT — [`46959442d4`](https://github.com/luizcordeiro155/Enturma/commit/46959442d434b4fb74e2cb2c38bb702118277fc7)

- **O que foi feito (mensagem do commit):** fix: keep study matches on existing web flows
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `46959442d434b4fb74e2cb2c38bb702118277fc7`
- **Data de commit:** 2026-10-03 19:04 BRT · `2026-10-03T22:04:13.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/46959442d434b4fb74e2cb2c38bb702118277fc7)

#### 254. 19:04 BRT — [`b16ebd729a`](https://github.com/luizcordeiro155/Enturma/commit/b16ebd729ad96a034637239960608d12a34244f5)

- **O que foi feito (mensagem do commit):** fix: import deletion grace-period duration
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `b16ebd729ad96a034637239960608d12a34244f5`
- **Data de commit:** 2026-10-03 19:04 BRT · `2026-10-03T22:04:10.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/b16ebd729ad96a034637239960608d12a34244f5)

#### 255. 19:03 BRT — [`f225c1b73a`](https://github.com/luizcordeiro155/Enturma/commit/f225c1b73aad87395cc0038a705a9c063ea7048e)

- **O que foi feito (mensagem do commit):** fix: restore mobile settings line breaks
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f225c1b73aad87395cc0038a705a9c063ea7048e`
- **Data de commit:** 2026-10-03 19:03 BRT · `2026-10-03T22:03:41.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f225c1b73aad87395cc0038a705a9c063ea7048e)

#### 256. 19:03 BRT — [`6adee77a5f`](https://github.com/luizcordeiro155/Enturma/commit/6adee77a5f7b8851b5652c1f508924086947717c)

- **O que foi feito (mensagem do commit):** feat: expose privacy controls on mobile settings
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `6adee77a5f7b8851b5652c1f508924086947717c`
- **Data de commit:** 2026-10-03 19:03 BRT · `2026-10-03T22:03:29.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/6adee77a5f7b8851b5652c1f508924086947717c)

#### 257. 19:03 BRT — [`74d304076b`](https://github.com/luizcordeiro155/Enturma/commit/74d304076b38411cf9f3c2c55079b8e23b71802b)

- **O que foi feito (mensagem do commit):** feat: add mobile account privacy controls
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `74d304076b38411cf9f3c2c55079b8e23b71802b`
- **Data de commit:** 2026-10-03 19:03 BRT · `2026-10-03T22:03:26.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/74d304076b38411cf9f3c2c55079b8e23b71802b)

#### 258. 19:02 BRT — [`b30c8149ec`](https://github.com/luizcordeiro155/Enturma/commit/b30c8149ecde44aba3de07bfa37f2363e53170ff)

- **O que foi feito (mensagem do commit):** feat: add exam plans flashcards and permanent study groups
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `b30c8149ecde44aba3de07bfa37f2363e53170ff`
- **Data de commit:** 2026-10-03 19:02 BRT · `2026-10-03T22:02:55.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/b30c8149ecde44aba3de07bfa37f2363e53170ff)

#### 259. 19:02 BRT — [`3bd975d8dd`](https://github.com/luizcordeiro155/Enturma/commit/3bd975d8ddc9dfd00776f99bb64b0242712c3a19)

- **O que foi feito (mensagem do commit):** feat: link Campus from mobile navigation
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `3bd975d8ddc9dfd00776f99bb64b0242712c3a19`
- **Data de commit:** 2026-10-03 19:02 BRT · `2026-10-03T22:02:31.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/3bd975d8ddc9dfd00776f99bb64b0242712c3a19)

#### 260. 19:02 BRT — [`59749881cf`](https://github.com/luizcordeiro155/Enturma/commit/59749881cf672602102ce84a6415cde00bc1ac0d)

- **O que foi feito (mensagem do commit):** fix: initialize Campus learning stats for new users
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `59749881cf672602102ce84a6415cde00bc1ac0d`
- **Data de commit:** 2026-10-03 19:02 BRT · `2026-10-03T22:02:29.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/59749881cf672602102ce84a6415cde00bc1ac0d)

#### 261. 19:02 BRT — [`b74ee45cad`](https://github.com/luizcordeiro155/Enturma/commit/b74ee45cad2935dacd173f2cca813ac1bd2683e4)

- **O que foi feito (mensagem do commit):** feat: add Campus dashboard to mobile
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `b74ee45cad2935dacd173f2cca813ac1bd2683e4`
- **Data de commit:** 2026-10-03 19:02 BRT · `2026-10-03T22:02:10.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/b74ee45cad2935dacd173f2cca813ac1bd2683e4)

#### 262. 19:00 BRT — [`d9cbe35aeb`](https://github.com/luizcordeiro155/Enturma/commit/d9cbe35aebf59c00a61718a515659f89955b22cd)

- **O que foi feito (mensagem do commit):** perf: prefetch Campus
- **Tipo:** Desempenho · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d9cbe35aebf59c00a61718a515659f89955b22cd`
- **Data de commit:** 2026-10-03 19:00 BRT · `2026-10-03T22:00:22.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d9cbe35aebf59c00a61718a515659f89955b22cd)

#### 263. 19:00 BRT — [`7311a07d27`](https://github.com/luizcordeiro155/Enturma/commit/7311a07d27e87261a40b040b0fad4c0621f6d65d)

- **O que foi feito (mensagem do commit):** feat: include Campus in private shell
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `7311a07d27e87261a40b040b0fad4c0621f6d65d`
- **Data de commit:** 2026-10-03 19:00 BRT · `2026-10-03T22:00:20.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/7311a07d27e87261a40b040b0fad4c0621f6d65d)

#### 264. 19:00 BRT — [`5ee2f76891`](https://github.com/luizcordeiro155/Enturma/commit/5ee2f76891b27d085cc6f535dc27962a206a5616)

- **O que foi feito (mensagem do commit):** feat: add privacy controls to settings
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `5ee2f76891b27d085cc6f535dc27962a206a5616`
- **Data de commit:** 2026-10-03 19:00 BRT · `2026-10-03T22:00:17.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/5ee2f76891b27d085cc6f535dc27962a206a5616)

#### 265. 19:00 BRT — [`8237f03391`](https://github.com/luizcordeiro155/Enturma/commit/8237f0339115f8e7120a9b588713da9ebcb36b1c)

- **O que foi feito (mensagem do commit):** feat: add Campus to main navigation
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8237f0339115f8e7120a9b588713da9ebcb36b1c`
- **Data de commit:** 2026-10-03 19:00 BRT · `2026-10-03T22:00:15.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8237f0339115f8e7120a9b588713da9ebcb36b1c)

#### 266. 19:00 BRT — [`3c86861bb2`](https://github.com/luizcordeiro155/Enturma/commit/3c86861bb235ad341ad63d5e8be85c21b15efd9a)

- **O que foi feito (mensagem do commit):** feat: wire Campus styles
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `3c86861bb235ad341ad63d5e8be85c21b15efd9a`
- **Data de commit:** 2026-10-03 19:00 BRT · `2026-10-03T22:00:13.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/3c86861bb235ad341ad63d5e8be85c21b15efd9a)

#### 267. 19:00 BRT — [`ebe5420a99`](https://github.com/luizcordeiro155/Enturma/commit/ebe5420a9972bb9109a54e3b6623e71578691d00)

- **O que foi feito (mensagem do commit):** feat: add Enturma Campus and privacy UX
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `ebe5420a9972bb9109a54e3b6623e71578691d00`
- **Data de commit:** 2026-10-03 19:00 BRT · `2026-10-03T22:00:04.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/ebe5420a9972bb9109a54e3b6623e71578691d00)

#### 268. 19:00 BRT — [`b09ded9d28`](https://github.com/luizcordeiro155/Enturma/commit/b09ded9d2845249822ce35b8a0492142e4bec9a7)

- **O que foi feito (mensagem do commit):** feat: add Enturma Campus and privacy UX
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `b09ded9d2845249822ce35b8a0492142e4bec9a7`
- **Data de commit:** 2026-10-03 19:00 BRT · `2026-10-03T22:00:02.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/b09ded9d2845249822ce35b8a0492142e4bec9a7)

#### 269. 19:00 BRT — [`b2af012ac7`](https://github.com/luizcordeiro155/Enturma/commit/b2af012ac7c2de5b51d8413d1d833319e8323c55)

- **O que foi feito (mensagem do commit):** feat: add Enturma Campus and privacy UX
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `b2af012ac7c2de5b51d8413d1d833319e8323c55`
- **Data de commit:** 2026-10-03 19:00 BRT · `2026-10-03T22:00:00.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/b2af012ac7c2de5b51d8413d1d833319e8323c55)

#### 270. 18:59 BRT — [`bb33325c58`](https://github.com/luizcordeiro155/Enturma/commit/bb33325c586ff8b81889ebf03eea690f606a3d09)

- **O que foi feito (mensagem do commit):** feat: add Enturma Campus and privacy UX
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `bb33325c586ff8b81889ebf03eea690f606a3d09`
- **Data de commit:** 2026-10-03 18:59 BRT · `2026-10-03T21:59:58.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/bb33325c586ff8b81889ebf03eea690f606a3d09)

#### 271. 18:59 BRT — [`cc27c4c1db`](https://github.com/luizcordeiro155/Enturma/commit/cc27c4c1db870b7187d73692cbfde26fce3d9e22)

- **O que foi feito (mensagem do commit):** feat: add Enturma Campus and privacy UX
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `cc27c4c1db870b7187d73692cbfde26fce3d9e22`
- **Data de commit:** 2026-10-03 18:59 BRT · `2026-10-03T21:59:55.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/cc27c4c1db870b7187d73692cbfde26fce3d9e22)

#### 272. 18:58 BRT — [`fc557a9840`](https://github.com/luizcordeiro155/Enturma/commit/fc557a9840e3a8f7c36bd38e6162890b6c3a8a21)

- **O que foi feito (mensagem do commit):** fix: harden account erasure against actual schema
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `fc557a9840e3a8f7c36bd38e6162890b6c3a8a21`
- **Data de commit:** 2026-10-03 18:58 BRT · `2026-10-03T21:58:53.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/fc557a9840e3a8f7c36bd38e6162890b6c3a8a21)

#### 273. 18:58 BRT — [`907eb24eec`](https://github.com/luizcordeiro155/Enturma/commit/907eb24eec0b0699b08508a30acc2afe0e7b782c)

- **O que foi feito (mensagem do commit):** fix: align Campus queries with production schema
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `907eb24eec0b0699b08508a30acc2afe0e7b782c`
- **Data de commit:** 2026-10-03 18:58 BRT · `2026-10-03T21:58:50.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/907eb24eec0b0699b08508a30acc2afe0e7b782c)

#### 274. 18:58 BRT — [`9ef6237825`](https://github.com/luizcordeiro155/Enturma/commit/9ef6237825269d118253647d35a1cef88a54093b)

- **O que foi feito (mensagem do commit):** feat: add Enturma Campus core and account privacy
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `9ef6237825269d118253647d35a1cef88a54093b`
- **Data de commit:** 2026-10-03 18:58 BRT · `2026-10-03T21:58:05.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9ef6237825269d118253647d35a1cef88a54093b)

#### 275. 18:58 BRT — [`749ea77281`](https://github.com/luizcordeiro155/Enturma/commit/749ea77281b8ad62018da8b52af6606bf792379c)

- **O que foi feito (mensagem do commit):** feat: add Enturma Campus core and account privacy
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `749ea77281b8ad62018da8b52af6606bf792379c`
- **Data de commit:** 2026-10-03 18:58 BRT · `2026-10-03T21:58:03.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/749ea77281b8ad62018da8b52af6606bf792379c)

#### 276. 18:58 BRT — [`e5ac89978e`](https://github.com/luizcordeiro155/Enturma/commit/e5ac89978ece001496c43a994adca3166fe9a586)

- **O que foi feito (mensagem do commit):** feat: add Enturma Campus core and account privacy
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `e5ac89978ece001496c43a994adca3166fe9a586`
- **Data de commit:** 2026-10-03 18:58 BRT · `2026-10-03T21:58:01.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e5ac89978ece001496c43a994adca3166fe9a586)

#### 277. 03:07 BRT — [`fd1ca6ec1c`](https://github.com/luizcordeiro155/Enturma/commit/fd1ca6ec1c37d96a036cba1ff03d0573d644d279)

- **O que foi feito (mensagem do commit):** chore(vercel): retry production deploy
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `fd1ca6ec1c37d96a036cba1ff03d0573d644d279`
- **Data de commit:** 2026-10-03 03:07 BRT · `2026-10-03T06:07:54.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/fd1ca6ec1c37d96a036cba1ff03d0573d644d279)

#### 278. 02:50 BRT — [`b2377b325a`](https://github.com/luizcordeiro155/Enturma/commit/b2377b325a87881237e62b1b113e42f82e51ed76)

- **O que foi feito (mensagem do commit):** fix(mobile): remove barra vazia do perfil
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `b2377b325a87881237e62b1b113e42f82e51ed76`
- **Data de commit:** 2026-10-03 02:50 BRT · `2026-10-03T05:50:06.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/b2377b325a87881237e62b1b113e42f82e51ed76)

#### 279. 02:45 BRT — [`0cfdc30e56`](https://github.com/luizcordeiro155/Enturma/commit/0cfdc30e562473d1d095aa4c2f4feea3839cd422)

- **O que foi feito (mensagem do commit):** fix(mobile): libera scroll do perfil e detalhes das conquistas
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `0cfdc30e562473d1d095aa4c2f4feea3839cd422`
- **Data de commit:** 2026-10-03 02:45 BRT · `2026-10-03T05:45:08.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/0cfdc30e562473d1d095aa4c2f4feea3839cd422)

#### 280. 02:42 BRT — [`5362b526e4`](https://github.com/luizcordeiro155/Enturma/commit/5362b526e4d612c9a1c9f933770aa93e32a7949e)

- **O que foi feito (mensagem do commit):** perf(realtime): reduz latencia entre web apps e caronas
- **Tipo:** Desempenho · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `5362b526e4d612c9a1c9f933770aa93e32a7949e`
- **Data de commit:** 2026-10-03 02:42 BRT · `2026-10-03T05:42:03.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/5362b526e4d612c9a1c9f933770aa93e32a7949e)

#### 281. 02:25 BRT — [`78740c3b41`](https://github.com/luizcordeiro155/Enturma/commit/78740c3b41a69e6c0d5a1f92ec4cd5e047063b69)

- **O que foi feito (mensagem do commit):** feat(download): prioriza apps Windows e Android
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `78740c3b41a69e6c0d5a1f92ec4cd5e047063b69`
- **Data de commit:** 2026-10-03 02:25 BRT · `2026-10-03T05:25:58.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/78740c3b41a69e6c0d5a1f92ec4cd5e047063b69)

#### 282. 02:16 BRT — [`73ef894d9b`](https://github.com/luizcordeiro155/Enturma/commit/73ef894d9b46368f3d87bea62d059c1ce6674c64)

- **O que foi feito (mensagem do commit):** chore(vercel): force rebuild production
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `73ef894d9b46368f3d87bea62d059c1ce6674c64`
- **Data de commit:** 2026-10-03 02:16 BRT · `2026-10-03T05:16:55.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/73ef894d9b46368f3d87bea62d059c1ce6674c64)

#### 283. 02:16 BRT — [`e69eec2697`](https://github.com/luizcordeiro155/Enturma/commit/e69eec2697bff3f660c6abac67a5a7b6884e521b)

- **O que foi feito (mensagem do commit):** chore(vercel): force production deploy das correcoes
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `e69eec2697bff3f660c6abac67a5a7b6884e521b`
- **Data de commit:** 2026-10-03 02:16 BRT · `2026-10-03T05:16:39.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e69eec2697bff3f660c6abac67a5a7b6884e521b)

#### 284. 02:09 BRT — [`25f08fb4c3`](https://github.com/luizcordeiro155/Enturma/commit/25f08fb4c3c466b073196b130a464290f403b2ad)

- **O que foi feito (mensagem do commit):** chore(vercel): publica correcoes de conta e perfil mobile
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `25f08fb4c3c466b073196b130a464290f403b2ad`
- **Data de commit:** 2026-10-03 02:09 BRT · `2026-10-03T05:09:54.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/25f08fb4c3c466b073196b130a464290f403b2ad)

#### 285. 02:09 BRT — [`4ea7d3b8df`](https://github.com/luizcordeiro155/Enturma/commit/4ea7d3b8df70398780d1d5ac718c8404fef02d73)

- **O que foi feito (mensagem do commit):** fix(ui): troca de conta e perfil mobile
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `4ea7d3b8df70398780d1d5ac718c8404fef02d73`
- **Data de commit:** 2026-10-03 02:09 BRT · `2026-10-03T05:09:14.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4ea7d3b8df70398780d1d5ac718c8404fef02d73)

#### 286. 01:58 BRT — [`8ae6e8ba8b`](https://github.com/luizcordeiro155/Enturma/commit/8ae6e8ba8b81390bfbdd236e2ea67356276b501e)

- **O que foi feito (mensagem do commit):** fix(desktop): destaca novas mensagens na barra de tarefas
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8ae6e8ba8b81390bfbdd236e2ea67356276b501e`
- **Data de commit:** 2026-10-03 01:58 BRT · `2026-10-03T04:58:00.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8ae6e8ba8b81390bfbdd236e2ea67356276b501e)

#### 287. 01:41 BRT — [`e7b23c423c`](https://github.com/luizcordeiro155/Enturma/commit/e7b23c423cc55cdd1d4fdda79721c4cf98edbf25)

- **O que foi feito (mensagem do commit):** feat(desktop): paridade de notificacoes e atualizacao automatica
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `e7b23c423cc55cdd1d4fdda79721c4cf98edbf25`
- **Data de commit:** 2026-10-03 01:41 BRT · `2026-10-03T04:41:54.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e7b23c423cc55cdd1d4fdda79721c4cf98edbf25)

#### 288. 01:30 BRT — [`97010618ac`](https://github.com/luizcordeiro155/Enturma/commit/97010618acc455f9b13093eefc66b59ff8fd907e)

- **O que foi feito (mensagem do commit):** fix(pwa): restaura reinstalacao e usa logo oficial mobile
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `97010618acc455f9b13093eefc66b59ff8fd907e`
- **Data de commit:** 2026-10-03 01:30 BRT · `2026-10-03T04:30:17.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/97010618acc455f9b13093eefc66b59ff8fd907e)

#### 289. 01:22 BRT — [`50023d7fde`](https://github.com/luizcordeiro155/Enturma/commit/50023d7fde687717b3e3ee8cc6141a7c84fb5608)

- **O que foi feito (mensagem do commit):** fix(updater): troca handoff do Windows e recupera 0.3.2
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `50023d7fde687717b3e3ee8cc6141a7c84fb5608`
- **Data de commit:** 2026-10-03 01:22 BRT · `2026-10-03T04:22:40.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/50023d7fde687717b3e3ee8cc6141a7c84fb5608)

#### 290. 01:12 BRT — [`b1588f9c16`](https://github.com/luizcordeiro155/Enturma/commit/b1588f9c16d51438b4e14d75597b3eaeaf9f7891)

- **O que foi feito (mensagem do commit):** fix(updater): recupera desktop 0.3.1 e instala via NSIS
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `b1588f9c16d51438b4e14d75597b3eaeaf9f7891`
- **Data de commit:** 2026-10-03 01:12 BRT · `2026-10-03T04:12:56.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/b1588f9c16d51438b4e14d75597b3eaeaf9f7891)

#### 291. 01:03 BRT — [`970144aadd`](https://github.com/luizcordeiro155/Enturma/commit/970144aadd5fa4697957e685dbdca235f610511c)

- **O que foi feito (mensagem do commit):** fix(download): restaura acesso permanente a pagina de downloads
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `970144aadd5fa4697957e685dbdca235f610511c`
- **Data de commit:** 2026-10-03 01:03 BRT · `2026-10-03T04:03:27.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/970144aadd5fa4697957e685dbdca235f610511c)

#### 292. 00:59 BRT — [`a42885f52c`](https://github.com/luizcordeiro155/Enturma/commit/a42885f52cc6da9a1efd79215b5fe0dec2f19d12)

- **O que foi feito (mensagem do commit):** fix(profile): remove gutter lateral e scrollbar residual
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `a42885f52cc6da9a1efd79215b5fe0dec2f19d12`
- **Data de commit:** 2026-10-03 00:59 BRT · `2026-10-03T03:59:53.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a42885f52cc6da9a1efd79215b5fe0dec2f19d12)

#### 293. 00:54 BRT — [`d7bd03586d`](https://github.com/luizcordeiro155/Enturma/commit/d7bd03586d48bf07ad66522d06a864c144d3f8d6)

- **O que foi feito (mensagem do commit):** feat(desktop): notificacoes nativas e downloads beta
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d7bd03586d48bf07ad66522d06a864c144d3f8d6`
- **Data de commit:** 2026-10-03 00:54 BRT · `2026-10-03T03:54:14.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d7bd03586d48bf07ad66522d06a864c144d3f8d6)

#### 294. 00:50 BRT — [`f12f629106`](https://github.com/luizcordeiro155/Enturma/commit/f12f629106161e2d44eea3b5c7e89eece4158368)

- **O que foi feito (mensagem do commit):** fix(profile): remove vao entre paineis e scrollbar residual
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f12f629106161e2d44eea3b5c7e89eece4158368`
- **Data de commit:** 2026-10-03 00:50 BRT · `2026-10-03T03:50:36.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f12f629106161e2d44eea3b5c7e89eece4158368)

#### 295. 00:42 BRT — [`7d2ad74b71`](https://github.com/luizcordeiro155/Enturma/commit/7d2ad74b71c415bedcfb8876ab22a9819454c05f)

- **O que foi feito (mensagem do commit):** fix(profile): preenche coluna inteira com o card do perfil
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `7d2ad74b71c415bedcfb8876ab22a9819454c05f`
- **Data de commit:** 2026-10-03 00:42 BRT · `2026-10-03T03:42:48.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/7d2ad74b71c415bedcfb8876ab22a9819454c05f)

#### 296. 00:37 BRT — [`1b8546ed3e`](https://github.com/luizcordeiro155/Enturma/commit/1b8546ed3e1c46544df2453603a4d1b9ce6f4aa0)

- **O que foi feito (mensagem do commit):** fix(profile): estabiliza modal e completa personalizacao avancada
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `1b8546ed3e1c46544df2453603a4d1b9ce6f4aa0`
- **Data de commit:** 2026-10-03 00:37 BRT · `2026-10-03T03:37:40.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/1b8546ed3e1c46544df2453603a4d1b9ce6f4aa0)

#### 297. 00:19 BRT — [`2e7003b5f6`](https://github.com/luizcordeiro155/Enturma/commit/2e7003b5f687a0b9b358a2e87a837a09fef15b45)

- **O que foi feito (mensagem do commit):** fix(pwa): corrige tipagem do manifesto de instalacao
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `2e7003b5f687a0b9b358a2e87a837a09fef15b45`
- **Data de commit:** 2026-10-03 00:19 BRT · `2026-10-03T03:19:09.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/2e7003b5f687a0b9b358a2e87a837a09fef15b45)

#### 298. 00:16 BRT — [`bc8f8f4e60`](https://github.com/luizcordeiro155/Enturma/commit/bc8f8f4e604552c7468558edc10700df006f34eb)

- **O que foi feito (mensagem do commit):** fix(web): elimina erros restantes de lint
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `bc8f8f4e604552c7468558edc10700df006f34eb`
- **Data de commit:** 2026-10-03 00:16 BRT · `2026-10-03T03:16:07.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/bc8f8f4e604552c7468558edc10700df006f34eb)

#### 299. 00:12 BRT — [`d04ff12c3d`](https://github.com/luizcordeiro155/Enturma/commit/d04ff12c3deb13c5dbcb2123700e2e5247ac7075)

- **O que foi feito (mensagem do commit):** fix(web): corrige lint e estabiliza instalacao PWA
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d04ff12c3deb13c5dbcb2123700e2e5247ac7075`
- **Data de commit:** 2026-10-03 00:12 BRT · `2026-10-03T03:12:42.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d04ff12c3deb13c5dbcb2123700e2e5247ac7075)

#### 300. 00:09 BRT — [`e444173658`](https://github.com/luizcordeiro155/Enturma/commit/e444173658fecd400bd9cfdb4c13ba915fc5f5fb)

- **O que foi feito (mensagem do commit):** fix(ci): mantem compatibilidade das preferencias de notificacao
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `e444173658fecd400bd9cfdb4c13ba915fc5f5fb`
- **Data de commit:** 2026-10-03 00:09 BRT · `2026-10-03T03:09:18.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e444173658fecd400bd9cfdb4c13ba915fc5f5fb)

#### 301. 00:07 BRT — [`8474863ed4`](https://github.com/luizcordeiro155/Enturma/commit/8474863ed4f6ba77f1909c5f1dfbd7152611f19f)

- **O que foi feito (mensagem do commit):** feat(pwa): corrige logo oficial e adiciona notificacoes desktop
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8474863ed4f6ba77f1909c5f1dfbd7152611f19f`
- **Data de commit:** 2026-10-03 00:07 BRT · `2026-10-03T03:07:55.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8474863ed4f6ba77f1909c5f1dfbd7152611f19f)


### 02/10/2026 — 77 commit(s)

#### 302. 23:46 BRT — [`4d32c75cae`](https://github.com/luizcordeiro155/Enturma/commit/4d32c75cae492c291d5cde938ea9e05cdbaabe28)

- **O que foi feito (mensagem do commit):** fix(pwa): usa logo oficial e aprimora painel de perfil
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `4d32c75cae492c291d5cde938ea9e05cdbaabe28`
- **Data de commit:** 2026-10-02 23:46 BRT · `2026-10-03T02:46:01.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4d32c75cae492c291d5cde938ea9e05cdbaabe28)

#### 303. 23:34 BRT — [`1b4b2d8964`](https://github.com/luizcordeiro155/Enturma/commit/1b4b2d8964615ee4092ae28510ee4500929f6b4d)

- **O que foi feito (mensagem do commit):** fix(pwa): oculta instalador, usa icone mobile e ajusta perfil de amigos
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `1b4b2d8964615ee4092ae28510ee4500929f6b4d`
- **Data de commit:** 2026-10-02 23:34 BRT · `2026-10-03T02:34:21.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/1b4b2d8964615ee4092ae28510ee4500929f6b4d)

#### 304. 23:20 BRT — [`9045001a86`](https://github.com/luizcordeiro155/Enturma/commit/9045001a8668a95947df9dc405699354d45162a0)

- **O que foi feito (mensagem do commit):** feat(pwa): instala Enturma pelo navegador no Windows e Android
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `9045001a8668a95947df9dc405699354d45162a0`
- **Data de commit:** 2026-10-02 23:20 BRT · `2026-10-03T02:20:31.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9045001a8668a95947df9dc405699354d45162a0)

#### 305. 22:56 BRT — [`78d087216c`](https://github.com/luizcordeiro155/Enturma/commit/78d087216cd0fc0172e990a041dcc982337ce5c5)

- **O que foi feito (mensagem do commit):** fix(web): corrige typecheck da transicao de paginas
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `78d087216cd0fc0172e990a041dcc982337ce5c5`
- **Data de commit:** 2026-10-02 22:56 BRT · `2026-10-03T01:56:11.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/78d087216cd0fc0172e990a041dcc982337ce5c5)

#### 306. 22:54 BRT — [`422ed0b0b5`](https://github.com/luizcordeiro155/Enturma/commit/422ed0b0b5d0e9981e1840f93bd44ded48321cbc)

- **O que foi feito (mensagem do commit):** fix(ui): estabiliza navegacao mobile e scrollbar nas transicoes
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `422ed0b0b5d0e9981e1840f93bd44ded48321cbc`
- **Data de commit:** 2026-10-02 22:54 BRT · `2026-10-03T01:54:10.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/422ed0b0b5d0e9981e1840f93bd44ded48321cbc)

#### 307. 22:45 BRT — [`ca70400925`](https://github.com/luizcordeiro155/Enturma/commit/ca704009255361483592cd4dadae06f518e09806)

- **O que foi feito (mensagem do commit):** perf(web): manter estado entre paginas e animar navegacao
- **Tipo:** Desempenho · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `ca704009255361483592cd4dadae06f518e09806`
- **Data de commit:** 2026-10-02 22:45 BRT · `2026-10-03T01:45:25.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/ca704009255361483592cd4dadae06f518e09806)

#### 308. 22:31 BRT — [`4a7aea832a`](https://github.com/luizcordeiro155/Enturma/commit/4a7aea832abf2cfc86b541b9c09a26748429a9ac)

- **O que foi feito (mensagem do commit):** feat(ui): avatar do usuario no topo no lugar de Meu perfil
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `4a7aea832abf2cfc86b541b9c09a26748429a9ac`
- **Data de commit:** 2026-10-02 22:31 BRT · `2026-10-03T01:31:32.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4a7aea832abf2cfc86b541b9c09a26748429a9ac)

#### 309. 22:06 BRT — [`5e94392c92`](https://github.com/luizcordeiro155/Enturma/commit/5e94392c923efa136abfd2fe4340f5650d4a0369)

- **O que foi feito (mensagem do commit):** feat(app): manter login, proteger links e notificar atualizacoes 0.3.16
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `5e94392c923efa136abfd2fe4340f5650d4a0369`
- **Data de commit:** 2026-10-02 22:06 BRT · `2026-10-03T01:06:51.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/5e94392c923efa136abfd2fe4340f5650d4a0369)

#### 310. 20:29 BRT — [`f69a101e7f`](https://github.com/luizcordeiro155/Enturma/commit/f69a101e7fc79c7a5222a7bf2a2ab85c7118d11b)

- **O que foi feito (mensagem do commit):** fix(android): corrige regex Kotlin da 0.3.15
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f69a101e7fc79c7a5222a7bf2a2ab85c7118d11b`
- **Data de commit:** 2026-10-02 20:29 BRT · `2026-10-02T23:29:23.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Evita escapes invalidos no MainActivity.kt gerado pelo updater Android.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f69a101e7fc79c7a5222a7bf2a2ab85c7118d11b)

#### 311. 20:19 BRT — [`4399c40ce5`](https://github.com/luizcordeiro155/Enturma/commit/4399c40ce5c8d5a09e8cb0e37f6d042f5bd5f6ec)

- **O que foi feito (mensagem do commit):** fix(android): corrige build 0.3.15 no gerador nativo
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `4399c40ce5c8d5a09e8cb0e37f6d042f5bd5f6ec`
- **Data de commit:** 2026-10-02 20:19 BRT · `2026-10-02T23:19:06.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Escapa WEB_ORIGIN corretamente no template Kotlin para permitir o build Android 0.3.15.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4399c40ce5c8d5a09e8cb0e37f6d042f5bd5f6ec)

#### 312. 20:08 BRT — [`65257f4d1b`](https://github.com/luizcordeiro155/Enturma/commit/65257f4d1bd383e68a901a37a98d058dc88911dc)

- **O que foi feito (mensagem do commit):** chore(vercel): retry updater 0.3.15 again
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `65257f4d1bd383e68a901a37a98d058dc88911dc`
- **Data de commit:** 2026-10-02 20:08 BRT · `2026-10-02T23:08:58.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/65257f4d1bd383e68a901a37a98d058dc88911dc)

#### 313. 19:49 BRT — [`da20ae5d8a`](https://github.com/luizcordeiro155/Enturma/commit/da20ae5d8a2553dcf9ee6c01e29cc551a32e25ad)

- **O que foi feito (mensagem do commit):** chore(vercel): retry updater 0.3.15
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `da20ae5d8a2553dcf9ee6c01e29cc551a32e25ad`
- **Data de commit:** 2026-10-02 19:49 BRT · `2026-10-02T22:49:46.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/da20ae5d8a2553dcf9ee6c01e29cc551a32e25ad)

#### 314. 19:33 BRT — [`c7ad40bede`](https://github.com/luizcordeiro155/Enturma/commit/c7ad40bede352768af5712661102b6390bc78360)

- **O que foi feito (mensagem do commit):** chore(vercel): publica updater 0.3.15
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `c7ad40bede352768af5712661102b6390bc78360`
- **Data de commit:** 2026-10-02 19:33 BRT · `2026-10-02T22:33:05.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/c7ad40bede352768af5712661102b6390bc78360)

#### 315. 19:31 BRT — [`571b4708fa`](https://github.com/luizcordeiro155/Enturma/commit/571b4708fa9784e36d4b1083b7add89f3f157ed3)

- **O que foi feito (mensagem do commit):** fix(updater): botao claro e notificacao unica 0.3.15
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `571b4708fa9784e36d4b1083b7add89f3f157ed3`
- **Data de commit:** 2026-10-02 19:31 BRT · `2026-10-02T22:31:36.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Adiciona Atualizar agora em Configuracoes e restaura uma notificacao nativa unica por versao.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/571b4708fa9784e36d4b1083b7add89f3f157ed3)

#### 316. 19:18 BRT — [`833cb1ec55`](https://github.com/luizcordeiro155/Enturma/commit/833cb1ec55c05f537abde78320d578c634ce7120)

- **O que foi feito (mensagem do commit):** chore(vercel): publica visual 0.3.14
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `833cb1ec55c05f537abde78320d578c634ce7120`
- **Data de commit:** 2026-10-02 19:18 BRT · `2026-10-02T22:18:02.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/833cb1ec55c05f537abde78320d578c634ce7120)

#### 317. 19:17 BRT — [`340539a6a8`](https://github.com/luizcordeiro155/Enturma/commit/340539a6a82a05dca83fffce228017aa14ab360a)

- **O que foi feito (mensagem do commit):** feat(ui): motion JS e perfis com banners 0.3.14
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `340539a6a82a05dca83fffce228017aa14ab360a`
- **Data de commit:** 2026-10-02 19:17 BRT · `2026-10-02T22:17:15.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Aprimora animacoes JavaScript, dual colors, GIFs e banners de membros no mobile e desktop.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/340539a6a82a05dca83fffce228017aa14ab360a)

#### 318. 18:54 BRT — [`b86a196afb`](https://github.com/luizcordeiro155/Enturma/commit/b86a196afb9e6c13c567b6f35823ed27671bde88)

- **O que foi feito (mensagem do commit):** chore(vercel): retry producao 0.3.13
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `b86a196afb9e6c13c567b6f35823ed27671bde88`
- **Data de commit:** 2026-10-02 18:54 BRT · `2026-10-02T21:54:41.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/b86a196afb9e6c13c567b6f35823ed27671bde88)

#### 319. 18:40 BRT — [`d4ee67c5ec`](https://github.com/luizcordeiro155/Enturma/commit/d4ee67c5ec3c3992797cdcda6b10eca19e1b0688)

- **O que foi feito (mensagem do commit):** chore(vercel): publica fluxo mobile 0.3.13
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d4ee67c5ec3c3992797cdcda6b10eca19e1b0688`
- **Data de commit:** 2026-10-02 18:40 BRT · `2026-10-02T21:40:04.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d4ee67c5ec3c3992797cdcda6b10eca19e1b0688)

#### 320. 18:39 BRT — [`36e21accd3`](https://github.com/luizcordeiro155/Enturma/commit/36e21accd3f5481c8340c66ad238513718afdaff)

- **O que foi feito (mensagem do commit):** fix(android): simplifica atualizador mobile 0.3.13
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `36e21accd3f5481c8340c66ad238513718afdaff`
- **Data de commit:** 2026-10-02 18:39 BRT · `2026-10-02T21:39:18.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Remove modal automatico, deixa aviso em Configuracoes e abre instalador automaticamente ao concluir o download.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/36e21accd3f5481c8340c66ad238513718afdaff)

#### 321. 18:12 BRT — [`f1943915e2`](https://github.com/luizcordeiro155/Enturma/commit/f1943915e2140db4bb2d284e58d916cf71fc5740)

- **O que foi feito (mensagem do commit):** fix(notifications): push em solicitacao de amizade
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f1943915e2140db4bb2d284e58d916cf71fc5740`
- **Data de commit:** 2026-10-02 18:12 BRT · `2026-10-02T21:12:53.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Emite FRIEND_REQUEST pelo NotificationService quando uma nova solicitacao de amizade for criada.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f1943915e2140db4bb2d284e58d916cf71fc5740)

#### 322. 17:55 BRT — [`5c1b4194fc`](https://github.com/luizcordeiro155/Enturma/commit/5c1b4194fc9f596ee49dafda114205a0277d8ed4)

- **O que foi feito (mensagem do commit):** chore(vercel): publica web 0.3.12
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `5c1b4194fc9f596ee49dafda114205a0277d8ed4`
- **Data de commit:** 2026-10-02 17:55 BRT · `2026-10-02T20:55:06.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/5c1b4194fc9f596ee49dafda114205a0277d8ed4)

#### 323. 17:29 BRT — [`7a40a7e5d1`](https://github.com/luizcordeiro155/Enturma/commit/7a40a7e5d117395b3e13764382badc0df02b5e0f)

- **O que foi feito (mensagem do commit):** fix(android): evita fluxo duplicado de atualizacao
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `7a40a7e5d117395b3e13764382badc0df02b5e0f`
- **Data de commit:** 2026-10-02 17:29 BRT · `2026-10-02T20:29:49.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Impede o modal Web de reaparecer quando a notificacao nativa ja iniciou o download.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/7a40a7e5d117395b3e13764382badc0df02b5e0f)

#### 324. 17:27 BRT — [`e94b0b242f`](https://github.com/luizcordeiro155/Enturma/commit/e94b0b242f7488c6c6728d7f6e7e0f21f61932a0)

- **O que foi feito (mensagem do commit):** fix(android): registra push sem depender do deploy web
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `e94b0b242f7488c6c6728d7f6e7e0f21f61932a0`
- **Data de commit:** 2026-10-02 17:27 BRT · `2026-10-02T20:27:47.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Adiciona fallback nativo para registrar o token FCM pelo BFF existente.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e94b0b242f7488c6c6728d7f6e7e0f21f61932a0)

#### 325. 17:25 BRT — [`baef3f44c3`](https://github.com/luizcordeiro155/Enturma/commit/baef3f44c330785c574a420d8ffe347e313511a5)

- **O que foi feito (mensagem do commit):** feat(android): push notifications e preferencias 0.3.12
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `baef3f44c330785c574a420d8ffe347e313511a5`
- **Data de commit:** 2026-10-02 17:25 BRT · `2026-10-02T20:25:14.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Adiciona push Android para mensagens e forum, preferencias por categoria, registro seguro de dispositivos e notificacao unica do atualizador.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/baef3f44c330785c574a420d8ffe347e313511a5)

#### 326. 17:03 BRT — [`89aa868dab`](https://github.com/luizcordeiro155/Enturma/commit/89aa868dab50f110ec045f36f1c9a8e4d663efc7)

- **O que foi feito (mensagem do commit):** fix(android): instala atualizacao apos o download
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `89aa868dab50f110ec045f36f1c9a8e4d663efc7`
- **Data de commit:** 2026-10-02 17:03 BRT · `2026-10-02T20:03:22.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Corrige o fluxo do atualizador Android e publica a versao mobile 0.3.11.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/89aa868dab50f110ec045f36f1c9a8e4d663efc7)

#### 327. 16:45 BRT — [`62fed48f78`](https://github.com/luizcordeiro155/Enturma/commit/62fed48f78dd46d39c9657e7d2b8813941e6663d)

- **O que foi feito (mensagem do commit):** fix(android): atualização direta, teclado e perfil mobile 0.3.10
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `62fed48f78dd46d39c9657e7d2b8813941e6663d`
- **Data de commit:** 2026-10-02 16:45 BRT · `2026-10-02T19:45:54.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/62fed48f78dd46d39c9657e7d2b8813941e6663d)

#### 328. 16:13 BRT — [`dcdaee9143`](https://github.com/luizcordeiro155/Enturma/commit/dcdaee91434bac425eaeb2257076bb7891fac28f)

- **O que foi feito (mensagem do commit):** feat(mobile): perfil único estilo Discord e teclado Android 0.3.9
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `dcdaee91434bac425eaeb2257076bb7891fac28f`
- **Data de commit:** 2026-10-02 16:13 BRT · `2026-10-02T19:13:15.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/dcdaee91434bac425eaeb2257076bb7891fac28f)

#### 329. 15:53 BRT — [`3cea6a3111`](https://github.com/luizcordeiro155/Enturma/commit/3cea6a31115150025447a4bfa123d0243b30a53a)

- **O que foi feito (mensagem do commit):** chore(production): tenta publicar correção do teclado mobile
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `3cea6a31115150025447a4bfa123d0243b30a53a`
- **Data de commit:** 2026-10-02 15:53 BRT · `2026-10-02T18:53:04.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/3cea6a31115150025447a4bfa123d0243b30a53a)

#### 330. 15:31 BRT — [`3970661df6`](https://github.com/luizcordeiro155/Enturma/commit/3970661df6af4c7a9509fe2a816fb710bb34fdb5)

- **O que foi feito (mensagem do commit):** fix(mobile): mantém campo de digitação visível acima do teclado
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `3970661df6af4c7a9509fe2a816fb710bb34fdb5`
- **Data de commit:** 2026-10-02 15:31 BRT · `2026-10-02T18:31:04.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/3970661df6af4c7a9509fe2a816fb710bb34fdb5)

#### 331. 15:25 BRT — [`feae2d87ef`](https://github.com/luizcordeiro155/Enturma/commit/feae2d87ef37c93997052787dbbf0440caa8aaa9)

- **O que foi feito (mensagem do commit):** chore(production): publica correção final das salas mobile
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `feae2d87ef37c93997052787dbbf0440caa8aaa9`
- **Data de commit:** 2026-10-02 15:25 BRT · `2026-10-02T18:25:14.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/feae2d87ef37c93997052787dbbf0440caa8aaa9)

#### 332. 15:14 BRT — [`33a9b20f38`](https://github.com/luizcordeiro155/Enturma/commit/33a9b20f3874f2bd7ec3de61bc5c4cc8272bd3e2)

- **O que foi feito (mensagem do commit):** fix(mobile): mantém chat, IA e controles da câmera acima das abas
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `33a9b20f3874f2bd7ec3de61bc5c4cc8272bd3e2`
- **Data de commit:** 2026-10-02 15:14 BRT · `2026-10-02T18:14:41.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/33a9b20f3874f2bd7ec3de61bc5c4cc8272bd3e2)

#### 333. 15:01 BRT — [`c71e94231a`](https://github.com/luizcordeiro155/Enturma/commit/c71e94231a530148c7f55ecb1d979a519a0044e6)

- **O que foi feito (mensagem do commit):** chore(production): tenta publicar correção mobile das salas
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `c71e94231a530148c7f55ecb1d979a519a0044e6`
- **Data de commit:** 2026-10-02 15:01 BRT · `2026-10-02T18:01:54.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/c71e94231a530148c7f55ecb1d979a519a0044e6)

#### 334. 14:48 BRT — [`c8f0053e70`](https://github.com/luizcordeiro155/Enturma/commit/c8f0053e704a52e67410d8e79bd30d84cfae01b8)

- **O que foi feito (mensagem do commit):** fix(mobile): libera chat e compacta navegação das salas
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `c8f0053e704a52e67410d8e79bd30d84cfae01b8`
- **Data de commit:** 2026-10-02 14:48 BRT · `2026-10-02T17:48:32.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/c8f0053e704a52e67410d8e79bd30d84cfae01b8)

#### 335. 14:42 BRT — [`647e0f5b94`](https://github.com/luizcordeiro155/Enturma/commit/647e0f5b94df1f058a829956d51b2a10520b439e)

- **O que foi feito (mensagem do commit):** fix(mobile): recupera chat, chamada e ferramentas das salas
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `647e0f5b94df1f058a829956d51b2a10520b439e`
- **Data de commit:** 2026-10-02 14:42 BRT · `2026-10-02T17:42:26.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/647e0f5b94df1f058a829956d51b2a10520b439e)

#### 336. 14:32 BRT — [`a9dbb66387`](https://github.com/luizcordeiro155/Enturma/commit/a9dbb66387cdeac6dcb998b7e75e0d250d3b16f4)

- **O que foi feito (mensagem do commit):** feat(mobile): redesenha salas com navegação estilo Discord
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `a9dbb66387cdeac6dcb998b7e75e0d250d3b16f4`
- **Data de commit:** 2026-10-02 14:32 BRT · `2026-10-02T17:32:20.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a9dbb66387cdeac6dcb998b7e75e0d250d3b16f4)

#### 337. 14:03 BRT — [`5cd6fad83a`](https://github.com/luizcordeiro155/Enturma/commit/5cd6fad83ae553983fe95c1444052cbe036ac6ab)

- **O que foi feito (mensagem do commit):** fix(android): corrige regex Kotlin do atualizador 0.3.8
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `5cd6fad83ae553983fe95c1444052cbe036ac6ab`
- **Data de commit:** 2026-10-02 14:03 BRT · `2026-10-02T17:03:09.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/5cd6fad83ae553983fe95c1444052cbe036ac6ab)

#### 338. 13:55 BRT — [`d23d3f39d6`](https://github.com/luizcordeiro155/Enturma/commit/d23d3f39d6774ff7532468dc47d70e5819f0c6ea)

- **O que foi feito (mensagem do commit):** fix(android): verifica atualizações em segundo plano a cada 15 min
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d23d3f39d6774ff7532468dc47d70e5819f0c6ea`
- **Data de commit:** 2026-10-02 13:55 BRT · `2026-10-02T16:55:22.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d23d3f39d6774ff7532468dc47d70e5819f0c6ea)

#### 339. 13:54 BRT — [`2d5f3e98be`](https://github.com/luizcordeiro155/Enturma/commit/2d5f3e98be25149ce06644950267a0430b3e8ff6)

- **O que foi feito (mensagem do commit):** fix(web): evita duplicar atualizador nativo no Android
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `2d5f3e98be25149ce06644950267a0430b3e8ff6`
- **Data de commit:** 2026-10-02 13:54 BRT · `2026-10-02T16:54:17.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/2d5f3e98be25149ce06644950267a0430b3e8ff6)

#### 340. 13:54 BRT — [`5c72653800`](https://github.com/luizcordeiro155/Enturma/commit/5c72653800522381260e000bc812b914c8ad2b19)

- **O que foi feito (mensagem do commit):** fix(android): mantém UI de atualização mesmo sem novo deploy Web
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `5c72653800522381260e000bc812b914c8ad2b19`
- **Data de commit:** 2026-10-02 13:54 BRT · `2026-10-02T16:54:06.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/5c72653800522381260e000bc812b914c8ad2b19)

#### 341. 13:52 BRT — [`73838f2dbb`](https://github.com/luizcordeiro155/Enturma/commit/73838f2dbb227d357fda97d14639cbe261aacb43)

- **O que foi feito (mensagem do commit):** chore(production): publica interface de atualização Android 0.3.8
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `73838f2dbb227d357fda97d14639cbe261aacb43`
- **Data de commit:** 2026-10-02 13:52 BRT · `2026-10-02T16:52:06.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/73838f2dbb227d357fda97d14639cbe261aacb43)

#### 342. 13:48 BRT — [`dfd3acb3af`](https://github.com/luizcordeiro155/Enturma/commit/dfd3acb3af53c8575a7ad1fe12591fa46eb57a2d)

- **O que foi feito (mensagem do commit):** fix(android): escapa interpolação do atualizador nativo
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `dfd3acb3af53c8575a7ad1fe12591fa46eb57a2d`
- **Data de commit:** 2026-10-02 13:48 BRT · `2026-10-02T16:48:54.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/dfd3acb3af53c8575a7ad1fe12591fa46eb57a2d)

#### 343. 13:48 BRT — [`8c41646126`](https://github.com/luizcordeiro155/Enturma/commit/8c41646126fa5d58b788a91061f19dfc5a0d786a)

- **O que foi feito (mensagem do commit):** feat(android): registra receivers de atualização
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8c41646126fa5d58b788a91061f19dfc5a0d786a`
- **Data de commit:** 2026-10-02 13:48 BRT · `2026-10-02T16:48:31.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8c41646126fa5d58b788a91061f19dfc5a0d786a)

#### 344. 13:48 BRT — [`6c2366b149`](https://github.com/luizcordeiro155/Enturma/commit/6c2366b14956a16067fef25cd0e96e978970bf62)

- **O que foi feito (mensagem do commit):** feat(android): instala atualização pelo próprio app
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `6c2366b14956a16067fef25cd0e96e978970bf62`
- **Data de commit:** 2026-10-02 13:48 BRT · `2026-10-02T16:48:21.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/6c2366b14956a16067fef25cd0e96e978970bf62)

#### 345. 13:47 BRT — [`a7cbb9ae01`](https://github.com/luizcordeiro155/Enturma/commit/a7cbb9ae01d5a3f0f60f0e8566af2878453d8ec9)

- **O que foi feito (mensagem do commit):** feat(android): adiciona verificador nativo de atualização
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `a7cbb9ae01d5a3f0f60f0e8566af2878453d8ec9`
- **Data de commit:** 2026-10-02 13:47 BRT · `2026-10-02T16:47:08.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a7cbb9ae01d5a3f0f60f0e8566af2878453d8ec9)

#### 346. 13:46 BRT — [`c756e30c13`](https://github.com/luizcordeiro155/Enturma/commit/c756e30c13214619ce4c50a95ff7c12f883345bc)

- **O que foi feito (mensagem do commit):** style(mobile): adiciona indicadores de atualização
- **Tipo:** Estilo/UI · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `c756e30c13214619ce4c50a95ff7c12f883345bc`
- **Data de commit:** 2026-10-02 13:46 BRT · `2026-10-02T16:46:28.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/c756e30c13214619ce4c50a95ff7c12f883345bc)

#### 347. 13:46 BRT — [`e7ff96e984`](https://github.com/luizcordeiro155/Enturma/commit/e7ff96e9846eabd7b1dbe2825cea560487ec9dfc)

- **O que foi feito (mensagem do commit):** feat(shell): sinaliza atualização Android em configurações
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `e7ff96e9846eabd7b1dbe2825cea560487ec9dfc`
- **Data de commit:** 2026-10-02 13:46 BRT · `2026-10-02T16:46:18.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e7ff96e9846eabd7b1dbe2825cea560487ec9dfc)

#### 348. 13:46 BRT — [`494445453a`](https://github.com/luizcordeiro155/Enturma/commit/494445453abdb08e2a894c0733ac26c346430013)

- **O que foi feito (mensagem do commit):** feat(mobile): destaca atualização pendente
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `494445453abdb08e2a894c0733ac26c346430013`
- **Data de commit:** 2026-10-02 13:46 BRT · `2026-10-02T16:46:07.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/494445453abdb08e2a894c0733ac26c346430013)

#### 349. 13:45 BRT — [`688107fa12`](https://github.com/luizcordeiro155/Enturma/commit/688107fa1207d6e1c2d7bc0bbe6ee1f25263e804)

- **O que foi feito (mensagem do commit):** feat(web): atualizador Android integrado
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `688107fa1207d6e1c2d7bc0bbe6ee1f25263e804`
- **Data de commit:** 2026-10-02 13:45 BRT · `2026-10-02T16:45:58.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/688107fa1207d6e1c2d7bc0bbe6ee1f25263e804)

#### 350. 13:45 BRT — [`cebf8edcd1`](https://github.com/luizcordeiro155/Enturma/commit/cebf8edcd1178cf9df9c3e940c995eebcfc69e85)

- **O que foi feito (mensagem do commit):** docs(android): documenta atualizador 0.3.8
- **Tipo:** Documentação · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `cebf8edcd1178cf9df9c3e940c995eebcfc69e85`
- **Data de commit:** 2026-10-02 13:45 BRT · `2026-10-02T16:45:30.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/cebf8edcd1178cf9df9c3e940c995eebcfc69e85)

#### 351. 13:45 BRT — [`442213b589`](https://github.com/luizcordeiro155/Enturma/commit/442213b5899f99b218cce6b7714fcce1698d5d5a)

- **O que foi feito (mensagem do commit):** chore(android): sincroniza versão 0.3.8
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `442213b5899f99b218cce6b7714fcce1698d5d5a`
- **Data de commit:** 2026-10-02 13:45 BRT · `2026-10-02T16:45:26.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/442213b5899f99b218cce6b7714fcce1698d5d5a)

#### 352. 13:45 BRT — [`bbe45cd65d`](https://github.com/luizcordeiro155/Enturma/commit/bbe45cd65d0fe50b5e63d05f1b5f542d5a9b3e9f)

- **O que foi feito (mensagem do commit):** chore(android): sincroniza versão 0.3.8
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `bbe45cd65d0fe50b5e63d05f1b5f542d5a9b3e9f`
- **Data de commit:** 2026-10-02 13:45 BRT · `2026-10-02T16:45:22.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/bbe45cd65d0fe50b5e63d05f1b5f542d5a9b3e9f)

#### 353. 13:42 BRT — [`f439b86c83`](https://github.com/luizcordeiro155/Enturma/commit/f439b86c8329f3594265641a50ef568b248f97fa)

- **O que foi feito (mensagem do commit):** chore(android): publica 0.3.8 e usa logo mobile final
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f439b86c8329f3594265641a50ef568b248f97fa`
- **Data de commit:** 2026-10-02 13:42 BRT · `2026-10-02T16:42:23.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f439b86c8329f3594265641a50ef568b248f97fa)

#### 354. 13:06 BRT — [`f749b3fa2c`](https://github.com/luizcordeiro155/Enturma/commit/f749b3fa2c55cdc808831f89efb670556c6fd6cd)

- **O que foi feito (mensagem do commit):** fix(android): persiste safe area e sincroniza tema na 0.3.7
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f749b3fa2c55cdc808831f89efb670556c6fd6cd`
- **Data de commit:** 2026-10-02 13:06 BRT · `2026-10-02T16:06:08.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f749b3fa2c55cdc808831f89efb670556c6fd6cd)

#### 355. 12:49 BRT — [`9890e04a04`](https://github.com/luizcordeiro155/Enturma/commit/9890e04a04450affde1496e7d3bf06df96b52028)

- **O que foi feito (mensagem do commit):** fix(android): aplica safe area no topbar sem depender do deploy Web
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `9890e04a04450affde1496e7d3bf06df96b52028`
- **Data de commit:** 2026-10-02 12:49 BRT · `2026-10-02T15:49:07.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9890e04a04450affde1496e7d3bf06df96b52028)

#### 356. 12:48 BRT — [`37f6faef62`](https://github.com/luizcordeiro155/Enturma/commit/37f6faef6234d49d710453d43410205d60da0816)

- **O que foi feito (mensagem do commit):** chore(web): publica safe area Android 0.3.6 em production
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `37f6faef6234d49d710453d43410205d60da0816`
- **Data de commit:** 2026-10-02 12:48 BRT · `2026-10-02T15:48:31.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/37f6faef6234d49d710453d43410205d60da0816)

#### 357. 12:47 BRT — [`4aa1398d78`](https://github.com/luizcordeiro155/Enturma/commit/4aa1398d78237b7e1601e64e975a47a332366936)

- **O que foi feito (mensagem do commit):** fix(android): escapa insets Kotlin no gerador 0.3.6
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `4aa1398d78237b7e1601e64e975a47a332366936`
- **Data de commit:** 2026-10-02 12:47 BRT · `2026-10-02T15:47:21.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4aa1398d78237b7e1601e64e975a47a332366936)

#### 358. 12:45 BRT — [`f342ddd093`](https://github.com/luizcordeiro155/Enturma/commit/f342ddd093e040c6ce5d0e9e6f8aba9999d24121)

- **O que foi feito (mensagem do commit):** docs(mobile): documenta correção da safe area 0.3.6
- **Tipo:** Documentação · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f342ddd093e040c6ce5d0e9e6f8aba9999d24121`
- **Data de commit:** 2026-10-02 12:45 BRT · `2026-10-02T15:45:05.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f342ddd093e040c6ce5d0e9e6f8aba9999d24121)

#### 359. 12:45 BRT — [`57dd4627cc`](https://github.com/luizcordeiro155/Enturma/commit/57dd4627cc6121217df66b727bb6feb963f8222f)

- **O que foi feito (mensagem do commit):** chore(android): atualiza lockfile para 0.3.6
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `57dd4627cc6121217df66b727bb6feb963f8222f`
- **Data de commit:** 2026-10-02 12:45 BRT · `2026-10-02T15:45:01.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/57dd4627cc6121217df66b727bb6feb963f8222f)

#### 360. 12:44 BRT — [`ffda34ad20`](https://github.com/luizcordeiro155/Enturma/commit/ffda34ad20029f6bab6c13fb110482a46506aa8c)

- **O que foi feito (mensagem do commit):** chore(android): sincroniza versão mobile 0.3.6
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `ffda34ad20029f6bab6c13fb110482a46506aa8c`
- **Data de commit:** 2026-10-02 12:44 BRT · `2026-10-02T15:44:58.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/ffda34ad20029f6bab6c13fb110482a46506aa8c)

#### 361. 12:44 BRT — [`fb2899da23`](https://github.com/luizcordeiro155/Enturma/commit/fb2899da23d90be299502e0b3f1e6e7de3582378)

- **O que foi feito (mensagem do commit):** chore(android): bump app para 0.3.6
- **Tipo:** Manutenção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `fb2899da23d90be299502e0b3f1e6e7de3582378`
- **Data de commit:** 2026-10-02 12:44 BRT · `2026-10-02T15:44:43.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/fb2899da23d90be299502e0b3f1e6e7de3582378)

#### 362. 12:44 BRT — [`a2c052d2b5`](https://github.com/luizcordeiro155/Enturma/commit/a2c052d2b5729365c05bd89efad945daf004b4e2)

- **O que foi feito (mensagem do commit):** fix(web): integra safe area Android ao topbar
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `a2c052d2b5729365c05bd89efad945daf004b4e2`
- **Data de commit:** 2026-10-02 12:44 BRT · `2026-10-02T15:44:40.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a2c052d2b5729365c05bd89efad945daf004b4e2)

#### 363. 12:44 BRT — [`b4774cbb98`](https://github.com/luizcordeiro155/Enturma/commit/b4774cbb98443c1c8347b36fed37d7266f88a1e4)

- **O que foi feito (mensagem do commit):** fix(android): remove faixa branca da status bar
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `b4774cbb98443c1c8347b36fed37d7266f88a1e4`
- **Data de commit:** 2026-10-02 12:44 BRT · `2026-10-02T15:44:36.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/b4774cbb98443c1c8347b36fed37d7266f88a1e4)

#### 364. 12:25 BRT — [`93c9c2abca`](https://github.com/luizcordeiro155/Enturma/commit/93c9c2abca18e1d44a129e3e2820a0f8a4ab10b1)

- **O que foi feito (mensagem do commit):** fix(mobile): restaura navegação da sala e respeita área segura
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `93c9c2abca18e1d44a129e3e2820a0f8a4ab10b1`
- **Data de commit:** 2026-10-02 12:25 BRT · `2026-10-02T15:25:07.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/93c9c2abca18e1d44a129e3e2820a0f8a4ab10b1)

#### 365. 12:01 BRT — [`6c8c63f25d`](https://github.com/luizcordeiro155/Enturma/commit/6c8c63f25de25d5f146e6e6df6c5ae8c96ffd535)

- **O que foi feito (mensagem do commit):** fix(android): corrige interpolacao do shell WebView
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `6c8c63f25de25d5f146e6e6df6c5ae8c96ffd535`
- **Data de commit:** 2026-10-02 12:01 BRT · `2026-10-02T15:01:22.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/6c8c63f25de25d5f146e6e6df6c5ae8c96ffd535)

#### 366. 11:45 BRT — [`28e7d134c5`](https://github.com/luizcordeiro155/Enturma/commit/28e7d134c500c2ab31c0e778d2f51bcf2175d0e5)

- **O que foi feito (mensagem do commit):** feat(production): unifica Android com Web e Desktop
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `28e7d134c500c2ab31c0e778d2f51bcf2175d0e5`
- **Data de commit:** 2026-10-02 11:45 BRT · `2026-10-02T14:45:57.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Troca o Android para um shell WebView nativo com as mesmas páginas, sessão e chamadas LiveKit da Web/Desktop, preservando permissões e segurança de navegação.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/28e7d134c500c2ab31c0e778d2f51bcf2175d0e5)

#### 367. 11:14 BRT — [`81d4fe8aed`](https://github.com/luizcordeiro155/Enturma/commit/81d4fe8aed6b30be9d21765613559e1ca0089d62)

- **O que foi feito (mensagem do commit):** fix(production): Android 0.3.3 com chamadas estáveis e paridade visual
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `81d4fe8aed6b30be9d21765613559e1ca0089d62`
- **Data de commit:** 2026-10-02 11:14 BRT · `2026-10-02T14:14:39.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Corrige ordem de inicialização do LiveKit, configura foreground service de screen share, elimina cache do APK, melhora a paridade visual mobile e sobe Android para 0.3.3.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/81d4fe8aed6b30be9d21765613559e1ca0089d62)

#### 368. 10:53 BRT — [`03ed0403f7`](https://github.com/luizcordeiro155/Enturma/commit/03ed0403f7badce5fc958ea4efd97f9929b82b7f)

- **O que foi feito (mensagem do commit):** fix(production): sincroniza versão Android no download
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `03ed0403f7badce5fc958ea4efd97f9929b82b7f`
- **Data de commit:** 2026-10-02 10:53 BRT · `2026-10-02T13:53:24.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
A página /download passa a consultar latest-android.json e exibir a versão realmente publicada na Railway.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/03ed0403f7badce5fc958ea4efd97f9929b82b7f)

#### 369. 10:47 BRT — [`b65e0ce34d`](https://github.com/luizcordeiro155/Enturma/commit/b65e0ce34d873a8b8497116dae72ae2600b2b58e)

- **O que foi feito (mensagem do commit):** fix(production): isola LiveKit do boot Android 0.3.2
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `b65e0ce34d873a8b8497116dae72ae2600b2b58e`
- **Data de commit:** 2026-10-02 10:47 BRT · `2026-10-02T13:47:54.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Remove LiveKit/WebRTC do bootstrap global, carrega chamadas sob demanda e sobe Android para 0.3.2.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/b65e0ce34d873a8b8497116dae72ae2600b2b58e)

#### 370. 10:29 BRT — [`f8319c97e0`](https://github.com/luizcordeiro155/Enturma/commit/f8319c97e074e4b4d8dfd18b2d2097269a56cbf7)

- **O que foi feito (mensagem do commit):** fix(production): corrige crash inicial do Android 0.3.1
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f8319c97e074e4b4d8dfd18b2d2097269a56cbf7`
- **Data de commit:** 2026-10-02 10:29 BRT · `2026-10-02T13:29:08.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Inicializa LiveKit/WebRTC antes do Expo Router com fallback seguro, remove o registro tardio no provider, sobe Android para 0.3.1 e ajusta o nome do APK publicado.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f8319c97e074e4b4d8dfd18b2d2097269a56cbf7)

#### 371. 10:16 BRT — [`252202d877`](https://github.com/luizcordeiro155/Enturma/commit/252202d877bd781adb34329f783971ab6a8a11aa)

- **O que foi feito (mensagem do commit):** feat(production): libera download Android no site
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `252202d877bd781adb34329f783971ab6a8a11aa`
- **Data de commit:** 2026-10-02 10:16 BRT · `2026-10-02T13:16:10.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Liga a página /download ao APK Android 0.3.0 publicado na Railway.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/252202d877bd781adb34329f783971ab6a8a11aa)

#### 372. 09:53 BRT — [`146ec7aff6`](https://github.com/luizcordeiro155/Enturma/commit/146ec7aff6b2383a790425b0209f5c31f1bafd82)

- **O que foi feito (mensagem do commit):** fix(production): corrige assinatura do APK Android
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `146ec7aff6b2383a790425b0209f5c31f1bafd82`
- **Data de commit:** 2026-10-02 09:53 BRT · `2026-10-02T12:53:25.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Aplica a assinatura apenas ao buildTypes.release do Gradle gerado pelo Expo.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/146ec7aff6b2383a790425b0209f5c31f1bafd82)

#### 373. 09:42 BRT — [`56e4282840`](https://github.com/luizcordeiro155/Enturma/commit/56e4282840e5eeb4f3ac77357e8826e179b6c680)

- **O que foi feito (mensagem do commit):** feat(production): adiciona download Android funcional
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `56e4282840e5eeb4f3ac77357e8826e179b6c680`
- **Data de commit:** 2026-10-02 09:42 BRT · `2026-10-02T12:42:37.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Adiciona geração do APK release assinado, servidor de download Android e integração com a API de produção.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/56e4282840e5eeb4f3ac77357e8826e179b6c680)

#### 374. 09:34 BRT — [`418964dd1c`](https://github.com/luizcordeiro155/Enturma/commit/418964dd1c88dcf6aa04bffebd5c4a2979e6cfa0)

- **O que foi feito (mensagem do commit):** feat(android): prepara configuração pública do app mobile
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `418964dd1c88dcf6aa04bffebd5c4a2979e6cfa0`
- **Data de commit:** 2026-10-02 09:34 BRT · `2026-10-02T12:34:03.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Adiciona configuração pública de API/WebSocket para o mobile e prepara o app.config para builds Android de produção.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/418964dd1c88dcf6aa04bffebd5c4a2979e6cfa0)

#### 375. 02:31 BRT — [`af5c0915f7`](https://github.com/luizcordeiro155/Enturma/commit/af5c0915f757297f76673e0d0c34169a3bc4a5a9)

- **O que foi feito (mensagem do commit):** fix(web): move desktop update control into settings (#24)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `af5c0915f757297f76673e0d0c34169a3bc4a5a9`
- **Data de commit:** 2026-10-02 02:31 BRT · `2026-10-02T05:31:30.000Z` UTC.
- **Pull Request associada à mensagem:** [#24](https://github.com/luizcordeiro155/Enturma/pull/24).

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/af5c0915f757297f76673e0d0c34169a3bc4a5a9)

#### 376. 02:18 BRT — [`52455359f0`](https://github.com/luizcordeiro155/Enturma/commit/52455359f0cf0322de0710b91afc83925c71ee69)

- **O que foi feito (mensagem do commit):** fix(desktop): extract NSIS bootstrap without Wine (#23)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `52455359f0cf0322de0710b91afc83925c71ee69`
- **Data de commit:** 2026-10-02 02:18 BRT · `2026-10-02T05:18:06.000Z` UTC.
- **Pull Request associada à mensagem:** [#23](https://github.com/luizcordeiro155/Enturma/pull/23).

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/52455359f0cf0322de0710b91afc83925c71ee69)

#### 377. 02:08 BRT — [`efbb9de653`](https://github.com/luizcordeiro155/Enturma/commit/efbb9de6536757a0cb2eae3a6827fb84b149da67)

- **O que foi feito (mensagem do commit):** fix(desktop): build NSIS with Wine WoW64 on Railway (#22)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `efbb9de6536757a0cb2eae3a6827fb84b149da67`
- **Data de commit:** 2026-10-02 02:08 BRT · `2026-10-02T05:08:27.000Z` UTC.
- **Pull Request associada à mensagem:** [#22](https://github.com/luizcordeiro155/Enturma/pull/22).

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/efbb9de6536757a0cb2eae3a6827fb84b149da67)

#### 378. 01:56 BRT — [`3f54255371`](https://github.com/luizcordeiro155/Enturma/commit/3f542553715b40404fc617ef406f0b1ea89b6c5f)

- **O que foi feito (mensagem do commit):** feat(production): Enturma v0.3.0
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `3f542553715b40404fc617ef406f0b1ea89b6c5f`
- **Data de commit:** 2026-10-02 01:56 BRT · `2026-10-02T04:56:18.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Perfil e conquistas, catálogo verificado, desafios acadêmicos, salas e chamadas persistentes, moderação auditada e aplicativos. Inclui recuperação assistida do Desktop legado e atualizador 0.3.0 validado. Publicação pelas integrações Git existentes, sem Actions.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/3f542553715b40404fc617ef406f0b1ea89b6c5f)


### 01/10/2026 — 16 commit(s)

#### 379. 22:14 BRT — [`937a3bec2e`](https://github.com/luizcordeiro155/Enturma/commit/937a3bec2e2b0a44788c3e11c35fd3ccf3b4b514)

- **O que foi feito (mensagem do commit):** feat(production): alinha download à identidade do Enturma
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `937a3bec2e2b0a44788c3e11c35fd3ccf3b4b514`
- **Data de commit:** 2026-10-01 22:14 BRT · `2026-10-02T01:14:20.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Atualiza a página de download para usar a mesma logo, temas, tipografia, cards, botões e responsividade da aplicação Web.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/937a3bec2e2b0a44788c3e11c35fd3ccf3b4b514)

#### 380. 22:09 BRT — [`d8c9ffc293`](https://github.com/luizcordeiro155/Enturma/commit/d8c9ffc2932c7a275068fed85ea7c85e418e55e3)

- **O que foi feito (mensagem do commit):** feat(production): atualiza Enturma Web para v0.2.0
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d8c9ffc2932c7a275068fed85ea7c85e418e55e3`
- **Data de commit:** 2026-10-01 22:09 BRT · `2026-10-02T01:09:36.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Atualiza o Web para 0.2.0, sincroniza o lockfile, exibe a versão no rodapé e publica metadado application-version.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d8c9ffc2932c7a275068fed85ea7c85e418e55e3)

#### 381. 18:55 BRT — [`c6b4379c36`](https://github.com/luizcordeiro155/Enturma/commit/c6b4379c363294ed5fb9b8f7b4787df9fc65c177)

- **O que foi feito (mensagem do commit):** feat(production): adiciona auto-update ao Enturma Desktop
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `c6b4379c363294ed5fb9b8f7b4787df9fc65c177`
- **Data de commit:** 2026-10-01 18:55 BRT · `2026-10-01T21:55:23.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Adiciona manifesto de atualização, download automático com validação SHA-256, instalação com reinício e versão Desktop 0.2.0.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/c6b4379c363294ed5fb9b8f7b4787df9fc65c177)

#### 382. 18:42 BRT — [`ac7af83678`](https://github.com/luizcordeiro155/Enturma/commit/ac7af83678331211ec553b2b27de4fe5afe67c8d)

- **O que foi feito (mensagem do commit):** feat(production): ativa download público do Enturma Desktop
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `ac7af83678331211ec553b2b27de4fe5afe67c8d`
- **Data de commit:** 2026-10-01 18:42 BRT · `2026-10-01T21:42:31.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Liga a página /download ao pacote Windows x64 hospedado na Railway e documenta a versão pública.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/ac7af83678331211ec553b2b27de4fe5afe67c8d)

#### 383. 18:37 BRT — [`f2b7953630`](https://github.com/luizcordeiro155/Enturma/commit/f2b79536304ce76b8466de7aac60eac0415fe3d5)

- **O que foi feito (mensagem do commit):** perf(production): acelera build do Enturma Desktop
- **Tipo:** Desempenho · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f2b79536304ce76b8466de7aac60eac0415fe3d5`
- **Data de commit:** 2026-10-01 18:37 BRT · `2026-10-01T21:37:51.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Troca o builder ZIP do Desktop para Node puro, remove Wine e reduz a compactação para normal.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f2b79536304ce76b8466de7aac60eac0415fe3d5)

#### 384. 18:30 BRT — [`e2123f7598`](https://github.com/luizcordeiro155/Enturma/commit/e2123f7598e8d142c5614f59ed3c4424e6c28169)

- **O que foi feito (mensagem do commit):** fix(production): disponibiliza pacote Windows do Desktop
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `e2123f7598e8d142c5614f59ed3c4424e6c28169`
- **Data de commit:** 2026-10-01 18:30 BRT · `2026-10-01T21:30:58.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Gera pacote Windows em ZIP para publicação automática do Enturma Desktop pela Railway.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e2123f7598e8d142c5614f59ed3c4424e6c28169)

#### 385. 18:27 BRT — [`c8c2901e2e`](https://github.com/luizcordeiro155/Enturma/commit/c8c2901e2ed5ea9551965750fc2a21cff67d3544)

- **O que foi feito (mensagem do commit):** fix(production): estabiliza build Windows do Desktop
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `c8c2901e2ed5ea9551965750fc2a21cff67d3544`
- **Data de commit:** 2026-10-01 18:27 BRT · `2026-10-01T21:27:15.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Desativa assinatura e edição de executável no build Linux/Wine para permitir finalizar o instalador Windows sem certificado de code signing.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/c8c2901e2ed5ea9551965750fc2a21cff67d3544)

#### 386. 18:22 BRT — [`774d14a9cc`](https://github.com/luizcordeiro155/Enturma/commit/774d14a9cc24cb468e0e40815832baac3a11cdcd)

- **O que foi feito (mensagem do commit):** fix(production): corrige build do Enturma Desktop
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `774d14a9cc24cb468e0e40815832baac3a11cdcd`
- **Data de commit:** 2026-10-01 18:22 BRT · `2026-10-01T21:22:39.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Corrige a configuração do electron-builder v26 para permitir gerar o instalador Windows.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/774d14a9cc24cb468e0e40815832baac3a11cdcd)

#### 387. 18:18 BRT — [`f88be08631`](https://github.com/luizcordeiro155/Enturma/commit/f88be08631f03d8f6f6fb15894c9ce125e2d9261)

- **O que foi feito (mensagem do commit):** feat(production): hospeda instalador Desktop para download
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f88be08631f03d8f6f6fb15894c9ce125e2d9261`
- **Data de commit:** 2026-10-01 18:18 BRT · `2026-10-01T21:18:57.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Adiciona builder Windows via Wine e servidor de download do instalador Desktop sem GitHub Actions.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f88be08631f03d8f6f6fb15894c9ce125e2d9261)

#### 388. 18:09 BRT — [`578872b8d7`](https://github.com/luizcordeiro155/Enturma/commit/578872b8d78d2e01eba3401c2348414694e8f235)

- **O que foi feito (mensagem do commit):** feat(production): adiciona Enturma Desktop instalável
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `578872b8d78d2e01eba3401c2348414694e8f235`
- **Data de commit:** 2026-10-01 18:09 BRT · `2026-10-01T21:09:47.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Adiciona aplicativo Desktop em Electron, compartilhamento de tela, permissões de mídia, sessão persistente, tela offline, página de download e scripts locais de build/publicação sem GitHub Actions.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/578872b8d78d2e01eba3401c2348414694e8f235)

#### 389. 16:28 BRT — [`20a1e61576`](https://github.com/luizcordeiro155/Enturma/commit/20a1e6157607a928ded90a24a866667312245e52)

- **O que foi feito (mensagem do commit):** feat(production): feedback visual de autenticacao (#10)
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `20a1e6157607a928ded90a24a866667312245e52`
- **Data de commit:** 2026-10-01 16:28 BRT · `2026-10-01T19:28:51.000Z` UTC.
- **Pull Request associada à mensagem:** [#10](https://github.com/luizcordeiro155/Enturma/pull/10).

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
* feat(auth): informa email inexistente na recuperacao

* feat(web): anima estados de email na autenticacao

* style(web): adiciona animacoes para estados de conta

* test(auth): cobre recuperacao de email inexistente

* feat(auth): diferencia email inexistente e senha incorreta

* feat(web): destaca campos invalidos no cadastro e login

* feat(web): valida cadastro campo a campo com explicacoes

* style(web): destaca campos invalidos

* test(auth): diferencia erros de login
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/20a1e6157607a928ded90a24a866667312245e52)

#### 390. 16:15 BRT — [`6b38175f08`](https://github.com/luizcordeiro155/Enturma/commit/6b38175f0827848c929cb521673ba18a16e4de99)

- **O que foi feito (mensagem do commit):** fix(production): sincroniza confirmacao e recuperacao entre dispositivos
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `6b38175f0827848c929cb521673ba18a16e4de99`
- **Data de commit:** 2026-10-01 16:15 BRT · `2026-10-01T19:15:23.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Sincroniza redefinicao de senha e confirmacao de e-mail com o servidor, inclusive entre dispositivos, com animacoes e redirecionamentos automaticos.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/6b38175f0827848c929cb521673ba18a16e4de99)

#### 391. 15:58 BRT — [`91bcd287cb`](https://github.com/luizcordeiro155/Enturma/commit/91bcd287cbbfb44a627cc0b548cb99e10d0d2ec3)

- **O que foi feito (mensagem do commit):** fix(production): sincroniza redefinição de senha entre abas
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `91bcd287cbbfb44a627cc0b548cb99e10d0d2ec3`
- **Data de commit:** 2026-10-01 15:58 BRT · `2026-10-01T18:58:58.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/91bcd287cbbfb44a627cc0b548cb99e10d0d2ec3)

#### 392. 15:40 BRT — [`857cb69136`](https://github.com/luizcordeiro155/Enturma/commit/857cb691366a21144b2c7561f0594a673d0ebf48)

- **O que foi feito (mensagem do commit):** feat(production): verificação de e-mail ao vivo e redefinição segura
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `857cb691366a21144b2c7561f0594a673d0ebf48`
- **Data de commit:** 2026-10-01 15:40 BRT · `2026-10-01T18:40:06.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Adiciona telas animadas de espera e sucesso, contadores de 30 minutos para links, atualização automática do status de e-mail entre abas, redefinição de senha com logout global e redirecionamento seguro ao login.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/857cb691366a21144b2c7561f0594a673d0ebf48)

#### 393. 13:54 BRT — [`3a0d272f25`](https://github.com/luizcordeiro155/Enturma/commit/3a0d272f2599039bfb0abcedaf67653e80aa957c)

- **O que foi feito (mensagem do commit):** feat(production): confirmação de e-mail e recuperação de senha
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `3a0d272f2599039bfb0abcedaf67653e80aa957c`
- **Data de commit:** 2026-10-01 13:54 BRT · `2026-10-01T16:54:21.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Adiciona reenvio de confirmação, recuperação e redefinição de senha por e-mail, SMTP configurável, rate limit e testes de integração.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/3a0d272f2599039bfb0abcedaf67653e80aa957c)

#### 394. 13:21 BRT — [`e2c1bb206e`](https://github.com/luizcordeiro155/Enturma/commit/e2c1bb206e601503255cb59d518f63374dc91f8e)

- **O que foi feito (mensagem do commit):** fix(production): chamadas funcionam sem microfone detectado
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `e2c1bb206e601503255cb59d518f63374dc91f8e`
- **Data de commit:** 2026-10-01 13:21 BRT · `2026-10-01T16:21:25.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Permite entrar na chamada mesmo sem dispositivo de entrada, mantém o usuário conectado para ouvir/compartilhar tela e apresenta mensagens claras para ausência, bloqueio ou indisponibilidade de câmera e microfone.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/e2c1bb206e601503255cb59d518f63374dc91f8e)


## Setembro de 2026


### 29/09/2026 — 30 commit(s)

#### 395. 18:00 BRT — [`17b1fd9807`](https://github.com/luizcordeiro155/Enturma/commit/17b1fd980700c6d3bcecb85220b8e18bfec70883)

- **O que foi feito (mensagem do commit):** feat: sync encrypted private chats across browsers and devices [skip ci]
- **Tipo:** Funcionalidade · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `17b1fd980700c6d3bcecb85220b8e18bfec70883`
- **Data de commit:** 2026-09-29 18:00 BRT · `2026-09-29T21:00:36.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/17b1fd980700c6d3bcecb85220b8e18bfec70883)

#### 396. 17:44 BRT — [`064cffd14b`](https://github.com/luizcordeiro155/Enturma/commit/064cffd14bcece1f635c260311885d8f0fd3aa52)

- **O que foi feito (mensagem do commit):** fix: recover private chat setup and keep navigation accessible across screens [skip ci]
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `064cffd14bcece1f635c260311885d8f0fd3aa52`
- **Data de commit:** 2026-09-29 17:44 BRT · `2026-09-29T20:44:53.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/064cffd14bcece1f635c260311885d8f0fd3aa52)

#### 397. 13:02 BRT — [`afcd8c38bd`](https://github.com/luizcordeiro155/Enturma/commit/afcd8c38bdd0ee8437fe6bcd01a2b91c01479c34)

- **O que foi feito (mensagem do commit):** feat: add rewarded study journey, accessible tutorial and inbox clearing [skip ci]
- **Tipo:** Funcionalidade · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `afcd8c38bdd0ee8437fe6bcd01a2b91c01479c34`
- **Data de commit:** 2026-09-29 13:02 BRT · `2026-09-29T16:02:20.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/afcd8c38bdd0ee8437fe6bcd01a2b91c01479c34)

#### 398. 12:26 BRT — [`cb1d9c2afc`](https://github.com/luizcordeiro155/Enturma/commit/cb1d9c2afcfe73f8a3c5b9274b3663477131e710)

- **O que foi feito (mensagem do commit):** feat: add live notification inbox and confirmed forum links [skip ci]
- **Tipo:** Funcionalidade · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `cb1d9c2afcfe73f8a3c5b9274b3663477131e710`
- **Data de commit:** 2026-09-29 12:26 BRT · `2026-09-29T15:26:33.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/cb1d9c2afcfe73f8a3c5b9274b3663477131e710)

#### 399. 11:51 BRT — [`393c5569a6`](https://github.com/luizcordeiro155/Enturma/commit/393c5569a63c5ed11d5fd48d58f600e6c85649df)

- **O que foi feito (mensagem do commit):** feat: show recent forum highlights below live rooms on home [skip ci]
- **Tipo:** Funcionalidade · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `393c5569a63c5ed11d5fd48d58f600e6c85649df`
- **Data de commit:** 2026-09-29 11:51 BRT · `2026-09-29T14:51:41.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/393c5569a63c5ed11d5fd48d58f600e6c85649df)

#### 400. 11:44 BRT — [`6d2f8c921d`](https://github.com/luizcordeiro155/Enturma/commit/6d2f8c921d21c74066fbd527e8e776c33d40df73)

- **O que foi feito (mensagem do commit):** fix: place home above forum in navigation [skip ci]
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `6d2f8c921d21c74066fbd527e8e776c33d40df73`
- **Data de commit:** 2026-09-29 11:44 BRT · `2026-09-29T14:44:08.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/6d2f8c921d21c74066fbd527e8e776c33d40df73)

#### 401. 11:36 BRT — [`7251f68af7`](https://github.com/luizcordeiro155/Enturma/commit/7251f68af78c7e465c272f22195d78b342644c74)

- **O que foi feito (mensagem do commit):** feat: add community forum and live animated ride search across navigation [skip ci]
- **Tipo:** Funcionalidade · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `7251f68af78c7e465c272f22195d78b342644c74`
- **Data de commit:** 2026-09-29 11:36 BRT · `2026-09-29T14:36:08.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/7251f68af78c7e465c272f22195d78b342644c74)

#### 402. 11:01 BRT — [`9961670115`](https://github.com/luizcordeiro155/Enturma/commit/99616701157608f33daadec825ebd2eacebc53d8)

- **O que foi feito (mensagem do commit):** feat: animate ride matches add conversation lifecycle and prevent theme flash [skip ci]
- **Tipo:** Funcionalidade · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `99616701157608f33daadec825ebd2eacebc53d8`
- **Data de commit:** 2026-09-29 11:01 BRT · `2026-09-29T14:01:49.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/99616701157608f33daadec825ebd2eacebc53d8)

#### 403. 10:23 BRT — [`22bc4de7a0`](https://github.com/luizcordeiro155/Enturma/commit/22bc4de7a077f59a6cb0547249312ed0642bfd99)

- **O que foi feito (mensagem do commit):** feat: add study notebooks daily missions and fix profile and registration [skip ci]
- **Tipo:** Funcionalidade · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `22bc4de7a077f59a6cb0547249312ed0642bfd99`
- **Data de commit:** 2026-09-29 10:23 BRT · `2026-09-29T13:23:57.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/22bc4de7a077f59a6cb0547249312ed0642bfd99)

#### 404. 09:38 BRT — [`d18fb95780`](https://github.com/luizcordeiro155/Enturma/commit/d18fb95780ca45b4463511ae851af77b8a7a4a9c)

- **O que foi feito (mensagem do commit):** fix: restore games and polish profile editing room popovers and sharing [skip ci]
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `d18fb95780ca45b4463511ae851af77b8a7a4a9c`
- **Data de commit:** 2026-09-29 09:38 BRT · `2026-09-29T12:38:49.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d18fb95780ca45b4463511ae851af77b8a7a4a9c)

#### 405. 09:06 BRT — [`a2afdd844b`](https://github.com/luizcordeiro155/Enturma/commit/a2afdd844bba625e553e4be92f4badeea4e23925)

- **O que foi feito (mensagem do commit):** feat: improve rooms accessibility games profiles and encrypted friendships [skip ci]
- **Tipo:** Funcionalidade · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `a2afdd844bba625e553e4be92f4badeea4e23925`
- **Data de commit:** 2026-09-29 09:06 BRT · `2026-09-29T12:06:43.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a2afdd844bba625e553e4be92f4badeea4e23925)

#### 406. 06:55 BRT — [`ce059bdefb`](https://github.com/luizcordeiro155/Enturma/commit/ce059bdefb6954eb6f7750c0c1b32805fc40f1f4)

- **O que foi feito (mensagem do commit):** feat: finalize rooms calls themes and learning games [skip ci]
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `ce059bdefb6954eb6f7750c0c1b32805fc40f1f4`
- **Data de commit:** 2026-09-29 06:55 BRT · `2026-09-29T09:55:13.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/ce059bdefb6954eb6f7750c0c1b32805fc40f1f4)

#### 407. 06:33 BRT — [`4a2a723849`](https://github.com/luizcordeiro155/Enturma/commit/4a2a72384959d02cadd5a36b231dcf3a983066fc)

- **O que foi feito (mensagem do commit):** fix(web): make room realtime effects lint-safe
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `4a2a72384959d02cadd5a36b231dcf3a983066fc`
- **Data de commit:** 2026-09-29 06:33 BRT · `2026-09-29T09:33:47.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/4a2a72384959d02cadd5a36b231dcf3a983066fc)

#### 408. 06:33 BRT — [`8c463c8613`](https://github.com/luizcordeiro155/Enturma/commit/8c463c8613f9053ff7c8a98723fc02941927ed40)

- **O que foi feito (mensagem do commit):** fix(web): make programming lab effects lint-safe
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8c463c8613f9053ff7c8a98723fc02941927ed40`
- **Data de commit:** 2026-09-29 06:33 BRT · `2026-09-29T09:33:34.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8c463c8613f9053ff7c8a98723fc02941927ed40)

#### 409. 06:33 BRT — [`b87daf7bc7`](https://github.com/luizcordeiro155/Enturma/commit/b87daf7bc77a182130684005a33561556d6981e1)

- **O que foi feito (mensagem do commit):** fix(web): avoid synchronous preference state in effect
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `b87daf7bc77a182130684005a33561556d6981e1`
- **Data de commit:** 2026-09-29 06:33 BRT · `2026-09-29T09:33:19.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/b87daf7bc77a182130684005a33561556d6981e1)

#### 410. 06:31 BRT — [`d809234bce`](https://github.com/luizcordeiro155/Enturma/commit/d809234bced0822667de6386e243f1e64da7b865)

- **O que foi feito (mensagem do commit):** test(chat): validate active-room history behavior
- **Tipo:** Testes · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `d809234bced0822667de6386e243f1e64da7b865`
- **Data de commit:** 2026-09-29 06:31 BRT · `2026-09-29T09:31:08.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/d809234bced0822667de6386e243f1e64da7b865)

#### 411. 06:30 BRT — [`705c6c1348`](https://github.com/luizcordeiro155/Enturma/commit/705c6c1348cfda2ddbc777c9ec5cb654ec96108b)

- **O que foi feito (mensagem do commit):** fix(ai): avoid provider calls for empty rooms
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `705c6c1348cfda2ddbc777c9ec5cb654ec96108b`
- **Data de commit:** 2026-09-29 06:30 BRT · `2026-09-29T09:30:58.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/705c6c1348cfda2ddbc777c9ec5cb654ec96108b)

#### 412. 06:28 BRT — [`f654ec543d`](https://github.com/luizcordeiro155/Enturma/commit/f654ec543de59a5c9ed397c04b088bb797089a5d)

- **O que foi feito (mensagem do commit):** privacy(chat): purge raw AI history when room closes
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `f654ec543de59a5c9ed397c04b088bb797089a5d`
- **Data de commit:** 2026-09-29 06:28 BRT · `2026-09-29T09:28:55.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f654ec543de59a5c9ed397c04b088bb797089a5d)

#### 413. 06:28 BRT — [`6ea178fe3c`](https://github.com/luizcordeiro155/Enturma/commit/6ea178fe3c7779526d15c6889eb4b75cf3accc92)

- **O que foi feito (mensagem do commit):** privacy(ai): keep raw prompts ephemeral
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `6ea178fe3c7779526d15c6889eb4b75cf3accc92`
- **Data de commit:** 2026-09-29 06:28 BRT · `2026-09-29T09:28:47.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/6ea178fe3c7779526d15c6889eb4b75cf3accc92)

#### 414. 06:28 BRT — [`a637eccc19`](https://github.com/luizcordeiro155/Enturma/commit/a637eccc19f8e6b0113c2bf045b80a7825e5c3c5)

- **O que foi feito (mensagem do commit):** fix(study): compare room history timestamps in database
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `a637eccc19f8e6b0113c2bf045b80a7825e5c3c5`
- **Data de commit:** 2026-09-29 06:28 BRT · `2026-09-29T09:28:40.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a637eccc19f8e6b0113c2bf045b80a7825e5c3c5)

#### 415. 06:25 BRT — [`a543291f81`](https://github.com/luizcordeiro155/Enturma/commit/a543291f81e60482ed56eacdeac45396253eafcf)

- **O que foi feito (mensagem do commit):** fix(chat): keep service compatibility for integration tests
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `a543291f81e60482ed56eacdeac45396253eafcf`
- **Data de commit:** 2026-09-29 06:25 BRT · `2026-09-29T09:25:46.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a543291f81e60482ed56eacdeac45396253eafcf)

#### 416. 06:24 BRT — [`861a13d399`](https://github.com/luizcordeiro155/Enturma/commit/861a13d3991258e17c38f5a571357e7dd7fe48db)

- **O que foi feito (mensagem do commit):** feat(profile): add avatar banner bio and accent customization
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `861a13d3991258e17c38f5a571357e7dd7fe48db`
- **Data de commit:** 2026-09-29 06:24 BRT · `2026-09-29T09:24:34.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/861a13d3991258e17c38f5a571357e7dd7fe48db)

#### 417. 06:23 BRT — [`22d4db26e8`](https://github.com/luizcordeiro155/Enturma/commit/22d4db26e8a52087b19da6938bc5a28ad3603704)

- **O que foi feito (mensagem do commit):** feat(profile): add Discord-style profile customization
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `22d4db26e8a52087b19da6938bc5a28ad3603704`
- **Data de commit:** 2026-09-29 06:23 BRT · `2026-09-29T09:23:18.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/22d4db26e8a52087b19da6938bc5a28ad3603704)

#### 418. 06:21 BRT — [`63299966b7`](https://github.com/luizcordeiro155/Enturma/commit/63299966b7630fec3fa55c751f4d09ea6032de45)

- **O que foi feito (mensagem do commit):** fix: disambiguate regex Pattern in advanced learning
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `63299966b7630fec3fa55c751f4d09ea6032de45`
- **Data de commit:** 2026-09-29 06:21 BRT · `2026-09-29T09:21:51.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/63299966b7630fec3fa55c751f4d09ea6032de45)

#### 419. 06:20 BRT — [`ce600ef54e`](https://github.com/luizcordeiro155/Enturma/commit/ce600ef54e12811c62da75b23c92f46c89e12e6a)

- **O que foi feito (mensagem do commit):** feat: redesign study rooms, ephemeral closeout and advanced practice
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `ce600ef54e12811c62da75b23c92f46c89e12e6a`
- **Data de commit:** 2026-09-29 06:20 BRT · `2026-09-29T09:20:05.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/ce600ef54e12811c62da75b23c92f46c89e12e6a)

#### 420. 03:24 BRT — [`8fac769c78`](https://github.com/luizcordeiro155/Enturma/commit/8fac769c780aebe74f27ff180e634ede422f80a9)

- **O que foi feito (mensagem do commit):** feat(production): sala estilo Discord, imagens 8MB e OpenAI fixa
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `8fac769c780aebe74f27ff180e634ede422f80a9`
- **Data de commit:** 2026-09-29 03:24 BRT · `2026-09-29T06:24:16.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Atualização única de produção com chat E2EE e prévia de imagens, chamadas LiveKit com participantes/fala/screen share visíveis, Permissions-Policy de mídia corrigida, Enturma AI com gpt-5.6-sol definido no backend e documentação atualizada.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8fac769c780aebe74f27ff180e634ede422f80a9)

#### 421. 02:50 BRT — [`9edc085d95`](https://github.com/luizcordeiro155/Enturma/commit/9edc085d955e78f37b3e2cbb116513d3bdf75305)

- **O que foi feito (mensagem do commit):** feat(production): colaboração E2EE, chamadas, Enturma AI e XP
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `9edc085d955e78f37b3e2cbb116513d3bdf75305`
- **Data de commit:** 2026-09-29 02:50 BRT · `2026-09-29T05:50:43.000Z` UTC.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Atualização única de produção do Enturma com chat efêmero E2EE, imagens e reações, chamadas LiveKit com câmera e compartilhamento de tela, Enturma AI com OpenAI e fontes, XP/streak/desafio diário, segurança de autenticação e documentação de deploy.
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/9edc085d955e78f37b3e2cbb116513d3bdf75305)

#### 422. 01:50 BRT — [`a56959a400`](https://github.com/luizcordeiro155/Enturma/commit/a56959a4001be6dbe653ff41d64bdb710db8c17e)

- **O que foi feito (mensagem do commit):** fix(deploy): build API on native SquareCloud Git synchronization (#3)
- **Tipo:** Correção · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `a56959a4001be6dbe653ff41d64bdb710db8c17e`
- **Data de commit:** 2026-09-29 01:50 BRT · `2026-09-29T04:50:38.000Z` UTC.
- **Pull Request associada à mensagem:** [#3](https://github.com/luizcordeiro155/Enturma/pull/3).

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a56959a4001be6dbe653ff41d64bdb710db8c17e)

#### 423. 01:31 BRT — [`7703ecd6e7`](https://github.com/luizcordeiro155/Enturma/commit/7703ecd6e7407fad17246b9107984d06bf151c7f)

- **O que foi feito (mensagem do commit):** feat: verified academic catalog with UNA curricula and programming minigames (#2)
- **Tipo:** Funcionalidade · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `7703ecd6e7407fad17246b9107984d06bf151c7f`
- **Data de commit:** 2026-09-29 01:31 BRT · `2026-09-29T04:31:07.000Z` UTC.
- **Pull Request associada à mensagem:** [#2](https://github.com/luizcordeiro155/Enturma/pull/2).

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/7703ecd6e7407fad17246b9107984d06bf151c7f)

#### 424. 00:04 BRT — [`a87b17a55e`](https://github.com/luizcordeiro155/Enturma/commit/a87b17a55ef9eca986ea8e89a3ee6e8f124146bc)

- **O que foi feito (mensagem do commit):** fix(api): accept Railway PostgreSQL URLs on SquareCloud
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `a87b17a55ef9eca986ea8e89a3ee6e8f124146bc`
- **Data de commit:** 2026-09-29 00:04 BRT · `2026-09-29T03:04:06.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/a87b17a55ef9eca986ea8e89a3ee6e8f124146bc)


### 28/09/2026 — 8 commit(s)

#### 425. 23:43 BRT — [`db0fb18798`](https://github.com/luizcordeiro155/Enturma/commit/db0fb187981c12e4d74b9dbde1fa756fd4c00968)

- **O que foi feito (mensagem do commit):** Merge Enturma platform and SquareCloud/Vercel deployment
- **Tipo:** Integração · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `db0fb187981c12e4d74b9dbde1fa756fd4c00968`
- **Data de commit:** 2026-09-28 23:43 BRT · `2026-09-29T02:43:49.000Z` UTC.
- **Tipo de integração:** commit de merge com 2 pais.

<details>
<summary>Detalhamento original do commit</summary>

~~~~text
Enturma: plataforma integrada e deploy web Vercel + API SquareCloud
~~~~

</details>

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/db0fb187981c12e4d74b9dbde1fa756fd4c00968)

#### 426. 23:38 BRT — [`6f1a876985`](https://github.com/luizcordeiro155/Enturma/commit/6f1a876985d8a9667e255f162002ece698e198e0)

- **O que foi feito (mensagem do commit):** feat(deploy): prepare SquareCloud API package and Vercel web hosting
- **Tipo:** Funcionalidade · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `6f1a876985d8a9667e255f162002ece698e198e0`
- **Data de commit:** 2026-09-28 23:38 BRT · `2026-09-29T02:38:25.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/6f1a876985d8a9667e255f162002ece698e198e0)

#### 427. 23:09 BRT — [`1845101d19`](https://github.com/luizcordeiro155/Enturma/commit/1845101d19db79b2fdbe5f2d0f3424a3ad1c311d)

- **O que foi feito (mensagem do commit):** fix(mobile): reuse rotated sessions after delayed unauthorized responses
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `1845101d19db79b2fdbe5f2d0f3424a3ad1c311d`
- **Data de commit:** 2026-09-28 23:09 BRT · `2026-09-29T02:09:54.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/1845101d19db79b2fdbe5f2d0f3424a3ad1c311d)

#### 428. 23:07 BRT — [`117400ce5e`](https://github.com/luizcordeiro155/Enturma/commit/117400ce5e01773dabb41f0ef27aa711c763f180)

- **O que foi feito (mensagem do commit):** fix(ci): quote PostgreSQL service healthcheck for Actions runner
- **Tipo:** Correção · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `117400ce5e01773dabb41f0ef27aa711c763f180`
- **Data de commit:** 2026-09-28 23:07 BRT · `2026-09-29T02:07:57.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/117400ce5e01773dabb41f0ef27aa711c763f180)

#### 429. 23:06 BRT — [`8db8513d14`](https://github.com/luizcordeiro155/Enturma/commit/8db8513d14cd5e91e5816dc697a80af9fe821b7a)

- **O que foi feito (mensagem do commit):** docs: document delivery scope and automate platform verification
- **Tipo:** Documentação · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `8db8513d14cd5e91e5816dc697a80af9fe821b7a`
- **Data de commit:** 2026-09-28 23:06 BRT · `2026-09-29T02:06:20.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/8db8513d14cd5e91e5816dc697a80af9fe821b7a)

#### 430. 23:06 BRT — [`f37fe37d11`](https://github.com/luizcordeiro155/Enturma/commit/f37fe37d11b3caacd193fd08fe8da99966ffb217)

- **O que foi feito (mensagem do commit):** feat(apps): connect web and native study flows with end-to-end coverage
- **Tipo:** Funcionalidade · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `f37fe37d11b3caacd193fd08fe8da99966ffb217`
- **Data de commit:** 2026-09-28 23:06 BRT · `2026-09-29T02:06:16.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/f37fe37d11b3caacd193fd08fe8da99966ffb217)

#### 431. 23:05 BRT — [`874367ae20`](https://github.com/luizcordeiro155/Enturma/commit/874367ae20ea8a9924c666c4fe24dc7eb609be63)

- **O que foi feito (mensagem do commit):** feat(api): implement academic study platform services and migrations
- **Tipo:** Funcionalidade · **Autor:** luiz (`@luizcordeiro155`) · **SHA completo:** `874367ae20ea8a9924c666c4fe24dc7eb609be63`
- **Data de commit:** 2026-09-28 23:05 BRT · `2026-09-29T02:05:59.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/874367ae20ea8a9924c666c4fe24dc7eb609be63)

#### 432. 21:46 BRT — [`dcfda562a4`](https://github.com/luizcordeiro155/Enturma/commit/dcfda562a488a4eeed209dcb4afaf3df1f818fff)

- **O que foi feito (mensagem do commit):** Initial commit
- **Tipo:** Alteração geral · **Autor:** Luiz Cordeiro (`@luizcordeiro155`) · **SHA completo:** `dcfda562a488a4eeed209dcb4afaf3df1f818fff`
- **Data de commit:** 2026-09-28 21:46 BRT · `2026-09-29T00:46:24.000Z` UTC.

[Inspecionar diff e arquivos alterados](https://github.com/luizcordeiro155/Enturma/commit/dcfda562a488a4eeed209dcb4afaf3df1f818fff)

---

## Conferência e rastreabilidade

1. Abra o [histórico completo da `main`](https://github.com/luizcordeiro155/Enturma/commits/main) e compare o ponto de corte `410a740c05027cec8742f3c189a9b6d3f33b0965`.
2. Busque um SHA nesta página, confira o horário UTC (o GitHub pode exibir outro fuso) e abra o link de **diff e arquivos alterados**.
3. Para auditoria de funcionalidades e regressões, associe o SHA a uma PR, teste ou issue e registre o resultado da validação funcional separadamente.
4. Para auditoria de produção, vincule o SHA a um deployment Vercel, SquareCloud ou Railway e aos logs do serviço. O GitHub registra commits, não a comprovação do comportamento em produção.
5. Repita a coleta ao incorporar novos commits à `main`; esta página é um **snapshot datado**, não um registro atualizado automaticamente.

**Total conferido para este snapshot:** 432 registros, 432 SHAs únicos, de 2026-09-28 21:46 até 2026-11-07 02:26 (BRT).
