# 🌳 Catálogo Completo de Categorías
## Bitácora Digital de Conservación Ambiental Comunitaria

Este documento describe el catálogo completo de categorías y subcategorías para el sistema de contraloría social comunitaria.

---

## ✅ Campos Generales para TODO Registro

Estos campos se muestran sin importar la categoría seleccionada:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| Fecha | DATE | Sí | Fecha de la actividad |
| Hora | TIME | No | Hora de la actividad |
| Responsable / Brigada | VARCHAR(255) | No | Nombre del responsable o brigada |
| Ubicación (GPS) | DECIMAL(10,8) | Sí | Latitud y longitud |
| Altitud | DECIMAL(8,2) | No | Altitud en metros (opcional) |
| Comunidad / Sitio | VARCHAR(255) | No | Nombre de la comunidad o sitio |
| Tipo de actividad | VARCHAR(255) | No | Tipo específico de actividad |
| Descripción breve | TEXT | No | Descripción corta de la actividad |
| Evidencia | MEDIA | No | Fotos, video, audio |
| Observaciones | TEXT | No | Observaciones adicionales |
| Materiales utilizados | TEXT | No | Lista de materiales usados |
| Número de participantes | INT | No | Cantidad de personas participantes |

---

## 📋 Categorías Principales

### 1. Monitoreo y Vigilancia Ambiental

**Código:** `MONITOREO`

#### 1.1 Recorridos de Campo
- Patrullajes rutinarios
- Avistamientos ocasionales
- Identificación de flora y fauna
- Reporte de anomalías
- Seguimiento de huellas o rastros

#### 1.2 Vigilancia Comunitaria
- Guardias comunitarias
- Puntos de control
- Retén ecológico
- Verificación de accesos
- Detección de actividades ilegales

#### 1.3 Monitoreo de Ecosistemas
- Calidad del agua
- Calidad del aire
- Calidad del suelo
- Monitoreo de polinizadores
- Monitoreo de especies focales
- Evaluación de hábitats

#### 1.4 Registro Básico de Biodiversidad
- Observaciones rápidas de fauna
- Observaciones rápidas de flora
- Registro de huellas o indicios
- Registros atípicos o extraordinarios

---

### 2. Restauración y Manejo del Hábitat

**Código:** `RESTAURACION`

#### 2.1 Reforestación
- Plantación de árboles nativos
- Mantenimiento y riego
- Reposición de plantas perdidas

#### 2.2 Manejo de Suelo
- Control de erosión
- Construcción de terrazas
- Barreras vivas
- Restauración de cárcavas

#### 2.3 Brechas Corta Fuego
- Apertura de brechas
- Mantenimiento
- Limpieza de combustibles

#### 2.4 Manejo de Vegetación
- Podas
- Control de especies invasoras
- Manejo de combustibles forestales
- Enriquecimiento vegetal

---

### 3. Gestión de Residuos y Limpieza Ambiental

**Código:** `RESIDUOS`

#### 3.1 Limpiezas Comunitarias
- Ríos y arroyos
- Caminos y senderos
- Centros de población
- Zonas recreativas

#### 3.2 Gestión de Residuos
- Recolección y separación
- Reciclaje y acopio
- Residuos especiales (electrónicos, agroquímicos)

#### 3.3 Educación en Residuos
- Talleres
- Campañas
- Señalización

---

### 4. Educación Ambiental

**Código:** `EDUCACION`

#### 4.1 Talleres y Capacitación
- Talleres comunitarios
- Capacitación en temas ambientales

#### 4.2 Campañas de Sensibilización
- Campañas informativas
- Difusión de buenas prácticas

#### 4.3 Actividades con Niños y Jóvenes
- Programas escolares
- Actividades recreativas ambientales

---

### 5. Gestión de Riesgos

**Código:** `RIESGO`

#### 5.1 Prevención de Incendios
- Preparación
- Simulacros
- Equipamiento

#### 5.2 Manejo de Emergencias
- Respuesta a emergencias ambientales
- Coordinación

#### 5.3 Evaluación de Riesgos
- Identificación y evaluación de riesgos ambientales

---

### 6. Ordenamiento Territorial

**Código:** `ORDENAMIENTO`

#### 6.1 Delimitación de Áreas
- Marcación de límites
- Señalización de áreas protegidas

#### 6.2 Planificación Territorial
- Elaboración de planes
- Zonificación

#### 6.3 Regularización
- Procesos de regularización de uso de suelo

---

### 7. Administración y Gestión

**Código:** `ADMINISTRACION`

#### 7.1 Reuniones y Asambleas
- Reuniones comunitarias
- Asambleas
- Toma de decisiones

#### 7.2 Gestión de Recursos
- Administración de recursos
- Inventarios
- Compras

#### 7.3 Reportes y Documentación
- Elaboración de reportes
- Documentación de actividades

---

### 8. Biodiversidad (Módulo Ampliado)

**Código:** `BIODIVERSIDAD`

#### 8.1 Registro de Fauna
- Registro detallado de especies animales
- Avistamientos
- Comportamiento

#### 8.2 Registro de Flora
- Registro detallado de especies vegetales
- Fenología
- Estado de conservación

#### 8.3 Hábitats y Ecosistemas
- Caracterización de hábitats
- Evaluación de ecosistemas

#### 8.4 Especies en Riesgo
- Monitoreo de especies amenazadas
- Especies en peligro
- Especies bajo protección especial

#### 8.5 Interacciones Ecológicas
- Registro de interacciones entre especies
- Cadenas tróficas

---

## 📊 Estructura de Base de Datos

### Tabla: `categorias`
- `id` - Identificador único
- `codigo` - Código único de la categoría
- `nombre` - Nombre de la categoría
- `descripcion` - Descripción de la categoría
- `activa` - Si la categoría está activa
- `orden` - Orden de visualización

### Tabla: `subcategorias`
- `id` - Identificador único
- `categoria_id` - ID de la categoría padre
- `codigo` - Código único de la subcategoría
- `nombre` - Nombre de la subcategoría
- `descripcion` - Descripción de la subcategoría
- `activa` - Si la subcategoría está activa
- `orden` - Orden de visualización

### Tabla: `registros_ambientales`
Contiene todos los campos generales mencionados más arriba, además de:
- `categoria_id` - ID de la categoría
- `subcategoria_id` - ID de la subcategoría (opcional)
- `datos_especificos` - JSON con datos específicos de la categoría

---

## 🔧 Uso de la API

### Obtener todas las categorías
```
GET /api/api.php?action=get_categorias
```

### Obtener subcategorías de una categoría
```
GET /api/api.php?action=get_subcategorias&categoria_id=1
```

### Guardar registro ambiental
```
POST /api/api.php?action=save_registro_ambiental
```

### Obtener registros ambientales
```
GET /api/api.php?action=get_registros_ambientales&usuario_id=1&categoria_id=1
```

---

## 📝 Notas

- Todas las categorías y subcategorías están activas por defecto
- Se pueden agregar nuevas categorías y subcategorías sin modificar el código
- Los campos específicos de cada categoría se almacenan en `datos_especificos` como JSON
- La tabla `media_registros` soporta imágenes, videos y audio

