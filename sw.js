const CACHE_NAME = 'tpe-cache-v6.5.2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './indexadm.html',
  './style.css',
  './script.js',
  './icon.svg',
  './favcon.png',
  './manifest.json',
  './estatisticas.css',
  './estatisticas.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.hostname === 'script.google.com' || url.hostname === 'fonts.googleapis.com') {
    event.respondWith(
      fetch(event.request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request, { ignoreSearch: true }).then(cached => {
        if (cached) {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => { });
          return cached;
        }

        return fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith(self.location.origin)) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html', { ignoreSearch: true });
          }
          return new Response('Recurso indisponível offline.', { status: 503 });
        });
      })
    )
  );
});
