<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instalador de Chat - ProNatura</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a5f3d 0%, #2e7d32 50%, #4caf50 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 600px;
            width: 100%;
        }
        h1 {
            color: #2e7d32;
            margin-bottom: 10px;
            font-size: 2rem;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        .status {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
            border-left: 4px solid #2e7d32;
        }
        .status.error {
            border-left-color: #d32f2f;
            background: #ffebee;
        }
        .status.success {
            border-left-color: #4caf50;
            background: #e8f5e9;
        }
        .btn {
            background: linear-gradient(135deg, #2e7d32, #4caf50);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            margin-top: 20px;
            transition: all 0.3s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(46, 125, 50, 0.4);
        }
        .btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .progress {
            margin: 20px 0;
        }
        .progress-item {
            padding: 10px;
            margin: 5px 0;
            background: #f5f5f5;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .progress-item.done {
            background: #e8f5e9;
            color: #2e7d32;
        }
        .progress-item.error {
            background: #ffebee;
            color: #d32f2f;
        }
        pre {
            background: #263238;
            color: #aed581;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 0.9rem;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌳 Instalador de Chat ProNatura</h1>
        <p class="subtitle">Configura la base de datos para el sistema de chat en tiempo real</p>

        <?php
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            echo '<div class="progress">';
            
            try {
                require_once 'db_connection.php';
                $pdo = getConnection();
                
                echo '<div class="progress-item done">✅ Conexión a base de datos establecida</div>';
                
                // Leer archivo SQL
                $sql = file_get_contents(__DIR__ . '/../database/chat_tables.sql');
                
                echo '<div class="progress-item done">✅ Archivo SQL cargado</div>';
                
                // Eliminar comentarios y separar por punto y coma
                $sql = preg_replace('/--.*$/m', '', $sql);
                $statements = array_filter(array_map('trim', explode(';', $sql)));
                
                $success_count = 0;
                $error_count = 0;
                
                foreach ($statements as $statement) {
                    if (empty($statement)) continue;
                    
                    try {
                        $pdo->exec($statement);
                        $success_count++;
                    } catch (PDOException $e) {
                        // Ignorar errores de "tabla ya existe"
                        if (strpos($e->getMessage(), 'already exists') === false) {
                            echo '<div class="progress-item error">❌ Error: ' . htmlspecialchars($e->getMessage()) . '</div>';
                            $error_count++;
                        }
                    }
                }
                
                echo '<div class="progress-item done">✅ ' . $success_count . ' sentencias ejecutadas correctamente</div>';
                
                // Verificar tablas creadas
                $stmt = $pdo->query("SHOW TABLES LIKE 'chat_%'");
                $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                
                if (count($tables) >= 2) {
                    echo '<div class="progress-item done">✅ Tablas creadas: ' . implode(', ', $tables) . '</div>';
                } else {
                    echo '<div class="progress-item error">⚠️ Advertencia: Solo se crearon ' . count($tables) . ' tablas</div>';
                }
                
                // Contar registros
                $stmt = $pdo->query("SELECT COUNT(*) FROM chat_grupos");
                $grupos_count = $stmt->fetchColumn();
                
                $stmt = $pdo->query("SELECT COUNT(*) FROM chat_mensajes");
                $mensajes_count = $stmt->fetchColumn();
                
                echo '<div class="status success">';
                echo '<h3 style="margin-bottom: 10px;">✅ ¡Instalación completada!</h3>';
                echo '<p><strong>Grupos creados:</strong> ' . $grupos_count . '</p>';
                echo '<p><strong>Mensajes de bienvenida:</strong> ' . $mensajes_count . '</p>';
                echo '</div>';
                
                echo '<a href="../pages/chat.html?nombre=Admin" class="btn" style="display: inline-block; text-align: center; text-decoration: none;">Ir al Chat →</a>';
                
            } catch (Exception $e) {
                echo '<div class="status error">';
                echo '<h3>❌ Error en la instalación</h3>';
                echo '<pre>' . htmlspecialchars($e->getMessage()) . '</pre>';
                echo '</div>';
                echo '<button onclick="location.reload()" class="btn">Reintentar</button>';
            }
            
            echo '</div>';
            
        } else {
            ?>
            
            <div class="status">
                <h3 style="margin-bottom: 10px;">📋 Se va a crear:</h3>
                <ul style="padding-left: 20px; line-height: 1.8;">
                    <li>Tabla <code>chat_grupos</code> (5 grupos)</li>
                    <li>Tabla <code>chat_mensajes</code> (mensajes de bienvenida)</li>
                    <li>Índices optimizados para rendimiento</li>
                </ul>
            </div>
            
            <div class="status" style="background: #fff3e0; border-left-color: #ff9800;">
                <h3 style="margin-bottom: 10px; color: #f57c00;">⚠️ Importante:</h3>
                <p style="color: #666;">Esta operación es segura. Si las tablas ya existen, no se perderán datos.</p>
            </div>
            
            <form method="POST">
                <button type="submit" class="btn">🚀 Instalar Base de Datos del Chat</button>
            </form>
            
            <?php
        }
        ?>
    </div>
</body>
</html>
