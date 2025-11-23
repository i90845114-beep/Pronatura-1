-- Tabla de advertencias a usuarios
CREATE TABLE IF NOT EXISTS advertencias_usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    admin_id INT NOT NULL,
    motivo TEXT NOT NULL,
    fecha_advertencia DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN DEFAULT TRUE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_admin (admin_id),
    INDEX idx_activa (activa),
    INDEX idx_fecha (fecha_advertencia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de bans a usuarios
CREATE TABLE IF NOT EXISTS bans_usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    admin_id INT NOT NULL,
    tipo ENUM('temporal', 'permanente') NOT NULL DEFAULT 'temporal',
    motivo TEXT NOT NULL,
    fecha_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin DATETIME NULL,
    activo BOOLEAN DEFAULT TRUE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_admin (admin_id),
    INDEX idx_tipo (tipo),
    INDEX idx_activo (activo),
    INDEX idx_fecha_fin (fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

