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

// Variable global para guardar el valor de categoría que debe establecerse después de cargar
let categoriaValueToRestore = null;
let subcategoriaValueToRestore = null;
// Verificar si el flag ya está establecido desde el HTML (antes de que se cargue este script)
let isPopulatingForm = window._isPopulatingForm === true || false; // Flag para indicar que estamos poblando el formulario
let categoriaRestoreInterval = null; // Intervalo para restaurar categoría
let subcategoriaRestoreInterval = null; // Intervalo para restaurar subcategoría

// Log inicial
if (isPopulatingForm) {

}

// Función robusta para establecer valor en select
function establecerValorSelectRobusto(select, value) {
    if (!select || !value) return false;
    
    // Verificar que la opción existe
    const option = Array.from(select.options).find(opt => opt.value == value);
    if (!option) {

        return false;
    }
    
    // Método 1: Deseleccionar todas las opciones primero
    Array.from(select.options).forEach(opt => {
        opt.selected = false;
    });
    
    // Método 2: Establecer directamente en la opción
    option.selected = true;
    
    // Método 3: Usar selectedIndex
    const index = Array.from(select.options).indexOf(option);
    if (index !== -1) {
        select.selectedIndex = index;
    }
    
    // Método 4: Usar value
    select.value = value;
    
    // Método 5: Forzar actualización visual usando reflow
    select.style.display = 'none';
    select.offsetHeight; // Trigger reflow
    select.style.display = '';
    
    // Método 6: Forzar eventos
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Método 7: Verificar y forzar nuevamente si es necesario
    if (select.value != value) {

        option.selected = true;
        select.selectedIndex = index;
        select.value = value;
    }
    
    // Verificar resultado
    const resultado = select.value == value;
    if (resultado) {
        const selectedOption = select.options[select.selectedIndex];

    } else {

    }
    return resultado;
}

// Función para iniciar monitoreo y restauración continua
function iniciarMonitoreoSelect(selectId, valueToRestore, restoreVarName) {
    const select = document.getElementById(selectId);
    if (!select || !valueToRestore) return;
    
    // Limpiar intervalo anterior si existe
    if (restoreVarName === 'categoria' && categoriaRestoreInterval) {
        clearInterval(categoriaRestoreInterval);
    }
    if (restoreVarName === 'subcategoria' && subcategoriaRestoreInterval) {
        clearInterval(subcategoriaRestoreInterval);
    }
    
    // Crear intervalo que verifica y restaura cada 500ms
    const interval = setInterval(() => {
        const currentSelect = document.getElementById(selectId);
        if (currentSelect && currentSelect.value != valueToRestore) {

            establecerValorSelectRobusto(currentSelect, valueToRestore);
        }
    }, 500);
    
    // Guardar referencia al intervalo
    if (restoreVarName === 'categoria') {
        categoriaRestoreInterval = interval;
    } else {
        subcategoriaRestoreInterval = interval;
    }
    
    // Limpiar después de 10 segundos
    setTimeout(() => {
        clearInterval(interval);
        if (restoreVarName === 'categoria') {
            categoriaRestoreInterval = null;
        } else {
            subcategoriaRestoreInterval = null;
        }

    }, 10000);
}

// CARGAR CATEGORÍAS INMEDIATAMENTE - MÚLTIPLES INTENTOS
function cargarCategoriasInmediatamente() {
    // BLOQUEAR COMPLETAMENTE si estamos poblando el formulario
    // Verificar también el flag global que puede estar establecido desde el HTML
    if (isPopulatingForm || window._isPopulatingForm === true) {

        isPopulatingForm = true; // Asegurar que el flag local también esté activo
        return;
    }
    
    const select = document.getElementById('categoria');
    if (!select) {

        setTimeout(cargarCategoriasInmediatamente, 100);
        return;
    }
    
    // Si ya tiene más de 1 opción, verificar si hay un valor que restaurar
    if (select.options.length > 1) {

        // Si hay un valor que restaurar, restaurarlo ahora
        if (categoriaValueToRestore !== null) {

            establecerValorSelectRobusto(select, categoriaValueToRestore);
            categoriaValueToRestore = null;
        }
        return;
    }
    
    // Guardar el valor actual antes de limpiar (si existe)
    const currentValue = select.value;
    if (currentValue && currentValue !== '') {
        categoriaValueToRestore = currentValue;

    }

    fetch(getApiUrl('get_categorias'))
        .then(response => response.json())
        .then(data => {
            if (data.success && data.categorias && data.categorias.length > 0) {
                let html = '<option value="">Selecciona una categoría</option>';
                data.categorias.forEach(cat => {
                    html += `<option value="${cat.id}">${cat.nombre}</option>`;
                });
                select.innerHTML = html;

                // Restaurar el valor si había uno guardado
                if (categoriaValueToRestore !== null) {

                    establecerValorSelectRobusto(select, categoriaValueToRestore);
                    categoriaValueToRestore = null;
                }
            } else {

            }
        })
        .catch(error => {

            setTimeout(cargarCategoriasInmediatamente, 500);
        });
}

// Inicialización: ejecutar cuando el DOM esté listo (o ya lo esté si el script cargó tarde)
function runFormInit() {
    setupEventListeners();
    var urlParams = new URLSearchParams(window.location.search);
    var hasEditParam = urlParams.get('edit') === 'true';
    if (!hasEditParam) {
        sessionStorage.removeItem('editingRecord');
    }
    var editingRecord = sessionStorage.getItem('editingRecord');
    var isEditMode = hasEditParam || editingRecord;

    if (!isEditMode) {
        cargarCategoriasInmediatamente();
    } else {
        isPopulatingForm = true;
    }

    initializeForm().catch(function(e) { console.warn('initializeForm:', e); });
    checkEditMode().catch(function(e) { console.warn('checkEditMode:', e); });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runFormInit);
} else {
    runFormInit();
}

// Delegación de eventos: botón del mapa (funciona aunque el script cargue tarde o falle antes)
document.addEventListener('click', function(e) {
    var el = e.target;
    var btn = null;
    if (el && el.id === 'selectLocationBtn') {
        btn = el;
    } else {
        while (el && el !== document.body) {
            if (el.id === 'selectLocationBtn') { btn = el; break; }
            el = el.parentElement;
        }
    }
    if (btn) {
        e.preventDefault();
        if (typeof openLocationModal === 'function') {
            openLocationModal();
        }
    }
});

// También intentar cargar cuando la ventana esté completamente lista
window.addEventListener('load', () => {

    // NO cargar si estamos en modo edición
    if (isPopulatingForm) {

        return;
    }
    
    const categoriaSelect = document.getElementById('categoria');
    if (categoriaSelect && categoriaSelect.options.length <= 1) {

        cargarCategoriasInmediatamente();
    }
});

// INTENTO ADICIONAL después de 1 segundo
setTimeout(() => {
    // NO cargar si estamos en modo edición
    if (isPopulatingForm) {

        return;
    }
    
    const select = document.getElementById('categoria');
    if (select && select.options.length <= 1) {

        cargarCategoriasInmediatamente();
    }
}, 1000);

// Variables para categorías (con prefijo para evitar conflictos)
let formCategorias = [];
let formSubcategorias = [];

// Inicializar formulario
async function initializeForm() {

    // Establecer fecha por defecto (hoy)
    const fechaInput = document.getElementById('fecha');
    if (fechaInput && !fechaInput.value) {
        const today = new Date().toISOString().split('T')[0];
        fechaInput.value = today;
    }
    
    // Cargar categorías al iniciar (y reintentar tras 300ms por si la API tarda)
    if (!isPopulatingForm && window._isPopulatingForm !== true) {
        cargarCategorias();
        setTimeout(() => cargarCategorias(), 300);
    }
    
    // Event listener para cambio de categoría
    const categoriaSelect = document.getElementById('categoria');
    if (categoriaSelect) {
        // Guardar referencia al listener para poder removerlo temporalmente si es necesario
        const changeHandler = function(e) {
            const categoriaId = e.target.value;

            if (categoriaId) {
                cargarSubcategorias(categoriaId);
            } else {
                limpiarSubcategorias();
            }
        };
        categoriaSelect.addEventListener('change', changeHandler);
        // Guardar referencia para poder removerla si es necesario
        categoriaSelect._changeListener = changeHandler;
    }
}

// FUNCIÓN SIMPLE Y DIRECTA PARA CARGAR CATEGORÍAS
async function cargarCategorias() {
    // BLOQUEAR si estamos poblando el formulario Y ya hay categorías cargadas
    if ((isPopulatingForm || window._isPopulatingForm === true) && formCategorias.length > 0) {

        return true; // Retornar true para indicar que las categorías ya están disponibles
    }
    
    const select = document.getElementById('categoria');
    if (!select) {

        return false;
    }
    
    try {
        const url = getApiUrl('get_categorias');

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const resultado = await response.json();

        formCategorias = (resultado.success && resultado.categorias && Array.isArray(resultado.categorias)) ? resultado.categorias : [];
        if (formCategorias.length > 0) {

            // IMPORTANTE: Guardar el valor actual ANTES de limpiar si estamos en modo edición
            const valorActual = select.value;
            const debeRestaurar = (isPopulatingForm || window._isPopulatingForm === true) && valorActual && valorActual !== '';
            
            // Si estamos en modo edición y ya hay un valor establecido, NO limpiar el select
            // Solo agregar las opciones que faltan
            if (debeRestaurar && select.options.length > 1) {

                // Verificar que todas las categorías estén en las opciones
                const opcionesExistentes = Array.from(select.options).map(opt => opt.value);
                const categoriasFaltantes = formCategorias.filter(cat => !opcionesExistentes.includes(String(cat.id)));
                
                if (categoriasFaltantes.length > 0) {

                    categoriasFaltantes.forEach(cat => {
                        const opt = document.createElement('option');
                        opt.value = cat.id;
                        opt.textContent = cat.nombre;
                        select.appendChild(opt);
                    });
                }
                
                // Asegurar que el valor sigue establecido
                establecerValorSelectRobusto(select, valorActual);
                return true;
            }
            
            if (debeRestaurar) {

                categoriaValueToRestore = valorActual;
            }
            
            // LIMPIAR COMPLETAMENTE solo si no estamos en modo edición con valor establecido
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
            
            // RESTAURAR el valor si estábamos en modo edición
            if (debeRestaurar && categoriaValueToRestore) {

                // Usar múltiples métodos y esperar
                establecerValorSelectRobusto(select, categoriaValueToRestore);
                await new Promise(resolve => setTimeout(resolve, 100));
                establecerValorSelectRobusto(select, categoriaValueToRestore);
                // Forzar actualización visual
                select.style.display = 'none';
                select.offsetHeight; // Trigger reflow
                select.style.display = '';
            }
            
            // NO disparar evento change automáticamente - esto puede limpiar subcategorías
            // El evento change se disparará cuando el usuario cambie manualmente la categoría
            // select.dispatchEvent(new Event('change'));
            
            return true;
        }
        // Si no hay categorías, mostrar al menos la opción por defecto
        select.innerHTML = '<option value="">Selecciona una categoría</option>';
        if (formCategorias.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'No hay categorías disponibles';
            opt.disabled = true;
            select.appendChild(opt);
        }
        return formCategorias.length > 0;
    } catch (error) {
        const selectErr = document.getElementById('categoria');
        if (selectErr) {
            selectErr.innerHTML = '<option value="">Error al cargar. Reintenta.</option>';
        }
        return false;
    }
}

// FUNCIÓN SIMPLE Y DIRECTA PARA CARGAR SUBCATEGORÍAS
async function cargarSubcategorias(categoriaId) {

    const select = document.getElementById('subcategoria');
    if (!select) {

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

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const resultado = await response.json();

        if (resultado.success && resultado.subcategorias && Array.isArray(resultado.subcategorias)) {
            formSubcategorias = resultado.subcategorias;

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
            
            return true;
        } else {

            select.innerHTML = '<option value="">Sin subcategorías disponibles</option>';
            select.disabled = false;
            return false;
        }
    } catch (error) {

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

        if (fromAdmin) {

            return 'admin.html#registros';
        }
        // Marcar que viene de cancelación para que auth.js permita acceso
        sessionStorage.setItem('vieneDeCancelacion', 'true');
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
    const hasEditParam = urlParams.get('edit') === 'true';
    // Si la URL no trae edit=true, es "nuevo registro": no usar datos de edición guardados
    if (!hasEditParam) {
        sessionStorage.removeItem('editingRecord');
    }
    const editingRecord = sessionStorage.getItem('editingRecord');
    const fromAdmin = sessionStorage.getItem('editingFromAdmin') === 'true';
    
    if (fromAdmin) {

    }
    
    if (hasEditParam || editingRecord) {
        // MARCAR INMEDIATAMENTE que estamos poblando el formulario
        isPopulatingForm = true;

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

                // Asegurar que las categorías estén cargadas ANTES de poblar el formulario
                if (formCategorias.length === 0) {

                    await cargarCategorias();
                    // Esperar un momento para que se rendericen las opciones
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                await populateForm(record);
            } catch (error) {

            }
        } else {

        }
    } else {
        // Asegurar que el título sea "Nuevo Registro" si no está en modo edición
        const formTitle = document.getElementById('formTitle');
        if (formTitle) {
            formTitle.textContent = 'Nuevo Registro';
        }
        // Limpiar sessionStorage si no está en modo edición
        sessionStorage.removeItem('editingRecord');
        isPopulatingForm = false;
    }
}

// Llenar formulario con datos existentes
async function populateForm(record) {
    // Marcar que estamos poblando el formulario INMEDIATAMENTE
    isPopulatingForm = true;
    window._isPopulatingForm = true;

    // Guardar los IDs de categoría y subcategoría ANTES de cualquier operación
    const categoriaIdToSet = record.categoria_id;
    const subcategoriaIdToSet = record.subcategoria_id;

    // Cargar categorías primero si no están cargadas
    if (formCategorias.length === 0) {

        await cargarCategorias();
        // Esperar un momento para que se rendericen completamente
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // ESPERAR a que todas las operaciones asíncronas terminen
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Llenar categoría y subcategoría
    if (categoriaIdToSet) {

        const categoriaSelect = document.getElementById('categoria');
        if (categoriaSelect) {
            // Asegurar que las opciones estén cargadas
            if (categoriaSelect.options.length <= 1) {

                await cargarCategorias();
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            // Verificar que la opción de categoría existe antes de establecerla
            const categoriaOptionExists = Array.from(categoriaSelect.options).some(opt => opt.value == categoriaIdToSet);
            if (!categoriaOptionExists) {

                await new Promise(resolve => setTimeout(resolve, 500));
                // Reintentar cargar categorías
                await cargarCategorias();
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            // IMPORTANTE: Deshabilitar temporalmente el listener de change para evitar que limpie subcategorías
            // Guardar el listener original si existe
            const originalChangeHandler = categoriaSelect.onchange;
            const originalEventListener = categoriaSelect._changeListener;
            
            // Remover el listener de addEventListener si existe
            if (originalEventListener) {
                categoriaSelect.removeEventListener('change', originalEventListener);
            }
            categoriaSelect.onchange = null;
            
            // IMPORTANTE: Guardar el valor en la variable global para que se restaure si algo lo limpia
            categoriaValueToRestore = categoriaIdToSet;
            
            // INICIAR MONITOREO CONTINUO para restaurar automáticamente si se pierde
            iniciarMonitoreoSelect('categoria', categoriaIdToSet, 'categoria');
            
            // Función para establecer categoría usando requestAnimationFrame (después del renderizado)
            const establecerCategoriaConRAF = () => {
                return new Promise((resolve) => {
                    requestAnimationFrame(() => {
                        establecerValorSelectRobusto(categoriaSelect, categoriaIdToSet);
                        requestAnimationFrame(() => {
                            establecerValorSelectRobusto(categoriaSelect, categoriaIdToSet);
                            resolve(categoriaSelect.value == categoriaIdToSet);
                        });
                    });
                });
            };
            
            // Establecer usando función robusta - MÚLTIPLES INTENTOS AGRESIVOS CON RAF
            let intentosCategoria = 0;
            const maxIntentosCategoria = 15;
            
            // Primer intento inmediato
            establecerValorSelectRobusto(categoriaSelect, categoriaIdToSet);
            
            // Intentos con requestAnimationFrame
            while (intentosCategoria < maxIntentosCategoria) {
                intentosCategoria++;
                const establecido = await establecerCategoriaConRAF();
                if (establecido) {

                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            // Verificar que se estableció
            if (categoriaSelect.value == categoriaIdToSet) {
                const selectedOption = categoriaSelect.options[categoriaSelect.selectedIndex];

            } else {

            }
            
            // Verificar múltiples veces después de establecer (con RAF también)
            for (let i = 0; i < 15; i++) {
                await new Promise(resolve => setTimeout(resolve, 200));
                if (categoriaSelect.value != categoriaIdToSet) {

                    await establecerCategoriaConRAF();
                    // También forzar reflow visual
                    categoriaSelect.style.display = 'none';
                    categoriaSelect.offsetHeight;
                    categoriaSelect.style.display = '';
                }
            }

            // Verificación visual final y FORZAR actualización visual múltiples veces
            const selectedOption = categoriaSelect.options[categoriaSelect.selectedIndex];
            if (selectedOption && selectedOption.value == categoriaIdToSet) {

                // Forzar actualización visual múltiples veces para asegurar que se muestre
                for (let i = 0; i < 5; i++) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    establecerValorSelectRobusto(categoriaSelect, categoriaIdToSet);
                    // Forzar reflow visual
                    categoriaSelect.style.display = 'none';
                    categoriaSelect.offsetHeight; // Trigger reflow
                    categoriaSelect.style.display = '';
                }

            } else {

                // ÚLTIMO INTENTO DESESPERADO: Forzar directamente
                const option = Array.from(categoriaSelect.options).find(opt => opt.value == categoriaIdToSet);
                if (option) {

                    Array.from(categoriaSelect.options).forEach(opt => opt.selected = false);
                    option.selected = true;
                    categoriaSelect.selectedIndex = Array.from(categoriaSelect.options).indexOf(option);
                    categoriaSelect.value = categoriaIdToSet;
                    // Forzar actualización visual múltiples veces
                    for (let i = 0; i < 3; i++) {
                        categoriaSelect.style.display = 'none';
                        categoriaSelect.offsetHeight;
                        categoriaSelect.style.display = '';
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                    // Verificar nuevamente
                    const finalCheck = categoriaSelect.options[categoriaSelect.selectedIndex];
                    if (finalCheck && finalCheck.value == categoriaIdToSet) {

                    } else {

                    }
                }
            }
            
            // Cargar subcategorías manualmente SIN disparar evento change (ANTES de restaurar el handler)

            await cargarSubcategorias(categoriaIdToSet);
            
            // ESPERAR después de cargar subcategorías y FORZAR nuevamente el valor de categoría
            await new Promise(resolve => setTimeout(resolve, 300));

            establecerValorSelectRobusto(categoriaSelect, categoriaIdToSet);
            
            // Restaurar el handler DESPUÉS de establecer el valor y cargar subcategorías
            categoriaSelect.onchange = originalChangeHandler;
            if (originalEventListener) {
                categoriaSelect.addEventListener('change', originalEventListener);
            }
            
            // FORZAR nuevamente después de restaurar el handler
            await new Promise(resolve => setTimeout(resolve, 200));
            establecerValorSelectRobusto(categoriaSelect, categoriaIdToSet);
            
            // Esperar a que se carguen completamente las subcategorías
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verificar que las subcategorías se cargaron
            const subcategoriaSelect = document.getElementById('subcategoria');
            if (subcategoriaSelect) {

                if (subcategoriaSelect.options.length > 1) {
                    if (subcategoriaIdToSet) {

                        // Verificar que la opción existe antes de establecerla
                        const optionExists = Array.from(subcategoriaSelect.options).some(opt => opt.value == subcategoriaIdToSet);
                        if (optionExists) {
                            // Guardar valor para restauración
                            subcategoriaValueToRestore = subcategoriaIdToSet;
                            
                            // INICIAR MONITOREO CONTINUO para restaurar automáticamente si se pierde
                            iniciarMonitoreoSelect('subcategoria', subcategoriaIdToSet, 'subcategoria');
                            
                            // Establecer usando función robusta global
                            if (!establecerValorSelectRobusto(subcategoriaSelect, subcategoriaIdToSet)) {

                                await new Promise(resolve => setTimeout(resolve, 200));
                                establecerValorSelectRobusto(subcategoriaSelect, subcategoriaIdToSet);
                            }
                            
                            await new Promise(resolve => setTimeout(resolve, 100));

                            // Verificar múltiples veces
                            for (let i = 0; i < 5; i++) {
                                await new Promise(resolve => setTimeout(resolve, 200));
                                if (subcategoriaSelect.value != subcategoriaIdToSet) {

                                    establecerValorSelectRobusto(subcategoriaSelect, subcategoriaIdToSet);
                                }
                            }
                            
                            // Verificación visual final
                            const selectedSubOption = subcategoriaSelect.options[subcategoriaSelect.selectedIndex];
                            if (selectedSubOption && selectedSubOption.value == subcategoriaIdToSet) {

                            } else {

                            }
                        } else {

                        }
                    } else {

                    }
                } else {

                    await cargarSubcategorias(categoriaIdToSet);
                    await new Promise(resolve => setTimeout(resolve, 300));
                    if (subcategoriaIdToSet && subcategoriaSelect.options.length > 1) {
                        const optionExists = Array.from(subcategoriaSelect.options).some(opt => opt.value == subcategoriaIdToSet);
                        if (optionExists) {
                            subcategoriaSelect.value = subcategoriaIdToSet;
                            const subcategoriaIndex = Array.from(subcategoriaSelect.options).findIndex(opt => opt.value == subcategoriaIdToSet);
                            if (subcategoriaIndex !== -1) {
                                subcategoriaSelect.selectedIndex = subcategoriaIndex;
                            }
                            subcategoriaSelect.dispatchEvent(new Event('input', { bubbles: true }));
                            await new Promise(resolve => setTimeout(resolve, 100));

                        }
                    }
                }
            } else {

            }
            
            // FUNCIÓN AUXILIAR para establecer categoría de forma robusta
            const establecerCategoriaRobusta = (select, value) => {
                if (!select || !value) return false;
                
                // Método 1: Usar value
                select.value = value;
                
                // Método 2: Usar selectedIndex
                const index = Array.from(select.options).findIndex(opt => opt.value == value);
                if (index !== -1) {
                    select.selectedIndex = index;
                }
                
                // Método 3: Establecer directamente en la opción
                const option = Array.from(select.options).find(opt => opt.value == value);
                if (option) {
                    option.selected = true;
                }
                
                // Método 4: Forzar eventos
                select.dispatchEvent(new Event('input', { bubbles: true }));
                select.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Verificar resultado
                return select.value == value;
            };
            
            // VERIFICACIÓN FINAL: Asegurar que la categoría sigue establecida después de todas las operaciones
            // Esperar más tiempo para que todos los timeouts y eventos terminen
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Verificar y restaurar si es necesario usando método robusto
            if (!establecerValorSelectRobusto(categoriaSelect, categoriaIdToSet)) {

                categoriaValueToRestore = categoriaIdToSet; // Actualizar variable global
                await new Promise(resolve => setTimeout(resolve, 200));
                establecerValorSelectRobusto(categoriaSelect, categoriaIdToSet);
            }
            
            // Confirmar visualmente
            const finalSelectedOption = categoriaSelect.options[categoriaSelect.selectedIndex];
            if (finalSelectedOption && finalSelectedOption.value == categoriaIdToSet) {

            } else {

            }
            
            // ÚLTIMA VERIFICACIÓN después de que todos los timeouts hayan terminado (múltiples verificaciones)
            [2000, 3000, 4000, 5000, 6000, 7000, 8000].forEach(delay => {
                setTimeout(() => {
                    const categoriaSelectFinal = document.getElementById('categoria');
                    if (categoriaSelectFinal) {
                        if (categoriaSelectFinal.value != categoriaIdToSet) {
                            establecerValorSelectRobusto(categoriaSelectFinal, categoriaIdToSet);
                            categoriaValueToRestore = categoriaIdToSet;
                            // Forzar reflow visual
                            categoriaSelectFinal.style.display = 'none';
                            categoriaSelectFinal.offsetHeight;
                            categoriaSelectFinal.style.display = '';
                        } else {
                            // Aunque el valor es correcto, forzar actualización visual
                            const selectedOption = categoriaSelectFinal.options[categoriaSelectFinal.selectedIndex];
                            if (selectedOption && selectedOption.value == categoriaIdToSet) {
                                // Forzar reflow visual para asegurar que se muestre
                                categoriaSelectFinal.style.display = 'none';
                                categoriaSelectFinal.offsetHeight;
                                categoriaSelectFinal.style.display = '';
                            }
                        }
                    }
                }, delay);
            });
            
            // Limpiar flag después de un tiempo razonable (15 segundos para dar tiempo a todas las verificaciones)
            setTimeout(() => {
                isPopulatingForm = false;

            }, 15000);
        } else {
            void 0;
        }
    } else {
        void 0;
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

// Abrir modal de ubicación (expuesta en window para delegación e inline)
function openLocationModal() {
    var modal = document.getElementById('locationModal');
    if (!modal) {
        console.warn('openLocationModal: no se encontró #locationModal');
        return;
    }
    const latInput = document.getElementById('latitud');
    const lngInput = document.getElementById('longitud');

    // Mostrar el modal PRIMERO para que el contenedor del mapa tenga dimensiones (Leaflet falla si está oculto)
    modal.classList.add('active');

    if (!locationMap) {
        // Inicializar mapa en el siguiente tick, con el modal ya visible
        setTimeout(function() {
            initializeLocationMap();
            if (latInput && lngInput && latInput.value && lngInput.value) {
                const lat = parseFloat(latInput.value);
                const lng = parseFloat(lngInput.value);
                if (!isNaN(lat) && !isNaN(lng)) {
                    updateLocationMarker(lat, lng);
                }
            }
            if (locationMap) {
                locationMap.invalidateSize();
            }
        }, 50);
    } else {
        if (latInput && lngInput && latInput.value && lngInput.value) {
            const lat = parseFloat(latInput.value);
            const lng = parseFloat(lngInput.value);
            if (!isNaN(lat) && !isNaN(lng)) {
                updateLocationMarker(lat, lng);
            }
        }
        setTimeout(function() {
            if (locationMap) {
                locationMap.invalidateSize();
            }
        }, 100);
    }
}
window.openLocationModal = openLocationModal;

// Inicializar mapa de Leaflet para selección de ubicación
function initializeLocationMap() {
    if (typeof L === 'undefined') {
        return;
    }
    const mapContainer = document.getElementById('locationMap');
    if (!mapContainer) {
        return;
    }
    try {
        initLocationMapCore();
    } catch (err) {
        console.warn('Error al inicializar el mapa:', err);
    }
}

function initLocationMapCore() {
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

    // Verificar si viene del panel de administración
    const fromAdmin = sessionStorage.getItem('editingFromAdmin') === 'true';
    
    // Obtener usuario actual (puede ser usuario normal o admin)
    let currentUser = null;
    let isAdmin = false;
    
    // PRIMERO: Intentar obtener desde adminAuthSystem si viene del admin
    if (fromAdmin) {

        if (window.adminAuthSystem) {
            // Método 1: isAuthenticated + getCurrentAdmin
            const isAuth = window.adminAuthSystem.isAuthenticated();
            
            if (isAuth) {
                const admin = window.adminAuthSystem.getCurrentAdmin();
                if (admin) {
                    currentUser = {
                        id: admin.id,
                        nombre: admin.nombre,
                        email: admin.email,
                        rol: admin.rol || 'admin'
                    };
                    isAdmin = true;
                }
            }
            
            // Método 2: Si no funcionó, intentar getSession directamente
            if (!currentUser) {
                const session = window.adminAuthSystem.getSession();
                if (session && session.admin) {
                    currentUser = {
                        id: session.admin.id,
                        nombre: session.admin.nombre,
                        email: session.admin.email,
                        rol: session.admin.rol || 'admin'
                    };
                    isAdmin = true;
                }
            }
        } else {

        }
        
        // Método 3: Si aún no hay usuario, leer directamente desde localStorage
        if (!currentUser) {

            const adminSessionKey = 'admin_session';
            const adminSessionData = localStorage.getItem(adminSessionKey);
            
            if (adminSessionData) {
                try {
                    const session = JSON.parse(adminSessionData);

                    if (session && session.admin) {
                        currentUser = {
                            id: session.admin.id,
                            nombre: session.admin.nombre,
                            email: session.admin.email,
                            rol: session.admin.rol || 'admin'
                        };
                        isAdmin = true;

                    }
                } catch (error) {

                }
            }
        }
    }
    
    // SEGUNDO: Si no se obtuvo del admin, intentar usuario normal
    if (!currentUser && window.authSystem) {

        currentUser = window.authSystem.getCurrentUser();
        if (currentUser) {

        }
    }
    
    // TERCERO: Si aún no hay usuario, mostrar error
    if (!currentUser) {

        if (window.adminAuthSystem) {
            // Admin system disponible
        }
        
        if (fromAdmin) {
            alert('Tu sesión de administrador ha expirado. Por favor, inicia sesión nuevamente desde el panel de administración.');
            return;
        } else {
            alert('Debes iniciar sesión para guardar registros');
            window.location.href = 'login.html';
            return;
        }
    }

    // Verificar que currentUser tenga los datos necesarios
    if (!currentUser || !currentUser.id) {

        alert('Error: No se pudo obtener la información del usuario. Por favor, recarga la página.');
        return;
    }

    // Verificar si es edición
    const editingRecord = sessionStorage.getItem('editingRecord');
    const isEditing = editingRecord !== null;
    
    // Obtener categoría seleccionada (sin optional chaining para compatibilidad)
    const catEl = document.getElementById('categoria');
    const subEl = document.getElementById('subcategoria');
    const categoriaId = catEl ? catEl.value : null;
    const subcategoriaId = (subEl && subEl.value) ? subEl.value : null;

    if (!categoriaId) {
        alert('Por favor selecciona una categoría');
        return;
    }

    function val(id) {
        var el = document.getElementById(id);
        return (el && el.value) ? el.value : null;
    }
    function valTrim(id) {
        var el = document.getElementById(id);
        return (el && el.value && typeof el.value.trim === 'function') ? el.value.trim() : null;
    }

    // Construir formData con todos los campos del catálogo
    const formData = {
        categoria_id: parseInt(categoriaId),
        subcategoria_id: subcategoriaId ? parseInt(subcategoriaId) : null,
        fecha: document.getElementById('fecha').value,
        hora: val('hora'),
        responsable: valTrim('responsable'),
        brigada: valTrim('brigada'),
        latitud: parseFloat(document.getElementById('latitud').value),
        longitud: parseFloat(document.getElementById('longitud').value),
        comunidad: valTrim('comunidad'),
        sitio: valTrim('sitio'),
        tipo_actividad: valTrim('tipo_actividad'),
        descripcion_breve: valTrim('descripcion_breve'),
        observaciones: valTrim('observaciones'),
        materiales_utilizados: valTrim('materiales_utilizados'),
        numero_participantes: val('numero_participantes') ? parseInt(val('numero_participantes'), 10) : null,
        notas: valTrim('notas'),
        // Campos originales (opcionales)
        nombre: valTrim('nombre'),
        especie: valTrim('especie'),
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

    } else {
        // En modo creación, usar el usuario actual
        formData.usuario_id = currentUser.id;

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

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const responseText = await response.text();

        let data;
        try {
            data = JSON.parse(responseText);

        } catch (parseError) {

            alert('Error: Respuesta inválida del servidor. Revisa la consola.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        if (data.success) {

            // Verificar si viene del panel de administración
            const fromAdmin = sessionStorage.getItem('editingFromAdmin') === 'true';
            
            if (isEditing) {
                sessionStorage.removeItem('editingRecord');
            }
            
            if (fromAdmin) {
                // Si viene del admin, regresar al panel sin alert y activar pestaña de registros

                // NO eliminar editingFromAdmin aquí - se eliminará al llegar al admin
                // Limpiar editingRecord
                sessionStorage.removeItem('editingRecord');
                window.location.href = 'admin.html#registros';
            } else {

                // Si viene del perfil usuario, mostrar alert y redirigir
                alert('Registro guardado exitosamente');
                window.location.href = 'index.html';
            }
        } else {

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

        alert('Error de conexión: ' + error.message + '\nRevisa la consola para más detalles.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

