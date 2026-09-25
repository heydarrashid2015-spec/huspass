const CACHE="huspass-shell-v5";
const SHELL=["/manifest.webmanifest","/pwa-192","/pwa-512","/icon","/apple-icon"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("huspass-shell-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{const req=event.request;if(req.method!=="GET")return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;const isPublicAsset=["/manifest.webmanifest","/pwa-192","/pwa-512","/icon","/apple-icon"].includes(url.pathname);if(!isPublicAsset)return;event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy))}return res})))});
