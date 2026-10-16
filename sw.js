// Moin's Cafe - small service worker: keeps the app opening fast and lets the menu show even with a weak connection.
const CACHE = 'moins-cafe-v1';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/icon-192.png', '/icon-512.png'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                       // fonts and other sites load normally
  if (req.destination === 'video' || req.headers.has('range')) return; // never touch videos

  // The page itself: always try the internet first so menu and price updates show straight away
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('/', copy)); return res; })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Icons and other small files: use the saved copy, then refresh it
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
