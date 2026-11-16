# Capacidade e escalabilidade — 16/11/2026

> Medido com k6. Produção só foi testada até nível moderado (100 req/s por poucos minutos), conforme a política de uso da Square Cloud; o ponto de quebra foi encontrado numa **réplica** da API com o mesmo JAR, flags da JVM, memória, pool e CPU, mais latência de rede até o PostgreSQL.

## Resumo

| Configuração | Ponto estável (p95 ≤ 150 ms) | Usuários simultâneos online* |
| --- | --- | --- |
| Antes (pool 5, 3 consultas por requisição, polling de chamadas a cada 5 s) | ~150 req/s (quebra logo acima) | **~250** |
| Atual, depois das PRs #172/#173 — Square Cloud Hobby 1 GB / 1 vCPU, pool 15 | **~600 req/s** | **~1.300** (operação confortável: ~900) |
| Hobby 2 GB / 2 vCPU (R$ 24,99/mês), pool 25 | **~900 req/s** | **~1.900** (limitado a 2.000 WebSockets por instância) |

\* Modelo de uso medido em 16/11: uma aba parada gera ~0,15 req/s depois da PR #173 (antes 0,30) e uma aba em uso ativo, navegando a cada 15 s, ~1,7 req/s. Supondo 20% dos usuários online navegando ativamente: **~0,46 req/s por usuário**. Se todos navegarem ao mesmo tempo, divida a capacidade por ~3,7.

## Como foi medido

1. **Tráfego real de um usuário.** Uma aba logada foi contada no nível da API (proxy contador local): 3 minutos parada em `/home` e 12 visitas a páginas a cada 15 s. As rotas mais chamadas foram `/calls/private`, `/auth/session-view`, `/users/me`, `/notifications/desktop-push`, `/messages/pending-delivery` e `/planner/focus`. O teste de réplica repete exatamente essa proporção (`loadtest/replica.js`).
2. **Produção moderada** (`loadtest/enturma.js`, 5 runners do GitHub, até 100 req/s): **0% de erros**, API com p50 100–130 ms e p95 ≤ 162 ms medidos de fora; BFF Vercel (São Paulo) → API (Nova York) com p95 431 ms. Contas descartáveis criadas e apagadas pelo próprio teste.
3. **Réplica** (`.github/workflows/loadtest-replica.yml`): API em contêiner com `--cpus` e `--memory` do plano, `-XX:MaxRAMPercentage=65`, perfil `squarecloud`, PostgreSQL com +12 ms de ida e volta (`tc netem`; estimado pela diferença entre `/actuator/health` e `/users/me` em produção), 500 contas verificadas e **1.000 WebSockets autenticados** abertos durante todo o teste.

## O que limitava e o que foi corrigido (sem custo)

| Achado | Correção |
| --- | --- |
| Com 5 conexões no pool e 3 idas ao banco por requisição, a API saturava em ~150 req/s com a CPU em ~20% | Sessão, acesso acadêmico e moderação numa única consulta; pool configurável (`DB_POOL_SIZE`, padrão 15). Resultado: ~600 req/s |
| Aba parada consultava `/calls/private` a cada 5 s mesmo com o WebSocket conectado (2/3 do tráfego ocioso) | Rede de segurança de 20 s enquanto o socket está conectado; 5 s só quando o tempo real cai |
| Na Square Cloud todos os clientes diretos compartilhavam o IP do proxy: cadastro limitado a 5 por 15 min **para todo mundo**, e só 64 WebSockets pendentes no total | Endereço real do cliente resolvido atrás do proxy (`ProxiedAddress`) |
| Expurgo inexistente da tabela `rate_limit` (cresce a cada requisição limitada) | Retenção diária (`DataRetention`) |

Observação: 1.000 WebSockets conectando **no mesmo segundo** (todos reconectando depois de um reinício) elevaram a latência para 3–4 s por ~6 s, com recuperação sozinha. A reconexão dos clientes já usa espera exponencial.

## Limites que continuam valendo

- **Vercel Hobby (o primeiro a ser atingido):** 1 milhão de invocações de função e 4 h de CPU ativa por mês, com teto rígido; todas as chamadas do navegador passam pelo BFF. Com ~0,46 req/s por usuário, isso equivale a cerca de **600 horas-usuário por mês** (por exemplo, 100 estudantes × 6 h). O plano Hobby também é para uso pessoal e não comercial.
- **2.000 WebSockets por instância** (limite do código). Com mais de ~2.000 abas abertas ao mesmo tempo é preciso uma segunda instância ou elevar o limite junto com a memória.
- **Latência API ↔ banco:** API em Nova York (Square Cloud) e PostgreSQL no Railway; cada consulta paga a rede. A capacidade cresce quase linearmente com o pool até a CPU virar gargalo.
- `planner/focus` monta dois dias de calendário a cada chamada (~12 consultas); é o próximo candidato a otimização.

## Upgrades pagos sugeridos (nenhum contratado)

| Ordem | Upgrade | Preço | Efeito |
| --- | --- | --- | --- |
| 1 | **Vercel Pro** | US$ 20/mês (inclui US$ 20 de uso; depois US$ 0,60 por milhão de invocações e a partir de US$ 0,128 por hora de CPU ativa) | Remove o teto mensal de 1 milhão de invocações, que hoje limita o uso antes da API; permite uso comercial |
| 2 | **Square Cloud Hobby 2 GB / 2 vCPU** | R$ 24,99/mês | ~900 req/s medidos (~1.900 usuários simultâneos) |
| 3 | **Square Cloud Standard 4 GB / 4 vCPU** | R$ 44,99/mês (R$ 35,99 no anual) | Permite PostgreSQL gerenciado ao lado da API (latência quase zero, backups diários, 256 conexões), domínio próprio e balanceamento entre duas instâncias; capacidade não medida (o runner do GitHub não comporta 4 vCPU para a API) |

Fontes de preços: [Square Cloud — planos](https://squarecloud.app/plans), [Square Cloud — limites de CPU por RAM](https://docs.squarecloud.app/en/platform/limitations-and-restrictions), [Vercel — preços](https://vercel.com/pricing), [Vercel — Functions](https://vercel.com/docs/functions/usage-and-pricing).

## Como repetir

- Produção (moderado): editar `loadtest/plan.env` e enviar para uma branch `loadtest/<nome>`; não ultrapassar ~100 req/s (política da Square Cloud).
- Réplica: editar `loadtest/replica.env` (CPU, memória, pool, latência, estágios) e enviar para `loadtest-replica/<nome>`. Os tokens de acesso expiram em 15 minutos; mantenha o teste abaixo disso.
