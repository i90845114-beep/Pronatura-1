# Script de Sincronización para Windows PowerShell
# Copia archivos web a www/ y sincroniza con Capacitor

Write-Host "🔄 Sincronizando archivos..." -ForegroundColor Cyan

# Copiar archivos a www/
Write-Host "📁 Copiando archivos a www/..." -ForegroundColor Yellow
$items = @("pages", "assets", "api", "manifest.json", "sw.js", "index.html", "index.php")

foreach ($item in $items) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination "www" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ $item copiado" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ $item no encontrado" -ForegroundColor Yellow
    }
}

# Sincronizar con Capacitor
Write-Host "`n🔌 Sincronizando con Capacitor..." -ForegroundColor Yellow
$env:Path += ";D:\npm-global"
npx cap sync android

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Sincronización completada!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Error en la sincronización" -ForegroundColor Red
    exit 1
}

