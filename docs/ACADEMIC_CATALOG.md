# Catálogo acadêmico V2

O backend inclui snapshots revisados de fontes oficiais. Na primeira inicialização, cria jobs persistidos; a cada lote publica até 100 registros. Reinícios retomam o processamento. O bootstrap é idempotente pelo hash do documento, sem dependência de scraping durante o cadastro.

## Cobertura desta entrega

| Provider | Instituições | Campi | Ofertas conhecidas | Grades | Ocorrências de disciplinas |
|---|---:|---:|---:|---:|---:|
| UNA | 1 | 10 | 103 | 18 | 400 |
| PUC Minas | 1 | 2 | 3 | 3 | 192 |
| UFMG | 1 | 1 | 1 | 1 | 35 |

As 18 matrizes UNA correspondem às modalidades vinculadas a Aimorés nas páginas dos cursos: ADS, Ciência da Computação, Engenharia de Software, Administração, Psicologia, Ciências Contábeis, Engenharia Civil e Biomedicina. Outras ofertas vêm da tabela oficial ProUni 2026.1 e podem ainda não ter grade. Oferta não equivale a curso conceitual, e o total de disciplinas acima conta ocorrências em matrizes distintas.

No onboarding: universidade → campus → oferta do curso → versão da grade → período/nível → UCs atuais. As opções vêm da mesma API para web e mobile. Busca ignora acentos, reconhece aliases documentados como ADS e prioriza UNA/Aimorés e ofertas com grade disponível. Não há cadastro livre de nomes acadêmicos pelo estudante.

## Ampliação de novembro de 2026

A cobertura inicial descrita na tabela acima permanece como referência histórica dos primeiros snapshots; ela **não inclui** a ampliação subsequente.

A correção da importação inclui quatro ofertas adicionais, estruturadas nas mesmas tabelas normalizadas e nas APIs de matrícula. A fonte institucional, a versão e as limitações estão documentadas em [Expansão do catálogo](ACADEMIC_CATALOG_EXPANSION_2026_11.md):

| Provider | Curso acrescentado | Ocorrências curriculares | Organização |
|---|---|---:|---|
| UNA | Jogos Digitais | 11 UCs | 5 blocos flexíveis do PPC |
| UFMG | Engenharia de Computação | 52 | 10 períodos; optativas sem denominação não inventadas |
| PUC Minas | Jogos Digitais | 62 | 8 períodos |
| Newton | Análise e Desenvolvimento de Sistemas EAD | 31 | 5 períodos; matriz histórica de 2023 |

A presença no GitHub/Vercel **não comprova** atualização do backend: é preciso que o Java atualizado rode no servidor, que os jobs de importação terminem com `COMPLETED`, e que a API de onboarding devolva as novas ofertas. O SHA-256 documentado da expansão protege as transcrições versionadas, não autentica os bytes dos documentos originais.

## Ampliação adicional — PUC Minas, UFMG e Newton Paiva (07/11/2026)

A nova [cobertura detalhada](ACADEMIC_CATALOG_COVERAGE_PUC_UFMG_NEWTON_2026.md) acrescenta **271 novas ofertas** de cursos às listas verificadas: 133 PUC Minas, 94 UFMG e 44 Newton Paiva (as ofertas Newton são do edital histórico 2025). Acrescenta ainda **quatro novas matrizes** com 195 componentes curriculares documentados: Psicologia e Ciência da Computação da Newton, Sistemas de Informação da PUC Uberlândia e Estatística da UFMG.

A quantidade de cursos ofertados não equivale à quantidade de grades conferidas. Quando um curso não tem matriz oficial verificada, ele pode ser selecionado para solicitação de grade, mas **não recebe matérias ou períodos inventados**. Matrizes históricas devem ser conferidas com a versão e modalidade da matrícula do aluno.

## ADS UNA Aimorés

A matriz E2A Radial organiza o nível Fundamental nos semestres 1–2. Inclui **Interação humano computador e UX**, **Algoritmos e programação**, **Exploração digital e fundamentos tecnológicos** e **Matemática computacional aplicada**, cada uma com 160h. O estudante seleciona as UCs atuais; ter cursado as duas primeiras em 2026.1 não transforma essa sequência individual em uma regra para todas as turmas.

A versão pública não declara vigência por ingresso. Por isso, o catálogo identifica a captura pelo SHA-256, mostra a organização por níveis e pede conferência com a matrícula no Ulife. Não atribui artificialmente essas UCs ao 1º ou 2º semestre. Não usa identificadores privados de turmas como códigos oficiais de disciplinas.

## Cobertura e manutenção

`/admin/catalog` mostra contagens, jobs, revisão, fontes, eventos, auditoria e prioridades de solicitações. Cobertura é a proporção entre ofertas **conhecidas** e ofertas conhecidas com grade verificada; não é uma porcentagem de todo o Brasil. O e-MEC aceita exportações oficiais revisadas, sem depender de endpoint público não documentado. UFOP, CEFET-MG, UniBH e demais instituições devem passar pelo mesmo processo de coleta e revisão antes de serem publicadas.

Uma grade ausente mostra “Esta grade ainda está sendo verificada” e permite solicitar disponibilidade. Reimportações com mudanças ficam em revisão. Não se geram disciplinas ou semestres para preencher lacunas.

## Laboratório de programação

A implementação inicial de `/learn` oferecia 12 desafios em três jogos JavaScript: rota do algoritmo, laboratório binário e detetive de código. O conjunto atual inclui também **Termo Dev** (quatro jogos de TI); os 12 desafios não representam o inventário total atual. API confere matrícula verificada em curso ou UC marcada como TI; menus e página usam essa mesma decisão. O backend revalida respostas e grava tentativas/conclusões por usuário. Não há `eval`, execução livre de código ou pontuação enviada pelo cliente. Exercícios são conteúdo didático do Enturma, sem atribuição à universidade.

Animações usam Web Animations API, IntersectionObserver e transformações; respeitam `prefers-reduced-motion`. Conteúdo permanece visível se animação falhar. Teclado, toque e visualização móvel são suportados.

Veja [modelo](ACADEMIC_DATA_MODEL.md), [importações](ACADEMIC_IMPORTS.md), [providers](ACADEMIC_PROVIDERS.md), [verificação](ACADEMIC_VERIFICATION.md) e [fontes com hashes](academic-source-manifest.json).

---

### Revisão 25/10/2026 — matrícula e identidade

A estrutura de catálogo permanece normalizada, com compatibilidade de `academic_entry`, fontes verificadas e matrizes versionadas. `AcademicIdentityController` acrescenta verificação institucional, suporte e revisão administrativa. A matrícula seleciona universidade, campus, curso/oferta, grade, período e UCs disponíveis, **sem criar grade fictícia** para preencher lacunas. Fontes devem ser rastreadas e não se deve confundir uma ocorrência curricular com disciplina canônica.

Não inferir que todos os cursos de instituições cadastradas possuem matriz verificada. Dados de fonte pendente/antiga não devem ser oferecidos como oficiais.
