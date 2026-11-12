import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../app/page.js', import.meta.url), 'utf8');

test('email-only recovery uses Supabase with the production redirect', () => {
  assert.match(source, /supabase\.auth\.resetPasswordForEmail\(cleanEmail,\s*\{redirectTo:\s*"https:\/\/huspass\.dk"\}\)/);
});

test('recovery request always uses the same account-neutral confirmation', () => {
  assert.match(source, /try\{await supabase\.auth\.resetPasswordForEmail\([\s\S]*?\}catch\{\}finally\{setAuthBusy\(false\);setAuthMsg\("Hvis e-mailadressen er registreret, modtager du et link til at nulstille din adgangskode\."\)/);
});

test('recovery event switches to password update view', () => {
  assert.match(source, /event==="PASSWORD_RECOVERY"[\s\S]*?passwordRecoveryActiveRef\.current=true;setRecoveryMode\(true\);setView\("Auth"\)/);
});

test('password update handles rejected promises and clears busy state', () => {
  assert.match(source, /try\{const \{error\}=await supabase\.auth\.updateUser\(\{password:newPassword\}\);passwordUpdateError=error\}catch\(error\)\{passwordUpdateError=error\}finally\{setAuthBusy\(false\)\}/);
});
