# Links, fórum ao vivo e notificações

Links HTTP/HTTPS e `www.` em textos do fórum, comentários e prévias do início são clicáveis. Links para outro domínio abrem um diálogo com o endereço completo e uma confirmação obrigatória antes da abertura em outra aba. HTML continua sendo tratado como texto e blocos de código não são transformados em links. Esquemas executáveis e URLs com credenciais não viram links.

O WebSocket autenticado aceita o escopo `activity`. Os eventos `forum_changed` e `notifications_changed` contêm somente invalidações e são publicados após commit; notificações são enviadas somente ao destinatário. Cada cliente busca novamente os dados pelos endpoints autenticados. Há reconexão progressiva e consulta periódica de contingência, sem recarregar a página. O fórum preserva o texto em edição e atualiza as páginas já carregadas; a prévia da página inicial também acompanha as mudanças.

A caixa de entrada ao lado do controle de tema reúne curtidas, reações, respostas, menções `@usuario`, mensagens privadas e mensagens nas salas das quais a pessoa participa. Não notifica ações próprias nem contatos bloqueados. Curtidas e reações repetidas do mesmo autor no mesmo conteúdo não geram avisos duplicados. A migração V19 adiciona metadados de navegação e índices à tabela existente, sem exigir variáveis novas.

O contador representa notificações não lidas. Abrir um aviso leva ao post ou à mensagem específica e marca a leitura; também há leitura em lote. A interface mostra até 80 avisos, priorizando os não lidos. Quando o chat correspondente está aberto em uma aba visível, novas mensagens são marcadas como lidas e aparece um atalho para destacar a mensagem no próprio chat, sem aumentar o contador. Uma aba oculta não marca leitura automaticamente.

Mensagens privadas continuam usando ECDH + AES-GCM. A caixa de entrada não armazena nem recebe o texto delas: apenas autor, destinatário, identificadores e aviso genérico. Uma menção privada é indicada pelo cliente como metadado; o servidor limita o destinatário ao outro participante da amizade aceita. Os endpoints de mensagem específica preservam as verificações de associação à conversa e bloqueio.

As animações de entrada, sino e destaque usam JavaScript e respeitam a preferência de movimento reduzido. Os testes cobrem a confirmação de links, chegada de posts sem reload, leitura e deduplicação, bloqueios, menções, navegação para mensagens e supressão de avisos nos chats abertos, além de temas e tela móvel.
