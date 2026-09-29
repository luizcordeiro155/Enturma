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

Limites atuais: Google OAuth, reenvio de confirmação e alteração de senha com senha atual não têm interface dedicada. Recuperação de senha já existe. Confirmação de e-mail é registrada, mas ainda não é requisito para entrar em salas; decidir a política antes do lançamento.


## Proteções contra abuso

Cadastro normaliza e-mail e username para minúsculas antes da persistência. O banco mantém constraints `UNIQUE` e o serviço também verifica duplicidade antes do insert. Uma corrida concorrente ainda é protegida pela constraint e convertida para erro de domínio:

- `EMAIL_ALREADY_REGISTERED` (HTTP 409);
- `USERNAME_ALREADY_REGISTERED` (HTTP 409).

Rate limits por identidade de cliente:

| Rota | Limite inicial |
|---|---|
| `POST /auth/login` | 8 tentativas / 60 s |
| `POST /auth/register` | 5 / 15 min |
| `POST /auth/forgot-password` | 5 / 15 min |
| verify/reset token | 10 / 5 min |
| outras mutações de auth | 20 / min |

Login continua retornando a mesma mensagem para e-mail inexistente e senha errada para reduzir enumeração de contas. Recuperação de senha também permanece silenciosa para endereço inexistente.


## Autorização de histórico de salas

Histórico, reações, recap e estudo final exigem identidade autenticada.

- para enviar mensagem/reação, o usuário precisa ser participante **ativo** da sala;
- para consultar histórico de uma sala encerrada, basta ter participado e não ter sido removido;
- usuários removidos não podem reentrar nem consultar o histórico privado;
- o host continua sendo a única pessoa que pode encerrar/remover membros, salvo privilégios administrativos existentes.

Tokens e cookies não são armazenados no conteúdo das mensagens.
