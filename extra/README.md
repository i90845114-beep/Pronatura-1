# 📁 Carpeta Extra

Esta carpeta contiene scripts y archivos temporales o de utilidad que no forman parte del código principal de la aplicación.

## 📋 Archivos incluidos

### Scripts PHP

- **`crear_admin.php`** - Script para crear un usuario administrador en la tabla `usuarios`
- **`crear_administradores.php`** - Script para crear la tabla `usuarios_administradores` e insertar los administradores (Allen y Aaron)

### Scripts SQL

- **`crear_tabla_admin.sql`** - Script SQL para crear la tabla `usuarios_administradores` manualmente

## ⚠️ Importante

- Estos archivos son temporales y deben eliminarse después de usarlos en producción
- No subir esta carpeta a Hostinger a menos que sea necesario ejecutar los scripts
- Después de ejecutar los scripts, eliminar los archivos por seguridad

## 🔐 Seguridad

**NUNCA** dejes estos archivos en producción después de usarlos, ya que pueden ser utilizados para crear usuarios administradores no autorizados.

