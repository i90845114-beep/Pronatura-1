<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db_connection.php';

// Obtener conexión
try {
    $pdo = getConnection();
} catch (Exception $e) {
    echo json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

function ensureMensajesChatAdjuntos($pdo) {
    try {
        foreach (['adjunto_tipo', 'adjunto_url'] as $col) {
            $q = $pdo->query("SHOW COLUMNS FROM mensajes_chat LIKE '$col'");
            if ($q->rowCount() === 0) {
                if ($col === 'adjunto_tipo') $pdo->exec("ALTER TABLE mensajes_chat ADD COLUMN adjunto_tipo VARCHAR(20) NULL AFTER mensaje");
                if ($col === 'adjunto_url') $pdo->exec("ALTER TABLE mensajes_chat ADD COLUMN adjunto_url VARCHAR(500) NULL AFTER adjunto_tipo");
            }
        }
    } catch (PDOException $e) { /* ignorar */ }
}

// ==================== ENVIAR MENSAJE (misma BD: mensajes_chat) ====================
if ($action === 'enviar_mensaje' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    ensureMensajesChatAdjuntos($pdo);
    
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) $data = [];
    if (empty($data) && !empty($_POST)) {
        $data = $_POST;
    }
    
    $grupo_id = $data['grupo_id'] ?? null;
    $usuario_id = $data['usuario_id'] ?? null;
    $texto = trim($data['texto'] ?? '');
    
    $adjunto_tipo = null;
    $adjunto_url = null;
    if (!empty($_FILES['archivo']['tmp_name']) && is_uploaded_file($_FILES['archivo']['tmp_name'])) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($_FILES['archivo']['tmp_name']);
        $allowedImg = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $allowedVid = ['video/mp4', 'video/webm', 'video/quicktime'];
        if (in_array($mime, $allowedImg)) $adjunto_tipo = 'imagen';
        elseif (in_array($mime, $allowedVid)) $adjunto_tipo = 'video';
        if ($adjunto_tipo) {
            $dir = dirname(__DIR__) . '/uploads/chat/' . date('Y') . '/' . date('m');
            if (!is_dir($dir)) mkdir($dir, 0755, true);
            $ext = pathinfo($_FILES['archivo']['name'], PATHINFO_EXTENSION) ?: ($adjunto_tipo === 'imagen' ? 'jpg' : 'mp4');
            $name = uniqid('', true) . '.' . preg_replace('/[^a-zA-Z0-9]/', '', $ext);
            $path = $dir . '/' . $name;
            if (move_uploaded_file($_FILES['archivo']['tmp_name'], $path)) {
                $adjunto_url = 'uploads/chat/' . date('Y') . '/' . date('m') . '/' . $name;
            } else {
                $adjunto_tipo = null;
                $adjunto_url = null;
            }
        }
    }
    
    if (!$grupo_id || (!$texto && !$adjunto_url)) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos (texto o archivo requerido)']);
        exit;
    }
    
    if ($usuario_id === null || $usuario_id === '') {
        $stmt = $pdo->query("SELECT id FROM usuarios WHERE activo = TRUE LIMIT 1");
        $u = $stmt->fetch(PDO::FETCH_ASSOC);
        $usuario_id = $u ? (int)$u['id'] : null;
    } else {
        $usuario_id = (int) $usuario_id;
    }
    if ($usuario_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Se requiere usuario para enviar mensaje']);
        exit;
    }
    
    try {
        if ($adjunto_tipo && $adjunto_url) {
            $stmt = $pdo->prepare("INSERT INTO mensajes_chat (grupo_id, usuario_id, mensaje, adjunto_tipo, adjunto_url, activo) VALUES (?, ?, ?, ?, ?, TRUE)");
            $stmt->execute([$grupo_id, $usuario_id, $texto ?: null, $adjunto_tipo, $adjunto_url]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO mensajes_chat (grupo_id, usuario_id, mensaje, activo) VALUES (?, ?, ?, TRUE)");
            $stmt->execute([$grupo_id, $usuario_id, $texto]);
        }
        $mensaje_id = $pdo->lastInsertId();
        echo json_encode([
            'success' => true,
            'message' => 'Mensaje enviado',
            'mensaje_id' => $mensaje_id,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ==================== OBTENER MENSAJES (misma BD: mensajes_chat + usuarios) ====================
elseif ($action === 'obtener_mensajes' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    ensureMensajesChatAdjuntos($pdo);
    $grupo_id = isset($_GET['grupo_id']) ? (int) $_GET['grupo_id'] : 0;
    $desde_id = isset($_GET['desde_id']) ? (int) $_GET['desde_id'] : 0;
    $limite = isset($_GET['limite']) ? (int) $_GET['limite'] : 50;
    if ($limite <= 0 || $limite > 100) $limite = 50;
    
    if ($grupo_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'grupo_id requerido']);
        exit;
    }
    
    try {
        $limite = min(100, max(1, $limite));
        $sql = "
            SELECT 
                mc.id,
                mc.usuario_id,
                u.nombre as usuario_nombre,
                mc.mensaje as texto,
                mc.adjunto_tipo,
                mc.adjunto_url,
                DATE_FORMAT(mc.fecha_creacion, '%H:%i') as hora,
                DATE_FORMAT(mc.fecha_creacion, '%Y-%m-%d %H:%i:%s') as fecha_completa,
                UNIX_TIMESTAMP(mc.fecha_creacion) as timestamp
            FROM mensajes_chat mc
            INNER JOIN usuarios u ON u.id = mc.usuario_id
            WHERE mc.grupo_id = ? AND (mc.activo = TRUE OR mc.activo = 1)
            AND ( ? = 0 OR mc.id > ? )
            ORDER BY mc.fecha_creacion ASC
            LIMIT " . (int) $limite . "
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$grupo_id, $desde_id, $desde_id]);
        
        $mensajes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'mensajes' => $mensajes,
            'count' => count($mensajes)
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// ==================== OBTENER GRUPOS (misma BD: grupos_ejidos + mensajes_chat) ====================
// Parámetros opcionales: estado (filtrar por estado/región), usuario_id (solo grupos donde el usuario es miembro)
elseif ($action === 'obtener_grupos' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $estado = trim($_GET['estado'] ?? '');
        $municipio = trim($_GET['municipio'] ?? '');
        $ciudad = trim($_GET['ciudad'] ?? '');
        $usuario_id = isset($_GET['usuario_id']) ? (int) $_GET['usuario_id'] : 0;
        
        $sql = "
            SELECT 
                g.id,
                g.nombre,
                COALESCE(NULLIF(TRIM(g.estado), ''), NULL) as estado,
                COALESCE(NULLIF(TRIM(g.municipio), ''), NULL) as municipio,
                COALESCE(NULLIF(TRIM(g.ciudad), ''), NULL) as ciudad,
                '🌳' as icono,
                '' as region,
                (SELECT COUNT(*) FROM miembros_grupos m WHERE m.grupo_id = g.id AND m.activo = TRUE) as miembros,
                (SELECT mc.mensaje 
                 FROM mensajes_chat mc 
                 WHERE mc.grupo_id = g.id AND mc.activo = TRUE
                 ORDER BY mc.fecha_creacion DESC 
                 LIMIT 1) as ultimo_mensaje,
                (SELECT u.nombre 
                 FROM mensajes_chat mc 
                 INNER JOIN usuarios u ON u.id = mc.usuario_id 
                 WHERE mc.grupo_id = g.id AND mc.activo = TRUE
                 ORDER BY mc.fecha_creacion DESC 
                 LIMIT 1) as ultimo_usuario,
                (SELECT DATE_FORMAT(mc.fecha_creacion, '%H:%i') 
                 FROM mensajes_chat mc 
                 WHERE mc.grupo_id = g.id AND mc.activo = TRUE
                 ORDER BY mc.fecha_creacion DESC 
                 LIMIT 1) as ultima_hora
            FROM grupos_ejidos g
            WHERE g.activo = TRUE
        ";
        $params = [];
        
        // Filtrar por estado: por nombre "Ejidos {estado}" o por columna estado (para grupos como "Ejido de Olmo" en Tamaulipas)
        if ($estado !== '') {
            $sql .= " AND (g.nombre = :estado_nombre OR (g.estado IS NOT NULL AND TRIM(g.estado) = :estado_val))";
            $params[':estado_nombre'] = 'Ejidos ' . $estado;
            $params[':estado_val'] = $estado;
        }
        
        // Filtrar por miembro solo cuando NO se filtró por estado, para que con estado todos vean el mismo grupo y se vean los mensajes entre sí
        if ($usuario_id > 0 && $estado === '') {
            $sql .= " AND g.id IN (SELECT grupo_id FROM miembros_grupos WHERE usuario_id = :usuario_id AND activo = TRUE)";
            $params[':usuario_id'] = $usuario_id;
        }
        
        $sql .= " ORDER BY g.nombre";
        
        if (empty($params)) {
            $stmt = $pdo->query($sql);
        } else {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }
        
        $grupos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Si hay estado + municipio (ej. Ciudad Madero), asegurar que exista el grupo por ubicación y que el usuario sea miembro
        if ($estado !== '' && $municipio !== '' && $usuario_id > 0) {
            try {
                if ($ciudad !== '') {
                    $stmtUbic = $pdo->prepare("SELECT id FROM grupos_ejidos WHERE activo = TRUE AND TRIM(estado) = ? AND TRIM(municipio) = ? AND TRIM(ciudad) = ? LIMIT 1");
                    $stmtUbic->execute([$estado, $municipio, $ciudad]);
                } else {
                    $stmtUbic = $pdo->prepare("SELECT id FROM grupos_ejidos WHERE activo = TRUE AND TRIM(estado) = ? AND TRIM(municipio) = ? AND (ciudad IS NULL OR TRIM(ciudad) = '') LIMIT 1");
                    $stmtUbic->execute([$estado, $municipio]);
                }
                $rowUbic = $stmtUbic->fetch(PDO::FETCH_ASSOC);
                $idGrupoUbic = $rowUbic ? (int) $rowUbic['id'] : 0;
                if ($idGrupoUbic === 0) {
                    $nombreGrupoUbic = $ciudad !== ''
                        ? "Chat de Ejidos - {$municipio}, {$ciudad}, {$estado}"
                        : "Chat de Ejidos - {$municipio}, {$estado}";
                    $descUbic = "Grupo de chat para ejidos en {$municipio}" . ($ciudad !== '' ? ", {$ciudad}" : "") . ", {$estado}";
                    $pdo->prepare("
                        INSERT INTO grupos_ejidos (nombre, estado, municipio, ciudad, descripcion, activo) 
                        VALUES (?, ?, ?, ?, ?, TRUE)
                    ")->execute([$nombreGrupoUbic, $estado, $municipio, $ciudad !== '' ? $ciudad : null, $descUbic]);
                    $idGrupoUbic = (int) $pdo->lastInsertId();
                }
                $stmtMiembro = $pdo->prepare("SELECT id FROM miembros_grupos WHERE grupo_id = ? AND usuario_id = ? AND activo = TRUE");
                $stmtMiembro->execute([$idGrupoUbic, $usuario_id]);
                if (!$stmtMiembro->fetch()) {
                    $pdo->prepare("INSERT INTO miembros_grupos (grupo_id, usuario_id, rol, activo) VALUES (?, ?, 'miembro', TRUE)")
                        ->execute([$idGrupoUbic, $usuario_id]);
                }
                $yaEnLista = false;
                foreach ($grupos as $g) {
                    if ((int)$g['id'] === $idGrupoUbic) { $yaEnLista = true; break; }
                }
                if (!$yaEnLista) {
                    $stmtRow = $pdo->prepare("
                        SELECT g.id, g.nombre, COALESCE(NULLIF(TRIM(g.estado),''),NULL) as estado, COALESCE(NULLIF(TRIM(g.municipio),''),NULL) as municipio, COALESCE(NULLIF(TRIM(g.ciudad),''),NULL) as ciudad,
                        '🌳' as icono, '' as region,
                        (SELECT COUNT(*) FROM miembros_grupos m WHERE m.grupo_id = g.id AND m.activo = TRUE) as miembros,
                        (SELECT mc.mensaje FROM mensajes_chat mc WHERE mc.grupo_id = g.id AND mc.activo = TRUE ORDER BY mc.fecha_creacion DESC LIMIT 1) as ultimo_mensaje,
                        (SELECT u.nombre FROM mensajes_chat mc INNER JOIN usuarios u ON u.id = mc.usuario_id WHERE mc.grupo_id = g.id AND mc.activo = TRUE ORDER BY mc.fecha_creacion DESC LIMIT 1) as ultimo_usuario,
                        (SELECT DATE_FORMAT(mc.fecha_creacion,'%H:%i') FROM mensajes_chat mc WHERE mc.grupo_id = g.id AND mc.activo = TRUE ORDER BY mc.fecha_creacion DESC LIMIT 1) as ultima_hora
                        FROM grupos_ejidos g WHERE g.id = ?
                    ");
                    $stmtRow->execute([$idGrupoUbic]);
                    $fila = $stmtRow->fetch(PDO::FETCH_ASSOC);
                    if ($fila) array_unshift($grupos, $fila);
                }
            } catch (PDOException $e) { /* ignorar */ }
        }
        
        // Si filtraron por estado y no hay ningún grupo: usar el grupo existente del estado (para que dos usuarios vean el mismo chat) o crear uno
        if ($estado !== '' && empty($grupos)) {
            try {
                $nombreGrupo = 'Ejidos ' . $estado;
                $stmtExistente = $pdo->prepare("SELECT id FROM grupos_ejidos WHERE activo = TRUE AND nombre = ? LIMIT 1");
                $stmtExistente->execute([$nombreGrupo]);
                $existente = $stmtExistente->fetch(PDO::FETCH_ASSOC);
                
                if ($existente && $usuario_id > 0) {
                    $grupoId = (int) $existente['id'];
                    $stmtMiembro = $pdo->prepare("SELECT id FROM miembros_grupos WHERE grupo_id = ? AND usuario_id = ?");
                    $stmtMiembro->execute([$grupoId, $usuario_id]);
                    if (!$stmtMiembro->fetch()) {
                        $pdo->prepare("INSERT INTO miembros_grupos (grupo_id, usuario_id, rol, activo) VALUES (?, ?, 'miembro', TRUE)")
                            ->execute([$grupoId, $usuario_id]);
                    }
                    $stmtRow = $pdo->prepare("SELECT g.id, g.nombre, g.estado, g.municipio, g.ciudad, '🌳' as icono, '' as region,
                        (SELECT COUNT(*) FROM miembros_grupos m WHERE m.grupo_id = g.id AND m.activo = TRUE) as miembros,
                        (SELECT mc.mensaje FROM mensajes_chat mc WHERE mc.grupo_id = g.id AND (mc.activo = TRUE OR mc.activo = 1) ORDER BY mc.fecha_creacion DESC LIMIT 1) as ultimo_mensaje,
                        (SELECT u.nombre FROM mensajes_chat mc INNER JOIN usuarios u ON u.id = mc.usuario_id WHERE mc.grupo_id = g.id AND (mc.activo = TRUE OR mc.activo = 1) ORDER BY mc.fecha_creacion DESC LIMIT 1) as ultimo_usuario,
                        (SELECT DATE_FORMAT(mc.fecha_creacion, '%H:%i') FROM mensajes_chat mc WHERE mc.grupo_id = g.id AND (mc.activo = TRUE OR mc.activo = 1) ORDER BY mc.fecha_creacion DESC LIMIT 1) as ultima_hora
                        FROM grupos_ejidos g WHERE g.id = ?");
                    $stmtRow->execute([$grupoId]);
                    $grupos = $stmtRow->fetchAll(PDO::FETCH_ASSOC);
                } elseif (!$existente) {
                    $codigo = 'EJIDOS-' . strtoupper(preg_replace('/[^a-zA-Z0-9]/', '', $estado)) . '-' . time();
                    $stmtLider = $pdo->query("SELECT id FROM usuarios WHERE activo = TRUE ORDER BY id ASC LIMIT 1");
                    $lider = $stmtLider->fetch(PDO::FETCH_ASSOC);
                    if ($lider) {
                        $pdo->prepare("INSERT INTO grupos_ejidos (nombre, descripcion, codigo_acceso, lider_id, activo) VALUES (?, ?, ?, ?, TRUE)")
                            ->execute([$nombreGrupo, 'Grupo de ejidos de ' . $estado, $codigo, $lider['id']]);
                        $nuevoId = $pdo->lastInsertId();
                        if ($usuario_id > 0) {
                            $pdo->prepare("INSERT INTO miembros_grupos (grupo_id, usuario_id, rol, activo) VALUES (?, ?, 'miembro', TRUE)")
                                ->execute([$nuevoId, $usuario_id]);
                        }
                        $stmtNuevo = $pdo->prepare("SELECT g.id, g.nombre, g.estado, g.municipio, g.ciudad, '🌳' as icono, '' as region,
                            (SELECT COUNT(*) FROM miembros_grupos m WHERE m.grupo_id = g.id AND m.activo = TRUE) as miembros,
                            NULL as ultimo_mensaje, NULL as ultimo_usuario, NULL as ultima_hora
                            FROM grupos_ejidos g WHERE g.id = ?");
                        $stmtNuevo->execute([$nuevoId]);
                        $grupos = $stmtNuevo->fetchAll(PDO::FETCH_ASSOC);
                    }
                }
            } catch (PDOException $e) {
                // ignorar si falla
            }
        }
        
        echo json_encode([
            'success' => true,
            'grupos' => $grupos
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

else {
    echo json_encode([
        'success' => false, 
        'message' => 'Acción no válida',
        'acciones_disponibles' => [
            'enviar_mensaje (POST)',
            'obtener_mensajes (GET)',
            'obtener_grupos (GET)'
        ]
    ]);
}
?>
