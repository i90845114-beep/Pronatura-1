-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_ultimo_acceso DATETIME NULL,
    activo BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_activo (activo),
    INDEX idx_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de categorías principales
CREATE TABLE IF NOT EXISTS categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT NULL,
    activa BOOLEAN DEFAULT TRUE,
    orden INT DEFAULT 0,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_codigo (codigo),
    INDEX idx_activa (activa),
    INDEX idx_orden (orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de subcategorías
CREATE TABLE IF NOT EXISTS subcategorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    categoria_id INT NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT NULL,
    activa BOOLEAN DEFAULT TRUE,
    orden INT DEFAULT 0,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE,
    INDEX idx_categoria (categoria_id),
    INDEX idx_codigo (codigo),
    INDEX idx_activa (activa),
    INDEX idx_orden (orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de registros (actualizada con campos generales recomendados del catálogo)
CREATE TABLE IF NOT EXISTS registros_animales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    categoria_id INT NULL,
    subcategoria_id INT NULL,
    
    -- Campos originales (compatibilidad)
    nombre VARCHAR(255) NULL,
    especie VARCHAR(255) NULL,
    
    -- Campos generales recomendados (para TODO registro)
    fecha DATE NOT NULL,
    hora TIME NULL,
    responsable VARCHAR(255) NULL,
    brigada VARCHAR(255) NULL,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    altitud DECIMAL(8, 2) NULL,
    comunidad VARCHAR(255) NULL,
    sitio VARCHAR(255) NULL,
    tipo_actividad VARCHAR(255) NULL,
    descripcion_breve TEXT NULL,
    notas TEXT NULL,
    observaciones TEXT NULL,
    materiales_utilizados TEXT NULL,
    numero_participantes INT NULL,
    
    -- Campos específicos (JSON para flexibilidad)
    datos_especificos JSON NULL,
    
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    FOREIGN KEY (subcategoria_id) REFERENCES subcategorias(id) ON DELETE SET NULL,
    
    INDEX idx_usuario (usuario_id),
    INDEX idx_categoria (categoria_id),
    INDEX idx_subcategoria (subcategoria_id),
    INDEX idx_fecha (fecha),
    INDEX idx_especie (especie),
    INDEX idx_ubicacion (latitud, longitud),
    INDEX idx_fecha_creacion (fecha_creacion),
    INDEX idx_comunidad (comunidad),
    INDEX idx_sitio (sitio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de media/evidencia (fotos, video, audio)
CREATE TABLE IF NOT EXISTS media_registros (
    id INT PRIMARY KEY AUTO_INCREMENT,
    registro_id INT NOT NULL,
    tipo ENUM('image', 'video', 'audio') NOT NULL,
    nombre_archivo VARCHAR(255) NULL,
    ruta_archivo VARCHAR(500) NULL,
    datos_base64 LONGTEXT NULL,
    identificador_medio VARCHAR(100) NULL,
    tipo_medio VARCHAR(50) NULL,
    descripcion TEXT NULL,
    orden INT DEFAULT 0,
    fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registro_id) REFERENCES registros_animales(id) ON DELETE CASCADE,
    INDEX idx_registro (registro_id),
    INDEX idx_tipo (tipo),
    INDEX idx_orden (orden),
    INDEX idx_identificador (identificador_medio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de comentarios en registros (permite colaboración y seguimiento)
CREATE TABLE IF NOT EXISTS comentarios_registros (
    id INT PRIMARY KEY AUTO_INCREMENT,
    registro_id INT NOT NULL,
    usuario_id INT NOT NULL,
    comentario TEXT NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (registro_id) REFERENCES registros_animales(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_registro (registro_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_fecha (fecha_creacion),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Vista de registros completos
CREATE OR REPLACE VIEW vista_registros_completos AS
SELECT 
    r.id,
    r.nombre,
    r.especie,
    r.fecha,
    r.hora,
    r.responsable,
    r.brigada,
    r.latitud,
    r.longitud,
    r.altitud,
    r.comunidad,
    r.sitio,
    r.tipo_actividad,
    r.descripcion_breve,
    r.notas,
    r.observaciones,
    r.materiales_utilizados,
    r.numero_participantes,
    r.datos_especificos,
    r.fecha_creacion,
    r.fecha_actualizacion,
    c.id AS categoria_id,
    c.codigo AS categoria_codigo,
    c.nombre AS categoria_nombre,
    sc.id AS subcategoria_id,
    sc.codigo AS subcategoria_codigo,
    sc.nombre AS subcategoria_nombre,
    u.id AS usuario_id,
    u.nombre AS usuario_nombre,
    u.email AS usuario_email,
    u.rol AS usuario_rol,
    COUNT(m.id) AS total_media
FROM registros_animales r
INNER JOIN usuarios u ON r.usuario_id = u.id
LEFT JOIN categorias c ON r.categoria_id = c.id
LEFT JOIN subcategorias sc ON r.subcategoria_id = sc.id
LEFT JOIN media_registros m ON r.id = m.registro_id
GROUP BY r.id, r.nombre, r.especie, r.fecha, r.hora, r.responsable, r.brigada, r.latitud, r.longitud, 
         r.altitud, r.comunidad, r.sitio, r.tipo_actividad, r.descripcion_breve,
         r.notas, r.observaciones, r.materiales_utilizados, r.numero_participantes,
         r.datos_especificos, r.fecha_creacion, r.fecha_actualizacion,
         c.id, c.codigo, c.nombre, sc.id, sc.codigo, sc.nombre,
         u.id, u.nombre, u.email, u.rol;

-- Vista de logs de acciones
-- Vista de comentarios con información del usuario
CREATE OR REPLACE VIEW vista_comentarios_registros AS
SELECT 
    c.id,
    c.registro_id,
    c.comentario,
    c.fecha_creacion,
    c.fecha_actualizacion,
    c.activo,
    u.id AS usuario_id,
    u.nombre AS usuario_nombre,
    u.email AS usuario_email,
    u.rol AS usuario_rol,
    r.nombre AS registro_nombre,
    r.especie AS registro_especie,
    r.fecha AS registro_fecha
FROM comentarios_registros c
INNER JOIN usuarios u ON c.usuario_id = u.id
INNER JOIN registros_animales r ON c.registro_id = r.id
WHERE c.activo = TRUE
ORDER BY c.fecha_creacion DESC;

-- Índice de búsqueda de texto completo
ALTER TABLE registros_animales 
ADD FULLTEXT INDEX idx_busqueda (nombre, especie, descripcion_breve, notas, observaciones, comunidad, sitio);

-- ============================================
-- TABLAS PARA PANEL DE ADMINISTRACIÓN
-- ============================================

-- Tabla de logs de acciones de administradores (auditoría)
CREATE TABLE IF NOT EXISTS logs_admin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    tipo_accion VARCHAR(50) NOT NULL,
    entidad_afectada VARCHAR(50) NULL,
    entidad_id INT NULL,
    descripcion TEXT NULL,
    datos_anteriores JSON NULL,
    datos_nuevos JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    fecha_accion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_admin (admin_id),
    INDEX idx_tipo_accion (tipo_accion),
    INDEX idx_fecha (fecha_accion),
    INDEX idx_entidad (entidad_afectada, entidad_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de configuraciones del sistema
CREATE TABLE IF NOT EXISTS configuraciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NULL,
    tipo ENUM('texto', 'numero', 'booleano', 'json') DEFAULT 'texto',
    descripcion TEXT NULL,
    categoria VARCHAR(50) NULL,
    editable BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_clave (clave),
    INDEX idx_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de notificaciones para usuarios
CREATE TABLE IF NOT EXISTS notificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NULL,
    tipo ENUM('info', 'success', 'warning', 'error', 'system') DEFAULT 'info',
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    enlace VARCHAR(500) NULL,
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_leida DATETIME NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_leida (leida),
    INDEX idx_fecha (fecha_creacion),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de reportes generados
CREATE TABLE IF NOT EXISTS reportes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo_reporte VARCHAR(50) NOT NULL,
    parametros JSON NULL,
    datos JSON NULL,
    formato ENUM('json', 'csv', 'pdf', 'xlsx') DEFAULT 'json',
    ruta_archivo VARCHAR(500) NULL,
    fecha_generacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_desde DATE NULL,
    fecha_hasta DATE NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_tipo (tipo_reporte),
    INDEX idx_fecha (fecha_generacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vista de logs de administración con información del admin
CREATE OR REPLACE VIEW vista_logs_admin AS
SELECT 
    l.id,
    l.admin_id,
    l.tipo_accion,
    l.entidad_afectada,
    l.entidad_id,
    l.descripcion,
    l.fecha_accion,
    l.ip_address,
    u.nombre AS admin_nombre,
    u.email AS admin_email,
    u.rol AS admin_rol
FROM logs_admin l
INNER JOIN usuarios u ON l.admin_id = u.id
ORDER BY l.fecha_accion DESC;

-- Vista de notificaciones con información del usuario
CREATE OR REPLACE VIEW vista_notificaciones AS
SELECT 
    n.id,
    n.usuario_id,
    n.tipo,
    n.titulo,
    n.mensaje,
    n.enlace,
    n.leida,
    n.fecha_creacion,
    n.fecha_leida,
    u.nombre AS usuario_nombre,
    u.email AS usuario_email
FROM notificaciones n
LEFT JOIN usuarios u ON n.usuario_id = u.id
ORDER BY n.fecha_creacion DESC;

-- ============================================
-- INSERCIÓN DE CATEGORÍAS Y SUBCATEGORÍAS
-- ============================================

-- 1. Monitoreo y Vigilancia Ambiental
INSERT INTO categorias (codigo, nombre, descripcion, orden) VALUES
('MONITOREO', 'Monitoreo y Vigilancia Ambiental', 'Actividades de monitoreo, vigilancia y seguimiento ambiental', 1);

SET @cat_monitoreo = LAST_INSERT_ID();

INSERT INTO subcategorias (categoria_id, codigo, nombre, descripcion, orden) VALUES
(@cat_monitoreo, 'MON_1.1', 'Recorridos de Campo', 'Patrullajes rutinarios, avistamientos ocasionales, identificación de flora y fauna', 1),
(@cat_monitoreo, 'MON_1.2', 'Vigilancia Comunitaria', 'Guardias comunitarias, puntos de control, retén ecológico, verificación de accesos', 2),
(@cat_monitoreo, 'MON_1.3', 'Monitoreo de Ecosistemas', 'Calidad del agua, aire, suelo, monitoreo de polinizadores y especies focales', 3),
(@cat_monitoreo, 'MON_1.4', 'Registro Básico de Biodiversidad', 'Observaciones rápidas de fauna y flora, registro de huellas o indicios', 4);

-- 2. Restauración y Manejo del Hábitat
INSERT INTO categorias (codigo, nombre, descripcion, orden) VALUES
('RESTAURACION', 'Restauración y Manejo del Hábitat', 'Actividades de restauración ecológica y manejo del hábitat', 2);

SET @cat_restauracion = LAST_INSERT_ID();

INSERT INTO subcategorias (categoria_id, codigo, nombre, descripcion, orden) VALUES
(@cat_restauracion, 'RES_2.1', 'Reforestación', 'Plantación de árboles nativos, mantenimiento y riego, reposición de plantas perdidas', 1),
(@cat_restauracion, 'RES_2.2', 'Manejo de Suelo', 'Control de erosión, construcción de terrazas, barreras vivas, restauración de cárcavas', 2),
(@cat_restauracion, 'RES_2.3', 'Brechas Corta Fuego', 'Apertura de brechas, mantenimiento, limpieza de combustibles', 3),
(@cat_restauracion, 'RES_2.4', 'Manejo de Vegetación', 'Podas, control de especies invasoras, manejo de combustibles forestales, enriquecimiento vegetal', 4);

-- 3. Gestión de Residuos y Limpieza Ambiental
INSERT INTO categorias (codigo, nombre, descripcion, orden) VALUES
('RESIDUOS', 'Gestión de Residuos y Limpieza Ambiental', 'Actividades de limpieza, gestión y manejo de residuos', 3);

SET @cat_residuos = LAST_INSERT_ID();

INSERT INTO subcategorias (categoria_id, codigo, nombre, descripcion, orden) VALUES
(@cat_residuos, 'RES_3.1', 'Limpiezas Comunitarias', 'Limpieza de ríos, arroyos, caminos, senderos, centros de población, zonas recreativas', 1),
(@cat_residuos, 'RES_3.2', 'Gestión de Residuos', 'Recolección y separación, reciclaje y acopio, residuos especiales (electrónicos, agroquímicos)', 2),
(@cat_residuos, 'RES_3.3', 'Educación en Residuos', 'Talleres, campañas, señalización sobre manejo de residuos', 3);

-- 4. Educación Ambiental y Participación Social
INSERT INTO categorias (codigo, nombre, descripcion, orden) VALUES
('EDUCACION', 'Educación Ambiental y Participación Social', 'Actividades educativas, de sensibilización y participación comunitaria', 4);

SET @cat_educacion = LAST_INSERT_ID();

INSERT INTO subcategorias (categoria_id, codigo, nombre, descripcion, orden) VALUES
(@cat_educacion, 'EDU_4.1', 'Talleres', 'Capacitación técnica, actividades escolares, charlas comunitarias', 1),
(@cat_educacion, 'EDU_4.2', 'Comunicación y Difusión', 'Boletines, infografías, reuniones informativas', 2),
(@cat_educacion, 'EDU_4.3', 'Proyectos Comunitarios', 'Diagnósticos participativos, jornadas colaborativas, mapeo ambiental', 3);

-- 5. Manejo de Recursos Naturales
INSERT INTO categorias (codigo, nombre, descripcion, orden) VALUES
('RECURSOS', 'Manejo de Recursos Naturales', 'Actividades de manejo y conservación de recursos naturales', 5);

SET @cat_recursos = LAST_INSERT_ID();

INSERT INTO subcategorias (categoria_id, codigo, nombre, descripcion, orden) VALUES
(@cat_recursos, 'REC_5.1', 'Agua', 'Limpieza de manantiales, conservación de cuencas, mantenimiento de captación pluvial', 1),
(@cat_recursos, 'REC_5.2', 'Flora', 'Inventarios vegetales, colecta de semillas, fenología: floración, fructificación', 2),
(@cat_recursos, 'REC_5.3', 'Fauna', 'Instalar refugios: aves, murciélagos, polinizadores, monitoreo de fauna silvestre, protección de nidos o madrigueras', 3),
(@cat_recursos, 'REC_5.4', 'Suelo', 'Muestreos, prácticas agroecológicas, observación de compactación o erosión', 4);

-- 6. Prevención y Atención de Riesgos
INSERT INTO categorias (codigo, nombre, descripcion, orden) VALUES
('RIESGO', 'Prevención y Atención de Riesgos', 'Prevención, atención y manejo de riesgos y emergencias', 6);

SET @cat_riesgo = LAST_INSERT_ID();

INSERT INTO subcategorias (categoria_id, codigo, nombre, descripcion, orden) VALUES
(@cat_riesgo, 'RIE_6.1', 'Incendios Forestales', 'Prevención, reporte de conatos, combate inicial (si aplica)', 1),
(@cat_riesgo, 'RIE_6.2', 'Desastres Naturales', 'Lluvias extremas, derrumbes, inundaciones, evaluación de daños', 2),
(@cat_riesgo, 'RIE_6.3', 'Seguridad Comunitaria', 'Planes de emergencia, simulacros, coordinación con autoridades', 3);

-- 7. Ordenamiento Territorial y Uso del Suelo
INSERT INTO categorias (codigo, nombre, descripcion, orden) VALUES
('ORDENAMIENTO', 'Ordenamiento Territorial y Uso del Suelo', 'Actividades de ordenamiento territorial, señalización e infraestructura verde', 7);

SET @cat_ordenamiento = LAST_INSERT_ID();

INSERT INTO subcategorias (categoria_id, codigo, nombre, descripcion, orden) VALUES
(@cat_ordenamiento, 'ORD_7.1', 'Delimitación y Señalización', 'Colocación o mantenimiento de señalética, delimitación de zonas sensibles', 1),
(@cat_ordenamiento, 'ORD_7.2', 'Infraestructura Verde', 'Senderos, miradores, áreas de descanso', 2),
(@cat_ordenamiento, 'ORD_7.3', 'Actividades Productivas Reguladas', 'Agricultura sostenible, ganadería regenerativa, aprovechamiento forestal', 3);

-- 8. Registro de Incidentes y Denuncias
INSERT INTO categorias (codigo, nombre, descripcion, orden) VALUES
('INCIDENTES', 'Registro de Incidentes y Denuncias', 'Registro y seguimiento de incidentes, daños ambientales y denuncias ciudadanas', 8);

SET @cat_incidentes = LAST_INSERT_ID();

INSERT INTO subcategorias (categoria_id, codigo, nombre, descripcion, orden) VALUES
(@cat_incidentes, 'INC_8.1', 'Daños Ambientales', 'Tala ilegal, caza furtiva, contaminación', 1),
(@cat_incidentes, 'INC_8.2', 'Accidentes', 'Caídas, animales peligrosos, percances en actividades', 2),
(@cat_incidentes, 'INC_8.3', 'Denuncias Ciudadanas', 'Reporte de vecinos, quejas ambientales, seguimiento', 3);

-- 9. Gestión Administrativa y Organizativa
INSERT INTO categorias (codigo, nombre, descripcion, orden) VALUES
('ADMINISTRACION', 'Gestión Administrativa y Organizativa', 'Actividades administrativas, logística, evaluación y capacitación interna', 9);

SET @cat_admin = LAST_INSERT_ID();

INSERT INTO subcategorias (categoria_id, codigo, nombre, descripcion, orden) VALUES
(@cat_admin, 'ADM_9.1', 'Logística', 'Control de asistencia, asignación de tareas, transporte y herramientas', 1),
(@cat_admin, 'ADM_9.2', 'Evaluación', 'Reportes quincenales, reportes mensuales, indicadores de avance', 2),
(@cat_admin, 'ADM_9.3', 'Capacitación Interna', 'Brigadistas, nuevos voluntarios, actualización de protocolos', 3);

-- 10. Avistamientos y Seguimiento de Biodiversidad
INSERT INTO categorias (codigo, nombre, descripcion, orden) VALUES
('BIODIVERSIDAD', 'Avistamientos y Seguimiento de Biodiversidad', 'Registro detallado y monitoreo sistemático de biodiversidad, avistamientos de fauna y flora', 10);

SET @cat_biodiversidad = LAST_INSERT_ID();

INSERT INTO subcategorias (categoria_id, codigo, nombre, descripcion, orden) VALUES
(@cat_biodiversidad, 'BIO_10.1', 'Avistamientos de Fauna', 'Mamíferos (directo, huellas, excretas, cámaras trampa), Aves (visual, auditivo, conteos), Reptiles, Anfibios, Insectos y polinizadores, Otros artrópodos', 1),
(@cat_biodiversidad, 'BIO_10.2', 'Avistamientos de Flora', 'Árboles, Arbustos, Hierbas, Especies invasoras, Especies endémicas, Plantas medicinales o de valor cultural', 2),
(@cat_biodiversidad, 'BIO_10.3', 'Monitoreos Sistemáticos', 'Transectos, Conteos por punto, Cámaras trampa, Monitoreo estacional, Monitoreo de especies focales', 3),
(@cat_biodiversidad, 'BIO_10.4', 'Seguimiento de Especies Invasoras', 'Plantas invasoras, Animales invasores, Plagas', 4),
(@cat_biodiversidad, 'BIO_10.5', 'Manejo y Atención de Fauna Silvestre', 'Rescates, Reubicaciones, Conflictos humano–fauna', 5),
(@cat_biodiversidad, 'BIO_10.6', 'Registros Especiales', 'Especies en riesgo, Registros nuevos, Variaciones poblacionales abruptas', 6);
