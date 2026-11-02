const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = path => fs.readFileSync(path, "utf8");

test("Android wrapper uses HTTPS production origin and disallows cleartext", () => {
  const config = read("capacitor.config.ts");
  assert.match(config, /url:\s*["']https:\/\/www\.huspass\.dk["']/);
  assert.match(config, /cleartext:\s*false/);
  assert.doesNotMatch(config, /cleartext:\s*true/);
});

test("web response declares baseline security headers", () => {
  const config = read("next.config.mjs");
  for (const name of ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"]) {
    assert.ok(config.includes(name), name + " missing");
  }
});

test("private environment and signing files remain ignored", () => {
  const gitignore = read(".gitignore");
  for (const entry of [".env*", "*.jks", "*.keystore", "key.properties"]) {
    assert.ok(gitignore.split(/\r?\n/).includes(entry), entry + " not ignored");
  }
});
