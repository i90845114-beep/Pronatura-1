// Script para registrar el Service Worker y manejar la instalación de PWA
(function() {
  'use strict';
  
  // Verificar soporte de Service Workers
  if ('serviceWorker' in navigator) {
    console.log('[PWA] Service Worker soportado');
    
    // Registrar Service Worker cuando la página cargue
    window.addEventListener('load', () => {
      // Detectar si estamos en localhost o en producción
      const swPath = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' 
                     ? '/sw.js' 
                     : '/sw.js';
      
      navigator.serviceWorker.register(swPath)
        .then((registration) => {
          console.log('[PWA] Service Worker registrado exitosamente:', registration.scope);
          
          // Verificar actualizaciones periódicamente
          setInterval(() => {
            registration.update();
          }, 60000); // Cada minuto
          
          // Manejar actualizaciones del Service Worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('[PWA] Nueva versión del Service Worker encontrada');
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nueva versión disponible
                console.log('[PWA] Nueva versión disponible. Recarga la página para actualizar.');
                // Opcional: mostrar notificación al usuario
                if (confirm('Hay una nueva versión disponible. ¿Deseas recargar la página?')) {
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch((error) => {
          console.error('[PWA] Error al registrar Service Worker:', error);
        });
      
      // Escuchar mensajes del Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[PWA] Mensaje del Service Worker:', event.data);
      });
      
      // Manejar cuando el Service Worker toma control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('[PWA] Service Worker tomó control. Recargando...');
          window.location.reload();
        }
      });
    });
  } else {
    console.warn('[PWA] Service Worker no soportado en este navegador');
  }
  
  // Manejar el evento de instalación de PWA
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] Evento beforeinstallprompt disparado');
    // Prevenir el prompt automático
    e.preventDefault();
    // Guardar el evento para mostrarlo más tarde
    deferredPrompt = e;
    
    // Mostrar botón de instalación personalizado (opcional)
    showInstallButton();
  });
  
  // Función para mostrar botón de instalación
  function showInstallButton() {
    // Buscar si ya existe un botón de instalación
    let installButton = document.getElementById('pwa-install-button');
    
    if (!installButton) {
      // Crear botón de instalación
      installButton = document.createElement('button');
      installButton.id = 'pwa-install-button';
      installButton.innerHTML = '📱 Instalar App';
      installButton.className = 'pwa-install-btn';
      installButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #4D8143;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        display: none;
      `;
      
      installButton.addEventListener('click', () => {
        installPWA();
      });
      
      document.body.appendChild(installButton);
    }
    
    // Mostrar el botón
    installButton.style.display = 'block';
  }
  
  // Función para instalar la PWA
  function installPWA() {
    if (!deferredPrompt) {
      console.log('[PWA] No hay prompt de instalación disponible');
      return;
    }
    
    // Mostrar el prompt de instalación
    deferredPrompt.prompt();
    
    // Esperar respuesta del usuario
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] Usuario aceptó la instalación');
      } else {
        console.log('[PWA] Usuario rechazó la instalación');
      }
      
      // Limpiar el prompt
      deferredPrompt = null;
      
      // Ocultar el botón
      const installButton = document.getElementById('pwa-install-button');
      if (installButton) {
        installButton.style.display = 'none';
      }
    });
  }
  
  // Exponer función globalmente para poder llamarla desde otros lugares
  window.installPWA = installPWA;
  
  // Detectar si la app ya está instalada
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App instalada exitosamente');
    deferredPrompt = null;
    
    // Ocultar botón de instalación
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
    
    // Opcional: mostrar mensaje de éxito
    // alert('¡App instalada exitosamente!');
  });
  
  // Verificar si ya está en modo standalone (instalada)
  if (window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true) {
    console.log('[PWA] App ejecutándose en modo standalone (instalada)');
  }
})();

