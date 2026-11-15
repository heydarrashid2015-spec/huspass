import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

// Regression guard: stale documents from a previous account must not be signed.
const page=await readFile(new URL("../app/page.js",import.meta.url),"utf8");
const openDoc=page.slice(page.indexOf("const openDoc=async d=>"),page.indexOf("const loadTasks=",page.indexOf("const openDoc=async d=>")));
test("document signing checks authenticated user and selected home",()=>{
 assert.ok(openDoc.includes("d.user_id!==user.id"));
 assert.ok(openDoc.includes("d.home_id!==home.id"));
 assert.ok(openDoc.includes("d.file_path.startsWith(\x60\x24{user.id}/\x24{home.id}/\x60)"));
 assert.ok(openDoc.indexOf("d.user_id!==user.id")<openDoc.indexOf("createSignedUrl"));
});
