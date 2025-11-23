# Script de Respaldo Rápido - Solo Base de Datos
# Respalda únicamente la base de datos MySQL/MariaDB

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESPALDO BASE DE DATOS - PRONATURA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuración
$backupDir = "C:\xampp\htdocs\pronatura\backups"
$dbName = "db"
$dbUser = "root"
$dbPassword = ""
$mysqlPath = "C:\xampp\mysql\bin\mysqldump.exe"

# Crear directorio de respaldos si no existe
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

# Generar nombre de respaldo con fecha y hora
$fecha = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$dbBackupFile = Join-Path $backupDir "bd_$dbName`_$fecha.sql"

# Verificar si existe mysqldump
if (-not (Test-Path $mysqlPath)) {
    Write-Host "⚠️  mysqldump no encontrado. Buscando en otras ubicaciones..." -ForegroundColor Yellow
    
    $posiblesRutas = @(
        "C:\xampp\mysql\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
        "C:\Program Files\MariaDB\bin\mysqldump.exe"
    )
    
    $mysqlPath = $null
    foreach ($ruta in $posiblesRutas) {
        if (Test-Path $ruta) {
            $mysqlPath = $ruta
            break
        }
    }
}

if (-not $mysqlPath -or -not (Test-Path $mysqlPath)) {
    Write-Host "✗ Error: No se encontró mysqldump.exe" -ForegroundColor Red
    Write-Host ""
    Write-Host "OPCIÓN ALTERNATIVA:" -ForegroundColor Yellow
    Write-Host "1. Abre phpMyAdmin: http://localhost/phpmyadmin" -ForegroundColor White
    Write-Host "2. Selecciona la base de datos '$dbName'" -ForegroundColor White
    Write-Host "3. Ve a la pestaña 'Exportar'" -ForegroundColor White
    Write-Host "4. Selecciona 'Método: Rápido' y haz clic en 'Continuar'" -ForegroundColor White
    Write-Host ""
    exit
}

# Ejecutar respaldo
Write-Host "💾 Respaldo de base de datos: $dbName..." -ForegroundColor Cyan

try {
    if ($dbPassword -eq "") {
        & $mysqlPath -u $dbUser $dbName | Out-File -FilePath $dbBackupFile -Encoding UTF8
    } else {
        & $mysqlPath -u $dbUser -p$dbPassword $dbName | Out-File -FilePath $dbBackupFile -Encoding UTF8
    }
    
    if (Test-Path $dbBackupFile) {
        $tamano = (Get-Item $dbBackupFile).Length / 1KB
        Write-Host ""
        Write-Host "✓ Base de datos respaldada exitosamente!" -ForegroundColor Green
        Write-Host "  Archivo: $dbBackupFile" -ForegroundColor White
        Write-Host "  Tamaño: $([math]::Round($tamano, 2)) KB" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "✗ Error: No se generó el archivo de respaldo" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error al respaldar: $_" -ForegroundColor Red
}

Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

