// Service Worker para ProNatura PWA
// Versión del cache - incrementar para forzar actualización
// ÚLTIMA ACTUALIZACIÓN: v1.5.0 - Error sintaxis línea 225 corregido
const CACHE_NAME = 'pronatura-v1.5.0';
const RUNTIME_CACHE = 'pronatura-runtime-v1.5.0';

// Archivos estáticos para cachear en la instalación
// Usar rutas absolutas desde la raíz del dominio
const urlsToCache = [
  '/',
  '/pages/inicio.html',
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
  '/assets/js/admin-auth.js',
  '/assets/js/pwa-register.js',
  '/manifest.json'
];

// Evento de instalación
self.addEventListener('install', (event) => {

  // Forzar activación inmediata sin esperar a que se cierren otras pestañas
  self.skipWaiting();
  
  event.waitUntil(
    // Primero eliminar todos los caches antiguos
    caches.keys().then((cacheNames) => {
      const oldCaches = cacheNames.filter(name => 
        !name.startsWith('pronatura-v1.5.0') && 
        !name.startsWith('pronatura-runtime-v1.5.0')
      );
      return Promise.all(oldCaches.map(name => {

        return caches.delete(name);
      }));
    }).then(() => {
      // Ahora crear el nuevo cache
      return caches.open(CACHE_NAME);
    }).then((cache) => {

      // Cachear archivos individualmente para que no falle todo si uno falla
      const cachePromises = urlsToCache.map(url => {
        return fetch(url)
          .then(response => {
            // Solo cachear si la respuesta es exitosa (200-299)
            if (response.ok) {
              return cache.put(url, response);
            } else {

              return Promise.resolve();
            }
          })
          .catch(error => {

            return Promise.resolve(); // Continuar aunque falle
          });
      });
      
      return Promise.all(cachePromises);
    }).then(() => {

      // Forzar activación inmediata
      return self.skipWaiting();
    })
  );
});

// Evento de activación
self.addEventListener('activate', (event) => {

  // Tomar control inmediatamente de todas las pestañas
  self.clients.claim();
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar TODOS los caches antiguos (no solo los que no coinciden)
          if (!cacheName.startsWith('pronatura-v1.5.0') && !cacheName.startsWith('pronatura-runtime-v1.5.0')) {

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
  // PROTECCIÓN CRÍTICA: NUNCA cachear peticiones que no sean GET
  // Esto debe ser lo primero que se verifique
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  const url = new URL(event.request.url);
  
  // No cachear llamadas a la API - siempre usar red
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Solo cachear respuestas GET exitosas (doble verificación por seguridad)
          if (response && response.status === 200 && event.request.method === 'GET') {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              // Verificación final antes de cachear
              if (event.request.method === 'GET') {
                cache.put(event.request, responseToCache);
              }
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
  
  // Para archivos HTML: Network First (siempre obtener la versión más reciente)
  if (url.pathname.match(/\.html$/)) {
    // Para grupos.html y otros archivos críticos, siempre obtener de la red sin cachear
    if (url.pathname.includes('grupos.html') || url.pathname.includes('chat.html')) {
      event.respondWith(
        fetch(event.request, { cache: 'no-store' })
          .then((response) => {
            // No cachear, siempre usar la versión más reciente
            return response;
          })
          .catch(() => {
            // Solo si falla completamente la red, intentar cache como último recurso
            return caches.match(event.request);
          })
      );
      return;
    }
    
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Si la respuesta es 404, intentar alternativas desde cache
          if (response.status === 404) {

            // Intentar cargar desde cache primero
            return caches.match(event.request).then((cachedResponse) => {
              if (cachedResponse) {

                return cachedResponse;
              }
              // Si es inicio.html, intentar alternativas
              if (url.pathname.includes('inicio.html')) {
                return caches.match('/pages/index.html').then((indexResponse) => {
                  if (indexResponse) {

                    return indexResponse;
                  }
                  return caches.match('/index.html').then((rootIndexResponse) => {
                    if (rootIndexResponse) {

                      return rootIndexResponse;
                    }
                    return caches.match('/').then((rootResponse) => {
                      if (rootResponse) {

                        return rootResponse;
                      }
                      // Si nada funciona, devolver la respuesta 404 original
                      return response;
                    });
                  });
                });
              }
              // Para otros HTML con 404, devolver la respuesta original
              return response;
            });
          }
          
          // Solo cachear respuestas exitosas (200)
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          }
          
          // Si la respuesta no es 200, intentar cache como fallback
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return response; // Devolver la respuesta original (incluso si es 404)
          });
        })
        .catch(() => {
          // Si falla la red, intentar cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {

              return cachedResponse;
            }
            // Si no hay cache y es una página HTML, intentar inicio.html o index.html
            if (event.request.destination === 'document') {
              return caches.match('/pages/inicio.html').then((fallback) => {
                if (fallback) return fallback;
                return caches.match('/index.html').then((indexFallback) => {
                  if (indexFallback) return indexFallback;
                  return caches.match('/');
                });
              });
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
  
  // Para otros recursos estáticos (CSS, JS, imágenes): Cache First
  if (url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {

            return cachedResponse;
          }
          
          // Si no está en cache, buscar en red
          return fetch(event.request)
            .then((response) => {
              // Validar respuesta - solo cachear respuestas exitosas
              if (response && response.status === 200 && response.type !== 'error') {
                const responseToCache = response.clone();
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              }
              return response;
            })
            .catch(() => {
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
  // IMPORTANTE: Solo cachear peticiones GET
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cachear respuestas exitosas GET (doble verificación por seguridad)
        if (response && response.status === 200 && event.request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            // Verificación final antes de cachear
            if (event.request.method === 'GET') {
              cache.put(event.request, responseToCache);
            }
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

