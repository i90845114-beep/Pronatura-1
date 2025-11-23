# Script para ejecutar db.sql en MySQL
# Uso: .\ejecutar_db.ps1

Write-Host "Ejecutando script de base de datos..." -ForegroundColor Green

# Configuración - MODIFICA ESTOS VALORES
$usuario = "root"
$password = ""
$baseDatos = "db"
$archivoSQL = Join-Path $PSScriptRoot "..\database\db.sql" | Resolve-Path

# Verificar si existe el archivo SQL
if (-not (Test-Path $archivoSQL)) {
    Write-Host "Error: No se encuentra el archivo $archivoSQL" -ForegroundColor Red
    exit 1
}

# Intentar diferentes rutas comunes de MySQL
$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.1\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.2\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.3\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.xx\bin\mysql.exe",
    "mysql.exe"
)

$mysqlExe = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path $path) {
        $mysqlExe = $path
        Write-Host "MySQL encontrado en: $path" -ForegroundColor Green
        break
    }
}

if (-not $mysqlExe) {
    Write-Host "MySQL no encontrado. Por favor, ejecuta el script manualmente:" -ForegroundColor Yellow
    Write-Host "mysql -u $usuario -p $baseDatos < $archivoSQL" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "O importa el archivo db.sql desde:" -ForegroundColor Yellow
    Write-Host "- MySQL Workbench" -ForegroundColor Cyan
    Write-Host "- phpMyAdmin" -ForegroundColor Cyan
    Write-Host "- HeidiSQL" -ForegroundColor Cyan
    exit 1
}

# Solicitar contraseña si no está configurada
if ([string]::IsNullOrEmpty($password)) {
    $securePassword = Read-Host "Ingresa la contraseña de MySQL" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# Crear base de datos si no existe
Write-Host "Creando base de datos '$baseDatos' si no existe..." -ForegroundColor Yellow
$createDbCommand = "CREATE DATABASE IF NOT EXISTS $baseDatos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
& $mysqlExe -u $usuario -p"$password" -e $createDbCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al crear la base de datos. Verifica las credenciales." -ForegroundColor Red
    exit 1
}

# Ejecutar el script SQL (incluye tablas y categorías)
Write-Host "Ejecutando script SQL..." -ForegroundColor Yellow
Get-Content $archivoSQL | & $mysqlExe -u $usuario -p"$password" $baseDatos

if ($LASTEXITCODE -eq 0) {
    Write-Host "¡Script ejecutado exitosamente!" -ForegroundColor Green
    Write-Host "Base de datos '$baseDatos' creada con todas las tablas y categorías." -ForegroundColor Green
} else {
    Write-Host "Error al ejecutar el script SQL." -ForegroundColor Red
    exit 1
}

