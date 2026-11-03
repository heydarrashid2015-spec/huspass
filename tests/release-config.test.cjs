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

test("Android checksum filename matches the signed release and is uploaded", () => {
  const workflow = read(".github/workflows/android-debug.yml");
  assert.match(workflow, /HusPass-Android-v1\.0\.9-signed\.aab/);
  assert.match(workflow, /HusPass-Android-v1\.0\.9-SHA256\.txt/);
  assert.doesNotMatch(workflow, /HusPass-Android-v1\.0\.0-SHA256\.txt/);
  assert.match(workflow, /name: Upload Android artifact checksums/);
  assert.match(workflow, /name: Upload Play-ready signed AAB/);
});

test("feature branch cannot publish a public Android test release", () => {
  const workflow = read(".github/workflows/android-debug.yml");
  assert.match(workflow, /name: Publish shareable Android test APK\s+if: github\.ref == 'refs\/heads\/main'/);
});

test("PWA service worker never caches account pages or API responses", () => {
  const worker = read("public/sw.js");
  assert.match(worker, /req\.method!==["']GET["']/);
  assert.match(worker, /url\.origin!==self\.location\.origin/);
  assert.match(worker, /if\(!isPublicAsset\)return/);
  assert.doesNotMatch(worker, /cache\.put\(req,\s*res\)/);
  for (const path of ["/auth", "/api", "/konto", "/overblik"]) {
    assert.ok(!worker.match(/const SHELL=\[([^\]]*)\]/)?.[1].includes(path), path + " must not be pre-cached");
  }
});

test("both logout entry points clear user-specific cached images", () => {
  const page = read("app/page.js");
  const logoutError = 'if(error)return notify("Du kunne ikke logges ud. Prøv igen.");';
  const handlers = page.split(logoutError).slice(1);
  assert.equal(handlers.length, 2, "expected two logout entry points");
  for (const handler of handlers) {
    const beforeReset = handler.split("setUser(null)")[0];
    assert.match(beforeReset, /await clearPrivateLocalData\(user\?\.id\);/);
  }
});
