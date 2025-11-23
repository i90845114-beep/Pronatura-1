# 🔧 Guía de Mantenimiento en Hostinger

## 📋 Métodos para Acceder y Editar Código en Hostinger

### Método 1: Administrador de Archivos de Hostinger (Más Fácil)

1. **Accede al Panel de Hostinger (hPanel)**
   - Ve a `hpanel.hostinger.com`
   - Inicia sesión con tus credenciales

2. **Abre el Administrador de Archivos**
   - En el panel principal, busca **"Administrador de Archivos"** o **"File Manager"**
   - Navega a la carpeta `public_html` (o donde tengas tu aplicación)

3. **Edita los Archivos**
   - Haz clic derecho en el archivo que quieres editar
   - Selecciona **"Editar"** o **"Edit"**
   - Realiza los cambios
   - Guarda el archivo

**Ventajas:**
- ✅ No necesitas software adicional
- ✅ Cambios inmediatos
- ✅ Fácil de usar

**Desventajas:**
- ❌ No hay control de versiones
- ❌ Puede ser lento para archivos grandes
- ❌ No hay resaltado de sintaxis avanzado

---

### Método 2: FTP/SFTP (Recomendado para Desarrollo)

1. **Configura un Cliente FTP**
   - Usa **FileZilla**, **WinSCP**, o **VS Code con extensión FTP**

2. **Obtén las Credenciales FTP de Hostinger**
   - En hPanel → **"FTP Accounts"** o **"Cuentas FTP"**
   - Anota:
     - **Host/Servidor**: `ftp.tu-dominio.com` o la IP que te den
     - **Usuario**: Tu usuario FTP
     - **Contraseña**: Tu contraseña FTP
     - **Puerto**: 21 (FTP) o 22 (SFTP)

3. **Conéctate y Edita**
   - Conéctate con tu cliente FTP
   - Navega a `public_html` (o donde esté tu aplicación)
   - Descarga el archivo, edítalo localmente, y súbelo de nuevo

**Ventajas:**
- ✅ Puedes usar tu editor favorito (VS Code, etc.)
- ✅ Más rápido para múltiples archivos
- ✅ Puedes hacer respaldos fácilmente

**Desventajas:**
- ❌ Requiere configuración inicial
- ❌ Necesitas recordar subir los cambios

---

### Método 3: Git + Deploy (Más Profesional)

1. **Configura un Repositorio Git**
   - Crea un repositorio en GitHub/GitLab
   - Sube tu código

2. **Conecta Hostinger con Git** (si está disponible)
   - Algunos planes de Hostinger permiten deploy desde Git
   - O usa un servicio como DeployHQ, DeployBot, etc.

3. **Haz Cambios y Deploy**
   - Edita en tu PC local
   - Haz commit y push a Git
   - El deploy automático actualiza Hostinger

**Ventajas:**
- ✅ Control de versiones
- ✅ Historial de cambios
- ✅ Deploy automático
- ✅ Mejor para trabajo en equipo

**Desventajas:**
- ❌ Requiere más configuración
- ❌ Puede no estar disponible en todos los planes

---

## 🛠️ Proceso Recomendado para Mantenimiento

### Paso 1: Hacer Respaldo ANTES de Cambios

**Opción A: Respaldo Manual**
1. En hPanel → **"Backups"** o **"Respaldos"**
2. Crea un respaldo completo del sitio
3. O descarga manualmente los archivos importantes

**Opción B: Respaldo de Base de Datos**
1. En phpMyAdmin de Hostinger
2. Selecciona tu base de datos `u999030405_wp`
3. Ve a **"Exportar"** → **"Ejecutar"**
4. Descarga el archivo `.sql`

### Paso 2: Identificar el Problema

1. **Revisa los Logs de Error**
   - En hPanel → **"Error Logs"** o **"Registros de Error"**
   - Busca errores recientes relacionados con tu problema

2. **Revisa la Consola del Navegador**
   - Abre tu sitio en Hostinger
   - Presiona F12 → Pestaña **"Console"**
   - Busca errores en rojo

3. **Revisa la Respuesta del Servidor**
   - F12 → Pestaña **"Network"**
   - Busca peticiones fallidas
   - Revisa la respuesta del servidor

### Paso 3: Hacer los Cambios

**Método Seguro (Recomendado):**

1. **Descarga el Archivo Problemático**
   - Usa FTP o el Administrador de Archivos
   - Descarga el archivo a tu PC

2. **Edita Localmente**
   - Abre el archivo en VS Code o tu editor
   - Haz los cambios necesarios
   - Prueba localmente si es posible

3. **Sube el Archivo Corregido**
   - Sube el archivo de vuelta a Hostinger
   - Reemplaza el archivo original

### Paso 4: Probar los Cambios

1. **Limpia la Caché del Navegador**
   - Ctrl + Shift + R (recarga forzada)
   - O abre en modo incógnito

2. **Prueba la Funcionalidad**
   - Verifica que el error se haya corregido
   - Prueba diferentes escenarios

3. **Revisa los Logs Nuevamente**
   - Asegúrate de que no haya nuevos errores

---

## ⚠️ Mejores Prácticas

### ✅ HACER:

1. **Siempre haz respaldo antes de cambios**
2. **Prueba cambios localmente primero** (si es posible)
3. **Documenta los cambios** que haces
4. **Haz cambios pequeños** y prueba después de cada uno
5. **Mantén una copia local** de los archivos importantes

### ❌ NO HACER:

1. **No edites directamente en producción** sin respaldo
2. **No hagas cambios grandes** sin probar primero
3. **No elimines archivos** sin estar seguro
4. **No cambies configuraciones críticas** sin respaldo
5. **No trabajes en horas pico** si es posible

---

## 🔍 Solución de Problemas Comunes

### Error: "No se puede conectar a la base de datos"
- Verifica `config/config.json` en Hostinger
- Asegúrate de que las credenciales sean correctas
- Verifica que MySQL esté corriendo

### Error: "Archivo no encontrado"
- Verifica las rutas de los archivos
- Asegúrate de que los archivos estén en la ubicación correcta
- Revisa los permisos de archivos

### Error: "Permiso denegado"
- Verifica los permisos de archivos (deben ser 644 para archivos, 755 para carpetas)
- En hPanel → Administrador de Archivos → Cambiar permisos

### Cambios no se reflejan
- Limpia la caché del navegador
- Verifica que guardaste el archivo correctamente
- Revisa si hay caché del servidor (algunos hosts tienen caché)

---

## 📝 Estructura Recomendada para Mantenimiento

```
Tu PC Local:
├── pronatura/              (Código fuente)
│   ├── api/
│   ├── pages/
│   ├── assets/
│   └── config/
│
└── backups/                (Respaldos)
    ├── hostinger-2025-01-15/
    └── database-2025-01-15.sql

Hostinger:
└── public_html/            (o donde esté tu app)
    ├── api/
    ├── pages/
    ├── assets/
    └── config/
```

---

## 🚀 Flujo de Trabajo Recomendado

1. **Desarrollo Local** → Prueba en tu PC con XAMPP
2. **Respaldo** → Haz respaldo de Hostinger antes de cambios
3. **Subir Cambios** → Sube solo los archivos modificados
4. **Probar en Producción** → Verifica que todo funcione
5. **Documentar** → Anota qué cambiaste y por qué

---

## 📞 Recursos Útiles

- **Panel de Hostinger**: `hpanel.hostinger.com`
- **phpMyAdmin**: Desde hPanel → Bases de datos → phpMyAdmin
- **Logs de Error**: hPanel → Error Logs
- **Administrador de Archivos**: hPanel → File Manager

---

**Recuerda:** Siempre haz respaldo antes de hacer cambios importantes en producción.

