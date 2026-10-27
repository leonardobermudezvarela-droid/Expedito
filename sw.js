// Service Worker de MedSync Tracker
// Estrategia: red primero (siempre la versión más nueva), caché solo si no hay internet.
const CACHE_NAME = 'medsync-v3';
const ASSETS = ['index.html', 'manifest.json'];

self.addEventListener('install', e => {
  self.skipWaiting(); // activa la versión nueva sin esperar
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim()) // toma el control de las pestañas abiertas
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // Solo gestionamos GET de nuestro propio sitio; las llamadas a Google Apps Script pasan directo
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        const copia = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copia));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
