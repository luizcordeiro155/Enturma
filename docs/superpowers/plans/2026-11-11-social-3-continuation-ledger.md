# Social 3 — continuação da PR #148

Base: `e1c2d3958113bc0998677289514b1d05aa94d1bb`, branch `feat/social-3-part1`, destino `feat/social-3`.

A especificação em cinco partes continua sendo a autoridade da versão. Esta alteração continua o plano de telas principais; não implementa nem declara concluídas as partes 2 a 5. Não mescla na main, altera credenciais, provisiona serviços ou publica a aplicação de produção.

## Implementação desta continuação

- Stories agrupados por autor, em ordem cronológica, com progresso por autor, toque/segurar/deslizar, recuperação de erros, visualizações, exclusão pelo dono, destaques e compartilhamento privado existente.
- Perfil com grade de três colunas, Clips verticais, células de texto sem imagem fictícia, fixados primeiro, salvos somente para o dono e visualizador contextual de publicações.
- Comentários em componente próprio: painel inferior no mobile, lateral no desktop, texto preservado em falha e compositor com ajuste pelo visualViewport.
- Criação em escolher/editar/detalhes; upload multipart e rascunhos locais/remotos preservados; aviso de progresso fora do editor; conclusão não rouba a navegação de quem já saiu de Criar.
- Clips com ações sobre o vídeo; apenas um vídeo ativo; pausa manual preservada; pausa com diálogo/segundo plano; toque simples separado do duplo toque; posts ocultados não deixam páginas vazias.
- CSS limitado ao Social, testes de regressão e E2E com capturas mobile/desktop e claro/escuro.

## Decisões

- Manter o breakpoint de 760 px, compartilhado pelo Shell e pelo pager do Claude. Custo: não usar os 767 px escritos originalmente na spec.
- Manter o atalho de publicação direta já testado, além das três etapas de edição; a visibilidade é informada. Custo: a sequência não é obrigatória para toda publicação.
- Manter os quatro destinos atuais até Explorar ter API real na parte 2, com mensagens no cabeçalho. Custo: não adicionar um quinto botão fictício para imitar a referência.
- Não inventar metadados de áudio, contagens de compartilhamentos/salvos, música licenciada, reações, lives ou duetos. Custo: sem alegação de paridade completa com Instagram/TikTok.
- Preservar o compartilhamento cifrado entre amigos e o proxy de mídia autenticado. Nenhuma credencial vai para o cliente.
- Preservar os commits originais do Claude, sem adicionar falsa coautoria nesta continuação.

## Evidências e limites da verificação

- Cinco testes locais focados de gestos/navegação foram observados falhando antes do helper e passando depois.
- Transpilação de sintaxe TS/TSX foi executada sem diagnósticos; isto não equivale ao typecheck completo.
- O ambiente local não consegue acessar GitHub/npm e não contém as dependências React/Vitest do projeto. Lint, typecheck, suíte unitária e E2E precisam ser confirmados na CI da PR.
- Os testes E2E usam somente o banco isolado localhost `enturma_e2e`. Capturas com fixtures comprovam layout, não R2/FFmpeg em produção nem homologação física Android/Desktop.
- A validação completa e a revisão das capturas permanecem pendentes até haver resultados reais da CI. Não substituir evidência pendente por afirmação de sucesso.
