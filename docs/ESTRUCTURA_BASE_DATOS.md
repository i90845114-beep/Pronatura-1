# Estructura de Base de Datos - ProNatura

## 📊 Resumen de Tablas

El sistema requiere **3 tablas principales** para funcionar correctamente:

### 1. **usuarios** 👤
Almacena la información de los usuarios del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT (PK) | Identificador único del usuario |
| `nombre` | VARCHAR(255) | Nombre completo del usuario |
| `email` | VARCHAR(255) | Email (único) |
| `password_hash` | VARCHAR(255) | Hash de la contraseña |
| `fecha_registro` | DATETIME | Fecha de registro en el sistema |
| `fecha_ultimo_acceso` | DATETIME | Última vez que inició sesión |
| `activo` | BOOLEAN | Si el usuario está activo o no |

**Relaciones:**
- Un usuario puede tener muchos registros de animales

---

### 2. **registros_animales** 🦊
Almacena los registros de fauna silvestre.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT (PK) | Identificador único del registro |
| `usuario_id` | INT (FK) | ID del usuario que creó el registro |
| `nombre` | VARCHAR(255) | Nombre del animal o identificador |
| `especie` | VARCHAR(255) | Especie del animal (ej: "Zorro gris") |
| `fecha` | DATE | Fecha del avistamiento |
| `latitud` | DECIMAL(10,8) | Coordenada de latitud |
| `longitud` | DECIMAL(11,8) | Coordenada de longitud |
| `notas` | TEXT | Notas adicionales del registro |
| `fecha_creacion` | DATETIME | Fecha de creación del registro |
| `fecha_actualizacion` | DATETIME | Fecha de última actualización |

**Relaciones:**
- Pertenece a un usuario (usuario_id → usuarios.id)
- Puede tener múltiples archivos de media

**Índices:**
- Búsqueda por usuario
- Búsqueda por fecha
- Búsqueda por especie
- Búsqueda por ubicación (latitud, longitud)
- Búsqueda de texto completo (nombre, especie, notas)

---

### 3. **media_registros** 📸
Almacena las imágenes y videos asociados a cada registro.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT (PK) | Identificador único del archivo |
| `registro_id` | INT (FK) | ID del registro al que pertenece |
| `tipo` | ENUM | Tipo: 'image' o 'video' |
| `nombre_archivo` | VARCHAR(255) | Nombre original del archivo |
| `ruta_archivo` | VARCHAR(500) | Ruta donde se almacena (si se guarda en servidor) |
| `datos_base64` | LONGTEXT | Datos en base64 (alternativa) |
| `orden` | INT | Orden de visualización |
| `fecha_subida` | DATETIME | Fecha de subida del archivo |

**Relaciones:**
- Pertenece a un registro (registro_id → registros_animales.id)

**Nota:** Se recomienda usar `ruta_archivo` para producción (guardar archivos en servidor) y `datos_base64` solo para desarrollo.

---

## 🔗 Diagrama de Relaciones

```
usuarios (1) ──────< (N) registros_animales (1) ──────< (N) media_registros
```

- **1 usuario** puede tener **muchos registros**
- **1 registro** puede tener **muchas imágenes/videos**

---

## 📋 Vista Útil

### `vista_registros_completos`
Vista que combina información de las 3 tablas para consultas rápidas:
- Información del registro
- Información del usuario
- Conteo de archivos de media asociados

---

## 🚀 Consideraciones de Implementación

### Almacenamiento de Media
**Opción Recomendada (Producción):**
- Guardar archivos físicos en el servidor
- Almacenar solo la ruta en `ruta_archivo`
- Usar CDN para servir archivos

**Opción Alternativa (Desarrollo):**
- Guardar datos base64 en `datos_base64`
- Solo para pruebas o archivos pequeños

### Seguridad
- ✅ Usar **bcrypt** o **Argon2** para hash de contraseñas
- ✅ Validar todas las entradas (prevenir SQL injection)
- ✅ Usar **prepared statements**
- ✅ Implementar rate limiting para login

### Rendimiento
- ✅ Índices en campos de búsqueda frecuente
- ✅ Índice de texto completo para búsquedas
- ✅ Considerar particionar `media_registros` si crece mucho
- ✅ Implementar caché para consultas frecuentes

---

## 📝 Ejemplo de Consultas Útiles

### Obtener todos los registros de un usuario
```sql
SELECT * FROM registros_animales 
WHERE usuario_id = ? 
ORDER BY fecha DESC;
```

### Obtener registro con todas sus imágenes
```sql
SELECT r.*, m.* 
FROM registros_animales r
LEFT JOIN media_registros m ON r.id = m.registro_id
WHERE r.id = ?
ORDER BY m.orden;
```

### Buscar registros por texto
```sql
SELECT * FROM registros_animales
WHERE MATCH(nombre, especie, notas) AGAINST(? IN NATURAL LANGUAGE MODE);
```

### Obtener estadísticas por usuario
```sql
SELECT 
    u.nombre,
    COUNT(r.id) as total_registros,
    COUNT(DISTINCT r.especie) as especies_unicas
FROM usuarios u
LEFT JOIN registros_animales r ON u.id = r.usuario_id
GROUP BY u.id, u.nombre;
```

---

## 🔄 Migración desde localStorage

Para migrar datos existentes desde localStorage:

1. **Usuarios:** Convertir array de usuarios a INSERT statements
2. **Registros:** Convertir `animalRecords` a INSERT statements
3. **Media:** Extraer arrays de `media` y crear registros en `media_registros`

**Script de migración recomendado:**
- Leer datos de localStorage
- Validar integridad
- Convertir a SQL
- Ejecutar en transacción

