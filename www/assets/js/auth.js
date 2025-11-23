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
                return { success: true, contenido_ofensivo: data.contenido_ofensivo, message: data.message };
            } else {
                console.error('Error al registrar:', data.message);
                return { 
                    success: false, 
                    message: data.message || 'Error desconocido al registrar',
                    contenido_ofensivo: data.contenido_ofensivo,
                    campos_afectados: data.campos_afectados
                };
            }
        } catch (error) {
            console.error('Error de conexión:', error);
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
                return { success: true };
            } else {
                console.error('Error al iniciar sesión:', data.message);
                return { success: false, message: data.message || 'Error desconocido al iniciar sesión' };
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            return { success: false, message: 'Error de conexión. Verifica que el servidor esté corriendo.' };
        }
    },
    
    // Cerrar sesión
    logout() {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem('index_acceso_permitido'); // Limpiar flag de acceso permitido
    },
    
    // Verificar si hay sesión activa
    isAuthenticated() {
        const session = this.getSession();
        return session !== null;
    },
    
    // Obtener usuario actual
    getCurrentUser() {
        const session = this.getSession();
        if (!session) {
            return null;
        }
        
        // Verificar que el usuario tenga nombre
        const nombre = session.nombre || '';
        if (!nombre || nombre.trim() === '') {
            console.warn('⚠️ Usuario sin nombre detectado - cerrando sesión');
            this.logout();
            // Redirigir a inicio con mensaje
            if (window.location.pathname.includes('pages')) {
                window.location.href = 'inicio.html';
            } else {
                window.location.href = 'pages/inicio.html';
            }
            return null;
        }
        
        return session;
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
            console.error('Error al verificar nombre del usuario:', error);
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
                console.error('❌ ERROR: Usuario sin nombre - no se puede establecer sesión');
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
            
            console.log('💾 Guardando sesión:', sessionData);
            // Usar sessionStorage en lugar de localStorage para que se cierre automáticamente al cerrar la pestaña
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
            
            // Verificar que se guardó correctamente
            const verify = sessionStorage.getItem(SESSION_KEY);
            if (verify) {
                console.log('✅ Sesión guardada correctamente en sessionStorage');
                console.log('✅ Verificación:', JSON.parse(verify));
            } else {
                console.error('❌ ERROR: La sesión no se guardó en sessionStorage');
            }
        } catch (error) {
            console.error('❌ Error al guardar sesión:', error);
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
            console.error('❌ Error al leer sesión de sessionStorage:', error);
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
    
    // Requerir autenticación (redirigir si no está autenticado)
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
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
            console.log('🔍 Verificando email con URL:', apiUrl);
            
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
            console.error('Error de conexión:', error);
            return { success: false, message: 'Error de conexión. Verifica que el servidor esté corriendo.' };
        }
    }
};

// Exportar para uso global
window.authSystem = authSystem;

// Auto-redirigir si no está autenticado en páginas protegidas
document.addEventListener('DOMContentLoaded', () => {
    // Ejecutar inmediatamente sin delay para evitar problemas de timing
    (() => {
        // Lista de páginas que requieren autenticación (NO incluir index.html si es la landing page)
        const protectedPages = ['nuevo-registro.html', 'mapa-consolidado.html', 'bloc-notas.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        console.log('🔍 Verificando autenticación para página:', currentPage);
        console.log('🔍 Ruta completa:', window.location.pathname);
        console.log('🔍 sessionStorage current_session:', sessionStorage.getItem('current_session'));
        
        // IMPORTANTE: Páginas públicas que NO requieren autenticación
        const publicPages = ['login.html', 'registro.html', 'inicio.html'];
        
        // Páginas de administración que usan su propio sistema de autenticación (adminAuthSystem)
        const adminPages = ['admin.html', 'admin-login.html'];
        
        // Si estamos en una página de admin, NO verificar autenticación de usuario normal
        if (adminPages.includes(currentPage)) {
            console.log('ℹ️ Página de administración detectada - NO verificar autenticación de usuario normal');
            return; // Salir inmediatamente, el admin usa adminAuthSystem
        }
        
        // Si estamos en inicio.html, limpiar la sesión y salir
        if (currentPage === 'inicio.html') {
            try {
                sessionStorage.removeItem('current_session');
                localStorage.removeItem('current_session');
                console.log('🧹 Sesión limpiada desde auth.js en inicio.html');
            } catch (error) {
                console.error('❌ Error al limpiar sesión en inicio.html:', error);
            }
            return; // Salir sin verificar autenticación
        }
        
        // Si estamos en login.html o registro.html, salir sin verificar
        if (publicPages.includes(currentPage)) {
            console.log('ℹ️ Página pública detectada - NO redirigir automáticamente');
            return; // Salir inmediatamente sin hacer ninguna verificación de autenticación
        }
        
        // index.html - LÓGICA ULTRA SIMPLIFICADA
        // REGLA DE ORO: Si hay sesión = PERMITIR SIEMPRE. Si NO hay sesión Y viene directamente = REDIRIGIR
        if (currentPage === 'index.html') {
            // FLAG PERMANENTE: Si ya se marcó como navegación interna, PERMITIR SIEMPRE
            // Esto evita redirecciones después de que la página carga
            // VERIFICAR ESTO PRIMERO - es la verificación más rápida y confiable
            const accesoPermitido = sessionStorage.getItem('index_acceso_permitido') === 'true';
            if (accesoPermitido) {
                console.log('✅ [index.html] ACCESO YA PERMITIDO (flag permanente) - NO REDIRIGIR');
                console.log('🔍 [index.html] Flag establecido en HEAD - permitiendo acceso inmediatamente');
                return; // PERMITIR ACCESO - flag permanente activo - SALIR INMEDIATAMENTE
            }
            
            console.log('⚠️ [index.html] Flag NO establecido - verificando condiciones...');
            
            // VERIFICAR FLAGS Y REFERRER PRIMERO (antes de verificar sesión)
            // Esto es crítico porque si hay navegación interna, NO debemos redirigir aunque no detectemos sesión inmediatamente
            const vieneDeLogin = sessionStorage.getItem('vieneDeLogin') === 'true';
            const vieneDeCancelacion = sessionStorage.getItem('vieneDeCancelacion') === 'true';
            const navegandoInternamente = sessionStorage.getItem('navegando_internamente') === 'true';
            const referrer = document.referrer || '';
            
            // PRIORIDAD MÁXIMA: Si el flag de navegación interna está activo (establecido antes de navegar)
            if (navegandoInternamente) {
                console.log('✅ [index.html] Flag de navegación interna detectado - ACCESO PERMITIDO');
                sessionStorage.removeItem('navegando_internamente'); // Limpiar flag
                sessionStorage.setItem('index_acceso_permitido', 'true');
                return;
            }
            
            // Si viene de login, permitir acceso y marcar flag permanente
            if (vieneDeLogin) {
                console.log('✅ [index.html] Viene de login - ACCESO PERMITIDO');
                sessionStorage.setItem('index_acceso_permitido', 'true');
                return;
            }
            
            // PRIORIDAD MÁXIMA: Si viene de cancelación (nuevo-registro), permitir acceso SIEMPRE
            if (vieneDeCancelacion) {
                console.log('✅ [index.html] Viene de cancelación - ACCESO PERMITIDO (prioridad máxima)');
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
                 !referrer.includes('login.html') &&
                 !referrer.includes('registro.html')) ||
                // Detección por pathname si está disponible
                (referrer.includes('/pages/') && 
                 !referrer.includes('inicio.html') && 
                 !referrer.includes('login.html') &&
                 !referrer.includes('registro.html'))
            );
            
            if (esNavegacionInterna) {
                console.log('✅ [index.html] NAVEGACIÓN INTERNA DETECTADA - ACCESO PERMITIDO (sin verificar sesión)');
                console.log('🔍 [index.html] Referrer detectado:', referrer);
                sessionStorage.setItem('index_acceso_permitido', 'true');
                return; // PERMITIR ACCESO - es navegación interna
            }
            
            // PRIMERO: Verificar sesión DIRECTAMENTE en sessionStorage (más rápido y confiable)
            // SI HAY SESIÓN = PERMITIR SIEMPRE, SIN IMPORTAR EL REFERRER
            const sessionData = sessionStorage.getItem('current_session');
            let tieneSesion = false;
            if (sessionData) {
                try {
                    const session = JSON.parse(sessionData);
                    if (session && session.id && session.email) {
                        tieneSesion = true;
                        console.log('✅ [index.html] SESIÓN ENCONTRADA - ACCESO PERMITIDO (sin importar referrer):', session);
                        // Marcar acceso permitido para evitar redirecciones futuras
                        sessionStorage.setItem('index_acceso_permitido', 'true');
                        return; // PERMITIR ACCESO INMEDIATAMENTE - NO MÁS VERIFICACIONES
                    }
                } catch (e) {
                    console.error('❌ [index.html] Error al parsear sesión:', e);
                }
            }
            
            // SEGUNDO: Verificar con authSystem como respaldo
            // SI ESTÁ AUTENTICADO = PERMITIR SIEMPRE, SIN IMPORTAR EL REFERRER
            let isAuth = false;
            try {
                isAuth = authSystem.isAuthenticated();
                if (isAuth) {
                    console.log('✅ [index.html] AUTENTICADO CON AUTHSYSTEM - ACCESO PERMITIDO (sin importar referrer)');
                    // Marcar acceso permitido para evitar redirecciones futuras
                    sessionStorage.setItem('index_acceso_permitido', 'true');
                    return; // PERMITIR ACCESO INMEDIATAMENTE
                }
            } catch (e) {
                console.error('❌ [index.html] Error al verificar authSystem:', e);
            }
            
            console.log('🔍 [index.html] Verificación sin sesión:', {
                referrer: referrer,
                referrerLength: referrer.length,
                vieneDeLogin: vieneDeLogin,
                vieneDeCancelacion: vieneDeCancelacion,
                navegandoInternamente: navegandoInternamente,
                tieneSesion: tieneSesion,
                isAuth: isAuth,
                esNavegacionInterna: esNavegacionInterna
            });
            
            // Si NO hay referrer, puede ser navegación interna o acceso directo
            // Por seguridad, si no hay referrer, PERMITIR ACCESO (mejor permitir que bloquear)
            if ((!referrer || referrer.length === 0)) {
                console.log('⚠️ [index.html] Referrer vacío - PERMITIENDO ACCESO por seguridad');
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
                console.log('🧹 [index.html] No tiene sesión y viene de inicio/login/registro - REDIRIGIENDO a inicio.html');
                console.log('🔍 [index.html] Detalles finales:', {
                    referrer: referrer,
                    tieneSesion: tieneSesion,
                    isAuth: isAuth,
                    vieneDeInicioLoginRegistro: vieneDeInicioLoginRegistro,
                    esNavegacionInterna: esNavegacionInterna,
                    navegandoInternamente: navegandoInternamente,
                    vieneDeLogin: vieneDeLogin,
                    vieneDeCancelacion: vieneDeCancelacion
                });
                try {
                    sessionStorage.removeItem('current_session');
                    localStorage.removeItem('current_session');
                    sessionStorage.removeItem('index_acceso_permitido'); // Limpiar flag si existe
                } catch (error) {
                    console.error('❌ Error al limpiar sesión:', error);
                }
                window.location.href = 'inicio.html';
                return;
            }
            
            // Si llegamos aquí, permitir acceso por seguridad (mejor permitir que bloquear)
            console.log('✅ [index.html] Acceso permitido (fallback de seguridad)');
            sessionStorage.setItem('index_acceso_permitido', 'true');
            return;
        }
        
        // Si estamos en index.html, ya se manejó arriba - NO continuar con otras verificaciones
        // IMPORTANTE: Salir completamente para evitar verificaciones adicionales que puedan redirigir
        if (currentPage === 'index.html') {
            console.log('✅ index.html ya manejado - saliendo de verificaciones adicionales');
            return; // SALIR COMPLETAMENTE - no ejecutar más código
        }
        
        // Verificar autenticación múltiples veces para asegurar sincronización
        let isAuth = authSystem.isAuthenticated();
        let session = authSystem.getSession();
        
        // IMPORTANTE: NO ejecutar setTimeout para index.html - ya se manejó arriba
        if (currentPage === 'index.html') {
            console.log('✅ index.html ya manejado completamente - NO ejecutar setTimeout');
            return; // Salir completamente - no ejecutar más código
        }
        
        // Si no está autenticado, intentar una vez más después de un pequeño delay
        if (!isAuth) {
            console.log('⚠️ Primera verificación falló, esperando y reintentando...');
            setTimeout(() => {
                // Verificar nuevamente que NO estamos en index.html (por si acaso)
                const currentPageCheck = window.location.pathname.split('/').pop() || 'index.html';
                if (currentPageCheck === 'index.html') {
                    console.log('✅ index.html detectado en setTimeout - NO redirigir');
                    return; // NO hacer nada si estamos en index.html
                }
                
                isAuth = authSystem.isAuthenticated();
                session = authSystem.getSession();
                console.log('🔍 Segunda verificación - Autenticado:', isAuth);
                console.log('🔍 Segunda verificación - Sesión:', session);
                
                if (protectedPages.includes(currentPageCheck)) {
                    // Verificar si viene del panel de administración
                    const fromAdmin = sessionStorage.getItem('editingFromAdmin') === 'true';
                    
                    if (fromAdmin) {
                        // Si viene del admin, verificar autenticación de admin
                        if (window.adminAuthSystem && window.adminAuthSystem.isAuthenticated()) {
                            console.log('✅ Autenticación de administrador válida');
                            return; // Permitir acceso
                        } else {
                            console.log('⚠️ No hay sesión de admin activa, pero viene del panel admin - permitiendo acceso');
                            return; // Permitir acceso para mantener contexto
                        }
                    } else {
                        // Si no viene del admin, verificar autenticación de usuario normal
                        if (!isAuth) {
                            console.log('❌ No autenticado después de segunda verificación, redirigiendo a login.html');
                            window.location.href = 'login.html';
                        } else {
                            console.log('✅ Usuario autenticado correctamente (segunda verificación)');
                        }
                    }
                }
            }, 200);
        } else {
            console.log('✅ Usuario autenticado correctamente (primera verificación)');
            console.log('✅ Sesión actual:', session);
        }
        
        if (protectedPages.includes(currentPage)) {
            // Verificar si viene del panel de administración
            const fromAdmin = sessionStorage.getItem('editingFromAdmin') === 'true';
            
            if (fromAdmin) {
                // Si viene del admin, verificar autenticación de admin
                // PERO no redirigir si no hay sesión - permitir acceso para mantener contexto
                if (window.adminAuthSystem && window.adminAuthSystem.isAuthenticated()) {
                    console.log('✅ Autenticación de administrador válida');
                    return; // Permitir acceso
                } else {
                    // Si no hay sesión de admin pero viene del admin, permitir acceso de todas formas
                    // El formulario manejará la autenticación al guardar
                    console.log('⚠️ No hay sesión de admin activa, pero viene del panel admin - permitiendo acceso');
                    return; // Permitir acceso para mantener contexto
                }
            } else {
                // Si no viene del admin, verificar autenticación de usuario normal
                if (!isAuth) {
                    // Ya se manejará en el setTimeout de arriba
                    return;
                } else {
                    console.log('✅ Usuario autenticado correctamente');
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
            
            console.log('🔍 Verificando acceso a login:', {
                currentPage: currentPage,
                isAuth: isAuth,
                referrer: referrer,
                allowLoginAccess: allowLoginAccess,
                hasReferrer: hasReferrer
            });
            
            // Solo redirigir si es acceso directo (sin referrer) Y no tiene el flag
            // Esto permite acceso desde cualquier página que tenga un enlace a login
            if (!hasReferrer && !allowLoginAccess) {
                console.log('✅ Ya autenticado y acceso directo, redirigiendo a index.html');
                window.location.href = 'index.html';
            } else {
                console.log('ℹ️ Usuario autenticado pero permitiendo acceso al login');
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

