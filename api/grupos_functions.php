<?php
// Funciones para gestión de grupos de ejidos

// Función para asegurar que las tablas de grupos existan
function ensureGruposTables($conn) {
    try {
        // Verificar si existe la tabla grupos_ejidos
        $checkTable = $conn->query("SHOW TABLES LIKE 'grupos_ejidos'");
        if ($checkTable->rowCount() === 0) {
            // Crear tabla grupos_ejidos
            $createGruposTable = "
            CREATE TABLE IF NOT EXISTS grupos_ejidos (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(255) NOT NULL,
                descripcion TEXT NULL,
                codigo_acceso VARCHAR(50) NULL UNIQUE,
                lider_id INT NULL,
                estado VARCHAR(100) NULL,
                municipio VARCHAR(100) NULL,
                ciudad VARCHAR(100) NULL,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (lider_id) REFERENCES usuarios(id) ON DELETE SET NULL,
                INDEX idx_codigo_acceso (codigo_acceso),
                INDEX idx_lider (lider_id),
                INDEX idx_activo (activo),
                INDEX idx_nombre (nombre),
                INDEX idx_estado (estado),
                INDEX idx_municipio (municipio),
                INDEX idx_ciudad (ciudad)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ";
            $conn->exec($createGruposTable);
        } else {
            // Verificar y agregar columnas de ubicación si no existen
            try {
                $checkEstado = $conn->query("SHOW COLUMNS FROM grupos_ejidos LIKE 'estado'");
                if ($checkEstado->rowCount() === 0) {
                    $conn->exec("ALTER TABLE grupos_ejidos ADD COLUMN estado VARCHAR(100) NULL AFTER lider_id");
                    $conn->exec("ALTER TABLE grupos_ejidos ADD INDEX idx_estado (estado)");
                }
                
                $checkMunicipio = $conn->query("SHOW COLUMNS FROM grupos_ejidos LIKE 'municipio'");
                if ($checkMunicipio->rowCount() === 0) {
                    $conn->exec("ALTER TABLE grupos_ejidos ADD COLUMN municipio VARCHAR(100) NULL AFTER estado");
                    $conn->exec("ALTER TABLE grupos_ejidos ADD INDEX idx_municipio (municipio)");
                }
                
                $checkCiudad = $conn->query("SHOW COLUMNS FROM grupos_ejidos LIKE 'ciudad'");
                if ($checkCiudad->rowCount() === 0) {
                    $conn->exec("ALTER TABLE grupos_ejidos ADD COLUMN ciudad VARCHAR(100) NULL AFTER municipio");
                    $conn->exec("ALTER TABLE grupos_ejidos ADD INDEX idx_ciudad (ciudad)");
                }
                
                // Hacer codigo_acceso y lider_id opcionales si no lo son
                $checkCodigo = $conn->query("SHOW COLUMNS FROM grupos_ejidos WHERE Field = 'codigo_acceso' AND Null = 'NO'");
                if ($checkCodigo->rowCount() > 0) {
                    $conn->exec("ALTER TABLE grupos_ejidos MODIFY COLUMN codigo_acceso VARCHAR(50) NULL");
                }
                
                $checkLider = $conn->query("SHOW COLUMNS FROM grupos_ejidos WHERE Field = 'lider_id' AND Null = 'NO'");
                if ($checkLider->rowCount() > 0) {
                    // Primero eliminar la foreign key si existe
                    try {
                        $conn->exec("ALTER TABLE grupos_ejidos DROP FOREIGN KEY grupos_ejidos_ibfk_1");
                    } catch (Exception $e) {
                        // Ignorar si no existe
                    }
                    $conn->exec("ALTER TABLE grupos_ejidos MODIFY COLUMN lider_id INT NULL");
                    // Recrear foreign key
                    try {
                        $conn->exec("ALTER TABLE grupos_ejidos ADD CONSTRAINT grupos_ejidos_ibfk_1 FOREIGN KEY (lider_id) REFERENCES usuarios(id) ON DELETE SET NULL");
                    } catch (Exception $e) {
                        // Ignorar si ya existe
                    }
                }
            } catch (Exception $e) {
                error_log("Error al agregar columnas de ubicación: " . $e->getMessage());
            }
        }
        
        // Verificar si existe la tabla miembros_grupos
        $checkTable = $conn->query("SHOW TABLES LIKE 'miembros_grupos'");
        if ($checkTable->rowCount() === 0) {
            // Crear tabla miembros_grupos
            $createMiembrosTable = "
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
            ";
            $conn->exec($createMiembrosTable);
        }
    } catch (PDOException $e) {
        error_log("Error al crear tablas de grupos: " . $e->getMessage());
    }
}

// Crear un nuevo grupo
function handleCreateGrupo($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    ensureGruposTables($conn);
    
    $nombre = trim($input['nombre'] ?? '');
    $descripcion = trim($input['descripcion'] ?? '');
    $liderId = intval($input['lider_id'] ?? 0);
    $estado = trim($input['estado'] ?? '');
    $municipio = trim($input['municipio'] ?? '');
    $ciudad = trim($input['ciudad'] ?? '');
    
    if (empty($nombre)) {
        echo json_encode(['success' => false, 'message' => 'El nombre del grupo es requerido']);
        return;
    }
    
    if ($liderId <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID de líder inválido']);
        return;
    }
    
    // Verificar que el líder existe
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE id = ?");
    $stmt->execute([$liderId]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'El líder especificado no existe']);
        return;
    }
    
    try {
        // Generar código de acceso único
        $codigoAcceso = strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));
        
        // Verificar que el código sea único
        $stmt = $conn->prepare("SELECT id FROM grupos_ejidos WHERE codigo_acceso = ?");
        $stmt->execute([$codigoAcceso]);
        while ($stmt->fetch()) {
            $codigoAcceso = strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));
            $stmt->execute([$codigoAcceso]);
        }
        
        // Crear el grupo con ubicación si se proporciona
        if ($estado || $municipio || $ciudad) {
            $stmt = $conn->prepare("INSERT INTO grupos_ejidos (nombre, descripcion, codigo_acceso, lider_id, estado, municipio, ciudad) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$nombre, $descripcion, $codigoAcceso, $liderId, $estado ?: null, $municipio ?: null, $ciudad ?: null]);
        } else {
            $stmt = $conn->prepare("INSERT INTO grupos_ejidos (nombre, descripcion, codigo_acceso, lider_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([$nombre, $descripcion, $codigoAcceso, $liderId]);
        }
        
        $grupoId = $conn->lastInsertId();
        
        // Agregar al líder como miembro con rol 'lider'
        $stmt = $conn->prepare("INSERT INTO miembros_grupos (grupo_id, usuario_id, rol) VALUES (?, ?, 'lider')");
        $stmt->execute([$grupoId, $liderId]);
        
        // Obtener el grupo creado
        $stmt = $conn->prepare("
            SELECT g.*, u.nombre AS lider_nombre, u.email AS lider_email 
            FROM grupos_ejidos g
            INNER JOIN usuarios u ON g.lider_id = u.id
            WHERE g.id = ?
        ");
        $stmt->execute([$grupoId]);
        $grupo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Grupo creado exitosamente',
            'grupo' => $grupo
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Unirse a un grupo usando código de acceso
function handleUnirseGrupo($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    ensureGruposTables($conn);
    
    $codigoAcceso = strtoupper(trim($input['codigo_acceso'] ?? ''));
    $usuarioId = intval($input['usuario_id'] ?? 0);
    
    if (empty($codigoAcceso)) {
        echo json_encode(['success' => false, 'message' => 'El código de acceso es requerido']);
        return;
    }
    
    if ($usuarioId <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID de usuario inválido']);
        return;
    }
    
    try {
        // Buscar el grupo por código de acceso
        $stmt = $conn->prepare("SELECT id, activo FROM grupos_ejidos WHERE codigo_acceso = ?");
        $stmt->execute([$codigoAcceso]);
        $grupo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$grupo) {
            echo json_encode(['success' => false, 'message' => 'Código de acceso inválido']);
            return;
        }
        
        if (!$grupo['activo']) {
            echo json_encode(['success' => false, 'message' => 'Este grupo está inactivo']);
            return;
        }
        
        // Verificar si el usuario ya es miembro
        $stmt = $conn->prepare("SELECT id, activo FROM miembros_grupos WHERE grupo_id = ? AND usuario_id = ?");
        $stmt->execute([$grupo['id'], $usuarioId]);
        $miembro = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($miembro) {
            if ($miembro['activo']) {
                echo json_encode(['success' => false, 'message' => 'Ya eres miembro de este grupo']);
                return;
            } else {
                // Reactivar membresía
                $stmt = $conn->prepare("UPDATE miembros_grupos SET activo = TRUE WHERE id = ?");
                $stmt->execute([$miembro['id']]);
            }
        } else {
            // Agregar como nuevo miembro
            $stmt = $conn->prepare("INSERT INTO miembros_grupos (grupo_id, usuario_id, rol) VALUES (?, ?, 'miembro')");
            $stmt->execute([$grupo['id'], $usuarioId]);
        }
        
        // Obtener información del grupo
        $stmt = $conn->prepare("
            SELECT g.*, u.nombre AS lider_nombre 
            FROM grupos_ejidos g
            INNER JOIN usuarios u ON g.lider_id = u.id
            WHERE g.id = ?
        ");
        $stmt->execute([$grupo['id']]);
        $grupoInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Te has unido al grupo exitosamente',
            'grupo' => $grupoInfo
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Obtener todos los grupos
function handleGetGrupos($conn, $params) {
    ensureGruposTables($conn);
    
    try {
        $usuarioId = isset($params['usuario_id']) ? intval($params['usuario_id']) : null;
        
        // Al listar todos los grupos (vista admin), quitar solo el grupo genérico "Ejidos México" (no borrar "Ejidos Tamaulipas" ni otros por código)
        if ($usuarioId === null) {
            try {
                $del = $conn->prepare("DELETE FROM grupos_ejidos WHERE nombre = ?");
                $del->execute(['Ejidos México']);
            } catch (Exception $e) {
                // ignorar si falla
            }
        }
        
        if ($usuarioId) {
            error_log("DEBUG GET_GRUPOS: Buscando grupos para usuario_id={$usuarioId}");
            
            // Primero, verificar si el usuario tiene registros en miembros_grupos
            $stmtDebug = $conn->prepare("SELECT * FROM miembros_grupos WHERE usuario_id = ?");
            $stmtDebug->execute([$usuarioId]);
            $miembrosDebug = $stmtDebug->fetchAll(PDO::FETCH_ASSOC);
            error_log("DEBUG GET_GRUPOS: Registros en miembros_grupos para usuario {$usuarioId}: " . json_encode($miembrosDebug));
            
            // Obtener grupos del usuario
            $stmt = $conn->prepare("
                SELECT DISTINCT g.*, u.nombre AS lider_nombre, u.email AS lider_email,
                       COUNT(DISTINCT m.id) AS total_miembros,
                       mi.rol AS mi_rol
                FROM grupos_ejidos g
                INNER JOIN usuarios u ON g.lider_id = u.id
                LEFT JOIN miembros_grupos m ON g.id = m.grupo_id AND m.activo = TRUE
                LEFT JOIN miembros_grupos mi ON g.id = mi.grupo_id AND mi.usuario_id = ? AND mi.activo = TRUE
                WHERE g.activo = TRUE AND (g.lider_id = ? OR mi.usuario_id IS NOT NULL)
                GROUP BY g.id, g.nombre, g.descripcion, g.codigo_acceso, g.lider_id, g.activo, g.fecha_creacion, g.fecha_actualizacion, g.estado, g.municipio, g.ciudad, u.nombre, u.email, mi.rol
                ORDER BY g.fecha_creacion DESC
            ");
            $stmt->execute([$usuarioId, $usuarioId]);
        } else {
            // Obtener todos los grupos activos (incluye grupos sin líder, p. ej. creados por ubicación en el chat)
            $stmt = $conn->prepare("
                SELECT g.*,
                       COALESCE(u.nombre, 'Sin líder') AS lider_nombre,
                       COALESCE(u.email, '') AS lider_email,
                       COUNT(DISTINCT m.id) AS total_miembros
                FROM grupos_ejidos g
                LEFT JOIN usuarios u ON g.lider_id = u.id
                LEFT JOIN miembros_grupos m ON g.id = m.grupo_id AND m.activo = TRUE
                WHERE g.activo = TRUE
                GROUP BY g.id, g.nombre, g.descripcion, g.codigo_acceso, g.lider_id, g.activo, g.fecha_creacion, g.fecha_actualizacion, g.estado, g.municipio, g.ciudad, u.nombre, u.email
                ORDER BY g.fecha_creacion DESC
            ");
            $stmt->execute();
        }
        
        $grupos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $userIdLog = $usuarioId ? $usuarioId : 'TODOS';
        error_log("DEBUG GET_GRUPOS: Encontrados " . count($grupos) . " grupos para usuario_id={$userIdLog}");
        if (count($grupos) > 0) {
            error_log("DEBUG GET_GRUPOS: Primer grupo: " . json_encode($grupos[0]));
        }
        
        echo json_encode([
            'success' => true,
            'grupos' => $grupos
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Obtener miembros de un grupo
function handleGetMiembrosGrupo($conn, $params) {
    ensureGruposTables($conn);
    
    $grupoId = isset($params['grupo_id']) ? intval($params['grupo_id']) : 0;
    
    if ($grupoId <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID de grupo inválido']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("
            SELECT m.*, u.nombre AS usuario_nombre, u.email AS usuario_email, u.fecha_registro
            FROM miembros_grupos m
            INNER JOIN usuarios u ON m.usuario_id = u.id
            WHERE m.grupo_id = ? AND m.activo = TRUE
            ORDER BY 
                CASE m.rol 
                    WHEN 'lider' THEN 1 
                    WHEN 'coordinador' THEN 2 
                    ELSE 3 
                END,
                m.fecha_union ASC
        ");
        $stmt->execute([$grupoId]);
        $miembros = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'miembros' => $miembros
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Salir de un grupo
function handleSalirGrupo($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    ensureGruposTables($conn);
    
    $grupoId = intval($input['grupo_id'] ?? 0);
    $usuarioId = intval($input['usuario_id'] ?? 0);
    
    if ($grupoId <= 0 || $usuarioId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
        return;
    }
    
    try {
        // Verificar si es el líder
        $stmt = $conn->prepare("SELECT lider_id FROM grupos_ejidos WHERE id = ?");
        $stmt->execute([$grupoId]);
        $grupo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($grupo && $grupo['lider_id'] == $usuarioId) {
            echo json_encode(['success' => false, 'message' => 'El líder no puede salir del grupo. Debe transferir el liderazgo primero.']);
            return;
        }
        
        // Desactivar membresía
        $stmt = $conn->prepare("UPDATE miembros_grupos SET activo = FALSE WHERE grupo_id = ? AND usuario_id = ?");
        $stmt->execute([$grupoId, $usuarioId]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Has salido del grupo exitosamente'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'No eres miembro de este grupo']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Actualizar grupo (solo líder)
function handleUpdateGrupo($conn, $input, $method) {
    if ($method !== 'PUT' && $method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    ensureGruposTables($conn);
    
    $grupoId = intval($input['grupo_id'] ?? 0);
    $liderId = intval($input['lider_id'] ?? 0);
    $nombre = trim($input['nombre'] ?? '');
    $descripcion = trim($input['descripcion'] ?? '');
    
    if ($grupoId <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID de grupo inválido']);
        return;
    }
    
    // Verificar que el usuario es el líder
    $stmt = $conn->prepare("SELECT lider_id FROM grupos_ejidos WHERE id = ?");
    $stmt->execute([$grupoId]);
    $grupo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$grupo || $grupo['lider_id'] != $liderId) {
        echo json_encode(['success' => false, 'message' => 'Solo el líder puede actualizar el grupo']);
        return;
    }
    
    try {
        $updates = [];
        $params = [];
        
        if (!empty($nombre)) {
            $updates[] = "nombre = ?";
            $params[] = $nombre;
        }
        
        if (isset($input['descripcion'])) {
            $updates[] = "descripcion = ?";
            $params[] = $descripcion;
        }
        
        if (empty($updates)) {
            echo json_encode(['success' => false, 'message' => 'No hay cambios para actualizar']);
            return;
        }
        
        $params[] = $grupoId;
        $sql = "UPDATE grupos_ejidos SET " . implode(", ", $updates) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        
        // Obtener grupo actualizado
        $stmt = $conn->prepare("
            SELECT g.*, u.nombre AS lider_nombre, u.email AS lider_email 
            FROM grupos_ejidos g
            INNER JOIN usuarios u ON g.lider_id = u.id
            WHERE g.id = ?
        ");
        $stmt->execute([$grupoId]);
        $grupoActualizado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Grupo actualizado exitosamente',
            'grupo' => $grupoActualizado
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Eliminar grupo (solo líder o admin)
function handleDeleteGrupo($conn, $input, $method) {
    if ($method !== 'DELETE' && $method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    ensureGruposTables($conn);
    
    $grupoId = intval($input['grupo_id'] ?? 0);
    $liderId = intval($input['lider_id'] ?? 0);
    $adminId = intval($input['admin_id'] ?? 0);
    
    if ($grupoId <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID de grupo inválido']);
        return;
    }
    
    // Si es admin, no necesita lider_id
    if ($adminId <= 0 && $liderId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
        return;
    }
    
    try {
        // Verificar que el grupo existe
        $stmt = $conn->prepare("SELECT lider_id FROM grupos_ejidos WHERE id = ?");
        $stmt->execute([$grupoId]);
        $grupo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$grupo) {
            echo json_encode(['success' => false, 'message' => 'Grupo no encontrado']);
            return;
        }
        
        // Si no es admin, verificar que es el líder
        if ($adminId <= 0 && $grupo['lider_id'] != $liderId) {
            echo json_encode(['success' => false, 'message' => 'Solo el líder puede eliminar el grupo']);
            return;
        }
        
        // Desactivar el grupo (soft delete)
        $stmt = $conn->prepare("UPDATE grupos_ejidos SET activo = FALSE WHERE id = ?");
        $stmt->execute([$grupoId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Grupo eliminado exitosamente'
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Eliminar TODOS los grupos predeterminados / chats "Ejidos México" (solo admin) - borrado real en BD
function handleDeleteGruposPredeterminados($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    ensureGruposTables($conn);
    $adminId = intval($input['admin_id'] ?? 0);
    if ($adminId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Se requiere sesión de administrador']);
        return;
    }
    try {
        // Borrado real: todos "Ejidos México" por nombre o por código EJIDOS-%
        $stmt = $conn->prepare("DELETE FROM grupos_ejidos WHERE nombre = ? OR (codigo_acceso IS NOT NULL AND codigo_acceso LIKE ?)");
        $stmt->execute(['Ejidos México', 'EJIDOS-%']);
        $count = $stmt->rowCount();
        echo json_encode([
            'success' => true,
            'message' => $count > 0 ? "Se borraron {$count} grupo(s) predeterminado(s) de la base de datos." : 'No había grupos predeterminados.',
            'eliminados' => $count
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Eliminar TODOS los grupos del apartado Grupos (solo admin) - borrado real en BD
function handleDeleteAllGrupos($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    ensureGruposTables($conn);
    $adminId = intval($input['admin_id'] ?? 0);
    if ($adminId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Se requiere sesión de administrador']);
        return;
    }
    try {
        $stmt = $conn->query("DELETE FROM grupos_ejidos");
        $count = $stmt->rowCount();
        echo json_encode([
            'success' => true,
            'message' => $count > 0 ? "Se borraron {$count} grupo(s) de la base de datos." : 'No había grupos.',
            'eliminados' => $count
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Función para asegurar que la tabla de mensajes existe
function ensureMensajesTable($conn) {
    try {
        $checkTable = $conn->query("SHOW TABLES LIKE 'mensajes_chat'");
        if ($checkTable->rowCount() === 0) {
            $createTable = "
            CREATE TABLE IF NOT EXISTS mensajes_chat (
                id INT PRIMARY KEY AUTO_INCREMENT,
                grupo_id INT NOT NULL,
                usuario_id INT NULL,
                usuario_nombre VARCHAR(255) NULL,
                mensaje TEXT NOT NULL,
                fecha_envio DATETIME NULL,
                fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                activo BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (grupo_id) REFERENCES grupos_ejidos(id) ON DELETE CASCADE,
                INDEX idx_grupo (grupo_id),
                INDEX idx_usuario (usuario_id),
                INDEX idx_fecha (fecha_creacion),
                INDEX idx_activo (activo)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ";
            $conn->exec($createTable);
        } else {
            // Verificar y agregar columnas si no existen
            try {
                // Permitir NULL en usuario_id si no lo permite
                $checkUsuarioId = $conn->query("SHOW COLUMNS FROM mensajes_chat WHERE Field = 'usuario_id' AND Null = 'NO'");
                if ($checkUsuarioId->rowCount() > 0) {
                    // Eliminar foreign key si existe
                    try {
                        $conn->exec("ALTER TABLE mensajes_chat DROP FOREIGN KEY mensajes_chat_ibfk_2");
                    } catch (Exception $e) {
                        try {
                            $conn->exec("ALTER TABLE mensajes_chat DROP FOREIGN KEY mensajes_chat_ibfk_1");
                        } catch (Exception $e2) {
                            // Ignorar si no existe
                        }
                    }
                    $conn->exec("ALTER TABLE mensajes_chat MODIFY COLUMN usuario_id INT NULL");
                }
                
                // Agregar usuario_nombre si no existe
                $checkColumn = $conn->query("SHOW COLUMNS FROM mensajes_chat LIKE 'usuario_nombre'");
                if ($checkColumn->rowCount() === 0) {
                    $conn->exec("ALTER TABLE mensajes_chat ADD COLUMN usuario_nombre VARCHAR(255) NULL AFTER usuario_id");
                }
                
                // Agregar fecha_envio si no existe
                $checkFechaEnvio = $conn->query("SHOW COLUMNS FROM mensajes_chat LIKE 'fecha_envio'");
                if ($checkFechaEnvio->rowCount() === 0) {
                    $conn->exec("ALTER TABLE mensajes_chat ADD COLUMN fecha_envio DATETIME NULL AFTER mensaje");
                }
            } catch (Exception $e) {
                error_log("Error al modificar tabla mensajes_chat: " . $e->getMessage());
            }
        }
    } catch (PDOException $e) {
        error_log("Error al crear tabla de mensajes: " . $e->getMessage());
    }
}

// Enviar mensaje al chat
function handleEnviarMensaje($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    ensureGruposTables($conn);
    ensureMensajesTable($conn);
    
    $grupoId = intval($input['grupo_id'] ?? 0);
    $usuarioId = intval($input['usuario_id'] ?? 0);
    $mensaje = trim($input['mensaje'] ?? '');
    
    if ($grupoId <= 0 || $usuarioId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
        return;
    }
    
    if (empty($mensaje)) {
        echo json_encode(['success' => false, 'message' => 'El mensaje no puede estar vacío']);
        return;
    }
    
    // Verificar que el usuario es miembro del grupo
    $stmt = $conn->prepare("SELECT id FROM miembros_grupos WHERE grupo_id = ? AND usuario_id = ? AND activo = TRUE");
    $stmt->execute([$grupoId, $usuarioId]);
    $esMiembro = $stmt->fetch();
    
    // También verificar si es el líder
    $stmt = $conn->prepare("SELECT id FROM grupos_ejidos WHERE id = ? AND lider_id = ?");
    $stmt->execute([$grupoId, $usuarioId]);
    $esLider = $stmt->fetch();
    
    if (!$esMiembro && !$esLider) {
        echo json_encode(['success' => false, 'message' => 'No eres miembro de este grupo']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("INSERT INTO mensajes_chat (grupo_id, usuario_id, mensaje) VALUES (?, ?, ?)");
        $stmt->execute([$grupoId, $usuarioId, $mensaje]);
        
        $mensajeId = $conn->lastInsertId();
        
        // Obtener el mensaje completo con información del usuario
        $stmt = $conn->prepare("
            SELECT m.*, u.nombre AS usuario_nombre, u.email AS usuario_email
            FROM mensajes_chat m
            INNER JOIN usuarios u ON m.usuario_id = u.id
            WHERE m.id = ?
        ");
        $stmt->execute([$mensajeId]);
        $mensajeCompleto = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Mensaje enviado exitosamente',
            'mensaje' => $mensajeCompleto
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Obtener mensajes de un grupo
function handleGetMensajes($conn, $params) {
    ensureGruposTables($conn);
    ensureMensajesTable($conn);
    
    $grupoId = isset($params['grupo_id']) ? intval($params['grupo_id']) : 0;
    $usuarioId = isset($params['usuario_id']) ? intval($params['usuario_id']) : 0;
    
    if ($grupoId <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID de grupo inválido']);
        return;
    }
    
    if ($usuarioId > 0) {
        // Verificar que el usuario es miembro del grupo
        $stmt = $conn->prepare("SELECT id FROM miembros_grupos WHERE grupo_id = ? AND usuario_id = ? AND activo = TRUE");
        $stmt->execute([$grupoId, $usuarioId]);
        $esMiembro = $stmt->fetch();
        
        $stmt = $conn->prepare("SELECT id FROM grupos_ejidos WHERE id = ? AND lider_id = ?");
        $stmt->execute([$grupoId, $usuarioId]);
        $esLider = $stmt->fetch();
        
        if (!$esMiembro && !$esLider) {
            echo json_encode(['success' => false, 'message' => 'No eres miembro de este grupo']);
            return;
        }
    }
    
    try {
        // Verificar si la columna usuario_nombre existe
        $checkColumn = $conn->query("SHOW COLUMNS FROM mensajes_chat LIKE 'usuario_nombre'");
        $hasUsuarioNombre = $checkColumn->rowCount() > 0;
        
        if ($hasUsuarioNombre) {
            // Si existe usuario_nombre, incluir mensajes anónimos también
            $stmt = $conn->prepare("
                SELECT m.*, 
                       COALESCE(m.usuario_nombre, u.nombre, 'Usuario') AS usuario_nombre,
                       u.email AS usuario_email
                FROM mensajes_chat m
                LEFT JOIN usuarios u ON m.usuario_id = u.id
                WHERE m.grupo_id = ? AND m.activo = TRUE
                ORDER BY m.fecha_creacion ASC
            ");
        } else {
            // Si no existe, solo usuarios autenticados
            $stmt = $conn->prepare("
                SELECT m.*, u.nombre AS usuario_nombre, u.email AS usuario_email
                FROM mensajes_chat m
                INNER JOIN usuarios u ON m.usuario_id = u.id
                WHERE m.grupo_id = ? AND m.activo = TRUE
                ORDER BY m.fecha_creacion ASC
            ");
        }
        
        $stmt->execute([$grupoId]);
        $mensajes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'mensajes' => $mensajes
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Obtener o crear grupo por ubicación (para chat anónimo)
function handleGetOrCreateGrupoByLocation($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    ensureGruposTables($conn);
    
    $estado = trim($input['estado'] ?? '');
    $municipio = trim($input['municipio'] ?? '');
    $ciudad = trim($input['ciudad'] ?? '');
    $nombreUsuario = trim($input['nombre_usuario'] ?? 'Usuario');
    
    if (empty($estado) || empty($municipio)) {
        echo json_encode(['success' => false, 'message' => 'Estado y municipio son requeridos']);
        return;
    }
    
    try {
        // Buscar grupo existente por ubicación
        $sql = "SELECT * FROM grupos_ejidos WHERE estado = ? AND municipio = ?";
        $params = [$estado, $municipio];
        
        if (!empty($ciudad)) {
            $sql .= " AND ciudad = ?";
            $params[] = $ciudad;
        } else {
            $sql .= " AND (ciudad IS NULL OR ciudad = '')";
        }
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $grupo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($grupo) {
            // Grupo existe, retornarlo
            echo json_encode([
                'success' => true,
                'grupo' => $grupo,
                'message' => 'Grupo encontrado'
            ]);
            return;
        }
        
        // Crear nuevo grupo
        $nombreGrupo = !empty($ciudad) 
            ? "Chat de Ejidos - {$municipio}, {$ciudad}, {$estado}"
            : "Chat de Ejidos - {$municipio}, {$estado}";
        
        $stmt = $conn->prepare("
            INSERT INTO grupos_ejidos (nombre, estado, municipio, ciudad, descripcion, lider_id, fecha_creacion)
            VALUES (?, ?, ?, ?, ?, NULL, NOW())
        ");
        
        $descripcion = "Grupo de chat para ejidos en {$municipio}" . (!empty($ciudad) ? ", {$ciudad}" : "") . ", {$estado}";
        $stmt->execute([
            $nombreGrupo,
            $estado,
            $municipio,
            !empty($ciudad) ? $ciudad : null,
            $descripcion
        ]);
        
        $grupoId = $conn->lastInsertId();
        
        // Obtener el grupo creado
        $stmt = $conn->prepare("SELECT * FROM grupos_ejidos WHERE id = ?");
        $stmt->execute([$grupoId]);
        $grupo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'grupo' => $grupo,
            'message' => 'Grupo creado exitosamente'
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Enviar mensaje anónimo (sin usuario_id)
function handleEnviarMensajeAnonimo($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    ensureGruposTables($conn);
    ensureMensajesTable($conn);
    
    $grupoId = intval($input['grupo_id'] ?? 0);
    $nombreUsuario = trim($input['nombre_usuario'] ?? 'Usuario');
    $mensaje = trim($input['mensaje'] ?? '');
    
    if ($grupoId <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID de grupo inválido']);
        return;
    }
    
    if (empty($mensaje)) {
        echo json_encode(['success' => false, 'message' => 'El mensaje no puede estar vacío']);
        return;
    }
    
    if (empty($nombreUsuario)) {
        $nombreUsuario = 'Usuario';
    }
    
    // Verificar que el grupo existe
    $stmt = $conn->prepare("SELECT id FROM grupos_ejidos WHERE id = ?");
    $stmt->execute([$grupoId]);
    $grupo = $stmt->fetch();
    
    if (!$grupo) {
        echo json_encode(['success' => false, 'message' => 'Grupo no encontrado']);
        return;
    }
    
    try {
        error_log("=== INICIO enviarMensajeAnonimo ===");
        error_log("GrupoID: $grupoId");
        error_log("NombreUsuario: $nombreUsuario");
        error_log("Mensaje: $mensaje");
        
        // Verificar si la tabla mensajes_chat tiene columna usuario_nombre
        $checkColumn = $conn->query("SHOW COLUMNS FROM mensajes_chat LIKE 'usuario_nombre'");
        if ($checkColumn->rowCount() === 0) {
            // Agregar columna usuario_nombre para mensajes anónimos
            $conn->exec("ALTER TABLE mensajes_chat ADD COLUMN usuario_nombre VARCHAR(255) NULL AFTER usuario_id");
            error_log("Columna usuario_nombre agregada");
        }
        
        error_log("Preparando INSERT...");
        // Insertar mensaje con nombre_usuario en lugar de usuario_id
        $stmt = $conn->prepare("
            INSERT INTO mensajes_chat (grupo_id, usuario_id, usuario_nombre, mensaje, fecha_creacion, activo)
            VALUES (?, NULL, ?, ?, NOW(), TRUE)
        ");
        error_log("Ejecutando INSERT con parámetros...");
        $stmt->execute([$grupoId, $nombreUsuario, $mensaje]);
        error_log("INSERT exitoso");
        
        $mensajeId = $conn->lastInsertId();
        
        // Obtener el mensaje completo
        $stmt = $conn->prepare("
            SELECT m.*, 
                   COALESCE(m.usuario_nombre, u.nombre, 'Usuario') AS usuario_nombre
            FROM mensajes_chat m
            LEFT JOIN usuarios u ON m.usuario_id = u.id
            WHERE m.id = ?
        ");
        $stmt->execute([$mensajeId]);
        $mensajeCompleto = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Mensaje enviado exitosamente',
            'mensaje' => $mensajeCompleto
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Función para asegurar que la tabla de solicitudes de acceso exista
function ensureSolicitudesTable($conn) {
    try {
        $checkTable = $conn->query("SHOW TABLES LIKE 'solicitudes_acceso_grupos'");
        if ($checkTable->rowCount() === 0) {
            $createTable = "
            CREATE TABLE IF NOT EXISTS solicitudes_acceso_grupos (
                id INT PRIMARY KEY AUTO_INCREMENT,
                usuario_id INT NOT NULL,
                grupo_id INT NULL,
                estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
                mensaje TEXT NULL,
                estado_usuario VARCHAR(100) NULL,
                municipio_usuario VARCHAR(100) NULL,
                ciudad_usuario VARCHAR(100) NULL,
                fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                fecha_resolucion DATETIME NULL,
                admin_id INT NULL,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY (grupo_id) REFERENCES grupos_ejidos(id) ON DELETE SET NULL,
                FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE SET NULL,
                INDEX idx_usuario (usuario_id),
                INDEX idx_grupo (grupo_id),
                INDEX idx_estado (estado),
                INDEX idx_fecha_solicitud (fecha_solicitud)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ";
            $conn->exec($createTable);
        } else {
            // Agregar columnas de ubicación si no existen
            try {
                $checkEstado = $conn->query("SHOW COLUMNS FROM solicitudes_acceso_grupos LIKE 'estado_usuario'");
                if ($checkEstado->rowCount() === 0) {
                    $conn->exec("ALTER TABLE solicitudes_acceso_grupos ADD COLUMN estado_usuario VARCHAR(100) NULL AFTER mensaje");
                }
                
                $checkMunicipio = $conn->query("SHOW COLUMNS FROM solicitudes_acceso_grupos LIKE 'municipio_usuario'");
                if ($checkMunicipio->rowCount() === 0) {
                    $conn->exec("ALTER TABLE solicitudes_acceso_grupos ADD COLUMN municipio_usuario VARCHAR(100) NULL AFTER estado_usuario");
                }
                
                $checkCiudad = $conn->query("SHOW COLUMNS FROM solicitudes_acceso_grupos LIKE 'ciudad_usuario'");
                if ($checkCiudad->rowCount() === 0) {
                    $conn->exec("ALTER TABLE solicitudes_acceso_grupos ADD COLUMN ciudad_usuario VARCHAR(100) NULL AFTER municipio_usuario");
                }
            } catch (Exception $e) {
                error_log("Error al agregar columnas de ubicación a solicitudes: " . $e->getMessage());
            }
        }
    } catch (PDOException $e) {
        error_log("Error al crear tabla de solicitudes: " . $e->getMessage());
    }
}

// Tabla de notificaciones de solicitudes para todos los administradores
function ensureNotificacionesSolicitudesTable($conn) {
    try {
        $check = $conn->query("SHOW TABLES LIKE 'notificaciones_solicitudes_chat'");
        if ($check->rowCount() === 0) {
            $conn->exec("
                CREATE TABLE notificaciones_solicitudes_chat (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    admin_id INT NOT NULL,
                    solicitud_id INT NOT NULL,
                    leido TINYINT(1) NOT NULL DEFAULT 0,
                    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_admin (admin_id),
                    INDEX idx_solicitud (solicitud_id),
                    INDEX idx_admin_leido (admin_id, leido)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
        }
    } catch (PDOException $e) {
        error_log("Error al crear tabla notificaciones_solicitudes_chat: " . $e->getMessage());
    }
}

// Registrar notificación de nueva solicitud para TODOS los administradores
function notificarSolicitudATodosLosAdmins($conn, $solicitudId) {
    ensureNotificacionesSolicitudesTable($conn);
    try {
        $admins = $conn->query("SELECT id FROM usuarios_administradores WHERE activo = TRUE");
        if (!$admins || $admins->rowCount() === 0) return;
        $stmt = $conn->prepare("INSERT INTO notificaciones_solicitudes_chat (admin_id, solicitud_id) VALUES (?, ?)");
        while ($row = $admins->fetch(PDO::FETCH_ASSOC)) {
            $stmt->execute([(int)$row['id'], (int)$solicitudId]);
        }
    } catch (PDOException $e) {
        error_log("Error al notificar solicitud a admins: " . $e->getMessage());
    }
}

// Crear solicitud de acceso a grupo
function handleCrearSolicitudAcceso($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    ensureSolicitudesTable($conn);
    
    $usuarioId = intval($input['usuario_id'] ?? 0);
    $grupoId = intval($input['grupo_id'] ?? 0);
    $mensaje = trim($input['mensaje'] ?? '');
    $estadoUsuario = trim($input['estado_usuario'] ?? '');
    $municipioUsuario = trim($input['municipio_usuario'] ?? '');
    $ciudadUsuario = trim($input['ciudad_usuario'] ?? '');
    
    if ($usuarioId <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID de usuario inválido']);
        return;
    }
    
    // Verificar si ya existe una solicitud pendiente
    $stmt = $conn->prepare("SELECT id FROM solicitudes_acceso_grupos WHERE usuario_id = ? AND estado = 'pendiente'");
    $stmt->execute([$usuarioId]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Ya tienes una solicitud pendiente']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("
            INSERT INTO solicitudes_acceso_grupos (usuario_id, grupo_id, mensaje, estado_usuario, municipio_usuario, ciudad_usuario, estado, fecha_solicitud)
            VALUES (?, ?, ?, ?, ?, ?, 'pendiente', NOW())
        ");
        $stmt->execute([
            $usuarioId, 
            $grupoId > 0 ? $grupoId : null, 
            $mensaje,
            $estadoUsuario ?: null,
            $municipioUsuario ?: null,
            $ciudadUsuario ?: null
        ]);
        
        $solicitudId = $conn->lastInsertId();
        
        // Notificar a TODOS los administradores (cada uno recibe la notificación)
        notificarSolicitudATodosLosAdmins($conn, $solicitudId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Solicitud creada exitosamente',
            'solicitud_id' => $solicitudId
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Contar notificaciones no leídas de solicitudes para un admin
function handleGetNotificacionesSolicitudesCount($conn, $adminId) {
    ensureNotificacionesSolicitudesTable($conn);
    $adminId = (int) $adminId;
    if ($adminId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Admin no válido', 'count' => 0]);
        return;
    }
    try {
        $stmt = $conn->prepare("SELECT COUNT(*) AS c FROM notificaciones_solicitudes_chat WHERE admin_id = ? AND leido = 0");
        $stmt->execute([$adminId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'count' => (int)($row['c'] ?? 0)]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage(), 'count' => 0]);
    }
}

// Marcar notificaciones de solicitudes como leídas (todas o las de una solicitud)
function handleMarcarNotificacionesSolicitudesLeidas($conn, $adminId, $solicitudId = null) {
    ensureNotificacionesSolicitudesTable($conn);
    $adminId = (int) $adminId;
    if ($adminId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Admin no válido']);
        return;
    }
    try {
        if ($solicitudId !== null && (int)$solicitudId > 0) {
            $stmt = $conn->prepare("UPDATE notificaciones_solicitudes_chat SET leido = 1 WHERE admin_id = ? AND solicitud_id = ?");
            $stmt->execute([$adminId, (int)$solicitudId]);
        } else {
            $stmt = $conn->prepare("UPDATE notificaciones_solicitudes_chat SET leido = 1 WHERE admin_id = ?");
            $stmt->execute([$adminId]);
        }
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Obtener solicitudes de acceso
function handleGetSolicitudesAcceso($conn, $params) {
    ensureSolicitudesTable($conn);
    
    $estado = $params['estado'] ?? '';
    $limit = intval($params['limit'] ?? 50);
    $offset = intval($params['offset'] ?? 0);
    
    try {
        $where = "1=1";
        $paramsQuery = [];
        
        if (!empty($estado)) {
            $where .= " AND s.estado = ?";
            $paramsQuery[] = $estado;
        }
        
        $stmt = $conn->prepare("
            SELECT 
                s.*,
                u.nombre AS usuario_nombre,
                u.email AS usuario_email,
                g.nombre AS grupo_nombre,
                g.estado AS grupo_estado,
                g.municipio AS grupo_municipio,
                g.ciudad AS grupo_ciudad,
                s.estado_usuario,
                s.municipio_usuario,
                s.ciudad_usuario,
                admin.nombre AS admin_nombre
            FROM solicitudes_acceso_grupos s
            INNER JOIN usuarios u ON s.usuario_id = u.id
            LEFT JOIN grupos_ejidos g ON s.grupo_id = g.id
            LEFT JOIN usuarios admin ON s.admin_id = admin.id
            WHERE $where
            ORDER BY s.fecha_solicitud DESC
            LIMIT ? OFFSET ?
        ");
        
        $paramsQuery[] = $limit;
        $paramsQuery[] = $offset;
        $stmt->execute($paramsQuery);
        $solicitudes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Contar total
        $stmtCount = $conn->prepare("SELECT COUNT(*) as total FROM solicitudes_acceso_grupos WHERE $where");
        $paramsCount = array_slice($paramsQuery, 0, -2);
        if (!empty($paramsCount)) {
            $stmtCount->execute($paramsCount);
        } else {
            $stmtCount->execute();
        }
        $total = $stmtCount->fetch(PDO::FETCH_ASSOC)['total'];
        
        echo json_encode([
            'success' => true,
            'solicitudes' => $solicitudes,
            'total' => intval($total)
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Gestionar solicitud (aprobar o rechazar)
function handleGestionarSolicitudAcceso($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    ensureSolicitudesTable($conn);
    ensureGruposTables($conn);
    
    $solicitudId = intval($input['solicitud_id'] ?? 0);
    $accion = trim($input['accion'] ?? ''); // 'aprobar' o 'rechazar'

    // Manejar admin_id con cuidado - puede ser null desde JavaScript
    $adminId = isset($input['admin_id']) ? $input['admin_id'] : null;
    if ($adminId !== null && !is_numeric($adminId)) {
        $adminId = null;
    } elseif ($adminId !== null) {
        $adminId = intval($adminId);
        if ($adminId <= 0) {
            $adminId = null;
        }
    }

    $grupoId = intval($input['grupo_id'] ?? 0);

    // Verificar si el admin_id existe en la tabla usuarios si no es null
    if ($adminId !== null) {
        $stmt = $conn->prepare("SELECT id FROM usuarios WHERE id = ?");
        $stmt->execute([$adminId]);
        if (!$stmt->fetch()) {
            error_log("DEBUG: admin_id {$adminId} no existe en tabla usuarios, estableciendo a NULL");
            $adminId = null;
        }
    }

    // Log para debug
    error_log("DEBUG: admin_id recibido: " . (isset($input['admin_id']) ? json_encode($input['admin_id']) : 'NO_ENVIADO'));
    error_log("DEBUG: admin_id procesado: " . ($adminId === null ? 'NULL' : $adminId));
    
    if ($solicitudId <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID de solicitud inválido']);
        return;
    }
    
    if (!in_array($accion, ['aprobar', 'rechazar', 'reasignar'])) {
        echo json_encode(['success' => false, 'message' => 'Acción inválida']);
        return;
    }
    
    try {
        $conn->beginTransaction();
        
        // Obtener la solicitud (para reasignar, permitir cualquier estado)
        if ($accion === 'reasignar') {
            $stmt = $conn->prepare("SELECT * FROM solicitudes_acceso_grupos WHERE id = ?");
        } else {
            $stmt = $conn->prepare("SELECT * FROM solicitudes_acceso_grupos WHERE id = ? AND estado = 'pendiente'");
        }
        $stmt->execute([$solicitudId]);
        $solicitud = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$solicitud) {
            throw new Exception('Solicitud no encontrada' . ($accion !== 'reasignar' ? ' o ya procesada' : ''));
        }
        
        // Si es reasignar, solo cambiar el grupo_id y actualizar fecha
        if ($accion === 'reasignar') {
            if ($grupoId <= 0) {
                throw new Exception('Debes seleccionar un grupo válido');
            }
            
            error_log("DEBUG REASIGNAR INICIO: solicitud_id={$solicitudId}, usuario_id={$solicitud['usuario_id']}, grupo_id_nuevo={$grupoId}, estado_solicitud={$solicitud['estado']}, grupo_id_anterior={$solicitud['grupo_id']}");
            
            $stmtG = $conn->prepare("SELECT estado, municipio, ciudad FROM grupos_ejidos WHERE id = ?");
            $stmtG->execute([$grupoId]);
            $datosG = $stmtG->fetch(PDO::FETCH_ASSOC);
            $estadoG = $datosG ? trim($datosG['estado'] ?? '') : '';
            if ($estadoG !== '') {
                $stmt = $conn->prepare("UPDATE solicitudes_acceso_grupos SET grupo_id = ?, fecha_resolucion = NOW(), estado_usuario = ?, municipio_usuario = ?, ciudad_usuario = ? WHERE id = ?");
                $stmt->execute([$grupoId, $estadoG, $datosG ? trim($datosG['municipio'] ?? '') : '', $datosG ? trim($datosG['ciudad'] ?? '') : '', $solicitudId]);
            } else {
                $stmt = $conn->prepare("UPDATE solicitudes_acceso_grupos SET grupo_id = ?, fecha_resolucion = NOW() WHERE id = ?");
                $stmt->execute([$grupoId, $solicitudId]);
            }
            error_log("DEBUG REASIGNAR: Solicitud actualizada en BD");
            
            // SIEMPRE agregar al usuario al grupo (no solo si está aprobada)
            // Esto asegura que funcione incluso si se reasigna después de aprobar
            if ($solicitud['usuario_id']) {
                error_log("DEBUG REASIGNAR: Procesando usuario al grupo");
                
                // Remover del grupo anterior si existe
                if ($solicitud['grupo_id']) {
                    $stmt = $conn->prepare("DELETE FROM miembros_grupos WHERE grupo_id = ? AND usuario_id = ?");
                    $stmt->execute([$solicitud['grupo_id'], $solicitud['usuario_id']]);
                    error_log("DEBUG REASIGNAR: Eliminado de grupo anterior: {$solicitud['grupo_id']}");
                }
                
                // Agregar al nuevo grupo
                $stmt = $conn->prepare("SELECT id FROM miembros_grupos WHERE grupo_id = ? AND usuario_id = ?");
                $stmt->execute([$grupoId, $solicitud['usuario_id']]);
                $existeEnGrupo = $stmt->fetch();
                
                if (!$existeEnGrupo) {
                    error_log("DEBUG REASIGNAR: Usuario NO está en el grupo, agregando...");
                    $stmt = $conn->prepare("INSERT INTO miembros_grupos (grupo_id, usuario_id, rol, activo) VALUES (?, ?, 'miembro', TRUE)");
                    $stmt->execute([$grupoId, $solicitud['usuario_id']]);
                    $insertId = $conn->lastInsertId();
                    error_log("DEBUG REASIGNAR: Usuario agregado al grupo {$grupoId} con ID de registro: {$insertId}");
                    
                    // Verificar que se insertó correctamente
                    $stmt = $conn->prepare("SELECT * FROM miembros_grupos WHERE id = ?");
                    $stmt->execute([$insertId]);
                    $miembroInsertado = $stmt->fetch(PDO::FETCH_ASSOC);
                    error_log("DEBUG REASIGNAR: Verificación post-insert: " . json_encode($miembroInsertado));
                } else {
                    error_log("DEBUG REASIGNAR: Usuario ya está en el grupo: " . json_encode($existeEnGrupo));
                }
            } else {
                error_log("DEBUG REASIGNAR: NO se agregó al grupo porque usuario_id está vacío");
            }
            
            $conn->commit();
            echo json_encode([
                'success' => true,
                'message' => 'Solicitud reasignada exitosamente. Usuario agregado al grupo.'
            ]);
            return;
        }
        
        $nuevoEstado = $accion === 'aprobar' ? 'aprobada' : 'rechazada';
        
        // Si se aprueba, resolver grupo y guardar estado en la solicitud para get_estado_asignado
        $grupoIdFinal = 0;
        if ($accion === 'aprobar') {
            $grupoIdFinal = $grupoId > 0 ? $grupoId : (int) ($solicitud['grupo_id'] ?? 0);
            if ($grupoIdFinal <= 0 && !empty(trim($solicitud['estado_usuario'] ?? ''))) {
                $estadoSol = trim($solicitud['estado_usuario']);
                $stmtGrupo = $conn->prepare("
                    SELECT id FROM grupos_ejidos 
                    WHERE activo = TRUE AND (TRIM(estado) = ? OR nombre = ?) 
                    ORDER BY (nombre = ?) DESC, id ASC 
                    LIMIT 1
                ");
                $stmtGrupo->execute([$estadoSol, 'Ejidos ' . $estadoSol, 'Ejidos ' . $estadoSol]);
                $row = $stmtGrupo->fetch(PDO::FETCH_ASSOC);
                if ($row) $grupoIdFinal = (int) $row['id'];
            }
        }
        
        // Actualizar solicitud (y estado_usuario/municipio/ciudad desde el grupo para redirección al chat)
        if ($accion === 'aprobar' && $grupoIdFinal > 0) {
            $stmtG = $conn->prepare("SELECT estado, municipio, ciudad FROM grupos_ejidos WHERE id = ?");
            $stmtG->execute([$grupoIdFinal]);
            $datosGrupo = $stmtG->fetch(PDO::FETCH_ASSOC);
            $estadoGrupo = $datosGrupo ? trim($datosGrupo['estado'] ?? '') : '';
            if ($estadoGrupo !== '') {
                $stmt = $conn->prepare("
                    UPDATE solicitudes_acceso_grupos
                    SET estado = ?, fecha_resolucion = NOW(), admin_id = ?, estado_usuario = ?, municipio_usuario = ?, ciudad_usuario = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $nuevoEstado, $adminId,
                    $estadoGrupo,
                    $datosGrupo ? trim($datosGrupo['municipio'] ?? '') : '',
                    $datosGrupo ? trim($datosGrupo['ciudad'] ?? '') : '',
                    $solicitudId
                ]);
            } else {
                $stmt = $conn->prepare("
                    UPDATE solicitudes_acceso_grupos SET estado = ?, fecha_resolucion = NOW(), admin_id = ? WHERE id = ?
                ");
                $stmt->execute([$nuevoEstado, $adminId, $solicitudId]);
            }
        } else {
            $stmt = $conn->prepare("
                UPDATE solicitudes_acceso_grupos SET estado = ?, fecha_resolucion = NOW(), admin_id = ? WHERE id = ?
            ");
            $stmt->execute([$nuevoEstado, $adminId, $solicitudId]);
        }
        
        if ($accion === 'aprobar' && $grupoIdFinal > 0) {
            $stmt = $conn->prepare("SELECT id FROM miembros_grupos WHERE grupo_id = ? AND usuario_id = ?");
            $stmt->execute([$grupoIdFinal, $solicitud['usuario_id']]);
            if (!$stmt->fetch()) {
                $stmt = $conn->prepare("INSERT INTO miembros_grupos (grupo_id, usuario_id, rol, activo) VALUES (?, ?, 'miembro', TRUE)");
                $stmt->execute([$grupoIdFinal, $solicitud['usuario_id']]);
            }
        }
        
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => $accion === 'aprobar' ? 'Solicitud aprobada exitosamente' : 'Solicitud rechazada'
        ]);
    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function handleGetEstadoAsignado($conn, $params) {
    $usuarioId = isset($params['usuario_id']) ? (int) $params['usuario_id'] : 0;
    if ($usuarioId <= 0) {
        echo json_encode(['success' => false, 'message' => 'usuario_id requerido']);
        return;
    }
    try {
        ensureSolicitudesTable($conn);
        $stmt = $conn->prepare("
            SELECT estado_usuario, municipio_usuario, ciudad_usuario 
            FROM solicitudes_acceso_grupos 
            WHERE usuario_id = ? AND estado = 'aprobada' 
            ORDER BY fecha_resolucion DESC LIMIT 1
        ");
        $stmt->execute([$usuarioId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row && !empty(trim($row['estado_usuario'] ?? ''))) {
            echo json_encode([
                'success' => true,
                'estado' => trim($row['estado_usuario']),
                'municipio' => trim($row['municipio_usuario'] ?? ''),
                'ciudad' => trim($row['ciudad_usuario'] ?? '')
            ]);
        } else {
            echo json_encode(['success' => true, 'estado' => '', 'municipio' => '', 'ciudad' => '']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

?>
