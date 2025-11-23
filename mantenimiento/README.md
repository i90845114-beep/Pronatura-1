# 🔧 Sistema de Mantenimiento

Esta carpeta contiene todos los archivos necesarios para activar el modo mantenimiento en el sitio web.

## 📁 Archivos incluidos

- **`index.html`** - Página de mantenimiento (Método recomendado por Hostinger) ⭐
- **`maintenance.php`** - Script PHP alternativo con más opciones
- **`.htaccess_maintenance`** - Archivo de configuración para redirección automática
- **`INSTRUCCIONES.md`** - Guía detallada de uso

## 🚀 Uso Rápido

### ✅ ACTIVAR Mantenimiento (Mostrar en TODAS las páginas)

**Método Recomendado - Usando .htaccess:**

1. **Sube estos archivos a Hostinger:**
   - `.htaccess` (desde la raíz del proyecto) → a `public_html/.htaccess`
   - Carpeta `mantenimiento/` completa → a `public_html/mantenimiento/`

2. **¡Listo!** Ahora TODAS las páginas (login.html, registro.html, etc.) mostrarán la página de mantenimiento

**Método Alternativo - Solo página principal:**

1. **Sube la carpeta `mantenimiento/` completa a Hostinger** (a `public_html/`)
2. **Copia `index.html` desde `mantenimiento/` a la raíz** (`public_html/index.html`)
3. Solo la página principal mostrará mantenimiento

**Nota:** Si ya tienes un `index.html` o `.htaccess` en la raíz, haz una copia de respaldo primero

### ❌ DESACTIVAR Mantenimiento

**Si usaste .htaccess:**
1. Elimina o renombra `.htaccess` de la raíz (`public_html/.htaccess`)
2. El sitio volverá a funcionar normalmente

**Si usaste index.html:**
1. Elimina o renombra `index.html` de la raíz (`public_html/index.html`)
2. Si tenías un `index.html.backup`, renómbralo de vuelta a `index.html`
3. El sitio volverá a funcionar normalmente

## 📖 Documentación Completa

Consulta el archivo `INSTRUCCIONES.md` para:
- Métodos avanzados de activación
- Configuración de IPs permitidas
- Personalización de mensajes
- Solución de problemas

---

**Ubicación:** `mantenimiento/`  
**Última actualización:** Diciembre 2024

