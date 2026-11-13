import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

test("document intelligence module parses as valid JavaScript", () => {
  const file=fileURLToPath(new URL("../lib/document-intelligence.js",import.meta.url));
  const check=spawnSync(process.execPath,["--check",file],{encoding:"utf8"});
  assert.equal(check.status,0,check.stderr||check.error?.message);
});
