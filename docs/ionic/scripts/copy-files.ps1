# Script para copiar archivos web a www/
# Usar cuando solo necesites copiar archivos sin sincronizar

Write-Host "📁 Copiando archivos a www/..." -ForegroundColor Cyan

$items = @("pages", "assets", "api", "manifest.json", "sw.js", "index.html", "index.php")

foreach ($item in $items) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination "www" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ $item copiado" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ $item no encontrado" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Archivos copiados!" -ForegroundColor Green

