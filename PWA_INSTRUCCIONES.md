# 📱 Guía de Instalación y Uso de la PWA

## ✅ Archivos Creados

La aplicación ahora es una **Progressive Web App (PWA)** instalable en dispositivos móviles. Se han creado los siguientes archivos:

1. **`manifest.json`** - Configuración de la PWA (nombre, iconos, colores, etc.)
2. **`sw.js`** - Service Worker para funcionalidad offline
3. **`assets/js/pwa-register.js`** - Script que registra el Service Worker
4. **`assets/icons/README_ICONOS.md`** - Instrucciones para generar iconos

## 🎯 Pasos para Completar la Implementación

### 1. Generar los Iconos (OBLIGATORIO)

**IMPORTANTE:** Sin los iconos, la PWA no funcionará correctamente.

#### Opción A: Usando RealFaviconGenerator (Más fácil)

1. Visita: https://realfavicongenerator.net/
2. Sube tu logo/imagen (mínimo 260x260 píxeles)
3. Configura según tus preferencias
4. Descarga el paquete ZIP
5. Extrae los archivos PNG en `assets/icons/`
6. Renombra los archivos según los nombres en `manifest.json`:
   - `icon-72x72.png`
   - `icon-96x96.png`
   - `icon-128x128.png`
   - `icon-144x144.png`
   - `icon-152x152.png`
   - `icon-192x192.png`
   - `icon-384x384.png`
   - `icon-512x512.png`

#### Opción B: Crear manualmente

Crea una imagen cuadrada de 512x512 píxeles y exporta en los tamaños mencionados arriba.

### 2. Verificar que Todo Esté Correcto

1. **Verifica que los archivos existan:**
   - ✅ `manifest.json` en la raíz
   - ✅ `sw.js` en la raíz
   - ✅ `assets/js/pwa-register.js`
   - ✅ Iconos en `assets/icons/` (8 archivos PNG)

2. **Verifica las rutas en `manifest.json`:**
   - Las rutas de los iconos deben ser: `assets/icons/icon-XXXxXXX.png`
   - El `start_url` debe ser: `/pages/inicio.html`

3. **Verifica que el Service Worker se registre:**
   - Abre la consola del navegador (F12)
   - Deberías ver: `[PWA] Service Worker registrado exitosamente`

## 📱 Cómo Instalar la PWA

### En Android (Chrome)

1. Abre tu sitio en Chrome Android
2. Verás un banner "Agregar a pantalla de inicio" o un menú con "Instalar app"
3. Toca "Instalar" o "Agregar a pantalla de inicio"
4. La app se instalará y aparecerá como una app nativa

### En iOS (Safari)

1. Abre tu sitio en Safari iOS
2. Toca el botón de compartir (cuadrado con flecha)
3. Desplázate y toca "Agregar a pantalla de inicio"
4. Personaliza el nombre si quieres
5. Toca "Agregar"
6. La app aparecerá en tu pantalla de inicio

### En Desktop (Chrome/Edge)

1. Abre tu sitio en Chrome o Edge
2. Busca el ícono de instalación en la barra de direcciones (o menú)
3. Haz clic en "Instalar"
4. La app se abrirá en una ventana independiente

## 🧪 Cómo Probar la PWA

### 1. Usar Lighthouse (Chrome DevTools)

1. Abre Chrome DevTools (F12)
2. Ve a la pestaña "Lighthouse"
3. Selecciona "Progressive Web App"
4. Haz clic en "Generate report"
5. Revisa el puntaje y las recomendaciones

### 2. Verificar Service Worker

1. Abre Chrome DevTools (F12)
2. Ve a "Application" → "Service Workers"
3. Deberías ver tu Service Worker registrado y activo
4. Verifica que el estado sea "activated and is running"

### 3. Verificar Manifest

1. Abre Chrome DevTools (F12)
2. Ve a "Application" → "Manifest"
3. Deberías ver toda la información de tu PWA
4. Verifica que los iconos se muestren correctamente

### 4. Probar Modo Offline

1. Abre Chrome DevTools (F12)
2. Ve a "Network"
3. Marca "Offline"
4. Recarga la página
5. La página debería cargar desde el cache (al menos parcialmente)

## 🔧 Solución de Problemas

### El Service Worker no se registra

- **Verifica que estés usando HTTPS** (o localhost)
- **Verifica la ruta del Service Worker** en `pwa-register.js`
- **Revisa la consola** para ver errores específicos

### Los iconos no aparecen

- **Verifica que los archivos existan** en `assets/icons/`
- **Verifica las rutas** en `manifest.json`
- **Limpia el cache** del navegador (Ctrl+Shift+Delete)

### La app no se puede instalar

- **Verifica el manifest.json** con Lighthouse
- **Asegúrate de tener HTTPS** (requerido para producción)
- **Verifica que el Service Worker esté activo**

### La app no funciona offline

- **Verifica que el Service Worker esté activo**
- **Revisa la consola** para errores de cache
- **Verifica que los archivos estén en `urlsToCache`** en `sw.js`

## 📊 Checklist de PWA

Usa Lighthouse para verificar que cumplas con estos requisitos:

- ✅ Tiene un manifest válido
- ✅ Tiene un Service Worker registrado
- ✅ Funciona offline (al menos parcialmente)
- ✅ Es responsive
- ✅ Tiene iconos en todos los tamaños
- ✅ Usa HTTPS (en producción)
- ✅ Tiene meta tags para iOS
- ✅ El tamaño de la app es razonable

## 🚀 Próximos Pasos (Opcional)

Una vez que la PWA básica funcione, puedes agregar:

1. **Notificaciones Push** - Para alertar a los usuarios
2. **Sincronización en segundo plano** - Para guardar datos offline
3. **Compartir nativo** - Para compartir registros fácilmente
4. **Cámara mejorada** - Mejor acceso a la cámara en móviles
5. **Geolocalización** - Mejor precisión de ubicación

## 📞 Recursos Adicionales

- **MDN PWA Guide:** https://developer.mozilla.org/es/docs/Web/Progressive_web_apps
- **Web.dev PWA:** https://web.dev/progressive-web-apps/
- **PWA Checklist:** https://web.dev/pwa-checklist/

## ⚠️ Notas Importantes

1. **HTTPS es obligatorio** para PWA en producción (excepto localhost)
2. **Los iconos son obligatorios** - sin ellos la PWA no funcionará bien
3. **El Service Worker debe estar en la raíz** o en el mismo nivel que tu `start_url`
4. **Prueba en dispositivos reales** - el emulador no siempre refleja el comportamiento real

---

**¡Listo!** Tu aplicación ahora es una PWA instalable. Solo falta generar los iconos y probar la instalación.

