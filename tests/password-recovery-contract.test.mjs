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


test('late session bootstrap cannot override active password recovery', () => {
  assert.match(source, /getSession\(\)\.then\(\(\{data\}\)=>\{if\(!mounted\|\|passwordRecoveryActiveRef\.current\)return;/);
});

test('recovery session cannot be redirected to home by a later SIGNED_IN event', () => {
  assert.match(source, /event==="SIGNED_IN"&&passwordRecoveryActiveRef\.current\)\{setRecoveryMode\(true\);setView\("Auth"\);setAuthReady\(true\);return\}/);
});

test('recovery is email-only and does not alter home records during password update', () => {
  const recoveryForm = source.slice(source.indexOf('<h1>Ny adgangskode</h1>'), source.indexOf('if(view==="Auth")'));
  assert.match(recoveryForm, /supabase\.auth\.updateUser\(\{password:newPassword\}\)/);
  assert.doesNotMatch(recoveryForm, /supabase\.from\(|deleteUser\(|signOut\(|signInWithOtp\(|phone:|sms/i);
});


test('email confirmation polling cannot override password recovery', () => {
  assert.match(source, /if\(!active\|\|checking\|\|passwordRecoveryActiveRef\.current\|\|document\.visibilityState==="hidden"\)return/);
  assert.match(source, /if\(passwordRecoveryActiveRef\.current\)return;if\(session\?\.user\?\.email/);
  assert.match(source, /if\(active&&!passwordRecoveryActiveRef\.current&&!error&&data\?\.session\?\.user\)/);
});
