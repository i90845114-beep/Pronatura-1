<?php
/**
 * Script para crear la tabla de administradores e insertar los usuarios
 * Ejecutar desde el navegador: http://localhost/pronatura/extra/crear_administradores.php
 * O desde línea de comandos: php extra/crear_administradores.php
 */

require_once __DIR__ . '/../api/db_connection.php';

// Usuarios administradores a crear
$administradores = [
    [
        'nombre' => 'Allen',
        'email' => 'allensamirsm@gmail.com',
        'password' => 'HOLACO'
    ],
    [
        'nombre' => 'Aaron',
        'email' => 'aaron14eamm@gmail.com',
        'password' => 'ErikAdmin0209'
    ]
];

try {
    $conn = getDB();
    
    echo "🔧 Creando tabla usuarios_administradores...\n\n";
    
    // Crear la tabla si no existe
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
    echo "✅ Tabla 'usuarios_administradores' creada exitosamente.\n\n";
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "👥 Creando usuarios administradores...\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    
    foreach ($administradores as $admin) {
        $nombre = $admin['nombre'];
        $email = strtolower(trim($admin['email']));
        $password = $admin['password'];
        
        // Verificar si el email ya existe
        $stmt = $conn->prepare("SELECT id FROM usuarios_administradores WHERE email = ?");
        $stmt->execute([$email]);
        $existingAdmin = $stmt->fetch();
        
        if ($existingAdmin) {
            echo "⚠️  El administrador '$nombre' ($email) ya existe. Actualizando contraseña...\n";
            
            // Actualizar contraseña
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            $updateStmt = $conn->prepare("UPDATE usuarios_administradores SET password_hash = ?, activo = TRUE WHERE email = ?");
            $updateStmt->execute([$passwordHash, $email]);
            
            echo "✅ Contraseña actualizada para '$nombre'.\n\n";
        } else {
            // Crear hash de la contraseña
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            
            // Insertar el nuevo administrador
            $stmt = $conn->prepare("INSERT INTO usuarios_administradores (nombre, email, password_hash, activo) VALUES (?, ?, ?, TRUE)");
            $stmt->execute([$nombre, $email, $passwordHash]);
            
            $adminId = $conn->lastInsertId();
            
            echo "✅ Administrador '$nombre' creado exitosamente (ID: $adminId)\n";
            echo "   Email: $email\n";
            echo "   Contraseña: $password\n\n";
        }
    }
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "📋 RESUMEN DE ADMINISTRADORES:\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    
    // Mostrar todos los administradores
    $stmt = $conn->query("SELECT id, nombre, email, activo, fecha_creacion FROM usuarios_administradores ORDER BY nombre");
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($admins as $admin) {
        echo "ID: " . $admin['id'] . "\n";
        echo "Nombre: " . $admin['nombre'] . "\n";
        echo "Email: " . $admin['email'] . "\n";
        echo "Activo: " . ($admin['activo'] ? 'Sí' : 'No') . "\n";
        echo "Fecha creación: " . $admin['fecha_creacion'] . "\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    }
    
    echo "🔗 URL de acceso: https://organicjournal.com.mx/pages/admin-login.html\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "⚠️  SEGURIDAD: Elimina este archivo después de ejecutarlo.\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    
} catch (PDOException $e) {
    echo "❌ Error de base de datos: " . $e->getMessage() . "\n";
    echo "Detalles: " . $e->getTraceAsString() . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>

