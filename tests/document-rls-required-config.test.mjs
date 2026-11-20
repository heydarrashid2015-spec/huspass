import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./document-supabase-rls.integration.test.mjs", import.meta.url));
const keys = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "DOCUMENT_TEST_OWNER_JWT", "DOCUMENT_TEST_OTHER_JWT", "DOCUMENT_TEST_ID", "DOCUMENT_TEST_FILE_PATH"];

function run(overrides = {}) {
  const env = { ...process.env, DOCUMENT_REQUIRE_RLS: "1" };
  for (const key of keys) delete env[key];
  Object.assign(env, overrides);
  return spawnSync(process.execPath, [script], { env, encoding: "utf8", timeout: 10000 });
}

test("mandatory Supabase RLS verification fails closed without all six fixture values", () => {
  const result = run();
  assert.equal(result.status, 1, result.stderr);
  for (const key of keys) assert.match(result.stdout + result.stderr, new RegExp(key));
  assert.match(result.stdout + result.stderr, /Required Supabase RLS integration test cannot run/);
});

test("mandatory Supabase RLS verification rejects partially configured fixtures", () => {
  const result = run({ SUPABASE_URL: "https://example.supabase.co" });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout + result.stderr, /SUPABASE_ANON_KEY/);
  assert.match(result.stdout + result.stderr, /DOCUMENT_TEST_OTHER_JWT/);
});

test("mandatory Supabase RLS verification does not silently skip when credentials are absent", () => {
  const result = run();
  assert.doesNotMatch(result.stdout + result.stderr, /# skipped 1/);
  assert.match(result.stdout + result.stderr, /Required Supabase RLS integration test cannot run/);
});
