# Publicação faseada da Supabase

Data: 08/10/2026. PR: [#1](https://github.com/WhiteBlindness/atlas-arcade/pull/1).

## Contrato e ordem

O cliente publicado em `master`, revisão `ead184e81a64b812208dc2088add4dcc96a0b09e`, atualiza diretamente `user_coins` e faz UPSERT de `high_scores`. O cliente do PR usa `arcade_refresh_user_tokens()`, `arcade_consume_user_tokens(integer)` e `arcade_submit_high_score(text, integer)`. A publicação exige **expansão, publicação do cliente e bloqueio**, por esta ordem. Nenhuma destas operações foi executada em produção.

| Fase | Ficheiro | Conteúdo |
|---|---|---|
| A: expansão compatível | `20261007224924_atlas_arcade_trust_expand.sql` | Acrescenta as três funções protegidas, indicador permanente de resgate, índice de código sem distinção entre maiúsculas, limites compatíveis de saldo e funções de conta reforçadas. |
| B: bloqueio após adoção | `20261007224929_atlas_arcade_trust_lockdown.sql` | Retira políticas de escrita e privilégios de tabela/coluna; conserva apenas leituras privadas da própria conta e as funções autorizadas. |

A fase A preserva as nove políticas RLS anteriores e INSERT/UPDATE de `profiles`, `user_coins` e `high_scores`. Não fecha a autoridade antiga: durante esta fase, um cliente autenticado ainda pode alterar o próprio saldo premium e as pontuações diretamente. O novo indicador `referral_redeemed` não pode ser reposto por UPDATE do navegador. As operações antigas podem ainda sobrepor um saldo atualizado por uma função nova. A coexistência é uma janela de compatibilidade, não uma garantia de integridade contra clientes antigos ou modificados.

A fase A mantém as assinaturas de estado, classificação, convite e eliminação. A criação de conta fica atómica, os caminhos de pesquisa ficam fixos e os dois acionadores equivalentes passam a um. As funções privadas deixam de ser executáveis por anon. As verificações prévias rejeitam estruturas incompatíveis, códigos em conflito e estados inválidos, antes de alterar o esquema. A CHECK admite os estados produzidos pelo cliente antigo: fichas diárias de 0 a 5, concessões diárias de 5 a 10 e premium não negativo.

A fase B é uma contração de autoridade que não deve ser revertida durante a recuperação normal. Não há uma migração inversa para reabrir escritas inseguras. Exige `SET LOCAL atlas.rollout.lockdown_approved = 'on'` na mesma transação. Este sinal evita execução acidental; não prova aprovação nem adoção do cliente. Não executar indiscriminadamente todos os ficheiros pendentes com `supabase db push`. O operador deve selecionar apenas o ficheiro da fase aprovada, numa transação, e registar essa versão no histórico através do procedimento Supabase adotado.

## Matriz de compatibilidade

| Cliente real | Base anterior | Fase A | Fase A+B |
|---|---|---|---|
| master | PASS | PASS | FAIL esperado: escritas diretas recusadas |
| PR #1 | FAIL esperado: função arcade ausente | PASS | PASS |

Todas as seis combinações foram executadas no navegador com Auth real. O ensaio negativo do PR anterior confirmou `PGRST202` em `arcade_refresh_user_tokens`, sem escritas diretas. O ensaio negativo de master após B confirmou PATCH de `user_coins` e POST de `high_scores` com HTTP 403, saldo inalterado e ausência de pontuação gravada.

Os dois estados suportados de produção são `master + A`, durante a transição, e `PR #1 + A+B`, no estado final. O PR também funciona com A, antes de fechar os privilégios. O estado anterior conserva uma limitação confirmada: a função de convite antiga não encontra códigos armazenados em minúsculas. O percurso anterior usa um código sintético em maiúsculas para testar o comportamento existente; a expansão corrige a pesquisa dos códigos antigos.

## Ensaio reproduzível

O laboratório usa PostgreSQL 17.10, Supabase Auth 2.197.0, PostgREST 16.4 e Chromium. Auth inicializa o esquema completo e emite sessões reais. Uma cópia de `master` usa o código e lockfile da revisão publicada; o PR usa o seu próprio código e dependências. O esquema público reproduz o catálogo remoto e reaplica as quatro migrações de produção. Não copia dados nem credenciais de produção.

As duas aplicações usam **a mesma base**, que avança de anterior para A e depois A+B. Os testes criam contas descartáveis e apagam-nas. Não usam asserções sobre a interface otimista como prova de persistência: verificam o estado remoto e os pedidos de rede. Os segredos locais ficam em memória. O laboratório só escuta na interface local.

| Percurso | Resultado exato |
|---|---|
| Master anterior | Registo, entrada, perfil/estado, gasto, Jackpot premium, regeneração, pontuação/classificação, convite em maiúsculas, recarregamento e saída/nova entrada: PASS. |
| Master com A | Mesmo percurso: PASS. Após convite, saldo 5 diárias/20 premium; partida deixa 4/20; Jackpot deixa 0/19. Duas horas simuladas produzem 1 diária, `granted_today=6` e 19 premium. Reload/nova entrada conservam o estado. PATCH de saldo: 204/200; UPSERT de pontuação: 201. |
| PR com A e com A+B | Registo/entrada, perfil, atualização, gasto, Jackpot, pontuação, classificação, convite, recarregamento, saída/nova entrada e eliminação pela interface: PASS em ambas as fases. Saldos após convite 5/20, partida 4/20 e Jackpot 0/19. |
| Rede do PR em cada fase suportada | `arcade_refresh_user_tokens` três POST 200; `arcade_consume_user_tokens` dois POST 200; `arcade_submit_high_score` um POST 200, resultado 0; `redeem_referral` POST 200, true. Zero mutações REST diretas nas três tabelas. |
| Master após B | PATCH de saldo: três 403; POST de pontuação: 403. Saldo mantém 5/20; zero consumo remoto e nenhuma pontuação persistida. FAIL intencional das mutações antigas. |
| Eliminação e JWT anterior | A e A+B: estado nulo, sem recriação, nova entrada recusada. No esquema anterior, o RPC antigo devolve FK 23503 ao tentar recriar a linha; essa limitação não é aceite nas fases novas. |
| Segurança PostgreSQL | 16/16, sem testes omitidos; inclui A compatível, B sem sinal recusada e ROLLBACK de B após 5s de bloqueio. |
| Unitários | 28/28. |

A prova adicional com Auth/PostgREST em A+B resgatou um código armazenado em minúsculas com entrada em maiúsculas, devolveu true e confirmou 20 premium.

Os ensaios concorrentes finais conservam 16 ligações independentes: 16 consumos autorizam exatamente cinco gastos com cinco fichas; 16 convites atribuem exatamente um prémio de 20 premium; 16 pontuações conservam o máximo 115; 12 gastos e quatro atualizações provocam uma reposição diária, cinco gastos e saldo zero.

`tests/rollout-compatibility.smoke.mjs` aceita `ATLAS_ROLLOUT_STAGE=previous|expand|lockdown` e, opcionalmente, `ATLAS_ROLLOUT_CLIENT=master|pr`. Por omissão, testa ambos. Exige aplicações reais, Auth com confirmação automática local, PostgREST e interface em inglês. Os destinos por omissão são 4181 para master, 4180 para PR e 55442 para a API local; as variáveis do ficheiro permitem outros destinos locais.

`npm run test:db` testa separadamente o catálogo e a autoridade em PostgreSQL real. Os testes verificam a preservação das políticas em A, a recusa de B sem sinal explícito, reversão de B por limite de espera de bloqueio, segurança final e concorrência com 16 ligações. `npm run test:unit` inclui os testes de preparação e das duas migrações.

## Procedimento de produção, ainda por aprovar

Cada fase usa uma transação própria. Ambos os ficheiros definem `lock_timeout=5s` e `statement_timeout=30s`; uma tabela ocupada deve provocar aborto, em vez de uma espera ilimitada. Alterações DDL podem causar uma breve espera de pedidos. Compatibilidade de contratos não equivale a uma promessa de latência zero.

1. **Aprovar apenas A.** Confirmar projeto Atlas Arcade, revisão publicada de master e lista das quatro migrações atuais. Repetir o inventário e as contagens de [validação remota](remote-supabase-validation.md), incluindo tipos, nulabilidade, índices, RLS, concessões, proprietários, acionadores e permissões Supautils em Auth. Confirmar mecanismo de cópia de segurança e registar o catálogo anterior. Não aceitar deriva sem análise.
2. **Aplicar A isoladamente.** Executar apenas o ficheiro de expansão, com BEGIN/COMMIT. Não executar B. Repetir as verificações prévias dentro da transação, conforme o próprio ficheiro. Registar a migração pelo procedimento controlado usado no projeto.
3. **Verificar A após COMMIT.** Confirmar as três assinaturas arcade, proprietário privilegiado esperado, caminho de pesquisa fixo, EXECUTE autenticado e recusa anónima. Confirmar as nove políticas e os INSERT/UPDATE antigos. Confirmar indicador, CHECK e índice válidos. O ficheiro envia `NOTIFY pgrst, 'reload schema'` após a confirmação da transação; aguardar que as novas funções apareçam na API.
4. **Ensaiar o cliente ainda publicado.** Usar uma conta de teste autorizada: registo/entrada, perfil, leitura de saldo, regeneração, gasto diário, gasto premium, pontuação, convite elegível, recarregamento e saída/nova entrada. Confirmar persistência real e respostas das escritas antigas. Só avançar se master continuar operacional.
5. **Aprovar e publicar o cliente do PR com A mantida.** Preservar a publicação anterior como recuperação antes de B. Confirmar entrada, saldo, partida, consumo, Jackpot, pontuação, classificação, recarregamento e saída/nova entrada. Testar convite apenas numa conta descartável elegível, sem repor indicadores de contas reais. Observar chamadas às três funções arcade e ausência de POST/PATCH/DELETE diretos nas três tabelas.
6. **Preparar recuperação e confirmar adoção antes de B.** Guardar uma compilação conhecida do cliente por funções remotas, já testada com A+B, para recuperação. Uma publicação não atualiza separadores antigos abertos. Confirmar que os clientes antigos ativos foram recarregados ou encerrados, e observar ausência de escritas antigas. Um intervalo sem pedidos, por si só, não prova a ausência de clientes antigos adormecidos. Se não houver forma de confirmar esta condição, **adiar B** e manter A. O cliente antigo falha após B, como a matriz demonstra.
7. **Aprovar B separadamente.** Repetir verificações de funções, dados, proprietário e cliente ativo. Executar BEGIN, `SET LOCAL atlas.rollout.lockdown_approved='on'`, apenas o ficheiro de bloqueio e COMMIT. Registar a segunda migração. O sinal não substitui os passos 5 e 6.
8. **Verificar o estado final.** Confirmar ausência de privilégios de escrita de tabela e coluna para PUBLIC/anon/authenticated, três políticas apenas SELECT da própria conta e acesso às funções pretendidas. Confirmar que escritas diretas são recusadas e que o cliente novo continua operacional. Repetir o ensaio autenticado e, numa conta descartável autorizada, a eliminação. Conservar registos de resultados sem tokens, palavras-passe ou dados pessoais.

## Execução controlada, apenas após aprovação

Os comandos seguintes são exemplos do procedimento futuro; não foram executados. O operador deve preparar um serviço libpq `atlas-production` com TLS e credenciais privadas, confirmar o destino e ligar a CLI ao mesmo projeto. Não colocar segredos na linha de comandos nem no repositório. A CLI Supabase 2.120.0 permite selecionar o registo de uma versão por `migration repair`.

Apenas depois da aprovação de A:

```text
psql "service=atlas-production sslmode=verify-full" --no-psqlrc --set=ON_ERROR_STOP=1 --single-transaction --file=supabase/migrations/20261007224924_atlas_arcade_trust_expand.sql
npx supabase@2.120.0 migration repair 20261007224924 --status applied --linked
npx supabase@2.120.0 migration list --linked
```

Só executar o registo da versão quando o comando SQL terminar com código 0 e o catálogo confirmar A. Se a ligação cair durante COMMIT, o resultado pode ser ambíguo: consultar o catálogo antes de repetir. Se o registo falhar após um COMMIT confirmado, parar, reconciliar apenas o histórico e não reaplicar o ficheiro. B deve continuar pendente.

Depois da publicação, adoção e aprovação separada de B:

```text
psql "service=atlas-production sslmode=verify-full" --no-psqlrc --set=ON_ERROR_STOP=1 --single-transaction --command="SET LOCAL atlas.rollout.lockdown_approved='on'" --file=supabase/migrations/20261007224929_atlas_arcade_trust_lockdown.sql
npx supabase@2.120.0 migration repair 20261007224929 --status applied --linked
npx supabase@2.120.0 migration list --linked
```

A opção `--single-transaction` envolve os comandos e ficheiros numa transação; com `ON_ERROR_STOP`, um erro provoca ROLLBACK. A instrução de B e o sinal ficam na mesma transação. Referência: [psql PostgreSQL 17](https://www.postgresql.org/docs/17/app-psql.html).

A CLI Vercel não está instalada. Para a futura publicação e consulta de registos, recomenda-se instalá-la com `npm i -g vercel`, depois de o responsável aprovar essa preparação. A publicação do cliente e qualquer reversão do alojamento continuam sujeitas aos passos 5 e 6; estes exemplos não as autorizam.

## Critérios de aborto e recuperação

| Transição | Abortar se | Recuperação |
|---|---|---|
| Antes/durante A | Deriva de catálogo ou dados, códigos em conflito, estado inválido, falta de permissão Auth, erro SQL, espera superior a 5s ou instrução superior a 30s | ROLLBACK; master e esquema anterior permanecem. Não executar parcialmente nem contornar verificações. |
| A confirmada, ensaio de master | Qualquer fluxo anterior falhar, perda de dados, saldo incorreto, escrita antiga recusada ou erro inesperado de Auth/API | Não publicar o PR nem B. A mantém as permissões antigas. Diagnosticar funções/esquema e preparar uma correção compatível aprovada; não presumir que o COMMIT pode ser desfeito automaticamente. |
| Publicação do cliente novo | Função ausente na API, autenticação falha, saldo/gasto/pontuação incorretos, chamadas diretas às tabelas ou erros recorrentes | Repor a publicação anterior de master. A fica instalada e compatível; não aplicar B. |
| Adoção antes de B | Clientes antigos ativos ou adormecidos sem confirmação de atualização, ausência de compilação de recuperação por funções remotas, preflight alterado | Adiar B; manter o cliente novo com A. Não usar uma janela silenciosa como única prova. |
| Durante B | Sinal explícito ausente, preflight incompleto, erro SQL ou limites de espera/execução excedidos | ROLLBACK; A permanece e o cliente novo continua suportado. |
| Após COMMIT de B | Regressão de autenticação, funções ou aplicação; qualquer escrita direta ainda permitida | Manter uma versão compatível com as funções remotas, repor a compilação verificada ou corrigir o defeito. Não voltar a master nem reabrir concessões inseguras na recuperação normal. Uma reversão de master exigiria reabrir direitos antigos e não integra este procedimento. |

Erro 401/403 inesperado em operações suportadas, PGRST202/404 de função exigida, erro 5xx, débito sem partida ou divergência de saldo persistido bloqueiam a transição. Respostas esperadas nos ensaios negativos não constituem falhas. Um DELETE/UPDATE sem linhas afetadas não prova sucesso.

## Limites e seguimentos

As pontuações continuam declaradas pelo navegador, dentro dos limites aceites. Uma resposta perdida após débito pode deixar uma tentativa sem iniciar; não há repetição automática nem reembolso arbitrário. Identificador de tentativa e validação de jogo permanecem seguimentos, sem implementação nesta divisão.

As decisões jurídicas, retenção de dados e conteúdos condicionais conservam o estado de [privacidade](privacy-data.md) e [licenças](asset-licensing.md). Esta alteração não acrescenta pagamentos, validação completa de jogo, limitador global ou redesenho da CSP.

Referências operacionais: [migrações Supabase](https://supabase.com/docs/reference/cli/supabase-db-push), [atualização do catálogo PostgREST](https://docs.postgrest.org/en/stable/references/schema_cache.html), [limites de espera PostgreSQL 17](https://www.postgresql.org/docs/17/runtime-config-client.html).
