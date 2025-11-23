# Script para iniciar la aplicacion ProNatura localmente
# Ejecutar con: .\iniciar_local.ps1

Write-Host "Iniciando aplicacion ProNatura localmente..." -ForegroundColor Green
Write-Host ""

# Verificar si XAMPP esta instalado
$xamppPath = "C:\xampp"
if (-not (Test-Path $xamppPath)) {
    Write-Host "ERROR: XAMPP no encontrado en $xamppPath" -ForegroundColor Red
    Write-Host "Por favor instala XAMPP o ajusta la ruta en el script" -ForegroundColor Yellow
    exit 1
}

# Verificar si Apache esta corriendo
$apacheProcess = Get-Process -Name "httpd" -ErrorAction SilentlyContinue
if (-not $apacheProcess) {
    Write-Host "ADVERTENCIA: Apache no esta corriendo" -ForegroundColor Yellow
    Write-Host "Por favor inicia Apache desde el Panel de Control de XAMPP" -ForegroundColor Yellow
} else {
    Write-Host "OK: Apache esta corriendo (PID: $($apacheProcess.Id))" -ForegroundColor Green
}

# Verificar si MySQL esta corriendo
$mysqlProcess = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if (-not $mysqlProcess) {
    Write-Host "ADVERTENCIA: MySQL no esta corriendo" -ForegroundColor Yellow
    Write-Host "Por favor inicia MySQL desde el Panel de Control de XAMPP" -ForegroundColor Yellow
} else {
    Write-Host "OK: MySQL esta corriendo (PID: $($mysqlProcess.Id))" -ForegroundColor Green
}

# Verificar archivo .htaccess
if (Test-Path ".htaccess") {
    Write-Host ""
    Write-Host "ADVERTENCIA: El archivo .htaccess esta activo" -ForegroundColor Yellow
    Write-Host "Esto puede estar bloqueando el acceso a la aplicacion" -ForegroundColor Yellow
    Write-Host "Se recomienda renombrarlo a .htaccess.backup para desarrollo local" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Deseas renombrar .htaccess ahora? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        Rename-Item -Path ".htaccess" -NewName ".htaccess.backup" -Force
        Write-Host "OK: .htaccess renombrado a .htaccess.backup" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "URLs para acceder a la aplicacion:" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pagina de Inicio:" -ForegroundColor White
Write-Host "  http://localhost/pronatura/pages/inicio.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "Login:" -ForegroundColor White
Write-Host "  http://localhost/pronatura/pages/login.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "Biblioteca:" -ForegroundColor White
Write-Host "  http://localhost/pronatura/pages/index.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "Admin Login:" -ForegroundColor White
Write-Host "  http://localhost/pronatura/pages/admin-login.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tip: Abre la consola del navegador (F12) para ver logs" -ForegroundColor Gray
Write-Host ""
