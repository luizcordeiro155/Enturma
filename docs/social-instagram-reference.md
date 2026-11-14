# Referências Instagram — 12/11/2026

Evidência primária: nove capturas fornecidas pelo responsável nesta conversa. Desktop: rail compacto, Feed central e sugestões laterais; Clips vertical com ações laterais; editor com mídia à esquerda e opções à direita. Mobile: Stories horizontais, dock inferior, ações abaixo da mídia, comentários e compartilhamento em sheets. Confiança alta para composição estática; gestos, tempos, autorização e persistência não são comprovados por imagens.

Consulta pública https://www.instagram.com/ retornou HTTP 429; não houve tentativa de contorno. MCP REA e skill reverse-engineer-anything estão disponíveis. Foi lida a skill local; list_browser_targets exige endpoint CDP autorizado, que não foi fornecido. Nenhuma sessão nativa do Instagram foi inspecionada. Não atribuir ao REA resultados de runtime inexistentes.

Aceitação visual pendente: 360, 390, 430, 768, 1024, 1440 e 1920 px, quatro temas, teclado/toque, safe areas e redução de movimento. Capturas servem de referência de organização, não de ativos para incorporar ao produto.

## Verificação do aplicativo instalado e do REA

O atalho Instagram.lnk aponta para msedge_proxy.exe, no diretório do Microsoft Edge, com argumento de aplicativo e perfil Default. Isso identifica um aplicativo Web instalado pelo Edge; não comprova um pacote nativo do Instagram. Não é adequado descompilar o executável do Edge para tentar recuperar a implementação do Instagram.

A inspeção de interface foi interrompida pelo controle automático da ferramenta tanto na janela Edge quanto na janela Brave: a URL atual não pôde ser determinada com confiança. Não houve contorno por CDP, captura alternativa, cópia de perfil ou extração de sessão.

Consulta real ao MCP REA, operação get_evidence_bundle(detail=summary): total_retained_records=0. Portanto, não há evidência de runtime retida nesta sessão. A disponibilidade das ferramentas não equivale a uma auditoria realizada.

## Critérios derivados das capturas (não são resultados de testes)

| Área | Evidência visual | Comportamento a validar no Enturma |
|---|---|---|
| Feed desktop | Coluna de mídia central, Stories acima e sugestões laterais | Largura de leitura estável e preservação da posição ao abrir e fechar publicações |
| Feed mobile | Mídia ocupa a largura disponível; ações e legenda abaixo | Ausência de overflow, ações acessíveis e carrossel sem acionar navegação global |
| Clips | Vídeo vertical com ações laterais e navegação persistente | Somente um vídeo ativo; pausa ao perder foco; navegação por teclado e toque |
| Criação desktop | Prévia e formulário lado a lado | Rascunho preservado, validação real e erros recuperáveis de upload |
| Comentários mobile | Painel inferior, prévia de vídeo e compositor junto ao teclado | Compositor visível com teclado, rolagem interna e fechamento sem perder o contexto |
| Compartilhamento | Pesquisa, destinatários e ações externas separadas | Autorização por destinatário e conteúdo; confirmação real de envio |
| Perfil e relações | Avatar, autoria e ações de acompanhamento | Contadores persistentes e respeito a bloqueios e contas privadas |

A paridade de backend, notificações, privacidade, recomendações e persistência não pode ser inferida das capturas. Esses requisitos precisam de testes próprios do Enturma. A inspeção ao vivo permanece pendente até que o acesso autorizado funcione sem o bloqueio da ferramenta.
