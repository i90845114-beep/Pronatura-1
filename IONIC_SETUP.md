# 📱 Guía de Configuración Ionic/Capacitor - ProNatura

## ✅ Estado Actual

- ✅ Capacitor instalado y configurado
- ✅ Plataforma Android agregada
- ✅ Archivos web copiados a `www/`

## 📋 Próximos Pasos

### 1. Sincronizar Archivos después de Cambios

Cada vez que hagas cambios en los archivos web, ejecuta:

```bash
npm run copy:www
npm run sync:android
```

O manualmente:
1. Copia los archivos modificados a la carpeta `www/`
2. Ejecuta `npx cap sync android`

### 2. Abrir el Proyecto en Android Studio

```bash
npm run open:android
```

O:
```bash
npx cap open android
```

### 3. Construir la APK

#### Opción A: Desde Android Studio
1. Abre Android Studio
2. Espera a que termine de sincronizar
3. Ve a **Build → Build Bundle(s) / APK(s) → Build APK(s)**
4. La APK se generará en `android/app/build/outputs/apk/`

#### Opción B: Desde la Terminal (si tienes Android SDK configurado)
```bash
cd android
./gradlew assembleDebug
```

### 4. Generar APK Firmada (Para Play Store)

1. En Android Studio: **Build → Generate Signed Bundle / APK**
2. Selecciona **APK**
3. Crea o selecciona un keystore
4. Sigue el asistente

### 5. Usar Ionic Appflow (Recomendado para CI/CD)

Si quieres usar Ionic Appflow para builds automáticos:

1. **Conecta tu repositorio Git:**
   - Ve a [Ionic Appflow Dashboard](https://dashboard.ionicframework.com)
   - Clic en "Import app"
   - Conecta tu repositorio Git

2. **Configura las builds:**
   - Appflow detectará automáticamente Capacitor
   - Puedes configurar builds automáticos para cada commit

3. **Genera APK desde Appflow:**
   - Ve a "Builds" → "New Build"
   - Selecciona Android
   - Appflow generará la APK automáticamente

## 🔧 Comandos Útiles

```bash
# Sincronizar cambios
npm run sync:android

# Abrir en Android Studio
npm run open:android

# Copiar archivos web a www
npm run copy:www

# Ver versión de Capacitor
npx cap --version
```

## 📁 Estructura del Proyecto

```
pronatura/
├── www/              # Archivos web (se copian aquí para Capacitor)
├── android/          # Proyecto Android nativo
├── capacitor.config.json
├── package.json
└── ...
```

## ⚠️ Notas Importantes

1. **Siempre sincroniza después de cambios:** Los cambios en `www/` no se reflejan automáticamente en Android
2. **Mantén `www/` actualizado:** Copia los archivos modificados antes de sincronizar
3. **Configuración del servidor:** El `capacitor.config.json` tiene configurado el servidor de producción

## 🚀 Próximos Pasos Recomendados

1. **Probar la app localmente:**
   - Abre Android Studio
   - Conecta un dispositivo o usa un emulador
   - Ejecuta la app

2. **Configurar plugins de Capacitor (si necesitas):**
   ```bash
   npm install @capacitor/camera
   npm install @capacitor/geolocation
   npx cap sync android
   ```

3. **Optimizar para producción:**
   - Minificar CSS/JS
   - Optimizar imágenes
   - Configurar proguard para Android

## 📚 Recursos

- [Documentación de Capacitor](https://capacitorjs.com/docs)
- [Ionic Appflow](https://ionic.io/docs/appflow)
- [Android Studio](https://developer.android.com/studio)

