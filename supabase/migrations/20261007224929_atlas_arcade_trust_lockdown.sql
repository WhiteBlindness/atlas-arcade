-- Fase B: bloqueio final após publicar e verificar o cliente RPC.
-- Incompatível com mutações do cliente master. Não aplicar junto com a fase A.
-- Uma aplicação automática de todas as migrações deve parar nesta barreira.
-- Após aprovação e verificação de adoção, o operador define, na mesma transação:
-- SET LOCAL atlas.rollout.lockdown_approved = 'on';
-- Esta marca é uma proteção operacional contra execução antecipada, não prova
-- criptográfica nem substituto dos testes/da aprovação descritos no procedimento.
-- Não reabrir concessões antigas para recuperar um defeito do novo cliente.
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $lockdown_preflight$
begin
  if current_setting('atlas.rollout.lockdown_approved',true) is distinct from 'on' then
    raise exception 'Lockdown requires verified client adoption and explicit phase B approval';
  end if;
  if to_regprocedure('public.arcade_refresh_user_tokens()') is null
    or to_regprocedure('public.arcade_consume_user_tokens(integer)') is null
    or to_regprocedure('public.arcade_submit_high_score(text,integer)') is null
    or not exists (select 1 from information_schema.columns
      where table_schema='public' and table_name='profiles'
        and column_name='referral_redeemed' and data_type='boolean' and is_nullable='NO')
    or not exists (select 1 from pg_constraint
      where conrelid='public.user_coins'::regclass and conname='user_coins_trust_bounds' and convalidated) then
    raise exception 'Lockdown requires the completed expansion migration';
  end if;
end;
$lockdown_preflight$;

-- Replace row-level policies on these app-owned tables with own-row reads.
-- Sensitive mutations are performed only by the SECURITY DEFINER functions
-- below. Direct grants assigned to service_role and the table owner are not
-- revoked. Public-role access is intentionally removed.
do $policies$
declare
  v_policy record;
begin
  for v_policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('user_coins', 'high_scores', 'profiles')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      v_policy.policyname,
      v_policy.schemaname,
      v_policy.tablename
    );
  end loop;
end
$policies$;

alter table public.user_coins enable row level security;
alter table public.high_scores enable row level security;
alter table public.profiles enable row level security;

create policy user_coins_select_own on public.user_coins
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy high_scores_select_own on public.high_scores
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

-- Remove direct client writes even if a permissive RLS policy or table-level
-- grant existed. The anonymous keep-alive query needs only the user_id column;
-- RLS still returns no rows to anon.
revoke all on table public.user_coins from public, anon, authenticated;
revoke all on table public.high_scores from public, anon, authenticated;
revoke all on table public.profiles from public, anon, authenticated;


-- Explicit column ACLs survive a table-level REVOKE.
do $column_grants$
declare v_column record;
begin
  for v_column in select c.relname,a.attname from pg_attribute a
    join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('profiles','user_coins','high_scores')
      and a.attnum>0 and not a.attisdropped
  loop
    execute format('revoke all (%I) on table public.%I from public, anon, authenticated',
      v_column.attname,v_column.relname);
  end loop;
end;
$column_grants$;

grant select on table public.user_coins to authenticated;
grant select on table public.high_scores to authenticated;
grant select on table public.profiles to authenticated;
grant select (user_id) on table public.user_coins to anon;

-- Revoke any known client-claimed premium mint RPC while preserving the
-- function definition for privileged server-side callers that may depend on it.
do $premium_mint$
begin
  if to_regprocedure('public.add_premium_tokens(integer)') is not null then
    execute 'revoke all on function public.add_premium_tokens(integer) from public, anon, authenticated';
  end if;
end
$premium_mint$;

-- Migration-time regression checks for the data boundary and RPC grants.
do $assertions$
declare
  v_role text;
  v_table text;
begin
  foreach v_role in array array['anon', 'authenticated'] loop
    foreach v_table in array array[
      'public.user_coins', 'public.high_scores', 'public.profiles'
    ] loop
      if has_table_privilege(v_role, v_table, 'INSERT')
        or has_table_privilege(v_role, v_table, 'UPDATE')
        or has_table_privilege(v_role, v_table, 'DELETE')
        or has_table_privilege(v_role, v_table, 'TRUNCATE')
        or has_any_column_privilege(v_role, v_table, 'INSERT')
        or has_any_column_privilege(v_role, v_table, 'UPDATE') then
        raise exception 'Direct client write privilege remains on % for role %', v_table, v_role;
      end if;
    end loop;
  end loop;

  if not (select relrowsecurity from pg_class where oid = 'public.user_coins'::regclass)
    or not (select relrowsecurity from pg_class where oid = 'public.high_scores'::regclass)
    or not (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass) then
    raise exception 'RLS must remain enabled on account tables';
  end if;


  if has_function_privilege('anon','public.get_user_state()','EXECUTE')
    or has_function_privilege('anon','public.delete_own_user()','EXECUTE')
    or has_function_privilege('anon','public.handle_new_user()','EXECUTE')
    or has_function_privilege('authenticated','public.handle_new_user()','EXECUTE') then
    raise exception 'Private or trigger-only RPC remains anonymously executable';
  end if;

  if has_function_privilege('anon', 'public.arcade_refresh_user_tokens()', 'EXECUTE')
    or has_function_privilege('anon', 'public.arcade_consume_user_tokens(integer)', 'EXECUTE')
    or has_function_privilege('anon', 'public.arcade_submit_high_score(text,integer)', 'EXECUTE')
    or has_function_privilege('anon', 'public.redeem_referral(text,integer)', 'EXECUTE') then
    raise exception 'An anonymous role can execute an account mutation RPC';
  end if;

  if not has_function_privilege('authenticated', 'public.arcade_refresh_user_tokens()', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.arcade_consume_user_tokens(integer)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.arcade_submit_high_score(text,integer)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.redeem_referral(text,integer)', 'EXECUTE') then
    raise exception 'Authenticated clients are missing a required guarded RPC';
  end if;

  if to_regprocedure('public.add_premium_tokens(integer)') is not null
    and (
      has_function_privilege('anon', 'public.add_premium_tokens(integer)', 'EXECUTE')
      or has_function_privilege('authenticated', 'public.add_premium_tokens(integer)', 'EXECUTE')
    ) then
    raise exception 'Client-callable premium mint RPC remains enabled';
  end if;

  if not exists (
    select 1
    from pg_index i
    where i.indexrelid = to_regclass('public.profiles_referral_code_upper_key')
      and i.indrelid = 'public.profiles'::regclass
      and i.indisunique and i.indisvalid and i.indpred is not null
      and i.indexprs is not null and i.indnkeyatts = 1
      and pg_get_expr(i.indexprs, i.indrelid) = 'upper(referral_code)'
      and pg_get_expr(i.indpred, i.indrelid) like '%referral_code IS NOT NULL%'
  ) then
    raise exception 'Case-insensitive referral lookup requires a valid unique expression index';
  end if;
end
$assertions$;

notify pgrst, 'reload schema';
