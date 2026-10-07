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
    await db.query(
      "insert into public.profiles (id, referral_code) values ($1, 'deadbeef'), ($2, 'DEADBEEF')",
      [IDS.invited, IDS.referrer],
    );

    await assert.rejects(db.exec(`begin;\n${migration}\ncommit;`), /collide when compared without case/i);
    await db.exec("rollback");

    const result = await db.query<{ insert_allowed: boolean; rls_enabled: boolean; normalized_index: string | null }>(`
      select has_table_privilege('authenticated', 'public.profiles', 'INSERT') as insert_allowed,
        (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass) as rls_enabled,
        to_regclass('public.profiles_referral_code_upper_key')::text as normalized_index
    `);
    assert.deepEqual(result.rows[0], { insert_allowed: true, rls_enabled: false, normalized_index: null });
  } finally {
    await db.close();
  }
});

test("migration protects balances and redeems legacy lowercase referral codes safely", async () => {
  const db = new PGlite();
  try {
    await db.exec(fixture);
    await db.query(
      `insert into public.profiles (id, is_admin, referral_code) values
        ($1, false, 'cafebabe'),
        ($2, false, 'deadbeef'),
        ($3, false, 'c0ffee01'),
        ($4, true, 'ab12cd34')`,
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
