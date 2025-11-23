# Script de Respaldo Completo - ProNatura
# Respalda archivos del proyecto y base de datos

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESPALDO COMPLETO - PRONATURA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuracion
$proyectoPath = "C:\xampp\htdocs\pronatura"
$backupDir = "C:\xampp\htdocs\pronatura\backups"
$dbName = "db"
$dbUser = "root"
$dbPassword = ""
$mysqlPath = "C:\xampp\mysql\bin\mysqldump.exe"

# Crear directorio de respaldos
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Host "[OK] Directorio de respaldos creado" -ForegroundColor Green
}

# Generar nombre de respaldo
$fecha = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "pronatura_backup_$fecha"
$backupPath = Join-Path $backupDir $backupName

# Crear directorio para este respaldo
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
Write-Host "[OK] Carpeta de respaldo creada: $backupName" -ForegroundColor Green
Write-Host ""

# 1. RESPALDAR ARCHIVOS
Write-Host "[1/2] Respaldo de archivos del proyecto..." -ForegroundColor Cyan

$archivosZip = Join-Path $backupPath "proyecto_completo.zip"

# Obtener archivos excluyendo backups
$archivos = Get-ChildItem -Path $proyectoPath -Recurse -File | Where-Object {
    $_.FullName -notlike "*\backups\*"
}

# Crear ZIP
$archivos | Compress-Archive -DestinationPath $archivosZip -Force

if (Test-Path $archivosZip) {
    $tamano = [math]::Round((Get-Item $archivosZip).Length / 1MB, 2)
    Write-Host "[OK] Archivos respaldados: $tamano MB" -ForegroundColor Green
} else {
    Write-Host "[ERROR] No se pudo crear el archivo ZIP" -ForegroundColor Red
}

Write-Host ""

# 2. RESPALDAR BASE DE DATOS
Write-Host "[2/2] Respaldo de base de datos..." -ForegroundColor Cyan

$dbBackupFile = Join-Path $backupPath "base_datos.sql"

# Verificar mysqldump
if (-not (Test-Path $mysqlPath)) {
    Write-Host "[ADVERTENCIA] mysqldump no encontrado en: $mysqlPath" -ForegroundColor Yellow
    Write-Host "  Respalda la base de datos manualmente desde phpMyAdmin" -ForegroundColor Yellow
} else {
    try {
        if ($dbPassword -eq "") {
            & $mysqlPath -u $dbUser $dbName | Out-File -FilePath $dbBackupFile -Encoding UTF8
        } else {
            & $mysqlPath -u $dbUser -p$dbPassword $dbName | Out-File -FilePath $dbBackupFile -Encoding UTF8
        }
        
        if (Test-Path $dbBackupFile) {
            $tamanoDB = [math]::Round((Get-Item $dbBackupFile).Length / 1KB, 2)
            Write-Host "[OK] Base de datos respaldada: $tamanoDB KB" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] No se genero el archivo de respaldo de BD" -ForegroundColor Red
        }
    } catch {
        Write-Host "[ERROR] Error al respaldar base de datos: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESPALDO COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ubicacion del respaldo:" -ForegroundColor Yellow
Write-Host "  $backupPath" -ForegroundColor White
Write-Host ""

# Abrir carpeta de respaldos
Start-Process explorer.exe -ArgumentList $backupDir
