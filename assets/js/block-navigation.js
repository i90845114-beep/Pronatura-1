// Script para bloquear navegación con flechas del navegador en todas las páginas
(function() {
    'use strict';
    
    var bloqueado = false;
    var urlActual = window.location.href;
    var nombrePagina = window.location.pathname.split('/').pop() || 'index.html';
    
    // Función para bloquear navegación
    function bloquearNavegacion() {
        if (bloqueado) return;
        
        // Reemplazar la entrada actual del historial
        history.replaceState({page: nombrePagina}, null, urlActual);
        
        // Agregar múltiples entradas al historial para bloquear ambas direcciones
        history.pushState({page: nombrePagina}, null, urlActual);
        history.pushState({page: nombrePagina}, null, urlActual);
        history.pushState({page: nombrePagina}, null, urlActual);
    }
    
    // Bloquear inmediatamente al cargar
    bloquearNavegacion();
    bloqueado = true;
    
    // Bloquear cuando el documento esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            bloquearNavegacion();
            bloqueado = true;
        });
    } else {
        bloquearNavegacion();
        bloqueado = true;
    }
    
    // Bloquear después de delays para asegurar que se ejecute
    setTimeout(function() {
        bloquearNavegacion();
        bloqueado = true;
    }, 50);
    setTimeout(function() {
        bloquearNavegacion();
        bloqueado = true;
    }, 100);
    setTimeout(function() {
        bloquearNavegacion();
        bloqueado = true;
    }, 500);
    
    // Prevenir navegación cuando el usuario intenta usar las flechas del navegador
    window.addEventListener('popstate', function(event) {
        // Volver a agregar entradas al historial inmediatamente ANTES de cualquier otra acción
        history.pushState({page: nombrePagina}, null, urlActual);
        history.pushState({page: nombrePagina}, null, urlActual);
        history.pushState({page: nombrePagina}, null, urlActual);
        
        // Forzar que la página permanezca en la misma URL
        if (window.location.pathname.indexOf(nombrePagina) === -1) {
            window.location.replace(urlActual);
        }
        
        // Prevenir cualquier acción adicional
        event.stopImmediatePropagation();
        event.preventDefault();
        
        return false;
    }, true); // Usar capture phase para interceptar ANTES que otros listeners
    
    // Interceptar cualquier cambio en la URL como respaldo adicional
    var lastUrl = window.location.href;
    setInterval(function() {
        var currentUrl = window.location.href;
        if (currentUrl !== lastUrl && currentUrl !== urlActual && window.location.pathname.indexOf(nombrePagina) === -1) {
            window.location.replace(urlActual);
        }
        lastUrl = window.location.href;
    }, 50);
    
    // Bloquear también el evento hashchange
    window.addEventListener('hashchange', function(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.location.replace(urlActual);
        return false;
    }, true);

})();

