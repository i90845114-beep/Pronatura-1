# 📋 Guía de Mantenimiento - ProNatura

## 🔧 Configuración de Base de Datos

### Entorno Local (XAMPP)

**Archivo:** `config/config.json`

```json
{
    "database": {
        "host": "localhost",
        "port": 3306,
        "database": "pronatura",
        "user": "root",
        "password": "",
        "charset": "utf8mb4",
        "timezone": "America/Mexico_City"
    }
}
```

**Nota:** En XAMPP local, el usuario `root` normalmente no tiene contraseña.

### Entorno Hostinger (Producción)

**Archivo:** `config/config.json` (en el servidor)

```json
{
    "database": {
        "host": "localhost",
        "port": 3306,
        "database": "u999030405_wp",
        "user": "u999030405_wp",
        "password": "TU_CONTRASEÑA_DE_HOSTINGER",
        "charset": "utf8mb4",
        "timezone": "America/Mexico_City"
    }
}
```

**⚠️ IMPORTANTE:** 
- La contraseña debe obtenerse desde el Panel de Hostinger → Bases de datos MySQL
- Nunca compartas este archivo públicamente
- Mantén una copia de seguridad de las credenciales

---

## 📁 Estructura de Archivos

```
pronatura/
├── api/
│   ├── api.php              # Endpoint principal de la API
│   ├── db_connection.php    # Conexión a base de datos
│   └── admin_functions.php  # Funciones de administración
├── assets/
│   ├── css/
│   │   └── styles.css       # Estilos principales
│   └── js/
│       ├── auth.js          # Sistema de autenticación
│       ├── script.js        # Script principal
│       └── form-script.js   # Script del formulario
├── config/
│   └── config.json          # Configuración de BD (⚠️ NO SUBIR A GIT)
├── database/
│   └── db.sql               # Script de creación de BD
├── pages/
│   ├── inicio.html          # Página de inicio
│   ├── login.html           # Login
│   ├── registro.html        # Registro de usuarios
│   ├── index.html           # Lista de registros
│   ├── nuevo-registro.html  # Formulario nuevo registro
│   ├── mapa-consolidado.html # Mapa con todos los registros
│   └── admin.html           # Panel de administración
└── MANTENIMIENTO.md         # Este archivo
```

---

## 🌐 Rutas de API

### Rutas Locales (desde `pages/`)
- `../api/api.php?action=register`
- `../api/api.php?action=login`
- `../api/api.php?action=get_categorias`
- `../api/api.php?action=get_subcategorias`
- `../api/api.php?action=save_registro_ambiental`
- `../api/api.php?action=get_registros_ambientales`

### Rutas Hostinger (desde raíz)
- `api/api.php?action=register`
- `api/api.php?action=login`
- `api/api.php?action=get_categorias`
- `api/api.php?action=get_subcategorias`
- `api/api.php?action=save_registro_ambiental`
- `api/api.php?action=get_registros_ambientales`

**Nota:** Los archivos JavaScript (`auth.js` y `form-script.js`) detectan automáticamente la ubicación y ajustan las rutas.

---

## 🔄 Actualizar Archivos en Hostinger

### Método 1: FileZilla (FTP)

1. Conecta a Hostinger usando FileZilla
2. Navega a `public_html/` (o `htdocs/` según tu configuración)
3. Sube los archivos modificados:
   - `assets/js/auth.js`
   - `assets/js/form-script.js`
   - `assets/js/script.js`
   - `api/api.php`
   - `config/config.json` (⚠️ Solo si cambias credenciales)

### Método 2: File Manager de Hostinger

1. Accede al Panel de Hostinger
2. Ve a **File Manager**
3. Navega a `public_html/`
4. Edita los archivos directamente o súbelos

**⚠️ IMPORTANTE:** 
- Siempre haz una copia de seguridad antes de modificar archivos en producción
- Verifica que los cambios funcionen localmente antes de subirlos

---

## 🐛 Solución de Problemas Comunes

### Error: "Access denied for user 'root'@'localhost'"

**Causa:** Credenciales incorrectas en `config/config.json`

**Solución:**
1. Verifica las credenciales en el Panel de Hostinger
2. Actualiza `config/config.json` con las credenciales correctas
3. Asegúrate de que la contraseña esté entre comillas dobles

### Error: "404 Not Found" en llamadas a API

**Causa:** Rutas incorrectas en JavaScript

**Solución:**
1. Verifica que `auth.js` y `form-script.js` tengan la función `getApiUrl()`
2. Si el HTML está en `pages/`, usa `../api/api.php`
3. Si el HTML está en la raíz, usa `api/api.php`

### Error: "Categorías no cargan"

**Causa:** 
- Ruta de API incorrecta
- Base de datos no tiene la tabla `categorias`
- Error en la conexión a BD

**Solución:**
1. Abre la consola del navegador (F12)
2. Verifica los errores en la pestaña "Console"
3. Verifica la pestaña "Network" para ver si la llamada a la API se está haciendo
4. Verifica que la tabla `categorias` exista en la base de datos

### Error: "Registros no se guardan"

**Causa:**
- Error de conexión a BD
- Tabla `registros_ambientales` no existe
- Permisos de usuario de BD insuficientes

**Solución:**
1. Verifica que la tabla `registros_ambientales` exista
2. Verifica los permisos del usuario de BD (INSERT, UPDATE, SELECT)
3. Revisa los logs de PHP en Hostinger

---

## 📊 Base de Datos

### Tablas Principales

1. **usuarios**
   - `id`, `nombre`, `email`, `password`, `fecha_registro`, `rol`

2. **categorias**
   - `id`, `nombre`, `descripcion`, `fecha_creacion`

3. **subcategorias**
   - `id`, `categoria_id`, `nombre`, `descripcion`, `fecha_creacion`

4. **registros_ambientales**
   - `id`, `usuario_id`, `categoria_id`, `subcategoria_id`, `fecha`, `hora`, `latitud`, `longitud`, `altitud`, `responsable`, `brigada`, `comunidad`, `sitio`, `tipo_actividad`, `descripcion_breve`, `observaciones`, `materiales_utilizados`, `numero_participantes`, `media`, `notas`, `nombre`, `especie`, `fecha_creacion`, `fecha_actualizacion`

5. **admins**
   - `id`, `nombre`, `email`, `password`, `fecha_creacion`

### Importar Base de Datos

1. Accede a phpMyAdmin (local o Hostinger)
2. Selecciona la base de datos
3. Ve a la pestaña "Importar"
4. Selecciona el archivo `database/db.sql`
5. Haz clic en "Continuar"

---

## 🔐 Seguridad

### Archivos que NO deben subirse a Git

- `config/config.json` (contiene credenciales)
- Archivos de log
- Archivos temporales

### Buenas Prácticas

1. **Nunca** compartas `config/config.json` públicamente
2. Usa contraseñas fuertes para la base de datos
3. Mantén actualizados los archivos del servidor
4. Haz copias de seguridad regulares de la base de datos
5. Revisa los logs de errores periódicamente

---

## 🚀 Despliegue

### Checklist antes de subir cambios

- [ ] Probar localmente en XAMPP
- [ ] Verificar que no haya errores en la consola del navegador
- [ ] Verificar que las rutas de API funcionen
- [ ] Hacer copia de seguridad de archivos en producción
- [ ] Hacer copia de seguridad de la base de datos
- [ ] Subir archivos modificados
- [ ] Probar en producción después de subir

### Orden recomendado de actualización

1. Base de datos (si hay cambios)
2. Archivos PHP (`api/`)
3. Archivos JavaScript (`assets/js/`)
4. Archivos CSS (`assets/css/`)
5. Archivos HTML (`pages/`)

---

## 📝 Logs y Debugging

### Ver logs en Hostinger

1. Accede al Panel de Hostinger
2. Ve a **File Manager**
3. Busca archivos `error_log` en las carpetas
4. O usa la función de logs del panel

### Debugging en el navegador

1. Abre las herramientas de desarrollador (F12)
2. Pestaña **Console**: Ver errores de JavaScript
3. Pestaña **Network**: Ver llamadas a la API y respuestas
4. Pestaña **Application**: Ver localStorage y sessionStorage

### Agregar logs temporales

En PHP:
```php
error_log("Mensaje de debug: " . json_encode($variable));
```

En JavaScript:
```javascript
console.log("Debug:", variable);
```

---

## 📞 Contacto y Soporte

### Información del Proyecto

- **Nombre:** ProNatura - Contraloría Social Tamaulipas
- **Versión:** 1.0.0
- **Entorno Local:** XAMPP
- **Hosting:** Hostinger

### Recursos Útiles

- Panel de Hostinger: https://hpanel.hostinger.com
- Documentación PHP: https://www.php.net/docs.php
- Documentación MySQL: https://dev.mysql.com/doc/

---

## 🔄 Actualizaciones Recientes

### Versión 1.0.0
- Sistema de autenticación implementado
- Formulario de registro ambiental completo
- Mapa consolidado con Leaflet
- Panel de administración
- Sistema de categorías y subcategorías

---

**Última actualización:** Diciembre 2024

