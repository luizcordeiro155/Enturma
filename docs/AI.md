# Materiais e Enturma AI

A Enturma AI é um tutor acadêmico orientado por fontes. Ela combina materiais privados da sala com a OpenAI Responses API e, opcionalmente, pesquisa na web.

## Materiais da sala

Uploads são autorizados por sala e guardados em bucket S3/R2 privado. PDF e TXT passam por validação antes do parsing. Chunks ficam associados ao `roomId`; material de outra sala não entra na consulta.

A recuperação atual usa busca textual PostgreSQL em português. O backend inclui nome do arquivo, página quando disponível e trecho recuperado. A resposta retorna essas fontes separadamente para a interface.

Modos disponíveis:

- pergunta sobre materiais;
- resumo;
- flashcards;
- quiz;
- explicação simplificada;
- plano de estudo;
- pesquisa externa com fontes, quando habilitada.

## OpenAI

A integração usa `POST /v1/responses`. A pesquisa externa usa a ferramenta `web_search`. Citações `url_citation` retornadas pela API são preservadas e renderizadas como links clicáveis na interface.

Variáveis da API:

```dotenv
OPENAI_API_KEY=
AI_WEB_SEARCH_ENABLED=false
AI_BASE_URL=https://api.openai.com/v1
```

`OPENAI_API_KEY` nunca deve ser enviada ao browser, Vercel client bundle ou aplicativo mobile. Ela fica somente no backend da SquareCloud. O modelo padrão é `gpt-4.1-mini` e `AI_MODEL` permite configurar outro modelo suportado no backend.

`AI_WEB_SEARCH_ENABLED=true` libera o modo **Pesquisar na web com fontes**. A pesquisa Web da OpenAI tem custo separado de uso de modelo, portanto mantenha limites e orçamento configurados no projeto da API.

O adaptador ainda aceita `AI_API_KEY` como fallback de compatibilidade para a chave, e a seleção do modelo pode vir de `AI_MODEL`. A Enturma AI fica ativa automaticamente quando uma chave OpenAI válida está configurada.

## Segurança e qualidade

Materiais são tratados como dados não confiáveis. O prompt manda ignorar instruções encontradas dentro dos documentos. Autorização é determinada por código, nunca pelo LLM.

A API aplica limite diário por usuário e não deve registrar API key, documentos completos ou prompts privados em logs. Pesquisa externa é separada dos materiais e a UI identifica as fontes.

Próximas melhorias recomendadas: embeddings/pgvector, processamento assíncrono de documentos grandes, antivírus/quarentena, avaliações de qualidade, cache de respostas não sensíveis e métricas de custo por usuário.

---

## Retificação do modelo e experiências atuais — 25/10/2026

O código de `services/api/src/main/java/br/com/enturma/ai/CompatibleAiProvider.java` declara o modelo padrão **`gpt-4.1-mini`** e lê **`AI_MODEL`** do ambiente para permitir substituição. A afirmação anterior sobre `gpt-5.6-sol` fixo no código está desatualizada. Não presumir qual modelo roda na instalação sem consultar o ambiente.

O projeto inclui `NotebookController`, `NotebookService`, `NotebookMediaController`, `RoomMonitorService` e `AppHelpController`. Os Cadernos IA oferecem conversas persistidas, fontes e citações, ferramentas de estudo e capa personalizada. A memória do modelo é uma seleção limitada de mensagens e fontes, não recordação ilimitada. A pesquisa externa exige `AI_WEB_SEARCH_ENABLED=true` e credencial do provedor.

Nunca expor `OPENAI_API_KEY` no cliente. Entradas em documentos e links são dados não confiáveis; aplicar autorização server-side, limites e proteção contra prompt injection.
