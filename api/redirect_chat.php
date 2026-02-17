<?php
/**
 * Script de redirección al chat desde grupos
 * Este script maneja la redirección del lado del servidor
 * para evitar problemas con Service Workers y cache del navegador
 */

session_start();

header('Content-Type: application/json; charset=utf-8');

// Método debe ser POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// Obtener datos del POST
$input = json_decode(file_get_contents('php://input'), true);

$estado = trim($input['estado'] ?? '');
$municipio = trim($input['municipio'] ?? '');
$ciudad = trim($input['ciudad'] ?? '');

// Validar datos requeridos
if (empty($estado) || empty($municipio)) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => 'Estado y municipio son requeridos'
    ]);
    exit;
}

// Guardar en sesión PHP (más confiable que sessionStorage)
$_SESSION['chat_acceso_directo'] = true;
$_SESSION['chat_estado'] = $estado;
$_SESSION['chat_municipio'] = $municipio;
$_SESSION['chat_ciudad'] = $ciudad;
$_SESSION['desde_grupos_aprobado'] = true;
$_SESSION['timestamp'] = time();

// Construir URL de redirección CON DATOS EN URL (funciona sin modificar chat.html)
$params = http_build_query([
    'desde_grupos' => 'true',
    'estado' => $estado,
    'municipio' => $municipio,
    'ciudad' => $ciudad,
    'nocache' => time()
]);

$chatUrl = '/pages/chat.html?' . $params;

// Devolver URL para redirección
echo json_encode([
    'success' => true,
    'redirect_url' => $chatUrl,
    'message' => 'Sesión configurada correctamente',
    'debug' => [
        'estado' => $estado,
        'municipio' => $municipio,
        'ciudad' => $ciudad
    ]
]);
