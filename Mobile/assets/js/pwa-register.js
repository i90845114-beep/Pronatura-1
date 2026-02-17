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
      
      navigator.serviceWorker.register(swPath)
        .then((registration) => {

          // Verificar actualizaciones periódicamente
          setInterval(() => {
            registration.update();
          }, 60000); // Cada minuto
          
          // Manejar actualizaciones del Service Worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nueva versión disponible

                // Opcional: mostrar notificación al usuario
                if (confirm('Hay una nueva versión disponible. ¿Deseas recargar la página?')) {
                  window.location.reload();
                }
              }
            });
          });
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
    
  }
})();

