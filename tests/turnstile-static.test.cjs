const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("app/page.js", "utf8");

test("Turnstile remains opt-in and requires a site key", () => {
  assert.match(source, /NEXT_PUBLIC_TURNSTILE_ENABLED==="true"&&Boolean\(TURNSTILE_SITE_KEY\)/);
  assert.match(source, /NEXT_PUBLIC_TURNSTILE_SITE_KEY\|\|""/);
});

test("auth flows pass captcha tokens to Supabase", () => {
  for (const method of ["signUp", "signInWithPassword", "resetPasswordForEmail", "resend"]) {
    assert.ok(source.includes("supabase.auth." + method + "("), method + " missing");
  }
  assert.ok((source.match(/TURNSTILE_ENABLED\?\{captchaToken\}/g) || []).length >= 3);
  assert.match(source, /signInWithPassword\(\{email:cleanEmail,password,\.\.\.\(TURNSTILE_ENABLED\?\{options:\{captchaToken\}\}/);
});

test("password recovery returns to initiating origin", () => {
  assert.match(source, /resetPasswordForEmail\(cleanEmail,\{redirectTo:window\.location\.origin/);
});

test("confirmation polling avoids password sign-in when CAPTCHA is enabled", () => {
  assert.match(source, /if\(TURNSTILE_ENABLED\)return;const \{data,error\}=await supabase\.auth\.signInWithPassword/);
});

test("Turnstile preview rejects production Supabase backend", () => {
  assert.match(source, /TURNSTILE_REQUESTED&&\(!process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(source, /SUPABASE_URL===PROD_SUPABASE_URL/);
  assert.match(source, /!process\.env\.NEXT_PUBLIC_TURNSTILE_SITE_KEY/);
});

test("password recovery view survives a subsequent sign-in event", () => {
  assert.match(source, /if\(event==="PASSWORD_RECOVERY"\)\{recoveryModeRef\.current=true/);
  assert.match(source, /if\(event==="SIGNED_IN"&&session\?\.user\)\{/);
  assert.match(source, /previousUserId&&previousUserId!==session\.user\.id/);
  assert.match(source, /lastAuthenticatedUserIdRef\.current=session\.user\.id;if\(recoveryModeRef\.current\)return/);
  assert.match(source, /recoveryModeRef\.current=false;setRecoveryMode\(false\);setNewPassword/);
});

test("direct account switching clears prior account state", () => {
  assert.ok(source.includes("previousUserId&&previousUserId!==session.user.id"));
  assert.ok(source.includes("void clearPrivateLocalData(previousUserId);loadedUserRef.current=null;setHouseImage"));
  assert.ok(source.includes("setTasks([]);setDocs([]);setEditingTask(null);setQuery"));
});

test("initial session lookup does not override recovery mode", () => {
  assert.match(source, /const sessionUser=data\.session\?\.user\|\|null;if\(sessionUser\)lastAuthenticatedUserIdRef\.current=sessionUser\.id;setUser\(sessionUser\);if\(recoveryModeRef\.current\)\{setView\("Auth"\);setAuthReady\(true\);return\}/);
});

test("failed Turnstile script can be retried on challenge reset", () => {
  assert.match(source, /if\(script\?\.dataset\.turnstileLoadFailed==="true"\)\{script\.remove\(\);script=null\}/);
});

test("frontend does not expose server-side Supabase or Turnstile secrets", () => {
  assert.doesNotMatch(source, /process\.env\.(?:NEXT_PUBLIC_)?(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|TURNSTILE_SECRET_KEY)/);
  assert.doesNotMatch(source, /(?:service_role|secret_key)\s*[:=]\s*["\x27][^"\x27]+/i);
});
