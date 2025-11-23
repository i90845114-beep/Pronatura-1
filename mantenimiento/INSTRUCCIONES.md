# 🔧 Cómo Activar/Desactivar el Modo Mantenimiento

## Método 1: Usando index.html (Recomendado por Hostinger - Más Simple) ⭐

### ✅ ACTIVAR Mantenimiento

1. **Sube la carpeta `mantenimiento/` completa a Hostinger:**
   - Ubicación: `public_html/mantenimiento/`

2. **Copia `index.html` desde `mantenimiento/` a la raíz:**
   - Desde: `public_html/mantenimiento/index.html`
   - Hacia: `public_html/index.html`
   
   **Nota:** Si ya tienes un `index.html` en la raíz, renómbralo primero a `index.html.backup`

3. **¡Listo!** El sitio mostrará automáticamente la página de mantenimiento a todos los visitantes

### ❌ DESACTIVAR Mantenimiento

1. **Elimina o renombra `index.html`** de la raíz (`public_html/index.html`)
2. Si tenías un `index.html.backup`, renómbralo de vuelta a `index.html`
3. El sitio volverá a funcionar normalmente

### ⚙️ Personalizar el mensaje

Edita `index.html` directamente y modifica estas líneas:
```html
<p><strong>📢 Estamos realizando mantenimiento. Volveremos pronto.</strong></p>
```
y
```html
⏱️ Tiempo estimado: 30 minutos
```

---

## Método 2: Usando el archivo PHP (Alternativo - Más opciones)

### ✅ ACTIVAR Mantenimiento

1. **Copia el archivo:**
   - Desde: `mantenimiento/maintenance.php`
   - Hacia: Raíz del proyecto (donde está `pages/`, `api/`, etc.)
   - Renómbralo a: `index.php`

2. **Edita `index.php` y verifica:**
   ```php
   $maintenance_mode = true; // Debe estar en true
   ```

3. **Opcional - Agrega tu IP para acceso permitido:**
   ```php
   $allowed_ips = ['TU_IP_AQUI']; // Ejemplo: ['123.45.67.89']
   ```
   Para obtener tu IP: https://www.whatismyip.com/

4. **Sube a Hostinger:**
   - Sube `index.php` a la raíz de `public_html/`
   - ¡Listo! El sitio mostrará la página de mantenimiento

### ❌ DESACTIVAR Mantenimiento

1. **En Hostinger:**
   - Elimina `index.php` de la raíz
   - O renómbralo a `index.php.backup`
   - El sitio volverá a funcionar normalmente

---

## Método 3: Usando .htaccess (Avanzado)

### ✅ ACTIVAR Mantenimiento

1. **En Hostinger:**
   - Si ya tienes un archivo `.htaccess` en la raíz, renómbralo a `.htaccess.backup`
   - Copia `.htaccess_maintenance` desde `mantenimiento/` a la raíz
   - Renómbralo a `.htaccess`
   - Copia también `maintenance.php` a la raíz y renómbralo a `index.php`

### ❌ DESACTIVAR Mantenimiento

1. **En Hostinger:**
   - Renombra `.htaccess` a `.htaccess_maintenance`
   - Si tenías un `.htaccess.backup`, renómbralo de vuelta a `.htaccess`
   - Elimina `index.php`

---

## Método 4: Renombrar archivos (Alternativa)

### ✅ ACTIVAR Mantenimiento

1. **En Hostinger (File Manager):**
   - Si tienes un `index.html` en la raíz, renómbralo a `index.html.backup`
   - Copia `maintenance.php` desde `mantenimiento/` a la raíz
   - Renómbralo a `index.php`
   - Ahora cuando alguien visite el sitio, verá la página de mantenimiento

### ❌ DESACTIVAR Mantenimiento

1. **En Hostinger:**
   - Renombra `index.php` a `maintenance.php` (o elimínalo)
   - Si tenías `index.html.backup`, renómbralo de vuelta a `index.html`

---

## 🔍 Verificar tu IP para acceso permitido

Si quieres que solo tú puedas acceder durante el mantenimiento:

1. Visita: https://www.whatismyip.com/
2. Copia tu IP pública (ejemplo: `123.45.67.89`)
3. Edita `maintenance.php` (o `index.php` en la raíz) y agrega tu IP:
   ```php
   $allowed_ips = ['123.45.67.89']; // Tu IP aquí
   ```
4. Guarda y sube el archivo

**Nota:** Si tu IP cambia (por ejemplo, al cambiar de red), necesitarás actualizarla.

---

## ⚙️ Personalizar el mensaje

Edita estas variables en `maintenance.php` (o `index.php`):

```php
$maintenance_message = "Tu mensaje personalizado aquí";
$estimated_time = "1 hora"; // Tiempo estimado
```

Ejemplos:
```php
$maintenance_message = "Estamos actualizando el sistema con nuevas funcionalidades.";
$estimated_time = "2 horas";
```

---

## 📝 Notas Importantes

- ⚠️ **NUNCA** subas `maintenance.php` con `$maintenance_mode = false` a producción
- ✅ Siempre prueba el modo mantenimiento localmente primero
- 🔄 El script tiene auto-refresh cada 5 minutos para verificar si el mantenimiento terminó
- 🌐 Si usas el método de `.htaccess`, asegúrate de tener habilitado `mod_rewrite` en Hostinger
- 📍 **Ubicación de archivos:** Todos los archivos están en `mantenimiento/` y deben copiarse a la raíz cuando los uses

---

## 🚨 Solución Rápida de Problemas

### Problema: La página de mantenimiento no se muestra

**Solución:**
1. Verifica que `maintenance_mode = true` en `index.php` (o `maintenance.php`)
2. Verifica que el archivo se llame `index.php` en la raíz
3. Limpia la caché del navegador (Ctrl+F5 o Cmd+Shift+R)
4. Verifica que el archivo esté en la raíz correcta (`public_html/` en Hostinger)

### Problema: No puedo acceder ni siquiera yo

**Solución:**
1. Agrega tu IP a `$allowed_ips` en `maintenance.php`
2. O simplemente cambia `$maintenance_mode = false` temporalmente
3. O elimina `index.php` de la raíz para desactivar el mantenimiento

### Problema: Los archivos CSS/JS no cargan

**Solución:**
1. El archivo `maintenance.php` tiene todos los estilos incluidos, no necesita CSS externo
2. Si usas el método `.htaccess`, edita `.htaccess_maintenance` y descomenta las líneas para permitir archivos estáticos

### Problema: Error 500 al activar mantenimiento

**Solución:**
1. Verifica que PHP esté habilitado en Hostinger
2. Verifica que no haya errores de sintaxis en `maintenance.php`
3. Si usas `.htaccess`, verifica que `mod_rewrite` esté habilitado
4. Revisa los logs de error de Hostinger

---

## 📋 Checklist de Activación

Antes de activar el mantenimiento:

- [ ] He probado el modo mantenimiento localmente
- [ ] Tengo una copia de seguridad de los archivos importantes
- [ ] He configurado mi IP en `$allowed_ips` si quiero acceso
- [ ] He personalizado el mensaje y tiempo estimado
- [ ] Sé cómo desactivar el mantenimiento
- [ ] He notificado a los usuarios sobre el mantenimiento (si es necesario)

---

## 🔄 Flujo de Trabajo Recomendado

1. **Preparación:**
   - Edita `maintenance.php` con tu mensaje personalizado
   - Agrega tu IP a `$allowed_ips` si quieres acceso
   - Prueba localmente

2. **Activación:**
   - Copia `maintenance.php` a la raíz como `index.php`
   - Sube a Hostinger
   - Verifica que funcione

3. **Durante el mantenimiento:**
   - Realiza las actualizaciones necesarias
   - Puedes acceder al sitio si agregaste tu IP

4. **Desactivación:**
   - Elimina `index.php` de la raíz
   - Verifica que el sitio funcione normalmente

---

**Ubicación de archivos:** `mantenimiento/`  
**Última actualización:** Diciembre 2024

