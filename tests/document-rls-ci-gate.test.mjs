import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const keys = [
  "SUPABASE_URL", "SUPABASE_ANON_KEY", "DOCUMENT_TEST_OWNER_JWT",
  "DOCUMENT_TEST_OTHER_JWT", "DOCUMENT_TEST_ID", "DOCUMENT_TEST_FILE_PATH"
];
const script = new URL("./document-supabase-rls.integration.test.mjs", import.meta.url);
function run(overrides = {}) {
  const env = { ...process.env };
  for (const key of keys) delete env[key];
  delete env.DOCUMENT_REQUIRE_RLS;
  Object.assign(env, overrides);
  return spawnSync(process.execPath, ["--test", script.pathname], {
    env, encoding: "utf8", timeout: 15000
  });
}

test("required RLS gate fails closed without credentials", () => {
  const result = run({ DOCUMENT_REQUIRE_RLS: "1" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /Required Supabase RLS integration test cannot run/);
});

test("partial RLS configuration fails even when optional", () => {
  const result = run({ SUPABASE_URL: "https://example.supabase.co" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /Incomplete Supabase RLS test configuration/);
});

test("optional RLS test explicitly skips when no credentials are configured", () => {
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /SKIP Supabase integration credentials not configured/);
});
