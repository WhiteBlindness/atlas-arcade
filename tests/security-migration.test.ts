import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const fixture = readFileSync(join(process.cwd(), "tests", "fixtures", "security-trust-schema.sql"), "utf8");
const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20261007_atlas_arcade_trust_boundaries.sql"),
  "utf8",
);

const IDS = {
  invited: "11111111-1111-4111-8111-111111111111",
  referrer: "22222222-2222-4222-8222-222222222222",
  player: "33333333-3333-4333-8333-333333333333",
  admin: "44444444-4444-4444-8444-444444444444",
};

async function seedOwners(db: PGlite) {
  await db.exec("alter table auth.users disable trigger user");
  try {
    for (const id of Object.values(IDS)) {
      await db.query("insert into auth.users (id) values ($1)", [id]);
    }
  } finally {
    await db.exec("alter table auth.users enable trigger user");
  }
}

async function runAsAuthenticated<T extends Record<string, unknown>>(
  db: PGlite,
  userId: string,
  query: string,
  params: unknown[] = [],
) {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  await db.exec("set role authenticated");
  try {
    return await db.query<T>(query, params);
  } finally {
    await db.exec("reset role");
  }
}

test("referral case collisions stop before the migration changes grants or RLS", async () => {
  const db = new PGlite();
  try {
    await db.exec(fixture);
    await seedOwners(db);
    await db.query(
      "insert into public.profiles (id, username, referral_code) values ($1, 'invited', 'deadbeef'), ($2, 'referrer', 'DEADBEEF')",
      [IDS.invited, IDS.referrer],
    );

    await assert.rejects(db.exec(`begin;\n${migration}\ncommit;`), /collide when compared without case/i);
    await db.exec("rollback");

    const result = await db.query<{ insert_allowed: boolean; rls_enabled: boolean; normalized_index: string | null }>(`
      select has_table_privilege('authenticated', 'public.profiles', 'INSERT') as insert_allowed,
        (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass) as rls_enabled,
        to_regclass('public.profiles_referral_code_upper_key')::text as normalized_index
    `);
    assert.deepEqual(result.rows[0], { insert_allowed: true, rls_enabled: true, normalized_index: null });
  } finally {
    await db.close();
  }
});

test("migration protects balances and redeems legacy lowercase referral codes safely", async () => {
  const db = new PGlite();
  try {
    await db.exec(fixture);
    await seedOwners(db);
    await db.query(
      `insert into public.profiles (id, username, is_admin, referral_code) values
        ($1, 'invited', false, 'cafebabe'),
        ($2, 'referrer', false, 'deadbeef'),
        ($3, 'player', false, 'c0ffee01'),
        ($4, 'admin', true, 'ab12cd34')`,
      [IDS.invited, IDS.referrer, IDS.player, IDS.admin],
    );
    await db.query(
      `insert into public.user_coins (user_id, coins, granted_today, accrual_at, last_reset, premium_tokens)
       values ($1, 2, 5, clock_timestamp(), (clock_timestamp() at time zone 'utc')::date, 1),
              ($2, 2, 5, clock_timestamp(), (clock_timestamp() at time zone 'utc')::date, 0)`,
      [IDS.player, IDS.admin],
    );
    await db.exec(`begin;\n${migration}\ncommit;`);

    const referral = await runAsAuthenticated<{ granted: boolean }>(
      db, IDS.invited, "select public.redeem_referral('DEADBEEF', 999999) as granted",
    );
    assert.equal(referral.rows[0].granted, true);
    const repeatedReferral = await runAsAuthenticated<{ granted: boolean }>(
      db, IDS.invited, "select public.redeem_referral('deadbeef', 999999) as granted",
    );
    assert.equal(repeatedReferral.rows[0].granted, false);
    const referralBalance = await db.query<{ premium_tokens: number; referred_by: string }>(`
      select c.premium_tokens, p.referred_by::text
      from public.user_coins c join public.profiles p on p.id = c.user_id
      where c.user_id = $1
    `, [IDS.invited]);
    assert.deepEqual(referralBalance.rows[0], { premium_tokens: 20, referred_by: IDS.referrer });

    const spend = await runAsAuthenticated<{ result: { ok: boolean; is_admin: boolean; coins: number; granted_today: number; accrual_at: string; last_reset: string; premium_tokens: number } }>(
      db, IDS.player, "select public.arcade_consume_user_tokens(3) as result",
    );
    assert.deepEqual(spend.rows[0].result, {
      ok: true,
      is_admin: false,
      coins: 0,
      granted_today: 5,
      accrual_at: spend.rows[0].result.accrual_at,
      last_reset: spend.rows[0].result.last_reset,
      premium_tokens: 0,
    });

    const overspend = await runAsAuthenticated<{ result: { ok: boolean; is_admin: boolean; coins: number; granted_today: number; accrual_at: string; last_reset: string; premium_tokens: number } }>(
      db, IDS.player, "select public.arcade_consume_user_tokens(1) as result",
    );
    assert.equal(overspend.rows[0].result.ok, false);
    assert.equal(overspend.rows[0].result.coins, 0);
    assert.equal(overspend.rows[0].result.premium_tokens, 0);

    const adminSpend = await runAsAuthenticated<{ result: { ok: boolean; is_admin: boolean; coins: number } }>(
      db, IDS.admin, "select public.arcade_consume_user_tokens(5) as result",
    );
    assert.equal(adminSpend.rows[0].result.ok, true);
    assert.equal(adminSpend.rows[0].result.is_admin, true);
    assert.equal(adminSpend.rows[0].result.coins, 2);

    const highScore = await runAsAuthenticated<{ score: number | null }>(
      db, IDS.player, "select public.arcade_submit_high_score('globle', 100) as score",
    );
    const lowerScore = await runAsAuthenticated<{ score: number | null }>(
      db, IDS.player, "select public.arcade_submit_high_score('globle', 50) as score",
    );
    const invalidScore = await runAsAuthenticated<{ score: number | null }>(
      db, IDS.player, "select public.arcade_submit_high_score('unknown-game', 50) as score",
    );
    assert.equal(highScore.rows[0].score, 100);
    assert.equal(lowerScore.rows[0].score, 100);
    assert.equal(invalidScore.rows[0].score, null);

    const ownRows = await runAsAuthenticated<{ user_id: string }>(
      db,
      IDS.player,
      "select user_id::text from public.user_coins order by user_id",
    );
    assert.deepEqual(ownRows.rows.map((row) => row.user_id), [IDS.player]);

    await db.exec("set role authenticated");
    try {
      await assert.rejects(
        db.query("insert into public.user_coins (user_id) values ($1)", [IDS.invited]),
        /permission denied/i,
      );
    } finally {
      await db.exec("reset role");
    }
  } finally {
    await db.close();
  }
});

test("migration restricts private state and deletion RPCs while keeping public reads", async () => {
  const db = new PGlite();
  try {
    await db.exec(fixture);
    await db.exec("begin;\n" + migration + "\ncommit;");
    const grants = await db.query<{ private_state: boolean; delete_account: boolean; leaderboard: boolean; username: boolean }>(
      "select has_function_privilege('anon','public.get_user_state()','EXECUTE') as private_state," +
      "has_function_privilege('anon','public.delete_own_user()','EXECUTE') as delete_account," +
      "has_function_privilege('anon','public.get_leaderboard(text,integer)','EXECUTE') as leaderboard," +
      "has_function_privilege('anon','public.is_username_taken(text)','EXECUTE') as username");
    assert.deepEqual(grants.rows[0], { private_state: false, delete_account: false, leaderboard: true, username: true });
    await db.query("insert into auth.users (id, raw_user_meta_data) values ($1,$2::jsonb)", [
      IDS.player, JSON.stringify({ username: "player", is_admin: true, premium_tokens: 99999 }),
    ]);
    const profile = await runAsAuthenticated<{ username: string; is_admin: boolean }>(
      db, IDS.player, "select username,is_admin from public.profiles");
    assert.deepEqual(profile.rows[0], { username: "player", is_admin: false });
    const state = await runAsAuthenticated<{ result: { coins: number; premium_tokens: number; high_scores: unknown[] } }>(
      db, IDS.player, "select public.get_user_state() as result");
    assert.equal(state.rows[0].result.coins, 5);
    assert.equal(state.rows[0].result.premium_tokens, 0);
    assert.deepEqual(state.rows[0].result.high_scores, []);
    await runAsAuthenticated(db, IDS.player, "select public.arcade_submit_high_score('globle',50)");
    await db.query("insert into auth.sessions(id,user_id) values (gen_random_uuid(),$1)", [IDS.player]);
    await db.query("insert into auth.identities(id,user_id) values (gen_random_uuid(),$1)", [IDS.player]);
    await runAsAuthenticated(db, IDS.player, "select public.delete_own_user()");
    for (const [table, column] of [
      ["auth.users","id"],["auth.sessions","user_id"],["auth.identities","user_id"],
      ["public.profiles","id"],["public.user_coins","user_id"],["public.high_scores","user_id"],
    ]) {
      const count = await db.query<{ count: number }>("select count(*)::integer as count from " + table + " where " + column + "=$1", [IDS.player]);
      assert.equal(count.rows[0].count, 0, table);
    }
    const stale = await runAsAuthenticated<{ result: unknown }>(db, IDS.player, "select public.get_user_state() as result");
    assert.equal(stale.rows[0].result, null);
  } finally { await db.close(); }
});

test("deleting a referrer cannot reset another account's redeemed reward", async () => {
  const db = new PGlite();
  try {
    await db.exec(fixture);
    await seedOwners(db);
    await db.query("insert into profiles(id,username,referral_code) values ($1,'invited','cafebabe'),($2,'referrer','deadbeef'),($3,'player','c0ffee01')",
      [IDS.invited, IDS.referrer, IDS.player]);
    await db.exec("begin;\n" + migration + "\ncommit;");
    assert.equal((await runAsAuthenticated<{ ok: boolean }>(db, IDS.invited, "select public.redeem_referral('deadbeef',999999) as ok")).rows[0].ok, true);
    await runAsAuthenticated(db, IDS.referrer, "select public.delete_own_user()");
    assert.equal((await runAsAuthenticated<{ ok: boolean }>(db, IDS.invited, "select public.redeem_referral('c0ffee01',999999) as ok")).rows[0].ok, false);
    assert.equal((await db.query<{ premium_tokens: number }>("select premium_tokens from user_coins where user_id=$1", [IDS.invited])).rows[0].premium_tokens, 20);
  } finally { await db.close(); }
});

test("invalid token states abort atomically instead of being silently rewritten", async () => {
  const db = new PGlite();
  try {
    await db.exec(fixture);
    await seedOwners(db);
    await db.query("insert into user_coins(user_id,premium_tokens) values ($1,-1)",[IDS.player]);
    await assert.rejects(db.exec("begin;\n" + migration + "\ncommit;"), /invalid token state/i);
    await db.exec("rollback");
    assert.equal((await db.query<{ allowed: boolean }>("select has_table_privilege('authenticated','public.user_coins','UPDATE') as allowed")).rows[0].allowed,true);
  } finally { await db.close(); }
});
