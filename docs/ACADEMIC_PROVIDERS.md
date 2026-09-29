# Providers e fontes

Interface `AcademicCatalogProvider`: providerCode, supports, discover, importCurriculum. Implementações independentes UNA, PUCMINAS, UFMG e EMEC. Providers de snapshots não fazem rede na inicialização: usam arquivos versionados, hashes e revisão anterior. Ampliação exige fonte oficial acessível, schema válido, revisão e testes de importação.

UNA: páginas Nuxt dos cursos vinculam explicitamente unidade Aimorés, modalidade e PDF E2A Radial em estaticos.animaeducacao.com.br. A tabela oficial ProUni 2026.1 documenta outras ofertas/campi da IES 344. PUC: páginas oficiais de Sistemas de Informação/Barreiro e Ciência da Computação/Poços de Caldas, com períodos e turnos. UFMG: relatório oficial Sistemas de Informação N-2019/9, gerado em 02/01/2025, campus Pampulha.

Todas as URLs e hashes constam de `academic-source-manifest.json`. O script `scripts/catalog/build_snapshots.py --sources <diretório>` recompõe snapshots dos arquivos de revisão já baixados, usando beautifulsoup4 e pymupdf. Não distribui PDFs completos no Git. A extração reconcilia totais UNA e remove a segunda contagem de ACG no quadro-resumo. Divergências colocam a grade em PENDING_VERIFICATION; pré-requisitos ambíguos permanecem como texto sem relação inferida.

e-MEC não é tratado como API livre para scraping. `EmecAcademicProvider` aceita documentos de exportação oficial revisados via importação manual, verificando domínios governamentais e tipos de entidade. Matrizes curriculares continuam exigindo fontes institucionais. Ausência de integração automatizada governamental não é apresentada como catálogo nacional completo.

Coleta operacional usa `AcademicHttpClient`: HTTPS, allowlist institucional, validação de DNS, bloqueio de endereços privados, timeout, até 8 MB, controle por host, retry limitado para 429/502/503/504, robots.txt e redirecionamentos no mesmo domínio. Mudanças de domínio exigem revisão da fonte. Falhas não produzem dados substitutos. Parser PDF mede confiança e nunca publica sozinho.

Novos providers podem ser adicionados sem mudar onboarding ou matrícula: produzem CatalogRecord.Document e passam pelo mesmo pipeline. Evitar fusão de instituições, ofertas ou disciplinas somente por nome; códigos oficiais e evidência da associação devem orientar a revisão.
