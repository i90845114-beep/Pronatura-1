// Panel de Administración

let allUsers = [];
let allRegistros = [];
let allCategorias = [];
let allComentarios = [];

// Variables para intentos ofensivos (definir ANTES de la función)
let intentosOfensivos = [];
let paginaIntentos = 0;
const limiteIntentos = 20;

// Funciones auxiliares
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

// Función para cargar intentos ofensivos - DEFINIR AL INICIO DEL ARCHIVO
window.loadIntentosOfensivos = async function loadIntentosOfensivos() {

    const tbody = document.getElementById('intentosOfensivosTableBody');

    if (!tbody) {

        alert('Error: No se encontró la tabla. Verifica que la sección de Intentos Ofensivos esté visible.');
        return;
    }
    
    tbody.innerHTML = '<tr><td colspan="7" style="padding: 2rem; text-align: center; color: #999;">Cargando...</td></tr>';
    
    try {
        const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
        if (!token) {

            tbody.innerHTML = '<tr><td colspan="7" style="padding: 2rem; text-align: center; color: #d32f2f;">Error: No autenticado</td></tr>';
            return;
        }
        
        const tipoIntento = document.getElementById('filterTipoIntento')?.value || '';
        const usuarioId = document.getElementById('filterUsuarioIntento')?.value || '';
        
        // IMPORTANTE: Aumentar el límite para obtener más intentos y poder agrupar correctamente
        // Esto evita que un usuario con muchos intentos aparezca dividido en múltiples páginas
        const limiteParaAgrupacion = limiteIntentos * 3; // Obtener 3 veces más para agrupar mejor
        
        let url = `${getApiBaseUrl()}?action=get_intentos_ofensivos&token=${token}&limit=${limiteParaAgrupacion}&offset=${paginaIntentos * limiteIntentos}`;
        if (tipoIntento) url += `&tipo_intento=${tipoIntento}`;
        if (usuarioId) url += `&usuario_id=${usuarioId}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            intentosOfensivos = data.intentos || [];

            // Agrupar los intentos primero
            const intentosAgrupados = agruparIntentos(intentosOfensivos);
            const gruposArray = Object.values(intentosAgrupados);
            
            // Ordenar grupos por cantidad de intentos (mayor primero) para mostrar los más problemáticos primero
            gruposArray.sort((a, b) => b.length - a.length);
            
            // Paginar los GRUPOS agrupados, no los intentos individuales
            const gruposPorPagina = limiteIntentos;
            const inicioGrupo = paginaIntentos * gruposPorPagina;
            const finGrupo = inicioGrupo + gruposPorPagina;
            const gruposParaMostrar = gruposArray.slice(inicioGrupo, finGrupo);
            
            // Desagrupar los grupos seleccionados para renderizar
            const intentosParaRenderizar = gruposParaMostrar.flat();

            if (typeof renderIntentosOfensivos === 'function') {
                renderIntentosOfensivos(intentosParaRenderizar, gruposArray.length);
            }
            if (typeof actualizarPaginacionIntentos === 'function') {
                // Usar el total de GRUPOS para la paginación, no el total de intentos
                actualizarPaginacionIntentos(gruposArray.length, inicioGrupo, gruposPorPagina);
            }
        } else {

            tbody.innerHTML = `<tr><td colspan="7" style="padding: 2rem; text-align: center; color: #d32f2f;">Error: ${data.message}</td></tr>`;
        }
    } catch (error) {

        tbody.innerHTML = '<tr><td colspan="7" style="padding: 2rem; text-align: center; color: #d32f2f;">Error de conexión: ' + error.message + '</td></tr>';
    }
};

// Verificación INMEDIATA después de definir la función

if (typeof window.loadIntentosOfensivos !== 'function') {

} else {

}

// Verificar que el usuario es administrador
document.addEventListener('DOMContentLoaded', async () => {

    // FALLBACK: Intentar cargar dashboard directamente después de un delay
    setTimeout(() => {

        if (typeof loadDashboard === 'function') {

            loadDashboard().catch(error => {

            });
        } else {

        }
    }, 2000);

    try {
        // Cargar el sistema de autenticación de admin
        if (typeof window.adminAuthSystem === 'undefined') {

            // Si no está cargado, cargarlo dinámicamente
            const script = document.createElement('script');
            script.src = '../assets/js/admin-auth.js';
            script.onload = () => {

                checkAdminAccess();
            };
            script.onerror = () => {

            };
            document.head.appendChild(script);
        } else {

            checkAdminAccess();
        }
    } catch (error) {

    }
});

// Función helper para obtener la URL base de la API según el entorno
function getApiBaseUrl() {
    const currentUrl = window.location.href.toLowerCase();
    const isHostinger = currentUrl.indexOf('hostinger') !== -1 || 
                       currentUrl.indexOf('hostingersite.com') !== -1 ||
                       currentUrl.indexOf('organicjournal.com.mx') !== -1;
    
    return isHostinger ? '/api/api.php' : '../api/api.php';
}

// Asegurar que setupTabNavigation se ejecute después de que todo esté listo
function ensureTabNavigation() {
    // Intentar múltiples veces si es necesario
    const tabs = document.querySelectorAll('.nav-tab');
    if (tabs.length === 0) {

        setTimeout(ensureTabNavigation, 500);
        return;
    }

    // Verificar que las funciones estén disponibles antes de continuar
    if (typeof setupTabNavigation !== 'function') {

        setTimeout(ensureTabNavigation, 500);
        return;
    }
    
    setupTabNavigation();
}

async function checkAdminAccess() {

    // Verificar autenticación de administrador

    if (!window.adminAuthSystem || !window.adminAuthSystem.isAuthenticated()) {

        alert('Debes iniciar sesión como administrador para acceder a este panel');
        window.location.href = 'admin-login.html';
        return false;
    }

    // Verificar token con el servidor
    const token = window.adminAuthSystem.getToken();

    try {
        const apiUrl = `${getApiBaseUrl()}?action=verify_admin_session&token=${token}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.success) {

            alert('Tu sesión de administrador ha expirado. Por favor, inicia sesión nuevamente.');
            window.adminAuthSystem.logout();
            window.location.href = 'admin-login.html';
            return false;
        }

    } catch (error) {

        alert('Error al verificar tu sesión. Por favor, intenta nuevamente.');
        window.location.href = 'admin-login.html';
        return false;
    }
    
    // Mostrar nombre de administrador - EJECUTAR CON MÚLTIPLES REINTENTOS
    function updateUserName() {
        try {
            const userNameEl = document.getElementById('userName');
            if (!userNameEl) {

                setTimeout(updateUserName, 200);
                return;
            }
            
            if (!window.adminAuthSystem) {

                setTimeout(updateUserName, 200);
                return;
            }
            
            const admin = window.adminAuthSystem.getCurrentAdmin();

            if (admin && admin.nombre) {
                userNameEl.textContent = admin.nombre;

                return; // Éxito, no reintentar
            } else if (admin && admin.email) {
                userNameEl.textContent = admin.email.split('@')[0];

                return; // Éxito, no reintentar
            } else {
                userNameEl.textContent = 'Administrador';

                return; // Fallback aplicado, no reintentar
            }
        } catch (error) {

            const userNameEl = document.getElementById('userName');
            if (userNameEl) {
                userNameEl.textContent = 'Administrador';
            }
        }
    }
    
    // Ejecutar inmediatamente y con múltiples reintentos (hasta 10 veces)
    updateUserName();
    setTimeout(updateUserName, 100);
    setTimeout(updateUserName, 300);
    setTimeout(updateUserName, 600);
    setTimeout(updateUserName, 1000);
    setTimeout(updateUserName, 1500);
    setTimeout(updateUserName, 2000);
    setTimeout(updateUserName, 3000);
    
    // Badge de notificaciones de solicitudes (llega a todos los admins)
    if (typeof actualizarBadgeNotificacionesSolicitudes === 'function') {
        actualizarBadgeNotificacionesSolicitudes();
        setInterval(actualizarBadgeNotificacionesSolicitudes, 60000); // actualizar cada minuto
    }
    
    // Inicializar el panel

    if (typeof initializeAdmin !== 'function') {

        // Intentar cargar dashboard directamente como último recurso
        setTimeout(() => {
            if (typeof loadDashboard === 'function') {

                loadDashboard();
            }
        }, 1000);
        return false;
    }
    
    try {
        initializeAdmin();

    } catch (error) {

    }
    
    return true;
}

function initializeAdmin() {

    // Asegurar que los tabs estén disponibles antes de registrar listeners
    // Esperar más tiempo para asegurar que todas las funciones estén cargadas
    setTimeout(() => {

        ensureTabNavigation();
    }, 500);
    
    // Limpiar marcador de edición cuando se regresa al panel
    sessionStorage.removeItem('editingFromAdmin');
    sessionStorage.removeItem('editingRecord');
    
    // IA AUTÓNOMA DESACTIVADA
    // 
    // const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
    // ' : 'NO');
    
    // Cargar datos principales del panel - SOLO DASHBOARD

    if (typeof loadDashboard === 'function') {
        loadDashboard().catch(err => {

        });
    } else {

    }
    
    // NO cargar las demás secciones automáticamente - solo cuando se haga clic en las pestañas
    // Esto evita cargas innecesarias y problemas de timing
    
    // Verificar si hay hash en la URL para activar una pestaña específica
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        const targetTab = document.querySelector(`[data-tab="${hash}"]`);
        if (targetTab) {
            targetTab.click();
        }
    }
    
    setupEventListeners();
    // Cargar categorías al inicializar para que estén disponibles en los filtros
    loadCategorias();

}

// Función GLOBAL para manejar clicks en tabs (disponible desde HTML onclick)
window.handleTabClick = function handleTabClick(tabId) {

    try {
        // Remover active de todos los tabs y secciones
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-section').forEach(s => {
            s.classList.remove('active');
        });
        
        // Buscar el tab y la sección
        const tab = document.querySelector(`[data-tab="${tabId}"]`);
        const section = document.getElementById(tabId);
        
        if (!tab) {

            alert('Error: Tab no encontrado. Recarga la página.');
            return;
        }
        
        if (!section) {

            alert('Error: Sección no encontrada. Recarga la página.');
            return;
        }
        
        // Agregar active al tab y sección
        tab.classList.add('active');
        section.classList.add('active');

        // Ejecutar función según el tab
        try {
            if (tabId === 'dashboard') {

                if (typeof loadDashboard === 'function') {
                    loadDashboard();
                } else {

                }
            } else if (tabId === 'usuarios') {

                if (typeof window.loadUsuarios === 'function') {
                    window.loadUsuarios().catch(err => {

                    });
                } else {

                    alert('Error: La función loadUsuarios no está disponible. Recarga la página (Ctrl+F5).');
                }
            } else if (tabId === 'registros') {

                if (typeof window.loadAllRegistros === 'function') {
                    window.loadAllRegistros().catch(err => {

                    });
                } else {

                    alert('Error: La función loadAllRegistros no está disponible. Recarga la página (Ctrl+F5).');
                }
            } else if (tabId === 'categorias') {

                if (typeof window.loadCategorias === 'function') {
                    window.loadCategorias().catch(err => {

                    });
                } else {

                    alert('Error: La función loadCategorias no está disponible. Recarga la página (Ctrl+F5).');
                }
            } else if (tabId === 'comentarios') {

                if (typeof window.loadComentarios === 'function') {
                    window.loadComentarios().catch(err => {

                    });
                } else {

                    alert('Error: La función loadComentarios no está disponible. Recarga la página (Ctrl+F5).');
                }
            } else if (tabId === 'intentos-ofensivos') {
                // Cargar intentos ofensivos, listado Bot y recomendaciones del Bot
                if (typeof loadIntentosOfensivos === 'function') {
                    loadIntentosOfensivos();
                }
                if (typeof loadDashboardIntentosOfensivos === 'function') {
                    loadDashboardIntentosOfensivos();
                }
                if (typeof loadBotRecomendaciones === 'function') {
                    loadBotRecomendaciones();
                }
            } else if (tabId === 'apelaciones') {
                if (typeof window.loadApelaciones === 'function') {
                    setTimeout(() => window.loadApelaciones(), 100);
                } else {

                }
            } else if (tabId === 'solicitudes-grupos') {
                // Mostrar la primera sub-pestaña por defecto
                mostrarSubTabGrupos('solicitudes');
                if (typeof window.cargarSolicitudesGrupos === 'function') {
                    setTimeout(() => window.cargarSolicitudesGrupos(), 100);
                } else {

                }
            }
        } catch (error) {

            alert('Error al cargar la sección: ' + error.message);
        }
    } catch (error) {

        alert('Error crítico: ' + error.message);
    }
};

function setupTabNavigation() {

    // Obtener todos los tabs
    const tabs = document.querySelectorAll('.nav-tab');

    if (tabs.length === 0) {

        setTimeout(setupTabNavigation, 500);
        return;
    }
    
    // handleTabClick ya está disponible globalmente (definida arriba)
    // Los onclick están en el HTML directamente

}

function setupEventListeners() {
    // Formularios
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', handleEditUser);
    }
    
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUser);
    }
    
    const advertenciaForm = document.getElementById('advertenciaForm');
    if (advertenciaForm) {
        advertenciaForm.addEventListener('submit', handleDarAdvertencia);
    }
    
    const banForm = document.getElementById('banForm');
    if (banForm) {
        banForm.addEventListener('submit', handleDarBan);
        const banTipo = document.getElementById('banTipo');
        if (banTipo) {
            banTipo.addEventListener('change', updateBanDiasVisibility);
        }
    }
    
    // Botones de IA Autónoma - DESACTIVADOS
    // const btnLimpiarNotificaciones = document.getElementById('btnLimpiarNotificaciones');
    // if (btnLimpiarNotificaciones) {
    //     btnLimpiarNotificaciones.addEventListener('click', limpiarNotificacionesIA);
    // }
    
    // Botones de Intentos Ofensivos
    const btnCargarIntentos = document.getElementById('btnCargarIntentos');

    if (btnCargarIntentos) {

        btnCargarIntentos.addEventListener('click', (e) => {
            e.preventDefault();

            paginaIntentos = 0;
            if (typeof window.loadIntentosOfensivos === 'function') {
                window.loadIntentosOfensivos();
            } else if (typeof loadIntentosOfensivos === 'function') {
                loadIntentosOfensivos();
            } else {

                alert('Error: La función no está disponible. Recarga la página.');
            }
        });
    } else {

        // Intentar nuevamente después de un delay
        setTimeout(() => {
            const btnRetry = document.getElementById('btnCargarIntentos');
            if (btnRetry) {

                btnRetry.addEventListener('click', (e) => {
                    e.preventDefault();
                    paginaIntentos = 0;
                    if (typeof window.loadIntentosOfensivos === 'function') {
                        window.loadIntentosOfensivos();
                    } else if (typeof loadIntentosOfensivos === 'function') {
                        loadIntentosOfensivos();
                    } else {

                        alert('Error: La función no está disponible. Recarga la página.');
                    }
                });
            }
        }, 1000);
    }
    
    const filterTipoIntento = document.getElementById('filterTipoIntento');
    const filterUsuarioIntento = document.getElementById('filterUsuarioIntento');
    if (filterTipoIntento) {
        filterTipoIntento.addEventListener('change', () => {
            paginaIntentos = 0;
            loadIntentosOfensivos();
        });
    }
    if (filterUsuarioIntento) {
        filterUsuarioIntento.addEventListener('change', () => {
            paginaIntentos = 0;
            loadIntentosOfensivos();
        });
    }
    
    // Los event listeners de búsqueda de usuarios se configuran después de cargar usuarios
    // Ver setupUserSearchListeners()
    
    // Filtros de registros
    const searchRegistros = document.getElementById('searchRegistros');
    if (searchRegistros) {
        searchRegistros.addEventListener('input', filterRegistros);
        // También buscar al presionar Enter
        searchRegistros.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (searchTimeout) clearTimeout(searchTimeout);
                loadAllRegistros();
            }
        });
    }
    
    const filterCategoriaAdmin = document.getElementById('filterCategoriaAdmin');
    if (filterCategoriaAdmin) {
        filterCategoriaAdmin.addEventListener('change', () => {
            loadAllRegistros();
        });
    }
    
    const filterUsuarioAdmin = document.getElementById('filterUsuarioAdmin');
    if (filterUsuarioAdmin) {
        filterUsuarioAdmin.addEventListener('change', () => {
            loadAllRegistros();
        });
    }
    
    // Filtros de comentarios
    const searchComentarios = document.getElementById('searchComentarios');
    if (searchComentarios) {
        searchComentarios.addEventListener('input', filterComentarios);
    }
    
    const filterComentarioActivo = document.getElementById('filterComentarioActivo');
    if (filterComentarioActivo) {
        filterComentarioActivo.addEventListener('change', filterComentarios);
    }
    
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
    try {
        // Detectar entorno
        const currentUrl = window.location.href.toLowerCase();
        const isHostinger = currentUrl.indexOf('hostinger') !== -1 || 
                           currentUrl.indexOf('hostingersite.com') !== -1 ||
                           currentUrl.indexOf('organicjournal.com.mx') !== -1;
        const apiBase = isHostinger ? '/api/api.php' : '../api/api.php';
        
        // Cargar datos
        const [statsResponse, categoriasResponse] = await Promise.all([
            fetch(`${apiBase}?action=get_admin_stats`),
            fetch(`${apiBase}?action=get_categorias`)
        ]);
        
        if (!statsResponse.ok || !categoriasResponse.ok) {
            throw new Error('Error al cargar datos');
        }
        
        const statsData = await statsResponse.json();
        const categorias = await categoriasResponse.json();
        
        // Actualizar UI
        if (statsData.success) {
            const statUsuarios = document.getElementById('statUsuarios');
            const statRegistros = document.getElementById('statRegistros');
            const statCategorias = document.getElementById('statCategorias');
            const statComentarios = document.getElementById('statComentarios');
            
            if (statUsuarios) statUsuarios.textContent = statsData.stats.total_usuarios || 0;
            if (statRegistros) statRegistros.textContent = statsData.stats.total_registros || 0;
            if (statCategorias) statCategorias.textContent = categorias.success ? categorias.categorias.length : 0;
            if (statComentarios) statComentarios.textContent = statsData.stats.total_comentarios || 0;
        }
        loadDashboardUltimos10Intentos();
    } catch (error) {

    }
}

async function loadDashboardUltimos10Intentos() {
    var container = document.getElementById('dashboardUltimosIntentosOfensivos');
    if (!container) return;
    try {
        var token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
        if (!token) {
            container.innerHTML = '<p style="color: #718096; margin: 0;">Inicia sesión como administrador.</p>';
            return;
        }
        var url = getApiBaseUrl() + '?action=get_intentos_ofensivos&token=' + encodeURIComponent(token) + '&limit=10&offset=0';
        var response = await fetch(url);
        var data = await response.json();
        if (!data.success) {
            container.innerHTML = '<p style="color: #718096; margin: 0;">' + (data.message || 'No se pudieron cargar.') + '</p>';
            return;
        }
        var intentos = data.intentos || [];
        if (intentos.length === 0) {
            container.innerHTML = '<p style="color: #718096; margin: 0;">No hay intentos de contenido ofensivo registrados.</p>';
            return;
        }
        var tipoLabel = { 'registro_usuario': 'Registro usuario', 'registro_animal': 'Registro animal', 'registro_ambiental': 'Registro ambiental' };
        var html = '<ul style="list-style: none; padding: 0; margin: 0;">';
        intentos.forEach(function(i) {
            var fecha = (i.fecha_intento || '').toString();
            if (fecha.indexOf('T') !== -1) fecha = fecha.split('T')[0] + ' ' + fecha.split('T')[1].substring(0, 5);
            var tipo = tipoLabel[i.tipo_intento] || i.tipo_intento || 'Otro';
            var quien = (i.usuario_nombre || i.intento_nombre || i.intento_email || i.usuario_email || '—').toString();
            if (quien.length > 35) quien = quien.substring(0, 32) + '...';
            var campos = (i.campos_afectados || '—').toString();
            if (campos.length > 40) campos = campos.substring(0, 37) + '...';
            html += '<li style="padding: 0.65rem 0; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem;">';
            html += '<div><span style="background: #fed7d7; color: #c53030; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">' + escapeHtml(tipo) + '</span>';
            html += ' <strong style="color: #2d3748;">' + escapeHtml(quien) + '</strong>';
            html += '<br><span style="color: #718096; font-size: 0.8rem;">' + escapeHtml(fecha) + '</span>';
            if (campos && campos !== '—') html += ' · Campos: ' + escapeHtml(campos);
            html += '</div></li>';
        });
        html += '</ul>';
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<p style="color: #a0aec0; margin: 0;">No se pudieron cargar.</p>';
    }
}

// Paginación del listado "Bot – Intentos de contenido ofensivo"
var paginaIaIntentos = 0;
var totalIaIntentos = 0;
var limiteIaIntentos = 15;

async function loadDashboardIntentosOfensivos(pagina) {
    if (pagina !== undefined) paginaIaIntentos = Math.max(0, parseInt(pagina, 10));
    var containerIA = document.getElementById('iaUltimosIntentosOfensivos');
    if (!containerIA) return;
    function setAll(html) {
        containerIA.innerHTML = html;
    }
    try {
        var token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
        if (!token) {
            setAll('<p style="color: #718096; margin: 0;">Inicia sesión como administrador para ver los intentos.</p>');
            ocultarPaginacionIaIntentos();
            return;
        }
        var offset = paginaIaIntentos * limiteIaIntentos;
        var url = getApiBaseUrl() + '?action=get_intentos_ofensivos&token=' + encodeURIComponent(token) + '&limit=' + limiteIaIntentos + '&offset=' + offset;
        var response = await fetch(url);
        var data = await response.json();
        if (!data.success) {
            setAll('<p style="color: #718096; margin: 0;">' + (data.message || 'No se pudieron cargar.') + '</p>');
            ocultarPaginacionIaIntentos();
            return;
        }
        var intentos = data.intentos || [];
        totalIaIntentos = parseInt(data.total, 10) || 0;
        if (intentos.length === 0 && paginaIaIntentos === 0) {
            setAll('<p style="color: #718096; margin: 0;">No hay intentos de contenido ofensivo registrados.</p>');
            ocultarPaginacionIaIntentos();
            return;
        }
        if (intentos.length === 0) {
            paginaIaIntentos = Math.max(0, Math.ceil(totalIaIntentos / limiteIaIntentos) - 1);
            loadDashboardIntentosOfensivos(paginaIaIntentos);
            return;
        }
        var tipoLabel = { 'registro_usuario': 'Registro usuario', 'registro_animal': 'Registro animal', 'registro_ambiental': 'Registro ambiental' };
        var html = '<ul style="list-style: none; padding: 0; margin: 0;">';
        intentos.forEach(function(i) {
            var fecha = (i.fecha_intento || '').toString();
            if (fecha.indexOf('T') !== -1) fecha = fecha.split('T')[0] + ' ' + fecha.split('T')[1].substring(0, 5);
            var tipo = tipoLabel[i.tipo_intento] || i.tipo_intento || 'Otro';
            var quien = (i.usuario_nombre || i.intento_nombre || i.intento_email || i.usuario_email || '—').toString();
            if (quien.length > 35) quien = quien.substring(0, 32) + '...';
            var campos = (i.campos_afectados || '—').toString();
            if (campos.length > 40) campos = campos.substring(0, 37) + '...';
            html += '<li style="padding: 0.65rem 0; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem;">';
            html += '<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">';
            html += '<div><span style="background: #fed7d7; color: #c53030; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">' + escapeHtml(tipo) + '</span>';
            html += ' <strong style="color: #2d3748;">' + escapeHtml(quien) + '</strong>';
            html += '<br><span style="color: #718096; font-size: 0.8rem;">' + escapeHtml(fecha) + '</span>';
            if (campos && campos !== '—') html += ' · Campos: ' + escapeHtml(campos);
            html += '</div>';
            html += '</div></li>';
        });
        html += '</ul>';
        setAll(html);
        actualizarPaginacionIaIntentos();
    } catch (e) {
        setAll('<p style="color: #a0aec0; margin: 0;">No se pudieron cargar los intentos ofensivos.</p>');
        ocultarPaginacionIaIntentos();
    }
}

function ocultarPaginacionIaIntentos() {
    var div = document.getElementById('paginacionIaIntentos');
    if (div) div.style.display = 'none';
}

function actualizarPaginacionIaIntentos() {
    var div = document.getElementById('paginacionIaIntentos');
    var info = document.getElementById('infoPaginacionIaIntentos');
    var btnAnterior = document.getElementById('btnAnteriorIaIntentos');
    var btnSiguiente = document.getElementById('btnSiguienteIaIntentos');
    if (!div || !info) return;
    if (totalIaIntentos <= limiteIaIntentos) {
        div.style.display = totalIaIntentos > 0 ? 'flex' : 'none';
        if (totalIaIntentos > 0) {
            info.textContent = 'Mostrando ' + totalIaIntentos + ' de ' + totalIaIntentos + ' registros';
            if (btnAnterior) { btnAnterior.disabled = true; btnAnterior.onclick = null; }
            if (btnSiguiente) { btnSiguiente.disabled = true; btnSiguiente.onclick = null; }
        }
        return;
    }
    div.style.display = 'flex';
    var totalPaginas = Math.ceil(totalIaIntentos / limiteIaIntentos);
    var paginaActual = paginaIaIntentos + 1;
    var desde = paginaIaIntentos * limiteIaIntentos + 1;
    var hasta = Math.min((paginaIaIntentos + 1) * limiteIaIntentos, totalIaIntentos);
    info.textContent = 'P\u00e1gina ' + paginaActual + ' de ' + totalPaginas + ' (registros ' + desde + '-' + hasta + ' de ' + totalIaIntentos + ')';
    if (btnAnterior) {
        btnAnterior.disabled = paginaActual <= 1;
        btnAnterior.onclick = function() {
            if (paginaIaIntentos > 0) loadDashboardIntentosOfensivos(paginaIaIntentos - 1);
        };
    }
    if (btnSiguiente) {
        btnSiguiente.disabled = paginaActual >= totalPaginas;
        btnSiguiente.onclick = function() {
            if (paginaIaIntentos < totalPaginas - 1) loadDashboardIntentosOfensivos(paginaIaIntentos + 1);
        };
    }
}

// Recomendaciones del Bot: analiza intentos ofensivos y muestra sanciones recomendadas (o aplicadas)
window.botRecomendacionesActuales = [];
async function loadBotRecomendaciones() {
    var containerDashboard = document.getElementById('botRecomendacionesDashboard');
    var containerIA = document.getElementById('botRecomendaciones');
    var containers = [containerDashboard, containerIA].filter(Boolean);
    if (containers.length === 0) return;
    function setAll(html) {
        containers.forEach(function(c) { c.innerHTML = html; });
    }
    try {
        var token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
        if (!token) {
            setAll('<p style="color: #718096; margin: 0;">Inicia sesión como administrador para ver las recomendaciones.</p>');
            return;
        }
        var acciones = await analizarIntentosOfensivos(token);
        window.botRecomendacionesActuales = acciones || [];
        if (acciones.length === 0) {
            setAll('<p style="color: #718096; margin: 0;">No hay recomendaciones en este momento. El bot analiza los intentos ofensivos y propondrá advertencias o bans cuando corresponda.</p>');
            return;
        }
        var prioridadColor = { critica: '#c53030', alta: '#c05621', media: '#d69e2e', baja: '#2f8558' };
        var html = '<ul style="list-style: none; padding: 0; margin: 0;">';
        acciones.forEach(function(accion, index) {
            var color = prioridadColor[accion.prioridad] || '#4a5568';
            var tipoTexto = accion.tipo === 'notificacion' ? 'Notificación' : (accion.tipo === 'ban' ? (accion.subtipo === 'permanente' ? 'Ban permanente' : 'Ban temporal (' + (accion.dias || 0) + ' días)') : 'Advertencia');
            var quien = (accion.usuario && (accion.usuario.nombre || accion.usuario.email)) ? escapeHtml(accion.usuario.nombre || accion.usuario.email) : (accion.email ? escapeHtml(accion.email) : (accion.ip ? 'IP: ' + escapeHtml(accion.ip) : '—'));
            html += '<li style="padding: 1rem 0; border-bottom: 1px solid #e2e8f0;">';
            html += '<div style="border-left: 4px solid ' + color + '; padding-left: 1rem;">';
            html += '<div style="font-weight: 600; color: #2d3748;">' + tipoTexto + '</div>';
            html += '<div style="font-size: 0.85rem; color: #718096; margin-top: 0.25rem;">' + quien + '</div>';
            html += '<p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">' + escapeHtml(accion.motivo) + '</p>';
            if (accion.razonamiento) html += '<p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #718096;">' + escapeHtml(accion.razonamiento) + '</p>';
            if (accion.tipo === 'ban' || accion.tipo === 'advertencia') {
                var uid = accion.usuario_id || (accion.usuario && accion.usuario.id);
                if (uid) {
                    html += '<p style="margin: 0.5rem 0 0 0;"><button type="button" onclick="window.aplicarSancionBot(' + index + ')" style="padding: 0.4rem 0.75rem; background: #c53030; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">Aplicar esta sanción</button></p>';
                }
            }
            html += '</div></li>';
        });
        html += '</ul>';
        setAll(html);
    } catch (e) {
        setAll('<p style="color: #a0aec0; margin: 0;">No se pudieron cargar las recomendaciones del bot.</p>');
    }
}

window.aplicarSancionBot = async function(index) {
    var accion = window.botRecomendacionesActuales[index];
    if (!accion) return;
    var token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
    if (!token) { alert('Sesión no válida'); return; }
    var uid = accion.usuario_id || (accion.usuario && accion.usuario.id);
    if (!uid) { alert('Usuario no identificado'); return; }
    try {
        var res;
        if (accion.tipo === 'ban') {
            var dias = accion.subtipo === 'permanente' ? null : (accion.dias || 7);
            res = await ejecutarBanAutomatico(uid, accion.subtipo, dias, accion.motivo, token);
        } else if (accion.tipo === 'advertencia') {
            res = await ejecutarAdvertenciaAutomatica(uid, accion.motivo, token);
        } else {
            return;
        }
        if (res && res.success) {
            alert('Sanción aplicada correctamente.');
            loadBotRecomendaciones();
            if (typeof loadUsuarios === 'function') loadUsuarios();
        } else {
            alert(res && res.message ? res.message : 'Error al aplicar la sanción.');
        }
    } catch (err) {
        alert('Error: ' + (err.message || err));
    }
};

// EJECUTAR DIRECTAMENTE cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof loadDashboard === 'function') {
                loadDashboard();
            }
        }, 1000);
    });
} else {
    setTimeout(() => {
        if (typeof loadDashboard === 'function') {
            loadDashboard();
        }
    }, 1000);
}

async function loadCharts(stats) {
    if (!document.getElementById('chartCategorias') || !document.getElementById('chartMeses')) return;
    try {
        const response = await fetch(`${getApiBaseUrl()}?action=get_all_registros`);
        const data = await response.json();
        if (data.success && data.records) {
            renderChartCategorias(data.records);
            renderChartMeses(data.records);
        } else {
            document.getElementById('chartCategorias').innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">No hay datos disponibles</p>';
            document.getElementById('chartMeses').innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">No hay datos disponibles</p>';
        }
    } catch (error) {
        document.getElementById('chartCategorias').innerHTML = '<p style="color: #d32f2f; text-align: center; padding: 2rem;">Error al cargar gráfico</p>';
        document.getElementById('chartMeses').innerHTML = '<p style="color: #d32f2f; text-align: center; padding: 2rem;">Error al cargar gráfico</p>';
    }
}

// Función para generar datos de ejemplo (SOLO PARA VISUALIZACIÓN)
function generateSampleData() {
    // Categorías de ejemplo
    const categoriasEjemplo = [
        'Gestión Administrativa y Organizativa',
        'Conservación de Ecosistemas',
        'Educación Ambiental',
        'Investigación Científica',
        'Manejo de Recursos Naturales',
        'Monitoreo y Evaluación',
        'Participación Comunitaria',
        'Restauración Ecológica'
    ];
    
    // Generar registros de ejemplo por categoría
    const registrosEjemplo = [];
    
    categoriasEjemplo.forEach((categoria, index) => {
        const cantidad = Math.floor(Math.random() * 50) + 10; // Entre 10 y 60 registros
        
        for (let i = 0; i < cantidad; i++) {
            // Generar fecha aleatoria en los últimos 12 meses
            const mesesAtras = Math.floor(Math.random() * 12);
            const fecha = new Date();
            fecha.setMonth(fecha.getMonth() - mesesAtras);
            fecha.setDate(Math.floor(Math.random() * 28) + 1); // Día aleatorio del mes
            
            registrosEjemplo.push({
                id: i + 1,
                categoria_nombre: categoria,
                fecha: fecha.toISOString().split('T')[0],
                fecha_creacion: fecha.toISOString()
            });
        }
    });
    
    return registrosEjemplo;
}

// Función para mostrar gráficas con datos de ejemplo
function previewChartsWithSampleData() {

    const sampleData = generateSampleData();
    
    // Renderizar gráficas con datos de ejemplo
    renderChartCategorias(sampleData);
    renderChartMeses(sampleData);
    
    // Mostrar mensaje informativo
    const message = document.createElement('div');
    message.style.cssText = 'position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #805ad5 0%, #9f7aea 100%); color: white; padding: 1rem 1.5rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 10000; font-weight: 600; max-width: 300px;';
    message.innerHTML = '📊 <strong>Vista previa</strong><br><small style="opacity: 0.9;">Datos de ejemplo - No se guardó nada</small>';
    
    document.body.appendChild(message);
    
    // Remover mensaje después de 4 segundos
    setTimeout(() => {
        message.style.transition = 'opacity 0.5s ease';
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 500);
    }, 4000);
    
    // Cambiar texto del botón temporalmente
    const btn = document.getElementById('btnPreviewCharts');
    const originalText = btn.innerHTML;
    btn.innerHTML = '✅ Datos de Ejemplo Cargados';
    btn.style.background = 'linear-gradient(135deg, #38a169 0%, #48bb78 100%)';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = 'linear-gradient(135deg, #805ad5 0%, #9f7aea 100%)';
    }, 3000);
}

function renderChartCategorias(registros) {
    const container = document.getElementById('chartCategorias');
    if (!container) return;
    
    // Contar registros por categoría
    const categoriasCount = {};
    registros.forEach(reg => {
        const catNombre = reg.categoria_nombre || 'Sin categoría';
        categoriasCount[catNombre] = (categoriasCount[catNombre] || 0) + 1;
    });
    
    // Ordenar por cantidad (descendente) - mostrar todas
    const sortedCategorias = Object.entries(categoriasCount)
        .sort((a, b) => b[1] - a[1]);
    
    if (sortedCategorias.length === 0) {
        container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 400px; color: #999;"><p>No hay registros por categoría</p></div>';
        return;
    }
    
    const maxValue = Math.max(...sortedCategorias.map(([_, count]) => count));
    const total = sortedCategorias.reduce((sum, [_, count]) => sum + count, 0);
    
    // Colores profesionales
    const colors = [
        { gradient: 'linear-gradient(180deg, #2c7a7b 0%, #38a169 100%)', solid: '#2c7a7b', light: '#e6fffa' },
        { gradient: 'linear-gradient(180deg, #3182ce 0%, #4299e1 100%)', solid: '#3182ce', light: '#ebf8ff' },
        { gradient: 'linear-gradient(180deg, #805ad5 0%, #9f7aea 100%)', solid: '#805ad5', light: '#faf5ff' },
        { gradient: 'linear-gradient(180deg, #d69e2e 0%, #f6ad55 100%)', solid: '#d69e2e', light: '#fffaf0' },
        { gradient: 'linear-gradient(180deg, #e53e3e 0%, #fc8181 100%)', solid: '#e53e3e', light: '#fff5f5' },
        { gradient: 'linear-gradient(180deg, #dd6b20 0%, #f6ad55 100%)', solid: '#dd6b20', light: '#fffaf0' },
        { gradient: 'linear-gradient(180deg, #319795 0%, #4fd1c7 100%)', solid: '#319795', light: '#e6fffa' },
        { gradient: 'linear-gradient(180deg, #0987a0 0%, #0bc5ea 100%)', solid: '#0987a0', light: '#e6fffa' }
    ];
    
    // Altura máxima del gráfico
    const chartHeight = 300;
    // Ancho fijo para todas las barras - todas iguales
    const barWidth = 60; // Ancho fijo para todas las barras
    
    let html = `
        <div style="padding: 0; width: 100%; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                <div>
                    <p style="margin: 0; color: #718096; font-size: 0.85rem; font-weight: 500;">Total de registros: <strong style="color: #2d3748;">${total}</strong></p>
                </div>
            </div>
            <!-- Gráfico de barras verticales -->
            <div style="background: #f7fafc; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: inset 0 2px 8px rgba(0,0,0,0.05); overflow: hidden; width: 100%; box-sizing: border-box;">
                <div style="display: flex; align-items: flex-end; justify-content: space-between; height: ${chartHeight}px; position: relative; padding: 0; width: 100%;">
                    <!-- Línea base visible para alinear todas las barras -->
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #4a5568; z-index: 1; box-shadow: 0 1px 2px rgba(0,0,0,0.1);"></div>
    `;
    
    sortedCategorias.forEach(([nombre, count], index) => {
        const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0;
        const barHeight = Math.max(20, (percentage / 100) * (chartHeight - 100)); // Altura mínima de 20px, ajustada para la línea base
        const color = colors[index % colors.length];
        // Mostrar nombres completos con saltos de línea automáticos - sin truncar
        const nombreDisplay = escapeHtml(nombre);
        
        html += `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; position: relative; z-index: 2; height: ${chartHeight}px; flex: 1; min-width: 0; padding: 0 0.25rem; box-sizing: border-box;" 
                 onmouseover="const tip = this.querySelector('.bar-tooltip'); const bar = this.querySelector('.bar'); if(tip) tip.style.display='block'; if(bar) bar.style.transform='scaleY(1.05)';" 
                 onmouseout="const tip = this.querySelector('.bar-tooltip'); const bar = this.querySelector('.bar'); if(tip) tip.style.display='none'; if(bar) bar.style.transform='scaleY(1)';">
                <!-- Tooltip -->
                <div class="bar-tooltip" style="position: absolute; bottom: ${barHeight + 50}px; left: 50%; transform: translateX(-50%); background: #1a202c; color: white; padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: none; z-index: 10; pointer-events: none; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.25rem;">${count}</div>
                        <div style="font-size: 0.75rem; opacity: 0.9; white-space: normal; word-wrap: break-word; max-width: 180px;">${escapeHtml(nombre)}</div>
                    </div>
                    <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #1a202c;"></div>
                </div>
                
                <!-- Número sobre la barra -->
                <div style="position: absolute; bottom: ${barHeight + 25}px; left: 50%; transform: translateX(-50%); font-size: 0.85rem; font-weight: 700; color: ${color.solid}; white-space: nowrap; z-index: 3; text-shadow: 0 1px 2px rgba(255,255,255,0.8);">${count}</div>
                
                <!-- Barra -->
                <div class="bar" style="width: ${barWidth}px; height: ${barHeight}px; min-height: 20px; background: ${color.gradient}; border-radius: 8px 8px 0 0; margin-bottom: 0; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15); position: relative; cursor: pointer; flex-shrink: 0; align-self: flex-end;">
                </div>
                
                <!-- Etiqueta -->
                <div style="font-size: 0.7rem; color: #718096; text-align: center; font-weight: 600; line-height: 1.2; width: 100%; word-wrap: break-word; margin-top: 0.1rem; padding: 0; cursor: help; white-space: normal; overflow-wrap: break-word; hyphens: auto; box-sizing: border-box;" title="${escapeHtml(nombre)}">
                    ${nombreDisplay}
                </div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
            
            <!-- Leyenda detallada -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; width: 100%; box-sizing: border-box;">
    `;
    
    sortedCategorias.forEach(([nombre, count], index) => {
        const percentageOfTotal = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
        const color = colors[index % colors.length];
        
        html += `
            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: white; border-radius: 8px; border-left: 4px solid ${color.solid}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="width: 12px; height: 12px; background: ${color.gradient}; border-radius: 3px; flex-shrink: 0;"></div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: #2d3748; font-size: 0.9rem; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(nombre)}">
                        ${escapeHtml(nombre.length > 30 ? nombre.substring(0, 27) + '...' : nombre)}
                    </div>
                    <div style="font-size: 0.8rem; color: #718096;">
                        ${count} ${count === 1 ? 'registro' : 'registros'} • ${percentageOfTotal}%
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function renderChartMeses(registros) {
    const container = document.getElementById('chartMeses');
    if (!container) return;
    
    // Contar registros por mes
    const mesesCount = {};
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    registros.forEach(reg => {
        if (reg.fecha || reg.fecha_creacion) {
            const fecha = new Date(reg.fecha || reg.fecha_creacion);
            if (!isNaN(fecha.getTime())) {
                const mes = fecha.getMonth(); // 0-11
                const año = fecha.getFullYear();
                const key = `${año}-${String(mes + 1).padStart(2, '0')}`;
                const label = `${mesesCortos[mes]} ${año}`;
                const labelCompleto = `${mesesNombres[mes]} ${año}`;
                
                if (!mesesCount[key]) {
                    mesesCount[key] = { label, labelCompleto, count: 0, mes, año };
                }
                mesesCount[key].count++;
            }
        }
    });
    
    // Ordenar por fecha (ascendente) y tomar últimos 12 meses
    const sortedMeses = Object.entries(mesesCount)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12); // Últimos 12 meses
    
    if (sortedMeses.length === 0) {
        container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 400px; color: #999;"><p>No hay registros por mes</p></div>';
        return;
    }
    
    const maxValue = Math.max(...sortedMeses.map(([_, data]) => data.count));
    const total = sortedMeses.reduce((sum, [_, data]) => sum + data.count, 0);
    
    // Colores con gradiente teal
    const gradientColor = 'linear-gradient(180deg, #2c7a7b 0%, #38a169 100%)';
    const solidColor = '#2c7a7b';
    
    // Altura máxima del gráfico
    const chartHeight = 300;
    const barWidth = Math.max(30, (100 / sortedMeses.length) - 1.5); // Ancho dinámico
    const spacing = 5;
    
    let html = `
        <div style="padding: 0; width: 100%; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div>
                    <p style="margin: 0; color: #718096; font-size: 0.85rem; font-weight: 500;">Total de registros: <strong style="color: #2d3748;">${total}</strong></p>
                </div>
            </div>
            <!-- Gráfico de barras verticales -->
            <div style="background: #f7fafc; border-radius: 12px; padding: 1.5rem 1.5rem 1.5rem 3rem; margin-bottom: 1.5rem; box-shadow: inset 0 2px 8px rgba(0,0,0,0.05); position: relative; overflow: hidden; width: 100%; box-sizing: border-box;">
                <div style="display: flex; align-items: flex-end; justify-content: space-around; height: ${chartHeight}px; position: relative; padding: 0 1rem;">
                    <!-- Línea de fondo para escala -->
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: #cbd5e0; z-index: 1;"></div>
                    
                    <!-- Líneas de referencia horizontales y etiquetas del eje Y -->
                    ${maxValue > 0 ? Array.from({length: 5}, (_, i) => {
                        // i=0 es el valor máximo (arriba), i=4 es 0 (abajo)
                        const value = Math.ceil((maxValue / 4) * (4 - i));
                        // Calcular posición desde abajo: i=0 está arriba (chartHeight-80), i=4 está abajo (0)
                        const yPos = ((4 - i) / 4) * (chartHeight - 80);
                        return `
                            <div style="position: absolute; left: 0; right: 0; bottom: ${yPos}px; height: 1px; background: #e2e8f0; z-index: 1; opacity: 0.5;"></div>
                            <div style="position: absolute; left: -2.5rem; bottom: ${yPos}px; margin-bottom: -0.5px; font-size: 0.75rem; color: #a0aec0; font-weight: 600; width: 40px; text-align: right; line-height: 0.75rem; height: 0.75rem; z-index: 2; display: flex; align-items: center; justify-content: flex-end;">${value}</div>
                        `;
                    }).join('') : ''}
    `;
    
    sortedMeses.forEach(([_, data], index) => {
        const percentage = maxValue > 0 ? (data.count / maxValue) * 100 : 0;
        const barHeight = Math.max(20, (percentage / 100) * (chartHeight - 80)); // Altura mínima de 20px
        
        html += `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; margin: 0 ${spacing}px; position: relative; z-index: 2; height: ${chartHeight}px;" 
                 onmouseover="const tip = this.querySelector('.bar-tooltip'); const bar = this.querySelector('.bar'); if(tip) tip.style.display='block'; if(bar) bar.style.transform='scaleY(1.05)';" 
                 onmouseout="const tip = this.querySelector('.bar-tooltip'); const bar = this.querySelector('.bar'); if(tip) tip.style.display='none'; if(bar) bar.style.transform='scaleY(1)';">
                <!-- Tooltip -->
                <div class="bar-tooltip" style="position: absolute; bottom: ${barHeight + 50}px; left: 50%; transform: translateX(-50%); background: #1a202c; color: white; padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: none; z-index: 10; pointer-events: none;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.25rem;">${data.count}</div>
                        <div style="font-size: 0.75rem; opacity: 0.9;">${escapeHtml(data.labelCompleto)}</div>
                    </div>
                    <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #1a202c;"></div>
                </div>
                
                <!-- Número sobre la barra -->
                <div style="position: absolute; bottom: ${barHeight + 25}px; left: 50%; transform: translateX(-50%); font-size: 0.85rem; font-weight: 700; color: ${solidColor}; white-space: nowrap; z-index: 3; text-shadow: 0 1px 2px rgba(255,255,255,0.8);">${data.count}</div>
                
                <!-- Barra -->
                <div class="bar" style="width: ${barWidth}%; max-width: 50px; min-width: 25px; height: ${barHeight}px; min-height: 20px; background: ${gradientColor}; border-radius: 8px 8px 0 0; margin-bottom: 0.5rem; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(44, 122, 123, 0.25); position: relative; cursor: pointer;">
                </div>
                
                <!-- Etiqueta -->
                <div style="font-size: 0.7rem; color: #718096; text-align: center; font-weight: 600; line-height: 1.2; max-width: 70px; word-wrap: break-word; margin-top: 0.25rem;" title="${escapeHtml(data.labelCompleto)}">
                    ${escapeHtml(data.label)}
                </div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
            
            <!-- Resumen de meses -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; width: 100%; box-sizing: border-box;">
    `;
    
    sortedMeses.forEach(([_, data], index) => {
        const percentageOfTotal = total > 0 ? ((data.count / total) * 100).toFixed(1) : 0;
        
        html += `
            <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: white; border-radius: 8px; border-left: 3px solid ${solidColor}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="width: 8px; height: 8px; background: ${gradientColor}; border-radius: 50%; flex-shrink: 0;"></div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: #2d3748; font-size: 0.85rem; margin-bottom: 0.15rem;">
                        ${escapeHtml(data.labelCompleto)}
                    </div>
                    <div style="font-size: 0.75rem; color: #718096;">
                        ${data.count} ${data.count === 1 ? 'registro' : 'registros'} • ${percentageOfTotal}%
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ==================== USUARIOS ====================
// Exportar función al scope global
window.loadUsuarios = async function loadUsuarios() {

    // Asegurar que la sección esté visible primero
    const usuariosSection = document.getElementById('usuarios');
    if (usuariosSection) {
        usuariosSection.classList.add('active');
    }
    
    // Esperar un momento para asegurar que el DOM esté listo
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let tbody = document.getElementById('usuariosTableBody');

    if (!tbody) {

        await new Promise(resolve => setTimeout(resolve, 300));
        tbody = document.getElementById('usuariosTableBody');
        if (!tbody) {

            alert('Error: No se pudo encontrar el elemento de usuarios. Recarga la página.');
            return;
        }
    }
    
    tbody.innerHTML = '<tr><td colspan="8" class="loading">Cargando usuarios...</td></tr>';
    
    try {
        const apiUrl = `${getApiBaseUrl()}?action=get_all_usuarios`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        if (data.success && data.usuarios) {
            allUsers = data.usuarios || [];

            renderUsuarios(allUsers);
            populateUserFilter();
            // Configurar event listeners de búsqueda después de cargar usuarios
            setupUserSearchListeners();

        } else {

            tbody.innerHTML = `<tr><td colspan="8" class="loading">Error: ${data.message || 'Error al cargar usuarios'}</td></tr>`;
        }
    } catch (error) {

        tbody.innerHTML = `<tr><td colspan="8" class="loading">Error de conexión: ${error.message}</td></tr>`;
    }
}

async function renderUsuarios(usuarios) {
    const tbody = document.getElementById('usuariosTableBody');
    
    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading">No hay usuarios</td></tr>';
        return;
    }
    
    // Cargar información de advertencias y bans para cada usuario
    const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
    if (!token) {

        tbody.innerHTML = '<tr><td colspan="9" class="loading">Error: No autenticado</td></tr>';
        return;
    }
    
    const usuariosConInfo = await Promise.all(usuarios.map(async (user) => {
        if (user.rol === 'admin') {
            return { ...user, advertencias: 0, bans_temporales: 0, ban_permanente: false };
        }
        
        try {
            const response = await fetch(`${getApiBaseUrl()}?action=get_usuario_info&token=${token}&usuario_id=${user.id}`);
            const data = await response.json();
            if (data.success) {
                return { ...user, ...data };
            }
        } catch (error) {

        }
        return { ...user, advertencias: 0, bans_temporales: 0, ban_permanente: false };
    }));
    
    tbody.innerHTML = usuariosConInfo.map(user => {
        let estadoBadge = '';
        if (user.ban_permanente) {
            estadoBadge = '<span class="badge badge-danger">Ban Permanente</span>';
        } else if (user.bans_temporales > 0) {
            estadoBadge = `<span class="badge badge-warning">${user.bans_temporales} Ban${user.bans_temporales > 1 ? 's' : ''} Temporal${user.bans_temporales > 1 ? 'es' : ''}</span>`;
        } else if (user.advertencias > 0) {
            estadoBadge = `<span class="badge badge-info">${user.advertencias} Advertencia${user.advertencias > 1 ? 's' : ''}</span>`;
        } else {
            estadoBadge = '<span class="badge badge-success">Sin sanciones</span>';
        }
        
        // Verificar si el usuario es admin (comparación más robusta)
        const isAdmin = user.rol === 'admin' || user.rol === 'administrador' || user.rol === 'Administrador';
        
        return `
        <tr>
            <td>${user.id}</td>
            <td>${escapeHtml(user.nombre)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="badge ${isAdmin ? 'badge-primary' : 'badge-secondary'}">${user.rol}</span></td>
            <td><span class="badge ${user.activo ? 'badge-success' : 'badge-danger'}">${user.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td>${estadoBadge}</td>
            <td>${formatDate(user.fecha_registro)}</td>
            <td>${user.fecha_ultimo_acceso ? formatDate(user.fecha_ultimo_acceso) : 'Nunca'}</td>
            <td class="action-buttons">
                <button class="btn-icon edit" onclick="editUser(${user.id})" title="Editar">✏️</button>
                ${!isAdmin ? 
                    `<button class="btn-icon warning" onclick="showAdvertenciaModal(${user.id})" title="Dar Advertencia">⚠️</button>
                     <button class="btn-icon ban" onclick="showBanModal(${user.id})" title="Dar Ban">🚫</button>
                     <button class="btn-icon info" onclick="showUsuarioSanciones(${user.id})" title="Ver Sanciones">📋</button>` : ''
                }
                ${user.activo ? 
                    `<button class="btn-icon delete" onclick="toggleUserStatus(${user.id}, false)" title="Desactivar">🚫</button>` :
                    `<button class="btn-icon activate" onclick="toggleUserStatus(${user.id}, true)" title="Activar">✅</button>`
                }
                ${!isAdmin ? 
                    `<button class="btn-icon delete" onclick="deleteUser(${user.id})" title="Eliminar">🗑️</button>` : ''
                }
            </td>
        </tr>
    `;
    }).join('');
}

// Configurar event listeners de búsqueda de usuarios
function setupUserSearchListeners() {

    // Remover listeners anteriores si existen
    const searchUsers = document.getElementById('searchUsers');
    const filterRol = document.getElementById('filterRol');
    const filterActivo = document.getElementById('filterActivo');
    
    if (searchUsers) {
        // Clonar el elemento para remover listeners anteriores
        const newSearch = searchUsers.cloneNode(true);
        searchUsers.parentNode.replaceChild(newSearch, searchUsers);
        newSearch.addEventListener('input', filterUsuarios);

    } else {

    }
    
    if (filterRol) {
        const newFilterRol = filterRol.cloneNode(true);
        filterRol.parentNode.replaceChild(newFilterRol, filterRol);
        newFilterRol.addEventListener('change', filterUsuarios);

    } else {

    }
    
    if (filterActivo) {
        const newFilterActivo = filterActivo.cloneNode(true);
        filterActivo.parentNode.replaceChild(newFilterActivo, filterActivo);
        newFilterActivo.addEventListener('change', filterUsuarios);

    } else {

    }
}

function filterUsuarios() {

    if (!allUsers || allUsers.length === 0) {

        return;
    }
    
    const searchUsersEl = document.getElementById('searchUsers');
    const filterRolEl = document.getElementById('filterRol');
    const filterActivoEl = document.getElementById('filterActivo');
    
    if (!searchUsersEl || !filterRolEl || !filterActivoEl) {

        return;
    }
    
    const search = searchUsersEl.value.toLowerCase().trim();
    const rol = filterRolEl.value;
    const activo = filterActivoEl.value;

    let filtered = allUsers.filter(user => {
        const matchSearch = !search || 
            (user.nombre && user.nombre.toLowerCase().includes(search)) ||
            (user.email && user.email.toLowerCase().includes(search));
        const matchRol = !rol || user.rol === rol;
        const matchActivo = activo === '' || (user.activo == activo);
        
        return matchSearch && matchRol && matchActivo;
    });

    renderUsuarios(filtered);
}

function populateUserFilter() {
    const select = document.getElementById('filterUsuarioAdmin');
    if (!select) return;
    
    select.innerHTML = '<option value="">Todos los usuarios</option>';
    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.nombre} (${user.email})`;
        select.appendChild(option);
    });
    
    // También poblar el filtro de intentos
    populateUserFilterForIntentos();
}

function populateUserFilterForIntentos() {
    const select = document.getElementById('filterUsuarioIntento');
    if (!select) return;
    
    select.innerHTML = '<option value="">Todos los usuarios</option>';
    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.nombre} (${user.email})`;
        select.appendChild(option);
    });
}

async function editUser(userId) {
    const user = allUsers.find(u => u.id == userId);
    if (!user) return;
    
    const nombreInput = document.getElementById('editUserName');
    const passwordInput = document.getElementById('editUserPassword');
    const passwordLabel = passwordInput.previousElementSibling;
    
    document.getElementById('editUserId').value = user.id;
    nombreInput.value = user.nombre;
    document.getElementById('editUserEmail').value = user.email;
    document.getElementById('editUserRol').value = user.rol;
    document.getElementById('editUserActivo').value = user.activo ? '1' : '0';
    passwordInput.value = '';
    
    // Mostrar/ocultar aviso de campos restringidos
    const noticeDiv = document.getElementById('restrictedFieldsNotice');
    
    // Si el usuario NO es admin, deshabilitar nombre y contraseña
    if (user.rol !== 'admin') {
        if (noticeDiv) noticeDiv.style.display = 'block';
        
        nombreInput.disabled = true;
        nombreInput.style.backgroundColor = '#f5f5f5';
        nombreInput.style.cursor = 'not-allowed';
        nombreInput.title = 'No se puede modificar el apodo de usuarios normales';
        
        passwordInput.disabled = true;
        passwordInput.style.backgroundColor = '#f5f5f5';
        passwordInput.style.cursor = 'not-allowed';
        passwordInput.title = 'No se puede modificar la contraseña de usuarios normales';
        
        if (passwordLabel) {
            passwordLabel.style.color = '#999';
            passwordLabel.title = 'No se puede modificar la contraseña de usuarios normales';
        }
    } else {
        if (noticeDiv) noticeDiv.style.display = 'none';
        
        // Si es admin, habilitar todos los campos
        nombreInput.disabled = false;
        nombreInput.style.backgroundColor = '';
        nombreInput.style.cursor = '';
        nombreInput.title = '';
        
        passwordInput.disabled = false;
        passwordInput.style.backgroundColor = '';
        passwordInput.style.cursor = '';
        passwordInput.title = '';
        
        if (passwordLabel) {
            passwordLabel.style.color = '';
            passwordLabel.title = '';
        }
    }
    
    openModal('editUserModal');
}

async function handleEditUser(e) {
    e.preventDefault();
    
    const currentUser = window.authSystem ? window.authSystem.getCurrentUser() : null;
    if (!currentUser) return;
    
    const userId = document.getElementById('editUserId').value;
    const nombreInput = document.getElementById('editUserName');
    const email = document.getElementById('editUserEmail').value;
    const rol = document.getElementById('editUserRol').value;
    const activo = document.getElementById('editUserActivo').value;
    const passwordInput = document.getElementById('editUserPassword');
    
    // Obtener el usuario original para verificar su rol
    const user = allUsers.find(u => u.id == userId);
    if (!user) {
        alert('Error: Usuario no encontrado');
        return;
    }
    
    // Si el usuario NO es admin, NO permitir cambios en apodo ni contraseña
    let nombre, password;
    
    if (user.rol !== 'admin') {
        // Para usuarios normales: usar valores originales (ignorar cualquier cambio)
        nombre = user.nombre; // Valor original (apodo)
        password = null; // No cambiar contraseña
        
        // Mostrar advertencia si intentaron cambiar algo
        if (nombreInput.value !== user.nombre || passwordInput.value !== '') {
            alert('⚠ Advertencia: Los usuarios normales no pueden modificar su apodo ni contraseña. Solo se actualizarán los demás campos.');
        }
    } else {
        // Para admins: permitir todos los cambios
        nombre = nombreInput.value;
        password = passwordInput.value || null;
    }
    
    try {
        const response = await fetch(`${getApiBaseUrl()}?action=update_usuario&current_user_id=` + currentUser.id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: userId,
                nombre,
                email,
                rol,
                activo: activo === '1',
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Usuario actualizado exitosamente');
            closeModal('editUserModal');
            loadUsuarios();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {

        alert('Error al actualizar usuario');
    }
}

function showAddUserModal() {
    document.getElementById('addUserForm').reset();
    openModal('addUserModal');
}

async function handleAddUser(e) {
    e.preventDefault();
    
    const currentUser = window.authSystem ? window.authSystem.getCurrentUser() : null;
    if (!currentUser) return;
    
    const nombre = document.getElementById('addUserName').value;
    const email = document.getElementById('addUserEmail').value;
    const password = document.getElementById('addUserPassword').value;
    const rol = document.getElementById('addUserRol').value;
    
    try {
        const response = await fetch(`${getApiBaseUrl()}?action=create_usuario&current_user_id=` + currentUser.id, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password, rol })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Usuario creado exitosamente');
            closeModal('addUserModal');
            loadUsuarios();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {

        alert('Error al crear usuario');
    }
}

async function toggleUserStatus(userId, activo) {
    if (!confirm(`¿Estás seguro de ${activo ? 'activar' : 'desactivar'} este usuario?`)) {
        return;
    }
    
    const currentUser = window.authSystem ? window.authSystem.getCurrentUser() : null;
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${getApiBaseUrl()}?action=update_usuario&current_user_id=` + currentUser.id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, activo })
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadUsuarios();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {

        alert('Error al actualizar usuario');
    }
}

async function deleteUser(userId) {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
        return;
    }
    
    const adminToken = adminAuthSystem.getToken();
    if (!adminToken) {
        alert('No autorizado');
        return;
    }
    
    try {
        const response = await fetch(`${getApiBaseUrl()}?action=delete_usuario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, token: adminToken })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Usuario eliminado exitosamente');
            loadUsuarios();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {

        alert('Error al eliminar usuario');
    }
}

// Función para limpiar usuarios masivamente (dejar solo 5)
async function limpiarUsuarios() {

    if (!confirm('⚠️ ADVERTENCIA: Esto eliminará TODOS los usuarios excepto los 5 más recientes y los administradores.\n\n¿Estás completamente seguro?')) {

        return;
    }
    
    if (!confirm('Esta acción NO SE PUEDE DESHACER. ¿Continuar?')) {

        return;
    }

    const adminToken = window.adminAuthSystem ? window.adminAuthSystem.getToken() : (typeof adminAuthSystem !== 'undefined' ? adminAuthSystem.getToken() : null);
    
    if (!adminToken) {

        alert('No autorizado. Por favor, inicia sesión como administrador.');
        return;
    }

    const apiUrl = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '../api/api.php';

    try {
        const response = await fetch(`${apiUrl}?action=limpiar_usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: adminToken })
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ ${data.message}`);
            if (typeof loadUsuarios === 'function') {
                loadUsuarios();
            } else if (typeof window.loadUsuarios === 'function') {
                window.loadUsuarios();
            }
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {

        alert('Error al limpiar usuarios: ' + error.message);
    }
}

// Exportar función al scope global
window.limpiarUsuarios = limpiarUsuarios;

// ==================== REGISTROS ====================
let searchTimeout = null;

// Exportar función al scope global
window.loadAllRegistros = async function loadAllRegistros() {

    // Asegurar que la sección esté visible primero
    const registrosSection = document.getElementById('registros');
    if (registrosSection) {
        registrosSection.classList.add('active');
    }
    
    // Esperar un momento para asegurar que el DOM esté listo
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let grid = document.getElementById('registrosGrid');

    if (!grid) {

        await new Promise(resolve => setTimeout(resolve, 300));
        grid = document.getElementById('registrosGrid');
        if (!grid) {

            alert('Error: No se pudo encontrar el elemento de registros. Recarga la página.');
            return;
        }
    }
    
    grid.innerHTML = '<div class="loading-state">Cargando registros...</div>';
    
    try {
        const search = document.getElementById('searchRegistros')?.value.trim() || '';
        const categoriaId = document.getElementById('filterCategoriaAdmin')?.value || '';
        const usuarioId = document.getElementById('filterUsuarioAdmin')?.value || '';
        
        let url = `${getApiBaseUrl()}?action=get_all_registros`;
        if (search) url += '&search=' + encodeURIComponent(search);
        if (categoriaId) url += '&categoria_id=' + encodeURIComponent(categoriaId);
        if (usuarioId) url += '&usuario_id=' + encodeURIComponent(usuarioId);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        if (data.success && data.records) {
            allRegistros = data.records || [];

            renderRegistros(allRegistros);

        } else {

            grid.innerHTML = '<div class="loading-state">Error: ' + (data.message || 'Error al cargar registros') + '</div>';
        }
    } catch (error) {

        grid.innerHTML = `<div class="loading-state">Error de conexión: ${error.message}</div>`;
    }
}

function renderRegistros(registros) {
    const grid = document.getElementById('registrosGrid');
    if (!grid) return;
    
    if (registros.length === 0) {
        grid.innerHTML = '<div class="empty-state"><h3>No se encontraron registros</h3><p>Intenta cambiar los filtros de búsqueda</p></div>';
        return;
    }
    
    // Renderizar registros
    grid.innerHTML = registros.map(record => {
        const previewImage = record.media_preview && record.media_preview.length > 0 ? record.media_preview[0].datos_base64 : null;
        
        return `
        <div class="record-card">
            ${previewImage ? `
            <div class="record-image-preview">
                <img src="${previewImage}" alt="Preview" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0;">
            </div>
            ` : ''}
            <div class="record-header">
                <h3>${escapeHtml(record.nombre || record.descripcion_breve || record.tipo_actividad || 'Sin título')}</h3>
                <div class="record-actions">
                    <button class="btn-icon edit" onclick="editRecordAdmin(${record.id})" title="Editar">✏️</button>
                    <button class="btn-icon delete" onclick="deleteRecordAdmin(${record.id})" title="Eliminar">🗑️</button>
                </div>
            </div>
            <div class="record-body">
                ${record.especie ? `<p><strong>Especie:</strong> ${escapeHtml(record.especie)}</p>` : ''}
                ${record.categoria_nombre ? `<p><strong>Categoría:</strong> ${escapeHtml(record.categoria_nombre)}</p>` : ''}
                ${record.subcategoria_nombre ? `<p><strong>Subcategoría:</strong> ${escapeHtml(record.subcategoria_nombre)}</p>` : ''}
                ${record.fecha ? `<p><strong>Fecha:</strong> ${formatDate(record.fecha)}</p>` : ''}
                ${record.usuario_nombre ? `<p><strong>Usuario:</strong> ${escapeHtml(record.usuario_nombre)}</p>` : ''}
                ${record.has_media ? `<p><strong>Media:</strong> ${record.media_count} archivo(s)${record.media_count > 1 ? ' (mostrando preview)' : ''}</p>` : ''}
            </div>
        </div>
        `;
    }).join('');
}

function filterRegistros() {
    // Limpiar timeout anterior
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Debounce: esperar 500ms después de que el usuario deje de escribir
    searchTimeout = setTimeout(() => {
        loadAllRegistros();
    }, 500);
}

// Función para editar registro desde el panel de administración
// EXPONER EN WINDOW para que esté disponible desde onclick en HTML
window.editRecordAdmin = async function editRecordAdmin(recordId) {
    try {
        // Obtener el registro completo desde la API
        const response = await fetch(`${getApiBaseUrl()}?action=get_registros_ambientales&id=${recordId}`);
        const data = await response.json();
        
        if (data.success && data.record) {
            const record = data.record;
            // Guardar TODOS los campos del registro para edición (igual que en script.js)
            const editingRecord = {
                id: record.id,
                usuario_id: record.usuario_id,
                categoria_id: record.categoria_id,
                subcategoria_id: record.subcategoria_id,
                nombre: record.nombre || null,
                especie: record.especie || null,
                fecha: record.fecha,
                hora: record.hora || null,
                responsable: record.responsable || null,
                brigada: record.brigada || null,
                latitud: record.latitud,
                longitud: record.longitud,
                comunidad: record.comunidad || null,
                sitio: record.sitio || null,
                tipo_actividad: record.tipo_actividad || null,
                descripcion_breve: record.descripcion_breve || null,
                observaciones: record.observaciones || null,
                materiales_utilizados: record.materiales_utilizados || null,
                numero_participantes: record.numero_participantes || null,
                notas: record.notas || null,
                media: record.media || [],
                fecha_creacion: record.fecha_creacion
            };
            
            // Guardar en sessionStorage con la clave que espera el formulario
            sessionStorage.setItem('editingRecord', JSON.stringify(editingRecord));
            // Marcar que viene del panel de administración
            sessionStorage.setItem('editingFromAdmin', 'true');

            window.location.href = 'nuevo-registro.html?edit=true';
        } else {
            alert('Error: No se pudo cargar el registro para editar');
        }
    } catch (error) {

        alert('Error de conexión al cargar el registro');
    }
}

// Función para eliminar registro desde el panel de administración
// EXPONER EN WINDOW para que esté disponible desde onclick en HTML
window.deleteRecordAdmin = async function deleteRecordAdmin(recordId) {

    if (!confirm('¿Estás seguro de eliminar este registro?')) {
        return;
    }
    
    // Verificar que adminAuthSystem existe
    if (!window.adminAuthSystem) {

        alert('Error: Sistema de autenticación no disponible. Por favor, recarga la página.');
        return;
    }
    
    // Verificar autenticación
    const isAuth = window.adminAuthSystem.isAuthenticated();
    if (!isAuth) {

        alert('Error: No estás autenticado como administrador. Por favor, inicia sesión nuevamente.');
        return;
    }
    
    // Obtener token del administrador
    const token = window.adminAuthSystem.getToken();
    if (!token) {

        const session = window.adminAuthSystem.getSession();

        alert('Error: No se pudo obtener el token de autenticación. Por favor, recarga la página.');
        return;
    }
    
    const requestBody = { 
        id: recordId,
        token: token,
        is_admin: true
    };

    try {
        const response = await fetch(`${getApiBaseUrl()}?action=delete_record`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();

        let data;
        try {
            data = JSON.parse(responseText);

        } catch (e) {

            alert('Error: Respuesta inválida del servidor.');
            return;
        }
        
        if (data.success) {

            alert('Registro eliminado exitosamente');
            loadAllRegistros();
        } else {

            alert('Error: ' + (data.message || 'Error desconocido al eliminar el registro'));
        }
    } catch (error) {

        alert('Error de conexión al eliminar registro.');
    }
}

// ==================== CATEGORÍAS ====================
// Exportar función al scope global
window.loadCategorias = async function loadCategorias() {

    // Asegurar que la sección esté visible primero
    const categoriasSection = document.getElementById('categorias');
    if (categoriasSection) {
        categoriasSection.classList.add('active');
    }
    
    // Esperar un momento para asegurar que el DOM esté listo
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let container = document.getElementById('categoriasContainer');

    if (!container) {

        await new Promise(resolve => setTimeout(resolve, 300));
        container = document.getElementById('categoriasContainer');
        if (!container) {

            alert('Error: No se pudo encontrar el elemento de categorías. Recarga la página.');
            return;
        }
    }
    
    container.innerHTML = '<div class="loading-state">Cargando categorías...</div>';
    
    try {
        const apiUrl = `${getApiBaseUrl()}?action=get_categorias`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        if (data.success && data.categorias) {
            allCategorias = data.categorias;

            renderCategorias(allCategorias);
            populateCategoriaFilter();

        } else {

            container.innerHTML = `<div class="loading-state">Error: ${data.message || 'Error al cargar categorías'}</div>`;
        }
    } catch (error) {

        container.innerHTML = `<div class="loading-state">Error de conexión: ${error.message}</div>`;
    }
}

function populateCategoriaFilter() {
    const select = document.getElementById('filterCategoriaAdmin');
    if (!select) return;
    
    // Limpiar opciones existentes excepto la primera
    select.innerHTML = '<option value="">Todas las categorías</option>';
    
    if (allCategorias && allCategorias.length > 0) {
        allCategorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nombre;
            select.appendChild(option);
        });
    }
}

function renderCategorias(categorias) {
    const container = document.getElementById('categoriasContainer');
    if (!container) return;
    
    if (!categorias || categorias.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No hay categorías</h3></div>';
        return;
    }
    
    // Agrupar categorías con sus subcategorías
    let html = '<div class="categorias-list">';
    
    categorias.forEach(categoria => {
        html += `
            <div class="categoria-item" style="background: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0; color: #2c7a7b; font-size: 1.2rem;">${escapeHtml(categoria.nombre)}</h3>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-icon edit" onclick="editCategoria(${categoria.id})" title="Editar">✏️</button>
                        <button class="btn-icon delete" onclick="deleteCategoria(${categoria.id})" title="Eliminar">🗑️</button>
                    </div>
                </div>
                <p style="color: #666; margin: 0 0 1rem 0; font-size: 0.9rem;">${escapeHtml(categoria.descripcion || 'Sin descripción')}</p>
                <div class="subcategorias-list" id="subcategorias-${categoria.id}">
                    <div class="loading-state" style="font-size: 0.85rem; color: #999;">Cargando subcategorías...</div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Cargar subcategorías para cada categoría
    categorias.forEach(categoria => {
        loadSubcategoriasForCategoria(categoria.id);
    });
}

async function loadSubcategoriasForCategoria(categoriaId) {
    try {
        const response = await fetch(`${getApiBaseUrl()}?action=get_subcategorias&categoria_id=${categoriaId}`);
        const data = await response.json();
        
        const container = document.getElementById(`subcategorias-${categoriaId}`);
        if (!container) return;
        
        if (data.success && data.subcategorias && data.subcategorias.length > 0) {
            let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 0.75rem;">';
            data.subcategorias.forEach(sub => {
                html += `
                    <div style="background: #f7fafc; padding: 0.75rem; border-radius: 6px; border-left: 3px solid #2c7a7b;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: #333; font-size: 0.9rem;">${escapeHtml(sub.nombre)}</strong>
                                ${sub.descripcion ? `<p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.8rem;">${escapeHtml(sub.descripcion)}</p>` : ''}
                            </div>
                            <div style="display: flex; gap: 0.25rem;">
                                <button class="btn-icon edit" onclick="editSubcategoria(${sub.id})" title="Editar" style="font-size: 0.8rem;">✏️</button>
                                <button class="btn-icon delete" onclick="deleteSubcategoria(${sub.id})" title="Eliminar" style="font-size: 0.8rem;">🗑️</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="color: #999; font-size: 0.85rem; font-style: italic;">No hay subcategorías</p>';
        }
    } catch (error) {

        const container = document.getElementById(`subcategorias-${categoriaId}`);
        if (container) {
            container.innerHTML = '<p style="color: #d32f2f; font-size: 0.85rem;">Error al cargar subcategorías</p>';
        }
    }
}

function editCategoria(id) {
    alert('Función de editar categoría próximamente');
}

function deleteCategoria(id) {
    if (confirm('¿Estás seguro de eliminar esta categoría? Esto también eliminará todas sus subcategorías y registros asociados.')) {
        alert('Función de eliminar categoría próximamente');
    }
}

function editSubcategoria(id) {
    alert('Función de editar subcategoría próximamente');
}

function deleteSubcategoria(id) {
    if (confirm('¿Estás seguro de eliminar esta subcategoría?')) {
        alert('Función de eliminar subcategoría próximamente');
    }
}

function showAddCategoriaModal() {
    alert('Función de agregar categoría próximamente');
}

// ==================== COMENTARIOS ====================
// Exportar función al scope global
window.loadComentarios = async function loadComentarios() {

    // Asegurar que la sección esté visible primero
    const comentariosSection = document.getElementById('comentarios');
    if (comentariosSection) {
        comentariosSection.classList.add('active');
    }
    
    // Esperar un momento para asegurar que el DOM esté listo
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let container = document.getElementById('comentariosContainer');

    if (!container) {

        await new Promise(resolve => setTimeout(resolve, 300));
        container = document.getElementById('comentariosContainer');
        if (!container) {

            alert('Error: No se pudo encontrar el elemento de comentarios. Recarga la página.');
            return;
        }
    }
    
    container.innerHTML = '<div class="loading-state">Cargando comentarios...</div>';
    
    try {
        const apiUrl = `${getApiBaseUrl()}?action=get_all_comentarios`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        if (data.success) {
            allComentarios = data.comentarios || [];

            renderComentarios(allComentarios);

        } else {

            container.innerHTML = `<div class="empty-state"><h3>Error: ${data.message || 'Error al cargar comentarios'}</h3></div>`;
        }
    } catch (error) {

        container.innerHTML = `<div class="empty-state"><h3>Error de conexión: ${error.message}</h3></div>`;
    }
}

function renderComentarios(comentarios) {
    const container = document.getElementById('comentariosContainer');
    if (!container) return;
    
    if (!comentarios || comentarios.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No hay comentarios</h3></div>';
        return;
    }
    
    let html = '<div class="comentarios-list">';
    
    comentarios.forEach(comentario => {
        const activoClass = comentario.activo ? 'badge-success' : 'badge-danger';
        const activoText = comentario.activo ? 'Activo' : 'Inactivo';
        
        html += `
            <div class="comentario-card" style="background: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <strong style="color: #2c7a7b; font-size: 1rem;">${escapeHtml(comentario.usuario_nombre || 'Usuario desconocido')}</strong>
                            <span class="badge ${activoClass}" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">${activoText}</span>
                        </div>
                        <p style="color: #666; font-size: 0.85rem; margin: 0;">
                            Registro ID: ${comentario.registro_id} | ${formatDate(comentario.fecha_creacion)}
                        </p>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        ${comentario.activo ? 
                            `<button class="btn-icon delete" onclick="toggleComentario(${comentario.id}, false)" title="Desactivar">🚫</button>` :
                            `<button class="btn-icon activate" onclick="toggleComentario(${comentario.id}, true)" title="Activar">✅</button>`
                        }
                        <button class="btn-icon delete" onclick="deleteComentario(${comentario.id})" title="Eliminar">🗑️</button>
                    </div>
                </div>
                <div style="background: #f7fafc; padding: 1rem; border-radius: 6px; border-left: 3px solid #2c7a7b;">
                    <p style="margin: 0; color: #333; line-height: 1.6;">${escapeHtml(comentario.comentario || 'Sin comentario')}</p>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

async function toggleComentario(id, activo) {
    if (!confirm(`¿Estás seguro de ${activo ? 'activar' : 'desactivar'} este comentario?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${getApiBaseUrl()}?action=update_comentario`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, activo: activo ? 1 : 0 })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Comentario actualizado exitosamente');
            loadComentarios();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {

        alert('Error al actualizar comentario');
    }
}

async function deleteComentario(id) {
    if (!confirm('¿Estás seguro de eliminar este comentario? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await fetch(`${getApiBaseUrl()}?action=delete_comentario`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Comentario eliminado exitosamente');
            loadComentarios();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {

        alert('Error al eliminar comentario');
    }
}

function filterComentarios() {
    const search = document.getElementById('searchComentarios')?.value.toLowerCase() || '';
    const activo = document.getElementById('filterComentarioActivo')?.value || '';
    
    let filtered = [...allComentarios];
    
    if (search) {
        filtered = filtered.filter(comentario => {
            const texto = (comentario.comentario || '').toLowerCase();
            const usuario = (comentario.usuario_nombre || '').toLowerCase();
            return texto.includes(search) || usuario.includes(search);
        });
    }
    
    if (activo !== '') {
        filtered = filtered.filter(comentario => comentario.activo == activo);
    }
    
    renderComentarios(filtered);
}

// ==================== UTILIDADES ====================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function adminLogout() {
    if (confirm('¿Deseas cerrar sesión como administrador?')) {
        if (window.adminAuthSystem) {
            window.adminAuthSystem.logout();
        }
        window.location.href = 'admin-login.html';
    }
}

// ==================== GESTIÓN DE ADVERTENCIAS Y BANS ====================

async function showAdvertenciaModal(usuarioId) {
    const user = allUsers.find(u => u.id == usuarioId);
    if (!user) return;
    
    document.getElementById('advertenciaUsuarioId').value = usuarioId;
    document.getElementById('advertenciaUsuarioNombre').value = `${user.nombre} (${user.email})`;
    document.getElementById('advertenciaMotivo').value = '';
    
    openModal('advertenciaModal');
}

async function handleDarAdvertencia(e) {
    e.preventDefault();
    
    const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
    if (!token) {
        alert('No estás autenticado');
        return;
    }
    
    const usuarioId = document.getElementById('advertenciaUsuarioId').value;
    const motivo = document.getElementById('advertenciaMotivo').value.trim();
    
    if (!motivo) {
        alert('Debes especificar un motivo');
        return;
    }
    
    try {
        const response = await fetch(`${getApiBaseUrl()}?action=dar_advertencia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, usuario_id: usuarioId, motivo })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            closeModal('advertenciaModal');
            loadUsuarios();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {

        alert('Error de conexión');
    }
}

async function showBanModal(usuarioId) {
    const user = allUsers.find(u => u.id == usuarioId);
    if (!user) return;
    
    document.getElementById('banUsuarioId').value = usuarioId;
    document.getElementById('banUsuarioNombre').value = `${user.nombre} (${user.email})`;
    document.getElementById('banTipo').value = 'temporal';
    document.getElementById('banDias').value = 7;
    document.getElementById('banMotivo').value = '';
    
    updateBanDiasVisibility();
    openModal('banModal');
}

function updateBanDiasVisibility() {
    const banTipo = document.getElementById('banTipo');
    const diasGroup = document.getElementById('banDiasGroup');
    const banDias = document.getElementById('banDias');
    
    if (!banTipo || !diasGroup || !banDias) {

        return;
    }
    
    const tipo = banTipo.value;

    if (tipo === 'permanente') {
        diasGroup.style.display = 'none';
        banDias.removeAttribute('required');
        banDias.value = ''; // Limpiar el valor cuando es permanente

    } else {
        diasGroup.style.display = 'block';
        banDias.setAttribute('required', 'required');
        if (!banDias.value || banDias.value === '') {
            banDias.value = '7'; // Valor por defecto si está vacío
        }

    }
}

async function handleDarBan(e) {
    e.preventDefault();
    e.stopPropagation();

    const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
    if (!token) {
        alert('No estás autenticado');
        return false;
    }
    
    const usuarioId = document.getElementById('banUsuarioId').value;
    const tipo = document.getElementById('banTipo').value;
    const dias = tipo === 'temporal' ? parseInt(document.getElementById('banDias').value) : null;
    const motivo = document.getElementById('banMotivo').value.trim();

    if (!motivo) {
        alert('Debes especificar un motivo');
        return false;
    }
    
    if (tipo === 'temporal' && (!dias || dias < 1)) {
        alert('Debes especificar una duración válida');
        return false;
    }
    
    if (tipo === 'permanente' && dias) {

        // No hacer nada, simplemente ignorar el valor de días
    }
    
    if (!confirm(`¿Estás seguro de aplicar un ban ${tipo === 'permanente' ? 'permanente' : `temporal de ${dias} días`} a este usuario?`)) {
        return false;
    }
    
    try {

        const response = await fetch(`${getApiBaseUrl()}?action=dar_ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, usuario_id: usuarioId, tipo, dias: tipo === 'temporal' ? dias : null, motivo })
        });
        
        const data = await response.json();

        if (data.success) {
            alert(data.message);
            closeModal('banModal');
            // Recargar usuarios sin cambiar de sección
            await loadUsuarios();

        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {

        alert('Error de conexión');
    }
    
    return false; // Prevenir cualquier redirección
}

async function showUsuarioSanciones(usuarioId) {
    const user = allUsers.find(u => u.id == usuarioId);
    if (!user) return;
    
    const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
    if (!token) {
        alert('No estás autenticado');
        return;
    }
    
    // Guardar el usuarioId en un campo oculto para poder recuperarlo después
    if (!document.getElementById('sancionesUsuarioId')) {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = 'sancionesUsuarioId';
        document.getElementById('sancionesModal').querySelector('.modal-content').appendChild(hiddenInput);
    }
    document.getElementById('sancionesUsuarioId').value = usuarioId;
    
    // Cargar información del usuario
    try {
        const infoResponse = await fetch(`${getApiBaseUrl()}?action=get_usuario_info&token=${token}&usuario_id=${usuarioId}`);
        const infoData = await infoResponse.json();
        
        if (infoData.success) {
            const infoHtml = `
                <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <strong>Usuario:</strong> ${escapeHtml(infoData.usuario.nombre)} (${escapeHtml(infoData.usuario.email)})<br>
                    <strong>Advertencias activas:</strong> ${infoData.advertencias}<br>
                    <strong>Bans temporales activos:</strong> ${infoData.bans_temporales}<br>
                    <strong>Ban permanente:</strong> ${infoData.ban_permanente ? 'Sí' : 'No'}
                </div>
            `;
            document.getElementById('sancionesUsuarioInfo').innerHTML = infoHtml;
        }
    } catch (error) {

    }
    
    // Cargar advertencias
    try {
        const advertenciasResponse = await fetch(`${getApiBaseUrl()}?action=listar_advertencias&token=${token}&usuario_id=${usuarioId}`);
        const advertenciasData = await advertenciasResponse.json();
        
        if (advertenciasData.success) {
            const advertenciasHtml = advertenciasData.advertencias.length > 0 ?
                advertenciasData.advertencias.map(adv => `
                    <div style="background: white; border-left: 4px solid #ff9800; padding: 1rem; margin-bottom: 0.5rem; border-radius: 4px;">
                        <div style="font-weight: 600; margin-bottom: 0.5rem;">${escapeHtml(adv.motivo)}</div>
                        <div style="font-size: 0.85rem; color: #666;">
                            Por: ${escapeHtml(adv.admin_nombre || 'Admin')} • 
                            ${formatDate(adv.fecha_advertencia)}
                            ${adv.activa ? '' : ' <span style="color: #999;">(Eliminada)</span>'}
                        </div>
                        ${adv.activa ? `<button onclick="eliminarAdvertencia(${adv.id})" style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; background: #d32f2f; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Eliminar</button>` : ''}
                    </div>
                `).join('') :
                '<p style="color: #999; text-align: center; padding: 1rem;">No hay advertencias</p>';
            
            document.getElementById('sancionesAdvertencias').innerHTML = advertenciasHtml;
        }
    } catch (error) {

        document.getElementById('sancionesAdvertencias').innerHTML = '<p style="color: #d32f2f;">Error al cargar advertencias</p>';
    }
    
    // Cargar bans
    try {
        const bansResponse = await fetch(`${getApiBaseUrl()}?action=listar_bans&token=${token}&usuario_id=${usuarioId}`);
        const bansData = await bansResponse.json();
        
        if (bansData.success) {
            // Filtrar para mostrar solo un ban permanente activo (el más reciente)
            let bansFiltrados = bansData.bans;
            const bansPermanentesActivos = bansData.bans.filter(b => b.activo && b.tipo === 'permanente');
            if (bansPermanentesActivos.length > 1) {
                // Si hay múltiples bans permanentes activos, mostrar solo el más reciente
                const banPermanenteMasReciente = bansPermanentesActivos.sort((a, b) => 
                    new Date(b.fecha_inicio) - new Date(a.fecha_inicio)
                )[0];
                bansFiltrados = bansData.bans.filter(b => 
                    !(b.activo && b.tipo === 'permanente') || b.id === banPermanenteMasReciente.id
                );
            }
            
            const bansHtml = bansFiltrados.length > 0 ?
                bansFiltrados.map(ban => {
                    const fechaFin = ban.fecha_fin ? formatDate(ban.fecha_fin) : 'Permanente';
                    const isActive = ban.activo && (ban.tipo === 'permanente' || (ban.fecha_fin && new Date(ban.fecha_fin) > new Date()));
                    return `
                        <div style="background: white; border-left: 4px solid ${ban.tipo === 'permanente' ? '#d32f2f' : '#ff9800'}; padding: 1rem; margin-bottom: 0.5rem; border-radius: 4px;">
                            <div style="font-weight: 600; margin-bottom: 0.5rem;">
                                ${ban.tipo === 'permanente' ? '🚫 Ban Permanente' : '⏰ Ban Temporal'}
                                ${isActive ? '<span style="color: #d32f2f; font-size: 0.85rem;">(Activo)</span>' : ''}
                            </div>
                            <div style="margin-bottom: 0.5rem;">${escapeHtml(ban.motivo)}</div>
                            <div style="font-size: 0.85rem; color: #666;">
                                Por: ${escapeHtml(ban.admin_nombre || 'Admin')} • 
                                Inicio: ${formatDate(ban.fecha_inicio)} • 
                                Fin: ${fechaFin}
                                ${ban.activo ? '' : ' <span style="color: #999;">(Eliminado)</span>'}
                            </div>
                            ${ban.activo && isActive ? `<button onclick="eliminarBan(${ban.id})" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">Desbanear</button>` : ''}
                        </div>
                    `;
                }).join('') :
                '<p style="color: #999; text-align: center; padding: 1rem;">No hay bans</p>';
            
            document.getElementById('sancionesBans').innerHTML = bansHtml;
        }
    } catch (error) {

        document.getElementById('sancionesBans').innerHTML = '<p style="color: #d32f2f;">Error al cargar bans</p>';
    }
    
    openModal('sancionesModal');
}

async function eliminarAdvertencia(advertenciaId) {
    if (!confirm('¿Estás seguro de eliminar esta advertencia?')) return;
    
    const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
    if (!token) {
        alert('No estás autenticado');
        return;
    }
    
    try {
        const response = await fetch(`${getApiBaseUrl()}?action=eliminar_advertencia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, advertencia_id: advertenciaId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Advertencia eliminada');
            loadUsuarios();
            // Recargar modal si está abierto
            const modal = document.getElementById('sancionesModal');
            if (modal && modal.classList.contains('active')) {
                const usuarioId = document.getElementById('sancionesUsuarioId')?.value;
                if (usuarioId) {
                    showUsuarioSanciones(parseInt(usuarioId));
                }
            }
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {

        alert('Error de conexión');
    }
}

async function eliminarBan(banId) {
    if (!confirm('¿Estás seguro de eliminar este ban?')) return;
    
    const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
    if (!token) {
        alert('No estás autenticado');
        return;
    }
    
    try {
        const response = await fetch(`${getApiBaseUrl()}?action=eliminar_ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, ban_id: banId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Ban eliminado');
            loadUsuarios();
            // Recargar modal si está abierto
            const modal = document.getElementById('sancionesModal');
            if (modal && modal.classList.contains('active')) {
                const usuarioId = document.getElementById('sancionesUsuarioId')?.value;
                if (usuarioId) {
                    showUsuarioSanciones(parseInt(usuarioId));
                }
            }
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {

        alert('Error de conexión');
    }
}

// ==================== SISTEMA DE APELACIONES ====================

// Exportar función al scope global para que pueda ser llamada desde onclick
window.loadApelaciones = async function loadApelaciones() {

    // Asegurarse de que la sección de apelaciones esté visible
    const apelacionesSection = document.getElementById('apelaciones');
    if (apelacionesSection) {
        apelacionesSection.classList.add('active');
        // También activar la pestaña correspondiente
        const apelacionesTab = document.querySelector('[data-tab="apelaciones"]');
        if (apelacionesTab) {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            apelacionesTab.classList.add('active');
        }
    }
    
    const apelacionesList = document.getElementById('apelacionesList');
    if (!apelacionesList) {

        alert('Error: No se encontró el contenedor de apelaciones. Asegúrate de estar en la pestaña de Apelaciones.');
        return;
    }
    
    const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
    if (!token) {

        apelacionesList.innerHTML = '<p style="color: #d32f2f; text-align: center; padding: 2rem;">Error: No autenticado</p>';
        return;
    }
    
    apelacionesList.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Cargando apelaciones...</p>';
    
    try {
        const estado = document.getElementById('filterEstadoApelacion')?.value || '';
        
        let url = `${getApiBaseUrl()}?action=listar_apelaciones&token=${token}`;
        if (estado) url += `&estado=${estado}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.success) {
            const apelaciones = data.apelaciones || [];
            
            // Actualizar badge de apelaciones pendientes
            const pendientes = apelaciones.filter(a => a.estado === 'pendiente').length;
            const badge = document.getElementById('apelacionesBadge');
            if (badge) {
                if (pendientes > 0) {
                    badge.textContent = pendientes;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
            
            if (apelaciones.length === 0) {
                apelacionesList.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No hay apelaciones' + (estado ? ` con estado "${estado}"` : '') + '.</p>';
                return;
            }
            
            const apelacionesHtml = apelaciones.map(apelacion => {
                const estadoBadge = {
                    'pendiente': '<span style="background: #ff9800; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">Pendiente</span>',
                    'aprobada': '<span style="background: #4caf50; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">Aprobada</span>',
                    'rechazada': '<span style="background: #d32f2f; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">Rechazada</span>'
                }[apelacion.estado] || '';
                
                const banTipo = apelacion.ban_tipo === 'permanente' ? '🚫 Ban Permanente' : '⏰ Ban Temporal';
                const fechaCreacion = formatDate(apelacion.fecha_creacion);
                const fechaResolucion = apelacion.fecha_resolucion ? formatDate(apelacion.fecha_resolucion) : 'N/A';
                const adminResolucion = apelacion.admin_resolucion_nombre || 'N/A';
                
                return `
                    <div style="background: ${apelacion.estado === 'pendiente' ? '#fff9e6' : apelacion.estado === 'aprobada' ? '#e8f5e9' : '#ffebee'}; border-left: 4px solid ${apelacion.estado === 'pendiente' ? '#ff9800' : apelacion.estado === 'aprobada' ? '#4caf50' : '#d32f2f'}; padding: 1.5rem; margin-bottom: 1rem; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                            <div>
                                <h3 style="margin: 0 0 0.5rem 0; color: #333;">${escapeHtml(apelacion.usuario_nombre || 'Usuario')}</h3>
                                <p style="margin: 0; color: #666; font-size: 0.9rem;">${escapeHtml(apelacion.usuario_email || '')}</p>
                            </div>
                            ${estadoBadge}
                        </div>
                        
                        <div style="margin-bottom: 1rem;">
                            <strong>Ban:</strong> ${banTipo}<br>
                            <strong>Motivo del ban:</strong> ${escapeHtml(apelacion.ban_motivo || 'N/A')}
                        </div>
                        
                        <div style="background: white; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                            <strong>Motivo de la apelación:</strong>
                            <p style="margin: 0.5rem 0 0 0; color: #333; line-height: 1.6;">${escapeHtml(apelacion.motivo_apelacion)}</p>
                        </div>
                        
                        <div style="font-size: 0.85rem; color: #666; margin-bottom: 1rem;">
                            <strong>Fecha de creación:</strong> ${fechaCreacion}<br>
                            ${apelacion.estado !== 'pendiente' ? `
                                <strong>Fecha de resolución:</strong> ${fechaResolucion}<br>
                                <strong>Resuelto por:</strong> ${escapeHtml(adminResolucion)}
                            ` : ''}
                        </div>
                        
                        ${apelacion.estado === 'pendiente' ? `
                            <div style="display: flex; gap: 1rem;">
                                <button onclick="resolverApelacion(${apelacion.id}, 'aprobar')" style="padding: 0.75rem 1.5rem; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                                    ✅ Aprobar y Desbanear
                                </button>
                                <button onclick="resolverApelacion(${apelacion.id}, 'rechazar')" style="padding: 0.75rem 1.5rem; background: #d32f2f; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                                    ❌ Rechazar
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
            
            apelacionesList.innerHTML = apelacionesHtml;

        } else {

            apelacionesList.innerHTML = `<p style="color: #d32f2f; text-align: center; padding: 2rem;">Error: ${data.message || 'Error desconocido'}</p>`;
        }
    } catch (error) {

        const errorMsg = error.message || 'Error de conexión';
        apelacionesList.innerHTML = `<p style="color: #d32f2f; text-align: center; padding: 2rem;">Error: ${errorMsg}</p>`;
    }
}

// Verificar que la función esté disponible globalmente

window.resolverApelacion = async function resolverApelacion(apelacionId, accion) {
    const mensaje = accion === 'aprobar' 
        ? '¿Estás seguro de aprobar esta apelación y desbanear al usuario? El usuario puede apelar hasta 3 veces en total.'
        : '¿Estás seguro de rechazar esta apelación?';
    
    if (!confirm(mensaje)) return;
    
    const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
    if (!token) {
        alert('No estás autenticado');
        return;
    }
    
    try {
        const response = await fetch(`${getApiBaseUrl()}?action=resolver_apelacion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                token, 
                apelacion_id: apelacionId,
                accion: accion
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            loadApelaciones();
            loadUsuarios(); // Recargar usuarios para actualizar estados
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {

        alert('Error de conexión');
    }
}

// ==================== SOLICITUDES DE ACCESO A GRUPOS ====================

// Actualizar badge de notificaciones no leídas (llega a todos los admins)
window.actualizarBadgeNotificacionesSolicitudes = async function actualizarBadgeNotificacionesSolicitudes() {
    if (!window.adminAuthSystem || !window.adminAuthSystem.isAuthenticated()) return;
    const token = window.adminAuthSystem.getToken();
    if (!token) return;
    try {
        const url = `${getApiBaseUrl()}?action=get_notificaciones_solicitudes_count&token=${encodeURIComponent(token)}`;
        const res = await fetch(url);
        const data = await res.json();
        const count = (data.success && data.count != null) ? parseInt(data.count, 10) : 0;
        const badge = document.getElementById('solicitudesGruposBadge');
        const badgeSub = document.getElementById('solicitudesGruposBadgeSub');
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
        if (badgeSub) {
            if (count > 0) {
                badgeSub.textContent = count;
                badgeSub.style.display = 'inline-block';
            } else {
                badgeSub.style.display = 'none';
            }
        }
    } catch (e) { /* ignorar */ }
};

window.cargarSolicitudesGrupos = async function cargarSolicitudesGrupos() {

    const solicitudesList = document.getElementById('solicitudesGruposList');
    if (!solicitudesList) {

        alert('Error: No se encontró el contenedor de solicitudes.');
        return;
    }
    
    solicitudesList.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Cargando solicitudes...</p>';
    
    try {
        const estadoFiltro = document.getElementById('filterEstadoSolicitud')?.value || '';
        
        // MODO LOCAL - Leer desde localStorage
        let solicitudes = JSON.parse(localStorage.getItem('solicitudesGrupos') || '[]');
        
        // Filtrar por estado si se seleccionó
        if (estadoFiltro) {
            solicitudes = solicitudes.filter(s => s.estado_solicitud === estadoFiltro);
        }
        
        // Ordenar por fecha (más recientes primero)
        solicitudes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        const data = { success: true, solicitudes: solicitudes };
        
        // MODO PRODUCCIÓN - Descomentar para usar API
        // let url = `${getApiBaseUrl()}?action=get_solicitudes_acceso`;
        // if (estadoFiltro) url += `&estado=${estadoFiltro}`;
        // const response = await fetch(url);
        // const data = await response.json();
        
        if (data.success) {
            const solicitudes = data.solicitudes || [];
            
            // Actualizar badge de solicitudes pendientes
            const pendientes = solicitudes.filter(s => s.estado_solicitud === 'pendiente').length;
            const badge = document.getElementById('solicitudesGruposBadge');
            const badgeSub = document.getElementById('solicitudesGruposBadgeSub');
            if (badge) {
                if (pendientes > 0) {
                    badge.textContent = pendientes;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
            if (badgeSub) {
                if (pendientes > 0) {
                    badgeSub.textContent = pendientes;
                    badgeSub.style.display = 'inline-block';
                } else {
                    badgeSub.style.display = 'none';
                }
            }
            
            if (solicitudes.length === 0) {
                solicitudesList.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No hay solicitudes de acceso.</p>';
                return;
            }
            
            let html = '<div style="display: grid; gap: 1rem;">';
            
            solicitudes.forEach(solicitud => {
                const fecha = new Date(solicitud.fecha);
                const fechaSolicitud = fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                const estadoText = solicitud.estado_solicitud === 'aprobada' ? 'Aprobada' : solicitud.estado_solicitud === 'rechazada' ? 'Rechazada' : 'Pendiente';
                const borderColor = solicitud.estado_solicitud === 'aprobada' ? '#4caf50' : solicitud.estado_solicitud === 'rechazada' ? '#f44336' : '#ff9800';
                const bgColor = solicitud.estado_solicitud === 'aprobada' ? '#e8f5e9' : solicitud.estado_solicitud === 'rechazada' ? '#ffebee' : '#fff3e0';
                const textColor = solicitud.estado_solicitud === 'aprobada' ? '#2e7d32' : solicitud.estado_solicitud === 'rechazada' ? '#c62828' : '#e65100';
                
                html += `
                    <div style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid ${borderColor};">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                            <div>
                                <h3 style="margin: 0 0 0.5rem 0; color: #333;">${solicitud.nombre || 'Sin nombre'}</h3>
                                <p style="margin: 0; color: #666; font-size: 0.9rem;">ID: ${solicitud.id}</p>
                            </div>
                            <span style="padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; background: ${bgColor}; color: ${textColor};">
                                ${estadoText}
                            </span>
                        </div>
                        
                        <p style="margin: 0.5rem 0; color: #666;">
                            <strong>📍 Ubicación:</strong> 
                            ${solicitud.estado || 'N/A'}${solicitud.municipio ? ', ' + solicitud.municipio : ''}${solicitud.ciudad ? ', ' + solicitud.ciudad : ''}
                        </p>
                        
                        <p style="margin: 0.5rem 0; color: #666;"><strong>🌳 Grupo sugerido:</strong> Ejidos ${solicitud.estado || 'General'}</p>
                        
                        <div style="display: flex; gap: 0.5rem; margin-top: 1rem; font-size: 0.85rem; color: #999;">
                            <span>📅 ${fechaSolicitud}</span>
                        </div>
                        
                        ${solicitud.estado_solicitud === 'pendiente' ? `
                            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                                <button onclick="gestionarSolicitudGrupoLocal(${solicitud.id}, 'aprobar')" style="padding: 0.75rem 1.5rem; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                                    ✅ Aprobar
                                </button>
                                <button onclick="gestionarSolicitudGrupoLocal(${solicitud.id}, 'rechazar')" style="padding: 0.75rem 1.5rem; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                                    ❌ Rechazar
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            
            html += '</div>';
            solicitudesList.innerHTML = html;
            // Marcar notificaciones como leídas para este admin y actualizar badge
            if (window.adminAuthSystem && window.adminAuthSystem.isAuthenticated()) {
                const token = window.adminAuthSystem.getToken();
                if (token) {
                    try {
                        await fetch(getApiBaseUrl(), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: `action=marcar_notificaciones_solicitudes_leidas&token=${encodeURIComponent(token)}`
                        });
                        if (typeof actualizarBadgeNotificacionesSolicitudes === 'function') actualizarBadgeNotificacionesSolicitudes();
                    } catch (e) { /* ignorar */ }
                }
            }
        } else {
            solicitudesList.innerHTML = `<p style="color: #d32f2f; text-align: center; padding: 2rem;">Error: ${data.message || 'Error desconocido'}</p>`;
        }
    } catch (error) {

        solicitudesList.innerHTML = '<p style="color: #d32f2f; text-align: center; padding: 2rem;">Error de conexión</p>';
    }
}

// Función para gestionar solicitudes en modo LOCAL (localStorage)
window.gestionarSolicitudGrupoLocal = function gestionarSolicitudGrupoLocal(solicitudId, accion) {
    const mensaje = accion === 'aprobar' 
        ? '¿Estás seguro de aprobar esta solicitud? El usuario podrá acceder al chat de ejidos.'
        : '¿Estás seguro de rechazar esta solicitud?';
    
    if (!confirm(mensaje)) return;
    
    try {
        // Obtener solicitudes
        let solicitudes = JSON.parse(localStorage.getItem('solicitudesGrupos') || '[]');
        
        // Buscar y actualizar la solicitud
        const index = solicitudes.findIndex(s => s.id === solicitudId);
        
        if (index === -1) {
            alert('❌ Solicitud no encontrada');
            return;
        }
        
        // Actualizar estado
        solicitudes[index].estado_solicitud = accion === 'aprobar' ? 'aprobada' : 'rechazada';
        solicitudes[index].fecha_resolucion = new Date().toISOString();
        
        // Guardar
        localStorage.setItem('solicitudesGrupos', JSON.stringify(solicitudes));
        
        // Mensaje de éxito
        const mensajeExito = accion === 'aprobar' 
            ? '✅ Solicitud aprobada (guardada localmente). Los grupos del chat se cargan desde el servidor: si en la página de Chat no aparece ningún grupo, ejecuta en el servidor el instalador de chat: /api/instalar_chat.php'
            : '❌ Solicitud rechazada.';
        
        alert(mensajeExito);
        
        // Recargar lista
        cargarSolicitudesGrupos();
        
    } catch (error) {

        alert('❌ Error al gestionar la solicitud');
    }
}

window.gestionarSolicitudGrupo = async function gestionarSolicitudGrupo(solicitudId, accion) {
    const mensaje = accion === 'aprobar' 
        ? '¿Estás seguro de aprobar esta solicitud? El usuario será agregado al grupo.'
        : '¿Estás seguro de rechazar esta solicitud?';
    
    if (!confirm(mensaje)) return;
    
    const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
    if (!token) {
        alert('No estás autenticado');
        return;
    }
    
    // Si es aprobar, mostrar selector de grupos
    let grupoId = 0;
    if (accion === 'aprobar') {
        try {
            // Obtener todos los grupos disponibles
            const gruposResponse = await fetch(`${getApiBaseUrl()}?action=get_grupos`);
            const gruposData = await gruposResponse.json();
            
            if (!gruposData.success || !gruposData.grupos || gruposData.grupos.length === 0) {
                alert('No hay grupos disponibles. Debes crear un grupo primero.');
                return;
            }
            
            // Crear modal para seleccionar grupo
            const modal = document.createElement('div');
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
            
            const modalContent = document.createElement('div');
            modalContent.style.cssText = 'background: white; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;';
            
            let gruposHtml = '<h3 style="margin-top: 0; margin-bottom: 1rem;">Selecciona un grupo:</h3>';
            gruposHtml += '<select id="selectGrupoSolicitud" style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem; margin-bottom: 1rem;">';
            gruposHtml += '<option value="0">-- Selecciona un grupo --</option>';
            
            gruposData.grupos.forEach(grupo => {
                const ubicacion = [];
                if (grupo.estado) ubicacion.push(grupo.estado);
                if (grupo.municipio) ubicacion.push(grupo.municipio);
                if (grupo.ciudad) ubicacion.push(grupo.ciudad);
                const ubicacionStr = ubicacion.length > 0 ? ` (${ubicacion.join(', ')})` : '';
                gruposHtml += `<option value="${grupo.id}">${escapeHtml(grupo.nombre)}${ubicacionStr}</option>`;
            });
            
            gruposHtml += '</select>';
            gruposHtml += '<div style="display: flex; gap: 1rem; justify-content: flex-end;">';
            gruposHtml += '<button id="btnCancelarGrupo" style="padding: 0.75rem 1.5rem; background: #ccc; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Cancelar</button>';
            gruposHtml += '<button id="btnConfirmarGrupo" style="padding: 0.75rem 1.5rem; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Confirmar</button>';
            gruposHtml += '</div>';
            
            modalContent.innerHTML = gruposHtml;
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // Esperar selección
            return new Promise((resolve) => {
                document.getElementById('btnCancelarGrupo').onclick = () => {
                    document.body.removeChild(modal);
                    resolve();
                };
                
                document.getElementById('btnConfirmarGrupo').onclick = async () => {
                    const selectGrupo = document.getElementById('selectGrupoSolicitud');
                    grupoId = parseInt(selectGrupo.value) || 0;
                    
                    if (grupoId === 0) {
                        alert('Por favor selecciona un grupo');
                        return;
                    }
                    
                    document.body.removeChild(modal);
                    
                    // Continuar con la aprobación
                    try {
                        const adminIdValue = window.adminAuthSystem ? window.adminAuthSystem.getCurrentAdmin()?.id : null;

                        const response = await fetch(`${getApiBaseUrl()}?action=gestionar_solicitud_acceso`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                solicitud_id: solicitudId,
                                accion: accion,
                                admin_id: adminIdValue,
                                grupo_id: grupoId
                            })
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            alert(data.message);
                            cargarSolicitudesGrupos();
                        } else {
                            alert('Error: ' + data.message);
                        }
                    } catch (error) {

                        alert('Error de conexión');
                    }
                    
                    resolve();
                };
            });
        } catch (error) {

            alert('Error al cargar grupos. Por favor, intenta nuevamente.');
            return;
        }
    } else {
        // Si es rechazar, proceder directamente
        try {
            const adminIdValue = window.adminAuthSystem ? window.adminAuthSystem.getCurrentAdmin()?.id : null;

            const response = await fetch(`${getApiBaseUrl()}?action=gestionar_solicitud_acceso`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    solicitud_id: solicitudId,
                    accion: accion,
                    admin_id: adminIdValue,
                    grupo_id: 0
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert(data.message);
                cargarSolicitudesGrupos();
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {

            alert('Error de conexión');
        }
    }
}

// Función para reasignar una solicitud a otro grupo
window.reasignarSolicitudGrupo = async function reasignarSolicitudGrupo(solicitudId) {
    if (!confirm('¿Deseas reasignar esta solicitud a otro grupo?')) return;
    
    const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
    if (!token) {
        alert('No estás autenticado');
        return;
    }
    
    try {
        // Obtener todos los grupos disponibles
        const gruposResponse = await fetch(`${getApiBaseUrl()}?action=get_grupos`);
        const gruposData = await gruposResponse.json();
        
        if (!gruposData.success || !gruposData.grupos || gruposData.grupos.length === 0) {
            alert('No hay grupos disponibles.');
            return;
        }
        
        // Crear modal para seleccionar grupo
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = 'background: white; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;';
        
        let gruposHtml = '<h3 style="margin-top: 0; margin-bottom: 1rem;">Selecciona el nuevo grupo:</h3>';
        gruposHtml += '<select id="selectGrupoReasignar" style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem; margin-bottom: 1rem;">';
        gruposHtml += '<option value="0">-- Selecciona un grupo --</option>';
        
        gruposData.grupos.forEach(grupo => {
            const ubicacion = [];
            if (grupo.estado) ubicacion.push(grupo.estado);
            if (grupo.municipio) ubicacion.push(grupo.municipio);
            if (grupo.ciudad) ubicacion.push(grupo.ciudad);
            const ubicacionStr = ubicacion.length > 0 ? ` (${ubicacion.join(', ')})` : '';
            gruposHtml += `<option value="${grupo.id}">${escapeHtml(grupo.nombre)}${ubicacionStr}</option>`;
        });
        
        gruposHtml += '</select>';
        gruposHtml += '<div style="display: flex; gap: 1rem; justify-content: flex-end;">';
        gruposHtml += '<button id="btnCancelarReasignar" style="padding: 0.75rem 1.5rem; background: #ccc; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Cancelar</button>';
        gruposHtml += '<button id="btnConfirmarReasignar" style="padding: 0.75rem 1.5rem; background: #2196f3; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Reasignar</button>';
        gruposHtml += '</div>';
        
        modalContent.innerHTML = gruposHtml;
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Esperar selección
        return new Promise((resolve) => {
            document.getElementById('btnCancelarReasignar').onclick = () => {
                document.body.removeChild(modal);
                resolve();
            };
            
            document.getElementById('btnConfirmarReasignar').onclick = async () => {
                const selectGrupo = document.getElementById('selectGrupoReasignar');
                const grupoId = parseInt(selectGrupo.value) || 0;
                
                if (grupoId === 0) {
                    alert('Por favor selecciona un grupo');
                    return;
                }
                
                document.body.removeChild(modal);
                
                // Enviar reasignación
                try {
                    const adminIdValue = window.adminAuthSystem ? window.adminAuthSystem.getCurrentAdmin()?.id : null;

                    const response = await fetch(`${getApiBaseUrl()}?action=gestionar_solicitud_acceso`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            solicitud_id: solicitudId,
                            accion: 'reasignar',
                            admin_id: adminIdValue,
                            grupo_id: grupoId
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        alert('✅ Solicitud reasignada exitosamente');
                        cargarSolicitudesGrupos();
                    } else {
                        alert('Error: ' + data.message);
                    }
                } catch (error) {

                    alert('Error de conexión');
                }
                
                resolve();
            };
        });
    } catch (error) {

        alert('Error al cargar grupos. Por favor, intenta nuevamente.');
    }
}

// ==================== GESTIÓN DE GRUPOS ====================

// Función para cambiar entre sub-pestañas de Grupos/Solicitudes
window.mostrarSubTabGrupos = function mostrarSubTabGrupos(tab) {
    const tabSolicitudes = document.getElementById('tabSolicitudes');
    const tabGrupos = document.getElementById('tabGrupos');
    const contenidoSolicitudes = document.getElementById('contenidoSolicitudes');
    const contenidoGrupos = document.getElementById('contenidoGrupos');
    
    if (tab === 'solicitudes') {
        if (tabSolicitudes) {
            tabSolicitudes.style.background = '#4D8143';
            tabSolicitudes.style.color = 'white';
        }
        if (tabGrupos) {
            tabGrupos.style.background = '#e0e0e0';
            tabGrupos.style.color = '#666';
        }
        if (contenidoSolicitudes) contenidoSolicitudes.style.display = 'block';
        if (contenidoGrupos) contenidoGrupos.style.display = 'none';
        
        // Cargar solicitudes si no están cargadas
        if (typeof window.cargarSolicitudesGrupos === 'function') {
            setTimeout(() => window.cargarSolicitudesGrupos(), 100);
        }
    } else if (tab === 'grupos') {
        if (tabSolicitudes) {
            tabSolicitudes.style.background = '#e0e0e0';
            tabSolicitudes.style.color = '#666';
        }
        if (tabGrupos) {
            tabGrupos.style.background = '#4D8143';
            tabGrupos.style.color = 'white';
        }
        if (contenidoSolicitudes) contenidoSolicitudes.style.display = 'none';
        if (contenidoGrupos) contenidoGrupos.style.display = 'block';
        
        // Cargar grupos y configurar búsqueda
        if (typeof window.cargarGruposAdmin === 'function') {
            setTimeout(() => {
                window.cargarGruposAdmin();
                // Agregar listener para búsqueda
                const searchInput = document.getElementById('searchGruposAdmin');
                if (searchInput) {
                    // Remover listener anterior si existe
                    searchInput.removeEventListener('input', searchInput._searchHandler);
                    // Crear nuevo handler
                    searchInput._searchHandler = function() {
                        if (typeof window.cargarGruposAdmin === 'function') {
                            window.cargarGruposAdmin();
                        }
                    };
                    searchInput.addEventListener('input', searchInput._searchHandler);
                }
            }, 100);
        }
    }
}

// Cargar todos los grupos para el administrador
window.cargarGruposAdmin = async function cargarGruposAdmin() {
    const gruposList = document.getElementById('gruposAdminList');
    if (!gruposList) {

        return;
    }
    
    gruposList.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Cargando grupos...</p>';
    
    try {
        const response = await fetch(`${getApiBaseUrl()}?action=get_grupos`);
        const data = await response.json();
        
        if (data.success) {
            const grupos = data.grupos || [];
            const searchTerm = document.getElementById('searchGruposAdmin')?.value.toLowerCase() || '';
            const gruposFiltrados = searchTerm 
                ? grupos.filter(g => g.nombre.toLowerCase().includes(searchTerm))
                : grupos;
            
            if (gruposFiltrados.length === 0) {
                gruposList.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No hay grupos disponibles.</p>';
                return;
            }
            
            let html = '<div style="display: grid; gap: 1.5rem;">';
            
            gruposFiltrados.forEach(grupo => {
                const ubicacion = [];
                if (grupo.estado) ubicacion.push(grupo.estado);
                if (grupo.municipio) ubicacion.push(grupo.municipio);
                if (grupo.ciudad) ubicacion.push(grupo.ciudad);
                const ubicacionStr = ubicacion.length > 0 ? ubicacion.join(', ') : 'Sin ubicación';
                
                html += `
                    <div style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid ${grupo.activo ? '#4caf50' : '#ccc'};">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                            <div style="flex: 1;">
                                <h3 style="margin: 0 0 0.5rem 0; color: #333;">${escapeHtml(grupo.nombre)}</h3>
                                ${grupo.descripcion ? `<p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">${escapeHtml(grupo.descripcion)}</p>` : ''}
                                <p style="margin: 0; color: #666; font-size: 0.85rem;">
                                    <strong>📍 Ubicación:</strong> ${escapeHtml(ubicacionStr)}<br>
                                    <strong>👤 Líder:</strong> ${escapeHtml(grupo.lider_nombre || 'N/A')} (${escapeHtml(grupo.lider_email || 'N/A')})<br>
                                    <strong>👥 Miembros:</strong> ${grupo.total_miembros || 0}<br>
                                    <strong>🔑 Código:</strong> ${escapeHtml(grupo.codigo_acceso || 'N/A')}
                                </p>
                            </div>
                            <span style="padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; background: ${grupo.activo ? '#e8f5e9' : '#f5f5f5'}; color: ${grupo.activo ? '#2e7d32' : '#666'};">
                                ${grupo.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                        <div style="display: flex; gap: 0.5rem; margin-top: 1rem; font-size: 0.85rem; color: #999;">
                            <span>📅 Creado: ${formatDate(grupo.fecha_creacion)}</span>
                        </div>
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <button onclick="verMiembrosGrupoAdmin(${grupo.id}, '${escapeHtml(grupo.nombre)}')" style="padding: 0.75rem 1.5rem; background: #2196f3; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">
                                👥 Ver Miembros
                            </button>
                            <button onclick="editarGrupoAdmin(${grupo.id})" style="padding: 0.75rem 1.5rem; background: #ff9800; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">
                                ✏️ Editar
                            </button>
                            <button onclick="eliminarGrupoAdmin(${grupo.id}, '${escapeHtml(grupo.nombre)}')" style="padding: 0.75rem 1.5rem; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            gruposList.innerHTML = html;
        } else {
            gruposList.innerHTML = `<p style="color: #d32f2f; text-align: center; padding: 2rem;">Error: ${data.message || 'Error desconocido'}</p>`;
        }
    } catch (error) {

        gruposList.innerHTML = '<p style="color: #d32f2f; text-align: center; padding: 2rem;">Error de conexión</p>';
    }
}

// Abrir modal para crear grupo
window.abrirModalCrearGrupoAdmin = async function abrirModalCrearGrupoAdmin() {
    const modal = document.getElementById('crearGrupoModal');
    if (!modal) {
        alert('Modal no encontrado');
        return;
    }
    
    // Cargar usuarios para el selector de líder
    try {
        const response = await fetch(`${getApiBaseUrl()}?action=get_all_usuarios`);
        const data = await response.json();
        
        const liderSelect = document.getElementById('liderGrupoAdmin');
        if (liderSelect && data.success && data.usuarios) {
            liderSelect.innerHTML = '<option value="">-- Selecciona un usuario --</option>';
            data.usuarios.forEach(usuario => {
                const option = document.createElement('option');
                option.value = usuario.id;
                option.textContent = `${escapeHtml(usuario.nombre)} (${escapeHtml(usuario.email)})`;
                liderSelect.appendChild(option);
            });
        }
        
        // Cargar estados
        const estadosMexico = [
            'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
            'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
            'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
            'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León',
            'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
            'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
            'Veracruz', 'Yucatán', 'Zacatecas'
        ];
        
        const estadoSelect = document.getElementById('estadoGrupoAdmin');
        if (estadoSelect) {
            estadoSelect.innerHTML = '<option value="">-- Selecciona un estado (opcional) --</option>';
            estadosMexico.forEach(estado => {
                const option = document.createElement('option');
                option.value = estado;
                option.textContent = estado;
                estadoSelect.appendChild(option);
            });
            
            estadoSelect.addEventListener('change', function() {
                const municipioSelect = document.getElementById('municipioGrupoAdmin');
                const ciudadSelect = document.getElementById('ciudadGrupoAdmin');
                
                if (this.value) {
                    // Cargar municipios según el estado (simplificado)
                    municipioSelect.disabled = false;
                    municipioSelect.innerHTML = '<option value="">-- Selecciona un municipio --</option>';
                    // Aquí podrías cargar municipios reales según el estado
                    municipioSelect.innerHTML += '<option value="Municipio Principal">Municipio Principal</option>';
                    // Resetear ciudad cuando cambia el estado
                    ciudadSelect.disabled = true;
                    ciudadSelect.innerHTML = '<option value="">-- Selecciona primero un municipio --</option>';
                } else {
                    municipioSelect.disabled = true;
                    ciudadSelect.disabled = true;
                    municipioSelect.innerHTML = '<option value="">-- Selecciona primero un estado --</option>';
                    ciudadSelect.innerHTML = '<option value="">-- Selecciona primero un municipio --</option>';
                }
            });
            
            // Agregar listener para el selector de municipio
            const municipioSelect = document.getElementById('municipioGrupoAdmin');
            if (municipioSelect) {
                // Remover listener anterior si existe
                municipioSelect.removeEventListener('change', municipioSelect._changeHandler);
                // Crear nuevo handler
                municipioSelect._changeHandler = function() {
                    const ciudadSelect = document.getElementById('ciudadGrupoAdmin');
                    if (ciudadSelect) {
                        if (this.value) {
                            ciudadSelect.disabled = false;
                            ciudadSelect.innerHTML = '<option value="">-- Selecciona una ciudad (opcional) --</option>';
                            // Aquí podrías cargar ciudades reales según el municipio
                            ciudadSelect.innerHTML += '<option value="Ciudad Principal">Ciudad Principal</option>';
                        } else {
                            ciudadSelect.disabled = true;
                            ciudadSelect.innerHTML = '<option value="">-- Selecciona primero un municipio --</option>';
                        }
                    }
                };
                municipioSelect.addEventListener('change', municipioSelect._changeHandler);
            }
        }
    } catch (error) {

    }
    
    modal.style.display = 'flex';
}

// Crear grupo desde admin
window.crearGrupoAdmin = async function crearGrupoAdmin(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombreGrupoAdmin').value.trim();
    const descripcion = document.getElementById('descripcionGrupoAdmin').value.trim();
    const liderId = parseInt(document.getElementById('liderGrupoAdmin').value) || 0;
    const estado = document.getElementById('estadoGrupoAdmin').value.trim();
    const municipio = document.getElementById('municipioGrupoAdmin').value.trim();
    const ciudad = document.getElementById('ciudadGrupoAdmin').value.trim();
    
    if (!nombre) {
        alert('El nombre del grupo es requerido');
        return;
    }
    
    if (liderId <= 0) {
        alert('Debes seleccionar un líder para el grupo');
        return;
    }
    
    try {
        const response = await fetch(`${getApiBaseUrl()}?action=create_grupo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: nombre,
                descripcion: descripcion,
                lider_id: liderId,
                estado: estado || null,
                municipio: municipio || null,
                ciudad: ciudad || null
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Cerrar modal primero
            closeModal('crearGrupoModal');
            document.getElementById('crearGrupoForm').reset();

            // Mostrar mensaje de éxito
            alert(`✅ Grupo creado exitosamente!\n\nCódigo de acceso: ${data.grupo.codigo_acceso}`);

            // Recargar lista de grupos
            cargarGruposAdmin();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {

        alert('Error de conexión');
    }
}

// Ver miembros de un grupo
window.verMiembrosGrupoAdmin = async function verMiembrosGrupoAdmin(grupoId, grupoNombre) {
    try {
        const response = await fetch(`${getApiBaseUrl()}?action=get_miembros_grupo&grupo_id=${grupoId}`);
        const data = await response.json();
        
        if (data.success) {
            const miembros = data.miembros || [];
            let html = `<h3 style="margin-bottom: 1rem; color: #333;">Miembros de: ${escapeHtml(grupoNombre)}</h3>`;
            
            if (miembros.length === 0) {
                html += '<p style="color: #999; text-align: center; padding: 2rem;">No hay miembros en este grupo.</p>';
            } else {
                html += '<div style="display: grid; gap: 0.75rem; max-height: 400px; overflow-y: auto;">';
                miembros.forEach(miembro => {
                    html += `
                        <div style="padding: 1rem; background: #f5f5f5; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid ${miembro.rol === 'lider' ? '#4caf50' : miembro.rol === 'coordinador' ? '#2196f3' : '#999'};">
                            <div>
                                <strong style="color: #333;">${escapeHtml(miembro.usuario_nombre || 'N/A')}</strong><br>
                                <span style="font-size: 0.85rem; color: #666;">${escapeHtml(miembro.usuario_email || 'N/A')}</span>
                            </div>
                            <span style="padding: 0.5rem 1rem; border-radius: 12px; font-size: 0.75rem; font-weight: bold; background: ${miembro.rol === 'lider' ? '#4caf50' : miembro.rol === 'coordinador' ? '#2196f3' : '#999'}; color: white;">
                                ${miembro.rol === 'lider' ? 'Líder' : miembro.rol === 'coordinador' ? 'Coordinador' : 'Miembro'}
                            </span>
                        </div>
                    `;
                });
                html += '</div>';
            }
            
            // Crear modal temporal para mostrar miembros
            const modal = document.createElement('div');
            modal.className = 'modal-miembros-overlay';
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
            
            const modalContent = document.createElement('div');
            modalContent.style.cssText = 'background: white; padding: 2rem; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3);';
            modalContent.innerHTML = html + '<div style="margin-top: 1.5rem; text-align: right;"><button type="button" class="btn-cerrar-modal-miembros" style="padding: 0.75rem 1.5rem; background: #4D8143; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Cerrar</button></div>';
            
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            modal.querySelector('.btn-cerrar-modal-miembros').addEventListener('click', function() {
                modal.remove();
            });
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {

        alert('Error de conexión');
    }
}

// Editar grupo
window.editarGrupoAdmin = function editarGrupoAdmin(grupoId) {
    alert('Función de edición en desarrollo. Por ahora puedes eliminar y crear un nuevo grupo.');
}

// Eliminar todos los ejidos predeterminados ("Ejidos México")
window.eliminarGruposPredeterminadosAdmin = async function eliminarGruposPredeterminadosAdmin() {
    if (!confirm('¿Eliminar TODOS los grupos predeterminados "Ejidos México"? Esta acción no se puede deshacer.')) {
        return;
    }
    try {
        const adminId = window.adminAuthSystem ? window.adminAuthSystem.getCurrentAdmin()?.id : 0;
        const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : null;
        const response = await fetch(`${getApiBaseUrl()}?action=delete_grupos_predeterminados`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: adminId || 0, token: token })
        });
        const data = await response.json();
        if (data.success) {
            alert(data.message || 'Ejidos predeterminados eliminados.');
            if (typeof window.cargarGruposAdmin === 'function') {
                window.cargarGruposAdmin();
            }
        } else {
            alert('Error: ' + (data.message || 'No se pudieron eliminar'));
        }
    } catch (error) {
        alert('Error de conexión');
    }
};

// Eliminar TODOS los grupos del apartado Grupos
window.eliminarTodosLosGruposAdmin = async function eliminarTodosLosGruposAdmin() {
    if (!confirm('¿Eliminar TODOS los grupos de la base de datos? Se borrarán todos los grupos de ejidos. Esta acción no se puede deshacer.')) {
        return;
    }
    try {
        const adminId = window.adminAuthSystem ? window.adminAuthSystem.getCurrentAdmin()?.id : 0;
        const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : null;
        const response = await fetch(`${getApiBaseUrl()}?action=delete_all_grupos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: adminId || 0, token: token })
        });
        const data = await response.json();
        if (data.success) {
            alert(data.message || 'Todos los grupos han sido eliminados.');
            if (typeof window.cargarGruposAdmin === 'function') {
                window.cargarGruposAdmin();
            }
        } else {
            alert('Error: ' + (data.message || 'No se pudieron eliminar'));
        }
    } catch (error) {
        alert('Error de conexión');
    }
};

// Eliminar grupo
window.eliminarGrupoAdmin = async function eliminarGrupoAdmin(grupoId, grupoNombre) {
    if (!confirm(`¿Estás seguro de eliminar el grupo "${grupoNombre}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        const adminId = window.adminAuthSystem ? window.adminAuthSystem.getCurrentAdmin()?.id : 0;
        const response = await fetch(`${getApiBaseUrl()}?action=delete_grupo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grupo_id: grupoId,
                admin_id: adminId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Grupo eliminado exitosamente');
            cargarGruposAdmin();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {

        alert('Error de conexión');
    }
}

// ==================== ASISTENTE IA PARA MODERACIÓN - DESACTIVADO ====================
/*
async function loadAISuggestionAdvertencia(usuarioId) {

    const suggestionDiv = document.getElementById('aiSuggestionAdvertencia');
    const suggestionText = document.getElementById('aiSuggestionAdvertenciaText');
    
    if (!suggestionDiv || !suggestionText) {

        return;
    }
    
    // Mostrar mensaje de carga
    suggestionText.innerHTML = '<span style="color: #6366f1;">⏳ Analizando usuario...</span>';
    suggestionDiv.style.display = 'block';
    
    const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
    if (!token) {

        suggestionText.innerHTML = '<span style="color: #d32f2f;">⚠️ Error: No estás autenticado. Por favor, inicia sesión nuevamente.</span>';
        return;
    }
    
    try {

        const [infoResponse, advertenciasResponse, bansResponse] = await Promise.all([
            fetch(`${getApiBaseUrl()}?action=get_usuario_info&token=${token}&usuario_id=${usuarioId}`),
            fetch(`${getApiBaseUrl()}?action=listar_advertencias&token=${token}&usuario_id=${usuarioId}`),
            fetch(`${getApiBaseUrl()}?action=listar_bans&token=${token}&usuario_id=${usuarioId}`)
        ]);
        
        if (!infoResponse.ok || !advertenciasResponse.ok || !bansResponse.ok) {
            throw new Error('Error en las respuestas de la API');
        }
        
        const infoData = await infoResponse.json();
        const advertenciasData = await advertenciasResponse.json();
        const bansData = await bansResponse.json();

        if (!infoData.success) {

            suggestionText.innerHTML = `<span style="color: #d32f2f;">⚠️ Error: ${infoData.message || 'No se pudo obtener la información del usuario'}</span>`;
            return;
        }
        
        const usuario = infoData.usuario;
        const advertencias = advertenciasData.success ? advertenciasData.advertencias.filter(a => a.activa) : [];
        const bans = bansData.success ? bansData.bans.filter(b => b.activo) : [];

        const suggestion = analyzeUserForAdvertencia(usuario, advertencias, bans);
        
        if (suggestion) {

            suggestionText.innerHTML = suggestion;
            suggestionDiv.style.display = 'block';
        } else {

            suggestionText.innerHTML = '<span style="color: #666;">ℹ️ No hay sugerencias disponibles para este usuario.</span>';
            suggestionDiv.style.display = 'block';
        }
    } catch (error) {

        suggestionText.innerHTML = `<span style="color: #d32f2f;">⚠️ Error al analizar usuario: ${error.message || 'Error desconocido'}. Verifica la consola para más detalles.</span>`;
        suggestionDiv.style.display = 'block';
    }
}

async function loadAISuggestionBan(usuarioId) {

    const suggestionDiv = document.getElementById('aiSuggestionBan');
    const suggestionText = document.getElementById('aiSuggestionBanText');
    
    if (!suggestionDiv || !suggestionText) {

        return;
    }
    
    // Mostrar mensaje de carga
    suggestionText.innerHTML = '<span style="color: #6366f1;">⏳ Analizando usuario...</span>';
    suggestionDiv.style.display = 'block';
    
    const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
    if (!token) {

        suggestionText.innerHTML = '<span style="color: #d32f2f;">⚠️ Error: No estás autenticado. Por favor, inicia sesión nuevamente.</span>';
        return;
    }
    
    try {

        const [infoResponse, advertenciasResponse, bansResponse] = await Promise.all([
            fetch(`${getApiBaseUrl()}?action=get_usuario_info&token=${token}&usuario_id=${usuarioId}`),
            fetch(`${getApiBaseUrl()}?action=listar_advertencias&token=${token}&usuario_id=${usuarioId}`),
            fetch(`${getApiBaseUrl()}?action=listar_bans&token=${token}&usuario_id=${usuarioId}`)
        ]);
        
        if (!infoResponse.ok || !advertenciasResponse.ok || !bansResponse.ok) {
            throw new Error('Error en las respuestas de la API');
        }
        
        const infoData = await infoResponse.json();
        const advertenciasData = await advertenciasResponse.json();
        const bansData = await bansResponse.json();

        if (!infoData.success) {

            suggestionText.innerHTML = `<span style="color: #d32f2f;">⚠️ Error: ${infoData.message || 'No se pudo obtener la información del usuario'}</span>`;
            return;
        }
        
        const usuario = infoData.usuario;
        const advertencias = advertenciasData.success ? advertenciasData.advertencias.filter(a => a.activa) : [];
        const bans = bansData.success ? bansData.bans.filter(b => b.activo) : [];

        const suggestion = analyzeUserForBan(usuario, advertencias, bans);
        
        if (suggestion) {

            suggestionText.innerHTML = suggestion;
            suggestionDiv.style.display = 'block';
        } else {

            suggestionText.innerHTML = '<span style="color: #666;">ℹ️ No hay sugerencias disponibles para este usuario.</span>';
            suggestionDiv.style.display = 'block';
        }
    } catch (error) {

        suggestionText.innerHTML = `<span style="color: #d32f2f;">⚠️ Error al analizar usuario: ${error.message || 'Error desconocido'}. Verifica la consola para más detalles.</span>`;
        suggestionDiv.style.display = 'block';
    }
}

function analyzeUserForAdvertencia(usuario, advertencias, bans) {
    try {
        // Validar datos de entrada
        if (!usuario || !usuario.fecha_registro) {
            return '⚠️ <strong>Error:</strong> No se pudo obtener la información completa del usuario.';
        }
        
        const advertenciasActivas = Array.isArray(advertencias) ? advertencias.length : 0;
        const bansArray = Array.isArray(bans) ? bans : [];
        const bansTemporales = bansArray.filter(b => b && b.tipo === 'temporal').length;
        const bansPermanentes = bansArray.filter(b => b && b.tipo === 'permanente').length;
        
        // Calcular días desde registro
        let diasDesdeRegistro = 0;
        try {
            const fechaRegistro = new Date(usuario.fecha_registro);
            if (!isNaN(fechaRegistro.getTime())) {
                diasDesdeRegistro = Math.floor((new Date() - fechaRegistro) / (1000 * 60 * 60 * 24));
            }
        } catch (e) {

        }
        
        let suggestion = '';
        
        // Análisis de riesgo
        if (bansPermanentes > 0) {
            suggestion = '⚠️ <strong>Usuario con ban permanente activo.</strong> No se recomienda dar más advertencias.';
        } else if (advertenciasActivas >= 2) {
            suggestion = `🔴 <strong>Alta prioridad:</strong> Este usuario tiene ${advertenciasActivas} advertencias activas. La próxima advertencia activará automáticamente un ban temporal de 7 días.`;
        } else if (bansTemporales >= 2) {
            suggestion = `🟠 <strong>Atención:</strong> Este usuario tiene ${bansTemporales} bans temporales previos. Si se aplica otra advertencia que active un ban temporal, se convertirá automáticamente en ban permanente.`;
        } else if (advertenciasActivas === 1) {
            suggestion = `🟡 <strong>Moderado:</strong> El usuario tiene 1 advertencia activa. Con esta advertencia tendrá 2. Una más activará un ban temporal automático.`;
        } else if (bansTemporales === 1) {
            suggestion = `🟡 <strong>Precaución:</strong> El usuario tiene 1 ban temporal previo. Si acumula 3 advertencias y se activa otro ban temporal, será permanente.`;
        } else if (diasDesdeRegistro < 7 && diasDesdeRegistro >= 0) {
            suggestion = `ℹ️ <strong>Usuario nuevo:</strong> Registrado hace ${diasDesdeRegistro} días. Considera ser más flexible con usuarios nuevos, pero mantén los estándares de la comunidad.`;
        } else {
            suggestion = `✅ <strong>Usuario sin historial previo:</strong> Este sería su primer registro de advertencia. Asegúrate de que el motivo sea claro y documentado.`;
        }
        
        // Agregar estadísticas
        if (advertenciasActivas > 0 || bansArray.length > 0) {
            try {
                const advertenciasOrdenadas = Array.isArray(advertencias) ? [...advertencias].sort((a, b) => {
                    const fechaA = a && a.fecha_advertencia ? new Date(a.fecha_advertencia) : new Date(0);
                    const fechaB = b && b.fecha_advertencia ? new Date(b.fecha_advertencia) : new Date(0);
                    return fechaB - fechaA;
                }) : [];
                
                if (advertenciasOrdenadas.length > 0 && advertenciasOrdenadas[0].fecha_advertencia) {
                    const ultimaAdvertencia = new Date(advertenciasOrdenadas[0].fecha_advertencia);
                    if (!isNaN(ultimaAdvertencia.getTime())) {
                        const diasDesdeUltimaAdvertencia = Math.floor((new Date() - ultimaAdvertencia) / (1000 * 60 * 60 * 24));
                        
                        if (diasDesdeUltimaAdvertencia < 30 && diasDesdeUltimaAdvertencia >= 0) {
                            suggestion += `<br><br>📊 <strong>Patrón detectado:</strong> Última advertencia hace ${diasDesdeUltimaAdvertencia} días. El usuario muestra comportamiento recurrente.`;
                        }
                    }
                }
            } catch (e) {

            }
        }
        
        return suggestion || '✅ <strong>Análisis completado:</strong> Usuario sin historial previo de sanciones.';
    } catch (error) {

        return '⚠️ <strong>Error:</strong> No se pudo analizar el usuario. Por favor, intenta nuevamente.';
    }
}

function analyzeUserForBan(usuario, advertencias, bans) {
    try {
        // Validar datos de entrada
        if (!usuario || !usuario.fecha_registro) {
            return '⚠️ <strong>Error:</strong> No se pudo obtener la información completa del usuario.';
        }
        
        const advertenciasActivas = Array.isArray(advertencias) ? advertencias.length : 0;
        const bansArray = Array.isArray(bans) ? bans : [];
        const bansTemporales = bansArray.filter(b => b && b.tipo === 'temporal').length;
        const bansPermanentes = bansArray.filter(b => b && b.tipo === 'permanente').length;
        
        // Calcular días desde registro
        let diasDesdeRegistro = 0;
        try {
            const fechaRegistro = new Date(usuario.fecha_registro);
            if (!isNaN(fechaRegistro.getTime())) {
                diasDesdeRegistro = Math.floor((new Date() - fechaRegistro) / (1000 * 60 * 60 * 24));
            }
        } catch (e) {

        }
        
        let suggestion = '';
        let tipoRecomendado = 'temporal';
        let diasRecomendados = 7;
        
        // Análisis de riesgo
        if (bansPermanentes > 0) {
            suggestion = '⚠️ <strong>Usuario ya tiene ban permanente.</strong> No se puede aplicar otro ban.';
            return suggestion;
        } else if (bansTemporales >= 2) {
            tipoRecomendado = 'permanente';
            suggestion = `🔴 <strong>Recomendación: Ban Permanente</strong><br>El usuario tiene ${bansTemporales} bans temporales previos. Según las reglas del sistema, el próximo ban temporal se convertirá automáticamente en permanente. Se recomienda aplicar directamente un ban permanente si la infracción es grave.`;
        } else if (advertenciasActivas >= 3) {
            tipoRecomendado = 'temporal';
            diasRecomendados = 14;
            suggestion = `🟠 <strong>Recomendación: Ban Temporal de 14 días</strong><br>El usuario tiene ${advertenciasActivas} advertencias activas. Un ban temporal de 14 días es apropiado para dar tiempo de reflexión.`;
        } else if (advertenciasActivas >= 2) {
            tipoRecomendado = 'temporal';
            diasRecomendados = 7;
            suggestion = `🟡 <strong>Recomendación: Ban Temporal de 7 días</strong><br>El usuario tiene ${advertenciasActivas} advertencias activas. Un ban temporal de 7 días es estándar para este nivel de infracciones.`;
        } else if (bansTemporales === 1) {
            tipoRecomendado = 'temporal';
            diasRecomendados = 14;
            suggestion = `🟠 <strong>Recomendación: Ban Temporal de 14 días</strong><br>El usuario ya tiene 1 ban temporal previo. Si aplicas otro ban temporal, el siguiente será permanente. Considera aumentar la duración a 14 días para dar más tiempo de corrección.`;
        } else if (advertenciasActivas === 1) {
            tipoRecomendado = 'temporal';
            diasRecomendados = 3;
            suggestion = `🟢 <strong>Recomendación: Ban Temporal de 3-7 días</strong><br>El usuario tiene solo 1 advertencia. Un ban temporal corto (3-7 días) puede ser suficiente como medida preventiva.`;
        } else if (diasDesdeRegistro < 7 && diasDesdeRegistro >= 0) {
            tipoRecomendado = 'temporal';
            diasRecomendados = 1;
            suggestion = `ℹ️ <strong>Usuario nuevo:</strong> Registrado hace ${diasDesdeRegistro} días. Considera un ban temporal corto (1-3 días) para usuarios nuevos, a menos que la infracción sea muy grave.`;
        } else {
            tipoRecomendado = 'temporal';
            diasRecomendados = 7;
            suggestion = `✅ <strong>Recomendación: Ban Temporal de 7 días</strong><br>Usuario sin historial previo de sanciones. Un ban temporal estándar de 7 días es apropiado para una primera infracción grave.`;
        }
        
        // Actualizar el formulario con la recomendación
        setTimeout(() => {
            try {
                const banTipoSelect = document.getElementById('banTipo');
                const banDiasInput = document.getElementById('banDias');
                if (banTipoSelect && banDiasInput) {
                    banTipoSelect.value = tipoRecomendado;
                    banDiasInput.value = diasRecomendados;
                    if (typeof updateBanDiasVisibility === 'function') {
                        updateBanDiasVisibility();
                    }
                }
            } catch (e) {

            }
        }, 100);
        
        return suggestion || '✅ <strong>Recomendación: Ban Temporal de 7 días</strong><br>Usuario sin historial previo de sanciones.';
    } catch (error) {

        return '⚠️ <strong>Error:</strong> No se pudo analizar el usuario. Por favor, intenta nuevamente.';
    }
}
*/

// ==================== INTENTOS DE CONTENIDO OFENSIVO ====================
// NOTA: La función loadIntentosOfensivos ya está definida al inicio del archivo
// Crear referencia local para uso interno
const loadIntentosOfensivos = window.loadIntentosOfensivos;

// Función auxiliar para agrupar intentos
function agruparIntentos(intentos) {
    const intentosAgrupados = {};
    
    intentos.forEach(intento => {
        let claveAgrupacion;
        
        if (intento.tipo_intento === 'registro_usuario') {
            // Agrupar por email para intentos de registro
            const email = intento.intento_email || intento.usuario_email || 'unknown';
            claveAgrupacion = `email_${email}`;
        } else {
            // Para otros tipos, agrupar por usuario_id o IP
            claveAgrupacion = intento.usuario_id 
                ? `usuario_${intento.usuario_id}` 
                : `ip_${intento.ip_address || 'unknown'}`;
        }
        
        if (!intentosAgrupados[claveAgrupacion]) {
            intentosAgrupados[claveAgrupacion] = [];
        }
        intentosAgrupados[claveAgrupacion].push(intento);
    });
    
    return intentosAgrupados;
}

function renderIntentosOfensivos(intentos, totalGrupos = null) {
    const tbody = document.getElementById('intentosOfensivosTableBody');
    if (!tbody) return;
    
    if (intentos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding: 2rem; text-align: center; color: #999;">No hay intentos registrados</td></tr>';
        return;
    }
    
    // Agrupar intentos por email (para registro_usuario) o por usuario_id (para otros tipos)
    const intentosAgrupados = agruparIntentos(intentos);
    
    // Renderizar grupos
    let html = '';
    Object.keys(intentosAgrupados).forEach(clave => {
        const grupo = intentosAgrupados[clave];
        const primerIntento = grupo[0];
        const cantidadIntentos = grupo.length;
        
        // Si hay múltiples intentos del mismo email/usuario, mostrar agrupado
        const esAgrupado = cantidadIntentos > 1;
        
        const tipoBadge = {
            'registro_usuario': '<span class="badge badge-danger">Registro Usuario</span>',
            'registro_animal': '<span class="badge badge-warning">Registro Animal</span>',
            'registro_ambiental': '<span class="badge badge-info">Registro Ambiental</span>'
        }[primerIntento.tipo_intento] || '<span class="badge badge-secondary">' + primerIntento.tipo_intento + '</span>';
        
        // Determinar información del usuario
        let usuarioInfo = '';
        if (primerIntento.usuario_id && primerIntento.usuario_nombre) {
            usuarioInfo = `${escapeHtml(primerIntento.usuario_nombre)}<br><small style="color: #666;">${escapeHtml(primerIntento.usuario_email)}</small>`;
        } else if (primerIntento.intento_nombre || primerIntento.intento_email) {
            const nombre = primerIntento.intento_nombre || 'Sin nombre';
            const email = primerIntento.intento_email || '';
            usuarioInfo = `${escapeHtml(nombre)}<br><small style="color: #f57c00;">${escapeHtml(email)}</small><br><small style="color: #999; font-size: 0.8rem;">(No registrado)</small>`;
        } else {
            usuarioInfo = '<span style="color: #999;">Usuario no identificado</span>';
        }
        
        // Agregar badge de cantidad si está agrupado
        if (esAgrupado) {
            usuarioInfo += `<br><span style="background: #ff9800; color: white; padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.75rem; font-weight: 600; margin-top: 0.25rem; display: inline-block;">${cantidadIntentos} intento${cantidadIntentos > 1 ? 's' : ''}</span>`;
        }
        
        // Consolidar campos afectados de todos los intentos del grupo
        const todosLosCampos = new Set();
        const todosLosContenidos = {
            nombres: new Set(),
            emails: new Set(),
            passwords: new Set()
        };
        
        grupo.forEach(intento => {
            if (intento.campos_afectados) {
                intento.campos_afectados.split(', ').forEach(campo => todosLosCampos.add(campo.trim()));
            }
            
            if (intento.contenido_intentado) {
                const contenido = typeof intento.contenido_intentado === 'string' 
                    ? JSON.parse(intento.contenido_intentado) 
                    : intento.contenido_intentado;
                
                if (contenido.nombre) todosLosContenidos.nombres.add(contenido.nombre);
                if (contenido.email) todosLosContenidos.emails.add(contenido.email);
                if (contenido.password) todosLosContenidos.passwords.add(contenido.password);
            }
        });
        
        const camposAfectadosTexto = Array.from(todosLosCampos).join(', ');
        const camposBadges = Array.from(todosLosCampos).map(campo => 
            `<span class="badge badge-danger" style="margin-right: 0.25rem;">${escapeHtml(campo)}</span>`
        ).join('');
        
        // Construir preview del contenido
        let contenidoPreview = '';
        if (todosLosContenidos.nombres.size > 0) {
            contenidoPreview += `<strong>Nombre${todosLosContenidos.nombres.size > 1 ? 's' : ''}:</strong> ${Array.from(todosLosContenidos.nombres).slice(0, 3).map(n => escapeHtml(n)).join(', ')}${todosLosContenidos.nombres.size > 3 ? '...' : ''}<br>`;
        }
        if (todosLosContenidos.emails.size > 0) {
            contenidoPreview += `<strong>Email${todosLosContenidos.emails.size > 1 ? 's' : ''}:</strong> ${Array.from(todosLosContenidos.emails).slice(0, 2).map(e => escapeHtml(e)).join(', ')}<br>`;
        }
        if (todosLosContenidos.passwords.size > 0) {
            contenidoPreview += `<strong>Contraseña${todosLosContenidos.passwords.size > 1 ? 's' : ''}:</strong> ${Array.from(todosLosContenidos.passwords).slice(0, 2).map(p => escapeHtml(p)).join(', ')}`;
        }
        
        if (!contenidoPreview) {
            contenidoPreview = '<span style="color: #999;">Sin contenido</span>';
        }
        
        // Fecha: mostrar rango si hay múltiples intentos
        let fechaTexto = formatDate(primerIntento.fecha_intento);
        if (esAgrupado && grupo.length > 1) {
            const ultimoIntento = grupo[grupo.length - 1];
            fechaTexto = `${formatDate(primerIntento.fecha_intento)}<br><small style="color: #999;">Último: ${formatDate(ultimoIntento.fecha_intento)}</small>`;
        }
        
        html += `
            <tr style="border-bottom: 1px solid #eee; ${esAgrupado ? 'background: #fff9e6;' : ''}">
                <td style="padding: 1rem;">
                    ${esAgrupado ? `<strong>${primerIntento.id}-${grupo[grupo.length - 1].id}</strong><br><small style="color: #999;">(${cantidadIntentos} registros)</small>` : primerIntento.id}
                </td>
                <td style="padding: 1rem;">${usuarioInfo}</td>
                <td style="padding: 1rem;">${tipoBadge}</td>
                <td style="padding: 1rem;">${camposBadges || '<span class="badge badge-danger">' + escapeHtml(camposAfectadosTexto) + '</span>'}</td>
                <td style="padding: 1rem; max-width: 300px; font-size: 0.9rem;">${contenidoPreview}</td>
                <td style="padding: 1rem; font-family: monospace; font-size: 0.85rem;">${escapeHtml(primerIntento.ip_address || 'N/A')}</td>
                <td style="padding: 1rem;">${fechaTexto}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function actualizarPaginacionIntentos(totalGrupos, offset, limit) {
    const paginacionDiv = document.getElementById('paginacionIntentos');
    const infoPaginacion = document.getElementById('infoPaginacionIntentos');
    const btnAnterior = document.getElementById('btnAnteriorIntentos');
    const btnSiguiente = document.getElementById('btnSiguienteIntentos');
    
    if (!paginacionDiv || !infoPaginacion) return;
    
    if (totalGrupos === 0) {
        paginacionDiv.style.display = 'none';
        return;
    }
    
    paginacionDiv.style.display = 'block';
    const paginaActual = Math.floor(offset / limit) + 1;
    const totalPaginas = Math.ceil(totalGrupos / limit);
    
    // Mostrar información de grupos (usuarios/IPs únicos), no intentos individuales
    infoPaginacion.textContent = `Página ${paginaActual} de ${totalPaginas} (${totalGrupos} usuario${totalGrupos !== 1 ? 's' : ''} único${totalGrupos !== 1 ? 's' : ''})`;
    
    if (btnAnterior) {
        btnAnterior.disabled = paginaActual === 1;
        btnAnterior.onclick = () => {
            if (paginaActual > 1) {
                paginaIntentos--;
                loadIntentosOfensivos();
            }
        };
    }
    
    if (btnSiguiente) {
        btnSiguiente.disabled = paginaActual >= totalPaginas;
        btnSiguiente.onclick = () => {
            if (paginaActual < totalPaginas) {
                paginaIntentos++;
                loadIntentosOfensivos();
            }
        };
    }
}

// ==================== SISTEMA DE IA AUTÓNOMA ====================

// Almacén de notificaciones y acciones propuestas
let iaNotificaciones = [];
let iaHistorial = [];

// Variable para el intervalo de análisis automático
let intervaloIAAutonoma = null;

// ========== FUNCIONES DE IA AUTÓNOMA DESACTIVADAS ==========
// La detección de contenido ofensivo en el backend sigue activa
/*
function initIAAutonoma() {

    renderNotificacionesIA();
    renderHistorialIA();
    
    // Actualizar última revisión múltiples veces para asegurar que se actualice
    setTimeout(() => actualizarUltimaRevision(), 100);
    setTimeout(() => actualizarUltimaRevision(), 500);
    setTimeout(() => actualizarUltimaRevision(), 1000);
}
*/

/*
function iniciarIAAutonoma() {

    // Verificar que tenemos token antes de iniciar
    const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';

    if (!token) {

        if (window.adminAuthSystem) {
        }
        // Intentar nuevamente después de 2 segundos (máximo 5 intentos)
        if (!window._iaRetryCount) window._iaRetryCount = 0;
        window._iaRetryCount++;
        if (window._iaRetryCount < 5) {

            setTimeout(() => {
                iniciarIAAutonoma();
            }, 2000);
        } else {

        }
        return;
    }
    
    // Resetear contador de reintentos si tenemos token
    window._iaRetryCount = 0;

    // Ejecutar análisis inmediatamente al cargar

    .toISOString());
    
    analizarUsuariosConIA(true).then(() => {

    }).catch(error => {

        // NO actualizar última revisión si falla
    });
    
    // Configurar intervalo para ejecutar cada 5 minutos (300000 ms)
    // Limpiar intervalo anterior si existe
    if (intervaloIAAutonoma) {

        clearInterval(intervaloIAAutonoma);
    }
    
    intervaloIAAutonoma = setInterval(() => {

        .toISOString());
        analizarUsuariosConIA(true).then(() => {

        }).catch(error => {

        });
    }, 5 * 60 * 1000); // 5 minutos

    // Hacer la función disponible globalmente para debugging
    window.iniciarIAAutonoma = iniciarIAAutonoma;
    // analizarUsuariosConIA ya está disponible globalmente desde su definición

}
*/

/*
function actualizarUltimaRevision() {
    try {
        const ahora = new Date();
        const hora = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const fecha = ahora.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        const textoFecha = `${fecha} a las ${hora}`;
        
        // Intentar múltiples veces con diferentes estrategias
        const elemento = document.getElementById('ultimaRevisionIA');
        if (elemento) {
            elemento.textContent = textoFecha;
            elemento.innerHTML = textoFecha; // También usar innerHTML por si acaso

            return true;
        } else {

            // Intentar varias veces con diferentes delays
            const intentos = [100, 300, 500, 1000, 2000];
            intentos.forEach((delay, index) => {
                setTimeout(() => {
                    const elementoRetry = document.getElementById('ultimaRevisionIA');
                    if (elementoRetry) {
                        elementoRetry.textContent = textoFecha;
                        elementoRetry.innerHTML = textoFecha;
                    } else if (index === intentos.length - 1) {

                    }
                }, delay);
            });
            return false;
        }
    } catch (error) {

        return false;
    }
}

}
*/

// window.actualizarUltimaRevision = actualizarUltimaRevision;

/*

window.analizarUsuariosConIA = async function analizarUsuariosConIA(modoSilencioso = false) {
    const inicioAnalisis = Date.now();

    .toISOString());
    
    try {
        // Verificar token PRIMERO
        const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
        if (!token) {

            if (!modoSilencioso) {
                alert('Error: No estás autenticado');
            }
            throw new Error('No hay token de autenticación');
        }

        // Cargar usuarios si no están cargados
        if (!allUsers || allUsers.length === 0) {

            await loadUsuarios();

        } else {

        }
        
        // Filtrar solo usuarios normales (no admins)
        const usuariosAAnalizar = allUsers.filter(u => 
            u.rol !== 'admin' && 
            u.activo !== false
        );

        const accionesPropuestas = [];
        
        // Analizar cada usuario
        for (const usuario of usuariosAAnalizar) {
            try {
                let usuarioData, advertencias, bans;
                
                // Obtener datos reales del usuario
                const [infoResponse, advertenciasResponse, bansResponse] = await Promise.all([
                    fetch(`${getApiBaseUrl()}?action=get_usuario_info&token=${token}&usuario_id=${usuario.id}`),
                    fetch(`${getApiBaseUrl()}?action=listar_advertencias&token=${token}&usuario_id=${usuario.id}`),
                    fetch(`${getApiBaseUrl()}?action=listar_bans&token=${token}&usuario_id=${usuario.id}&solo_activos=true`)
                ]);
                
                const infoData = await infoResponse.json();
                const advertenciasData = await advertenciasResponse.json();
                const bansData = await bansResponse.json();
                
                if (!infoData.success) continue;
                
                usuarioData = infoData.usuario;
                advertencias = advertenciasData.success ? advertenciasData.advertencias.filter(a => a.activa) : [];
                // Filtrar bans activos: permanentes siempre activos si activo=true, temporales solo si no han expirado
                bans = bansData.success ? bansData.bans.filter(b => {
                    if (!b.activo) return false;
                    if (b.tipo === 'permanente') return true;
                    if (b.tipo === 'temporal') {
                        if (!b.fecha_fin) return true; // Si no tiene fecha_fin, considerar activo
                        return new Date(b.fecha_fin) > new Date(); // Solo activo si fecha_fin es futura
                    }
                    return false;
                }) : [];
                
                // Log detallado para TODOS los usuarios con advertencias
                if (advertencias.length > 0) {
                }
                
                // Analizar y decidir acción
                const accion = decidirAccionAutomatica(usuarioData, advertencias, bans);
                
                if (accion) {
                    accionesPropuestas.push({
                        ...accion,
                        usuario: usuarioData,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    // Log detallado cuando NO se propone acción
                    if (advertencias.length >= 2) {
                    }
                }
                
                // Pequeña pausa para no sobrecargar
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {

            }
        }
        
        // Analizar también intentos ofensivos recientes

        const accionesPorIntentos = await analizarIntentosOfensivos(token);

        if (accionesPorIntentos.length > 0) {

        }
        
        accionesPropuestas.push(...accionesPorIntentos);

        if (accionesPropuestas.length > 0) {

        } else {

            // Contar usuarios con diferentes números de advertencias (solo si hay usuarios y no son muchos)
            if (usuariosAAnalizar.length > 0 && usuariosAAnalizar.length <= 50) {
                let usuariosConAdvertencias = 0;
                let usuariosCon2Advertencias = 0;
                let usuariosCon3MasAdvertencias = 0;
                let usuariosConBansActivos = 0;

                for (const usuario of usuariosAAnalizar.slice(0, 20)) { // Limitar a primeros 20 para no sobrecargar
                    try {
                        const [advertenciasResponse, bansResponse] = await Promise.all([
                            fetch(`${getApiBaseUrl()}?action=listar_advertencias&token=${token}&usuario_id=${usuario.id}`),
                            fetch(`${getApiBaseUrl()}?action=listar_bans&token=${token}&usuario_id=${usuario.id}&solo_activos=true`)
                        ]);
                        
                        const advertenciasData = await advertenciasResponse.json();
                        const bansData = await bansResponse.json();
                        
                        const advertenciasActivas = advertenciasData.success ? advertenciasData.advertencias.filter(a => a.activa).length : 0;
                        const bansActivos = bansData.success ? bansData.bans.filter(b => {
                            if (!b.activo) return false;
                            if (b.tipo === 'permanente') return true;
                            if (b.tipo === 'temporal' && b.fecha_fin) {
                                return new Date(b.fecha_fin) > new Date();
                            }
                            return false;
                        }).length : 0;
                        
                        if (advertenciasActivas > 0) usuariosConAdvertencias++;
                        if (advertenciasActivas === 2) usuariosCon2Advertencias++;
                        if (advertenciasActivas >= 3) usuariosCon3MasAdvertencias++;
                        if (bansActivos > 0) usuariosConBansActivos++;
                    } catch (e) {
                        // Ignorar errores en diagnóstico
                    }
                }

            } else if (usuariosAAnalizar.length > 50) {
                // Muchos usuarios
            }
        }
        
        // Agregar notificaciones (siempre agregar, incluso si se ejecutan después)
        // NO reemplazar, sino agregar a las existentes
        const notificacionesAntes = iaNotificaciones.length;
        iaNotificaciones = [...iaNotificaciones, ...accionesPropuestas];
        const notificacionesDespues = iaNotificaciones.length;

        // Renderizar notificaciones PRIMERO

        renderNotificacionesIA();
        
        // SIEMPRE ejecutar acciones automáticamente (modo autónomo activo)
        // PERO esperar más tiempo para que las notificaciones se muestren primero
        if (accionesPropuestas.length > 0) {

            // Esperar suficiente tiempo para que las notificaciones se rendericen y sean visibles
            setTimeout(() => {

                ejecutarAccionesAutomaticas(accionesPropuestas);
                // Re-renderizar después de ejecutar para actualizar el estado
                setTimeout(() => {

                    renderNotificacionesIA();
                    renderHistorialIA();
                }, 500);
            }, 2000); // Esperar 2 segundos para que el usuario vea las notificaciones
        } else {

        }
        
        // SOLO actualizar timestamp de última revisión SI el análisis se completó correctamente
        const tiempoTranscurrido = ((Date.now() - inicioAnalisis) / 1000).toFixed(2);

        actualizarUltimaRevision();
        
        // Solo mostrar alertas si NO es modo silencioso
        if (!modoSilencioso) {
            if (accionesPropuestas.length > 0) {
                alert(`✅ Análisis completado.\n\nSe propusieron ${accionesPropuestas.length} acciones automáticas.\n\nLas acciones se están ejecutando automáticamente.`);
            } else {
                alert('✅ Análisis completado.\n\nNo se encontraron usuarios que requieran acciones automáticas en este momento.');
            }
        } else {
            // En modo silencioso, solo log en consola
            if (accionesPropuestas.length > 0) {

            } else {

            }
        }
        
    } catch (error) {

        // Actualizar última revisión incluso si hay error
        actualizarUltimaRevision();
        if (!modoSilencioso) {
            alert('Error al analizar usuarios: ' + error.message);
        }
    }
};

}
*/

// Analizar intentos ofensivos recientes y proponer acciones
async function analizarIntentosOfensivos(token) {
    const acciones = [];
    
    try {

        // Obtener intentos ofensivos (aumentar límite para detectar usuarios con muchos intentos)
        const response = await fetch(`${getApiBaseUrl()}?action=get_intentos_ofensivos&token=${token}&limit=200&offset=0`);
        const data = await response.json();
        
        if (!data.success) {

            return acciones;
        }
        
        if (!data.intentos || data.intentos.length === 0) {

            return acciones;
        }

        // Filtrar intentos recientes (últimas 24 horas) PERO también considerar todos los intentos para usuarios registrados
        const ahora = new Date();
        const intentosRecientes = data.intentos.filter(intento => {
            const fechaIntento = new Date(intento.fecha_intento);
            const horasDesdeIntento = (ahora - fechaIntento) / (1000 * 60 * 60);
            return horasDesdeIntento <= 24;
        });
        
        // Para usuarios registrados, considerar TODOS los intentos (no solo los de 24 horas)
        // Esto permite detectar usuarios con muchos intentos acumulados
        const todosLosIntentos = data.intentos;

        if (intentosRecientes.length === 0 && todosLosIntentos.length === 0) {
            return acciones;
        }
        
        // Agrupar por IP y email para detectar patrones
        const intentosPorIP = {};
        const intentosPorEmail = {};
        
        intentosRecientes.forEach(intento => {
            const ip = intento.ip_address || 'unknown';
            const email = intento.intento_email || intento.usuario_email || 'unknown';
            
            if (!intentosPorIP[ip]) intentosPorIP[ip] = [];
            if (!intentosPorEmail[email]) intentosPorEmail[email] = [];
            
            intentosPorIP[ip].push(intento);
            intentosPorEmail[email].push(intento);
        });
        
        // Detectar patrones sospechosos - IPs con múltiples intentos (CAMBIADO: ahora detecta desde 1 intento)
        Object.keys(intentosPorIP).forEach(ip => {
            const intentos = intentosPorIP[ip];
            if (intentos.length >= 1) { // CAMBIADO: antes era >= 3, ahora es >= 1
                acciones.push({
                    tipo: 'notificacion',
                    subtipo: 'intentos_multiples_ip',
                    ip: ip,
                    cantidad: intentos.length,
                    motivo: `⚠️ Se detectó${intentos.length > 1 ? 'n' : ''} ${intentos.length} intento${intentos.length > 1 ? 's' : ''} de contenido ofensivo desde la IP ${ip} en las últimas 24 horas.${intentos.length >= 3 ? ' Posible ataque o comportamiento malicioso.' : ''}`,
                    prioridad: intentos.length >= 3 ? 'alta' : 'media',
                    razonamiento: `${intentos.length > 1 ? 'Múltiples intentos' : 'Un intento'} desde la misma IP ${intentos.length >= 3 ? 'indica un patrón de comportamiento malicioso' : 'puede indicar comportamiento sospechoso'}. Se recomienda monitorear esta IP.`,
                    timestamp: new Date().toISOString(),
                    usuario: null,
                    esIntento: true
                });
            }
        });
        
        // Detectar intentos de registro rechazados - AGRUPAR POR EMAIL Y ANALIZAR CAMPOS
        Object.keys(intentosPorEmail).forEach(email => {
            if (email === 'unknown') return;
            
            const intentos = intentosPorEmail[email];
            const intentosRegistro = intentos.filter(i => i.tipo_intento === 'registro_usuario');
            
            if (intentosRegistro.length > 0) {

                // Analizar todos los campos ofensivos encontrados en todos los intentos de este email
                const todosLosCamposOfensivos = new Set();
                const contenidoCompleto = {
                    nombres: new Set(),
                    emails: new Set(),
                    passwords: new Set()
                };
                
                intentosRegistro.forEach(intento => {
                    // Extraer campos afectados de cada intento
                    const camposAfectados = intento.campos_afectados ? intento.campos_afectados.split(', ') : [];
                    camposAfectados.forEach(campo => todosLosCamposOfensivos.add(campo.trim()));
                    
                    // Extraer contenido intentado
                    if (intento.contenido_intentado) {
                        const contenido = typeof intento.contenido_intentado === 'string' 
                            ? JSON.parse(intento.contenido_intentado) 
                            : intento.contenido_intentado;
                        
                        if (contenido.nombre) contenidoCompleto.nombres.add(contenido.nombre);
                        if (contenido.email) contenidoCompleto.emails.add(contenido.email);
                        if (contenido.password) contenidoCompleto.passwords.add(contenido.password);
                    }
                });
                
                const camposUnicos = Array.from(todosLosCamposOfensivos);
                const tieneNombreOfensivo = camposUnicos.includes('nombre');
                const tieneEmailOfensivo = camposUnicos.includes('email');
                const tienePasswordOfensivo = camposUnicos.includes('contraseña');
                
                // Construir mensaje detallado
                let detalleCampos = [];
                if (tieneNombreOfensivo) detalleCampos.push(`nombre${contenidoCompleto.nombres.size > 1 ? 's' : ''} ofensivo${contenidoCompleto.nombres.size > 1 ? 's' : ''}`);
                if (tieneEmailOfensivo) detalleCampos.push(`email ofensivo`);
                if (tienePasswordOfensivo) detalleCampos.push(`contraseña${contenidoCompleto.passwords.size > 1 ? 's' : ''} ofensiva${contenidoCompleto.passwords.size > 1 ? 's' : ''}`);
                
                const detalleTexto = detalleCampos.length > 0 
                    ? ` (${detalleCampos.join(', ')})`
                    : '';

                const nuevaNotificacion = {
                    tipo: 'notificacion',
                    subtipo: 'intentos_registro_rechazado',
                    email: email,
                    cantidad: intentosRegistro.length,
                    campos_ofensivos: camposUnicos,
                    tiene_nombre_ofensivo: tieneNombreOfensivo,
                    tiene_email_ofensivo: tieneEmailOfensivo,
                    tiene_password_ofensivo: tienePasswordOfensivo,
                    contenido_ejemplos: {
                        nombres: Array.from(contenidoCompleto.nombres).slice(0, 3), // Máximo 3 ejemplos
                        passwords: Array.from(contenidoCompleto.passwords).slice(0, 3)
                    },
                    motivo: `🚫 Se detectó${intentosRegistro.length > 1 ? 'n' : ''} ${intentosRegistro.length} intento${intentosRegistro.length > 1 ? 's' : ''} de registro con contenido ofensivo desde el email ${email}${detalleTexto}. ${intentosRegistro.length > 1 ? 'Intentos repetidos detectados.' : 'El registro fue rechazado automáticamente.'}`,
                    prioridad: intentosRegistro.length >= 2 ? 'alta' : 'media',
                    razonamiento: `Usuario intentando registrarse con contenido ofensivo en: ${camposUnicos.join(', ')}${intentosRegistro.length > 1 ? ' de forma recurrente' : ''}. Se recomienda considerar bloquear este email si persiste.`,
                    timestamp: new Date().toISOString(),
                    usuario: null,
                    esIntento: true
                };

                acciones.push(nuevaNotificacion);

            }
        });
        
        // Notificar sobre intentos de usuarios registrados Y PROPOR ACCIONES AUTOMÁTICAS
        // IMPORTANTE: Usar TODOS los intentos para usuarios registrados, no solo los de 24 horas
        const intentosDeUsuariosRegistrados = todosLosIntentos.filter(i => i.usuario_id && i.usuario_nombre);
        if (intentosDeUsuariosRegistrados.length > 0) {
            const usuariosAfectados = [...new Set(intentosDeUsuariosRegistrados.map(i => i.usuario_id))];
            
            usuariosAfectados.forEach(usuarioId => {
                // Contar TODOS los intentos de este usuario (no solo los de 24 horas)
                const intentosUsuario = intentosDeUsuariosRegistrados.filter(i => i.usuario_id === usuarioId);
                const usuario = intentosUsuario[0];
                
                // También contar intentos recientes para el mensaje
                const intentosRecientesUsuario = intentosRecientes.filter(i => i.usuario_id === usuarioId);

                // IMPORTANTE: Si un usuario tiene muchos intentos, proponer acción automática
                if (intentosUsuario.length >= 20) {
                    // Más de 20 intentos → Ban permanente automático

                    acciones.push({
                        tipo: 'ban',
                        subtipo: 'permanente',
                        usuario_id: usuarioId,
                        dias: null,
                        motivo: `Ban permanente automático: El usuario ${usuario.usuario_nombre} ha intentado publicar contenido ofensivo ${intentosUsuario.length} veces. Este comportamiento recurrente y masivo justifica un ban permanente.`,
                        prioridad: 'critica',
                        razonamiento: `Usuario con ${intentosUsuario.length} intentos ofensivos detectados. Este es un patrón de comportamiento claramente malicioso y recurrente que requiere acción inmediata.`,
                        timestamp: new Date().toISOString(),
                        usuario: {
                            id: usuarioId,
                            nombre: usuario.usuario_nombre,
                            email: usuario.usuario_email
                        },
                        esIntento: true
                    });
                } else if (intentosUsuario.length >= 10) {
                    // Entre 10 y 19 intentos → Ban temporal de 14 días

                    acciones.push({
                        tipo: 'ban',
                        subtipo: 'temporal',
                        usuario_id: usuarioId,
                        dias: 14,
                        motivo: `Ban temporal automático: El usuario ${usuario.usuario_nombre} ha intentado publicar contenido ofensivo ${intentosUsuario.length} veces en las últimas 24 horas. Se aplica ban temporal de 14 días como medida preventiva.`,
                        prioridad: 'alta',
                        razonamiento: `Usuario con ${intentosUsuario.length} intentos ofensivos detectados. Este comportamiento recurrente requiere una acción disciplinaria inmediata.`,
                        timestamp: new Date().toISOString(),
                        usuario: {
                            id: usuarioId,
                            nombre: usuario.usuario_nombre,
                            email: usuario.usuario_email
                        },
                        esIntento: true
                    });
                } else if (intentosUsuario.length >= 5) {
                    // Entre 5 y 9 intentos → Ban temporal de 7 días

                    acciones.push({
                        tipo: 'ban',
                        subtipo: 'temporal',
                        usuario_id: usuarioId,
                        dias: 7,
                        motivo: `Ban temporal automático: El usuario ${usuario.usuario_nombre} ha intentado publicar contenido ofensivo ${intentosUsuario.length} veces en las últimas 24 horas. Se aplica ban temporal de 7 días.`,
                        prioridad: 'alta',
                        razonamiento: `Usuario con ${intentosUsuario.length} intentos ofensivos detectados. Este comportamiento recurrente requiere una acción disciplinaria.`,
                        timestamp: new Date().toISOString(),
                        usuario: {
                            id: usuarioId,
                            nombre: usuario.usuario_nombre,
                            email: usuario.usuario_email
                        },
                        esIntento: true
                    });
                } else {
                    // Menos de 5 intentos → Solo notificación
                    acciones.push({
                        tipo: 'notificacion',
                        subtipo: 'usuario_con_intentos_ofensivos',
                        usuario_id: usuarioId,
                        cantidad: intentosUsuario.length,
                        motivo: `⚠️ El usuario ${usuario.usuario_nombre} (${usuario.usuario_email}) intentó publicar contenido ofensivo ${intentosUsuario.length} vez(ces) en las últimas 24 horas.`,
                        prioridad: 'alta',
                        razonamiento: `Usuario registrado con comportamiento ofensivo${intentosUsuario.length > 1 ? ' recurrente' : ''}. Se recomienda revisar su historial y considerar acciones disciplinarias.`,
                        timestamp: new Date().toISOString(),
                        usuario: {
                            id: usuarioId,
                            nombre: usuario.usuario_nombre,
                            email: usuario.usuario_email
                        },
                        esIntento: true
                    });
                }
            });
        }

        if (acciones.length > 0) {

        } else {

        }
        
    } catch (error) {

    }

    return acciones;
}

// Decidir qué acción automática tomar basada en el análisis
function decidirAccionAutomatica(usuario, advertencias, bans) {
    const advertenciasActivas = advertencias.length;
    
    // Filtrar bans activos correctamente (temporales solo si no han expirado)
    const ahora = new Date();
    const bansActivos = bans.filter(b => {
        if (!b.activo) return false;
        if (b.tipo === 'permanente') return true;
        if (b.tipo === 'temporal') {
            if (!b.fecha_fin) return true; // Si no tiene fecha_fin, considerar activo
            return new Date(b.fecha_fin) > ahora; // Solo activo si fecha_fin es futura
        }
        return false;
    });
    
    const bansPermanentes = bansActivos.filter(b => b.tipo === 'permanente').length;
    const bansTemporales = bansActivos.filter(b => b.tipo === 'temporal').length;
    
    // Log detallado SOLO para usuarios con advertencias
    if (advertenciasActivas > 0) {
    }

    // No hacer nada si ya tiene ban permanente
    if (bansPermanentes > 0) {
        if (advertenciasActivas > 0) {

        }
        return null;
    }
    
    // No hacer nada si ya tiene ban temporal activo (evitar duplicados)
    if (bansTemporales > 0) {
        if (advertenciasActivas > 0) {

        }
        return null;
    }
    
    // Regla 1: Si tiene 3 o más advertencias activas → Ban temporal automático
    if (advertenciasActivas >= 3) {
        return {
            tipo: 'ban',
            subtipo: 'temporal',
            dias: 7,
            motivo: `Ban temporal automático: El usuario tiene ${advertenciasActivas} advertencias activas. Según las reglas del sistema, se aplica ban temporal de 7 días.`,
            prioridad: 'alta',
            razonamiento: `Usuario con ${advertenciasActivas} advertencias activas. La política del sistema establece que 3 advertencias activan automáticamente un ban temporal.`
        };
    }
    
    // Regla 2: Si tiene 2 advertencias activas → Advertencia de que la próxima será ban
    if (advertenciasActivas === 2) {
        return {
            tipo: 'advertencia',
            motivo: `Advertencia preventiva: El usuario tiene 2 advertencias activas. La próxima advertencia activará automáticamente un ban temporal de 7 días.`,
            prioridad: 'media',
            razonamiento: `Usuario con 2 advertencias activas. Se recomienda monitorear de cerca. La próxima infracción activará un ban temporal automático.`
        };
    }
    
    // Regla 3: Si tiene 2 bans temporales previos y nueva advertencia → Ban permanente
    const bansTemporalesPrevios = bans.filter(b => b.tipo === 'temporal' && !b.activo).length;
    if (bansTemporalesPrevios >= 2 && advertenciasActivas >= 1) {
        return {
            tipo: 'ban',
            subtipo: 'permanente',
            motivo: `Ban permanente automático: El usuario tiene ${bansTemporalesPrevios} bans temporales previos y ${advertenciasActivas} advertencia(s) activa(s). Según las reglas, se aplica ban permanente.`,
            prioridad: 'critica',
            razonamiento: `Usuario con historial de ${bansTemporalesPrevios} bans temporales previos y ${advertenciasActivas} advertencia(s) activa(s). El patrón de comportamiento recurrente justifica un ban permanente.`
        };
    }
    
    // Regla 4: Si tiene 1 ban temporal previo y 2 advertencias → Ban temporal extendido
    if (bansTemporalesPrevios === 1 && advertenciasActivas >= 2) {
        return {
            tipo: 'ban',
            subtipo: 'temporal',
            dias: 14,
            motivo: `Ban temporal extendido: El usuario tiene 1 ban temporal previo y ${advertenciasActivas} advertencias activas. Se aplica ban temporal de 14 días como medida preventiva.`,
            prioridad: 'alta',
            razonamiento: `Usuario con historial de ban temporal previo y ${advertenciasActivas} advertencias activas. Se requiere una medida más estricta para prevenir comportamiento recurrente.`
        };
    }
    
    // Regla 5: Patrón de comportamiento recurrente (advertencias recientes)
    if (advertenciasActivas > 0) {
        const advertenciasRecientes = advertencias.filter(a => {
            const fecha = new Date(a.fecha_advertencia);
            const diasDesdeAdvertencia = (new Date() - fecha) / (1000 * 60 * 60 * 24);
            return diasDesdeAdvertencia < 7; // Advertencias en los últimos 7 días
        });
        
        if (advertenciasRecientes.length >= 2) {
            return {
                tipo: 'advertencia',
                motivo: `Advertencia por comportamiento recurrente: El usuario ha recibido ${advertenciasRecientes.length} advertencias en los últimos 7 días. Se requiere atención inmediata.`,
                prioridad: 'media',
                razonamiento: `Patrón de comportamiento recurrente detectado. ${advertenciasRecientes.length} advertencias en los últimos 7 días indican un comportamiento problemático continuo.`
            };
        }
    }
    
    return null;
}

// Ejecutar acciones automáticas
async function ejecutarAccionesAutomaticas(acciones) {

    const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
    if (!token) {

        return;
    }
    
    for (const accion of acciones) {
        try {
            // Las notificaciones de tipo 'notificacion' son solo informativas, no requieren acción
            if (accion.tipo === 'notificacion') {

                // Buscar la notificación por múltiples criterios para asegurar que se encuentre
                const notifIndex = iaNotificaciones.findIndex(n => {
                    // Comparar por timestamp (si existe)
                    if (n.timestamp && accion.timestamp) {
                        // Permitir diferencia de hasta 1 segundo
                        const diff = Math.abs(new Date(n.timestamp) - new Date(accion.timestamp));
                        if (diff <= 1000 && n.tipo === accion.tipo) return true;
                    }
                    // Comparar por email/IP si existe
                    if (accion.email && (n.email === accion.email || n.usuario?.email === accion.email)) {
                        if (n.tipo === accion.tipo && n.subtipo === accion.subtipo) return true;
                    }
                    if (accion.ip && n.ip === accion.ip) {
                        if (n.tipo === accion.tipo && n.subtipo === accion.subtipo) return true;
                    }
                    return false;
                });
                
                if (notifIndex !== -1) {

                    iaNotificaciones[notifIndex].ejecutada = true;
                    iaNotificaciones[notifIndex].fechaEjecucion = new Date().toISOString();
                } else {

                }
                
                // Agregar al historial como notificación vista
                iaHistorial.push({
                    ...accion,
                    ejecutada: true,
                    resultado: { success: true, message: 'Notificación registrada' },
                    fechaEjecucion: new Date().toISOString()
                });
                
                continue;
            }
            
            let resultado;
            
            // Manejar acciones de advertencia
            if (accion.tipo === 'advertencia') {
                const usuarioId = accion.usuario?.id || accion.usuario_id;
                if (usuarioId) {
                    resultado = await ejecutarAdvertenciaAutomatica(usuarioId, accion.motivo, token);
                } else {

                    continue;
                }
            } 
            // Manejar acciones de ban
            else if (accion.tipo === 'ban') {
                const usuarioId = accion.usuario?.id || accion.usuario_id;
                if (usuarioId) {
                    const dias = accion.subtipo === 'permanente' ? null : (accion.dias || 7);
                    resultado = await ejecutarBanAutomatico(usuarioId, accion.subtipo, dias, accion.motivo, token);
                } else {

                    continue;
                }
            } else {

                continue;
            }
            
            if (resultado && resultado.success) {
                // Agregar al historial
                iaHistorial.push({
                    ...accion,
                    ejecutada: true,
                    resultado: resultado,
                    fechaEjecucion: new Date().toISOString()
                });
                
                // Marcar como ejecutada en notificaciones en lugar de removerla
                const notifIndex = iaNotificaciones.findIndex(n => 
                    n.usuario.id === accion.usuario.id && 
                    n.tipo === accion.tipo &&
                    n.timestamp === accion.timestamp
                );
                
                if (notifIndex !== -1) {
                    iaNotificaciones[notifIndex].ejecutada = true;
                    iaNotificaciones[notifIndex].fechaEjecucion = new Date().toISOString();
                    // Actualizar renderizado inmediatamente
                    renderNotificacionesIA();
                }
            }
            
            // Pausa entre acciones
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            const usuarioId = accion.usuario?.id || 'desconocido';

            iaHistorial.push({
                ...accion,
                ejecutada: false,
                error: error.message,
                fechaEjecucion: new Date().toISOString()
            });
        }
    }
    
    // Renderizar una última vez para asegurar que todo esté actualizado
    renderNotificacionesIA();
    renderHistorialIA();
    
    // Recargar usuarios para reflejar cambios
    if (acciones.length > 0) {
        await loadUsuarios();
    }
}

// Ejecutar advertencia automática
async function ejecutarAdvertenciaAutomatica(usuarioId, motivo, token) {
    const response = await fetch(`${getApiBaseUrl()}?action=dar_advertencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, usuario_id: usuarioId, motivo })
    });
    
    return await response.json();
}

// Ejecutar ban automático
async function ejecutarBanAutomatico(usuarioId, tipo, dias, motivo, token) {
    const response = await fetch(`${getApiBaseUrl()}?action=dar_ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            token, 
            usuario_id: usuarioId, 
            tipo, 
            dias: tipo === 'temporal' ? dias : null,
            motivo 
        })
    });
    
    return await response.json();
}

/*
function renderNotificacionesIA() {
    const container = document.getElementById('iaNotificaciones');
    if (!container) {

        return;
    }

    // Filtrar solo notificaciones no ejecutadas para mostrar
    const notificacionesPendientes = iaNotificaciones.filter(n => !n.ejecutada);

    if (iaNotificaciones.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #999;">
                <p>No hay acciones propuestas aún.</p>
                <p style="font-size: 0.9rem;">La IA está analizando automáticamente. Las acciones aparecerán aquí cuando se detecten problemas.</p>
            </div>
        `;
        return;
    }
    
    // Mostrar todas las notificaciones, incluso las ejecutadas (pero marcadas)
    let html = '';
    
    // Ordenar: primero las pendientes, luego las ejecutadas
    const notificacionesOrdenadas = [...iaNotificaciones].sort((a, b) => {
        if (a.ejecutada && !b.ejecutada) return 1;
        if (!a.ejecutada && b.ejecutada) return -1;
        return 0;
    });
    
    notificacionesOrdenadas.forEach((notif, index) => {
        const prioridadColor = {
            'critica': '#d32f2f',
            'alta': '#f57c00',
            'media': '#fbc02d',
            'baja': '#388e3c'
        }[notif.prioridad] || '#666';
        
        // Determinar tipo de notificación
        let tipoIcon, tipoTexto, usuarioInfo;
        
        if (notif.tipo === 'notificacion' && notif.esIntento) {
            // Notificación de intentos ofensivos
            tipoIcon = '🚫';
            tipoTexto = 'Intento Ofensivo Detectado';
            
            if (notif.usuario) {
                usuarioInfo = `${escapeHtml(notif.usuario.nombre)}<br><small style="color: #666;">${escapeHtml(notif.usuario.email)}</small>`;
            } else if (notif.email) {
                usuarioInfo = `<span style="color: #f57c00;">${escapeHtml(notif.email)}</span><br><small style="color: #999;">(No registrado)</small>`;
            } else if (notif.ip) {
                usuarioInfo = `<span style="color: #f57c00;">IP: ${escapeHtml(notif.ip)}</span>`;
            } else {
                usuarioInfo = '<span style="color: #999;">Usuario no identificado</span>';
            }
        } else {
            // Notificación normal de advertencia/ban
            tipoIcon = notif.tipo === 'ban' ? '🚫' : '⚠️';
            tipoTexto = notif.tipo === 'ban' 
                ? `Ban ${notif.subtipo === 'permanente' ? 'Permanente' : `Temporal (${notif.dias} días)`}`
                : 'Advertencia';
            
            usuarioInfo = notif.usuario 
                ? `${escapeHtml(notif.usuario.nombre)}<br><small style="color: #666;">${escapeHtml(notif.usuario.email)}</small>`
                : '<span style="color: #999;">Usuario no identificado</span>';
        }
        
        const ejecutadaBadge = notif.ejecutada 
            ? '<span style="background: #4caf50; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600; margin-left: 0.5rem;">✅ EJECUTADA</span>'
            : '';
        
        html += `
            <div style="border-left: 4px solid ${prioridadColor}; padding: 1.5rem; margin-bottom: 1rem; background: ${notif.ejecutada ? '#e8f5e9' : '#f9f9f9'}; border-radius: 4px; opacity: ${notif.ejecutada ? '0.8' : '1'};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h4 style="margin: 0 0 0.5rem 0; color: #333;">
                            ${tipoIcon} ${tipoTexto}${ejecutadaBadge}
                        </h4>
                        <p style="margin: 0; color: #666; font-size: 0.9rem;">
                            ${usuarioInfo}
                        </p>
                        ${notif.fechaEjecucion ? `<p style="margin: 0.25rem 0 0 0; color: #999; font-size: 0.8rem;">Ejecutada: ${new Date(notif.fechaEjecucion).toLocaleString('es-ES')}</p>` : ''}
                        ${notif.cantidad ? `<p style="margin: 0.25rem 0 0 0; color: #999; font-size: 0.8rem;">Cantidad: ${notif.cantidad} intento(s)</p>` : ''}
                    </div>
                    <span style="background: ${prioridadColor}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
                        ${notif.prioridad.toUpperCase()}
                    </span>
                </div>
                <p style="margin: 0.5rem 0; color: #333;"><strong>Motivo:</strong> ${escapeHtml(notif.motivo)}</p>
                ${notif.campos_ofensivos && notif.campos_ofensivos.length > 0 ? `
                    <div style="margin: 0.5rem 0; padding: 0.75rem; background: #fff3cd; border-left: 3px solid #ffc107; border-radius: 4px;">
                        <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #856404;">📋 Campos con contenido ofensivo detectado:</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${notif.campos_ofensivos.map(campo => `
                                <span style="background: #ffc107; color: #856404; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
                                    ${escapeHtml(campo)}
                                </span>
                            `).join('')}
                        </div>
                        ${notif.contenido_ejemplos && (notif.contenido_ejemplos.nombres.length > 0 || notif.contenido_ejemplos.passwords.length > 0) ? `
                            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #ffc107;">
                                <p style="margin: 0 0 0.25rem 0; font-size: 0.85rem; color: #856404;"><strong>Ejemplos detectados:</strong></p>
                                ${notif.contenido_ejemplos.nombres.length > 0 ? `
                                    <p style="margin: 0.25rem 0; font-size: 0.8rem; color: #856404;">
                                        <strong>Nombres:</strong> ${notif.contenido_ejemplos.nombres.map(n => escapeHtml(n)).join(', ')}
                                    </p>
                                ` : ''}
                                ${notif.contenido_ejemplos.passwords.length > 0 ? `
                                    <p style="margin: 0.25rem 0; font-size: 0.8rem; color: #856404;">
                                        <strong>Contraseñas:</strong> ${notif.contenido_ejemplos.passwords.map(p => escapeHtml(p)).join(', ')}
                                    </p>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                <p style="margin: 0.5rem 0; color: #666; font-size: 0.9rem;"><strong>Razonamiento IA:</strong> ${escapeHtml(notif.razonamiento)}</p>
                ${!notif.ejecutada && notif.tipo !== 'notificacion' ? `
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button onclick="ejecutarAccionManual(${index})" class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">
                        ✅ Ejecutar Ahora
                    </button>
                    <button onclick="descartarNotificacion(${index})" class="btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">
                        ❌ Descartar
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    });

    if (html.length > 0) {
        );
    }
    
    container.innerHTML = html;

}

}
*/

/*
function renderHistorialIA() {
    const container = document.getElementById('iaHistorial');
    if (!container) return;
    
    if (iaHistorial.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #999;">
                <p>No hay acciones ejecutadas aún.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    iaHistorial.slice().reverse().forEach((item) => {
        const estadoColor = item.ejecutada ? '#4caf50' : '#f44336';
        const estadoTexto = item.ejecutada ? '✅ Ejecutada' : '❌ Error';
        
        // Determinar icono y texto según el tipo
        let tipoIcon, tipoTexto, usuarioInfo;
        
        if (item.tipo === 'notificacion' && item.esIntento) {
            // Notificación de intentos ofensivos
            tipoIcon = '🚫';
            tipoTexto = 'Intento Ofensivo Detectado';
            
            if (item.usuario) {
                usuarioInfo = escapeHtml(item.usuario.nombre);
            } else if (item.email) {
                usuarioInfo = `<span style="color: #f57c00;">${escapeHtml(item.email)}</span> <small style="color: #999;">(No registrado)</small>`;
            } else if (item.ip) {
                usuarioInfo = `<span style="color: #f57c00;">IP: ${escapeHtml(item.ip)}</span>`;
            } else {
                usuarioInfo = '<span style="color: #999;">Usuario no identificado</span>';
            }
        } else {
            // Notificación normal de advertencia/ban
            tipoIcon = item.tipo === 'ban' ? '🚫' : '⚠️';
            tipoTexto = item.tipo === 'ban' 
                ? `Ban ${item.subtipo === 'permanente' ? 'Permanente' : `Temporal (${item.dias || 7} días)`}`
                : 'Advertencia';
            
            usuarioInfo = item.usuario && item.usuario.nombre 
                ? escapeHtml(item.usuario.nombre)
                : '<span style="color: #999;">Usuario no identificado</span>';
        }
        
        html += `
            <div style="border-left: 4px solid ${estadoColor}; padding: 1rem; margin-bottom: 0.5rem; background: #f9f9f9; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <p style="margin: 0; font-weight: 600;">
                            ${tipoIcon} ${tipoTexto} - ${usuarioInfo} - ${estadoTexto}
                        </p>
                        <p style="margin: 0.25rem 0; color: #666; font-size: 0.85rem;">
                            ${escapeHtml(item.motivo)}
                        </p>
                        ${item.cantidad ? `<p style="margin: 0.25rem 0; color: #999; font-size: 0.75rem;">Cantidad: ${item.cantidad} intento(s)</p>` : ''}
                        <p style="margin: 0.25rem 0; color: #999; font-size: 0.75rem;">
                            ${item.fechaEjecucion ? new Date(item.fechaEjecucion).toLocaleString('es-ES') : 'Fecha no disponible'}
                        </p>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Ejecutar acción manualmente desde notificación (global para onclick)
window.ejecutarAccionManual = async function(index) {
    const accion = iaNotificaciones[index];
    if (!accion) return;
    
    const token = window.adminAuthSystem ? window.adminAuthSystem.getToken() : '';
    if (!token) {
        alert('Error: No estás autenticado');
        return;
    }
    
    try {
        let resultado;
        
        if (accion.tipo === 'advertencia') {
            resultado = await ejecutarAdvertenciaAutomatica(accion.usuario.id, accion.motivo, token);
        } else if (accion.tipo === 'ban') {
            resultado = await ejecutarBanAutomatico(accion.usuario.id, accion.subtipo, accion.dias || 7, accion.motivo, token);
        }
        
        if (resultado && resultado.success) {
            iaHistorial.push({
                ...accion,
                ejecutada: true,
                resultado: resultado,
                fechaEjecucion: new Date().toISOString()
            });
            
            iaNotificaciones.splice(index, 1);
            renderNotificacionesIA();
            renderHistorialIA();
            await loadUsuarios();
            
            alert('✅ Acción ejecutada correctamente');
        } else {
            alert('❌ Error al ejecutar acción: ' + (resultado?.message || 'Error desconocido'));
        }
    } catch (error) {

        alert('Error al ejecutar acción: ' + error.message);
    }
}

// Descartar notificación (global para onclick)
}
*/

/*
window.descartarNotificacion = function(index) {
    iaNotificaciones.splice(index, 1);
    renderNotificacionesIA();
}
*/

/*
function limpiarNotificacionesIA() {
    if (confirm('¿Estás seguro de que deseas limpiar todas las notificaciones?')) {
        iaNotificaciones = [];
        renderNotificacionesIA();
    }
}
*/

// Verificación FINAL de que las funciones están disponibles (ejecutar inmediatamente al final del script)
(function() {
    // Verificar loadApelaciones
    if (typeof window.loadApelaciones !== 'function') {

        window.loadApelaciones = async function() {
            alert('Error: La función no se cargó correctamente. Por favor, recarga la página (Ctrl+F5).');
        };
    }
    
    // Verificar loadIntentosOfensivos
    if (typeof window.loadIntentosOfensivos !== 'function') {

        window.loadIntentosOfensivos = function() {
            alert('Error: La función no se cargó correctamente. Por favor, recarga la página (Ctrl+F5).');

        };

    }
    
    // IA Autónoma desactivada - comentado
    // if (typeof window.analizarUsuariosConIA !== 'function') {
    //     
    // } else {
    //     
    // }

})();

