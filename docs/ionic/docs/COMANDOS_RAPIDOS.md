# ⚡ Comandos Rápidos - Ionic/Capacitor

## 🔄 Sincronización

```bash
# Copiar archivos y sincronizar (todo en uno)
npm run ionic:sync

# Solo copiar archivos
npm run ionic:copy

# Solo sincronizar (después de copiar)
npm run ionic:sync-only
```

## 🚀 Desarrollo

```bash
# Abrir en Android Studio
npm run ionic:open

# Verificar estado de Capacitor
npx cap doctor
```

## 📦 Construcción

```bash
# Construir APK debug
npm run ionic:build

# Construir APK release (requiere keystore)
npm run ionic:build:release
```

## 🔌 Plugins

```bash
# Instalar plugin de cámara
npm install @capacitor/camera
npm run ionic:sync

# Instalar plugin de geolocalización
npm install @capacitor/geolocation
npm run ionic:sync
```

## 📱 Ionic Appflow

```bash
# Login en Appflow
ionic login

# Conectar proyecto
ionic link

# Crear build desde CLI
ionic build android --prod
```

## 🛠️ Utilidades

```bash
# Limpiar build de Android
cd android
./gradlew clean

# Ver logs de Android
adb logcat

# Instalar APK en dispositivo conectado
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

