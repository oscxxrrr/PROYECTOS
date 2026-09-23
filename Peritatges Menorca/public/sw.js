const CACHE_NAME = 'peritatges-menorca-v3';

// Recursos esenciales para carcasa offline (rutas relativas para compatibilidad total)
const SHELL_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        SHELL_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.log('SW precache item skipped:', url, err);
            return true;
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // No interceptar peticiones no GET ni APIs ni APKs
  if (request.method !== 'GET' || request.url.includes('/api/') || request.url.endsWith('.apk')) {
    return;
  }

  // Navegación (HTML): Red primero con timeout, fallback a index.html en caché
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Solo cachear si es respuesta válida y no es la pantalla de desafío anti-bot
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match('./index.html').then((cached) => cached || caches.match('/index.html'));
        })
    );
    return;
  }

  // Recursos estáticos (JS, CSS, imágenes): Caché primero, red en segundo plano
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
