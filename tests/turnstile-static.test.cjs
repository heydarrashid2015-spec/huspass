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
