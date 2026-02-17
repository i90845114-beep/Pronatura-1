<?php
/**
 * Script para verificar acceso directo al chat desde grupos
 * Este archivo debe incluirse al inicio de chat.html
 */

session_start();

// Verificar si viene desde grupos con acceso aprobado
$accesoDirecto = isset($_SESSION['chat_acceso_directo']) && $_SESSION['chat_acceso_directo'] === true;
$desdeGrupos = isset($_SESSION['desde_grupos_aprobado']) && $_SESSION['desde_grupos_aprobado'] === true;

if ($accesoDirecto || $desdeGrupos) {
    // Usuario tiene acceso directo, configurar datos
    $chatEstado = $_SESSION['chat_estado'] ?? '';
    $chatMunicipio = $_SESSION['chat_municipio'] ?? '';
    $chatCiudad = $_SESSION['chat_ciudad'] ?? '';
    
    // Generar JavaScript para configurar el chat
    echo "
    <script>
    // Configuración desde sesión PHP
    window.CHAT_CONFIG_PHP = {
        accesoDirecto: true,
        estado: " . json_encode($chatEstado) . ",
        municipio: " . json_encode($chatMunicipio) . ",
        ciudad: " . json_encode($chatCiudad) . ",
        timestamp: " . ($_SESSION['timestamp'] ?? time()) . "
    };
    
    // Guardar en sessionStorage también
    try {
        sessionStorage.setItem('chat_estado', " . json_encode($chatEstado) . ");
        sessionStorage.setItem('chat_municipio', " . json_encode($chatMunicipio) . ");
        sessionStorage.setItem('chat_ciudad', " . json_encode($chatCiudad) . ");
        sessionStorage.setItem('desde_grupos_aprobado', 'true');
    } catch(e) {
    }
    </script>
    ";
    
    // No limpiar la sesión aún, por si necesita recargar
} else {
    // No tiene acceso directo, es acceso normal
    echo "
    <script>
    window.CHAT_CONFIG_PHP = {
        accesoDirecto: false
    };
    </script>
    ";
}
?>
