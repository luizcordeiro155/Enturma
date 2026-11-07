# Expansão do catálogo — UNA, UFMG, PUC Minas e Newton

## Correção da importação de novembro de 2026

A primeira entrega (#141) publicou apenas arquivos `PENDING_VERIFICATION`. O worker tratava esses itens como pendentes, não os gravava em `academic_entry` e contabilizava o resultado `COMPLETED_WITH_ERRORS`; os estudantes não viam os cursos nem as matérias. As notificações mostradas em 07/11 foram geradas por esses jobs anteriores.

Esta atualização **substitui** os snapshots pendentes por transcrições de matrizes e componentes curriculares publicados em fontes institucionais e usa o importador já existente. Todos os registros importados têm pai, fonte, versão, curso, currículo, períodos e disciplinas, integrados às APIs de matrícula, pesquisa e salas do Enturma. O teste de integração verifica curso e grade com status `VERIFIED` e conta disciplinas efetivamente persistidas nas tabelas normalizadas.

## Dados incluídos

| Provider | Curso e fonte | Períodos/blocos | Disciplinas/UCs |
|---|---|---:|---:|
| UNA | Jogos Digitais, PPC institucional (2023): https://www.una.br/wp-content/uploads/2024/03/PPC_CST.Jogos-Digitais_UNA.pdf | 5 blocos flexíveis | 11 |
| UFMG | Engenharia de Computação, grade e códigos: https://www.ufmg.br/engcomp/ | 10 períodos | 52 |
| PUC Minas | Jogos Digitais, turno tarde, grade de 06/09/2026: https://www.pucminas.br/campus/lourdes/ensino/graduacao/Paginas/Jogos-Digitais.aspx?curso=444 | 8 períodos | 62 |
| Newton | Análise e Desenvolvimento de Sistemas EAD, grade de 2023: https://newtonpaiva.br/wp-content/uploads/2023/02/ANALISE-E-DESENVOLVIMENTO-DE-SISTEMAS.pdf | 5 períodos | 31 |

Os arquivos `services/api/src/main/resources/catalog/evidence/{provider}.json` guardam as **transcrições estruturadas revisadas** e as URLs de origem. O campo `source.contentHash` nos snapshots é SHA-256 dos bytes UTF-8 de **cada transcrição versionada**, testado em CI. **Não é hash dos bytes do PDF/HTML remoto** e não atesta sozinho autenticidade, vigência ou matrícula atual. `MANUAL_VERIFIED` indica conferência manual da transcrição, não uma certificação da instituição. Não tratar esse digest como prova criptográfica de que o site permanece idêntico à versão consultada.

## Limitações e fidelidade curricular

- **UNA:** os cinco grupos são blocos representativos da organização do PPC. A faculdade usa percurso flexível; o app os exibe como blocos, não como atribuição universal a semestres individuais. O PPC é histórico; a grade do estudante deve ser confrontada com a matrícula atual no Ulife.
- **UFMG:** as 52 disciplinas são componentes específicos da grade de Engenharia de Computação. Créditos de optativas, formação complementar e componentes sem identidade curricular determinada não foram inventados.
- **PUC Minas:** turnos, nomes e cargas horárias vieram da página institucional; uma mesma denominação pode aparecer em mais de um período. Conservar as ocorrências separadas, sem fundir disciplinas por nome.
- **Newton:** a matriz EAD é histórica (2023). Campus/polo físico não consta do PDF; o cadastro usa identificador lógico `Ensino a distância (EAD)` e não deve afirmar a existência de um endereço presencial desse polo. Confirmar qual matriz se aplica ao ingresso do usuário.

## Validação e operação

1. Executar `mvn -B -f services/api/pom.xml verify` com PostgreSQL de teste; o teste `officialCatalogImportsAreCompleteAndIdempotent` afirma que cada importação concluiu sem erro e que cada oferta, grade e suas disciplinas realmente existem.
2. Conferir `/admin/catalog/imports` e `/catalog/coverage/summary`; jobs novos têm chave hash diferente e não reaproveitam falhas anteriores.
3. Confirmar que `/catalog/onboarding/options` apresenta instituição, campus, oferta, grade, período e UCs, incluindo filtros e paginação em Web/Android/Desktop.
4. As notificações `COMPLETED_WITH_ERRORS` emitidas pela versão anterior são histórico verdadeiro dos jobs antigos; não apagar o log/auditoria nem mascarar o erro.
5. Não declarar esta atualização de backend publicada somente porque a Vercel liberou a interface. O processo Java precisa ser atualizado no Railway/SquareCloud e seus novos jobs precisam efetivamente atingir `COMPLETED`.

Fontes futuras ou alterações de grades requerem novas versões documentadas e auditoria em vez de sobrescrever disciplinas já publicadas.
