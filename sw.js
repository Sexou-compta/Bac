// Service worker : app utilisable sans internet, ouverture rapide même avec une connexion faible
const CACHE = 'eleves-v9';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // garder les fichiers de contenu déjà téléchargés (copie vers le nouveau cache)
  e.waitUntil(caches.keys().then(async keys => {
    const cur = await caches.open(CACHE);
    for (const k of keys.filter(k => k !== CACHE)) {
      const old = await caches.open(k);
      for (const req of await old.keys()) {
        if (/\/u\d+-[a-z]+\.js$/.test(new URL(req.url).pathname) && !(await cur.match(req))) await cur.put(req, await old.match(req));
      }
      await caches.delete(k);
    }
  }).then(() => self.clients.claim()));
});
const put = (req, res) => { if (res && (res.ok || res.type === 'opaque')) { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return res; };

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Page : internet d'abord, mais si la réponse tarde (> 2,5 s) on ouvre la copie locale
  if (req.mode === 'navigate') {
    const net = fetch(req).then(res => put('./index.html', res));
    e.respondWith(new Promise(resolve => {
      let done = false;
      const fallback = () => caches.match('./index.html').then(hit => { if (hit && !done) { done = true; resolve(hit); } });
      const t = setTimeout(fallback, 2500);
      net.then(res => { if (!done) { done = true; clearTimeout(t); resolve(res); } })
         .catch(() => { clearTimeout(t); caches.match('./index.html').then(hit => { if (!done) { done = true; resolve(hit || Response.error()); } }); });
    }));
    return;
  }
  // Fichiers de contenu (u02-ex.js…) : copie locale tout de suite + mise à jour en arrière-plan
  if (url.origin === location.origin && /\/u\d+-[a-z]+\.js$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(res => put(req, res)).catch(() => hit);
      if (hit) { e.waitUntil(net); return hit; }
      return net;
    }));
    return;
  }
  // Reste (icônes, police Google) : copie locale d'abord
  if (url.origin === location.origin || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => put(req, res))));
  }
});
