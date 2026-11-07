# Expansão acadêmica — UNA, UFMG, PUC Minas e Newton (06/11/2026)

## Escopo implementado

A branch adiciona novos documentos acadêmicos ao fluxo de importação auditável, sem modificar os IDs ou as matrizes já existentes.

| Instituição | Curso | Conteúdo coletado | Fonte |
|---|---|---|---|
| UNA | Jogos Digitais — tecnólogo | Componentes curriculares explicitados na página pública | https://www.una.br/cursos/graduacao/jogos-digitais-graduacao-tecnologica/ |
| UFMG | Engenharia de Computação — bacharelado | Amostra de disciplinas e códigos da grade oficial por períodos (1–10) | https://www.ufmg.br/engcomp/ |
| PUC Minas | Jogos Digitais — bacharelado | 1º período da grade de 03/10/2026 | https://www.pucminas.br/campus/lourdes/ensino/graduacao/Paginas/Jogos-Digitais.aspx?curso=444 |
| Newton Paiva | Análise e Desenvolvimento de Sistemas — EAD | Cinco períodos da **matriz histórica 2021-1**, com cargas horárias | https://newtonpaiva.br/wp-content/uploads/2021/08/Matriz_curricular_ADS_EaD_2021-1.pdf |

## Status e limitações importantes

Todos os novos registros foram intencionalmente cadastrados como `PENDING_VERIFICATION`: os documentos institucionais foram consultados, mas ainda faltam preservar e conferir os bytes originais de cada fonte, calcular o SHA-256 real dos documentos e confirmar vigência, unidade e modalidade. Não inserir um digest arbitrário. Esses registros **não aparecem como grades verificadas no onboarding** nem são promovidos automaticamente a cursos oficiais. O job solicita revisão pelo painel administrativo. O processo exige validar a hierarquia, disponibilidade e dados curriculares contra a fonte. Em caso de aprovação, utilizar o fluxo de revisão e auditoria existente.

**UNA:** a página do curso informa inscrições encerradas e não comprova oferta ativa na unidade Aimorés. A vinculação de campus é provisória para revisão; não publicá-la sem confirmar. As duas UCs são apenas o recorte visível da página pública, não uma grade completa de cinco semestres.

**UFMG:** a matriz do curso apresenta dez períodos e algumas disciplinas optativas/formação complementar. Nesta coleta foi usada uma amostra dos componentes obrigatórios oficialmente identificados por código; não afirmar que é a matriz completa.

**PUC Minas:** apenas o primeiro período foi estruturado; não afirmar que os demais foram importados.

**Newton:** a matriz é de **2021-1**. Ela não comprova turmas abertas, polo EAD atual ou vigência para ingressantes de 2026. O polo de referência precisa ser substituído por oferta/campus real confirmado antes da publicação.

## Procedimento para liberar ao aluno

1. Obter e arquivar captura binária de cada fonte oficial e computar SHA-256 sobre esses bytes.
2. Confirmar os cursos, ofertas, turnos/campi, versão e semestres com fontes institucionais da oferta.
3. Validar cada ocorrência de disciplina e obrigatoriedade/carga horária contra a versão correta.
4. Submeter os registros que faltam e aprovar explicitamente em `/admin/catalog/review` com procedência auditada.
5. Verificar `/admin/catalog/imports` e `/catalog/coverage/summary`, revisar onboarding web/mobile e confirmar que nenhum cadastro existente foi alterado.

Não habilitar ou reclassificar em lote para `VERIFIED` apenas para aumentar métricas. O caminho seguro para publicar a expansão é usar a revisão administrativa.
