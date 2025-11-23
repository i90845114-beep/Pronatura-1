// Almacenamiento de registros en localStorage
const STORAGE_KEY = 'animalRecords';

// Variables globales para filtros
let allRecords = [];
let categorias = [];
let subcategorias = [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadRecords();
    setupEventListeners();
});

// Cargar registros desde la base de datos
async function loadRecords() {
    const grid = document.getElementById('recordsGrid');
    
    if (!grid) {
        console.error('❌ No se encontró el elemento recordsGrid');
        return;
    }
    
    // Mostrar estado de carga
    grid.innerHTML = `
        <div class="empty-state">
            <h3>Cargando registros...</h3>
            <p>Por favor espera</p>
        </div>
    `;
    
    // Esperar un momento para que auth.js termine de verificar
    // No redirigir automáticamente - solo mostrar mensaje si no hay usuario
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // VERIFICAR SI HAY NAVEGACIÓN INTERNA ANTES DE CUALQUIER VERIFICACIÓN
    const accesoPermitido = sessionStorage.getItem('index_acceso_permitido') === 'true';
    const navegandoInternamente = sessionStorage.getItem('navegando_internamente') === 'true';
    const referrer = document.referrer || '';
    const esNavegacionInterna = referrer && referrer.length > 0 && (
        referrer.includes('mapa-consolidado.html') ||
        referrer.includes('bloc-notas.html') ||
        referrer.includes('nuevo-registro.html') ||
        referrer.includes('catalogo.html') ||
        referrer.includes('admin.html')
    );
    
    // Si hay navegación interna, NO hacer nada - permitir que la página cargue normalmente
    if (accesoPermitido || navegandoInternamente || esNavegacionInterna) {
        console.log('✅ [script.js] Navegación interna detectada - NO VERIFICAR USUARIO');
        console.log('🔍 [script.js] Flags:', {
            accesoPermitido: accesoPermitido,
            navegandoInternamente: navegandoInternamente,
            esNavegacionInterna: esNavegacionInterna,
            referrer: referrer
        });
        // Continuar con el flujo normal aunque no haya usuario detectado todavía
        // El usuario puede estar cargándose todavía
    }
    
    const currentUser = window.authSystem ? window.authSystem.getCurrentUser() : null;
    
    if (!currentUser) {
        console.log('⚠️ No hay usuario autenticado en script.js');
        
        // Si hay navegación interna, NO redirigir - solo mostrar mensaje
        if (accesoPermitido || navegandoInternamente || esNavegacionInterna) {
            console.log('✅ [script.js] Navegación interna - NO REDIRIGIR, solo mostrar mensaje');
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>Comienza a registrar</h3>
                    <p>Accede a la aplicación para comenzar a registrar animales</p>
                    <button onclick="window.location.href='inicio.html'" style="margin-top: 1rem; padding: 0.8rem 2rem; background: #4D8143; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1.1rem; font-weight: 600;">
                        Ir a la Aplicación
                    </button>
                </div>
            `;
            return;
        }
        
        // NO redirigir automáticamente - auth.js maneja las redirecciones
        // Solo mostrar mensaje con botón opcional
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Comienza a registrar</h3>
                <p>Accede a la aplicación para comenzar a registrar animales</p>
                <button onclick="window.location.href='inicio.html'" style="margin-top: 1rem; padding: 0.8rem 2rem; background: #4D8143; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1.1rem; font-weight: 600;">
                    Ir a la Aplicación
                </button>
            </div>
        `;
        return;
    }
    
    console.log('✅ Usuario autenticado:', currentUser);
    
    try {
        // Cargar categorías primero
        console.log('📡 Cargando categorías...');
        await loadCategorias();
        
        // Usar la nueva API de registros ambientales
        console.log('📡 Cargando registros para usuario:', currentUser.id);
        const apiUrl = `../api/api.php?action=get_registros_ambientales&usuario_id=${currentUser.id}&current_user_id=${currentUser.id}`;
        console.log('📡 URL de API:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Respuesta recibida:', data);
        
        if (data.success) {
            allRecords = data.records || [];
            console.log(`✅ ${allRecords.length} registros cargados`);
            
            if (allRecords.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <h3>No hay registros aún</h3>
                        <p>Crea tu primer registro</p>
                        <button onclick="window.location.href='nuevo-registro.html'" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #4D8143; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Crear Registro
                        </button>
                    </div>
                `;
                return;
            }
            
            displayRecords(allRecords);
        } else {
            console.error('❌ Error en respuesta:', data.message);
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>Error al cargar registros</h3>
                    <p>${data.message || 'Intenta recargar la página'}</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #4D8143; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Recargar Página
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Error al cargar registros:', error);
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Error de conexión</h3>
                <p>No se pudieron cargar los registros. Verifica tu conexión e intenta recargar la página.</p>
                <p style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">Error: ${error.message}</p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #4D8143; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Recargar Página
                </button>
            </div>
        `;
    }
}

// Cargar categorías
async function loadCategorias() {
    try {
        const response = await fetch('../api/api.php?action=get_categorias');
        const data = await response.json();
        
        if (data.success && data.categorias) {
            categorias = data.categorias;
            const categoriaSelect = document.getElementById('filterCategoria');
            if (categoriaSelect) {
                // Limpiar opciones existentes excepto la primera
                categoriaSelect.innerHTML = '<option value="">Todas las categorias</option>';
                
                categorias.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.nombre;
                    categoriaSelect.appendChild(option);
                });
                
                console.log('Categorías cargadas:', categorias.length);
            } else {
                console.error('No se encontró el elemento filterCategoria');
            }
        } else {
            console.error('Error en respuesta de categorías:', data);
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

// Cargar subcategorías
async function loadSubcategorias(categoriaId) {
    const subcategoriaSelect = document.getElementById('filterSubcategoria');
    if (!subcategoriaSelect) return;
    
    if (!categoriaId) {
        subcategoriaSelect.innerHTML = '<option value="">Todas las subcategorias</option>';
        subcategoriaSelect.disabled = true;
        return;
    }
    
    try {
        const response = await fetch(`../api/api.php?action=get_subcategorias&categoria_id=${categoriaId}`);
        const data = await response.json();
        
        if (data.success) {
            subcategorias = data.subcategorias;
            subcategoriaSelect.innerHTML = '<option value="">Todas las subcategorias</option>';
            subcategorias.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub.id;
                option.textContent = sub.nombre;
                subcategoriaSelect.appendChild(option);
            });
            subcategoriaSelect.disabled = false;
        }
    } catch (error) {
        console.error('Error al cargar subcategorías:', error);
    }
}

// Mostrar registros
function displayRecords(records) {
    const grid = document.getElementById('recordsGrid');
    if (records.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No se encontraron registros</h3>
                <p>Intenta cambiar los filtros</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = records.map((record, index) => createRecordCard(record, index)).join('');
    attachCardEventListeners();
}

// Crear tarjeta de registro
function createRecordCard(record, index) {
    const date = new Date(record.fecha);
    const formattedDate = date.toLocaleDateString('es-MX');
    const recordId = record.id || index;
    
    // Obtener título (prioridad: nombre, tipo_actividad, descripción breve, categoría, subcategoría)
    let titulo = 'Registro sin título';
    if (record.nombre && record.nombre.trim() !== '' && record.nombre !== 'No especificado') {
        titulo = record.nombre;
    } else if (record.tipo_actividad && record.tipo_actividad.trim() !== '') {
        titulo = record.tipo_actividad;
    } else if (record.descripcion_breve && record.descripcion_breve.trim() !== '') {
        // Truncar descripción si es muy larga
        titulo = record.descripcion_breve.length > 60 
            ? record.descripcion_breve.substring(0, 60) + '...' 
            : record.descripcion_breve;
    } else if (record.subcategoria_nombre && record.subcategoria_nombre.trim() !== '') {
        titulo = record.subcategoria_nombre;
    } else if (record.categoria_nombre && record.categoria_nombre.trim() !== '') {
        titulo = record.categoria_nombre;
    }
    const categoriaInfo = record.categoria_nombre ? 
        `<div class="card-badge">${escapeHtml(record.categoria_nombre)}</div>` : '';
    const subcategoriaInfo = record.subcategoria_nombre ? 
        `<div class="card-badge" style="background: #4caf50; margin-left: 0.5rem;">${escapeHtml(record.subcategoria_nombre)}</div>` : '';
    
    // Crear carrusel de imágenes si hay media (usando thumbnails cuando estén disponibles)
    let imageHtml = '';
    const mediaArray = record.media || record.media_preview || [];
    if (mediaArray.length > 0) {
        const mediaItems = mediaArray.map((mediaItem, mediaIndex) => {
            // Obtener datos del media (soporta formato antiguo y nuevo)
            let mediaSrc, thumbnailSrc, fullMediaSrc;
            
            if (typeof mediaItem === 'string') {
                // Formato antiguo: solo string base64
                mediaSrc = mediaItem;
                fullMediaSrc = mediaItem;
                thumbnailSrc = null;
            } else {
                // Formato nuevo: objeto con data y thumbnail
                mediaSrc = mediaItem.thumbnail || mediaItem.datos_base64 || mediaItem.data || '';
                fullMediaSrc = mediaItem.datos_base64 || mediaItem.data || mediaSrc;
                thumbnailSrc = mediaItem.thumbnail || null;
            }
            
            const isImage = typeof mediaSrc === 'string' && mediaSrc.startsWith('data:image/');
            const isVideo = typeof mediaSrc === 'string' && mediaSrc.startsWith('data:video/');
            const isAudio = typeof mediaSrc === 'string' && mediaSrc.startsWith('data:audio/');
            
            if (isImage) {
                // Usar thumbnail si está disponible, sino usar imagen completa
                const displaySrc = thumbnailSrc || mediaSrc;
                return `<div class="carousel-item ${mediaIndex === 0 ? 'active' : ''}" data-index="${mediaIndex}" style="cursor: pointer;" onclick="showFullImageInCard('${fullMediaSrc}')">
                    <img src="${displaySrc}" alt="${escapeHtml(titulo)} - Imagen ${mediaIndex + 1}" class="card-image" style="object-fit: cover;">
                </div>`;
            } else if (isVideo) {
                // Mostrar thumbnail con icono de play si está disponible
                if (thumbnailSrc) {
                    return `<div class="carousel-item ${mediaIndex === 0 ? 'active' : ''}" data-index="${mediaIndex}" style="cursor: pointer; position: relative;" onclick="showFullVideoInCard('${fullMediaSrc}')">
                        <img src="${thumbnailSrc}" alt="${escapeHtml(titulo)} - Video ${mediaIndex + 1}" class="card-image" style="object-fit: cover;">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 3rem; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); pointer-events: none;">▶</div>
                    </div>`;
                } else {
                    return `<div class="carousel-item ${mediaIndex === 0 ? 'active' : ''}" data-index="${mediaIndex}">
                        <video src="${fullMediaSrc}" controls class="card-image" style="object-fit: cover;"></video>
                    </div>`;
                }
            } else if (isAudio) {
                return `<div class="carousel-item ${mediaIndex === 0 ? 'active' : ''}" data-index="${mediaIndex}">
                    <audio src="${fullMediaSrc}" controls class="card-image" style="width: 100%; padding: 1rem;"></audio>
                </div>`;
            }
            return '';
        }).filter(item => item !== '').join('');
        
        const carouselControls = mediaArray.length > 1 ? `
            <button class="carousel-btn carousel-prev" onclick="changeCarouselImage('${recordId}', -1)">‹</button>
            <button class="carousel-btn carousel-next" onclick="changeCarouselImage('${recordId}', 1)">›</button>
            <div class="carousel-indicators">
                ${mediaArray.map((_, mediaIndex) => 
                    `<span class="carousel-dot ${mediaIndex === 0 ? 'active' : ''}" onclick="goToCarouselImage('${recordId}', ${mediaIndex})"></span>`
                ).join('')}
            </div>
        ` : '';
        
        imageHtml = `
            <div class="card-image-container">
                <div class="carousel-wrapper" id="carousel-${recordId}">
                    ${mediaItems}
                </div>
                ${carouselControls}
            </div>
        `;
    } else {
        imageHtml = `<div class="card-image" style="background: #e0e0e0; display: flex; align-items: center; justify-content: center; color: #999;">Sin evidencia</div>`;
    }
    
    // Información adicional
    const horaInfo = record.hora ? ` • ${record.hora.substring(0, 5)}` : '';
    const comunidadInfo = record.comunidad ? `<div class="card-info">📍 ${escapeHtml(record.comunidad)}${record.sitio ? ' - ' + escapeHtml(record.sitio) : ''}</div>` : '';
    const responsableInfo = record.responsable ? `<div class="card-info">👤 ${escapeHtml(record.responsable)}${record.brigada ? ' - ' + escapeHtml(record.brigada) : ''}</div>` : '';
    const participantesInfo = record.numero_participantes ? `<div class="card-info">👥 ${record.numero_participantes} participantes</div>` : '';
    
    return `
        <div class="record-card" data-id="${recordId}" data-index="${index}">
            <div class="card-header">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <div class="card-title">${escapeHtml(titulo)}</div>
                    <div class="card-actions">
                        <button class="action-icon edit-btn" data-id="${recordId}" title="Editar">✏️</button>
                        <button class="action-icon delete-btn" data-id="${recordId}" title="Eliminar">🗑️</button>
                    </div>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
                    ${categoriaInfo}${subcategoriaInfo}
                </div>
                <div class="card-info">📅 ${formattedDate}${horaInfo}</div>
                ${record.especie ? `<div class="card-info">🦋 Especie: ${escapeHtml(record.especie)}</div>` : ''}
                ${comunidadInfo}
                ${responsableInfo}
                ${participantesInfo}
            </div>
            ${imageHtml}
            <div class="card-location">
                <div class="location-label">Ubicación:</div>
                <div class="location-coords">
                    <span>📍</span>
                    <span>
                        Lat: ${record.latitud}, 
                        Long: ${record.longitud}
                    </span>
                </div>
            </div>
            ${record.descripcion_breve ? `
            <div class="card-notes">
                <div class="notes-label">Descripción:</div>
                <div class="notes-text">${escapeHtml(record.descripcion_breve)}</div>
            </div>
            ` : ''}
            ${record.observaciones ? `
            <div class="card-notes">
                <div class="notes-label">Observaciones:</div>
                <div class="notes-text">${escapeHtml(record.observaciones)}</div>
            </div>
            ` : ''}
            ${record.notas ? `
            <div class="card-notes">
                <div class="notes-label">Notas:</div>
                <div class="notes-text">${escapeHtml(record.notas)}</div>
            </div>
            ` : ''}
        </div>
    `;
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Funciones auxiliares para mostrar imágenes/videos completos desde las tarjetas
window.showFullImageInCard = function(fullImageSrc) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: pointer;';
    modal.innerHTML = `<img src="${fullImageSrc}" style="max-width: 90%; max-height: 90%; object-fit: contain;">`;
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
};

window.showFullVideoInCard = function(videoSrc) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: pointer;';
    modal.innerHTML = `<video src="${videoSrc}" controls autoplay style="max-width: 90%; max-height: 90%;"></video>`;
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    document.body.appendChild(modal);
};

// Adjuntar event listeners a las tarjetas
function attachCardEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const recordId = e.target.dataset.id;
            editRecord(recordId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const recordId = e.target.dataset.id;
            showDeleteModal(recordId);
        });
    });
}

// Configurar event listeners principales
function setupEventListeners() {
    // Botón nuevo registro
    const newRecordBtn = document.getElementById('newRecordBtn');
    if (newRecordBtn) {
        newRecordBtn.addEventListener('click', () => {
            // Verificar autenticación antes de permitir crear registro
            const currentUser = window.authSystem ? window.authSystem.getCurrentUser() : null;
            
            if (!currentUser) {
                // VERIFICAR SI HAY NAVEGACIÓN INTERNA ANTES DE REDIRIGIR
                const accesoPermitido = sessionStorage.getItem('index_acceso_permitido') === 'true';
                const navegandoInternamente = sessionStorage.getItem('navegando_internamente') === 'true';
                const referrer = document.referrer || '';
                const esNavegacionInterna = referrer && referrer.length > 0 && (
                    referrer.includes('mapa-consolidado.html') ||
                    referrer.includes('bloc-notas.html') ||
                    referrer.includes('nuevo-registro.html') ||
                    referrer.includes('catalogo.html') ||
                    referrer.includes('admin.html')
                );
                
                // Si hay navegación interna o flag de acceso permitido, NO REDIRIGIR
                if (accesoPermitido || navegandoInternamente || esNavegacionInterna) {
                    console.log('✅ [script.js] Navegación interna detectada - NO REDIRIGIR');
                    console.log('🔍 [script.js] Flags:', {
                        accesoPermitido: accesoPermitido,
                        navegandoInternamente: navegandoInternamente,
                        esNavegacionInterna: esNavegacionInterna,
                        referrer: referrer
                    });
                    // Mostrar mensaje pero NO redirigir
                    const grid = document.getElementById('recordsGrid');
                    if (grid) {
                        grid.innerHTML = `
                            <div class="empty-state">
                                <h3>Comienza a registrar</h3>
                                <p>Accede a la aplicación para comenzar a registrar animales</p>
                                <button onclick="window.location.href='inicio.html'" style="margin-top: 1rem; padding: 0.8rem 2rem; background: #4D8143; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1.1rem; font-weight: 600;">
                                    Ir a la Aplicación
                                </button>
                            </div>
                        `;
                    }
                    return;
                }
                
                // Solo redirigir si NO hay navegación interna
                // Mostrar modal preguntando si tiene cuenta
                const hasAccount = confirm('¿Ya tienes una cuenta registrada?\n\n- Clic en "Aceptar" si ya tienes cuenta (irás a iniciar sesión)\n- Clic en "Cancelar" si no tienes cuenta (irás a registrarte)');
                
                if (hasAccount) {
                    // Tiene cuenta, ir a inicio.html para iniciar sesión
                    window.location.href = 'inicio.html';
                } else {
                    // No tiene cuenta, ir a registro
                    window.location.href = 'registro.html';
                }
                return;
            }
            
            // Si está autenticado, continuar con el flujo normal
            window.location.href = 'nuevo-registro.html';
        });
    }
    
    // Filtro de categoría
    const filterCategoria = document.getElementById('filterCategoria');
    if (filterCategoria) {
        filterCategoria.addEventListener('change', (e) => {
            loadSubcategorias(e.target.value);
            applyFilters();
        });
    }
    
    // Filtro de subcategoría
    const filterSubcategoria = document.getElementById('filterSubcategoria');
    if (filterSubcategoria) {
        filterSubcategoria.addEventListener('change', () => {
            applyFilters();
        });
    }
    
    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFilters();
        });
    }
    
    // Ordenar
    const sortBtn = document.getElementById('sortBtn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            sortRecords();
        });
    }
    
    // Modal de eliminación
    const deleteModal = document.getElementById('deleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.classList.remove('active');
        });
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            const recordId = confirmDeleteBtn.dataset.idToDelete;
            if (recordId !== undefined) {
                deleteRecord(recordId);
                deleteModal.classList.remove('active');
            }
        });
    }
    
    // Cerrar modal al hacer clic fuera
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                deleteModal.classList.remove('active');
            }
        });
    }
}

// Aplicar todos los filtros
function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value || '';
    const categoriaId = document.getElementById('filterCategoria')?.value || '';
    const subcategoriaId = document.getElementById('filterSubcategoria')?.value || '';
    
    let filtered = [...allRecords];
    
    // Filtro por categoría
    if (categoriaId) {
        filtered = filtered.filter(record => record.categoria_id == categoriaId);
    }
    
    // Filtro por subcategoría
    if (subcategoriaId) {
        filtered = filtered.filter(record => record.subcategoria_id == subcategoriaId);
    }
    
    // Filtro por búsqueda de texto
    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(record => {
            return (record.nombre && record.nombre.toLowerCase().includes(searchLower)) ||
                   (record.especie && record.especie.toLowerCase().includes(searchLower)) ||
                   (record.descripcion_breve && record.descripcion_breve.toLowerCase().includes(searchLower)) ||
                   (record.notas && record.notas.toLowerCase().includes(searchLower)) ||
                   (record.categoria_nombre && record.categoria_nombre.toLowerCase().includes(searchLower)) ||
                   (record.subcategoria_nombre && record.subcategoria_nombre.toLowerCase().includes(searchLower));
        });
    }
    
    displayRecords(filtered);
}

// Ordenar registros
let sortOrder = 'desc';
function sortRecords() {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    
    const searchTerm = document.getElementById('searchInput')?.value || '';
    const categoriaId = document.getElementById('filterCategoria')?.value || '';
    const subcategoriaId = document.getElementById('filterSubcategoria')?.value || '';
    
    let filtered = [...allRecords];
    
    // Aplicar filtros primero
    if (categoriaId) {
        filtered = filtered.filter(record => record.categoria_id == categoriaId);
    }
    if (subcategoriaId) {
        filtered = filtered.filter(record => record.subcategoria_id == subcategoriaId);
    }
    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(record => {
            return (record.nombre && record.nombre.toLowerCase().includes(searchLower)) ||
                   (record.especie && record.especie.toLowerCase().includes(searchLower)) ||
                   (record.descripcion_breve && record.descripcion_breve.toLowerCase().includes(searchLower)) ||
                   (record.notas && record.notas.toLowerCase().includes(searchLower));
        });
    }
    
    // Ordenar
    filtered.sort((a, b) => {
        const dateA = new Date(a.fecha);
        const dateB = new Date(b.fecha);
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    displayRecords(filtered);
}

// Mostrar modal de eliminación
function showDeleteModal(recordId) {
    const modal = document.getElementById('deleteModal');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.dataset.idToDelete = recordId;
    modal.classList.add('active');
}

// Eliminar registro
async function deleteRecord(recordId) {
    const currentUser = window.authSystem ? window.authSystem.getCurrentUser() : null;
    
    if (!currentUser) {
        alert('Debes iniciar sesión para eliminar registros');
        return;
    }
    
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        return;
    }
    
    try {
        const response = await fetch('../api/api.php?action=delete_record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: recordId,
                usuario_id: currentUser.id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadRecords();
        } else {
            alert('Error al eliminar: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión. Intenta nuevamente.');
    }
}

// Editar registro
async function editRecord(recordId) {
    try {
        const response = await fetch(`../api/api.php?action=get_registros_ambientales&id=${recordId}`);
        const data = await response.json();
        
        if (data.success && data.record) {
            const record = data.record;
            // Guardar TODOS los campos del registro para edición
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
            
            sessionStorage.setItem('editingRecord', JSON.stringify(editingRecord));
            window.location.href = 'nuevo-registro.html?edit=true';
        } else {
            alert('Registro no encontrado');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el registro para editar');
    }
}

// Obtener registros desde la base de datos (función legacy mantenida para compatibilidad)
async function getRecords() {
    const currentUser = window.authSystem ? window.authSystem.getCurrentUser() : null;
    
    if (!currentUser) {
        return [];
    }
    
    try {
        // Usar la nueva API de registros ambientales
        const response = await fetch(`../api/api.php?action=get_registros_ambientales&usuario_id=${currentUser.id}`);
        const data = await response.json();
        
        if (data.success) {
            return data.records || [];
        }
        return [];
    } catch (error) {
        console.error('Error al obtener registros:', error);
        return [];
    }
}

// Guardar registros en localStorage
function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// Funciones para controlar el carrusel de imágenes
window.changeCarouselImage = function(recordId, direction) {
    const carousel = document.getElementById(`carousel-${recordId}`);
    if (!carousel) return;
    
    const items = carousel.querySelectorAll('.carousel-item');
    if (items.length === 0) return;
    
    let currentIndex = -1;
    items.forEach((item, index) => {
        if (item.classList.contains('active')) {
            currentIndex = index;
        }
    });
    
    if (currentIndex === -1) return;
    
    // Calcular nuevo índice
    let newIndex = currentIndex + direction;
    if (newIndex < 0) {
        newIndex = items.length - 1;
    } else if (newIndex >= items.length) {
        newIndex = 0;
    }
    
    // Actualizar items
    items[currentIndex].classList.remove('active');
    items[newIndex].classList.add('active');
    
    // Actualizar indicadores
    const dots = carousel.parentElement.querySelectorAll('.carousel-dot');
    if (dots.length > 0) {
        dots[currentIndex].classList.remove('active');
        dots[newIndex].classList.add('active');
    }
};

window.goToCarouselImage = function(recordId, index) {
    const carousel = document.getElementById(`carousel-${recordId}`);
    if (!carousel) return;
    
    const items = carousel.querySelectorAll('.carousel-item');
    if (index < 0 || index >= items.length) return;
    
    // Encontrar item activo actual
    let currentIndex = -1;
    items.forEach((item, i) => {
        if (item.classList.contains('active')) {
            currentIndex = i;
            item.classList.remove('active');
        }
    });
    
    // Activar nuevo item
    items[index].classList.add('active');
    
    // Actualizar indicadores
    const dots = carousel.parentElement.querySelectorAll('.carousel-dot');
    if (dots.length > 0 && currentIndex >= 0) {
        dots[currentIndex].classList.remove('active');
        dots[index].classList.add('active');
    }
};

// Exportar funciones para uso en otros archivos
window.recordManager = {
    getRecords,
    saveRecords
};


