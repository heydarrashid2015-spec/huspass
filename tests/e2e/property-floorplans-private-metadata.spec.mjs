import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const schema=readFileSync(new URL('../../sql/home-floorplans-private-metadata.sql',import.meta.url),'utf8');

test('floorplan metadata is restricted to owning home and user for every operation',()=>{
 expect(schema).toContain('alter table public.home_floorplans enable row level security');
 for(const operation of ['select','insert','update','delete']){
  expect(schema).toContain('"home_floorplans_owner_'+operation+'"');
 }
 expect((schema.match(/h.user_id=\(select auth.uid\(\)\)/g)||[]).length).toBe(4);
 expect(schema).toContain('storage_path = user_id::text ||');
 expect(schema).toContain('revoke all on public.home_floorplans from anon');
});
test('floorplan metadata is limited to image/PDF with bounded file sizes and no public bucket',()=>{
 for(const mime of ['application/pdf','image/png','image/jpeg','image/webp'])expect(schema).toContain(mime);
 expect(schema).toContain('size_bytes <= 20971520');
 expect(schema).not.toMatch(/create\s+bucket|public\s*=\s*true|create\s+policy[^;]*storage\.objects/i);
});
