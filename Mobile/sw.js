// Service Worker para ProNatura PWA
// Versión del cache - incrementar para forzar actualización
const CACHE_NAME = 'pronatura-v1.0.0';
const RUNTIME_CACHE = 'pronatura-runtime-v1';

// Archivos estáticos para cachear en la instalación
const urlsToCache = [
  '/',
  '/pages/inicio.html',
  '/pages/login.html',
  '/pages/registro.html',
  '/pages/index.html',
  '/pages/nuevo-registro.html',
  '/pages/mapa-consolidado.html',
  '/pages/bloc-notas.html',
  '/assets/css/styles.css',
  '/assets/css/admin.css',
  '/assets/js/auth.js',
  '/assets/js/script.js',
  '/assets/js/form-script.js',
  '/assets/js/admin.js',
  '/assets/js/admin-auth.js'
];

// Evento de instalación
self.addEventListener('install', (event) => {

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {

        // Cachear archivos críticos, pero no fallar si algunos fallan
        return cache.addAll(urlsToCache).catch((error) => {

          // Continuar aunque algunos archivos fallen
          return Promise.resolve();
        });
      })
      .then(() => {

        // Forzar activación inmediata
        return self.skipWaiting();
      })
  );
});

// Evento de activación
self.addEventListener('activate', (event) => {

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar caches antiguos
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {

            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {

      // Tomar control de todas las páginas inmediatamente
      return self.clients.claim();
    })
  );
});

// Estrategia de cache: Network First para API, Cache First para assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // No cachear llamadas a la API - siempre usar red
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Si la respuesta es exitosa, clonarla para cache runtime
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Si falla la red, intentar cache runtime como último recurso
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {

              return cachedResponse;
            }
            // Si no hay cache, devolver error
            return new Response(
              JSON.stringify({ 
                success: false, 
                message: 'Sin conexión a internet. Por favor, verifica tu conexión.' 
              }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 503
              }
            );
          });
        })
    );
    return;
  }
  
  // Para recursos estáticos (HTML, CSS, JS): Cache First
  if (url.pathname.match(/\.(html|css|js|png|jpg|jpeg|svg|ico|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {

            return cachedResponse;
          }
          
          // Si no está en cache, buscar en red
          return fetch(event.request)
            .then((response) => {
              // Validar respuesta
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }
              
              // Clonar respuesta para cachear
              const responseToCache = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
              return response;
            })
            .catch(() => {
              // Si falla la red y no hay cache, devolver página offline básica
              if (event.request.destination === 'document') {
                return caches.match('/pages/inicio.html');
              }
              return new Response('Recurso no disponible offline', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
    return;
  }
  
  // Para otros recursos: Network First
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cachear respuestas exitosas
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla, intentar cache
        return caches.match(event.request);
      })
  );
});

// Manejo de mensajes desde la app
self.addEventListener('message', (event) => {

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Manejo de notificaciones push (para implementación futura)
self.addEventListener('push', (event) => {

  // Implementar lógica de notificaciones push aquí
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', (event) => {

  event.notification.close();
  // Abrir la app cuando se hace clic en la notificación
  event.waitUntil(
    clients.openWindow('/pages/inicio.html')
  );
});

