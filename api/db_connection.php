<?php

class DatabaseConnection {
    private $config;
    private $connection;
    
    public function __construct() {
        $configFile = __DIR__ . '/../config/config.json';
        
        if (!file_exists($configFile)) {
            throw new Exception("Archivo de configuración no encontrado: config.json");
        }
        
        $configContent = file_get_contents($configFile);
        $this->config = json_decode($configContent, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Error al parsear config.json: " . json_last_error_msg());
        }
    }
    
    public function connect() {
        if ($this->connection) {
            return $this->connection;
        }
        
        $db = $this->config['database'];
        
        try {
            $dsn = "mysql:host={$db['host']};port={$db['port']};dbname={$db['database']};charset={$db['charset']}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->connection = new PDO($dsn, $db['user'], $db['password'], $options);
            
            if (isset($db['timezone'])) {
                try {
                    $this->connection->exec("SET time_zone = '{$db['timezone']}'");
                } catch (PDOException $e) {
                    // Ignorar error de timezone si no es crítico
                }
            }
            
            return $this->connection;
        } catch (PDOException $e) {
            throw new Exception("Error de conexión a la base de datos: " . $e->getMessage());
        }
    }
    
    public function disconnect() {
        $this->connection = null;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function testConnection() {
        try {
            $conn = $this->connect();
            $stmt = $conn->query("SELECT 1");
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
}

function getDB() {
    static $db = null;
    if ($db === null) {
        $db = new DatabaseConnection();
        $db->connect();
    }
    return $db->getConnection();
}

?>

