# Materiais e Enturma AI

Uploads autorizados por sala. Bucket S3 privado, keys geradas pelo servidor. Validação por assinatura `%PDF-` para PDF, parsing com PDFBox, UTF-8 estrito e ausência de NUL para TXT. Limites: 15 MB, 150 páginas, 200 chunks e 10 materiais por sala. PDF criptografado é rejeitado. Sem OCR, DOCX ou ingestão de links nesta versão.

Extração preserva página do PDF. Chunks de até 1.200 caracteres, passo de 1.000. PostgreSQL armazena o texto e um índice de busca em português. Recuperação seleciona até oito trechos dentro do roomId; material de outra sala não entra na consulta. JSON de resposta inclui referências produzidas pelo backend: materialId, nome, página e trecho literal.

A busca textual é o fallback implementado. Embeddings/pgvector e busca semântica ainda não existem; perguntas sem correspondência podem deixar de recuperar informação relevante. Sem trechos, a resposta é a mensagem explícita de insuficiência, sem chamada ao LLM. Modo resumo/quiz/flashcards/roteiro usa até oito chunks e não representa leitura integral de documentos longos.

AiProvider separa contrato e integração. O adaptador configurável envia Chat Completions a AI_BASE_URL. Materiais são conteúdo não confiável, e o prompt manda ignorar instruções contidas neles. Autorização é código determinístico. Limite de 20 perguntas/usuário/dia, 2.000 caracteres por pergunta e 1.200 tokens de saída. Falhas são explícitas, sem respostas simuladas. Fontes recuperadas são reais; correção factual de respostas geradas requer avaliação adicional.

Bloqueios para lançamento: antivírus/quarentena; parsing isolado e assíncrono com timeout rígido; controle de retenção e exclusão dos arquivos; testes reais com S3/LiveKit/IA; avaliação de prompt injection e qualidade das citações. Não homologado para uploads públicos irrestritos.
