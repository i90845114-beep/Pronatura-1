<?php
// Funciones de administración

// Verificar que el usuario es administrador
function requireAdmin($conn, $usuarioId) {
    if (empty($usuarioId)) {
        echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT rol FROM usuarios WHERE id = ?");
    $stmt->execute([$usuarioId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || $user['rol'] !== 'admin') {
        echo json_encode(['success' => false, 'message' => 'No tienes permisos de administrador']);
        exit;
    }
}

// Obtener estadísticas del dashboard
function handleGetAdminStats($conn) {
    try {
        $stats = [];
        
        // Total de usuarios
        $stmt = $conn->query("SELECT COUNT(*) as total FROM usuarios");
        $stats['total_usuarios'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Total de registros
        $stmt = $conn->query("SELECT COUNT(*) as total FROM registros_animales");
        $stats['total_registros'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Total de comentarios
        $stmt = $conn->query("SELECT COUNT(*) as total FROM comentarios_registros WHERE activo = 1");
        $stats['total_comentarios'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Usuarios activos
        $stmt = $conn->query("SELECT COUNT(*) as total FROM usuarios WHERE activo = 1");
        $stats['usuarios_activos'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Registros este mes
        $stmt = $conn->query("SELECT COUNT(*) as total FROM registros_animales WHERE MONTH(fecha_creacion) = MONTH(CURRENT_DATE()) AND YEAR(fecha_creacion) = YEAR(CURRENT_DATE())");
        $stats['registros_mes'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        echo json_encode([
            'success' => true,
            'stats' => $stats
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Obtener todos los usuarios
function handleGetAllUsuarios($conn) {
    try {
        $stmt = $conn->query("SELECT id, nombre, email, rol, activo, fecha_registro, fecha_ultimo_acceso FROM usuarios ORDER BY fecha_registro DESC");
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'usuarios' => $usuarios
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Crear nuevo usuario (admin)
function handleCreateUsuario($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    // Aceptar tanto 'nombre' (retrocompatibilidad) como 'apodo' (nuevo campo)
    $apodo = trim($input['apodo'] ?? $input['nombre'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $rol = $input['rol'] ?? 'usuario';
    
    if (empty($apodo) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Apodo, email y contraseña son requeridos']);
        return;
    }
    
    if (!in_array($rol, ['usuario', 'admin'])) {
        $rol = 'usuario';
    }
    
    $email = strtolower($email);
    
    // Verificar que el email no exista
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Este correo electrónico ya está registrado']);
        return;
    }
    
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    try {
        // Guardar el apodo en el campo nombre (ya que ahora nombre es el apodo público)
        $stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)");
        $stmt->execute([$apodo, $email, $passwordHash, $rol]);
        
        $userId = $conn->lastInsertId();
        
        $stmt = $conn->prepare("SELECT id, nombre, email, rol, activo, fecha_registro FROM usuarios WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Usuario creado exitosamente',
            'user' => $user
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Actualizar usuario
function handleUpdateUsuario($conn, $input, $method) {
    if ($method !== 'PUT') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    $userId = $input['id'] ?? null;
    // Aceptar tanto 'nombre' (retrocompatibilidad) como 'apodo' (nuevo campo)
    $apodo = trim($input['apodo'] ?? $input['nombre'] ?? '');
    $email = trim($input['email'] ?? '');
    $rol = $input['rol'] ?? null;
    $activo = isset($input['activo']) ? (bool)$input['activo'] : null;
    $password = $input['password'] ?? null;
    
    if (empty($userId)) {
        echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
        return;
    }
    
    try {
        // Verificar que el usuario existe y obtener su rol
        $stmt = $conn->prepare("SELECT id, rol, nombre FROM usuarios WHERE id = ?");
        $stmt->execute([$userId]);
        $userData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$userData) {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            return;
        }
        
        $userRol = $userData['rol'];
        $userApodoOriginal = $userData['nombre']; // nombre en BD es el apodo
        
        // Construir query dinámicamente
        $updates = [];
        $params = [];
        
        // Solo permitir actualizar apodo si el usuario ES admin
        if ($userRol === 'admin' && !empty($apodo) && $apodo !== $userApodoOriginal) {
            $updates[] = "nombre = ?"; // nombre en BD es el apodo
            $params[] = $apodo;
        }
        // Si NO es admin, ignorar completamente el campo apodo (no se actualiza)
        
        if (!empty($email)) {
            // Verificar que el email no esté en uso por otro usuario
            $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ? AND id != ?");
            $stmt->execute([$email, $userId]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Este correo electrónico ya está en uso']);
                return;
            }
            $updates[] = "email = ?";
            $params[] = strtolower($email);
        }
        
        if ($rol !== null && in_array($rol, ['usuario', 'admin'])) {
            $updates[] = "rol = ?";
            $params[] = $rol;
        }
        
        if ($activo !== null) {
            $updates[] = "activo = ?";
            $params[] = $activo ? 1 : 0;
        }
        
        // Solo actualizar contraseña si el usuario ES admin y se proporcionó una nueva
        if ($userRol === 'admin' && !empty($password)) {
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            $updates[] = "password_hash = ?";
            $params[] = $passwordHash;
        }
        // Si NO es admin, ignorar completamente el campo password (no se actualiza)
        
        if (empty($updates)) {
            echo json_encode(['success' => false, 'message' => 'No hay campos para actualizar']);
            return;
        }
        
        $params[] = $userId;
        $query = "UPDATE usuarios SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        
        echo json_encode([
            'success' => true,
            'message' => 'Usuario actualizado exitosamente'
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Eliminar usuario
function handleDeleteUsuario($conn, $input, $method) {
    if ($method !== 'DELETE' && $method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    // Verificar autenticación de administrador
    $token = $input['token'] ?? $_GET['token'] ?? null;
    $admin = verifyAdminToken($conn, $token);
    if (!$admin) {
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        return;
    }
    
    $userId = $input['id'] ?? null;
    
    if (empty($userId)) {
        echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
        return;
    }
    
    try {
        $conn->beginTransaction();
        
        // Verificar que el usuario existe y no es admin
        $stmt = $conn->prepare("SELECT rol FROM usuarios WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            $conn->rollBack();
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            return;
        }
        
        if ($user['rol'] === 'admin') {
            $conn->rollBack();
            echo json_encode(['success' => false, 'message' => 'No se pueden eliminar usuarios administradores']);
            return;
        }
        
        // Eliminar registros relacionados primero
        $stmt = $conn->prepare("DELETE FROM registros_animales WHERE usuario_id = ?");
        $stmt->execute([$userId]);
        
        $stmt = $conn->prepare("DELETE FROM comentarios_registros WHERE usuario_id = ?");
        $stmt->execute([$userId]);
        
        $stmt = $conn->prepare("DELETE FROM advertencias_usuarios WHERE usuario_id = ?");
        $stmt->execute([$userId]);
        
        $stmt = $conn->prepare("DELETE FROM bans_usuarios WHERE usuario_id = ?");
        $stmt->execute([$userId]);
        
        $stmt = $conn->prepare("DELETE FROM apelaciones_bans WHERE usuario_id = ?");
        $stmt->execute([$userId]);
        
        $stmt = $conn->prepare("DELETE FROM intentos_contenido_ofensivo WHERE usuario_id = ?");
        $stmt->execute([$userId]);
        
        // Finalmente eliminar el usuario
        $stmt = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmt->execute([$userId]);
        
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Usuario eliminado exitosamente'
        ]);
    } catch (Exception $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Limpiar usuarios masivamente (dejar solo 5 más recientes)
function handleLimpiarUsuarios($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    // Verificar autenticación de administrador
    $token = $input['token'] ?? $_GET['token'] ?? null;
    $admin = verifyAdminToken($conn, $token);
    if (!$admin) {
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        return;
    }
    
    try {
        $conn->beginTransaction();
        
        // Primero verificar si existe la columna fecha_registro
        $checkFechaRegistro = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'fecha_registro'");
        $fechaRegistroExists = $checkFechaRegistro->rowCount() > 0;
        
        // Obtener los IDs de los usuarios a mantener (5 más recientes + todos los admins)
        if ($fechaRegistroExists) {
            // Obtener todos los admins primero
            $stmt = $conn->prepare("SELECT id FROM usuarios WHERE rol = 'admin'");
            $stmt->execute();
            $adminIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Obtener los 5 usuarios más recientes (que no sean admins)
            $stmt = $conn->prepare("
                SELECT id FROM usuarios 
                WHERE rol != 'admin' 
                ORDER BY fecha_registro DESC 
                LIMIT 5
            ");
            $stmt->execute();
            $recientesIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Combinar ambos arrays
            $usuariosAMantener = array_unique(array_merge($adminIds, $recientesIds));
        } else {
            // Si no existe fecha_registro, usar id como criterio (más recientes = mayores IDs)
            $stmt = $conn->prepare("SELECT id FROM usuarios WHERE rol = 'admin'");
            $stmt->execute();
            $adminIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $stmt = $conn->prepare("
                SELECT id FROM usuarios 
                WHERE rol != 'admin' 
                ORDER BY id DESC 
                LIMIT 5
            ");
            $stmt->execute();
            $recientesIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $usuariosAMantener = array_unique(array_merge($adminIds, $recientesIds));
        }
        
        if (empty($usuariosAMantener)) {
            $conn->rollBack();
            echo json_encode(['success' => false, 'message' => 'No hay usuarios para mantener']);
            return;
        }
        
        // Crear placeholders para la consulta IN
        $placeholders = implode(',', array_fill(0, count($usuariosAMantener), '?'));
        
        // Contar usuarios antes de eliminar
        $stmt = $conn->prepare("SELECT COUNT(*) FROM usuarios WHERE id NOT IN ($placeholders)");
        $stmt->execute($usuariosAMantener);
        $totalEliminados = $stmt->fetchColumn();
        
        // Eliminar registros relacionados de usuarios que se van a eliminar
        $stmt = $conn->prepare("
            DELETE FROM registros_animales 
            WHERE usuario_id NOT IN ($placeholders)
        ");
        $stmt->execute($usuariosAMantener);
        
        $stmt = $conn->prepare("
            DELETE FROM comentarios_registros 
            WHERE usuario_id NOT IN ($placeholders)
        ");
        $stmt->execute($usuariosAMantener);
        
        $stmt = $conn->prepare("
            DELETE FROM advertencias_usuarios 
            WHERE usuario_id NOT IN ($placeholders)
        ");
        $stmt->execute($usuariosAMantener);
        
        $stmt = $conn->prepare("
            DELETE FROM bans_usuarios 
            WHERE usuario_id NOT IN ($placeholders)
        ");
        $stmt->execute($usuariosAMantener);
        
        $stmt = $conn->prepare("
            DELETE FROM apelaciones_bans 
            WHERE usuario_id NOT IN ($placeholders)
        ");
        $stmt->execute($usuariosAMantener);
        
        $stmt = $conn->prepare("
            DELETE FROM intentos_contenido_ofensivo 
            WHERE usuario_id NOT IN ($placeholders)
        ");
        $stmt->execute($usuariosAMantener);
        
        // Eliminar usuarios
        $stmt = $conn->prepare("
            DELETE FROM usuarios 
            WHERE id NOT IN ($placeholders)
        ");
        $stmt->execute($usuariosAMantener);
        
        // Obtener usuarios restantes ordenados por ID para renumerarlos
        $stmt = $conn->prepare("SELECT id FROM usuarios ORDER BY id ASC");
        $stmt->execute();
        $usuariosRestantesIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        error_log("🔍 [limpiarUsuarios] Usuarios restantes: " . json_encode($usuariosRestantesIds));
        
        $totalUsuarios = count($usuariosRestantesIds);
        
        if ($totalUsuarios > 0) {
            // DESACTIVAR claves foráneas
            $conn->exec("SET FOREIGN_KEY_CHECKS = 0");
            
            // Crear mapeo: ID antiguo -> ID nuevo (1, 2, 3, 4, 5...)
            $mapeoIds = [];
            $nuevoId = 1;
            foreach ($usuariosRestantesIds as $idAntiguo) {
                $mapeoIds[$idAntiguo] = $nuevoId;
                $nuevoId++;
            }
            
            // PASO 1: Mover a temporales (orden inverso)
            foreach (array_reverse($usuariosRestantesIds) as $idAntiguo) {
                $idTemporal = 999999 + $idAntiguo;
                
                // Usar prepared statements para evitar errores
                $stmt = $conn->prepare("UPDATE usuarios SET id = ? WHERE id = ?");
                $stmt->execute([$idTemporal, $idAntiguo]);
                
                $stmt = $conn->prepare("UPDATE registros_animales SET usuario_id = ? WHERE usuario_id = ?");
                $stmt->execute([$idTemporal, $idAntiguo]);
                
                $stmt = $conn->prepare("UPDATE comentarios_registros SET usuario_id = ? WHERE usuario_id = ?");
                $stmt->execute([$idTemporal, $idAntiguo]);
                
                $stmt = $conn->prepare("UPDATE advertencias_usuarios SET usuario_id = ? WHERE usuario_id = ?");
                $stmt->execute([$idTemporal, $idAntiguo]);
                
                $stmt = $conn->prepare("UPDATE advertencias_usuarios SET admin_id = ? WHERE admin_id = ?");
                $stmt->execute([$idTemporal, $idAntiguo]);
                
                $stmt = $conn->prepare("UPDATE bans_usuarios SET usuario_id = ? WHERE usuario_id = ?");
                $stmt->execute([$idTemporal, $idAntiguo]);
                
                $stmt = $conn->prepare("UPDATE bans_usuarios SET admin_id = ? WHERE admin_id = ?");
                $stmt->execute([$idTemporal, $idAntiguo]);
                
                $stmt = $conn->prepare("UPDATE apelaciones_bans SET usuario_id = ? WHERE usuario_id = ?");
                $stmt->execute([$idTemporal, $idAntiguo]);
                
                $stmt = $conn->prepare("UPDATE apelaciones_bans SET admin_id = ? WHERE admin_id = ?");
                $stmt->execute([$idTemporal, $idAntiguo]);
                
                $stmt = $conn->prepare("UPDATE intentos_contenido_ofensivo SET usuario_id = ? WHERE usuario_id = ?");
                $stmt->execute([$idTemporal, $idAntiguo]);
            }
            
            // PASO 2: Mover a IDs finales (1, 2, 3, 4, 5...)
            foreach ($usuariosRestantesIds as $idAntiguo) {
                $idNuevo = $mapeoIds[$idAntiguo];
                $idTemporal = 999999 + $idAntiguo;
                
                // Usar prepared statements
                $stmt = $conn->prepare("UPDATE usuarios SET id = ? WHERE id = ?");
                $stmt->execute([$idNuevo, $idTemporal]);
                
                $stmt = $conn->prepare("UPDATE registros_animales SET usuario_id = ? WHERE usuario_id = ?");
                $stmt->execute([$idNuevo, $idTemporal]);
                
                $stmt = $conn->prepare("UPDATE comentarios_registros SET usuario_id = ? WHERE usuario_id = ?");
                $stmt->execute([$idNuevo, $idTemporal]);
                
                $stmt = $conn->prepare("UPDATE advertencias_usuarios SET usuario_id = ? WHERE usuario_id = ?");
                $stmt->execute([$idNuevo, $idTemporal]);
                
                $stmt = $conn->prepare("UPDATE advertencias_usuarios SET admin_id = ? WHERE admin_id = ?");
                $stmt->execute([$idNuevo, $idTemporal]);
                
                $stmt = $conn->prepare("UPDATE bans_usuarios SET usuario_id = ? WHERE usuario_id = ?");
                $stmt->execute([$idNuevo, $idTemporal]);
                
                $stmt = $conn->prepare("UPDATE bans_usuarios SET admin_id = ? WHERE admin_id = ?");
                $stmt->execute([$idNuevo, $idTemporal]);
                
                $stmt = $conn->prepare("UPDATE apelaciones_bans SET usuario_id = ? WHERE usuario_id = ?");
                $stmt->execute([$idNuevo, $idTemporal]);
                
                $stmt = $conn->prepare("UPDATE apelaciones_bans SET admin_id = ? WHERE admin_id = ?");
                $stmt->execute([$idNuevo, $idTemporal]);
                
                $stmt = $conn->prepare("UPDATE intentos_contenido_ofensivo SET usuario_id = ? WHERE usuario_id = ?");
                $stmt->execute([$idNuevo, $idTemporal]);
            }
            
            // REACTIVAR claves foráneas
            $conn->exec("SET FOREIGN_KEY_CHECKS = 1");
            
            // Verificar IDs
            $stmt = $conn->prepare("SELECT id FROM usuarios ORDER BY id ASC");
            $stmt->execute();
            $idsFinales = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Resetear AUTO_INCREMENT
            $siguienteId = $totalUsuarios + 1;
            $conn->exec("ALTER TABLE usuarios AUTO_INCREMENT = $siguienteId");
        } else {
            error_log("⚠️ No hay usuarios para renumerar");
            $idsFinales = [];
            $siguienteId = 1;
        }
        
        // Verificar IDs antes de commit
        $stmt = $conn->prepare("SELECT id FROM usuarios ORDER BY id ASC");
        $stmt->execute();
        $idsFinalesVerificacion = $stmt->fetchAll(PDO::FETCH_COLUMN);
        error_log("✅ IDs finales antes de commit: " . json_encode($idsFinalesVerificacion));
        
        $conn->commit();
        error_log("✅ Transacción completada");
        
        // Contar usuarios restantes
        $stmt = $conn->prepare("SELECT COUNT(*) FROM usuarios");
        $stmt->execute();
        $usuariosRestantes = $stmt->fetchColumn();
        
        // Obtener IDs finales después del commit
        $stmt = $conn->prepare("SELECT id FROM usuarios ORDER BY id ASC");
        $stmt->execute();
        $idsFinales = $stmt->fetchAll(PDO::FETCH_COLUMN);
        error_log("✅ IDs finales después de commit: " . json_encode($idsFinales));
        
        echo json_encode([
            'success' => true,
            'message' => "✅ LIMPIEZA COMPLETADA: $totalEliminados usuarios eliminados, $usuariosRestantes usuarios restantes. IDs renumerados del 1 al $usuariosRestantes. El siguiente usuario nuevo tendrá ID $siguienteId.",
            'eliminados' => $totalEliminados,
            'restantes' => $usuariosRestantes,
            'siguiente_id' => $siguienteId,
            'ids_finales' => $idsFinales
        ]);
    } catch (Exception $e) {
        error_log("❌ [limpiarUsuarios] ERROR: " . $e->getMessage());
        error_log("❌ [limpiarUsuarios] Stack trace: " . $e->getTraceAsString());
        if ($conn->inTransaction()) {
            $conn->rollBack();
            error_log("❌ [limpiarUsuarios] Transacción revertida");
        }
        // Asegurar que FOREIGN_KEY_CHECKS esté activado
        try {
            $conn->exec("SET FOREIGN_KEY_CHECKS = 1");
        } catch (Exception $e2) {
            // Ignorar
        }
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Obtener todos los registros (admin)
function handleGetAllRegistros($conn, $params) {
    try {
        // Verificar si las columnas existen
        $checkNombreReal = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'nombre_real'");
        $nombreRealExists = $checkNombreReal->rowCount() > 0;
        $checkApodo = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'apodo'");
        $apodoExists = $checkApodo->rowCount() > 0;
        
        // Para admin, mostrar nombre_real en lugar de apodo
        if ($nombreRealExists && $apodoExists) {
            $query = "SELECT r.*, 
                COALESCE(u.nombre_real, u.nombre) as usuario_nombre,
                COALESCE(u.apodo, u.nombre) as usuario_apodo,
                u.email as usuario_email, 
                c.nombre as categoria_nombre, 
                sc.nombre as subcategoria_nombre 
                FROM registros_animales r 
                INNER JOIN usuarios u ON r.usuario_id = u.id 
                LEFT JOIN categorias c ON r.categoria_id = c.id 
                LEFT JOIN subcategorias sc ON r.subcategoria_id = sc.id 
                WHERE 1=1";
        } else {
            $query = "SELECT r.*, 
                u.nombre as usuario_nombre,
                u.nombre as usuario_apodo,
                u.email as usuario_email, 
                c.nombre as categoria_nombre, 
                sc.nombre as subcategoria_nombre 
            FROM registros_animales r 
            INNER JOIN usuarios u ON r.usuario_id = u.id 
            LEFT JOIN categorias c ON r.categoria_id = c.id 
            LEFT JOIN subcategorias sc ON r.subcategoria_id = sc.id 
            WHERE 1=1";
        }
        
        $queryParams = [];
        
        // Filtros opcionales
        if (!empty($params['categoria_id'])) {
            $query .= " AND r.categoria_id = ?";
            $queryParams[] = $params['categoria_id'];
        }
        
        if (!empty($params['usuario_id'])) {
            $query .= " AND r.usuario_id = ?";
            $queryParams[] = $params['usuario_id'];
        }
        
        // Búsqueda de texto (si se proporciona)
        if (!empty($params['search'])) {
            $searchTerm = '%' . $params['search'] . '%';
            $query .= " AND (
                r.nombre LIKE ? OR 
                r.especie LIKE ? OR 
                r.descripcion_breve LIKE ? OR 
                r.notas LIKE ? OR
                r.comunidad LIKE ? OR
                r.sitio LIKE ?
            )";
            $queryParams = array_merge($queryParams, [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm]);
        }
        
        $query .= " ORDER BY r.fecha_creacion DESC LIMIT 500";
        
        $stmt = $conn->prepare($query);
        $stmt->execute($queryParams);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Para admin, usar nombre_real (ya está en usuario_nombre por el COALESCE)
        
        // Cargar solo la primera imagen como preview para mejorar rendimiento
        foreach ($records as &$record) {
            // Contar total de media
            $stmt = $conn->prepare("SELECT COUNT(*) as total FROM media_registros WHERE registro_id = ?");
            $stmt->execute([$record['id']]);
            $mediaCount = $stmt->fetch();
            $record['has_media'] = $mediaCount['total'] > 0;
            $record['media_count'] = (int)$mediaCount['total'];
            
            // Cargar solo la primera imagen como preview (si existe)
            $stmt = $conn->prepare("SELECT tipo, datos_base64, descripcion, orden FROM media_registros WHERE registro_id = ? AND tipo = 'image' ORDER BY orden LIMIT 1");
            $stmt->execute([$record['id']]);
            $previewImage = $stmt->fetch();
            $record['media_preview'] = $previewImage ? [$previewImage] : [];
            // No incluir todas las imágenes para mejorar rendimiento
            $record['media'] = [];
        }
        
        echo json_encode([
            'success' => true,
            'records' => $records
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Obtener todos los comentarios
function handleGetAllComentarios($conn, $params) {
    try {
        $query = "SELECT c.*, u.nombre as usuario_nombre, u.email as usuario_email,
            r.nombre as registro_nombre, r.especie as registro_especie
            FROM comentarios_registros c
            INNER JOIN usuarios u ON c.usuario_id = u.id
            INNER JOIN registros_animales r ON c.registro_id = r.id
            WHERE 1=1";
        $queryParams = [];
        
        if (isset($params['activo']) && $params['activo'] !== '') {
            $query .= " AND c.activo = ?";
            $queryParams[] = $params['activo'];
        }
        
        $query .= " ORDER BY c.fecha_creacion DESC";
        
        $stmt = $conn->prepare($query);
        $stmt->execute($queryParams);
        $comentarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'comentarios' => $comentarios
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Actualizar comentario
function handleUpdateComentario($conn, $input, $method) {
    if ($method !== 'PUT') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    $id = $input['id'] ?? null;
    $activo = $input['activo'] ?? null;
    
    if (!$id || $activo === null) {
        echo json_encode(['success' => false, 'message' => 'ID y estado son requeridos']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("UPDATE comentarios_registros SET activo = ? WHERE id = ?");
        $stmt->execute([$activo, $id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Comentario actualizado exitosamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Comentario no encontrado']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Eliminar comentario
function handleDeleteComentario($conn, $input, $method) {
    if ($method !== 'DELETE') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    $id = $input['id'] ?? null;
    
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'ID es requerido']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("DELETE FROM comentarios_registros WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Comentario eliminado exitosamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Comentario no encontrado']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

