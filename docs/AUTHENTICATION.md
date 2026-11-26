> Atualização 27/10/2026: conversas privadas usam custódia cifrada por conta para sincronização automática; não anunciar E2EE inacessível ao servidor. A implementação e os limites atuais estão em [Privacidade do chat](CHAT_PRIVACY.md) e [Revisão desta entrega](RELEASE_PUBLIC_START_SECURITY.md).

# Autenticação

Senha: BCrypt custo 12, de 8 a 64 caracteres no cadastro e redefinição, recusando senhas comuns (limite criptográfico de 72 bytes UTF-8); login preserva as senhas antigas. Access token de 10 minutos, refresh de 30 dias (limite absoluto da sessão), 256 bits aleatórios. Banco guarda somente SHA-256 desses tokens. Rotação bloqueia a sessão; reutilização de refresh consumido revoga a família. Senha esquecida retorna resposta uniforme, envia link com token único de 30 minutos via outbox e revoga todas as sessões ao redefinir.

Web: BFF em `/api/backend` transforma cookies HttpOnly em Authorization Bearer para a API. Cookies têm SameSite=Lax e Secure em produção. Mutações exigem Origin igual a APP_URL. Renovação é serializada no cliente e entre abas por Web Locks quando disponível. `/api/session` GET entrega somente o access token de curta duração para autenticar o WebSocket em memória. Refresh nunca é exposto ao JavaScript da página. Não se usa localStorage para credenciais.

No cliente Expo, SecureStore armazena o par de tokens e a renovação usa uma promise compartilhada. O APK WebView distribuído usa cookies e BFF como a Web. A API recebe Bearer; o controle de origem das mutações com cookies fica no BFF. CORS e origens de WebSocket são restritos a CORS_ORIGINS.

## Entrar com Google e conectar o GitHub

Configuração só na API (SquareCloud): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`. A Web não recebe segredo algum: lê de `GET /public/auth/providers` quais provedores estão ligados, o ID público do cliente e o endereço de retorno, que é sempre `APP_URL + /api/oauth/{google|github}/callback` e precisa estar cadastrado no provedor exatamente assim. Sem o par de um provedor, o botão dele não aparece.

Ida e volta, no servidor Web: `/api/oauth/{provedor}/start` gera `state` e, para o Google, PKCE (S256), guarda o pedido no cookie HttpOnly `enturma_oauth` (SameSite=Lax, caminho `/api/oauth`, 10 minutos) e redireciona. `/api/oauth/{provedor}/callback` só troca o código depois de conferir o `state` com o cookie, apaga o cookie e chama a API. Os tokens de sessão vão para os mesmos cookies do login por senha e nunca aparecem em URL.

Na API (`ExternalAuthService`), nenhum token do Google ou do GitHub é guardado: a tabela `user_identity` registra só provedor, identificador da pessoa no provedor e o e-mail ou usuário exibido.

- **Google já vinculado** → abre sessão nessa conta.
- **Conta com o mesmo e-mail** → vincula e entra, desde que o Google declare o e-mail verificado. Se o e-mail dessa conta nunca foi confirmado no Enturma, ela passa a quem o Google diz ser dono do endereço: a senha anterior é trocada por uma aleatória, as sessões e vínculos antigos são removidos e `password_set` fica falso. Isso impede que alguém cadastre o e-mail de outra pessoa e mantenha acesso depois.
- **Sem conta** → cria só com os Termos aceitos (`acceptedTerms`); sem isso responde `GOOGLE_SIGNUP_NEEDS_TERMS` e a Web leva ao cadastro. A conta nasce com e-mail confirmado, sem senha e com nome de usuário gerado a partir do nome.
- **Vincular pelas Configurações** → conta com e-mail confirmado vincula qualquer Google; conta sem confirmação só o Google do próprio e-mail. Uma conta Google pertence a um único perfil (`IDENTITY_IN_USE`).
- **Desvincular o Google** só com senha definida (`PASSWORD_NEEDED`); "Esqueci minha senha" cria a senha de uma conta que nasceu pelo Google.

Repositórios só entram no portfólio pela conta conectada: não existe importação por nome de usuário. Ao salvar, a API recusa um projeto com selo do GitHub quando não há conta conectada (`GITHUB_NOT_CONNECTED`) ou quando o repositório é de outro dono (`GITHUB_NOT_YOURS`). Ficam de fora dessa regra o que já estava no portfólio e a cópia de um projeto de equipe em que a pessoa foi marcada.

O GitHub não é forma de entrar: `POST /auth/github/connect` associa a conta ao perfil para o portfólio de Tecnologia e Jogos. O pedido não leva `scope`, então o Enturma só conhece o que é público. Com a importação automática ligada (`PUT /portfolio/me/github`), ao abrir o portfólio a API lista os repositórios públicos do usuário (no máximo uma vez por hora; dez minutos depois de uma falha) e inclui os novos, até 12 por vez, sem forks nem arquivados. Cada repositório é oferecido uma única vez (`github_seen`), então o que a pessoa remove não volta.

O código de autorização dos dois provedores é protegido por PKCE (S256): sem o verificador, que fica no cookie HttpOnly de quem começou o pedido, o código não serve a ninguém.

**Apps Android e Windows.** O Google recusa login em janelas embutidas, e os dois apps abrem no navegador do aparelho qualquer endereço fora do Enturma. Por isso, dentro dos apps, o botão pede o endereço do provedor a `/api/oauth/{provedor}/start?mode=json` (que grava o cookie no próprio app e marca o `state` com `.a` ou `.d`) e sai por ele. Na volta, o navegador do aparelho não tem o cookie do app: o callback não troca nada ali e mostra uma página com o link `enturma://…/api/oauth/{provedor}/callback?code=…&state=…`, que os apps já sabem abrir. De volta ao app, o mesmo callback encontra o cookie, confere o `state` e conclui. Nenhuma sessão é criada no navegador do aparelho. Em página emoldurada (Mostra+) os botões não aparecem.

## Primeiro administrador

1. Cadastre a conta normalmente e confirme o e-mail.
2. No console SQL privado do banco, com autorização do proprietário, localize o UUID dessa conta.
3. Em uma transação, promova **esse UUID** e registre a ação na auditoria:

```sql
BEGIN;
-- Substitua o parâmetro pelo UUID da conta já criada, usando seu cliente SQL.
UPDATE app_user SET role='ADMIN' WHERE id=:user_id AND status='ACTIVE';
INSERT INTO audit_log(id,actor_id,action,resource_id)
VALUES (gen_random_uuid(),:user_id,'BOOTSTRAP_ADMIN',:user_id);
COMMIT;
```

Não criar conta ou senha administrativa fixa em migrations. O usuário comum não pode enviar role no cadastro. Para promover SUPER_ADMIN, adote um procedimento operacional separado e auditado.

Fluxos de e-mail transacional:
- cadastro gera token único de confirmação válido por 30 minutos;
- usuário com confirmação pendente pode solicitar novo link pelo próprio perfil;
- recuperação de senha envia link único válido por 30 minutos;
- redefinir a senha revoga todas as sessões ativas;
- o worker de e-mail usa a tabela `email_outbox`, tenta novamente em caso de falha e limpa o corpo após o envio;
- em produção, configure `MAIL_ENABLED=true` e as credenciais SMTP apenas no backend/SquareCloud.

Confirmação de e-mail continua registrada no perfil; a política de bloquear recursos para contas não confirmadas pode ser endurecida separadamente sem alterar o fluxo de envio.


## Proteções contra abuso

Cadastro normaliza e-mail e username para minúsculas antes da persistência. O banco mantém constraints `UNIQUE` e o serviço também verifica duplicidade antes do insert. Uma corrida concorrente ainda é protegida pela constraint e convertida para erro de domínio:

- `EMAIL_ALREADY_REGISTERED` (HTTP 409);
- `USERNAME_ALREADY_REGISTERED` (HTTP 409).

Rate limits por identidade de cliente:

| Rota | Limite inicial |
|---|---|
| `POST /auth/login` | 8 tentativas / 60 s |
| `POST /auth/register` | 5 / 15 min |
| `POST /auth/forgot-password` e `POST /auth/resend-verification` | 5 / 15 min |
| verify/reset token | 10 / 5 min |
| outras mutações de auth | 20 / min |

Login continua retornando a mesma mensagem para e-mail inexistente e senha errada para reduzir enumeração de contas. Recuperação de senha também permanece silenciosa para endereço inexistente.


## Experiência de confirmação e recuperação

- Ao reenviar a confirmação pelo perfil, o Web mostra uma tela animada com contagem regressiva de 30 minutos, opção para cancelar a espera e verificação automática do status da conta.
- Quando o link de confirmação é consumido, a página exibe uma animação de sucesso e sinaliza outras abas abertas para atualizarem o perfil automaticamente.
- A recuperação de senha mostra uma tela animada informando que o link foi enviado e o tempo restante de 30 minutos.
- Após definir uma nova senha, todas as sessões existentes são revogadas no backend e os cookies da sessão atual também são apagados pelo BFF Web.
- A tela de sucesso da redefinição mantém o usuário informado por 30 segundos e então o envia ao login. Recarregar a página não restaura a sessão anterior.

---

### Revisão 28/10/2026 — identidade acadêmica e privacidade

O `AuthController` inclui `/auth/session-view`, gestão de sessões, recuperação e verificação de e-mail. `AcademicIdentityController` implementa status institucional, e-mail, documento, suporte, revisão e domínios verificados; contas pendentes não devem se fazer passar por `VERIFIED`. `AccountPrivacyController` permite consultar exclusão, agendá-la para **cinco dias**, cancelar o pedido e excluir imediatamente, anonimizando a conta e expurgando dados específicos; não dizer que o registro físico desaparece integralmente. No modo de custódia por conta, trocar/recuperar a senha preserva a chave sincronizada. Isso depende da chave mestre e do envelope já existentes: identidades antigas nunca sincronizadas e perdidas não podem ser reconstruídas pelo servidor. Não recriar identidade para esconder falha de recuperação; ver [Privacidade do chat](CHAT_PRIVACY.md).

Mantenha cookies e tokens fora de URLs/logs. Revisar autorização servidor e CORS, rate limiting, sessão persistente e novos fluxos de verificação. A aplicação Web usa BFF; não confundir com SecureStore Expo.
