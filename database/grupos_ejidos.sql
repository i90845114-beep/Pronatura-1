-- ============================================
-- TABLAS PARA GRUPOS DE EJIDOS
-- ============================================

-- Tabla de grupos (ejidos)
CREATE TABLE IF NOT EXISTS grupos_ejidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT NULL,
    codigo_acceso VARCHAR(50) NOT NULL UNIQUE,
    lider_id INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lider_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_codigo_acceso (codigo_acceso),
    INDEX idx_lider (lider_id),
    INDEX idx_activo (activo),
    INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de miembros de grupos (usuarios pertenecen a grupos)
CREATE TABLE IF NOT EXISTS miembros_grupos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    grupo_id INT NOT NULL,
    usuario_id INT NOT NULL,
    rol ENUM('lider', 'coordinador', 'miembro') NOT NULL DEFAULT 'miembro',
    fecha_union DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (grupo_id) REFERENCES grupos_ejidos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_grupo_usuario (grupo_id, usuario_id),
    INDEX idx_grupo (grupo_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_rol (rol),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vista de grupos con información del líder y número de miembros
CREATE OR REPLACE VIEW vista_grupos_completos AS
SELECT 
    g.id,
    g.nombre,
    g.descripcion,
    g.codigo_acceso,
    g.lider_id,
    g.activo,
    g.fecha_creacion,
    g.fecha_actualizacion,
    u.nombre AS lider_nombre,
    u.email AS lider_email,
    COUNT(DISTINCT m.id) AS total_miembros
FROM grupos_ejidos g
INNER JOIN usuarios u ON g.lider_id = u.id
LEFT JOIN miembros_grupos m ON g.id = m.grupo_id AND m.activo = TRUE
GROUP BY g.id, g.nombre, g.descripcion, g.codigo_acceso, g.lider_id, g.activo, g.fecha_creacion, g.fecha_actualizacion, u.nombre, u.email;

-- Vista de miembros con información del usuario
CREATE OR REPLACE VIEW vista_miembros_grupos AS
SELECT 
    m.id,
    m.grupo_id,
    m.usuario_id,
    m.rol,
    m.fecha_union,
    m.activo,
    u.nombre AS usuario_nombre,
    u.email AS usuario_email,
    u.fecha_registro AS usuario_fecha_registro,
    g.nombre AS grupo_nombre
FROM miembros_grupos m
INNER JOIN usuarios u ON m.usuario_id = u.id
INNER JOIN grupos_ejidos g ON m.grupo_id = g.id
ORDER BY m.fecha_union DESC;

-- Tabla de mensajes de chat por grupo
CREATE TABLE IF NOT EXISTS mensajes_chat (
    id INT PRIMARY KEY AUTO_INCREMENT,
    grupo_id INT NOT NULL,
    usuario_id INT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (grupo_id) REFERENCES grupos_ejidos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_grupo (grupo_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_fecha (fecha_creacion),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vista de mensajes con información del usuario
CREATE OR REPLACE VIEW vista_mensajes_chat AS
SELECT 
    m.id,
    m.grupo_id,
    m.usuario_id,
    m.mensaje,
    m.fecha_creacion,
    m.activo,
    u.nombre AS usuario_nombre,
    u.email AS usuario_email,
    g.nombre AS grupo_nombre
FROM mensajes_chat m
INNER JOIN usuarios u ON m.usuario_id = u.id
INNER JOIN grupos_ejidos g ON m.grupo_id = g.id
WHERE m.activo = TRUE
ORDER BY m.fecha_creacion ASC;
