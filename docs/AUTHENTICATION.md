# Autenticação

Senha: BCrypt custo 12, mínimo de 12 caracteres no cadastro, máximo de 72 bytes UTF-8. Access token de 10 minutos, refresh de 30 dias (limite absoluto da sessão), 256 bits aleatórios. Banco guarda somente SHA-256 desses tokens. Rotação bloqueia a sessão; reutilização de refresh consumido revoga a família. Senha esquecida retorna resposta uniforme, envia link com token único de 30 minutos via outbox e revoga todas as sessões ao redefinir.

Web: BFF em `/api/backend` transforma cookies HttpOnly em Authorization Bearer para a API. Cookies têm SameSite=Lax e Secure em produção. Mutações exigem Origin igual a APP_URL. Renovação é serializada no cliente e entre abas por Web Locks quando disponível. `/api/session` GET entrega somente o access token de curta duração para autenticar o WebSocket em memória. Refresh nunca é exposto ao JavaScript da página. Não se usa localStorage para credenciais.

Mobile: SecureStore armazena o par de tokens, e renovação usa uma promise compartilhada. API só aceita Bearer, não cookies; CSRF fica no BFF. CORS e origens de WebSocket são restritos a CORS_ORIGINS.

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
