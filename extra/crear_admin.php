<?php
/**
 * Script para crear un nuevo usuario administrador
 * Ejecutar desde el navegador: http://localhost/pronatura/extra/crear_admin.php
 * O desde línea de comandos: php extra/crear_admin.php
 */

require_once __DIR__ . '/../api/db_connection.php';

// Configuración del nuevo administrador
$nombre = 'Administrador';
$email = 'admin@pronatura.com';
$password = 'Admin123!'; // Cambia esta contraseña después de crear el usuario
$rol = 'admin';

try {
    $conn = getDB();
    
    // Verificar si el email ya existe
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([strtolower($email)]);
    $existingUser = $stmt->fetch();
    
    if ($existingUser) {
        echo "❌ Error: El correo electrónico '$email' ya está registrado.\n";
        echo "ID del usuario existente: " . $existingUser['id'] . "\n";
        exit;
    }
    
    // Crear hash de la contraseña
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    // Insertar el nuevo usuario administrador (asegurando que activo = TRUE)
    $stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, ?, TRUE)");
    $stmt->execute([$nombre, strtolower($email), $passwordHash, $rol]);
    
    $userId = $conn->lastInsertId();
    
    if (!$userId) {
        throw new Exception("No se pudo crear el usuario. Verifica la conexión a la base de datos.");
    }
    
    // Obtener el usuario creado
    $stmt = $conn->prepare("SELECT id, nombre, email, rol, activo, fecha_registro FROM usuarios WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        throw new Exception("Usuario creado pero no se pudo recuperar la información.");
    }
    
    // Verificar que el usuario tiene rol admin y está activo
    $verificarStmt = $conn->prepare("SELECT id, nombre, email, rol, activo FROM usuarios WHERE email = ? AND rol = 'admin'");
    $verificarStmt->execute([strtolower($email)]);
    $usuarioVerificado = $verificarStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$usuarioVerificado || $usuarioVerificado['rol'] !== 'admin') {
        throw new Exception("Error: El usuario no se creó correctamente con rol de administrador.");
    }
    
    if (!$usuarioVerificado['activo']) {
        // Activar el usuario si no está activo
        $activarStmt = $conn->prepare("UPDATE usuarios SET activo = TRUE WHERE id = ?");
        $activarStmt->execute([$usuarioVerificado['id']]);
    }
    
    echo "✅ Usuario administrador creado exitosamente!\n\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "📋 INFORMACIÓN DEL USUARIO:\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "ID: " . $user['id'] . "\n";
    echo "Nombre: " . $user['nombre'] . "\n";
    echo "Email: " . $user['email'] . "\n";
    echo "Rol: " . $user['rol'] . "\n";
    echo "Activo: " . ($user['activo'] ? 'Sí' : 'No') . "\n";
    echo "Fecha de registro: " . $user['fecha_registro'] . "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "🔐 CREDENCIALES DE ACCESO:\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "Email: " . $email . "\n";
    echo "Contraseña: " . $password . "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "🔗 URL de acceso: https://organicjournal.com.mx/pages/admin-login.html\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "⚠️  IMPORTANTE: Cambia la contraseña después de iniciar sesión.\n";
    echo "⚠️  SEGURIDAD: Elimina este archivo después de crear el usuario.\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    
} catch (PDOException $e) {
    echo "❌ Error de base de datos: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>

