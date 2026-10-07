
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import test from "node:test";
import pg from "pg";

const port = Number(process.env.ATLAS_TEST_DB_PORT);
const enabled = Number.isInteger(port) && port > 1024 && port < 65536;
// This suite deliberately accepts only loopback and creates its own database.
// It never consumes a production URL or credentials from application env files.
const config = { host: "127.0.0.1", port, user: "postgres", password: process.env.ATLAS_TEST_DB_PASSWORD ?? "", database: "postgres" };
const fixture = readFileSync(new URL("./fixtures/security-trust-schema.sql", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20261007_atlas_arcade_trust_boundaries.sql", import.meta.url), "utf8");

test("real PostgreSQL trust boundary and concurrent transactions", { skip: !enabled, timeout: 90000 }, async (t) => {
  const owner = new pg.Client(config);
  await owner.connect();
  const database = "atlas_trust_" + randomUUID().replaceAll("-", "");
  await owner.query('create database "' + database + '"');
  const admin = new pg.Client({ ...config, database });
  await admin.connect();
  const openClients = new Set();
  const ids = Array.from({ length: 8 }, () => randomUUID());
  const as = async (role, id, sql, params = []) => {
    const client = new pg.Client({ ...config, database });
    openClients.add(client);
    await client.connect();
    try {
      await client.query("begin");
      await client.query("select set_config('request.jwt.claim.sub',$1,true)", [id ?? ""]);
      await client.query("set local role " + role);
      const result = await client.query(sql, params);
      await client.query("commit");
      return result;
    } finally {
      await client.query("rollback").catch(() => {});
      await client.end();
      openClients.delete(client);
    }
  };
  const denied = async (role, id, sql, params = []) =>
    assert.rejects(as(role, id, sql, params), (error) => ["42501", "42883"].includes(error.code));
  // Hold the target row until every independent backend is demonstrably waiting
  // on a lock. Promise.all on one connection would not prove concurrency.
  const race = async (table, column, id, calls) => {
    await admin.query("begin");
    await admin.query("select 1 from " + table + " where " + column + "=$1 for update", [id]);
    const requests = calls.map((sql) => as("authenticated", id, sql));
    try {
      let waiting = 0;
      for (let i = 0; i < 100; i++) {
        const r = await owner.query("select count(*)::integer as n from pg_stat_activity where datname=$1 and wait_event_type='Lock'", [database]);
        waiting = r.rows[0].n;
        if (waiting >= calls.length) break;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      assert.equal(waiting, calls.length, "all distinct backend transactions reached the locked row");
    } finally { await admin.query("commit"); }
    return Promise.all(requests);
  };
  try {
    for (const role of ["anon", "authenticated", "service_role"]) {
      if (!(await owner.query("select 1 from pg_roles where rolname=$1", [role])).rowCount) {
        await owner.query("create role " + role + " noinherit");
      }
    }
    await admin.query("create schema extensions; create extension pgcrypto with schema extensions");
    await admin.query(fixture.replace(/^create role .*;$/gm, ""));
    for (let i = 0; i < 2; i++) {
      await admin.query("insert into auth.users(id,raw_user_meta_data) values($1,$2::jsonb)", [ids[i], JSON.stringify({ username: "legacy_" + i })]);
    }
    await admin.query("insert into high_scores(user_id,game_slug,score) values($1,'globle',10),($1,'flag-rush',20),($1,'peaks-valleys',30),($2,'globle',40),($2,'flag-rush',50)", ids.slice(0, 2));
    const before = (await admin.query("select user_id,coins,granted_today,accrual_at,last_reset,premium_tokens,updated_at from user_coins order by user_id")).rows;
    await t.test("invalid data and case collisions abort before privileges change", async () => {
      await admin.query("update user_coins set premium_tokens=-1 where user_id=$1", [ids[0]]);
      await assert.rejects(admin.query("begin;\n" + migration + "\ncommit;"), /invalid token state/i);
      await admin.query("rollback");
      assert.equal((await admin.query("select has_table_privilege('authenticated','public.user_coins','UPDATE') as allowed")).rows[0].allowed, true);
      await admin.query("update user_coins set premium_tokens=0 where user_id=$1", [ids[0]]);
      await admin.query("update profiles set referral_code=case when id=$1 then 'deadbeef' else 'DEADBEEF' end", [ids[0]]);
      await assert.rejects(admin.query("begin;\n" + migration + "\ncommit;"), /collide when compared without case/i);
      await admin.query("rollback");
      await admin.query("update profiles set referral_code=case when id=$1 then 'deadbeef' else 'cafebabe' end", [ids[0]]);
    });
    await admin.query("grant update(premium_tokens),insert(user_id) on user_coins to authenticated");
    await admin.query("begin;\n" + migration + "\ncommit;");
    await t.test("valid existing rows and scores survive migration", async () => {
      assert.deepEqual((await admin.query("select user_id,coins,granted_today,accrual_at,last_reset,premium_tokens,updated_at from user_coins order by user_id")).rows, before);
      assert.equal((await admin.query("select count(*)::integer as n from high_scores")).rows[0].n, 5);
    });
    for (let i = 2; i < ids.length; i++) {
      await admin.query("insert into auth.users(id,raw_user_meta_data) values($1,$2::jsonb)", [ids[i], JSON.stringify({ username: "player_" + i, is_admin: true, premium_tokens: 999999 })]);
    }
    await t.test("signup ignores authority metadata and uses one atomic trigger", async () => {
      assert.equal((await admin.query("select count(*)::integer as n from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal")).rows[0].n, 1);
      assert.equal((await admin.query("select is_admin from profiles where id=$1", [ids[2]])).rows[0].is_admin, false);
      assert.equal((await admin.query("select premium_tokens from user_coins where user_id=$1", [ids[2]])).rows[0].premium_tokens, 0);
      await admin.query("insert into auth.users(id) values($1)", [randomUUID()]);
      const trigger = "create function public.test_bootstrap_failure() returns trigger language plpgsql as $$ begin raise exception 'synthetic bootstrap failure'; end $$; create trigger test_bootstrap_failure before insert on public.user_coins for each row execute function public.test_bootstrap_failure();";
      await admin.query(trigger);
      const failed = randomUUID();
      await assert.rejects(admin.query("insert into auth.users(id) values($1)", [failed]), /synthetic bootstrap failure/);
      for (const [table,column] of [["auth.users","id"],["profiles","id"],["user_coins","user_id"]]) {
        assert.equal((await admin.query("select count(*)::integer as n from " + table + " where " + column + "=$1", [failed])).rows[0].n, 0);
      }
      await admin.query("drop trigger test_bootstrap_failure on user_coins; drop function test_bootstrap_failure()");
    });
    await t.test("anon cannot mutate accounts or execute private account RPCs", async () => {
      for (const sql of ["truncate user_coins", "update user_coins set premium_tokens=9999", "insert into high_scores values(gen_random_uuid(),'globle',1,now())", "update profiles set is_admin=true",
        "select arcade_refresh_user_tokens()", "select arcade_consume_user_tokens(1)", "select arcade_submit_high_score('globle',1)", "select redeem_referral('deadbeef',999)", "select delete_own_user()", "select get_user_state()"]) {
        await denied("anon", null, sql);
      }
      assert.equal((await as("anon", null, "select user_id from user_coins")).rowCount, 0);
      const board = await as("anon", null, "select * from get_leaderboard('globle',10000)");
      assert.deepEqual(board.fields.map(f => f.name), ["username","score"]);
      assert.equal((await as("anon", null, "select is_username_taken('legacy_0') as taken")).rows[0].taken, true);
    });
    await t.test("A cannot read or directly modify B or choose RPC account identity", async () => {
      for (const [table,column] of [["user_coins","user_id"],["profiles","id"],["high_scores","user_id"]]) {
        assert.equal((await as("authenticated",ids[2],"select * from "+table+" where "+column+"=$1",[ids[3]])).rowCount,0);
        await denied("authenticated",ids[2],"delete from "+table+" where "+column+"=$1",[ids[3]]);
      }
      for (const sql of ["truncate user_coins","update user_coins set premium_tokens=9999","update profiles set is_admin=true","update high_scores set score=100","select arcade_consume_user_tokens(1, $1::uuid)","select arcade_submit_high_score('globle',1,$1::uuid)","select delete_own_user($1::uuid)"]) {
        await denied("authenticated",ids[2],sql,sql.includes("$1")?[ids[3]]:[]);
      }
      const b = (await admin.query("select coins,premium_tokens from user_coins where user_id=$1",[ids[3]])).rows[0];
      assert.deepEqual(b,{coins:5,premium_tokens:0});
    });
    await t.test("16 simultaneous spends cannot double spend five daily tokens", async () => {
      const results=await race("user_coins","user_id",ids[2],Array(16).fill("select arcade_consume_user_tokens(1) as result"));
      assert.equal(results.filter(r=>r.rows[0].result.ok).length,5);
      assert.deepEqual((await admin.query("select coins,premium_tokens from user_coins where user_id=$1",[ids[2]])).rows[0],{coins:0,premium_tokens:0});
    });
    await t.test("16 simultaneous referrals award one server-selected bonus", async () => {
      const results=await race("profiles","id",ids[3],Array(16).fill("select redeem_referral('DEADBEEF',2147483647) as ok"));
      assert.equal(results.filter(r=>r.rows[0].ok).length,1);
      assert.equal((await admin.query("select premium_tokens from user_coins where user_id=$1",[ids[3]])).rows[0].premium_tokens,20);
    });
    await t.test("16 simultaneous best scores retain the maximum", async () => {
      await as("authenticated",ids[4],"select arcade_submit_high_score('globle',0)");
      await race("high_scores","user_id",ids[4],Array.from({length:16},(_,i)=>"select arcade_submit_high_score('globle',"+(100+i)+")"));
      assert.equal((await admin.query("select score from high_scores where user_id=$1",[ids[4]])).rows[0].score,115);
      assert.equal((await as("authenticated",ids[4],"select arcade_submit_high_score('globle',1001) as score")).rows[0].score,null);
      assert.equal((await as("authenticated",ids[4],"select arcade_submit_high_score('unknown',1) as score")).rows[0].score,null);
    });
    await t.test("UTC reset racing 12 spends and four refreshes grants once", async () => {
      await admin.query("update user_coins set coins=0,granted_today=10,last_reset=((now() at time zone 'utc')::date-1) where user_id=$1",[ids[5]]);
      const calls=[...Array(12).fill("select arcade_consume_user_tokens(1) as result"),...Array(4).fill("select arcade_refresh_user_tokens() as result")];
      const results=await race("user_coins","user_id",ids[5],calls);
      assert.equal(results.slice(0,12).filter(r=>r.rows[0].result.ok).length,5);
      assert.deepEqual((await admin.query("select coins,granted_today,premium_tokens from user_coins where user_id=$1",[ids[5]])).rows[0],{coins:0,granted_today:5,premium_tokens:0});
    });
    await t.test("failed account deletion preserves all existing account rows", async () => {
      await admin.query("create table public.test_delete_blocker(user_id uuid references auth.users(id) on delete restrict)");
      await admin.query("insert into public.test_delete_blocker values($1)",[ids[0]]);
      const counts = async () => (await admin.query("select (select count(*) from auth.users) as users,(select count(*) from profiles) as profiles,(select count(*) from user_coins) as balances,(select count(*) from high_scores) as scores")).rows[0];
      const beforeDelete = await counts();
      await assert.rejects(as("authenticated",ids[0],"select delete_own_user()"),error=>error.code==="23503");
      assert.deepEqual(await counts(),beforeDelete);
      await admin.query("drop table public.test_delete_blocker");
    });
    await t.test("delete cascades own data and cannot unlock a second referral reward", async () => {
      await as("authenticated",ids[0],"select delete_own_user()");
      assert.equal((await as("authenticated",ids[3],"select redeem_referral('cafebabe',99999) as ok")).rows[0].ok,false);
      assert.equal((await admin.query("select premium_tokens from user_coins where user_id=$1",[ids[3]])).rows[0].premium_tokens,20);
      for (const [table,column] of [["auth.users","id"],["profiles","id"],["user_coins","user_id"],["high_scores","user_id"]]) {
        assert.equal((await admin.query("select count(*)::integer as n from "+table+" where "+column+"=$1",[ids[0]])).rows[0].n,0);
      }
      assert.equal((await as("authenticated",ids[0],"select get_user_state() as state")).rows[0].state,null);
      assert.equal((await as("authenticated",ids[0],"select arcade_refresh_user_tokens() as state")).rows[0].state,null);
      assert.equal((await as("authenticated",ids[0],"select arcade_submit_high_score('globle',1) as score")).rows[0].score,null);
    });
    await t.test("referral and state reads expose only the caller's expected fields", async () => {
      const state=(await as("authenticated",ids[3],"select get_user_state() as state")).rows[0].state;
      assert.deepEqual(Object.keys(state).sort(),["accrual_at","coins","granted_today","high_scores","last_reset","premium_tokens"]);
      assert.equal(state.premium_tokens,20);
      assert.deepEqual(state.high_scores,[]);
    });
  } finally {
    for (const client of openClients) await client.end().catch(()=>{});
    await admin.end();
    await owner.query('drop database "' + database + '" with (force)');
    await owner.end();
  }
});
