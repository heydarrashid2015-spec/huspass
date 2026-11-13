import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../../app/page.js',import.meta.url),'utf8');
const schema=readFileSync(new URL('../../sql/home-rooms-installations.sql',import.meta.url),'utf8');

test('rooms preview is confined to authorized Android Plus access',()=>{
 expect(page).toContain('const canPreviewPlus=aiAccess&&isAndroidWebView');
 expect(page).toContain('disabled={!canPreviewPlus}');
 expect(page).toContain('canPreviewPlus&&plusPreviewSection');
 expect(page).toContain('plusPreviewSection==="details"');
 expect(page).not.toContain('<b>Boligens detaljer</b><span>Rum og installationer · Kommer senere</span>');
});
test('room and installation writes bind to authenticated home and selected room',()=>{
 expect(page).toContain('const addHomeRoom=async()');
 expect(page).toContain('const addRoomInstallation=async()');
 expect(page).toContain('home_id:home.id,user_id:user.id');
 expect(page).toContain('room_id:room.id');
 expect(page).toContain('supabase.from("home_rooms")');
 expect(page).toContain('supabase.from("room_installations")');
});
test('RLS policies enforce owner and parent-home relationships for all operations',()=>{
 for(const table of ['home_rooms','room_installations']){
  expect(schema).toContain('alter table public.'+table+' enable row level security');
  for(const action of ['select','insert','update','delete'])expect(schema).toContain('"'+table+'_owner_'+action+'"');
 }
 expect(schema).toContain('foreign key(room_id,home_id,user_id)');
 expect(schema).toContain('revoke all on public.home_rooms,public.room_installations from anon');
 expect(schema).toContain('h.user_id=(select auth.uid())');
});
