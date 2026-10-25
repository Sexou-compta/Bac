// Service worker : app utilisable sans internet
const CACHE = 'eleves-v3';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Page : internet d'abord pour recevoir les mises à jour, sinon copie locale
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req)
      .then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Fichiers de contenu (u02-ex.js…) : réseau d'abord pour les mises à jour, sinon copie locale
  if (url.origin === location.origin && /\/u\d+-[a-z]+\.js$/.test(url.pathname)) {
    e.respondWith(fetch(req)
      .then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return res; })
      .catch(() => caches.match(req)));
    return;
  }
  // Reste (icônes, police Google) : copie locale d'abord
  if (url.origin === location.origin || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
      return res;
    })));
  }
});
