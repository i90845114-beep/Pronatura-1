# 🚀 Activar Mantenimiento - Método Rápido

## ✅ ACTIVAR Mantenimiento (Mostrar página de mantenimiento en lugar de login y otras páginas)

### Opción 1: Usando .htaccess (Recomendado)

1. **Sube estos archivos a Hostinger:**
   - `.htaccess` (desde la raíz del proyecto) → a `public_html/.htaccess`
   - Carpeta `mantenimiento/` completa → a `public_html/mantenimiento/`

2. **¡Listo!** Ahora todas las páginas (login.html, registro.html, etc.) mostrarán la página de mantenimiento

### Opción 2: Copiar index.html a la raíz (Alternativa)

1. **Copia `mantenimiento/index.html` a la raíz:**
   - Desde: `public_html/mantenimiento/index.html`
   - Hacia: `public_html/index.html`

2. **Si ya tienes un `index.html` en la raíz:**
   - Renómbralo a `index.html.backup`
   - Luego copia `mantenimiento/index.html` a la raíz

3. **¡Listo!** La página principal mostrará mantenimiento

**Nota:** Este método solo afecta la página principal (`/`), no redirige `login.html` u otras páginas.

---

## ❌ DESACTIVAR Mantenimiento

### Si usaste Opción 1 (.htaccess):

1. **Elimina o renombra `.htaccess`:**
   - Renómbralo a `.htaccess.maintenance` (para guardarlo como respaldo)
   - O elimínalo completamente

2. **El sitio volverá a funcionar normalmente**

### Si usaste Opción 2 (index.html):

1. **Elimina o renombra `index.html` de la raíz:**
   - Renómbralo a `index.html.maintenance`
   - O elimínalo

2. **Si tenías un `index.html.backup`, renómbralo de vuelta a `index.html`**

3. **El sitio volverá a funcionar normalmente**

---

## ⚙️ Personalizar el mensaje

Edita `mantenimiento/index.html` y modifica estas líneas:

```html
<p><strong>📢 Estamos realizando mantenimiento. Volveremos pronto.</strong></p>
```

y

```html
⏱️ Tiempo estimado: 30 minutos
```

Después de editar, vuelve a subir el archivo a Hostinger.

---

## 🔍 Verificación

Después de activar el mantenimiento, verifica que funcione:

- ✅ `organicjournal.com.mx/` → Muestra página de mantenimiento
- ✅ `organicjournal.com.mx/login.html` → Muestra página de mantenimiento
- ✅ `organicjournal.com.mx/registro.html` → Muestra página de mantenimiento
- ✅ `organicjournal.com.mx/cualquier-pagina.html` → Muestra página de mantenimiento

---

**Última actualización:** Diciembre 2024

