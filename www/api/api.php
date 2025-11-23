<?php
require_once __DIR__ . '/db_connection.php';
require_once __DIR__ . '/admin_functions.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? $_POST['action'] ?? '';

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

// Si el JSON decode falló o está vacío, intentar con $_POST
if (empty($input) && !empty($_POST)) {
    $input = $_POST;
}

// Si aún está vacío y hay rawInput, intentar parsear de nuevo
if (empty($input) && !empty($rawInput)) {
    $input = json_decode($rawInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        // Si el JSON es inválido, intentar parsear como form data
        parse_str($rawInput, $input);
    }
}

// Asegurarse de que $input sea siempre un array
if (!is_array($input)) {
    $input = [];
}

// Función para asegurar que las columnas nombre_real y apodo existan
function ensureUsuarioColumns($conn) {
    try {
        // Verificar si existe la columna 'nombre_real'
        $checkNombreReal = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'nombre_real'");
        if ($checkNombreReal->rowCount() === 0) {
            // Agregar columna nombre_real después de id
            $conn->exec("ALTER TABLE usuarios ADD COLUMN nombre_real VARCHAR(255) NULL AFTER id");
            // Copiar datos de nombre a nombre_real para usuarios existentes
            $conn->exec("UPDATE usuarios SET nombre_real = nombre WHERE nombre_real IS NULL");
        }
        
        // Verificar si existe la columna 'apodo'
        $checkApodo = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'apodo'");
        if ($checkApodo->rowCount() === 0) {
            // Agregar columna apodo después de nombre_real (o después de nombre si nombre_real no existe)
            $conn->exec("ALTER TABLE usuarios ADD COLUMN apodo VARCHAR(255) NULL AFTER nombre_real");
            // Copiar datos de nombre a apodo para usuarios existentes (retrocompatibilidad)
            $conn->exec("UPDATE usuarios SET apodo = nombre WHERE apodo IS NULL OR apodo = ''");
        }
    } catch (PDOException $e) {
        // Si hay error, solo loguear pero no fallar (para no romper la aplicación)
        error_log("Error al crear columnas de usuario: " . $e->getMessage());
    }
}

// Función para eliminar la columna altitud de la tabla registros_animales
function removeAltitudColumn($conn) {
    try {
        // Verificar si existe la columna 'altitud'
        $checkAltitud = $conn->query("SHOW COLUMNS FROM registros_animales LIKE 'altitud'");
        if ($checkAltitud->rowCount() > 0) {
            // Eliminar la columna altitud
            $conn->exec("ALTER TABLE registros_animales DROP COLUMN altitud");
            error_log("✅ Columna altitud eliminada de registros_animales");
        }
    } catch (PDOException $e) {
        // Si hay error, solo loguear pero no fallar (para no romper la aplicación)
        error_log("Error al eliminar columna altitud: " . $e->getMessage());
    }
}

try {
    $conn = getDB();
    
    // Asegurar que las columnas nombre_real y apodo existan en la tabla usuarios
    ensureUsuarioColumns($conn);
    
    // Eliminar columna altitud si existe (migración)
    removeAltitudColumn($conn);
    
    switch ($action) {
        case 'register':
            handleRegister($conn, $input, $method);
            break;
            
        case 'login':
            handleLogin($conn, $input, $method);
            break;
            
        case 'save_record':
            handleSaveRecord($conn, $input, $method);
            break;
            
        case 'get_records':
            handleGetRecords($conn, $_GET);
            break;
            
        case 'delete_record':
            handleDeleteRecord($conn, $input, $method);
            break;
            
        case 'get_categorias':
            handleGetCategorias($conn);
            break;
            
        case 'get_subcategorias':
            handleGetSubcategorias($conn, $_GET);
            break;
            
        case 'save_registro_ambiental':
            handleSaveRegistroAmbiental($conn, $input, $method);
            break;
            
        case 'get_registros_ambientales':
            handleGetRegistrosAmbientales($conn, $_GET);
            break;
            
        // Endpoints de administración
        case 'get_admin_stats':
            handleGetAdminStats($conn);
            break;
            
        case 'get_all_usuarios':
            handleGetAllUsuarios($conn);
            break;
            
        case 'create_usuario':
            handleCreateUsuario($conn, $input, $method);
            break;
            
        case 'update_usuario':
            handleUpdateUsuario($conn, $input, $method);
            break;
            
        case 'delete_usuario':
            handleDeleteUsuario($conn, $input, $method);
            break;
            
        case 'request_password_reset':
            handleRequestPasswordReset($conn, $input, $method);
            break;
            
        case 'reset_password':
            handleResetPassword($conn, $input, $method);
            break;
            
        case 'get_all_registros':
            handleGetAllRegistros($conn, $_GET);
            break;
            
        case 'get_all_comentarios':
            handleGetAllComentarios($conn, $_GET);
            break;
            
        case 'update_comentario':
            handleUpdateComentario($conn, $input, $method);
            break;
            
        case 'delete_comentario':
            handleDeleteComentario($conn, $input, $method);
            break;
            
        case 'get_user_info':
            handleGetUserInfo($conn, $_GET);
            break;
            
        case 'admin_login':
            handleAdminLogin($conn, $input, $method);
            break;
            
        case 'admin_logout':
            handleAdminLogout($conn, $input, $method);
            break;
            
        case 'verify_admin_session':
            handleVerifyAdminSession($conn, $input, $method);
            break;
            
        case 'check_email':
            handleCheckEmail($conn, $input, $method);
            break;
            
        case 'dar_advertencia':
            handleDarAdvertencia($conn, $input, $method);
            break;
            
        case 'listar_advertencias':
            handleListarAdvertencias($conn, $input, $method);
            break;
            
        case 'dar_ban':
            handleDarBan($conn, $input, $method);
            break;
            
        case 'listar_bans':
            handleListarBans($conn, $input, $method);
            break;
            
        case 'eliminar_advertencia':
            handleEliminarAdvertencia($conn, $input, $method);
            break;
            
        case 'eliminar_ban':
            handleEliminarBan($conn, $input, $method);
            break;
            
        case 'get_usuario_info':
            handleGetUsuarioInfo($conn, $input, $method);
            break;
            
        case 'get_intentos_ofensivos':
            handleGetIntentosOfensivos($conn, $_GET);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
            break;
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

function handleRegister($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    // Obtener nombre real y apodo por separado
    $nombre = trim($input['nombre'] ?? '');
    $apodo = trim($input['apodo'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    // Retrocompatibilidad: si no hay nombre pero hay apodo, usar apodo como nombre
    if (empty($nombre) && !empty($apodo)) {
        $nombre = $apodo;
    }
    
    // Detectar contenido ofensivo en nombre, apodo, email y contraseña
    $camposParaRevisar = [
        'nombre' => $nombre,
        'apodo' => $apodo,
        'email' => $email,
        'contraseña' => $password
    ];
    
    $contenidoOfensivoEncontrado = [];
    foreach ($camposParaRevisar as $campo => $valor) {
        if (detectarContenidoOfensivo($valor)) {
            $contenidoOfensivoEncontrado[] = $campo;
        }
    }
    
    // Si se encuentra contenido ofensivo, rechazar y registrar intento
    if (!empty($contenidoOfensivoEncontrado)) {
        // Crear tabla de intentos si no existe
        crearTablaIntentosOfensivos($conn);
        
        // Obtener IP del usuario
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        // Guardar intento de contenido ofensivo
        $camposAfectados = implode(', ', $contenidoOfensivoEncontrado);
        $contenidoIntentado = json_encode([
            'nombre' => $nombre,
            'apodo' => $apodo,
            'email' => $email,
            'password' => $password // Incluir contraseña para registro completo del intento
        ]);
        
        // Intentar obtener usuario_id si existe (por email)
        $usuarioId = null;
        $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $usuarioExistente = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($usuarioExistente) {
            $usuarioId = $usuarioExistente['id'];
        }
        
        $stmt = $conn->prepare("
            INSERT INTO intentos_contenido_ofensivo 
            (usuario_id, tipo_intento, campos_afectados, contenido_intentado, ip_address) 
            VALUES (?, 'registro_usuario', ?, ?, ?)
        ");
        $stmt->execute([$usuarioId, $camposAfectados, $contenidoIntentado, $ipAddress]);
        
        $camposAfectados = implode(', ', $contenidoOfensivoEncontrado);
        $mensajeError = "El registro fue rechazado porque contiene lenguaje ofensivo o inapropiado en: " . implode(', ', $contenidoOfensivoEncontrado);
        $mensajeError .= " No se puede crear una cuenta con contenido ofensivo.";
        
        echo json_encode([
            'success' => false,
            'message' => $mensajeError,
            'contenido_ofensivo' => true,
            'campos_afectados' => $contenidoOfensivoEncontrado
        ]);
        return;
    }
    
    if (empty($nombre) || empty($apodo) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Todos los campos son requeridos']);
        return;
    }
    
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres']);
        return;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Email inválido']);
        return;
    }
    
    $email = strtolower($email);
    
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Este correo electrónico ya está registrado']);
        return;
    }
    
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    try {
        // Verificar si existe la columna 'apodo' en la tabla usuarios
        $checkColumn = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'apodo'");
        $apodoColumnExists = $checkColumn->rowCount() > 0;
        
        if (!$apodoColumnExists) {
            // Agregar columna apodo si no existe
            $conn->exec("ALTER TABLE usuarios ADD COLUMN apodo VARCHAR(255) NULL AFTER nombre");
            // Renombrar la columna nombre actual a nombre_real si no existe
            $checkNombreReal = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'nombre_real'");
            if ($checkNombreReal->rowCount() === 0) {
                // Primero agregar nombre_real
                $conn->exec("ALTER TABLE usuarios ADD COLUMN nombre_real VARCHAR(255) NULL AFTER id");
                // Copiar datos de nombre a nombre_real
                $conn->exec("UPDATE usuarios SET nombre_real = nombre WHERE nombre_real IS NULL");
                // Ahora actualizar nombre con apodo para usuarios existentes (retrocompatibilidad)
                $conn->exec("UPDATE usuarios SET nombre = COALESCE(apodo, nombre) WHERE apodo IS NULL OR apodo = ''");
            }
        }
        
        // Verificar si existe nombre_real
        $checkNombreReal = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'nombre_real'");
        $nombreRealExists = $checkNombreReal->rowCount() > 0;
        
        if ($nombreRealExists) {
            // Insertar con nombre_real y apodo separados
            $stmt = $conn->prepare("INSERT INTO usuarios (nombre_real, nombre, apodo, email, password_hash, rol) VALUES (?, ?, ?, ?, ?, 'usuario')");
            $stmt->execute([$nombre, $apodo, $apodo, $email, $passwordHash]);
        } else {
            // Retrocompatibilidad: guardar nombre en nombre_real y apodo en nombre
            $stmt = $conn->prepare("INSERT INTO usuarios (nombre, apodo, email, password_hash, rol) VALUES (?, ?, ?, ?, 'usuario')");
            $stmt->execute([$apodo, $apodo, $email, $passwordHash]);
            // Agregar nombre_real después
            $conn->exec("ALTER TABLE usuarios ADD COLUMN nombre_real VARCHAR(255) NULL AFTER id");
            $conn->exec("UPDATE usuarios SET nombre_real = ? WHERE email = ?");
            $updateStmt = $conn->prepare("UPDATE usuarios SET nombre_real = ? WHERE email = ?");
            $updateStmt->execute([$nombre, $email]);
        }
        
        $userId = $conn->lastInsertId();
        
        if (!$userId) {
            throw new Exception('No se pudo obtener el ID del usuario insertado');
        }
        
        // Obtener usuario completo con ambos campos
        $stmt = $conn->prepare("SELECT id, nombre_real, nombre, apodo, email, rol, fecha_registro FROM usuarios WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            throw new Exception('No se pudo recuperar el usuario después del registro');
        }
        
        // Usar nombre_real si existe, sino usar nombre
        $nombreMostrar = !empty($user['nombre_real']) ? $user['nombre_real'] : $user['nombre'];
        // Usar apodo si existe, sino usar nombre
        $apodoMostrar = !empty($user['apodo']) ? $user['apodo'] : $user['nombre'];
        
        echo json_encode([
            'success' => true,
            'message' => 'Usuario registrado exitosamente',
            'user' => [
                'id' => $user['id'],
                'nombre' => $nombreMostrar,
                'apodo' => $apodoMostrar,
                'email' => $user['email'],
                'rol' => $user['rol'],
                'fechaRegistro' => $user['fecha_registro']
            ]
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false, 
            'message' => 'Error al guardar en la base de datos: ' . $e->getMessage()
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false, 
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
}

function handleLogin($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    // Crear tablas de advertencias y bans si no existen
    try {
        $createAdvertenciasTable = "
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
        ";
        $conn->exec($createAdvertenciasTable);
        
        $createBansTable = "
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
        ";
        $conn->exec($createBansTable);
    } catch (Exception $e) {
        // Continuar si hay error
    }
    
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Email y contraseña son requeridos']);
        return;
    }
    
    $email = strtolower($email);
    
    // Verificar si las columnas existen antes de consultarlas
    $checkNombreReal = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'nombre_real'");
    $nombreRealExists = $checkNombreReal->rowCount() > 0;
    
    if ($nombreRealExists) {
        $stmt = $conn->prepare("SELECT id, nombre, nombre_real, email, password_hash, rol, fecha_registro, activo FROM usuarios WHERE email = ?");
    } else {
        $stmt = $conn->prepare("SELECT id, nombre, email, password_hash, rol, fecha_registro, activo FROM usuarios WHERE email = ?");
    }
    
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Email o contraseña incorrectos']);
        return;
    }
    
    if (!$user['activo']) {
        echo json_encode(['success' => false, 'message' => 'Tu cuenta está desactivada']);
        return;
    }
    
    if (!password_verify($password, $user['password_hash'])) {
        echo json_encode(['success' => false, 'message' => 'Email o contraseña incorrectos']);
        return;
    }
    
    // VALIDACIÓN: Verificar que el usuario tenga nombre_real (nombre real)
    if ($nombreRealExists) {
        $nombreReal = trim($user['nombre_real'] ?? '');
        if (empty($nombreReal)) {
            echo json_encode([
                'success' => false, 
                'message' => 'Debes completar tu perfil con tu nombre real para acceder al sistema. Por favor, contacta al administrador.',
                'requiere_nombre' => true
            ]);
            return;
        }
    } else {
        // Si la columna no existe aún, verificar que tenga nombre (retrocompatibilidad)
        $nombre = trim($user['nombre'] ?? '');
        if (empty($nombre)) {
            echo json_encode([
                'success' => false, 
                'message' => 'Debes completar tu perfil con tu nombre para acceder al sistema. Por favor, contacta al administrador.',
                'requiere_nombre' => true
            ]);
            return;
        }
    }
    
    // Verificar si el usuario tiene un ban activo
    try {
        $banStmt = $conn->prepare("SELECT id, tipo, fecha_fin, motivo FROM bans_usuarios WHERE usuario_id = ? AND activo = TRUE AND (tipo = 'permanente' OR fecha_fin > NOW()) ORDER BY fecha_inicio DESC LIMIT 1");
        $banStmt->execute([$user['id']]);
        $ban = $banStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($ban) {
            if ($ban['tipo'] === 'permanente') {
                echo json_encode(['success' => false, 'message' => 'Tu cuenta está permanentemente baneada. Motivo: ' . $ban['motivo']]);
                return;
            } else {
                $fechaFin = date('d/m/Y H:i', strtotime($ban['fecha_fin']));
                echo json_encode(['success' => false, 'message' => 'Tu cuenta está temporalmente baneada hasta ' . $fechaFin . '. Motivo: ' . $ban['motivo']]);
                return;
            }
        }
    } catch (Exception $e) {
        // Si la tabla no existe, continuar
    }
    
    $stmt = $conn->prepare("UPDATE usuarios SET fecha_ultimo_acceso = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    // Obtener nombre_real si existe para devolverlo en la respuesta
    $nombreMostrar = $user['nombre'];
    if ($nombreRealExists && isset($user['nombre_real']) && !empty(trim($user['nombre_real']))) {
        $nombreMostrar = $user['nombre_real'];
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Login exitoso',
        'user' => [
            'id' => $user['id'],
            'nombre' => $nombreMostrar, // Usar nombre_real si existe, sino nombre
            'email' => $user['email'],
            'rol' => $user['rol'],
            'fechaRegistro' => $user['fecha_registro']
        ]
    ]);
}

// Función auxiliar para procesar resultados de media y extraer thumbnails
function processMediaRecords($mediaRecords) {
    $processed = [];
    foreach ($mediaRecords as $media) {
        $item = [
            'tipo' => $media['tipo'],
            'datos_base64' => $media['datos_base64'],
            'data' => $media['datos_base64'] // Alias para compatibilidad
        ];
        
        // Extraer thumbnail del campo descripcion si está disponible
        if (!empty($media['descripcion'])) {
            $descData = json_decode($media['descripcion'], true);
            if (is_array($descData) && isset($descData['thumbnail'])) {
                $item['thumbnail'] = $descData['thumbnail'];
            } else {
                // Si no es JSON con thumbnail, mantener descripcion original
                $item['description'] = $media['descripcion'];
            }
        }
        
        if (isset($media['orden'])) {
            $item['orden'] = $media['orden'];
        }
        
        $processed[] = $item;
    }
    return $processed;
}

// Función para detectar contenido ofensivo/obsceno
// Crear tabla de intentos de contenido ofensivo si no existe
function crearTablaIntentosOfensivos($conn) {
    $createTable = "
    CREATE TABLE IF NOT EXISTS intentos_contenido_ofensivo (
        id INT PRIMARY KEY AUTO_INCREMENT,
        usuario_id INT NULL,
        tipo_intento ENUM('registro_usuario', 'registro_animal', 'registro_ambiental') NOT NULL,
        campos_afectados VARCHAR(500) NOT NULL,
        contenido_intentado TEXT NOT NULL,
        ip_address VARCHAR(45) NULL,
        fecha_intento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_usuario (usuario_id),
        INDEX idx_tipo (tipo_intento),
        INDEX idx_fecha (fecha_intento),
        INDEX idx_ip (ip_address),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    try {
        $conn->exec($createTable);
    } catch (Exception $e) {
        // La tabla ya existe o hay un error, continuar
    }
}

function detectarContenidoOfensivo($texto) {
    if (empty($texto)) return false;
    
    // Lista de palabras ofensivas/obscenas (en español e inglés)
    $palabrasOfensivas = [
        // Palabras ofensivas comunes en español
        'puta', 'puto', 'joder', 'jodido', 'jodida', 'jodete', 'jodanse',
        'joto', 'jota', 'jotos', 'jotas',
        'hijo de puta', 'hdp', 'cabron', 'cabrón', 'cabrona', 'cabronazo',
        'mamada', 'mamadas', 'mamón', 'mamona', 'mamones', 'mamar', 'mamando',
        'pinche', 'pinches', 'chingar', 'chingado', 'chingada', 'chingate',
        'verga', 'vergas', 'verguero', 'verguera',
        'pendejo', 'pendeja', 'pendejos', 'pendejas',
        'culero', 'culera', 'culeros', 'culeras',
        'maricon', 'maricón', 'maricona', 'maricones',
        'culiar', 'coger', 'cojer', 'cojido', 'cojida',
        'chupar', 'chupada', 'chupadas', 'chupar verga', 'mamada de verga', 'mamar verga',
        'huevos', 'huevón', 'huevona', 'huevones',
        'pito', 'pitos', 'pene', 'penes',
        'vagina', 'vaginas', 'coño', 'coños',
        'tetas', 'teta', 'chichis', 'chichi',
        'nalgas', 'nalga', 'culo', 'culos',
        'mierda', 'mierdas', 'cagada', 'cagadas',
        'carajo', 'carajos',
        'hostia', 'hostias', 'ostia', 'ostias',
        'gilipollas', 'capullo', 'capullos', 'capulla', 'capullas',
        'zorra', 'zorras', 'zorro', 'zorros',
        'perra', 'perras', 'perro', 'perros',
        'bastardo', 'bastarda', 'bastardos', 'bastardas',
        'hijoputa', 'hijoputas',
        'maldito', 'maldita', 'malditos', 'malditas',
        // Palabras ofensivas comunes en inglés
        'fuck', 'fucking', 'fucked', 'fucker', 'fuckers', 'fuckin', 'fuckoff', 'fuckyou',
        'shit', 'shits', 'shitty', 'shitted', 'shitting', 'bullshit',
        'ass', 'asses', 'asshole', 'assholes', 'asshat', 'asswipe', 'smartass',
        'bitch', 'bitches', 'bitching', 'bitched', 'bitchy', 'sonofabitch',
        'bastard', 'bastards', 'damn', 'damned', 'damnit', 'goddamn',
        'hell', 'hells', 'crap', 'craps', 'crappy', 'crapper',
        'piss', 'pissed', 'pissing', 'pisser', 'pissedoff',
        'dick', 'dicks', 'dickhead', 'dickheads', 'dickface', 'dickwad',
        'cock', 'cocks', 'cocksucker', 'cocksuckers', 'cockhead',
        'pussy', 'pussies', 'puss', 'tits', 'titties', 'boobs', 'boobies', 'titty',
        'slut', 'sluts', 'slutty', 'whore', 'whores', 'whoring',
        'nigger', 'niggers', 'nigga', 'niggas', 'niggaz',
        'retard', 'retards', 'retarded', 'retardation',
        'fag', 'fags', 'faggot', 'faggots', 'faggy',
        'porn', 'porno', 'pornography', 'pornographic', 'pornstar',
        'xxx', 'nude', 'nudes', 'naked', 'nudity', 'nudist',
        'masturbate', 'masturbating', 'masturbated', 'masturbation', 'masturbator',
        'cum', 'cums', 'cumming', 'came', 'cumshot', 'cumdump',
        'blowjob', 'blowjobs', 'handjob', 'handjobs', 'rimjob',
        'rape', 'raped', 'raping', 'rapist', 'rapists', 'raped',
        'kill', 'killed', 'killing', 'killer', 'killers', 'murder', 'murdered',
        'die', 'died', 'dying', 'death', 'deaths', 'dead', 'deaths',
        'suicide', 'suicides', 'suicidal', 'killmyself',
        'bomb', 'bombs', 'bombing', 'bombed', 'bomber',
        'terrorist', 'terrorists', 'terrorism', 'terrorize',
        'weapon', 'weapons', 'gun', 'guns', 'shoot', 'shooting',
        'drug', 'drugs', 'cocaine', 'heroin', 'marijuana', 'weed', 'crack',
        // Palabras insultantes adicionales en inglés
        'douche', 'douchebag', 'douchebags', 'douchey',
        'scumbag', 'scumbags', 'scum',
        'motherfucker', 'motherfuckers', 'motherfucking',
        'dipshit', 'dipshits', 'dipstick',
        'jackass', 'jackasses',
        'idiot', 'idiots', 'idiotic',
        'moron', 'morons', 'moronic',
        'stupid', 'stupidity', 'stupidly',
        'dumb', 'dumbass', 'dumbasses', 'dumbfuck',
        'cunt', 'cunts', 'cunty',
        'twat', 'twats',
        'wanker', 'wankers', 'wanking',
        'tosser', 'tossers',
        'bellend', 'bellends',
        'arse', 'arses', 'arsehole', 'arseholes',
        'bugger', 'buggers', 'buggery',
        'sod', 'sodding', 'sodomite',
        'bloody', 'bloodyhell',
        'crap', 'craps', 'crappy',
        'freaking', 'freak', 'freaks',
        'screw', 'screwed', 'screwing', 'screwyou',
        'suck', 'sucks', 'sucking', 'sucker', 'suckers',
        'hate', 'hates', 'hating', 'hated',
        'loser', 'losers', 'losing',
        'pathetic', 'pathetically'
    ];
    
    // Normalizar texto para búsqueda (convertir a minúsculas)
    $textoLower = mb_strtolower($texto, 'UTF-8');
    
    // Buscar palabras ofensivas
    foreach ($palabrasOfensivas as $palabra) {
        $palabraLower = mb_strtolower(trim($palabra), 'UTF-8');
        
        // Para frases (palabras con espacios), buscar como substring
        if (strpos($palabraLower, ' ') !== false) {
            if (strpos($textoLower, $palabraLower) !== false) {
                return true;
            }
        } 
        // Para palabras de 4 o más caracteres, buscar como substring (para detectar en emails/contraseñas)
        elseif (strlen($palabraLower) >= 4) {
            // Buscar como substring para emails y contraseñas
            if (strpos($textoLower, $palabraLower) !== false) {
                return true;
            }
        } 
        // Para palabras cortas (3 caracteres o menos), buscar como palabra completa para evitar falsos positivos
        else {
            // Normalizar texto removiendo caracteres especiales pero manteniendo estructura
            $textoNormalizado = preg_replace('/[^a-záéíóúñü0-9]/i', ' ', $textoLower);
            $textoNormalizado = preg_replace('/\s+/', ' ', $textoNormalizado);
            if (preg_match('/\b' . preg_quote($palabraLower, '/') . '\b/i', $textoNormalizado)) {
                return true;
            }
        }
    }
    
    return false;
}

function handleSaveRecord($conn, $input, $method) {
    if ($method !== 'POST' && $method !== 'PUT') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    $nombre = trim($input['nombre'] ?? '');
    $especie = trim($input['especie'] ?? '');
    $fecha = $input['fecha'] ?? '';
    $latitud = $input['latitud'] ?? null;
    $longitud = $input['longitud'] ?? null;
    $notas = trim($input['notas'] ?? '');
    $media = $input['media'] ?? [];
    $recordId = $input['id'] ?? null;
    $usuarioId = $input['usuario_id'] ?? null;
    
    // Detectar contenido ofensivo en los campos de texto
    $camposParaRevisar = [
        'nombre' => $nombre,
        'especie' => $especie,
        'notas' => $notas
    ];
    
    $contenidoOfensivoEncontrado = [];
    foreach ($camposParaRevisar as $campo => $valor) {
        if (detectarContenidoOfensivo($valor)) {
            $contenidoOfensivoEncontrado[] = $campo;
        }
    }
    
    // Si se encuentra contenido ofensivo, rechazar y dar advertencia
    if (!empty($contenidoOfensivoEncontrado)) {
        
        // Crear tabla de intentos si no existe
        crearTablaIntentosOfensivos($conn);
        
        // Obtener IP del usuario
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        // Guardar intento de contenido ofensivo
        $camposAfectados = implode(', ', $contenidoOfensivoEncontrado);
        $contenidoIntentado = json_encode([
            'nombre' => $nombre,
            'especie' => $especie,
            'notas' => $notas
        ]);
        
        $stmt = $conn->prepare("
            INSERT INTO intentos_contenido_ofensivo 
            (usuario_id, tipo_intento, campos_afectados, contenido_intentado, ip_address) 
            VALUES (?, 'registro_animal', ?, ?, ?)
        ");
        $stmt->execute([$usuarioId, $camposAfectados, $contenidoIntentado, $ipAddress]);
        
        // Para usuarios reales, obtener información del usuario para dar advertencia
        $stmt = $conn->prepare("SELECT id, nombre, email FROM usuarios WHERE id = ?");
        $stmt->execute([$usuarioId]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($usuario) {
            // Contar intentos recientes de contenido ofensivo (últimas 24 horas)
            $stmt = $conn->prepare("
                SELECT COUNT(*) as intentos 
                FROM advertencias_usuarios 
                WHERE usuario_id = ? 
                AND motivo LIKE '%contenido ofensivo%' 
                AND fecha_advertencia > DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ");
            $stmt->execute([$usuarioId]);
            $intentosRecientes = $stmt->fetch(PDO::FETCH_ASSOC)['intentos'];
            
            // Crear tabla de advertencias si no existe
            $createAdvertenciasTable = "
            CREATE TABLE IF NOT EXISTS advertencias_usuarios (
                id INT PRIMARY KEY AUTO_INCREMENT,
                usuario_id INT NOT NULL,
                admin_id INT NOT NULL DEFAULT 1,
                motivo TEXT NOT NULL,
                fecha_advertencia DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                activa BOOLEAN DEFAULT TRUE,
                INDEX idx_usuario (usuario_id),
                INDEX idx_admin (admin_id),
                INDEX idx_activa (activa),
                INDEX idx_fecha (fecha_advertencia)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ";
            $conn->exec($createAdvertenciasTable);
            
            // Dar advertencia automática
            $camposAfectados = implode(', ', $contenidoOfensivoEncontrado);
            $motivoAdvertencia = "Intento de publicar contenido ofensivo/obsceno en los campos: $camposAfectados. El contenido fue rechazado automáticamente.";
            
            if ($intentosRecientes > 0) {
                $motivoAdvertencia .= " Este es el intento #" . ($intentosRecientes + 1) . " en las últimas 24 horas.";
            }
            
            $stmt = $conn->prepare("INSERT INTO advertencias_usuarios (usuario_id, admin_id, motivo) VALUES (?, 1, ?)");
            $stmt->execute([$usuarioId, $motivoAdvertencia]);
            
            $mensajeError = "Tu registro fue rechazado porque contiene lenguaje ofensivo o inapropiado en: " . implode(', ', $contenidoOfensivoEncontrado);
            
            if ($intentosRecientes > 0) {
                $mensajeError .= " Has recibido una advertencia por intentos repetidos de publicar contenido inapropiado.";
            } else {
                $mensajeError .= " Se te ha aplicado una advertencia automática.";
            }
            
            echo json_encode([
                'success' => false,
                'message' => $mensajeError,
                'contenido_ofensivo' => true,
                'campos_afectados' => $contenidoOfensivoEncontrado,
                'advertencia_aplicada' => true
            ]);
            return;
        }
    }
    
    if (empty($nombre) || empty($especie) || empty($fecha)) {
        echo json_encode(['success' => false, 'message' => 'Nombre, especie y fecha son requeridos']);
        return;
    }
    
    if ($latitud === null || $longitud === null || !is_numeric($latitud) || !is_numeric($longitud)) {
        echo json_encode(['success' => false, 'message' => 'Coordenadas válidas son requeridas']);
        return;
    }
    
    if (empty($usuarioId)) {
        echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
        return;
    }
    
    $conn->beginTransaction();
    
    try {
        if ($method === 'PUT' && $recordId) {
            $stmt = $conn->prepare("UPDATE registros_animales SET nombre = ?, especie = ?, fecha = ?, latitud = ?, longitud = ?, notas = ? WHERE id = ? AND usuario_id = ?");
            $stmt->execute([$nombre, $especie, $fecha, $latitud, $longitud, $notas, $recordId, $usuarioId]);
            
            if ($stmt->rowCount() === 0) {
                throw new Exception('Registro no encontrado o no tienes permiso para editarlo');
            }
            
            $newRecordId = $recordId;
            
            $stmt = $conn->prepare("DELETE FROM media_registros WHERE registro_id = ?");
            $stmt->execute([$recordId]);
            
        } else {
            $stmt = $conn->prepare("INSERT INTO registros_animales (usuario_id, nombre, especie, fecha, latitud, longitud, notas) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$usuarioId, $nombre, $especie, $fecha, $latitud, $longitud, $notas]);
            $newRecordId = $conn->lastInsertId();
        }
        
        if (!empty($media) && is_array($media)) {
            $stmt = $conn->prepare("INSERT INTO media_registros (registro_id, tipo, datos_base64, nombre_archivo, orden) VALUES (?, ?, ?, ?, ?)");
            
            foreach ($media as $index => $mediaItem) {
                if (is_string($mediaItem)) {
                    $tipo = strpos($mediaItem, 'data:image/') === 0 ? 'image' : 'video';
                    $nombreArchivo = 'archivo_' . $index . ($tipo === 'image' ? '.jpg' : '.mp4');
                    $stmt->execute([$newRecordId, $tipo, $mediaItem, $nombreArchivo, $index]);
                } elseif (is_array($mediaItem) && isset($mediaItem['data'])) {
                    $tipo = $mediaItem['type'] ?? (strpos($mediaItem['data'], 'data:image/') === 0 ? 'image' : 'video');
                    $nombreArchivo = $mediaItem['name'] ?? 'archivo_' . $index;
                    $stmt->execute([$newRecordId, $tipo, $mediaItem['data'], $nombreArchivo, $index]);
                }
            }
        }
        
        $conn->commit();
        
        // Obtener nombre_real y apodo del usuario
        $stmt = $conn->prepare("SELECT r.*, 
            COALESCE(u.nombre_real, u.nombre) as usuario_nombre_real,
            COALESCE(u.apodo, u.nombre) as usuario_nombre,
            u.apodo as usuario_apodo
            FROM registros_animales r 
            INNER JOIN usuarios u ON r.usuario_id = u.id 
            WHERE r.id = ?");
        $stmt->execute([$newRecordId]);
        $record = $stmt->fetch();
        
        $stmt = $conn->prepare("SELECT tipo, datos_base64, descripcion, orden FROM media_registros WHERE registro_id = ? ORDER BY orden");
        $stmt->execute([$newRecordId]);
        $mediaRecords = $stmt->fetchAll();
        
        // Procesar media con thumbnails
        $record['media'] = processMediaRecords($mediaRecords);
        
        echo json_encode([
            'success' => true,
            'message' => $method === 'PUT' ? 'Registro actualizado exitosamente' : 'Registro guardado exitosamente',
            'record' => $record
        ]);
        
    } catch (Exception $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function handleGetRecords($conn, $params) {
    $usuarioId = $params['usuario_id'] ?? null;
    $recordId = $params['id'] ?? null;
    
    if ($recordId) {
        // Obtener rol del usuario que hace la consulta
        $currentUserRol = null;
        if (isset($params['current_user_id'])) {
            $userStmt = $conn->prepare("SELECT rol FROM usuarios WHERE id = ?");
            $userStmt->execute([$params['current_user_id']]);
            $currentUser = $userStmt->fetch();
            $currentUserRol = $currentUser ? $currentUser['rol'] : null;
        }
        
        // Verificar si las columnas existen
        $checkNombreReal = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'nombre_real'");
        $nombreRealExists = $checkNombreReal->rowCount() > 0;
        $checkApodo = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'apodo'");
        $apodoExists = $checkApodo->rowCount() > 0;
        
        if ($nombreRealExists && $apodoExists) {
            $stmt = $conn->prepare("SELECT r.*, 
                COALESCE(u.nombre_real, u.nombre) as usuario_nombre_real,
                COALESCE(u.apodo, u.nombre) as usuario_nombre,
                u.apodo as usuario_apodo,
                u.email as usuario_email 
                FROM registros_animales r 
                INNER JOIN usuarios u ON r.usuario_id = u.id 
                WHERE r.id = ?");
        } else {
            $stmt = $conn->prepare("SELECT r.*, 
                u.nombre as usuario_nombre,
                u.nombre as usuario_nombre_real,
                u.nombre as usuario_apodo,
                u.email as usuario_email 
                FROM registros_animales r 
                INNER JOIN usuarios u ON r.usuario_id = u.id 
                WHERE r.id = ?");
        }
        
        $stmt->execute([$recordId]);
        $record = $stmt->fetch();
        
        if (!$record) {
            echo json_encode(['success' => false, 'message' => 'Registro no encontrado']);
            return;
        }
        
        // Si el usuario actual NO es admin, mostrar solo apodo
        if ($currentUserRol !== 'admin') {
            $record['usuario_nombre'] = $record['usuario_apodo'] ?? $record['usuario_nombre'];
        } else {
            $record['usuario_nombre'] = $record['usuario_nombre_real'] ?? $record['usuario_nombre'];
        }
        
        $stmt = $conn->prepare("SELECT tipo, datos_base64, descripcion, orden FROM media_registros WHERE registro_id = ? ORDER BY orden");
        $stmt->execute([$recordId]);
        $mediaRecords = $stmt->fetchAll();
        
        // Procesar media con thumbnails
        $record['media'] = processMediaRecords($mediaRecords);
        
        echo json_encode(['success' => true, 'record' => $record]);
        
    } else {
        // Obtener rol del usuario que hace la consulta para determinar qué mostrar
        $currentUserRol = null;
        if (isset($params['current_user_id'])) {
            $userStmt = $conn->prepare("SELECT rol FROM usuarios WHERE id = ?");
            $userStmt->execute([$params['current_user_id']]);
            $currentUser = $userStmt->fetch();
            $currentUserRol = $currentUser ? $currentUser['rol'] : null;
        }
        
        // Verificar si las columnas existen antes de usarlas
        $checkNombreReal = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'nombre_real'");
        $nombreRealExists = $checkNombreReal->rowCount() > 0;
        $checkApodo = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'apodo'");
        $apodoExists = $checkApodo->rowCount() > 0;
        
        // Construir consulta según qué columnas existen
        if ($nombreRealExists && $apodoExists) {
            $query = "SELECT r.*, 
                COALESCE(u.nombre_real, u.nombre) as usuario_nombre_real,
                COALESCE(u.apodo, u.nombre) as usuario_nombre,
                u.apodo as usuario_apodo,
                u.email as usuario_email 
                FROM registros_animales r 
                INNER JOIN usuarios u ON r.usuario_id = u.id";
        } else {
            // Retrocompatibilidad: solo usar nombre si las columnas no existen
            $query = "SELECT r.*, 
                u.nombre as usuario_nombre,
                u.nombre as usuario_nombre_real,
                u.nombre as usuario_apodo,
                u.email as usuario_email 
                FROM registros_animales r 
                INNER JOIN usuarios u ON r.usuario_id = u.id";
        }
        
        $queryParams = [];
        
        if ($usuarioId) {
            $query .= " WHERE r.usuario_id = ?";
            $queryParams[] = $usuarioId;
        }
        
        $query .= " ORDER BY r.fecha_creacion DESC";
        
        $stmt = $conn->prepare($query);
        $stmt->execute($queryParams);
        $records = $stmt->fetchAll();
        
        // Si el usuario actual NO es admin, mostrar solo apodo en lugar de nombre_real
        if ($currentUserRol !== 'admin') {
            foreach ($records as &$record) {
                // Usar apodo para usuarios no admin
                $record['usuario_nombre'] = $record['usuario_apodo'] ?? $record['usuario_nombre'];
            }
            unset($record);
        } else {
            // Para admin, usar nombre_real
            foreach ($records as &$record) {
                $record['usuario_nombre'] = $record['usuario_nombre_real'] ?? $record['usuario_nombre'];
            }
            unset($record);
        }
        
        foreach ($records as &$record) {
            $stmt = $conn->prepare("SELECT tipo, datos_base64, descripcion, orden FROM media_registros WHERE registro_id = ? ORDER BY orden LIMIT 1");
            $stmt->execute([$record['id']]);
            $media = $stmt->fetch();
            $record['media'] = $media ? processMediaRecords([$media]) : [];
            
            $stmt = $conn->prepare("SELECT tipo, datos_base64, descripcion, orden FROM media_registros WHERE registro_id = ? ORDER BY orden");
            $stmt->execute([$record['id']]);
            $allMedia = $stmt->fetchAll();
            $record['all_media'] = processMediaRecords($allMedia);
        }
        
        echo json_encode(['success' => true, 'records' => $records]);
    }
}

function handleDeleteRecord($conn, $input, $method) {
    if ($method !== 'DELETE' && $method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    // DEBUG: Verificar qué se está recibiendo
    error_log("🔍 [handleDeleteRecord] Input recibido: " . json_encode($input));
    error_log("🔍 [handleDeleteRecord] GET: " . json_encode($_GET));
    error_log("🔍 [handleDeleteRecord] POST: " . json_encode($_POST));
    error_log("🔍 [handleDeleteRecord] Method: " . $method);
    
    // Asegurarse de que el input sea un array
    if (!is_array($input)) {
        $input = [];
    }
    
    $recordId = $input['id'] ?? $_GET['id'] ?? null;
    $usuarioId = $input['usuario_id'] ?? null;
    $token = $input['token'] ?? $_GET['token'] ?? null;
    // Verificar is_admin como booleano o string "true"
    $isAdmin = isset($input['is_admin']) && ($input['is_admin'] === true || $input['is_admin'] === 'true' || $input['is_admin'] === 1 || $input['is_admin'] === '1');
    
    error_log("🔍 [handleDeleteRecord] RecordId: " . ($recordId ?? 'null'));
    error_log("🔍 [handleDeleteRecord] Token recibido: " . ($token ? substr($token, 0, 30) . '...' : 'VACÍO'));
    error_log("🔍 [handleDeleteRecord] isAdmin: " . ($isAdmin ? 'true' : 'false'));
    
    if (empty($recordId)) {
        echo json_encode(['success' => false, 'message' => 'ID de registro requerido']);
        return;
    }
    
    // Convertir a int para comparación correcta
    $recordId = (int)$recordId;
    
    // Verificar si es un administrador eliminando
    // Primero intentar verificar el token si está presente (puede venir de admin)
    $admin = null;
    if (!empty($token)) {
        error_log("🔍 [handleDeleteRecord] Verificando token...");
        $admin = verifyAdminToken($conn, $token);
        error_log("🔍 [handleDeleteRecord] Resultado verificación: " . ($admin ? 'ADMIN VÁLIDO (ID: ' . $admin['id'] . ')' : 'NULL'));
        
        // Si hay token pero no es admin válido y se marcó como is_admin, rechazar
        if ($isAdmin && !$admin) {
            error_log("❌ [handleDeleteRecord] Token inválido o expirado");
            echo json_encode(['success' => false, 'message' => 'Token de administrador inválido o expirado']);
            return;
        }
    } else {
        error_log("⚠️ [handleDeleteRecord] Token vacío o no recibido");
    }
    
    // Si no es admin, verificar que el usuario esté autenticado y tenga permiso
    if (!$admin) {
        error_log("⚠️ [handleDeleteRecord] No hay admin verificado");
        if (empty($usuarioId)) {
            error_log("❌ [handleDeleteRecord] No hay admin ni usuarioId - Usuario no autenticado");
            echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
            return;
        }
        
        $usuarioId = (int)$usuarioId;
    } else {
        error_log("✅ [handleDeleteRecord] Admin verificado correctamente");
    }
    
    // Verificar que el registro existe
    $stmt = $conn->prepare("SELECT id, usuario_id FROM registros_animales WHERE id = ?");
    $stmt->execute([$recordId]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$record) {
        echo json_encode(['success' => false, 'message' => 'Registro no encontrado']);
        return;
    }
    
    // Si no es admin, verificar que el registro pertenece al usuario
    if (!$admin) {
        $existingUserId = (int)$record['usuario_id'];
        if ($existingUserId !== $usuarioId) {
            echo json_encode(['success' => false, 'message' => 'No tienes permiso para eliminar este registro']);
            return;
        }
    }
    
    // Iniciar transacción para asegurar que todo se elimine correctamente
    $conn->beginTransaction();
    
    try {
        // Eliminar registros relacionados primero (aunque CASCADE debería hacerlo, lo hacemos explícitamente)
        // 1. Eliminar media_registros
        $stmt = $conn->prepare("DELETE FROM media_registros WHERE registro_id = ?");
        $stmt->execute([$recordId]);
        
        // 2. Eliminar comentarios relacionados
        $stmt = $conn->prepare("DELETE FROM comentarios_registros WHERE registro_id = ?");
        $stmt->execute([$recordId]);
        
        // 3. Eliminar el registro principal
        // Si es admin, puede eliminar cualquier registro sin verificar usuario_id
        if ($admin) {
            $stmt = $conn->prepare("DELETE FROM registros_animales WHERE id = ?");
            $stmt->execute([$recordId]);
        } else {
            $stmt = $conn->prepare("DELETE FROM registros_animales WHERE id = ? AND usuario_id = ?");
            $stmt->execute([$recordId, $usuarioId]);
        }
        
        if ($stmt->rowCount() === 0) {
            throw new Exception('No se pudo eliminar el registro');
        }
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Registro eliminado exitosamente']);
        
    } catch (Exception $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        echo json_encode(['success' => false, 'message' => 'Error al eliminar: ' . $e->getMessage()]);
    }
}

// Obtener todas las categorías activas
function handleGetCategorias($conn) {
    $stmt = $conn->query("SELECT id, codigo, nombre, descripcion, orden FROM categorias WHERE activa = 1 ORDER BY orden ASC");
    $categorias = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Asegurar codificación UTF-8
    foreach ($categorias as &$cat) {
        $cat['nombre'] = mb_convert_encoding($cat['nombre'], 'UTF-8', 'UTF-8');
        $cat['descripcion'] = mb_convert_encoding($cat['descripcion'], 'UTF-8', 'UTF-8');
    }
    unset($cat);
    
    echo json_encode([
        'success' => true,
        'categorias' => $categorias
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

// Obtener subcategorías de una categoría
function handleGetSubcategorias($conn, $params) {
    $categoriaId = $params['categoria_id'] ?? null;
    
    if (!$categoriaId) {
        echo json_encode(['success' => false, 'message' => 'ID de categoría requerido']);
        return;
    }
    
    $stmt = $conn->prepare("SELECT id, codigo, nombre, descripcion, orden FROM subcategorias WHERE categoria_id = ? AND activa = 1 ORDER BY orden ASC");
    $stmt->execute([$categoriaId]);
    $subcategorias = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Asegurar codificación UTF-8
    foreach ($subcategorias as &$sub) {
        $sub['nombre'] = mb_convert_encoding($sub['nombre'], 'UTF-8', 'UTF-8');
        $sub['descripcion'] = mb_convert_encoding($sub['descripcion'], 'UTF-8', 'UTF-8');
    }
    unset($sub);
    
    echo json_encode([
        'success' => true,
        'subcategorias' => $subcategorias
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

// Guardar registro ambiental
function handleSaveRegistroAmbiental($conn, $input, $method) {
    if ($method !== 'POST' && $method !== 'PUT') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    $usuarioId = $input['usuario_id'] ?? null;
    $categoriaId = $input['categoria_id'] ?? null;
    $subcategoriaId = $input['subcategoria_id'] ?? null;
    $registroId = $input['id'] ?? null;
    
    // Log para depuración (solo en desarrollo)
    error_log("handleSaveRegistroAmbiental - Método: $method, RegistroID: $registroId, UsuarioID: $usuarioId");
    
    // Campos generales
    $fecha = $input['fecha'] ?? date('Y-m-d');
    $hora = $input['hora'] ?? null;
    $responsable = $input['responsable'] ?? null;
    $brigada = $input['brigada'] ?? null;
    $latitud = $input['latitud'] ?? null;
    $longitud = $input['longitud'] ?? null;
    $comunidad = $input['comunidad'] ?? null;
    $sitio = $input['sitio'] ?? null;
    $tipoActividad = $input['tipo_actividad'] ?? null;
    $descripcionBreve = $input['descripcion_breve'] ?? null;
    $observaciones = $input['observaciones'] ?? null;
    $materialesUtilizados = $input['materiales_utilizados'] ?? null;
    $numeroParticipantes = $input['numero_participantes'] ?? null;
    $notas = $input['notas'] ?? null;
    $datosEspecificos = isset($input['datos_especificos']) ? json_encode($input['datos_especificos']) : null;
    $media = $input['media'] ?? [];
    
    // Detectar contenido ofensivo en los campos de texto
    $camposParaRevisar = [
        'nombre' => $nombre ?? '',
        'especie' => $especie ?? '',
        'responsable' => $responsable ?? '',
        'brigada' => $brigada ?? '',
        'comunidad' => $comunidad ?? '',
        'sitio' => $sitio ?? '',
        'tipo_actividad' => $tipoActividad ?? '',
        'descripcion_breve' => $descripcionBreve ?? '',
        'observaciones' => $observaciones ?? '',
        'materiales_utilizados' => $materialesUtilizados ?? '',
        'notas' => $notas ?? ''
    ];
    
    $contenidoOfensivoEncontrado = [];
    foreach ($camposParaRevisar as $campo => $valor) {
        if (!empty($valor) && detectarContenidoOfensivo($valor)) {
            $contenidoOfensivoEncontrado[] = $campo;
        }
    }
    
    // Si se encuentra contenido ofensivo, rechazar y dar advertencia
    if (!empty($contenidoOfensivoEncontrado)) {
        
        // Crear tabla de intentos si no existe
        crearTablaIntentosOfensivos($conn);
        
        // Obtener IP del usuario
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        // Guardar intento de contenido ofensivo
        $camposAfectados = implode(', ', $contenidoOfensivoEncontrado);
        $contenidoIntentado = json_encode([
            'tipo_actividad' => $input['tipo_actividad'] ?? '',
            'descripcion_breve' => $input['descripcion_breve'] ?? '',
            'observaciones' => $input['observaciones'] ?? '',
            'materiales_utilizados' => $input['materiales_utilizados'] ?? '',
            'notas' => $input['notas'] ?? ''
        ]);
        
        $stmt = $conn->prepare("
            INSERT INTO intentos_contenido_ofensivo 
            (usuario_id, tipo_intento, campos_afectados, contenido_intentado, ip_address) 
            VALUES (?, 'registro_ambiental', ?, ?, ?)
        ");
        $stmt->execute([$usuarioId, $camposAfectados, $contenidoIntentado, $ipAddress]);
        
        // Para usuarios reales, obtener información del usuario para dar advertencia
        $stmt = $conn->prepare("SELECT id, nombre, email FROM usuarios WHERE id = ?");
        $stmt->execute([$usuarioId]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($usuario) {
            // Contar intentos recientes de contenido ofensivo (últimas 24 horas)
            $stmt = $conn->prepare("
                SELECT COUNT(*) as intentos 
                FROM advertencias_usuarios 
                WHERE usuario_id = ? 
                AND motivo LIKE '%contenido ofensivo%' 
                AND fecha_advertencia > DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ");
            $stmt->execute([$usuarioId]);
            $intentosRecientes = $stmt->fetch(PDO::FETCH_ASSOC)['intentos'];
            
            // Crear tabla de advertencias si no existe
            $createAdvertenciasTable = "
            CREATE TABLE IF NOT EXISTS advertencias_usuarios (
                id INT PRIMARY KEY AUTO_INCREMENT,
                usuario_id INT NOT NULL,
                admin_id INT NOT NULL DEFAULT 1,
                motivo TEXT NOT NULL,
                fecha_advertencia DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                activa BOOLEAN DEFAULT TRUE,
                INDEX idx_usuario (usuario_id),
                INDEX idx_admin (admin_id),
                INDEX idx_activa (activa),
                INDEX idx_fecha (fecha_advertencia)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ";
            $conn->exec($createAdvertenciasTable);
            
            // Dar advertencia automática
            $camposAfectados = implode(', ', $contenidoOfensivoEncontrado);
            $motivoAdvertencia = "Intento de publicar contenido ofensivo/obsceno en los campos: $camposAfectados. El contenido fue rechazado automáticamente.";
            
            if ($intentosRecientes > 0) {
                $motivoAdvertencia .= " Este es el intento #" . ($intentosRecientes + 1) . " en las últimas 24 horas.";
            }
            
            $stmt = $conn->prepare("INSERT INTO advertencias_usuarios (usuario_id, admin_id, motivo) VALUES (?, 1, ?)");
            $stmt->execute([$usuarioId, $motivoAdvertencia]);
            
            $mensajeError = "Tu registro fue rechazado porque contiene lenguaje ofensivo o inapropiado en: " . implode(', ', $contenidoOfensivoEncontrado);
            
            if ($intentosRecientes > 0) {
                $mensajeError .= " Has recibido una advertencia por intentos repetidos de publicar contenido inapropiado.";
            } else {
                $mensajeError .= " Se te ha aplicado una advertencia automática.";
            }
            
            echo json_encode([
                'success' => false,
                'message' => $mensajeError,
                'contenido_ofensivo' => true,
                'campos_afectados' => $contenidoOfensivoEncontrado,
                'advertencia_aplicada' => true
            ]);
            return;
        }
    }
    
    if (empty($usuarioId) || empty($categoriaId)) {
        echo json_encode(['success' => false, 'message' => 'Usuario y categoría son requeridos']);
        return;
    }
    
    if ($latitud === null || $longitud === null || !is_numeric($latitud) || !is_numeric($longitud)) {
        echo json_encode(['success' => false, 'message' => 'Coordenadas válidas son requeridas']);
        return;
    }
    
    $conn->beginTransaction();
    
    try {
        // Campos opcionales (para compatibilidad)
        $nombre = $input['nombre'] ?? null;
        $especie = $input['especie'] ?? null;
        
        if ($method === 'PUT' && $registroId) {
            // Verificar que el registro existe y pertenece al usuario
            $checkStmt = $conn->prepare("SELECT id, usuario_id FROM registros_animales WHERE id = ?");
            $checkStmt->execute([$registroId]);
            $existingRecord = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$existingRecord) {
                throw new Exception("Registro con ID $registroId no encontrado");
            }
            
            // Convertir a int para comparación correcta
            $existingUserId = (int)$existingRecord['usuario_id'];
            $usuarioIdInt = (int)$usuarioId;
            
            if ($existingUserId !== $usuarioIdInt) {
                throw new Exception("No tienes permiso para editar este registro. El registro pertenece a otro usuario.");
            }
            
            // Convertir valores a los tipos correctos
            $categoriaId = $categoriaId ? (int)$categoriaId : null;
            $subcategoriaId = $subcategoriaId ? (int)$subcategoriaId : null;
            $numeroParticipantes = $numeroParticipantes ? (int)$numeroParticipantes : null;
            $latitud = (float)$latitud;
            $longitud = (float)$longitud;
            $registroId = (int)$registroId;
            
            $stmt = $conn->prepare("UPDATE registros_animales SET 
                categoria_id = ?, subcategoria_id = ?, fecha = ?, hora = ?, responsable = ?, 
                brigada = ?, latitud = ?, longitud = ?, comunidad = ?, sitio = ?, 
                tipo_actividad = ?, descripcion_breve = ?, observaciones = ?, 
                materiales_utilizados = ?, numero_participantes = ?, datos_especificos = ?,
                nombre = ?, especie = ?, notas = ?
                WHERE id = ? AND usuario_id = ?");
            $stmt->execute([
                $categoriaId, $subcategoriaId, $fecha, $hora, $responsable, $brigada,
                $latitud, $longitud, $comunidad, $sitio, $tipoActividad,
                $descripcionBreve, $observaciones, $materialesUtilizados, $numeroParticipantes,
                $datosEspecificos, $nombre, $especie, $notas, $registroId, $usuarioIdInt
            ]);
            
            // Si rowCount es 0, puede ser que los datos no cambiaron, pero eso está bien
            // Solo lanzar error si realmente hay un problema
            if ($stmt->rowCount() === 0) {
                // Verificar si el registro todavía existe y pertenece al usuario
                $verifyStmt = $conn->prepare("SELECT id FROM registros_animales WHERE id = ? AND usuario_id = ?");
                $verifyStmt->execute([$registroId, $usuarioIdInt]);
                $stillExists = $verifyStmt->fetch();
                
                if (!$stillExists) {
                    throw new Exception("El registro ya no existe o no tienes permiso para editarlo.");
                }
                // Si existe, probablemente los datos no cambiaron, lo cual está bien
                // Continuar con el flujo normal
            }
            
            $newRecordId = $registroId;
            
            // Eliminar media anterior
            $stmt = $conn->prepare("DELETE FROM media_registros WHERE registro_id = ?");
            $stmt->execute([$registroId]);
        } else {
            // Campos opcionales (para compatibilidad)
            $nombre = $input['nombre'] ?? null;
            $especie = $input['especie'] ?? null;
            
            $stmt = $conn->prepare("INSERT INTO registros_animales 
                (usuario_id, categoria_id, subcategoria_id, fecha, hora, responsable, brigada,
                latitud, longitud, comunidad, sitio, tipo_actividad, descripcion_breve,
                observaciones, materiales_utilizados, numero_participantes, datos_especificos,
                nombre, especie, notas)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $usuarioId, $categoriaId, $subcategoriaId, $fecha, $hora, $responsable, $brigada,
                $latitud, $longitud, $comunidad, $sitio, $tipoActividad,
                $descripcionBreve, $observaciones, $materialesUtilizados, $numeroParticipantes,
                $datosEspecificos, $nombre, $especie, $notas
            ]);
            $newRecordId = $conn->lastInsertId();
        }
        
        // Guardar media (con soporte para thumbnails)
        if (!empty($media) && is_array($media)) {
            $stmt = $conn->prepare("INSERT INTO media_registros (registro_id, tipo, datos_base64, nombre_archivo, descripcion, orden) VALUES (?, ?, ?, ?, ?, ?)");
            
            foreach ($media as $index => $mediaItem) {
                if (is_string($mediaItem)) {
                    // Formato antiguo: solo string base64
                    $tipo = 'image';
                    if (strpos($mediaItem, 'data:video/') === 0) $tipo = 'video';
                    if (strpos($mediaItem, 'data:audio/') === 0) $tipo = 'audio';
                    $nombreArchivo = 'archivo_' . $index . ($tipo === 'image' ? '.jpg' : ($tipo === 'video' ? '.mp4' : '.mp3'));
                    $stmt->execute([$newRecordId, $tipo, $mediaItem, $nombreArchivo, null, $index]);
                } elseif (is_array($mediaItem) && isset($mediaItem['data'])) {
                    // Formato nuevo: objeto con data y posiblemente thumbnail
                    $tipo = $mediaItem['type'] ?? 'image';
                    $nombreArchivo = $mediaItem['name'] ?? 'archivo_' . $index;
                    
                    // Almacenar thumbnail en descripcion si está disponible
                    // Formato: JSON con thumbnail o null si no hay thumbnail
                    $descripcion = null;
                    if (!empty($mediaItem['thumbnail'])) {
                        // Almacenar thumbnail en descripcion como JSON
                        $descripcion = json_encode(['thumbnail' => $mediaItem['thumbnail']]);
                    } elseif (isset($mediaItem['description'])) {
                        // Mantener compatibilidad con descripcion existente
                        $descripcion = $mediaItem['description'];
                    }
                    
                    $stmt->execute([$newRecordId, $tipo, $mediaItem['data'], $nombreArchivo, $descripcion, $index]);
                }
            }
        }
        
        $conn->commit();
        
        // Verificar si las columnas existen
        $checkNombreReal = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'nombre_real'");
        $nombreRealExists = $checkNombreReal->rowCount() > 0;
        $checkApodo = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'apodo'");
        $apodoExists = $checkApodo->rowCount() > 0;
        
        if ($nombreRealExists && $apodoExists) {
            $stmt = $conn->prepare("SELECT r.*, 
                COALESCE(u.nombre_real, u.nombre) as usuario_nombre_real,
                COALESCE(u.apodo, u.nombre) as usuario_nombre,
                u.apodo as usuario_apodo,
                u.email as usuario_email, 
                c.nombre as categoria_nombre, 
                sc.nombre as subcategoria_nombre 
                FROM registros_animales r 
                INNER JOIN usuarios u ON r.usuario_id = u.id 
                LEFT JOIN categorias c ON r.categoria_id = c.id 
                LEFT JOIN subcategorias sc ON r.subcategoria_id = sc.id 
                WHERE r.id = ?");
        } else {
            $stmt = $conn->prepare("SELECT r.*, 
                u.nombre as usuario_nombre,
                u.nombre as usuario_nombre_real,
                u.nombre as usuario_apodo,
                u.email as usuario_email, 
                c.nombre as categoria_nombre, 
                sc.nombre as subcategoria_nombre 
                FROM registros_animales r 
                INNER JOIN usuarios u ON r.usuario_id = u.id 
                LEFT JOIN categorias c ON r.categoria_id = c.id 
                LEFT JOIN subcategorias sc ON r.subcategoria_id = sc.id 
                WHERE r.id = ?");
        }
        
        $stmt->execute([$newRecordId]);
        $record = $stmt->fetch();
        
        // Determinar qué mostrar según el rol del usuario que creó el registro
        // Por defecto mostrar apodo (para usuarios normales)
        $record['usuario_nombre'] = $record['usuario_apodo'] ?? $record['usuario_nombre'];
        
        // Obtener media (con thumbnails)
        $stmt = $conn->prepare("SELECT tipo, datos_base64, descripcion, orden FROM media_registros WHERE registro_id = ? ORDER BY orden");
        $stmt->execute([$newRecordId]);
        $mediaRecords = $stmt->fetchAll();
        $record['media'] = processMediaRecords($mediaRecords);
        
        echo json_encode([
            'success' => true,
            'message' => $method === 'PUT' ? 'Registro actualizado exitosamente' : 'Registro guardado exitosamente',
            'record' => $record
        ]);
        
    } catch (Exception $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Obtener registros ambientales
function handleGetRegistrosAmbientales($conn, $params) {
    $usuarioId = $params['usuario_id'] ?? null;
    $categoriaId = $params['categoria_id'] ?? null;
    $subcategoriaId = $params['subcategoria_id'] ?? null;
    $registroId = $params['id'] ?? null;
    $fechaDesde = $params['fecha_desde'] ?? null;
    $fechaHasta = $params['fecha_hasta'] ?? null;
    
    // Obtener rol del usuario que hace la consulta
    $currentUserRol = null;
    if (isset($params['current_user_id'])) {
        $userStmt = $conn->prepare("SELECT rol FROM usuarios WHERE id = ?");
        $userStmt->execute([$params['current_user_id']]);
        $currentUser = $userStmt->fetch();
        $currentUserRol = $currentUser ? $currentUser['rol'] : null;
    }
    
    // Verificar si las columnas existen
    $checkNombreReal = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'nombre_real'");
    $nombreRealExists = $checkNombreReal->rowCount() > 0;
    $checkApodo = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'apodo'");
    $apodoExists = $checkApodo->rowCount() > 0;
    
    if ($registroId) {
        if ($nombreRealExists && $apodoExists) {
            $stmt = $conn->prepare("SELECT r.*, 
                COALESCE(u.nombre_real, u.nombre) as usuario_nombre_real,
                COALESCE(u.apodo, u.nombre) as usuario_nombre,
                u.apodo as usuario_apodo,
                u.email as usuario_email, 
                c.nombre as categoria_nombre, 
                sc.nombre as subcategoria_nombre 
                FROM registros_animales r 
                INNER JOIN usuarios u ON r.usuario_id = u.id 
                LEFT JOIN categorias c ON r.categoria_id = c.id 
                LEFT JOIN subcategorias sc ON r.subcategoria_id = sc.id 
                WHERE r.id = ?");
        } else {
            $stmt = $conn->prepare("SELECT r.*, 
                u.nombre as usuario_nombre,
                u.nombre as usuario_nombre_real,
                u.nombre as usuario_apodo,
                u.email as usuario_email, 
                c.nombre as categoria_nombre, 
                sc.nombre as subcategoria_nombre 
                FROM registros_animales r 
                INNER JOIN usuarios u ON r.usuario_id = u.id 
                LEFT JOIN categorias c ON r.categoria_id = c.id 
                LEFT JOIN subcategorias sc ON r.subcategoria_id = sc.id 
                WHERE r.id = ?");
        }
        
        $stmt->execute([$registroId]);
        $record = $stmt->fetch();
        
        if (!$record) {
            echo json_encode(['success' => false, 'message' => 'Registro no encontrado']);
            return;
        }
        
        // Si el usuario actual NO es admin, mostrar solo apodo
        if ($currentUserRol !== 'admin') {
            $record['usuario_nombre'] = $record['usuario_apodo'] ?? $record['usuario_nombre'];
        } else {
            $record['usuario_nombre'] = $record['usuario_nombre_real'] ?? $record['usuario_nombre'];
        }
        
        $stmt = $conn->prepare("SELECT tipo, datos_base64, descripcion, orden FROM media_registros WHERE registro_id = ? ORDER BY orden");
        $stmt->execute([$registroId]);
        $mediaRecords = $stmt->fetchAll();
        $record['media'] = processMediaRecords($mediaRecords);
        
        echo json_encode(['success' => true, 'record' => $record]);
    } else {
        // Construir consulta según qué columnas existen
        if ($nombreRealExists && $apodoExists) {
            $query = "SELECT r.*, 
                COALESCE(u.nombre_real, u.nombre) as usuario_nombre_real,
                COALESCE(u.apodo, u.nombre) as usuario_nombre,
                u.apodo as usuario_apodo,
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
                u.nombre as usuario_nombre_real,
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
        
        if ($usuarioId) {
            $query .= " AND r.usuario_id = ?";
            $queryParams[] = $usuarioId;
        }
        
        if ($categoriaId) {
            $query .= " AND r.categoria_id = ?";
            $queryParams[] = $categoriaId;
        }
        
        if ($subcategoriaId) {
            $query .= " AND r.subcategoria_id = ?";
            $queryParams[] = $subcategoriaId;
        }
        
        if ($fechaDesde) {
            $query .= " AND r.fecha >= ?";
            $queryParams[] = $fechaDesde;
        }
        
        if ($fechaHasta) {
            $query .= " AND r.fecha <= ?";
            $queryParams[] = $fechaHasta;
        }
        
        $query .= " ORDER BY r.fecha DESC, r.hora DESC";
        
        $stmt = $conn->prepare($query);
        $stmt->execute($queryParams);
        $records = $stmt->fetchAll();
        
        // Si el usuario actual NO es admin, mostrar solo apodo
        if ($currentUserRol !== 'admin') {
            foreach ($records as &$record) {
                $record['usuario_nombre'] = $record['usuario_apodo'] ?? $record['usuario_nombre'];
            }
            unset($record);
        } else {
            // Para admin, usar nombre_real
            foreach ($records as &$record) {
                $record['usuario_nombre'] = $record['usuario_nombre_real'] ?? $record['usuario_nombre'];
            }
            unset($record);
        }
        
        // Agregar media a cada registro
        foreach ($records as &$record) {
            $stmt = $conn->prepare("SELECT tipo, datos_base64, descripcion, orden FROM media_registros WHERE registro_id = ? ORDER BY orden LIMIT 1");
            $stmt->execute([$record['id']]);
            $media = $stmt->fetch();
            $record['media_preview'] = $media ? processMediaRecords([$media]) : [];
            
            $stmt = $conn->prepare("SELECT tipo, datos_base64, descripcion, orden FROM media_registros WHERE registro_id = ? ORDER BY orden");
            $stmt->execute([$record['id']]);
            $allMedia = $stmt->fetchAll();
            $record['media'] = processMediaRecords($allMedia);
        }
        
        echo json_encode(['success' => true, 'records' => $records]);
    }
}

function handleGetUserInfo($conn, $params) {
    $userId = $params['user_id'] ?? null;
    
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
        return;
    }
    
    try {
        // Verificar si las columnas existen
        $checkNombreReal = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'nombre_real'");
        $nombreRealExists = $checkNombreReal->rowCount() > 0;
        $checkApodo = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'apodo'");
        $apodoExists = $checkApodo->rowCount() > 0;
        
        if ($nombreRealExists && $apodoExists) {
            $stmt = $conn->prepare("SELECT id, nombre, nombre_real, apodo, email, rol, fecha_registro, activo FROM usuarios WHERE id = ?");
        } else {
            $stmt = $conn->prepare("SELECT id, nombre, email, rol, fecha_registro, activo FROM usuarios WHERE id = ?");
        }
        
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            return;
        }
        
        // Preparar respuesta con nombre_real si existe
        $userData = [
            'id' => $user['id'],
            'nombre' => $user['nombre'],
            'email' => $user['email'],
            'rol' => $user['rol'],
            'fechaRegistro' => $user['fecha_registro'],
            'activo' => (bool)$user['activo']
        ];
        
        if ($nombreRealExists && isset($user['nombre_real'])) {
            $userData['nombre_real'] = $user['nombre_real'];
        }
        if ($apodoExists && isset($user['apodo'])) {
            $userData['apodo'] = $user['apodo'];
        }
        
        echo json_encode([
            'success' => true,
            'user' => $userData
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function handleAdminLogin($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Email y contraseña son requeridos']);
        return;
    }
    
    $email = strtolower($email);
    
    // Crear tabla usuarios_administradores si no existe
    try {
        $createTableSQL = "
        CREATE TABLE IF NOT EXISTS usuarios_administradores (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nombre VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            activo BOOLEAN DEFAULT TRUE,
            fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            fecha_ultimo_acceso DATETIME NULL,
            INDEX idx_email (email),
            INDEX idx_activo (activo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        $conn->exec($createTableSQL);
        
        // Verificar si la tabla está vacía y crear los administradores por defecto
        $checkCount = $conn->query("SELECT COUNT(*) as total FROM usuarios_administradores");
        $count = $checkCount->fetch(PDO::FETCH_ASSOC)['total'];
        
        if ($count == 0) {
            // Crear los administradores por defecto
            $administradores = [
                ['nombre' => 'Allen', 'email' => 'allensamirsm@gmail.com', 'password' => 'HOLACO'],
                ['nombre' => 'Aaron', 'email' => 'aaron14eamm@gmail.com', 'password' => 'ErikAdmin0209']
            ];
            
            $insertStmt = $conn->prepare("INSERT INTO usuarios_administradores (nombre, email, password_hash, activo) VALUES (?, ?, ?, TRUE)");
            
            foreach ($administradores as $admin) {
                try {
                    $passwordHash = password_hash($admin['password'], PASSWORD_DEFAULT);
                    $insertStmt->execute([$admin['nombre'], strtolower($admin['email']), $passwordHash]);
                } catch (Exception $e) {
                    // Ignorar errores de inserción (puede que ya existan)
                }
            }
        }
    } catch (Exception $e) {
        // Si falla la creación, continuar (puede que ya exista)
    }
    
    // Validar que el usuario esté en la tabla usuarios_administradores
    $stmt = $conn->prepare("SELECT id, nombre, email, password_hash, activo FROM usuarios_administradores WHERE email = ?");
    $stmt->execute([$email]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin) {
        echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas o no tienes permisos de administrador']);
        return;
    }
    
    if (!$admin['activo']) {
        echo json_encode(['success' => false, 'message' => 'Tu cuenta de administrador está desactivada']);
        return;
    }
    
    if (!password_verify($password, $admin['password_hash'])) {
        echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas']);
        return;
    }
    
    // Verificar si el administrador tiene un ban activo (por si acaso)
    try {
        $banStmt = $conn->prepare("SELECT id, tipo, fecha_fin, motivo FROM bans_usuarios WHERE usuario_id = (SELECT id FROM usuarios WHERE email = ?) AND activo = TRUE AND (tipo = 'permanente' OR fecha_fin > NOW())");
        $banStmt->execute([$email]);
        $ban = $banStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($ban) {
            if ($ban['tipo'] === 'permanente') {
                echo json_encode(['success' => false, 'message' => 'Tu cuenta de administrador está permanentemente baneada']);
                return;
            } else {
                echo json_encode(['success' => false, 'message' => 'Tu cuenta de administrador está temporalmente baneada hasta ' . date('d/m/Y H:i', strtotime($ban['fecha_fin']))]);
                return;
            }
        }
    } catch (Exception $e) {
        // Si la tabla no existe, continuar (se creará después)
    }
    
    // Generar token único
    $token = bin2hex(random_bytes(32));
    
    // Calcular fecha de expiración (24 horas)
    $fechaExpiracion = date('Y-m-d H:i:s', strtotime('+24 hours'));
    
    // Obtener IP y User Agent
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
    
    // Guardar sesión en la base de datos
    try {
        // Crear tabla admin_sessions si no existe (sin foreign key para evitar problemas)
        $createSessionTable = "
        CREATE TABLE IF NOT EXISTS admin_sessions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            admin_id INT NOT NULL,
            token VARCHAR(255) NOT NULL UNIQUE,
            ip_address VARCHAR(45) NULL,
            user_agent VARCHAR(500) NULL,
            fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            fecha_ultimo_acceso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            fecha_expiracion DATETIME NOT NULL,
            activa BOOLEAN DEFAULT TRUE,
            INDEX idx_admin (admin_id),
            INDEX idx_token (token),
            INDEX idx_activa (activa),
            INDEX idx_expiracion (fecha_expiracion)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        $conn->exec($createSessionTable);
        
        $stmt = $conn->prepare("INSERT INTO admin_sessions (admin_id, token, ip_address, user_agent, fecha_expiracion) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$admin['id'], $token, $ipAddress, $userAgent, $fechaExpiracion]);
        
        // Actualizar último acceso en usuarios_administradores
        $stmt = $conn->prepare("UPDATE usuarios_administradores SET fecha_ultimo_acceso = NOW() WHERE id = ?");
        $stmt->execute([$admin['id']]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Login exitoso',
            'token' => $token,
            'admin' => [
                'id' => $admin['id'],
                'nombre' => $admin['nombre'],
                'email' => $admin['email'],
                'rol' => 'admin'
            ]
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error al crear sesión: ' . $e->getMessage()]);
    }
}

function handleAdminLogout($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    $token = $input['token'] ?? '';
    
    if (empty($token)) {
        echo json_encode(['success' => false, 'message' => 'Token requerido']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("UPDATE admin_sessions SET activa = FALSE WHERE token = ?");
        $stmt->execute([$token]);
        
        echo json_encode(['success' => true, 'message' => 'Sesión cerrada correctamente']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function handleVerifyAdminSession($conn, $input, $method) {
    $token = $input['token'] ?? $_GET['token'] ?? '';
    
    if (empty($token)) {
        echo json_encode(['success' => false, 'message' => 'Token requerido']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("
            SELECT s.*, a.id, a.nombre, a.email 
            FROM admin_sessions s
            INNER JOIN usuarios_administradores a ON s.admin_id = a.id
            WHERE s.token = ? AND s.activa = TRUE AND s.fecha_expiracion > NOW() AND a.activo = TRUE
        ");
        $stmt->execute([$token]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$session) {
            echo json_encode(['success' => false, 'message' => 'Sesión inválida o expirada']);
            return;
        }
        
        // Actualizar último acceso
        $stmt = $conn->prepare("UPDATE admin_sessions SET fecha_ultimo_acceso = NOW() WHERE token = ?");
        $stmt->execute([$token]);
        
        echo json_encode([
            'success' => true,
            'admin' => [
                'id' => $session['id'],
                'nombre' => $session['nombre'],
                'email' => $session['email'],
                'rol' => 'admin'
            ]
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function handleCheckEmail($conn, $input, $method) {
    $email = trim($input['email'] ?? $_GET['email'] ?? '');
    
    if (empty($email)) {
        echo json_encode(['success' => false, 'message' => 'Email requerido']);
        return;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Email inválido']);
        return;
    }
    
    $email = strtolower($email);
    
    try {
        $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $exists = $stmt->fetch();
        
        echo json_encode([
            'success' => true,
            'exists' => $exists !== false
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Verificar que el admin esté autenticado
function verifyAdminToken($conn, $token) {
    if (empty($token)) {
        error_log("⚠️ [verifyAdminToken] Token vacío");
        return null;
    }
    
    try {
        error_log("🔍 [verifyAdminToken] Verificando token: " . substr($token, 0, 30) . '...');
        $stmt = $conn->prepare("
            SELECT a.id, a.nombre, a.email 
            FROM admin_sessions s
            INNER JOIN usuarios_administradores a ON s.admin_id = a.id
            WHERE s.token = ? AND s.activa = TRUE AND s.fecha_expiracion > NOW() AND a.activo = TRUE
        ");
        $stmt->execute([$token]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            error_log("✅ [verifyAdminToken] Token válido para admin ID: " . $result['id']);
        } else {
            error_log("❌ [verifyAdminToken] Token no encontrado o inválido");
            // Verificar si el token existe pero está inactivo o expirado
            $stmt2 = $conn->prepare("SELECT s.activa, s.fecha_expiracion, a.activo FROM admin_sessions s INNER JOIN usuarios_administradores a ON s.admin_id = a.id WHERE s.token = ?");
            $stmt2->execute([$token]);
            $debug = $stmt2->fetch(PDO::FETCH_ASSOC);
            if ($debug) {
                error_log("🔍 [verifyAdminToken] Debug - activa: " . ($debug['activa'] ? 'true' : 'false') . ", expiración: " . $debug['fecha_expiracion'] . ", admin activo: " . ($debug['activo'] ? 'true' : 'false'));
            }
        }
        
        return $result;
    } catch (Exception $e) {
        error_log("❌ [verifyAdminToken] Excepción: " . $e->getMessage());
        return null;
    }
}

function handleGetUsuarioInfo($conn, $input, $method) {
    $token = $input['token'] ?? $_GET['token'] ?? '';
    $usuarioId = $input['usuario_id'] ?? $_GET['usuario_id'] ?? null;
    
    $admin = verifyAdminToken($conn, $token);
    if (!$admin) {
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        return;
    }
    
    if (empty($usuarioId)) {
        echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
        return;
    }
    
    try {
        // Obtener información del usuario
        $stmt = $conn->prepare("SELECT id, nombre, email, fecha_registro, activo FROM usuarios WHERE id = ?");
        $stmt->execute([$usuarioId]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$usuario) {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            return;
        }
        
        // Contar advertencias activas
        $stmt = $conn->prepare("SELECT COUNT(*) as total FROM advertencias_usuarios WHERE usuario_id = ? AND activa = TRUE");
        $stmt->execute([$usuarioId]);
        $advertencias = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Contar bans temporales activos
        $stmt = $conn->prepare("SELECT COUNT(*) as total FROM bans_usuarios WHERE usuario_id = ? AND tipo = 'temporal' AND activo = TRUE");
        $stmt->execute([$usuarioId]);
        $bansTemporales = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Verificar si tiene ban permanente
        $stmt = $conn->prepare("SELECT COUNT(*) as total FROM bans_usuarios WHERE usuario_id = ? AND tipo = 'permanente' AND activo = TRUE");
        $stmt->execute([$usuarioId]);
        $banPermanente = $stmt->fetch(PDO::FETCH_ASSOC)['total'] > 0;
        
        echo json_encode([
            'success' => true,
            'usuario' => $usuario,
            'advertencias' => (int)$advertencias,
            'bans_temporales' => (int)$bansTemporales,
            'ban_permanente' => $banPermanente
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function handleDarAdvertencia($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    $token = $input['token'] ?? '';
    $usuarioId = $input['usuario_id'] ?? null;
    $motivo = trim($input['motivo'] ?? '');
    
    $admin = verifyAdminToken($conn, $token);
    if (!$admin) {
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        return;
    }
    
    if (empty($usuarioId) || empty($motivo)) {
        echo json_encode(['success' => false, 'message' => 'Usuario ID y motivo son requeridos']);
        return;
    }
    
    try {
        // Crear tablas si no existen
        $createAdvertenciasTable = "
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
        ";
        $conn->exec($createAdvertenciasTable);
        
        // Insertar advertencia
        $stmt = $conn->prepare("INSERT INTO advertencias_usuarios (usuario_id, admin_id, motivo) VALUES (?, ?, ?)");
        $stmt->execute([$usuarioId, $admin['id'], $motivo]);
        
        // Contar advertencias activas
        $stmt = $conn->prepare("SELECT COUNT(*) as total FROM advertencias_usuarios WHERE usuario_id = ? AND activa = TRUE");
        $stmt->execute([$usuarioId]);
        $totalAdvertencias = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $mensaje = "Advertencia agregada. Total de advertencias: $totalAdvertencias";
        
        // Si tiene 3 advertencias, aplicar ban temporal automático
        if ($totalAdvertencias >= 3) {
            // Crear tabla de bans si no existe
            $createBansTable = "
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
            ";
            $conn->exec($createBansTable);
            
            // Contar bans temporales previos
            $stmt = $conn->prepare("SELECT COUNT(*) as total FROM bans_usuarios WHERE usuario_id = ? AND tipo = 'temporal' AND activo = TRUE");
            $stmt->execute([$usuarioId]);
            $bansTemporalesPrevios = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Si ya tiene 2 bans temporales, aplicar ban permanente
            if ($bansTemporalesPrevios >= 2) {
                $motivoBan = "Ban permanente automático: 3 advertencias y 3 bans temporales previos";
                $stmt = $conn->prepare("INSERT INTO bans_usuarios (usuario_id, admin_id, tipo, motivo) VALUES (?, ?, 'permanente', ?)");
                $stmt->execute([$usuarioId, $admin['id'], $motivoBan]);
                $mensaje .= ". Se aplicó ban permanente automático (3 advertencias + 3 bans temporales previos)";
            } else {
                // Aplicar ban temporal (7 días)
                $fechaFin = date('Y-m-d H:i:s', strtotime('+7 days'));
                $motivoBan = "Ban temporal automático: 3 advertencias acumuladas";
                $stmt = $conn->prepare("INSERT INTO bans_usuarios (usuario_id, admin_id, tipo, motivo, fecha_fin) VALUES (?, ?, 'temporal', ?, ?)");
                $stmt->execute([$usuarioId, $admin['id'], $motivoBan, $fechaFin]);
                $mensaje .= ". Se aplicó ban temporal automático de 7 días (3 advertencias)";
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => $mensaje,
            'total_advertencias' => (int)$totalAdvertencias
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function handleListarAdvertencias($conn, $input, $method) {
    $token = $input['token'] ?? $_GET['token'] ?? '';
    $usuarioId = $input['usuario_id'] ?? $_GET['usuario_id'] ?? null;
    
    $admin = verifyAdminToken($conn, $token);
    if (!$admin) {
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        return;
    }
    
    try {
        if ($usuarioId) {
            $stmt = $conn->prepare("
                SELECT a.*, u.nombre as usuario_nombre, u.email as usuario_email, 
                       admin.nombre as admin_nombre
                FROM advertencias_usuarios a
                INNER JOIN usuarios u ON a.usuario_id = u.id
                LEFT JOIN usuarios_administradores admin ON a.admin_id = admin.id
                WHERE a.usuario_id = ?
                ORDER BY a.fecha_advertencia DESC
            ");
            $stmt->execute([$usuarioId]);
        } else {
            $stmt = $conn->prepare("
                SELECT a.*, u.nombre as usuario_nombre, u.email as usuario_email,
                       admin.nombre as admin_nombre
                FROM advertencias_usuarios a
                INNER JOIN usuarios u ON a.usuario_id = u.id
                LEFT JOIN usuarios_administradores admin ON a.admin_id = admin.id
                ORDER BY a.fecha_advertencia DESC
                LIMIT 100
            ");
            $stmt->execute();
        }
        
        $advertencias = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'advertencias' => $advertencias
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function handleDarBan($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    $token = $input['token'] ?? '';
    $usuarioId = $input['usuario_id'] ?? null;
    $tipo = $input['tipo'] ?? 'temporal';
    $motivo = trim($input['motivo'] ?? '');
    $dias = $input['dias'] ?? 7;
    
    $admin = verifyAdminToken($conn, $token);
    if (!$admin) {
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        return;
    }
    
    if (empty($usuarioId) || empty($motivo)) {
        echo json_encode(['success' => false, 'message' => 'Usuario ID y motivo son requeridos']);
        return;
    }
    
    if (!in_array($tipo, ['temporal', 'permanente'])) {
        echo json_encode(['success' => false, 'message' => 'Tipo de ban inválido']);
        return;
    }
    
    try {
        // Crear tabla de bans si no existe
        $createBansTable = "
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
        ";
        $conn->exec($createBansTable);
        
        // Si es ban temporal, verificar si ya tiene 2 bans temporales previos
        if ($tipo === 'temporal') {
            $stmt = $conn->prepare("SELECT COUNT(*) as total FROM bans_usuarios WHERE usuario_id = ? AND tipo = 'temporal' AND activo = TRUE");
            $stmt->execute([$usuarioId]);
            $bansTemporalesPrevios = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Si ya tiene 2 bans temporales, convertir a permanente
            if ($bansTemporalesPrevios >= 2) {
                $tipo = 'permanente';
                $motivo = $motivo . " (Convertido a permanente: 3 bans temporales acumulados)";
            }
        }
        
        $fechaFin = null;
        if ($tipo === 'temporal') {
            $fechaFin = date('Y-m-d H:i:s', strtotime("+$dias days"));
        }
        
        $stmt = $conn->prepare("INSERT INTO bans_usuarios (usuario_id, admin_id, tipo, motivo, fecha_fin) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$usuarioId, $admin['id'], $tipo, $motivo, $fechaFin]);
        
        $mensaje = "Ban $tipo aplicado exitosamente";
        if ($tipo === 'temporal') {
            $mensaje .= " por $dias días";
        }
        
        echo json_encode([
            'success' => true,
            'message' => $mensaje,
            'tipo' => $tipo
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function handleListarBans($conn, $input, $method) {
    $token = $input['token'] ?? $_GET['token'] ?? '';
    $usuarioId = $input['usuario_id'] ?? $_GET['usuario_id'] ?? null;
    $soloActivos = $input['solo_activos'] ?? $_GET['solo_activos'] ?? false;
    
    $admin = verifyAdminToken($conn, $token);
    if (!$admin) {
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        return;
    }
    
    try {
        if ($usuarioId) {
            if ($soloActivos) {
                $stmt = $conn->prepare("
                    SELECT b.*, u.nombre as usuario_nombre, u.email as usuario_email,
                           admin.nombre as admin_nombre
                    FROM bans_usuarios b
                    INNER JOIN usuarios u ON b.usuario_id = u.id
                    LEFT JOIN usuarios_administradores admin ON b.admin_id = admin.id
                    WHERE b.usuario_id = ? AND b.activo = TRUE AND (b.tipo = 'permanente' OR b.fecha_fin > NOW())
                    ORDER BY b.fecha_inicio DESC
                ");
            } else {
                $stmt = $conn->prepare("
                    SELECT b.*, u.nombre as usuario_nombre, u.email as usuario_email,
                           admin.nombre as admin_nombre
                    FROM bans_usuarios b
                    INNER JOIN usuarios u ON b.usuario_id = u.id
                    LEFT JOIN usuarios_administradores admin ON b.admin_id = admin.id
                    WHERE b.usuario_id = ?
                    ORDER BY b.fecha_inicio DESC
                ");
            }
            $stmt->execute([$usuarioId]);
        } else {
            if ($soloActivos) {
                $stmt = $conn->prepare("
                    SELECT b.*, u.nombre as usuario_nombre, u.email as usuario_email,
                           admin.nombre as admin_nombre
                    FROM bans_usuarios b
                    INNER JOIN usuarios u ON b.usuario_id = u.id
                    LEFT JOIN usuarios_administradores admin ON b.admin_id = admin.id
                    WHERE b.activo = TRUE AND (b.tipo = 'permanente' OR b.fecha_fin > NOW())
                    ORDER BY b.fecha_inicio DESC
                    LIMIT 100
                ");
            } else {
                $stmt = $conn->prepare("
                    SELECT b.*, u.nombre as usuario_nombre, u.email as usuario_email,
                           admin.nombre as admin_nombre
                    FROM bans_usuarios b
                    INNER JOIN usuarios u ON b.usuario_id = u.id
                    LEFT JOIN usuarios_administradores admin ON b.admin_id = admin.id
                    ORDER BY b.fecha_inicio DESC
                    LIMIT 100
                ");
            }
            $stmt->execute();
        }
        
        $bans = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'bans' => $bans
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function handleEliminarAdvertencia($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    $token = $input['token'] ?? '';
    $advertenciaId = $input['advertencia_id'] ?? null;
    
    $admin = verifyAdminToken($conn, $token);
    if (!$admin) {
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        return;
    }
    
    if (empty($advertenciaId)) {
        echo json_encode(['success' => false, 'message' => 'ID de advertencia requerido']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("UPDATE advertencias_usuarios SET activa = FALSE WHERE id = ?");
        $stmt->execute([$advertenciaId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Advertencia eliminada exitosamente'
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function handleEliminarBan($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    $token = $input['token'] ?? '';
    $banId = $input['ban_id'] ?? null;
    
    $admin = verifyAdminToken($conn, $token);
    if (!$admin) {
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        return;
    }
    
    if (empty($banId)) {
        echo json_encode(['success' => false, 'message' => 'ID de ban requerido']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("UPDATE bans_usuarios SET activo = FALSE WHERE id = ?");
        $stmt->execute([$banId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Ban eliminado exitosamente'
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function handleGetIntentosOfensivos($conn, $params) {
    try {
        // Verificar autenticación de admin
        $token = $params['token'] ?? '';
        $admin = verifyAdminToken($conn, $token);
        if (!$admin) {
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            return;
        }
        
        // Crear tabla si no existe
        crearTablaIntentosOfensivos($conn);
        
        // Obtener parámetros de filtro
        $limit = isset($params['limit']) ? (int)$params['limit'] : 100;
        $offset = isset($params['offset']) ? (int)$params['offset'] : 0;
        $usuarioId = isset($params['usuario_id']) && $params['usuario_id'] !== '' ? (int)$params['usuario_id'] : null;
        $tipoIntento = isset($params['tipo_intento']) && $params['tipo_intento'] !== '' ? $params['tipo_intento'] : null;
        
        // Construir query
        $where = [];
        $paramsQuery = [];
        
        if ($usuarioId !== null) {
            $where[] = "io.usuario_id = ?";
            $paramsQuery[] = $usuarioId;
        }
        
        if ($tipoIntento) {
            $where[] = "io.tipo_intento = ?";
            $paramsQuery[] = $tipoIntento;
        }
        
        $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";
        
        $query = "
            SELECT 
                io.id,
                io.usuario_id,
                io.tipo_intento,
                io.campos_afectados,
                io.contenido_intentado,
                io.ip_address,
                io.fecha_intento,
                u.nombre AS usuario_nombre,
                u.email AS usuario_email
            FROM intentos_contenido_ofensivo io
            LEFT JOIN usuarios u ON io.usuario_id = u.id
            $whereClause
            ORDER BY io.fecha_intento DESC
            LIMIT ? OFFSET ?
        ";
        
        $paramsQuery[] = $limit;
        $paramsQuery[] = $offset;
        
        $stmt = $conn->prepare($query);
        $stmt->execute($paramsQuery);
        $intentos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Obtener total de registros
        $countQuery = "
            SELECT COUNT(*) as total
            FROM intentos_contenido_ofensivo io
            $whereClause
        ";
        $countParams = array_slice($paramsQuery, 0, -2); // Remover limit y offset
        $stmt = $conn->prepare($countQuery);
        if (!empty($countParams)) {
            $stmt->execute($countParams);
        } else {
            $stmt->execute();
        }
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Decodificar contenido intentado y extraer información adicional
        foreach ($intentos as &$intento) {
            $contenidoDecodificado = json_decode($intento['contenido_intentado'], true);
            $intento['contenido_intentado'] = $contenidoDecodificado;
            
            // Si no hay usuario_id pero es un intento de registro_usuario, extraer nombre y email
            if (!$intento['usuario_id'] && $intento['tipo_intento'] === 'registro_usuario' && is_array($contenidoDecodificado)) {
                $intento['intento_nombre'] = $contenidoDecodificado['nombre'] ?? null;
                $intento['intento_email'] = $contenidoDecodificado['email'] ?? null;
            }
        }
        
        echo json_encode([
            'success' => true,
            'intentos' => $intentos,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Solicitar recuperación de contraseña
function handleRequestPasswordReset($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    $email = trim($input['email'] ?? '');
    
    if (empty($email)) {
        echo json_encode(['success' => false, 'message' => 'Email es requerido']);
        return;
    }
    
    $email = strtolower($email);
    
    try {
        // Verificar que el usuario existe
        $stmt = $conn->prepare("SELECT id, nombre, email FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            // Por seguridad, no revelar si el email existe o no
            echo json_encode([
                'success' => true,
                'message' => 'Si el correo existe, se ha generado un código de recuperación',
                'token' => null
            ]);
            return;
        }
        
        // Crear tabla de tokens de recuperación si no existe
        $createTable = "
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INT PRIMARY KEY AUTO_INCREMENT,
            usuario_id INT NOT NULL,
            token VARCHAR(255) NOT NULL UNIQUE,
            fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            fecha_expiracion DATETIME NOT NULL,
            usado BOOLEAN DEFAULT FALSE,
            INDEX idx_usuario (usuario_id),
            INDEX idx_token (token),
            INDEX idx_expiracion (fecha_expiracion),
            INDEX idx_usado (usado),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        $conn->exec($createTable);
        
        // Invalidar tokens anteriores del usuario
        $stmt = $conn->prepare("UPDATE password_reset_tokens SET usado = TRUE WHERE usuario_id = ? AND usado = FALSE");
        $stmt->execute([$user['id']]);
        
        // Generar token único
        $token = bin2hex(random_bytes(32));
        
        // Calcular fecha de expiración (24 horas)
        $fechaExpiracion = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        // Guardar token en la base de datos
        $stmt = $conn->prepare("INSERT INTO password_reset_tokens (usuario_id, token, fecha_expiracion) VALUES (?, ?, ?)");
        $stmt->execute([$user['id'], $token, $fechaExpiracion]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Código de recuperación generado exitosamente',
            'token' => $token // Por ahora devolvemos el token directamente (sin email configurado)
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Resetear contraseña con token
function handleResetPassword($conn, $input, $method) {
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }
    
    $token = trim($input['token'] ?? '');
    $newPassword = $input['password'] ?? '';
    
    if (empty($token)) {
        echo json_encode(['success' => false, 'message' => 'Token es requerido']);
        return;
    }
    
    if (empty($newPassword)) {
        echo json_encode(['success' => false, 'message' => 'Nueva contraseña es requerida']);
        return;
    }
    
    if (strlen($newPassword) < 6) {
        echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres']);
        return;
    }
    
    try {
        // Buscar token válido
        $stmt = $conn->prepare("
            SELECT prt.id, prt.usuario_id, prt.fecha_expiracion, u.email 
            FROM password_reset_tokens prt
            INNER JOIN usuarios u ON prt.usuario_id = u.id
            WHERE prt.token = ? AND prt.usado = FALSE AND prt.fecha_expiracion > NOW()
            ORDER BY prt.fecha_creacion DESC
            LIMIT 1
        ");
        $stmt->execute([$token]);
        $tokenData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$tokenData) {
            echo json_encode(['success' => false, 'message' => 'Token inválido o expirado']);
            return;
        }
        
        // Hashear nueva contraseña
        $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
        
        // Iniciar transacción para asegurar que ambas actualizaciones se completen
        $conn->beginTransaction();
        
        try {
            // Actualizar contraseña del usuario en la base de datos
            $stmt = $conn->prepare("UPDATE usuarios SET password_hash = ? WHERE id = ?");
            $stmt->execute([$passwordHash, $tokenData['usuario_id']]);
            
            // Verificar que la actualización fue exitosa
            if ($stmt->rowCount() === 0) {
                throw new Exception('No se pudo actualizar la contraseña del usuario');
            }
            
            // Verificar que la contraseña se actualizó correctamente consultando la BD
            $verifyStmt = $conn->prepare("SELECT password_hash FROM usuarios WHERE id = ?");
            $verifyStmt->execute([$tokenData['usuario_id']]);
            $updatedUser = $verifyStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$updatedUser || !password_verify($newPassword, $updatedUser['password_hash'])) {
                throw new Exception('Error al verificar la actualización de la contraseña');
            }
            
            // Marcar token como usado
            $stmt = $conn->prepare("UPDATE password_reset_tokens SET usado = TRUE WHERE id = ?");
            $stmt->execute([$tokenData['id']]);
            
            // Confirmar transacción
            $conn->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
            ]);
        } catch (Exception $e) {
            // Revertir transacción en caso de error
            $conn->rollBack();
            throw $e;
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}
?>

