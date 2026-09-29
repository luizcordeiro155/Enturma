# Contribuir

Use branches `codex/<assunto>` ou feature branches descritivas. Commits convencionais: feat, fix, test, docs, refactor, chore, security. Não commite `.env`, arquivos de usuário, tokens ou dumps de produção.

Mudanças de comportamento devem incluir teste relevante; alterações no banco exigem migration nova depois que versões anteriores forem aplicadas em ambiente compartilhado. Antes de abrir PR: Maven verify, lint, typecheck, testes, build web e export mobile. E2E deve usar banco exclusivo.

UI em pt-BR, nomes internos em inglês. Nenhum dado acadêmico pode ser inventado ou assumido como oficial. Importações verificadas exigem leitura da fonte original. O status de uma fase só muda após evidência de execução e integração.
