<?php
/**
 * Script de Mantenimiento Temporal
 * 
 * INSTRUCCIONES DE USO:
 * 
 * ACTIVAR MANTENIMIENTO:
 * 1. Copia este archivo desde mantenimiento/ a la raíz del proyecto
 * 2. Renómbralo a index.php en la raíz
 * 3. La página mostrará el mensaje de mantenimiento
 * 
 * DESACTIVAR MANTENIMIENTO:
 * 1. Elimina o renombra index.php en la raíz
 * 2. La página volverá a funcionar normalmente
 */

// Configuración
$maintenance_mode = true; // Cambia a false para desactivar
$allowed_ips = []; // IPs permitidas (vacío = ninguna, o agrega IPs como ['127.0.0.1', '192.168.1.1'])
$maintenance_message = "Estamos realizando mantenimiento. Volveremos pronto.";
$estimated_time = "30 minutos"; // Tiempo estimado de mantenimiento

// Verificar si hay IPs permitidas
$user_ip = $_SERVER['REMOTE_ADDR'] ?? '';
$is_allowed = false;

if (!empty($allowed_ips)) {
    $is_allowed = in_array($user_ip, $allowed_ips);
}

// Si el modo mantenimiento está activo y el usuario no está en la lista de permitidos
if ($maintenance_mode && !$is_allowed) {
    // Configurar headers
    header('HTTP/1.1 503 Service Unavailable');
    header('Retry-After: 3600'); // Reintentar después de 1 hora
    
    ?>
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mantenimiento - Contraloría Social Tamaulipas</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background: linear-gradient(135deg, #4D8143 0%, #2c7a7b 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                color: #333;
            }
            
            .maintenance-container {
                background: white;
                border-radius: 20px;
                padding: 3rem;
                max-width: 600px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                text-align: center;
                animation: fadeIn 0.5s ease-in;
            }
            
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .maintenance-icon {
                font-size: 5rem;
                margin-bottom: 1.5rem;
                animation: bounce 2s infinite;
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% {
                    transform: translateY(0);
                }
                40% {
                    transform: translateY(-10px);
                }
                60% {
                    transform: translateY(-5px);
                }
            }
            
            h1 {
                color: #4D8143;
                font-size: 2.5rem;
                margin-bottom: 1rem;
                font-weight: 700;
            }
            
            .subtitle {
                color: #666;
                font-size: 1.2rem;
                margin-bottom: 2rem;
                line-height: 1.6;
            }
            
            .message {
                background: #f8f9fa;
                border-left: 4px solid #4D8143;
                padding: 1.5rem;
                margin: 2rem 0;
                border-radius: 8px;
                text-align: left;
            }
            
            .message p {
                color: #555;
                font-size: 1.1rem;
                line-height: 1.8;
                margin-bottom: 0.5rem;
            }
            
            .time-estimate {
                background: #e8f5e9;
                padding: 1rem;
                border-radius: 8px;
                margin: 1.5rem 0;
                color: #2e7d32;
                font-weight: 600;
            }
            
            .info-box {
                background: #fff3cd;
                border: 1px solid #ffc107;
                padding: 1rem;
                border-radius: 8px;
                margin-top: 2rem;
                color: #856404;
                font-size: 0.9rem;
            }
            
            .contact-info {
                margin-top: 2rem;
                padding-top: 2rem;
                border-top: 2px solid #e0e0e0;
            }
            
            .contact-info p {
                color: #666;
                margin: 0.5rem 0;
            }
            
            .contact-info a {
                color: #4D8143;
                text-decoration: none;
                font-weight: 600;
            }
            
            .contact-info a:hover {
                text-decoration: underline;
            }
            
            .footer {
                margin-top: 2rem;
                padding-top: 1.5rem;
                border-top: 1px solid #e0e0e0;
                color: #999;
                font-size: 0.85rem;
            }
            
            @media (max-width: 600px) {
                .maintenance-container {
                    padding: 2rem 1.5rem;
                }
                
                h1 {
                    font-size: 2rem;
                }
                
                .subtitle {
                    font-size: 1rem;
                }
                
                .maintenance-icon {
                    font-size: 4rem;
                }
            }
        </style>
    </head>
    <body>
        <div class="maintenance-container">
            <div class="maintenance-icon">🔧</div>
            <h1>Modo Mantenimiento</h1>
            <p class="subtitle">Estamos trabajando para mejorar tu experiencia</p>
            
            <div class="message">
                <p><strong>📢 <?php echo htmlspecialchars($maintenance_message); ?></strong></p>
            </div>
            
            <div class="time-estimate">
                ⏱️ Tiempo estimado: <?php echo htmlspecialchars($estimated_time); ?>
            </div>
            
            <div class="info-box">
                <strong>ℹ️ Información:</strong><br>
                Estamos realizando actualizaciones importantes en el sistema. 
                Durante este tiempo, el servicio no estará disponible. 
                Agradecemos tu paciencia.
            </div>
            
            <div class="contact-info">
                <p><strong>¿Necesitas ayuda urgente?</strong></p>
                <p>Contáctanos en:</p>
                <p>
                    <a href="mailto:soporte@pronatura.com">soporte@pronatura.com</a>
                </p>
            </div>
            
            <div class="footer">
                <p>Contraloría Social Tamaulipas</p>
                <p>© <?php echo date('Y'); ?> - Todos los derechos reservados</p>
            </div>
        </div>
        
        <script>
            // Auto-refresh cada 5 minutos para verificar si el mantenimiento terminó
            setTimeout(function() {
                window.location.reload();
            }, 300000); // 5 minutos
        </script>
    </body>
    </html>
    <?php
    exit;
}

// Si llegamos aquí, el modo mantenimiento está desactivado o el usuario está permitido
// Redirigir a la página principal
header('Location: pages/inicio.html');
exit;

