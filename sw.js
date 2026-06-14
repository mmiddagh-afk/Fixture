const CACHE_NAME = 'fixture-2026-v3';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/data.js',
  './js/utils.js',
  './js/app.js',
  './manifest.json',
  './icon.svg'
];

// Instalar y forzar activación inmediata
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Limpiar cachés viejos al activar
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia Network-First (Red primero, cae a caché en offline)
self.addEventListener('fetch', (e) => {
  // Solo interceptar peticiones GET locales o HTTP
  if (e.request.method !== 'GET' || (!e.request.url.startsWith(self.location.origin) && !e.request.url.startsWith('http'))) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Si la respuesta es válida, clonamos y actualizamos el caché
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si la red falla (offline), caemos al caché
        return caches.match(e.request);
      })
  );
});
