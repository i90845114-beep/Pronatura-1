// Script para registrar el Service Worker y manejar la instalación de PWA
(function() {
  'use strict';
  
  // Verificar soporte de Service Workers
  if ('serviceWorker' in navigator) {

    // Registrar Service Worker cuando la página cargue
    window.addEventListener('load', () => {
      // Detectar si estamos en localhost o en producción
      const swPath = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' 
                     ? '/sw.js' 
                     : '/sw.js';
      
      // Función para limpiar Service Workers y caches antiguos
      function limpiarServiceWorkerAntiguo() {
        return navigator.serviceWorker.getRegistrations().then((registrations) => {
          const unregisterPromises = registrations.map((registration) => {

            return registration.unregister();
          });
          return Promise.all(unregisterPromises);
        }).then(() => {
          // También limpiar caches antiguos
          return caches.keys();
        }).then((cacheNames) => {
          const oldCaches = cacheNames.filter(name => 
            !name.startsWith('pronatura-v1.5.0') && 
            !name.startsWith('pronatura-runtime-v1.5.0')
          );
          if (oldCaches.length > 0) {
            return Promise.all(oldCaches.map(name => caches.delete(name)));
          }
          return Promise.resolve();
        });
      }
      
      // Limpiar primero, luego registrar
      limpiarServiceWorkerAntiguo().then(() => {
        // Esperar un momento para asegurar que se limpió todo
        return new Promise(resolve => setTimeout(resolve, 500));
      }).then(() => {
        return navigator.serviceWorker.register(swPath, { updateViaCache: 'none' });
      }).then((registration) => {

        // Forzar actualización inmediata
        registration.update();
        
        // Verificar actualizaciones periódicamente
        setInterval(() => {
          registration.update();
        }, 30000); // Cada 30 segundos
        
        // Manejar actualizaciones del Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Nueva versión disponible - forzar recarga

                window.location.reload();
              } else {
                // Primera instalación

              }
            }
          });
        });
        
        return registration;
      })
        .catch((error) => {

        });
      
      // Escuchar mensajes del Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {

      });
      
      // Manejar cuando el Service Worker toma control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;

          window.location.reload();
        }
      });
    });
  } else {

  }
  
  // Manejar el evento de instalación de PWA
  let deferredPrompt;
  
  // Quitar botón "Instalar App" si existe (p. ej. por caché antigua)
  function quitarBotonInstalar() {
    const btn = document.getElementById('pwa-install-button');
    if (btn) btn.remove();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', quitarBotonInstalar);
  } else {
    quitarBotonInstalar();
  }
  let intentos = 0;
  const intervalo = setInterval(function() {
    quitarBotonInstalar();
    if (++intentos >= 5) clearInterval(intervalo);
  }, 1000);

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    quitarBotonInstalar();
  });

  function installPWA() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      deferredPrompt = null;
      quitarBotonInstalar();
    });
  }

  window.installPWA = installPWA;

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    quitarBotonInstalar();
  });
  
  // Verificar si ya está en modo standalone (instalada)
  if (window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true) {
    // App instalada en dispositivo
  }
})();

