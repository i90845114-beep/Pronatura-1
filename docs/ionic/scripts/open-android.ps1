# Script para abrir Android Studio
# Requiere que Android Studio esté instalado

Write-Host "🚀 Abriendo Android Studio..." -ForegroundColor Cyan

$env:Path += ";D:\npm-global"
npx cap open android

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Android Studio abierto" -ForegroundColor Green
} else {
    Write-Host "❌ Error al abrir Android Studio" -ForegroundColor Red
    Write-Host "Asegúrate de tener Android Studio instalado" -ForegroundColor Yellow
    exit 1
}

