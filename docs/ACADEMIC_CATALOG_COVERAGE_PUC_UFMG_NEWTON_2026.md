# Cobertura acadêmica — PUC Minas, UFMG e Newton Paiva

**Revisão:** 07/11/2026 • **Dados:** Catálogo oficial e matrizes institucionais historicamente publicadas.

## Objetivo e limites

A UNA já conta com 103 ofertas e 18 grades. A expansão adiciona **ofertas de cursos e matrizes documentadas**, sem inventar disciplinas, pré-requisitos, cargas horárias ou períodos ausentes das fontes. Os números de oferta representam **curso + unidade/modalidade**, não 271 graduações distintas. As fontes públicas não comprovam a lista completa de matrizes para *todos* os cursos. Identificar o ano da matriz e não confundir a listagem da oferta com currículo confirmado.

### Novas ofertas com origem institucional

| Universidade | Novas ofertas | Referência |
|---|---:|---|
| UFMG | 94 | [Lista por Belo Horizonte](https://www.ufmg.br/prograd/belo-horizonte/) e [Montes Claros](https://www.ufmg.br/prograd/montes-claros/). Já havia SI e Eng. Computação com grades no Enturma |
| PUC Minas | 133 | [Cursos de graduação por unidade](https://www.pucminas.br/graduacao/_layouts/15/cursos/graduacao.aspx), distribuídos em Barreiro, Betim, Contagem, Coração Eucarístico, Lourdes, Poços de Caldas, São Gabriel e PUC Virtual. Três ofertas com matriz anterior não são duplicadas |
| Newton Paiva | 44 | [Relação presencial de rematrícula 2025.2](https://newtonpaiva.br/formas-de-entrada/rematricula/) e [Anexo IV EAD/Flex de 2025.1](https://newtonpaiva.br/wp-content/uploads/2024/11/ANEXO-IV-QUADRO-DE-OFERTA-DE-VAGAS-.pdf): 20 presenciais e 24 EAD/Flex. **Não comprova oferta vigente em 2026; conferir unidade, campus e turno por curso** |

Campi lógicos de UFMG por cidade e de Newton por modalidade servem somente para **organizar a seleção**: não representam endereço ou polo físico real. Deve-se confirmar a unidade verdadeira antes de usar matrícula por campus. Identificadores externos novos preservam a identidade e o histórico das ofertas anteriores.

### Novas matrizes detalhadas nesta entrega

| Universidade | Curso | Documento | Organização | Disciplinas nominalmente identificadas |
|---|---|---|---:|---:|
| Newton Paiva | Psicologia | [Grade 2021.1](https://newtonpaiva.br/wp-content/uploads/2021/07/Psicologia.pdf) | 10 períodos | 63 |
| Newton Paiva | Ciência da Computação | [Matriz presencial de 2023](https://newtonpaiva.br/wp-content/uploads/2023/08/Matriz_curricular_CC_presencial.pdf) | 8 períodos | 49 |
| PUC Minas | Sistemas de Informação — Uberlândia | [Página e grade de 2023](https://www.pucminas.br/campus/uberlandia/ensino/graduacao/Paginas/Sistemas-de-Informacao.aspx) | 8 períodos | 52 |
| UFMG | Estatística | [Matriz 2024/1](https://www.est.ufmg.br/portal/graduacao-estatistica-ufmg/) | 8 períodos | 31 |

**Total novo de matrizes nesta entrega:** 4, com 195 ocorrências de componentes curriculares. A UFMG Estatística documenta apenas **disciplinas obrigatórias com nome/código próprio**; cargas globais de optativas/formação livre não foram convertidas em disciplinas artificiais. PUC Uberlândia mantém nomes sem cargas horárias quando não disponíveis na consulta. Newton Ciência Computação inclui as três optativas como componentes curriculares sem nome específico e 120 horas complementares fora dos períodos.

**Matrizes já presentes antes da entrega:** PUC SI Barreiro, Ciência da Computação Poços e Jogos Digitais Lourdes; UFMG Sistemas de Informação e Engenharia de Computação; Newton ADS EAD. Esta PR não reescreve essas matrizes nem toca matrícula de estudantes existentes.

## Rastreabilidade

- `catalog/expansions/*-course-list.json`: ofertas verificadas pela listagem da instituição; curso sem grade mantém `hasCurriculum=false` e permite solicitar disponibilidade.
- `catalog/expansions/{ufmg-estatistica-2024,newton-psychology-2021,newton-computacao-2023,pucminas-si-uberlandia-2023}.json`: novos componentes curriculares associados às ofertas importadas.
- `catalog/evidence/*.json`: transcrição versionada da fonte. O SHA-256 em `source.contentHash` é do **arquivo de transcrição UTF-8**, não do PDF/HTML remoto. `MANUAL_VERIFIED` significa transcrição revisada pelo projeto, **não chancela da universidade nem comprovação de vigência atual**.
- Os registros são semeados pelo `CatalogBootstrap` na ordem pais → filhos. Jobs são idempotentes por seed de conteúdo e auditados.
- Não apagar os jobs antigos `COMPLETED_WITH_ERRORS`; são histórico válido e não devem ser confundidos com falha dos novos dados.

## Critérios para publicação

1. Teste `UniversityCatalogCoverageTest`: contagens, integridade da transcrição SHA-256, tipos e integridade estrutural.
2. Integração `PlatformIntegrationTest.expandedUniversitiesAreSelectableAndHistoricalCurriculaPersist`: 3 jobs completos de listas, sem erros, 271 cursos novos persistidos, quatro grades acessíveis e 195 disciplinas normalizadas.
3. Confirmar que `GET /api/v1/catalog/onboarding/options?kind=COURSE&parentId=...&search=...` retorna as ofertas e `hasCurriculum` correto; verificar paginação por 30 itens e estados sem grade.
4. Testar em produção **apenas após** backend atualizado na SquareCloud e job `COMPLETED`. A Vercel não hospeda a importação Java.
5. Não reportar equivalência à cobertura da UNA ou totalidade de currículos antes de obter todas as fontes oficiais de cada matriz institucional, curso, unidade, modalidade e ingresso.
