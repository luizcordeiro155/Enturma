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

## ADS UNA Aimorés

A matriz E2A Radial organiza o nível Fundamental nos semestres 1–2. Inclui **Interação humano computador e UX**, **Algoritmos e programação**, **Exploração digital e fundamentos tecnológicos** e **Matemática computacional aplicada**, cada uma com 160h. O estudante seleciona as UCs atuais; ter cursado as duas primeiras em 2026.1 não transforma essa sequência individual em uma regra para todas as turmas.

A versão pública não declara vigência por ingresso. Por isso, o catálogo identifica a captura pelo SHA-256, mostra a organização por níveis e pede conferência com a matrícula no Ulife. Não atribui artificialmente essas UCs ao 1º ou 2º semestre. Não usa identificadores privados de turmas como códigos oficiais de disciplinas.

## Cobertura e manutenção

`/admin/catalog` mostra contagens, jobs, revisão, fontes, eventos, auditoria e prioridades de solicitações. Cobertura é a proporção entre ofertas **conhecidas** e ofertas conhecidas com grade verificada; não é uma porcentagem de todo o Brasil. O e-MEC aceita exportações oficiais revisadas, sem depender de endpoint público não documentado. UFOP, CEFET-MG, UniBH e demais instituições devem passar pelo mesmo processo de coleta e revisão antes de serem publicadas.

Uma grade ausente mostra “Esta grade ainda está sendo verificada” e permite solicitar disponibilidade. Reimportações com mudanças ficam em revisão. Não se geram disciplinas ou semestres para preencher lacunas.

## Laboratório de programação

`/learn` oferece 12 desafios em três jogos JavaScript: rota do algoritmo, laboratório binário e detetive de código. API confere matrícula verificada em curso ou UC marcada como TI; menus e página usam essa mesma decisão. O backend revalida respostas e grava tentativas/conclusões por usuário. Não há `eval`, execução livre de código ou pontuação enviada pelo cliente. Exercícios são conteúdo didático do Enturma, sem atribuição à universidade.

Animações usam Web Animations API, IntersectionObserver e transformações; respeitam `prefers-reduced-motion`. Conteúdo permanece visível se animação falhar. Teclado, toque e visualização móvel são suportados.

Veja [modelo](ACADEMIC_DATA_MODEL.md), [importações](ACADEMIC_IMPORTS.md), [providers](ACADEMIC_PROVIDERS.md), [verificação](ACADEMIC_VERIFICATION.md) e [fontes com hashes](academic-source-manifest.json).
