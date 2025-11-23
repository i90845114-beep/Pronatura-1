# 📦 Guía de Respaldo - ProNatura

Esta guía te explica cómo respaldar tu proyecto ProNatura de forma completa y segura.

## 🚀 Métodos de Respaldo

### **Método 1: Respaldo Completo Automático (Recomendado)**

Este método respalda **todos los archivos del proyecto** y **la base de datos** automáticamente.

**Pasos:**
1. Abre PowerShell como Administrador
2. Navega a la carpeta del proyecto:
   ```powershell
   cd C:\xampp\htdocs\pronatura\scripts
   ```
3. Ejecuta el script de respaldo completo:
   ```powershell
   .\respaldar_proyecto.ps1
   ```

**¿Qué respalda?**
- ✅ Todos los archivos del proyecto (código fuente, imágenes, configuraciones)
- ✅ Base de datos completa (MySQL/MariaDB)
- ✅ Crea un archivo ZIP con todo el proyecto
- ✅ Genera un archivo SQL con la base de datos

**Ubicación del respaldo:**
```
C:\xampp\htdocs\pronatura\backups\pronatura_backup_YYYY-MM-DD_HH-mm-ss\
```

---

### **Método 2: Respaldo Solo Base de Datos**

Si solo necesitas respaldar la base de datos rápidamente:

**Pasos:**
1. Abre PowerShell
2. Ejecuta:
   ```powershell
   cd C:\xampp\htdocs\pronatura\scripts
   .\respaldar_bd.ps1
   ```

**Ubicación del respaldo:**
```
C:\xampp\htdocs\pronatura\backups\bd_db_YYYY-MM-DD_HH-mm-ss.sql
```

---

### **Método 3: Respaldo Manual desde phpMyAdmin**

Si prefieres hacerlo manualmente:

**Para la Base de Datos:**
1. Abre tu navegador y ve a: `http://localhost/phpmyadmin`
2. Selecciona la base de datos `db` en el menú lateral
3. Haz clic en la pestaña **"Exportar"**
4. Selecciona **"Método: Rápido"**
5. Haz clic en **"Continuar"**
6. Se descargará un archivo `.sql` con el respaldo

**Para los Archivos del Proyecto:**
1. Navega a: `C:\xampp\htdocs\pronatura`
2. Selecciona todas las carpetas y archivos (excepto `backups`)
3. Clic derecho > **"Enviar a"** > **"Carpeta comprimida (en zip)"**
4. Guarda el ZIP en un lugar seguro

---

### **Método 4: Respaldo Manual con PowerShell**

Si los scripts no funcionan, puedes hacerlo manualmente:

**1. Respaldo de archivos:**
```powershell
cd C:\xampp\htdocs\pronatura
$fecha = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
Compress-Archive -Path * -DestinationPath "backups\proyecto_$fecha.zip" -Exclude "backups"
```

**2. Respaldo de base de datos:**
```powershell
cd C:\xampp\mysql\bin
.\mysqldump.exe -u root db > "C:\xampp\htdocs\pronatura\backups\bd_$fecha.sql"
```

---

## 🔄 Restaurar un Respaldo

### **Restaurar Archivos:**
1. Descomprime el archivo `proyecto_completo.zip`
2. Copia todos los archivos a `C:\xampp\htdocs\pronatura`
3. Sobrescribe los archivos existentes si es necesario

### **Restaurar Base de Datos:**

**Opción A: Desde phpMyAdmin**
1. Abre `http://localhost/phpmyadmin`
2. Selecciona la base de datos `db`
3. Haz clic en **"Importar"**
4. Selecciona el archivo `.sql` del respaldo
5. Haz clic en **"Continuar"**

**Opción B: Desde PowerShell**
```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root db < "C:\xampp\htdocs\pronatura\backups\bd_db_YYYY-MM-DD_HH-mm-ss.sql"
```

---

## 📋 Recomendaciones

1. **Frecuencia de respaldos:**
   - Antes de hacer cambios importantes
   - Al menos una vez por semana
   - Antes de actualizar dependencias

2. **Almacenamiento:**
   - Guarda respaldos en un disco externo
   - Usa servicios en la nube (Google Drive, OneDrive, Dropbox)
   - Mantén al menos 3 respaldos recientes

3. **Verificación:**
   - Verifica que los archivos ZIP se puedan abrir
   - Verifica que los archivos SQL no estén vacíos
   - Prueba restaurar un respaldo en un entorno de prueba

---

## ⚠️ Solución de Problemas

**Error: "mysqldump no encontrado"**
- Verifica que XAMPP esté instalado correctamente
- Verifica que MySQL esté corriendo en XAMPP
- Usa el Método 3 (phpMyAdmin) como alternativa

**Error: "No se puede crear el directorio backups"**
- Ejecuta PowerShell como Administrador
- Verifica permisos de escritura en la carpeta del proyecto

**Error: "Acceso denegado a la base de datos"**
- Verifica las credenciales en `config/config.json`
- Asegúrate de que MySQL esté corriendo

---

## 📞 Información del Proyecto

- **Nombre:** ProNatura
- **Ubicación:** `C:\xampp\htdocs\pronatura`
- **Base de Datos:** `db`
- **Usuario BD:** `root` (por defecto)
- **Contraseña BD:** (vacía por defecto en XAMPP)

---

**Última actualización:** $(Get-Date -Format "yyyy-MM-dd")

