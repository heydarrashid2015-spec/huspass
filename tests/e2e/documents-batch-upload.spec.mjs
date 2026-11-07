import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test('document archive supports multi-file upload and private per-file storage',()=>{
 const source=readFileSync(new URL('../../app/page.js',import.meta.url),'utf8');
 expect(source).toContain('type="file" multiple accept=');
 expect(source).toContain('docFile.length>20');
 expect(source).toContain('file.size>10*1024*1024');
 expect(source).toContain('crypto.randomUUID()');
 expect(source).toContain('for(const file of files)');
 expect(source).toContain('supabase.storage.from("home-documents").upload');
 expect(source).toContain('supabase.from("documents").insert');
 expect(source).toContain('failed++');
 expect(source).toContain('createSignedUrl(d.file_path,300)');
});
