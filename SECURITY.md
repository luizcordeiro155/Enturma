# Política de Segurança do Enturma

A segurança do **Enturma** envolve mais do que apenas a aplicação Web. O projeto também possui aplicativo Android, Desktop, API, autenticação, WebSocket, chamadas, uploads, IA, notificações e recursos de localização temporária em caronas.

Se você encontrar uma vulnerabilidade, trate o problema de forma responsável.

## Como reportar

**Não publique uma vulnerabilidade explorável em uma issue pública.**

Quando a opção estiver disponível no GitHub, prefira **Security → Report a vulnerability** para enviar o relatório de forma privada.

Se o repositório não disponibilizar esse formulário, entre em contato com o responsável pelo projeto pelo GitHub para solicitar um canal privado, sem incluir exploit, token, dado pessoal ou passo a passo sensível na mensagem pública.

Inclua no relatório privado, quando possível:

- componente afetado;
- impacto observado;
- passos mínimos para reprodução;
- ambiente afetado;
- evidência sem dados de terceiros;
- sugestão de correção, se houver.

Não existe SLA público de resposta. Relatórios são priorizados de acordo com impacto e possibilidade de exploração.

## Escopo relevante

Áreas especialmente sensíveis incluem:

- autenticação, sessão e recuperação de conta;
- autorização entre usuários;
- acesso a salas, mensagens e arquivos;
- WebSocket e eventos realtime;
- chamadas e tokens LiveKit;
- upload e download de materiais;
- integrações de IA;
- notificações;
- atualização do aplicativo Desktop/Android;
- caronas, PIN de embarque e links de segurança;
- localização temporária e dados de mobilidade;
- APIs administrativas;
- exposição de segredos ou variáveis de ambiente.

## Teste responsável

Ao investigar um possível problema:

- utilize apenas contas e dados que você controla;
- não tente acessar dados de outros usuários;
- não faça testes destrutivos;
- não provoque indisponibilidade intencional;
- não faça engenharia social;
- não publique credenciais encontradas;
- interrompa o teste se houver risco de perda ou exposição real de dados.

## Segredos expostos

Caso encontre uma chave, token, senha ou credencial no código ou no histórico do repositório, não tente utilizá-la.

Reporte a localização da credencial de forma privada para que ela possa ser revogada, rotacionada e removida com segurança.

## Versões suportadas

O desenvolvimento acontece principalmente a partir da branch `main`. Como o projeto ainda está em evolução ativa, correções de segurança são direcionadas à versão atual do código.

Versões antigas de aplicativos ou builds de teste podem deixar de receber correções isoladas e exigir atualização para uma versão mais recente.

## Divulgação

Evite divulgar detalhes técnicos antes que exista uma correção ou mitigação disponível para os usuários afetados.

Depois da correção, o projeto pode documentar publicamente o problema de forma apropriada, sem expor dados privados ou credenciais.

---

Obrigado por ajudar a manter o Enturma e seus usuários mais seguros.
