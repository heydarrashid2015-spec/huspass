import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test('signed Android release preserves approved branding and API 36 toolchain',()=>{
 const workflow=readFileSync(new URL('../../.github/workflows/android-play-release.yml',import.meta.url),'utf8');
 expect(workflow).toContain('public/huspass-icon.svg');
 expect(workflow).toContain('ic_launcher_round.png');
 expect(workflow).toContain("mipmap-anydpi-v26*");
 expect(workflow).toContain('com.android.tools.build:gradle:8.9.1');
 expect(workflow).toContain('scripts/configure-android-release.mjs');
 expect(workflow).toContain('Verify original HusPass upload certificate');
 expect(workflow).toContain('jarsigner -verify');
});
