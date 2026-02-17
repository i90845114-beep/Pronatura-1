// BLOQUEO ABSOLUTO PARA chat.html - DEBE SER LO PRIMERO - ANTES DE TODO
(function() {
    'use strict';
    const currentPage = window.location.pathname.split('/').pop() || '';
    const fullPath = window.location.pathname || '';
    const href = window.location.href || '';
    
    if (currentPage === 'chat.html' || 
        fullPath.includes('chat.html') || 
        href.includes('chat.html')) {

        // Crear authSystem vacío
        window.authSystem = {
            isAuthenticated: () => false,
            getCurrentUser: () => null,
            getSession: () => null,
            login: () => {},
            logout: () => {},
            verifyBanAndBlock: () => Promise.resolve(false)
        };
        // NO ejecutar NADA más - terminar completamente
        throw new Error('auth.js bloqueado para chat.html');
    }
})();

// Sistema de autenticación
// Almacenamiento en localStorage (fácil migración a base de datos después)

const AUTH_STORAGE_KEY = 'auth_users';
const SESSION_KEY = 'current_session';

// Función helper para obtener la ruta correcta de la API según el entorno
function getApiUrl(action) {
    const currentUrl = window.location.href.toLowerCase();
    const isHostinger = currentUrl.indexOf('hostinger') !== -1 || 
                       currentUrl.indexOf('hostingersite.com') !== -1 ||
                       currentUrl.indexOf('organicjournal.com.mx') !== -1;
    
    if (isHostinger) {
        // En Hostinger, usar ruta absoluta desde la raíz
        return `/api/api.php?action=${action}`;
    } else {
        // En local, determinar según la ubicación actual
        const currentPath = window.location.pathname;
        const isInPages = currentPath.indexOf('/pages/') !== -1;
        
        if (isInPages) {
            return `../api/api.php?action=${action}`;
        } else {
            return `api/api.php?action=${action}`;
        }
    }
}

// Inicializar sistema de autenticación
const authSystem = {
    // Obtener todos los usuarios
    getUsers() {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    },
    
    // Guardar usuarios
    saveUsers(users) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
    },
    
    // Registrar nuevo usuario
    async register(nombre, apodo, email, password) {
        try {
            const response = await fetch(getApiUrl('register'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nombre: nombre,
                    apodo: apodo,
                    email: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Iniciar sesión automáticamente después del registro
                this.setSession(data.user);
                // Iniciar verificación periódica de ban después de registrar
                if (typeof iniciarVerificacionPeriodicaBan === 'function') {
                    iniciarVerificacionPeriodicaBan();
                }
                return { success: true, contenido_ofensivo: data.contenido_ofensivo, message: data.message };
            } else {

                return { 
                    success: false, 
                    message: data.message || 'Error desconocido al registrar',
                    contenido_ofensivo: data.contenido_ofensivo,
                    campos_afectados: data.campos_afectados
                };
            }
        } catch (error) {

            return { success: false, message: 'Error de conexión. Verifica que el servidor esté corriendo.' };
        }
    },
    
    // Iniciar sesión
    async login(email, password) {
        try {
            const response = await fetch(getApiUrl('login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.setSession(data.user);
                // Iniciar verificación periódica de ban después de iniciar sesión
                if (typeof iniciarVerificacionPeriodicaBan === 'function') {
                    iniciarVerificacionPeriodicaBan();
                }
                return { success: true };
            } else {

                // Pasar información del ban si existe
                return { 
                    success: false, 
                    message: data.message || 'Error desconocido al iniciar sesión',
                    ban_id: data.ban_id || null,
                    usuario_id: data.usuario_id || null,
                    puede_apelar: data.puede_apelar === true,
                    ban_motivo: data.ban_motivo || null,
                    ban_tipo: data.ban_tipo || null
                };
            }
        } catch (error) {

            return { success: false, message: 'Error de conexión. Verifica que el servidor esté corriendo.' };
        }
    },
    
    // Cerrar sesión
    logout() {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem('index_acceso_permitido'); // Limpiar flag de acceso permitido
        // Detener verificación periódica de ban al cerrar sesión
        if (typeof detenerVerificacionPeriodicaBan === 'function') {
            detenerVerificacionPeriodicaBan();
        }
    },
    
    // Verificar si hay sesión activa
    isAuthenticated() {
        const session = this.getSession();
        return session !== null;
    },
    
    // Verificar si el usuario tiene ban activo
    async checkBanStatus() {
        const session = this.getSession();
        if (!session || !session.id) {
            return { banned: false };
        }
        
        try {
            const response = await fetch(getApiUrl('check_ban_status'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    usuario_id: session.id,
                    email: session.email
                })
            });
            
            if (!response.ok) {
                return { banned: false };
            }
            
            const data = await response.json();
            
            // Verificar que la respuesta tenga la estructura correcta
            if (data.success === true && data.banned === true) {

                return {
                    banned: true,
                    ban: data.ban,
                    message: data.message
                };
            }
            
            return { banned: false };
        } catch (error) {

            return { banned: false }; // En caso de error, permitir acceso (fallback)
        }
    },
    
    // Obtener usuario actual (con verificación de ban)
    getCurrentUser() {
        const session = this.getSession();
        if (!session) {
            return null;
        }
        
        // Verificar que el usuario tenga nombre
        const nombre = session.nombre || '';
        if (!nombre || nombre.trim() === '') {

            this.logout();
            // Redirigir a inicio con mensaje
            if (window.location.pathname.includes('pages')) {
                window.location.href = 'inicio.html';
            } else {
                window.location.href = 'pages/inicio.html';
            }
            return null;
        }
        
        // IMPORTANTE: Verificar ban inmediatamente cuando se obtiene el usuario
        // Esto asegura que se verifique en cada acceso
        // NO usar catch aquí - si hay ban, debe bloquear inmediatamente
        this.verifyBanAndBlock().then(blocked => {
            if (blocked) {

                // La redirección ya se hizo en verifyBanAndBlock
            }
        }).catch(err => {

        });
        
        return session;
    },
    
    // Verificar ban y bloquear acceso si está baneado (versión síncrona para uso inmediato)
    async verifyBanAndBlock() {
        const session = this.getSession();
        if (!session || !session.id) {

            return false; // No hay sesión, no hay ban
        }
        
        try {
            const banResult = await this.checkBanStatus();
            
            if (banResult.banned === true) {

                // Guardar información del ban para la página de apelación
                if (banResult.ban) {
                    sessionStorage.setItem('ban_id_apelar', banResult.ban.id);
                    sessionStorage.setItem('usuario_id_apelar', session.id); // Guardar usuario_id directamente
                    sessionStorage.setItem('email_apelar', session.email);
                    sessionStorage.setItem('ban_motivo', banResult.ban.motivo);
                    sessionStorage.setItem('ban_tipo', banResult.ban.tipo);
                }
                
                // NO hacer logout todavía - mantener sesión para la apelación
                // Redirigir directamente a la página de apelación
                const currentPath = window.location.pathname;
                const currentUrl = window.location.href.toLowerCase();
                const isHostinger = currentUrl.indexOf('hostinger') !== -1 || 
                                   currentUrl.indexOf('hostingersite.com') !== -1 ||
                                   currentUrl.indexOf('organicjournal.com.mx') !== -1;
                
                // Determinar ruta correcta según ubicación
                let apelarPath;
                if (isHostinger) {
                    // En Hostinger, SIEMPRE usar ruta absoluta desde la raíz
                    apelarPath = '/pages/apelar-ban.html';
                } else {
                    // En local o app móvil, analizar la ruta actual
                    const pathParts = currentPath.split('/').filter(p => p);
                    const lastPart = pathParts[pathParts.length - 1];
                    const isInPagesFolder = pathParts.includes('pages') && lastPart !== 'pages';
                    
                    if (isInPagesFolder) {
                        // Si ya estamos dentro de /pages/ (ej: /pages/index.html), usar ruta relativa simple
                        apelarPath = 'apelar-ban.html';
                    } else {
                        // Si estamos en raíz o fuera de pages/, ir a pages/apelar-ban.html
                        apelarPath = 'pages/apelar-ban.html';
                    }
                }

                // Detener cualquier verificación periódica antes de redirigir
                if (typeof detenerVerificacionPeriodicaBan === 'function') {
                    detenerVerificacionPeriodicaBan();
                }
                
                // Redirigir inmediatamente - usar replace para evitar que el usuario pueda volver atrás
                window.location.replace(apelarPath);
                
                // Si por alguna razón replace no funciona, usar href como fallback
                setTimeout(() => {
                    if (window.location.pathname.toLowerCase().indexOf('apelar-ban') === -1) {

                        window.location.href = apelarPath;
                    }
                }, 500);
                
                return true; // Usuario baneado, acceso bloqueado
            }
            return false; // No está baneado
        } catch (error) {

            return false; // En caso de error, permitir acceso (fallback)
        }
    },
    
    // Verificar si el usuario tiene nombre (validación adicional)
    async verifyUserHasName() {
        const session = this.getSession();
        if (!session) {
            return { valid: false, message: 'No hay sesión activa' };
        }
        
        try {
            // Verificar con el servidor si el usuario tiene nombre_real
            const response = await fetch(getApiUrl('get_user_info') + '&user_id=' + session.id);
            const data = await response.json();
            
            if (data.success && data.user) {
                const nombreReal = data.user.nombre_real || data.user.nombre || '';
                if (!nombreReal || nombreReal.trim() === '') {
                    this.logout();
                    return {
                        valid: false,
                        message: 'Debes completar tu perfil con tu nombre real para acceder al sistema. Por favor, contacta al administrador.',
                        requiere_nombre: true
                    };
                }
                return { valid: true };
            }
        } catch (error) {

            // En caso de error, permitir acceso pero mostrar advertencia
            return { valid: true, warning: 'No se pudo verificar el nombre del usuario' };
        }
        
        return { valid: true };
    },
    
    // Establecer sesión
    setSession(user) {
        try {
            // Verificar que el usuario tenga nombre antes de guardar la sesión
            const nombre = user.nombre || '';
            if (!nombre || nombre.trim() === '') {

                throw new Error('El usuario debe tener un nombre para acceder al sistema');
            }
            
            // No guardar la contraseña en la sesión
            const sessionData = {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                fechaRegistro: user.fechaRegistro,
                rol: user.rol || 'usuario' // Incluir el rol del usuario
            };

            // Usar sessionStorage en lugar de localStorage para que se cierre automáticamente al cerrar la pestaña
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
            
            // Verificar que se guardó correctamente
            const verify = sessionStorage.getItem(SESSION_KEY);
            if (!verify) {

            }
        } catch (error) {

            throw error;
        }
    },
    
    // Obtener sesión
    getSession() {
        try {
            const stored = sessionStorage.getItem(SESSION_KEY);
            if (!stored) {
                return null;
            }
            const parsed = JSON.parse(stored);
            return parsed;
        } catch (error) {

            // Limpiar sesión corrupta
            sessionStorage.removeItem(SESSION_KEY);
            return null;
        }
    },
    
    // Hash simple de contraseña (en producción usar bcrypt o similar)
    hashPassword(password) {
        // Hash simple para desarrollo
        // En producción, esto debe hacerse en el servidor con bcrypt
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a 32bit integer
        }
        return hash.toString();
    },
    
    // Requerir autenticación (NO redirigir - solo retornar estado)
    requireAuth() {
        // NO redirigir a login - solo retornar si está autenticado
        return this.isAuthenticated();
    },
    
    // Verificar si un email existe en la base de datos
    async checkEmail(email) {
        try {
            // Detectar si estamos en Hostinger
            const currentUrl = window.location.href.toLowerCase();
            const isHostinger = currentUrl.indexOf('hostinger') !== -1 || 
                               currentUrl.indexOf('hostingersite.com') !== -1 ||
                               currentUrl.indexOf('organicjournal.com.mx') !== -1;
            
            // Determinar la ruta de la API según el entorno
            const currentPath = window.location.pathname;
            const isInPages = currentPath.indexOf('/pages/') !== -1;
            
            const apiUrl = getApiUrl('check_email');
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                return { success: true, exists: data.exists };
            } else {
                return { success: false, message: data.message || 'Error al verificar email' };
            }
        } catch (error) {

            return { success: false, message: 'Error de conexión. Verifica que el servidor esté corriendo.' };
        }
    }
};

// Exportar para uso global
window.authSystem = authSystem;

// Variable global para el intervalo de verificación periódica de ban
let banCheckInterval = null;

// Función para iniciar verificación periódica de ban
function iniciarVerificacionPeriodicaBan() {
    // Limpiar intervalo anterior si existe
    if (banCheckInterval) {
        clearInterval(banCheckInterval);
    }
    
    // Verificar ban cada 5 segundos mientras el usuario navega (MUY FRECUENTE para detectar bans inmediatamente)
    banCheckInterval = setInterval(async () => {
        const session = authSystem.getSession();
        if (session && session.id) {
            // Verificar si el usuario está en la página de apelación (no verificar ahí)
            const currentPath = window.location.pathname.toLowerCase();
            const isApelacionPage = currentPath.includes('apelar-ban') || currentPath.includes('apelar_ban');
            
            if (!isApelacionPage) {
                try {
                    const blocked = await authSystem.verifyBanAndBlock();
                    if (blocked) {
                        // Usuario baneado, detener verificación periódica (ya se redirigió)

                        detenerVerificacionPeriodicaBan();
                        
                        // FORZAR redirección inmediata - múltiples intentos
                        const isHostinger = window.location.href.toLowerCase().indexOf('hostinger') !== -1 || 
                                           window.location.href.toLowerCase().indexOf('hostingersite.com') !== -1 ||
                                           window.location.href.toLowerCase().indexOf('organicjournal.com.mx') !== -1;
                        const apelarPath = isHostinger ? '/pages/apelar-ban.html' : 'apelar-ban.html';
                        
                        // Intentar redirección inmediata múltiples veces
                        window.location.replace(apelarPath);
                        setTimeout(() => {
                            const currentPathCheck = window.location.pathname.toLowerCase();
                            if (!currentPathCheck.includes('apelar-ban') && !currentPathCheck.includes('apelar_ban')) {

                                window.location.href = apelarPath;
                            }
                        }, 100);
                        setTimeout(() => {
                            const currentPathCheck = window.location.pathname.toLowerCase();
                            if (!currentPathCheck.includes('apelar-ban') && !currentPathCheck.includes('apelar_ban')) {

                                window.location = apelarPath;
                            }
                        }, 500);
                    }
                } catch (error) {

                }
            }
        } else {
            // No hay sesión, detener verificación
            detenerVerificacionPeriodicaBan();
        }
    }, 5000); // Verificar cada 5 segundos (MUY FRECUENTE)
    
}

// Función para detener verificación periódica de ban
function detenerVerificacionPeriodicaBan() {
    if (banCheckInterval) {
        clearInterval(banCheckInterval);
        banCheckInterval = null;
    }
}

// Verificar ban INMEDIATAMENTE al cargar el script (antes de cualquier otra cosa)
// ESTA ES LA VERIFICACIÓN MÁS CRÍTICA - DEBE SER BLOQUEANTE
(async function() {
    try {
        const session = authSystem.getSession();
        if (session && session.id) {
            
            // Verificar ban de forma inmediata y bloqueante - NO usar then, usar await
            const blocked = await authSystem.verifyBanAndBlock();
            if (blocked) {
                // Usuario baneado, acceso bloqueado - ya se redirigió

                // NO iniciar verificación periódica si está baneado
                return;
            } else {
                // Usuario no baneado, iniciar verificación periódica
                iniciarVerificacionPeriodicaBan();
            }
        }
    } catch (error) {

    }
})();

// Verificar ban también cuando el usuario navega entre páginas (evento beforeunload y pageshow)
window.addEventListener('pageshow', (event) => {
    // Verificar ban cuando se muestra una página (incluye navegación hacia atrás)
    const session = authSystem.getSession();
    if (session && session.id) {
        authSystem.verifyBanAndBlock().then(blocked => {
            if (blocked) {

            }
        }).catch(error => {

        });
    }
});

// Verificar ban también cuando la página se enfoca (usuario vuelve a la pestaña)
window.addEventListener('focus', () => {
    const session = authSystem.getSession();
    if (session && session.id) {
        authSystem.verifyBanAndBlock().then(blocked => {
            if (blocked) {

            }
        }).catch(error => {

        });
    }
});

// BLOQUEO TOTAL PARA chat.html - DEBE SER LO PRIMERO EN EL ARCHIVO
(function() {
    'use strict';
    const currentPage = window.location.pathname.split('/').pop() || '';
    const fullPath = window.location.pathname || '';
    const href = window.location.href || '';
    
    // BLOQUEAR chat.html COMPLETAMENTE - SALIR INMEDIATAMENTE
    if (currentPage === 'chat.html' || 
        fullPath.includes('chat.html') || 
        href.includes('chat.html')) {

        // NO ejecutar NADA - terminar la ejecución del script
        throw new Error('auth.js bloqueado para chat.html');
    }
})();

// BLOQUEAR COMPLETAMENTE PARA chat.html ANTES DE DOMContentLoaded
(function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const fullPath = window.location.pathname || '';
    
    if (currentPage === 'chat.html' || fullPath.includes('chat.html')) {

        // NO ejecutar NADA - retornar función vacía
        return;
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    // Ejecutar inmediatamente sin delay para evitar problemas de timing
    (() => {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const fullPath = window.location.pathname || '';
        const session = authSystem.getSession();
        
        // PRIORIDAD MÁXIMA: Si estamos en chat.html, salir inmediatamente sin verificar nada
        if (currentPage === 'chat.html' || fullPath.includes('chat.html')) {
            return; // Salir inmediatamente sin hacer ninguna verificación
        }
        
        // Lista de páginas que requieren autenticación (NO incluir index.html si es la landing page)
        const protectedPages = ['nuevo-registro.html', 'mapa-consolidado.html', 'bloc-notas.html'];
        
        // IMPORTANTE: Si viene del panel de administración, NO verificar autenticación de usuario normal
        if (currentPage === 'nuevo-registro.html') {
            const urlParams = new URLSearchParams(window.location.search);
            const isEditMode = urlParams.get('edit') === 'true';
            const editingFromAdmin = sessionStorage.getItem('editingFromAdmin') === 'true' || window._editingFromAdmin === true;
            
            if (isEditMode || editingFromAdmin || window._skipAuthCheck === true) {
                return; // Salir inmediatamente sin verificar autenticación de usuario
            }
        }
        
        // IMPORTANTE: Páginas públicas que NO requieren autenticación
        const publicPages = ['registro.html', 'inicio.html', 'chat.html', 'grupos.html'];
        
        // Páginas de administración que usan su propio sistema de autenticación (adminAuthSystem)
        const adminPages = ['admin.html', 'admin-login.html'];
        
        // Si estamos en una página de admin, NO verificar autenticación de usuario normal
        if (adminPages.includes(currentPage)) {
            return; // Salir inmediatamente, el admin usa adminAuthSystem
        }
        
        // Si estamos en inicio.html, limpiar la sesión y salir
        if (currentPage === 'inicio.html') {
            try {
                sessionStorage.removeItem('current_session');
                localStorage.removeItem('current_session');
            } catch (error) {

            }
            return; // Salir sin verificar autenticación
        }
        
        // Si estamos en registro.html, chat.html o grupos.html, salir sin verificar
        if (publicPages.includes(currentPage)) {
            return; // Salir inmediatamente sin hacer ninguna verificación de autenticación
        }
        
        // BLOQUEO TOTAL: NO redirigir a login NUNCA
        // Si no está autenticado, simplemente permitir acceso sin redirigir
        const isAuth = authSystem.isAuthenticated();
        if (!isAuth && protectedPages.includes(currentPage)) {
            // NO redirigir - solo permitir acceso
            return;
        }
        
        // index.html - LÓGICA ULTRA SIMPLIFICADA
        // REGLA DE ORO: Si hay sesión = PERMITIR SIEMPRE. Si NO hay sesión Y viene directamente = REDIRIGIR
        if (currentPage === 'index.html') {
            // FLAG PERMANENTE: Si ya se marcó como navegación interna, PERMITIR SIEMPRE
            // Esto evita redirecciones después de que la página carga
            // VERIFICAR ESTO PRIMERO - es la verificación más rápida y confiable
            const accesoPermitido = sessionStorage.getItem('index_acceso_permitido') === 'true';
            if (accesoPermitido) {
                // AUN CON ACCESO PERMITIDO, VERIFICAR BAN PRIMERO
                if (session && session.id) {
                    authSystem.verifyBanAndBlock().then(blocked => {
                        if (blocked) {
                            sessionStorage.removeItem('index_acceso_permitido'); // Limpiar flag si está baneado
                            return; // Usuario baneado, ya se redirigió
                        } else {
                            // Usuario no baneado, iniciar verificación periódica
                            if (typeof iniciarVerificacionPeriodicaBan === 'function') {
                                iniciarVerificacionPeriodicaBan();
                            }
                        }
                    });
                }
                return; // PERMITIR ACCESO - flag permanente activo - SALIR INMEDIATAMENTE
            }

            // VERIFICAR FLAGS Y REFERRER PRIMERO (antes de verificar sesión)
            // Esto es crítico porque si hay navegación interna, NO debemos redirigir aunque no detectemos sesión inmediatamente
            const vieneDeLogin = sessionStorage.getItem('vieneDeLogin') === 'true';
            const vieneDeCancelacion = sessionStorage.getItem('vieneDeCancelacion') === 'true';
            const navegandoInternamente = sessionStorage.getItem('navegando_internamente') === 'true';
            const referrer = document.referrer || '';
            
            // PRIORIDAD MÁXIMA: Si el flag de navegación interna está activo (establecido antes de navegar)
            if (navegandoInternamente) {
                sessionStorage.removeItem('navegando_internamente'); // Limpiar flag
                sessionStorage.setItem('index_acceso_permitido', 'true');
                return;
            }
            
            // Verificar ban ANTES de permitir acceso desde login
            if (vieneDeLogin && session && session.id) {
                // Verificar ban inmediatamente
                authSystem.verifyBanAndBlock().then(blocked => {
                    if (blocked) {
                        return; // Usuario baneado, ya se redirigió
                    } else {
                        // Usuario no baneado, iniciar verificación periódica
                        if (typeof iniciarVerificacionPeriodicaBan === 'function') {
                            iniciarVerificacionPeriodicaBan();
                        }
                    }
                });
            }
            
            // Si viene de login, VERIFICAR BAN PRIMERO antes de permitir acceso
            if (vieneDeLogin) {
                if (session && session.id) {
                    // Verificar ban ANTES de permitir acceso
                    authSystem.verifyBanAndBlock().then(isBlocked => {
                        if (isBlocked) {
                            sessionStorage.removeItem('vieneDeLogin');
                            return; // Usuario baneado, acceso bloqueado
                        } else {
                            // Usuario no baneado, iniciar verificación periódica
                            if (typeof iniciarVerificacionPeriodicaBan === 'function') {
                                iniciarVerificacionPeriodicaBan();
                            }
                        }
                    });
                }
                sessionStorage.setItem('index_acceso_permitido', 'true');
                return;
            }
            
            // PRIORIDAD MÁXIMA: Si viene de cancelación (nuevo-registro), permitir acceso SIEMPRE
            if (vieneDeCancelacion) {
                sessionStorage.removeItem('vieneDeCancelacion');
                sessionStorage.setItem('index_acceso_permitido', 'true');
                return; // PERMITIR ACCESO INMEDIATAMENTE - es cancelación
            }
            
            // Si viene de navegación interna (cualquier página del sistema), PERMITIR SIEMPRE
            // NO importa si detecta sesión o no - es navegación interna
            const esNavegacionInterna = referrer && referrer.length > 0 && (
                referrer.includes('mapa-consolidado.html') ||
                referrer.includes('bloc-notas.html') ||
                referrer.includes('nuevo-registro.html') ||
                referrer.includes('catalogo.html') ||
                referrer.includes('admin.html') ||
                (referrer.includes('index.html') && !referrer.includes('inicio.html')) ||
                // Si viene del mismo dominio y NO es inicio/login/registro, es navegación interna
                (referrer.includes(window.location.hostname) && 
                 !referrer.includes('inicio.html') && 
                 !referrer.includes('registro.html')) ||
                // Detección por pathname si está disponible
                (referrer.includes('/pages/') && 
                 !referrer.includes('inicio.html') && 
                 !referrer.includes('registro.html'))
            );
            
            if (esNavegacionInterna) {
                sessionStorage.setItem('index_acceso_permitido', 'true');
                return; // PERMITIR ACCESO - es navegación interna
            }
            
            // PRIMERO: Verificar sesión DIRECTAMENTE en sessionStorage (más rápido y confiable)
            // SI HAY SESIÓN = PERMITIR SIEMPRE, SIN IMPORTAR EL REFERRER
            const sessionData = sessionStorage.getItem('current_session');
            let tieneSesion = false;
            if (sessionData) {
                try {
                    const sessionObj = JSON.parse(sessionData);
                    if (sessionObj && sessionObj.id && sessionObj.email) {
                        tieneSesion = true;
                        // Marcar acceso permitido para evitar redirecciones futuras
                        sessionStorage.setItem('index_acceso_permitido', 'true');
                        return; // PERMITIR ACCESO INMEDIATAMENTE - NO MÁS VERIFICACIONES
                    }
                } catch (e) {

                }
            }
            
            // SEGUNDO: Verificar con authSystem como respaldo
            // SI ESTÁ AUTENTICADO = PERMITIR SIEMPRE, SIN IMPORTAR EL REFERRER
            let isAuth = false;
            try {
                isAuth = authSystem.isAuthenticated();
                if (isAuth) {
                    // Marcar acceso permitido para evitar redirecciones futuras
                    sessionStorage.setItem('index_acceso_permitido', 'true');
                    return; // PERMITIR ACCESO INMEDIATAMENTE
                }
            } catch (e) {

            }

            // Si NO hay referrer, puede ser navegación interna o acceso directo
            // Por seguridad, si no hay referrer, PERMITIR ACCESO (mejor permitir que bloquear)
            if ((!referrer || referrer.length === 0)) {
                sessionStorage.setItem('index_acceso_permitido', 'true');
                return; // PERMITIR ACCESO - mejor permitir que bloquear incorrectamente
            }
            
            // ÚLTIMA OPCIÓN: SOLO redirigir si viene EXPLÍCITAMENTE desde inicio/login/registro
            // Y NO tiene sesión Y NO es navegación interna Y NO hay flags activos
            const vieneDeInicioLoginRegistro = referrer.includes('inicio.html') || 
                                               referrer.includes('login.html') ||
                                               referrer.includes('registro.html');
            
            // SOLO redirigir si TODAS estas condiciones se cumplen:
            // 1. Viene de inicio/login/registro
            // 2. NO tiene sesión
            // 3. NO está autenticado
            // 4. NO es navegación interna
            // 5. NO hay flags de navegación activos
            if (vieneDeInicioLoginRegistro && 
                !tieneSesion && 
                !isAuth && 
                !esNavegacionInterna &&
                !navegandoInternamente &&
                !vieneDeLogin &&
                !vieneDeCancelacion) {
                // Redirigir a inicio.html
                try {
                    sessionStorage.removeItem('current_session');
                    localStorage.removeItem('current_session');
                    sessionStorage.removeItem('index_acceso_permitido'); // Limpiar flag si existe
                } catch (error) {

                }
                window.location.href = 'inicio.html';
                return;
            }
            
            // Si llegamos aquí, permitir acceso por seguridad (mejor permitir que bloquear)
            sessionStorage.setItem('index_acceso_permitido', 'true');
            return;
        }
        
        // Si estamos en index.html, ya se manejó arriba - NO continuar con otras verificaciones
        // IMPORTANTE: Salir completamente para evitar verificaciones adicionales que puedan redirigir
        if (currentPage === 'index.html') {
            return; // SALIR COMPLETAMENTE - no ejecutar más código
        }
        
        // Verificar autenticación múltiples veces para asegurar sincronización
        let isAuthCheck = authSystem.isAuthenticated();
        let sessionCheck = authSystem.getSession();
        
        // IMPORTANTE: NO ejecutar setTimeout para index.html - ya se manejó arriba
        if (currentPage === 'index.html') {
            return; // Salir completamente - no ejecutar más código
        }
        
        // Si no está autenticado, intentar una vez más después de un pequeño delay
        if (!isAuthCheck) {

            setTimeout(() => {
                // Verificar nuevamente que NO estamos en index.html (por si acaso)
                const currentPageCheck = window.location.pathname.split('/').pop() || 'index.html';
                if (currentPageCheck === 'index.html') {
                    return; // NO hacer nada si estamos en index.html
                }
                
                isAuthCheck = authSystem.isAuthenticated();
                sessionCheck = authSystem.getSession();

                if (protectedPages.includes(currentPageCheck)) {
                    // Verificar si viene del panel de administración
                    const fromAdmin = sessionStorage.getItem('editingFromAdmin') === 'true';
                    
                    if (fromAdmin) {
                        // Si viene del admin, verificar autenticación de admin
                        if (window.adminAuthSystem && window.adminAuthSystem.isAuthenticated()) {

                            return; // Permitir acceso
                        } else {

                            return; // Permitir acceso para mantener contexto
                        }
                    } else {
                        // Si no viene del admin, verificar autenticación de usuario normal
                        if (!isAuthCheck) {

                            // NO redirigir - permitir acceso sin autenticación
                            return;
                        } else {
                            
                        }
                    }
                }
            }, 200);
        } else {
            
            // Verificar ban de forma inmediata y bloqueante
            if (sessionCheck && sessionCheck.id) {
                authSystem.verifyBanAndBlock().then(blocked => {
                    if (blocked) {
                        return; // Usuario baneado, ya se redirigió
                    } else {
                        // Usuario no baneado, iniciar verificación periódica
                        if (typeof iniciarVerificacionPeriodicaBan === 'function') {
                            iniciarVerificacionPeriodicaBan();
                        }
                    }
                });
            }
        }
        
        if (protectedPages.includes(currentPage)) {
            // PRIORIDAD MÁXIMA: Verificar si viene del panel de administración (múltiples formas)
            const urlParams = new URLSearchParams(window.location.search);
            const isEditMode = urlParams.get('edit') === 'true';
            const fromAdmin = sessionStorage.getItem('editingFromAdmin') === 'true' || 
                             window._editingFromAdmin === true || 
                             window._skipAuthCheck === true ||
                             window._skipUserCheck === true ||
                             isEditMode;
            
            if (fromAdmin) {
                return; // Salir inmediatamente sin hacer NADA más - NO verificar usuario normal
            }
            
            // Verificar si viene del panel de administración (método antiguo para compatibilidad)
            if (sessionStorage.getItem('editingFromAdmin') === 'true') {
                // Si viene del admin, verificar autenticación de admin
                // PERO no redirigir si no hay sesión - permitir acceso para mantener contexto
                if (window.adminAuthSystem && window.adminAuthSystem.isAuthenticated()) {

                    return; // Permitir acceso
                } else {
                    // Si no hay sesión de admin pero viene del admin, permitir acceso de todas formas
                    // El formulario manejará la autenticación al guardar

                    return; // Permitir acceso para mantener contexto
                }
            } else {
                // Si no viene del admin, verificar autenticación de usuario normal
                if (!isAuthCheck) {
                    // Ya se manejará en el setTimeout de arriba
                    return;
                } else {

                }
            }
        }
        
        // DESHABILITADO: No redirigir automáticamente desde login.html
        // Permitir que los usuarios accedan al login incluso si tienen una sesión activa
        // Esto evita problemas cuando el usuario quiere iniciar sesión con otra cuenta
        // o cuando viene de la página principal
        /*
        if ((currentPage === 'login.html' || currentPage === 'registro.html') && isAuth) {
            // Solo redirigir si el usuario NO viene de ninguna página (acceso directo)
            // y NO tiene el flag de permitir acceso
            const referrer = document.referrer || '';
            const allowLoginAccess = sessionStorage.getItem('allowLoginAccess') === 'true';
            const hasReferrer = referrer.length > 0;

            // Solo redirigir si es acceso directo (sin referrer) Y no tiene el flag
            // Esto permite acceso desde cualquier página que tenga un enlace a login
            if (!hasReferrer && !allowLoginAccess) {

                window.location.href = 'index.html';
            } else {

                // Limpiar el flag después de usarlo
                if (allowLoginAccess) {
                    sessionStorage.removeItem('allowLoginAccess');
                }
            }
        }
        */
        
        // NO limpiar el flag en páginas públicas - permitir que se use para navegación
        // Solo limpiar el flag si NO estamos en una página pública
        if (!publicPages.includes(currentPage)) {
            if (sessionStorage.getItem('allowLoginAccess') === 'true') {
                sessionStorage.removeItem('allowLoginAccess');
            }
        }
    })(); // Ejecutar inmediatamente sin delay
});

