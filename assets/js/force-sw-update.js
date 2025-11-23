// Script para forzar la actualización del Service Worker
// Ejecutar desde la consola del navegador (F12)

(function() {
  console.log('🔄 Iniciando actualización forzada del Service Worker...');
  
  // Paso 1: Desregistrar todos los Service Workers
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    console.log(`📋 Encontrados ${registrations.length} Service Worker(s)`);
    
    const unregisterPromises = registrations.map(function(registration) {
      console.log('❌ Desregistrando Service Worker:', registration.scope);
      return registration.unregister();
    });
    
    return Promise.all(unregisterPromises);
  })
  .then(function() {
    console.log('✅ Todos los Service Workers desregistrados');
    
    // Paso 2: Eliminar todos los caches
    return caches.keys();
  })
  .then(function(cacheNames) {
    console.log(`📦 Encontrados ${cacheNames.length} cache(s)`);
    
    const deletePromises = cacheNames.map(function(cacheName) {
      console.log('🗑️ Eliminando cache:', cacheName);
      return caches.delete(cacheName);
    });
    
    return Promise.all(deletePromises);
  })
  .then(function() {
    console.log('✅ Todos los caches eliminados');
    console.log('🔄 Recargando la página en 2 segundos...');
    
    setTimeout(function() {
      // Paso 3: Recargar la página
      window.location.reload(true); // true fuerza recarga desde servidor
    }, 2000);
  })
  .catch(function(error) {
    console.error('❌ Error durante la actualización:', error);
    alert('Error al actualizar el Service Worker. Por favor, sigue los pasos manuales.');
  });
})();

