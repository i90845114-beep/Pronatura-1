// Script para forzar la actualización del Service Worker
// Ejecutar desde la consola del navegador (F12)

(function() {

  // Paso 1: Desregistrar todos los Service Workers
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    `);
    
    const unregisterPromises = registrations.map(function(registration) {

      return registration.unregister();
    });
    
    return Promise.all(unregisterPromises);
  })
  .then(function() {

    // Paso 2: Eliminar todos los caches
    return caches.keys();
  })
  .then(function(cacheNames) {
    `);
    
    const deletePromises = cacheNames.map(function(cacheName) {

      return caches.delete(cacheName);
    });
    
    return Promise.all(deletePromises);
  })
  .then(function() {

    setTimeout(function() {
      // Paso 3: Recargar la página
      window.location.reload(true); // true fuerza recarga desde servidor
    }, 2000);
  })
  .catch(function(error) {

    alert('Error al actualizar el Service Worker. Por favor, sigue los pasos manuales.');
  });
})();

