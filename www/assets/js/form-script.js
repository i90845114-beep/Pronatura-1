// Variables globales
let selectedMedia = [];
let mapPinPosition = { x: 50, y: 50 };
let isDragging = false;
let currentZoom = 1;
let locationMap = null; // Mapa de Leaflet para selección de ubicación
let locationMarker = null; // Marcador en el mapa de ubicación

// Función para obtener la ruta de la API según el entorno
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

// CARGAR CATEGORÍAS INMEDIATAMENTE - MÚLTIPLES INTENTOS
function cargarCategoriasInmediatamente() {
    const select = document.getElementById('categoria');
    if (!select) {
        console.error('❌ Select no encontrado');
        setTimeout(cargarCategoriasInmediatamente, 100);
        return;
    }
    
    // Si ya tiene más de 1 opción, no hacer nada
    if (select.options.length > 1) {
        console.log('✅ Ya hay categorías cargadas');
        return;
    }
    
    console.log('🔄 Cargando categorías AHORA...');
    
    fetch(getApiUrl('get_categorias'))
        .then(response => response.json())
        .then(data => {
            if (data.success && data.categorias && data.categorias.length > 0) {
                let html = '<option value="">Selecciona una categoría</option>';
                data.categorias.forEach(cat => {
                    html += `<option value="${cat.id}">${cat.nombre}</option>`;
                });
                select.innerHTML = html;
                console.log(`✅✅✅ ${data.categorias.length} categorías cargadas!`);
            } else {
                console.error('❌ No hay categorías en la respuesta');
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
            setTimeout(cargarCategoriasInmediatamente, 500);
        });
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM cargado, inicializando formulario...');
    cargarCategoriasInmediatamente(); // CARGAR INMEDIATAMENTE
    await initializeForm();
    setupEventListeners();
    await checkEditMode();
    
});

// También intentar cargar cuando la ventana esté completamente lista
window.addEventListener('load', () => {
    console.log('🚀 Ventana completamente cargada, verificando categorías...');
    const categoriaSelect = document.getElementById('categoria');
    if (categoriaSelect && categoriaSelect.options.length <= 1) {
        console.log('⚠️ No hay categorías, cargando de nuevo...');
        cargarCategoriasInmediatamente();
    }
});

// INTENTO ADICIONAL después de 1 segundo
setTimeout(() => {
    const select = document.getElementById('categoria');
    if (select && select.options.length <= 1) {
        console.log('⚠️ Reintento después de 1 segundo...');
        cargarCategoriasInmediatamente();
    }
}, 1000);

// Variables para categorías (con prefijo para evitar conflictos)
let formCategorias = [];
let formSubcategorias = [];

// Inicializar formulario
async function initializeForm() {
    console.log('🔧 Inicializando formulario...');
    
    // Establecer fecha por defecto (hoy)
    const fechaInput = document.getElementById('fecha');
    if (fechaInput && !fechaInput.value) {
        const today = new Date().toISOString().split('T')[0];
        fechaInput.value = today;
    }
    
    // Cargar categorías (ya se carga automáticamente arriba, pero por si acaso)
    setTimeout(() => cargarCategorias(), 100);
    
    // Event listener para cambio de categoría
    const categoriaSelect = document.getElementById('categoria');
    if (categoriaSelect) {
        categoriaSelect.addEventListener('change', function(e) {
            const categoriaId = e.target.value;
            console.log('📌 Categoría seleccionada:', categoriaId);
            if (categoriaId) {
                cargarSubcategorias(categoriaId);
            } else {
                limpiarSubcategorias();
            }
        });
    }
}

// FUNCIÓN SIMPLE Y DIRECTA PARA CARGAR CATEGORÍAS
async function cargarCategorias() {
    console.log('🔄 cargarCategorias() llamada...');
    
    const select = document.getElementById('categoria');
    if (!select) {
        console.error('❌ No se encontró el select de categoría');
        return false;
    }
    
    try {
        const url = getApiUrl('get_categorias');
        console.log('📡 Fetch a:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const resultado = await response.json();
        console.log('📦 Respuesta:', resultado);
        
        if (resultado.success && resultado.categorias && Array.isArray(resultado.categorias) && resultado.categorias.length > 0) {
            formCategorias = resultado.categorias;
            console.log(`✅ ${formCategorias.length} categorías recibidas`);
            
            // LIMPIAR COMPLETAMENTE
            select.innerHTML = '';
            
            // Agregar opción por defecto
            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = 'Selecciona una categoría';
            select.appendChild(defaultOpt);
            
            // Agregar todas las categorías
            formCategorias.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.id;
                opt.textContent = cat.nombre;
                select.appendChild(opt);
            });
            
            console.log(`✅✅✅ ${select.options.length} opciones en el select`);
            console.log('📋 Nombres:', formCategorias.map(c => c.nombre).join(', '));
            
            // FORZAR ACTUALIZACIÓN
            select.dispatchEvent(new Event('change'));
            
            return true;
        } else {
            console.error('❌ Respuesta inválida o vacía:', resultado);
            return false;
        }
    } catch (error) {
        console.error('❌ Error:', error);
        return false;
    }
}

// FUNCIÓN SIMPLE Y DIRECTA PARA CARGAR SUBCATEGORÍAS
async function cargarSubcategorias(categoriaId) {
    console.log('🔄 Cargando subcategorías para categoría:', categoriaId);
    
    const select = document.getElementById('subcategoria');
    if (!select) {
        console.error('❌ No se encontró el select de subcategoría');
        return;
    }
    
    if (!categoriaId || categoriaId === '') {
        limpiarSubcategorias();
        return;
    }
    
    try {
        // URL de la API
        const baseUrl = getApiUrl('get_subcategorias').split('?')[0];
        const url = `${baseUrl}?action=get_subcategorias&categoria_id=${categoriaId}`;
        console.log('📡 Llamando a:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const resultado = await response.json();
        console.log('📦 Respuesta recibida:', resultado);
        
        if (resultado.success && resultado.subcategorias && Array.isArray(resultado.subcategorias)) {
            formSubcategorias = resultado.subcategorias;
            console.log(`✅ Se recibieron ${formSubcategorias.length} subcategorías`);
            
            // LIMPIAR Y LLENAR CON INNERHTML
            let opcionesHTML = '<option value="">Selecciona una subcategoría (opcional)</option>\n';
            
            if (formSubcategorias.length > 0) {
                formSubcategorias.forEach(sub => {
                    opcionesHTML += `<option value="${sub.id}">${sub.nombre}</option>\n`;
                });
            } else {
                opcionesHTML = '<option value="">Sin subcategorías disponibles</option>\n';
            }
            
            select.innerHTML = opcionesHTML;
            select.disabled = false;
            
            console.log(`✅✅✅ ${select.options.length} opciones agregadas al select de subcategorías`);
            console.log('📋 Subcategorías:', formSubcategorias.map(s => s.nombre));
            
            return true;
        } else {
            console.error('❌ Respuesta inválida:', resultado);
            select.innerHTML = '<option value="">Sin subcategorías disponibles</option>';
            select.disabled = false;
            return false;
        }
    } catch (error) {
        console.error('❌ Error al cargar subcategorías:', error);
        select.innerHTML = '<option value="">Error: ' + error.message + '</option>';
        select.disabled = false;
        return false;
    }
}

// Limpiar subcategorías
function limpiarSubcategorias() {
    const select = document.getElementById('subcategoria');
    if (select) {
        select.innerHTML = '<option value="">Selecciona primero una categoría</option>';
        select.disabled = true;
    }
}

// Configurar event listeners
function setupEventListeners() {
    
    // Función para obtener la URL de redirección según el origen
    function getRedirectUrl() {
        const fromAdmin = sessionStorage.getItem('editingFromAdmin') === 'true';
        console.log('🔍 Verificando origen - fromAdmin:', fromAdmin);
        if (fromAdmin) {
            console.log('📍 Redirigiendo a admin.html#registros');
            return 'admin.html#registros';
        }
        // Marcar que viene de cancelación para que auth.js permita acceso
        sessionStorage.setItem('vieneDeCancelacion', 'true');
        console.log('📍 Redirigiendo a index.html (marcado como cancelación)');
        return 'index.html';
    }
    
    // Botón cerrar
    const closeBtn = document.getElementById('closeBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (confirm('¿Deseas cancelar? Los cambios no guardados se perderán.')) {
                window.location.href = getRedirectUrl();
            }
        });
    }
    
    // Botón cancelar
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('¿Deseas cancelar? Los cambios no guardados se perderán.')) {
                window.location.href = getRedirectUrl();
            }
        });
    }
    
    // Botón subir media
    const uploadBtn = document.getElementById('uploadBtn');
    const mediaInput = document.getElementById('mediaInput');
    if (uploadBtn && mediaInput) {
        uploadBtn.addEventListener('click', () => {
            mediaInput.click();
        });
        
        mediaInput.addEventListener('change', (e) => {
            handleMediaUpload(e.target.files);
        });
    }
    
    // Botón seleccionar ubicación
    const selectLocationBtn = document.getElementById('selectLocationBtn');
    if (selectLocationBtn) {
        selectLocationBtn.addEventListener('click', () => {
            openLocationModal();
        });
    }
    
    // Modal de ubicación
    setupLocationModal();
    
    // Envío del formulario
    const form = document.getElementById('newRecordForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

// Verificar modo edición
async function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const editingRecord = sessionStorage.getItem('editingRecord');
    const fromAdmin = sessionStorage.getItem('editingFromAdmin') === 'true';
    
    if (fromAdmin) {
        console.log('🔐 Modo edición detectado desde panel de administración');
    }
    
    if (urlParams.get('edit') === 'true' || editingRecord) {
        // Cambiar título del formulario
        const formTitle = document.getElementById('formTitle');
        if (formTitle) {
            formTitle.textContent = 'Editar Registro';
        }
        
        // Cambiar título de la página
        document.title = 'Editar Registro - Contraloría Social Tamaulipas';
        
        if (editingRecord) {
            try {
                const record = JSON.parse(editingRecord);
                console.log('📝 Modo edición activado. Registro:', record);
                
                // Asegurar que las categorías estén cargadas ANTES de poblar el formulario
                if (formCategorias.length === 0) {
                    console.log('🔄 Cargando categorías antes de poblar formulario...');
                    await cargarCategorias();
                    // Esperar un momento para que se rendericen las opciones
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                
                await populateForm(record);
            } catch (error) {
                console.error('Error al parsear registro de edición:', error);
            }
        } else {
            console.warn('⚠️ Modo edición activado pero no hay registro en sessionStorage');
        }
    } else {
        // Asegurar que el título sea "Nuevo Registro" si no está en modo edición
        const formTitle = document.getElementById('formTitle');
        if (formTitle) {
            formTitle.textContent = 'Nuevo Registro';
        }
        // Limpiar sessionStorage si no está en modo edición
        sessionStorage.removeItem('editingRecord');
    }
}

// Llenar formulario con datos existentes
async function populateForm(record) {
    // Cargar categorías primero si no están cargadas
    if (formCategorias.length === 0) {
        await cargarCategorias();
    }
    
    // Llenar categoría y subcategoría
    if (record.categoria_id) {
        console.log('📌 Estableciendo categoría:', record.categoria_id);
        const categoriaSelect = document.getElementById('categoria');
        if (categoriaSelect) {
            // Asegurar que las opciones estén cargadas
            if (categoriaSelect.options.length <= 1) {
                console.log('⚠️ Categorías no cargadas, cargando ahora...');
                await cargarCategorias();
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            // Establecer el valor de la categoría
            categoriaSelect.value = record.categoria_id;
            console.log('✅ Categoría establecida:', categoriaSelect.value);
            
            // Disparar evento change para cargar subcategorías
            categoriaSelect.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Esperar a que carguen las subcategorías
            await new Promise(resolve => setTimeout(resolve, 600));
            
            // Verificar que las subcategorías se cargaron
            const subcategoriaSelect = document.getElementById('subcategoria');
            if (subcategoriaSelect && subcategoriaSelect.options.length > 1) {
                if (record.subcategoria_id) {
                    console.log('📌 Estableciendo subcategoría:', record.subcategoria_id);
                    subcategoriaSelect.value = record.subcategoria_id;
                    console.log('✅ Subcategoría establecida:', subcategoriaSelect.value);
                    
                    // Verificar que se estableció correctamente
                    if (subcategoriaSelect.value != record.subcategoria_id) {
                        console.warn('⚠️ La subcategoría no se estableció correctamente. Reintentando...');
                        await new Promise(resolve => setTimeout(resolve, 300));
                        subcategoriaSelect.value = record.subcategoria_id;
                    }
                }
            } else {
                console.warn('⚠️ Las subcategorías no se cargaron, intentando cargar manualmente...');
                await cargarSubcategorias(record.categoria_id);
                await new Promise(resolve => setTimeout(resolve, 300));
                if (record.subcategoria_id && subcategoriaSelect) {
                    subcategoriaSelect.value = record.subcategoria_id;
                }
            }
        } else {
            console.error('❌ No se encontró el select de categoría');
        }
    } else {
        console.warn('⚠️ El registro no tiene categoria_id');
    }
    
    // Campos generales
    if (document.getElementById('fecha')) document.getElementById('fecha').value = record.fecha || '';
    if (document.getElementById('hora')) document.getElementById('hora').value = record.hora || '';
    if (document.getElementById('responsable')) document.getElementById('responsable').value = record.responsable || '';
    if (document.getElementById('brigada')) document.getElementById('brigada').value = record.brigada || '';
    if (document.getElementById('latitud')) document.getElementById('latitud').value = record.latitud || '';
    if (document.getElementById('longitud')) document.getElementById('longitud').value = record.longitud || '';
    if (document.getElementById('comunidad')) document.getElementById('comunidad').value = record.comunidad || '';
    if (document.getElementById('sitio')) document.getElementById('sitio').value = record.sitio || '';
    if (document.getElementById('tipo_actividad')) document.getElementById('tipo_actividad').value = record.tipo_actividad || '';
    if (document.getElementById('descripcion_breve')) document.getElementById('descripcion_breve').value = record.descripcion_breve || '';
    if (document.getElementById('observaciones')) document.getElementById('observaciones').value = record.observaciones || '';
    if (document.getElementById('materiales_utilizados')) document.getElementById('materiales_utilizados').value = record.materiales_utilizados || '';
    if (document.getElementById('numero_participantes')) document.getElementById('numero_participantes').value = record.numero_participantes || '';
    
    // Campos originales (opcionales)
    const nombreInput = document.getElementById('nombre');
    const especieInput = document.getElementById('especie');
    if (nombreInput) {
        nombreInput.value = record.nombre || '';
        // Si hay nombre, expandir la sección de campos adicionales
        if (record.nombre) {
            const detailsElement = nombreInput.closest('details');
            if (detailsElement) {
                detailsElement.open = true;
            }
        }
    }
    if (especieInput) {
        especieInput.value = record.especie || '';
        // Si hay especie, expandir la sección de campos adicionales
        if (record.especie) {
            const detailsElement = especieInput.closest('details');
            if (detailsElement) {
                detailsElement.open = true;
            }
        }
    }
    if (document.getElementById('notas')) document.getElementById('notas').value = record.notas || '';
    
    // Cargar media desde record.media (puede ser array de strings o array de objetos)
    const mediaArray = record.media || [];
    if (mediaArray.length > 0) {
        // Convertir strings base64 a objetos con estructura correcta
        selectedMedia = mediaArray.map(mediaData => {
            // Si ya es un objeto con la estructura correcta, devolverlo tal cual
            if (typeof mediaData === 'object' && (mediaData.data || mediaData.datos_base64)) {
                return {
                    type: mediaData.tipo || 'image',
                    data: mediaData.datos_base64 || mediaData.data,
                    name: mediaData.nombre_archivo || 'archivo'
                };
            }
            // Si es un string base64, convertirlo a objeto
            if (typeof mediaData === 'string') {
                // Detectar tipo basándose en el prefijo del data URL
                const isImage = mediaData.startsWith('data:image/');
                const isVideo = mediaData.startsWith('data:video/');
                const isAudio = mediaData.startsWith('data:audio/');
                return {
                    type: isImage ? 'image' : (isVideo ? 'video' : (isAudio ? 'audio' : 'image')),
                    data: mediaData,
                    name: isImage ? 'imagen.jpg' : (isVideo ? 'video.mp4' : (isAudio ? 'audio.mp3' : 'archivo'))
                };
            }
            return null;
        }).filter(m => m !== null); // Filtrar valores nulos
        displayMediaPreview();
    }
}

// ========== FUNCIONES DE COMPRESIÓN Y THUMBNAILS ==========

/**
 * Comprime una imagen y genera un thumbnail
 * @param {File} file - Archivo de imagen
 * @param {number} maxWidth - Ancho máximo para imagen comprimida (default: 1200)
 * @param {number} maxHeight - Alto máximo para imagen comprimida (default: 1200)
 * @param {number} quality - Calidad de compresión 0-1 (default: 0.7)
 * @param {number} thumbSize - Tamaño del thumbnail (default: 300)
 * @returns {Promise<{compressed: string, thumbnail: string, originalSize: number, compressedSize: number, thumbnailSize: number}>}
 */
function compressImageAndCreateThumbnail(file, maxWidth = 1200, maxHeight = 1200, quality = 0.7, thumbSize = 300) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Calcular dimensiones manteniendo proporción
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = width * ratio;
                    height = height * ratio;
                }
                
                // Crear canvas para imagen comprimida
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Obtener imagen comprimida
                const compressed = canvas.toDataURL('image/jpeg', quality);
                
                // Crear thumbnail
                const thumbCanvas = document.createElement('canvas');
                const thumbSizeFinal = Math.min(thumbSize, width, height);
                thumbCanvas.width = thumbSizeFinal;
                thumbCanvas.height = thumbSizeFinal;
                const thumbCtx = thumbCanvas.getContext('2d');
                
                // Calcular posición para centrar el thumbnail (crop cuadrado)
                const sourceSize = Math.min(img.width, img.height);
                const sourceX = (img.width - sourceSize) / 2;
                const sourceY = (img.height - sourceSize) / 2;
                
                thumbCtx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, thumbSizeFinal, thumbSizeFinal);
                const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.6);
                
                // Calcular tamaños en KB
                const originalSize = file.size / 1024;
                const compressedSize = (compressed.length * 3 / 4) / 1024; // Aproximación base64
                const thumbnailSize = (thumbnail.length * 3 / 4) / 1024;
                
                resolve({
                    compressed: compressed,
                    thumbnail: thumbnail,
                    originalSize: originalSize,
                    compressedSize: compressedSize,
                    thumbnailSize: thumbnailSize
                });
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Genera un thumbnail de un video capturando el primer frame
 * @param {File} file - Archivo de video
 * @param {number} thumbSize - Tamaño del thumbnail (default: 300)
 * @returns {Promise<{thumbnail: string, videoData: string, thumbnailSize: number}>}
 */
function createVideoThumbnail(file, thumbSize = 300) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true; // Necesario para algunos navegadores
            video.playsInline = true;
            
            let thumbnailCreated = false;
            
            video.onloadedmetadata = () => {
                video.currentTime = 0.1; // Ir al primer frame
            };
            
            video.onseeked = () => {
                if (thumbnailCreated) return;
                thumbnailCreated = true;
                
                try {
                    // Crear canvas para thumbnail
                    const canvas = document.createElement('canvas');
                    const size = thumbSize;
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    
                    // Calcular dimensiones manteniendo proporción
                    const videoAspect = video.videoWidth / video.videoHeight;
                    let drawWidth = size;
                    let drawHeight = size;
                    let offsetX = 0;
                    let offsetY = 0;
                    
                    if (videoAspect > 1) {
                        // Video más ancho que alto
                        drawHeight = size / videoAspect;
                        offsetY = (size - drawHeight) / 2;
                    } else {
                        // Video más alto que ancho
                        drawWidth = size * videoAspect;
                        offsetX = (size - drawWidth) / 2;
                    }
                    
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, size, size);
                    ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
                    
                    const thumbnail = canvas.toDataURL('image/jpeg', 0.6);
                    const thumbnailSize = (thumbnail.length * 3 / 4) / 1024;
                    
                    // Video original (se puede comprimir más si es necesario)
                    const videoData = e.target.result;
                    
                    resolve({
                        thumbnail: thumbnail,
                        videoData: videoData,
                        thumbnailSize: thumbnailSize
                    });
                } catch (error) {
                    reject(error);
                }
            };
            
            video.onerror = (err) => {
                reject(new Error('Error al cargar video: ' + err));
            };
            
            // Timeout de seguridad
            setTimeout(() => {
                if (!thumbnailCreated) {
                    reject(new Error('Timeout al generar thumbnail del video'));
                }
            }, 10000);
            
            video.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Comprime audio manteniendo el formato original
 * @param {File} file - Archivo de audio
 * @returns {Promise<{audioData: string, size: number}>}
 */
function compressAudio(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const audioData = e.target.result;
            const size = (audioData.length * 3 / 4) / 1024; // Aproximación base64
            resolve({
                audioData: audioData,
                size: size
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Manejar subida de media con compresión y thumbnails
async function handleMediaUpload(files) {
    for (const file of Array.from(files)) {
        try {
            if (file.type.startsWith('image/')) {
                // Comprimir imagen y crear thumbnail
                const result = await compressImageAndCreateThumbnail(file);
                selectedMedia.push({
                    type: 'image',
                    data: result.compressed, // Usar versión comprimida
                    thumbnail: result.thumbnail, // Thumbnail para mostrar en tarjetas
                    name: file.name,
                    originalSize: result.originalSize,
                    compressedSize: result.compressedSize,
                    thumbnailSize: result.thumbnailSize
                });
            } else if (file.type.startsWith('video/')) {
                // Crear thumbnail de video
                const result = await createVideoThumbnail(file);
                selectedMedia.push({
                    type: 'video',
                    data: result.videoData, // Video original (se puede comprimir más si es necesario)
                    thumbnail: result.thumbnail, // Thumbnail para mostrar en tarjetas
                    name: file.name,
                    thumbnailSize: result.thumbnailSize
                });
            } else if (file.type.startsWith('audio/')) {
                // Audio sin compresión especial (ya es pequeño generalmente)
                const result = await compressAudio(file);
                selectedMedia.push({
                    type: 'audio',
                    data: result.audioData,
                    name: file.name,
                    size: result.size
                });
            }
        } catch (error) {
            console.error('Error procesando archivo:', file.name, error);
            alert(`Error al procesar ${file.name}. Por favor, intenta con otro archivo.`);
        }
    }
    displayMediaPreview();
}

// Mostrar preview de media (usando thumbnails cuando estén disponibles)
function displayMediaPreview() {
    const preview = document.getElementById('mediaPreview');
    if (!preview) return;
    
    preview.innerHTML = selectedMedia.map((media, index) => {
        if (media.type === 'image') {
            // Usar thumbnail si está disponible, sino usar imagen comprimida
            const displaySrc = media.thumbnail || media.data;
            const sizeInfo = media.compressedSize ? 
                `<div style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">
                    Original: ${media.originalSize.toFixed(1)} KB → Comprimido: ${media.compressedSize.toFixed(1)} KB
                </div>` : '';
            return `
                <div class="media-item">
                    <img src="${displaySrc}" alt="${media.name}" style="cursor: pointer;" onclick="showFullImage('${media.data}')">
                    ${sizeInfo}
                    <button type="button" class="remove-media" onclick="removeMedia(${index})">×</button>
                </div>
            `;
        } else if (media.type === 'video') {
            // Mostrar thumbnail con icono de play
            const thumbnailSrc = media.thumbnail || '';
            return `
                <div class="media-item">
                    <div style="position: relative; cursor: pointer;" onclick="showFullVideo('${media.data}')">
                        ${thumbnailSrc ? `<img src="${thumbnailSrc}" alt="${media.name}" style="width: 100%; display: block;">` : ''}
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 3rem; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">▶</div>
                    </div>
                    <div style="text-align: center; margin-top: 0.5rem; font-size: 0.9rem; color: #666;">${media.name}</div>
                    <button type="button" class="remove-media" onclick="removeMedia(${index})">×</button>
                </div>
            `;
        } else if (media.type === 'audio') {
            return `
                <div class="media-item">
                    <audio src="${media.data}" controls style="width: 100%;"></audio>
                    <div style="text-align: center; margin-top: 0.5rem; font-size: 0.9rem; color: #666;">${media.name}</div>
                    ${media.size ? `<div style="font-size: 0.75rem; color: #666; text-align: center;">Tamaño: ${media.size.toFixed(1)} KB</div>` : ''}
                    <button type="button" class="remove-media" onclick="removeMedia(${index})">×</button>
                </div>
            `;
        }
        return '';
    }).join('');
}

// Funciones auxiliares para mostrar imágenes/videos completos
window.showFullImage = function(fullImageSrc) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: pointer;';
    modal.innerHTML = `<img src="${fullImageSrc}" style="max-width: 90%; max-height: 90%; object-fit: contain;">`;
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
};

window.showFullVideo = function(videoSrc) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: pointer;';
    modal.innerHTML = `<video src="${videoSrc}" controls autoplay style="max-width: 90%; max-height: 90%;"></video>`;
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    document.body.appendChild(modal);
};

// Remover media
window.removeMedia = function(index) {
    selectedMedia.splice(index, 1);
    displayMediaPreview();
};

// Abrir modal de ubicación
function openLocationModal() {
    const modal = document.getElementById('locationModal');
    const latInput = document.getElementById('latitud');
    const lngInput = document.getElementById('longitud');
    
    // Inicializar mapa de Leaflet si no existe
    if (!locationMap) {
        initializeLocationMap();
    }
    
    // Si hay coordenadas en el formulario, usarlas
    if (latInput.value && lngInput.value) {
        const lat = parseFloat(latInput.value);
        const lng = parseFloat(lngInput.value);
        if (!isNaN(lat) && !isNaN(lng)) {
            updateLocationMarker(lat, lng);
        }
    }
    
    modal.classList.add('active');
    
    // Forzar actualización del tamaño del mapa después de mostrar el modal
    setTimeout(() => {
        if (locationMap) {
            locationMap.invalidateSize();
        }
    }, 100);
}

// Inicializar mapa de Leaflet para selección de ubicación
function initializeLocationMap() {
    if (typeof L === 'undefined') {
        console.error('Leaflet no está cargado');
        return;
    }
    
    const mapContainer = document.getElementById('locationMap');
    if (!mapContainer) {
        console.error('Contenedor del mapa no encontrado');
        return;
    }
    
    // Coordenadas del centro de Tamaulipas
    const tamaulipasCenter = [23.7, -99.0];
    
    // Crear el mapa
    locationMap = L.map('locationMap', {
        center: tamaulipasCenter,
        zoom: 7,
        zoomControl: true
    });
    
    // Agregar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(locationMap);
    
    // Crear marcador inicial en el centro de Tamaulipas
    const defaultIcon = L.divIcon({
        className: 'custom-location-marker',
        html: '<div style="background: #2c7a7b; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div><div style="position: absolute; top: 8px; left: 8px; transform: rotate(45deg); color: white; font-size: 18px;">📍</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
    
    locationMarker = L.marker(tamaulipasCenter, { 
        icon: defaultIcon,
        draggable: true 
    }).addTo(locationMap);
    
    // Actualizar coordenadas cuando se mueve el marcador
    locationMarker.on('dragend', function() {
        const latlng = locationMarker.getLatLng();
        updateLocationCoordinates(latlng.lat, latlng.lng);
    });
    
    // Actualizar marcador cuando se hace clic en el mapa
    locationMap.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        updateLocationMarker(lat, lng);
        updateLocationCoordinates(lat, lng);
    });
    
    // Inicializar coordenadas
    updateLocationCoordinates(tamaulipasCenter[0], tamaulipasCenter[1]);
}

// Actualizar marcador de ubicación
function updateLocationMarker(lat, lng) {
    if (!locationMap || !locationMarker) return;
    
    locationMarker.setLatLng([lat, lng]);
    locationMap.setView([lat, lng], locationMap.getZoom());
}

// Actualizar coordenadas en los inputs
function updateLocationCoordinates(lat, lng) {
    const modalLat = document.getElementById('modalLatitud');
    const modalLng = document.getElementById('modalLongitud');
    const mapCoords = document.getElementById('mapCoordinates');
    
    if (modalLat) modalLat.value = lat.toFixed(5);
    if (modalLng) modalLng.value = lng.toFixed(5);
    if (mapCoords) mapCoords.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// Configurar modal de ubicación
function setupLocationModal() {
    const modal = document.getElementById('locationModal');
    const closeBtn = document.getElementById('closeLocationModal');
    const confirmBtn = document.getElementById('confirmLocationBtn');
    const modalLat = document.getElementById('modalLatitud');
    const modalLng = document.getElementById('modalLongitud');
    
    // Cerrar modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Confirmar ubicación
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const lat = parseFloat(modalLat.value);
            const lng = parseFloat(modalLng.value);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                document.getElementById('latitud').value = lat;
                document.getElementById('longitud').value = lng;
                modal.classList.remove('active');
            } else {
                alert('Por favor ingresa coordenadas válidas');
            }
        });
    }
    
    // Actualizar marcador cuando se cambian las coordenadas manualmente
    if (modalLat) {
        modalLat.addEventListener('input', () => {
            const lat = parseFloat(modalLat.value);
            const lng = parseFloat(modalLng.value);
            if (!isNaN(lat) && !isNaN(lng)) {
                updateLocationMarker(lat, lng);
            }
        });
    }
    
    if (modalLng) {
        modalLng.addEventListener('input', () => {
            const lat = parseFloat(modalLat.value);
            const lng = parseFloat(modalLng.value);
            if (!isNaN(lat) && !isNaN(lng)) {
                updateLocationMarker(lat, lng);
            }
        });
    }
}

// Función legacy para compatibilidad (ya no se usa con Leaflet)
function updateMapPin(lat, lng) {
    if (locationMap && locationMarker) {
        updateLocationMarker(lat, lng);
        updateLocationCoordinates(lat, lng);
    }
}

// Rellenar formulario automáticamente con datos de prueba
function fillFormAutomatically() {
    // Seleccionar categoría y subcategoría aleatorias si hay disponibles
    const categoriaSelect = document.getElementById('categoria');
    if (categoriaSelect && categoriaSelect.options.length > 1) {
        const categoriasDisponibles = Array.from(categoriaSelect.options)
            .filter(opt => opt.value !== '')
            .map(opt => opt.value);
        if (categoriasDisponibles.length > 0) {
            const categoriaAleatoria = categoriasDisponibles[Math.floor(Math.random() * categoriasDisponibles.length)];
            categoriaSelect.value = categoriaAleatoria;
            categoriaSelect.dispatchEvent(new Event('change'));
            
            // Esperar un momento para que carguen las subcategorías
            setTimeout(() => {
                const subcategoriaSelect = document.getElementById('subcategoria');
                if (subcategoriaSelect && subcategoriaSelect.options.length > 1) {
                    const subcategoriasDisponibles = Array.from(subcategoriaSelect.options)
                        .filter(opt => opt.value !== '')
                        .map(opt => opt.value);
                    if (subcategoriasDisponibles.length > 0) {
                        const subcategoriaAleatoria = subcategoriasDisponibles[Math.floor(Math.random() * subcategoriasDisponibles.length)];
                        subcategoriaSelect.value = subcategoriaAleatoria;
                    }
                }
            }, 500);
        }
    }
    
    // Nombres aleatorios para responsable
    const nombres = ['Alex', 'Diego', 'Aaron', 'Allen', 'Carlos', 'María', 'Luis', 'Ana', 'Roberto', 'Patricia', 'Fernando', 'Sofía', 'Miguel', 'Laura'];
    const nombreAleatorio = nombres[Math.floor(Math.random() * nombres.length)];
    
    // Brigadas aleatorias
    const brigadas = ['Brigada Norte', 'Brigada Sur', 'Brigada Centro', 'Brigada Costera', 'Brigada Montaña', 'Brigada Valle'];
    const brigadaAleatoria = brigadas[Math.floor(Math.random() * brigadas.length)];
    
    // Comunidades aleatorias
    const comunidades = ['El Refugio', 'La Esperanza', 'San José', 'Villa Verde', 'Los Pinos', 'El Bosque', 'Santa María', 'La Montaña'];
    const comunidadAleatoria = comunidades[Math.floor(Math.random() * comunidades.length)];
    
    // Sitios aleatorios
    const sitios = ['Sendero Principal', 'Mirador Norte', 'Área de Acampado', 'Zona de Monitoreo', 'Punto de Control', 'Área Restaurada'];
    const sitioAleatorio = sitios[Math.floor(Math.random() * sitios.length)];
    
    // Tipos de actividad aleatorios
    const tiposActividad = [
        'Patrullaje rutinario',
        'Limpieza comunitaria',
        'Monitoreo de fauna',
        'Reforestación',
        'Mantenimiento de senderos',
        'Vigilancia ambiental',
        'Educación ambiental',
        'Control de especies invasoras',
        'Restauración de hábitat',
        'Recolección de residuos'
    ];
    const tipoActividadAleatorio = tiposActividad[Math.floor(Math.random() * tiposActividad.length)];
    
    // Descripciones breves aleatorias
    const descripciones = [
        'Actividad realizada según el plan de trabajo mensual.',
        'Registro de monitoreo rutinario en la zona asignada.',
        'Jornada de trabajo comunitario para conservación ambiental.',
        'Seguimiento de actividades de restauración ecológica.',
        'Actividad de educación y sensibilización ambiental.',
        'Monitoreo y registro de biodiversidad local.',
        'Trabajo de mantenimiento y conservación del área.',
        'Actividad de prevención y control de riesgos ambientales.'
    ];
    const descripcionAleatoria = descripciones[Math.floor(Math.random() * descripciones.length)];
    
    // Especies de fauna silvestre de Tamaulipas (para campos adicionales)
    const especies = [
        'Lince rojo', 'Ocelote', 'Oso negro americano', 'Puma', 'Margay', 'Jaguar',
        'Venado cola blanca', 'Coyote', 'Mapache', 'Zorro gris', 'Armadillo',
        'Jabalí', 'Tlacuache', 'Zorrillo', 'Tejón', 'Nutria', 'Castor'
    ];
    const especieAleatoria = especies[Math.floor(Math.random() * especies.length)];
    
    // Fecha aleatoria (últimos 30 días)
    const hoy = new Date();
    const diasAtras = Math.floor(Math.random() * 30);
    const fechaAleatoria = new Date(hoy);
    fechaAleatoria.setDate(hoy.getDate() - diasAtras);
    const fechaFormato = fechaAleatoria.toISOString().split('T')[0];
    
    // Hora aleatoria (entre 6:00 y 18:00)
    const horaAleatoria = String(Math.floor(Math.random() * 12) + 6).padStart(2, '0') + ':' + 
                          String(Math.floor(Math.random() * 60)).padStart(2, '0');
    
    // Coordenadas aleatorias dentro de Tamaulipas
    // Latitud: 22.5 - 27.5, Longitud: -100.0 - -97.0
    const latitudAleatoria = (22.5 + Math.random() * 5).toFixed(8);
    const longitudAleatoria = (-100.0 + Math.random() * 3).toFixed(8);
    
    // Observaciones aleatorias
    const observacionesOpciones = [
        'Condiciones climáticas favorables durante la actividad.',
        'Se observó buena participación de la comunidad.',
        'El área se encuentra en buen estado de conservación.',
        'Se identificaron algunas áreas que requieren atención.',
        'Actividad completada exitosamente según lo planeado.',
        'Se registraron avistamientos de fauna silvestre.',
        'La zona presenta signos de recuperación ecológica.',
        'Se recomienda continuar con el monitoreo regular.',
        'Condiciones del terreno adecuadas para la actividad.',
        'Se observó presencia de especies nativas en el área.'
    ];
    const observacionesAleatorias = observacionesOpciones[Math.floor(Math.random() * observacionesOpciones.length)];
    
    // Materiales utilizados aleatorios
    const materiales = [
        'Herramientas de campo, GPS, cámara fotográfica',
        'Equipo de seguridad, guantes, bolsas de recolección',
        'Materiales de reforestación, palas, regaderas',
        'Equipo de monitoreo, binoculares, libreta de campo',
        'Herramientas de limpieza, contenedores, guantes',
        'Equipo de medición, GPS, brújula, cinta métrica'
    ];
    const materialesAleatorios = materiales[Math.floor(Math.random() * materiales.length)];
    
    // Número de participantes aleatorio (entre 2 y 15)
    const numeroParticipantes = Math.floor(Math.random() * 14) + 2;
    
    // Notas aleatorias (legacy)
    const notasOpciones = [
        'Me encontraba en una caminata cerca de una aldea cuando lo observé.',
        'Lo encontré en un árbol tomando el sol durante la mañana.',
        'Se ve amigable, pero mejor mantuve la distancia por seguridad.',
        'Avistamiento durante una expedición de campo en la zona.',
        'El animal se encontraba cerca de un arroyo, bebiendo agua.',
        'Observado durante el atardecer, comportamiento normal.',
        'Registro realizado durante monitoreo de fauna silvestre.',
        'El ejemplar se encontraba en buen estado de salud.',
        'Avistamiento casual durante recorrido de rutina.',
        'Observado en su hábitat natural, sin perturbaciones.'
    ];
    const notasAleatorias = notasOpciones[Math.floor(Math.random() * notasOpciones.length)];
    
    // Llenar todos los campos del formulario
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) fechaInput.value = fechaFormato;
    
    const horaInput = document.getElementById('hora');
    if (horaInput) horaInput.value = horaAleatoria;
    
    const responsableInput = document.getElementById('responsable');
    if (responsableInput) responsableInput.value = nombreAleatorio;
    
    const brigadaInput = document.getElementById('brigada');
    if (brigadaInput) brigadaInput.value = brigadaAleatoria;
    
    const comunidadInput = document.getElementById('comunidad');
    if (comunidadInput) comunidadInput.value = comunidadAleatoria;
    
    const sitioInput = document.getElementById('sitio');
    if (sitioInput) sitioInput.value = sitioAleatorio;
    
    const tipoActividadInput = document.getElementById('tipo_actividad');
    if (tipoActividadInput) tipoActividadInput.value = tipoActividadAleatorio;
    
    const descripcionBreveInput = document.getElementById('descripcion_breve');
    if (descripcionBreveInput) descripcionBreveInput.value = descripcionAleatoria;
    
    const latitudInput = document.getElementById('latitud');
    if (latitudInput) latitudInput.value = latitudAleatoria;
    
    const longitudInput = document.getElementById('longitud');
    if (longitudInput) longitudInput.value = longitudAleatoria;
    
    
    const observacionesInput = document.getElementById('observaciones');
    if (observacionesInput) observacionesInput.value = observacionesAleatorias;
    
    const materialesInput = document.getElementById('materiales_utilizados');
    if (materialesInput) materialesInput.value = materialesAleatorios;
    
    const participantesInput = document.getElementById('numero_participantes');
    if (participantesInput) participantesInput.value = numeroParticipantes;
    
    // Campos adicionales (opcionales)
    const nombreInput = document.getElementById('nombre');
    if (nombreInput) nombreInput.value = nombreAleatorio;
    
    const especieInput = document.getElementById('especie');
    if (especieInput) especieInput.value = especieAleatoria;
    
    const notasInput = document.getElementById('notas');
    if (notasInput) notasInput.value = notasAleatorias;
    
    // Actualizar posición del pin en el mapa si el modal está abierto
    if (document.getElementById('locationModal') && document.getElementById('locationModal').classList.contains('active')) {
        updateMapPin(parseFloat(latitudAleatoria), parseFloat(longitudAleatoria));
        const modalLat = document.getElementById('modalLatitud');
        const modalLng = document.getElementById('modalLongitud');
        if (modalLat) modalLat.value = latitudAleatoria;
        if (modalLng) modalLng.value = longitudAleatoria;
    }
    
    // Limpiar media previa
    selectedMedia = [];
    displayMediaPreview();
    
    // Feedback visual
    const btn = document.getElementById('autoFillBtn');
    if (btn) {
        const textoOriginal = btn.innerHTML;
        btn.innerHTML = '<span>✓</span> Campos rellenados';
        btn.style.background = '#4caf50';
        
        setTimeout(() => {
            btn.innerHTML = textoOriginal;
            btn.style.background = '#ff9800';
        }, 2000);
    }
}

// Manejar envío del formulario
async function handleFormSubmit(e) {
    e.preventDefault();
    
    console.log('🚀 ===== INICIO handleFormSubmit =====');
    console.log('🚀 Evento de submit capturado');
    
    // Verificar si viene del panel de administración
    const fromAdmin = sessionStorage.getItem('editingFromAdmin') === 'true';
    
    console.log('🔍 ===== INICIO VERIFICACIÓN =====');
    console.log('🔍 fromAdmin:', fromAdmin);
    console.log('🔍 adminAuthSystem disponible:', typeof window.adminAuthSystem !== 'undefined');
    console.log('🔍 sessionStorage editingFromAdmin:', sessionStorage.getItem('editingFromAdmin'));
    
    // Obtener usuario actual (puede ser usuario normal o admin)
    let currentUser = null;
    let isAdmin = false;
    
    // PRIMERO: Intentar obtener desde adminAuthSystem si viene del admin
    if (fromAdmin) {
        console.log('🔍 Intentando obtener usuario desde adminAuthSystem...');
        
        if (window.adminAuthSystem) {
            // Método 1: isAuthenticated + getCurrentAdmin
            const isAuth = window.adminAuthSystem.isAuthenticated();
            console.log('🔍 isAuthenticated():', isAuth);
            
            if (isAuth) {
                const admin = window.adminAuthSystem.getCurrentAdmin();
                console.log('🔍 getCurrentAdmin():', admin);
                if (admin) {
                    currentUser = {
                        id: admin.id,
                        nombre: admin.nombre,
                        email: admin.email,
                        rol: admin.rol || 'admin'
                    };
                    isAdmin = true;
                    console.log('✅ Usuario obtenido desde getCurrentAdmin():', currentUser);
                }
            }
            
            // Método 2: Si no funcionó, intentar getSession directamente
            if (!currentUser) {
                console.log('🔍 Intentando obtener desde getSession()...');
                const session = window.adminAuthSystem.getSession();
                console.log('🔍 getSession():', session);
                if (session && session.admin) {
                    currentUser = {
                        id: session.admin.id,
                        nombre: session.admin.nombre,
                        email: session.admin.email,
                        rol: session.admin.rol || 'admin'
                    };
                    isAdmin = true;
                    console.log('✅ Usuario obtenido desde getSession():', currentUser);
                }
            }
        } else {
            console.log('⚠️ adminAuthSystem no está disponible');
        }
        
        // Método 3: Si aún no hay usuario, leer directamente desde localStorage
        if (!currentUser) {
            console.log('🔍 Intentando leer directamente desde localStorage...');
            const adminSessionKey = 'admin_session';
            const adminSessionData = localStorage.getItem(adminSessionKey);
            console.log('🔍 localStorage.getItem("admin_session"):', adminSessionData ? 'Existe' : 'No existe');
            
            if (adminSessionData) {
                try {
                    const session = JSON.parse(adminSessionData);
                    console.log('🔍 Sesión parseada:', session);
                    if (session && session.admin) {
                        currentUser = {
                            id: session.admin.id,
                            nombre: session.admin.nombre,
                            email: session.admin.email,
                            rol: session.admin.rol || 'admin'
                        };
                        isAdmin = true;
                        console.log('✅ Usuario obtenido desde localStorage directo:', currentUser);
                    }
                } catch (error) {
                    console.error('❌ Error al parsear localStorage:', error);
                }
            }
        }
    }
    
    // SEGUNDO: Si no se obtuvo del admin, intentar usuario normal
    if (!currentUser && window.authSystem) {
        console.log('🔍 Intentando obtener usuario normal...');
        currentUser = window.authSystem.getCurrentUser();
        if (currentUser) {
            console.log('✅ Usuario normal obtenido:', currentUser);
        }
    }
    
    // TERCERO: Si aún no hay usuario, mostrar error
    if (!currentUser) {
        console.error('❌ ===== ERROR: NO SE PUDO OBTENER USUARIO =====');
        console.error('❌ fromAdmin:', fromAdmin);
        console.error('❌ adminAuthSystem disponible:', typeof window.adminAuthSystem !== 'undefined');
        if (window.adminAuthSystem) {
            console.error('❌ isAuthenticated():', window.adminAuthSystem.isAuthenticated());
            console.error('❌ getSession():', window.adminAuthSystem.getSession());
        }
        console.error('❌ localStorage admin_session:', localStorage.getItem('admin_session'));
        
        if (fromAdmin) {
            alert('Tu sesión de administrador ha expirado. Por favor, inicia sesión nuevamente desde el panel de administración.');
            return;
        } else {
            alert('Debes iniciar sesión para guardar registros');
            window.location.href = 'login.html';
            return;
        }
    }
    
    console.log('✅ ===== USUARIO FINAL OBTENIDO =====');
    console.log('✅ currentUser:', currentUser);
    console.log('✅ isAdmin:', isAdmin);
    
    // Verificar que currentUser tenga los datos necesarios
    if (!currentUser || !currentUser.id) {
        console.error('❌ ERROR CRÍTICO: currentUser no tiene id');
        alert('Error: No se pudo obtener la información del usuario. Por favor, recarga la página.');
        return;
    }
    
    console.log('✅ Usuario válido, continuando con el guardado...');
    
    // Verificar si es edición
    const editingRecord = sessionStorage.getItem('editingRecord');
    const isEditing = editingRecord !== null;
    
    // Obtener categoría seleccionada
    const categoriaId = document.getElementById('categoria')?.value;
    const subcategoriaId = document.getElementById('subcategoria')?.value || null;
    
    if (!categoriaId) {
        alert('Por favor selecciona una categoría');
        return;
    }
    
    // Construir formData con todos los campos del catálogo
    const formData = {
        categoria_id: parseInt(categoriaId),
        subcategoria_id: subcategoriaId ? parseInt(subcategoriaId) : null,
        fecha: document.getElementById('fecha').value,
        hora: document.getElementById('hora')?.value || null,
        responsable: document.getElementById('responsable')?.value.trim() || null,
        brigada: document.getElementById('brigada')?.value.trim() || null,
        latitud: parseFloat(document.getElementById('latitud').value),
        longitud: parseFloat(document.getElementById('longitud').value),
        comunidad: document.getElementById('comunidad')?.value.trim() || null,
        sitio: document.getElementById('sitio')?.value.trim() || null,
        tipo_actividad: document.getElementById('tipo_actividad')?.value.trim() || null,
        descripcion_breve: document.getElementById('descripcion_breve')?.value.trim() || null,
        observaciones: document.getElementById('observaciones')?.value.trim() || null,
        materiales_utilizados: document.getElementById('materiales_utilizados')?.value.trim() || null,
        numero_participantes: document.getElementById('numero_participantes')?.value ? parseInt(document.getElementById('numero_participantes').value) : null,
        notas: document.getElementById('notas')?.value.trim() || null,
        // Campos originales (opcionales)
        nombre: document.getElementById('nombre')?.value.trim() || null,
        especie: document.getElementById('especie')?.value.trim() || null,
        media: selectedMedia.map(m => ({
            type: m.type,
            data: m.data, // Archivo comprimido/original
            thumbnail: m.thumbnail || null, // Thumbnail para mostrar en tarjetas
            name: m.name || 'archivo'
        }))
    };
    
    if (isEditing) {
        const editingData = JSON.parse(editingRecord);
        formData.id = editingData.id;
        // Preservar el usuario_id original del registro (importante para admins)
        formData.usuario_id = editingData.usuario_id || currentUser.id;
        console.log('✏️ Modo edición - ID del registro:', formData.id);
        console.log('✏️ Usuario ID original:', formData.usuario_id);
    } else {
        // En modo creación, usar el usuario actual
        formData.usuario_id = currentUser.id;
        console.log('➕ Modo creación - Nuevo registro');
    }
    
    // Validación
    if (!formData.fecha) {
        alert('Por favor completa la fecha');
        return;
    }
    
    if (isNaN(formData.latitud) || isNaN(formData.longitud)) {
        alert('Por favor ingresa coordenadas válidas');
        return;
    }
    
    // Deshabilitar botón mientras se guarda
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
    
    try {
        // Usar la nueva API de registros ambientales
        const url = getApiUrl('save_registro_ambiental');
        const method = isEditing ? 'PUT' : 'POST';
        
        console.log('📤 Enviando datos:', formData);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        console.log('📥 Status de respuesta:', response.status);
        
        const responseText = await response.text();
        console.log('📄 Respuesta completa:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
            console.log('📦 Datos parseados:', data);
        } catch (parseError) {
            console.error('❌ Error al parsear JSON:', parseError);
            console.error('❌ Texto recibido:', responseText);
            alert('Error: Respuesta inválida del servidor. Revisa la consola.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        if (data.success) {
            console.log('✅ Registro guardado exitosamente:', data.record);
            
            // Verificar si viene del panel de administración
            const fromAdmin = sessionStorage.getItem('editingFromAdmin') === 'true';
            
            if (isEditing) {
                sessionStorage.removeItem('editingRecord');
            }
            
            if (fromAdmin) {
                // Si viene del admin, regresar al panel sin alert y activar pestaña de registros
                console.log('✅ Guardado desde admin, redirigiendo a admin.html');
                // NO eliminar editingFromAdmin aquí - se eliminará al llegar al admin
                // Limpiar editingRecord
                sessionStorage.removeItem('editingRecord');
                window.location.href = 'admin.html#registros';
            } else {
                console.log('✅ Guardado desde usuario, redirigiendo a index.html');
                // Si viene del perfil usuario, mostrar alert y redirigir
                alert('Registro guardado exitosamente');
                window.location.href = 'index.html';
            }
        } else {
            console.error('❌ Error al guardar:', data.message);
            
            // Manejar contenido ofensivo de forma especial
            if (data.contenido_ofensivo) {
                let mensaje = '🚫 CONTENIDO RECHAZADO\n\n';
                mensaje += data.message + '\n\n';
                mensaje += 'Campos afectados: ' + (data.campos_afectados ? data.campos_afectados.join(', ') : 'N/A') + '\n\n';
                
                if (data.advertencia_aplicada) {
                    mensaje += '⚠️ Se te ha aplicado una advertencia automática por intentar publicar contenido inapropiado.\n\n';
                    mensaje += 'Si continúas intentando publicar contenido ofensivo, podrías recibir sanciones más severas.';
                }
                
                alert(mensaje);
            } else {
                alert('Error al guardar: ' + data.message);
            }
            
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('❌ Error completo:', error);
        console.error('❌ Stack:', error.stack);
        alert('Error de conexión: ' + error.message + '\nRevisa la consola para más detalles.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

