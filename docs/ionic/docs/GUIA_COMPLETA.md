# 📱 Guía Completa Ionic/Capacitor - ProNatura

## 🎯 ¿Qué es Capacitor?

Capacitor es la plataforma oficial de Ionic para crear aplicaciones móviles nativas usando tecnologías web (HTML, CSS, JavaScript). Convierte tu PWA en una app móvil real.

## ✅ Estado Actual del Proyecto

- ✅ Capacitor instalado y configurado
- ✅ Plataforma Android agregada
- ✅ Archivos web en `www/`
- ✅ Proyecto Android en `android/`

## 📋 Flujo de Trabajo

### 1. Desarrollo Normal

1. **Modifica tus archivos** en `pages/`, `assets/`, etc.
2. **Copia los cambios** a `www/`:
   ```bash
   npm run ionic:copy
   ```
3. **Sincroniza con Android**:
   ```bash
   npm run ionic:sync
   ```
4. **Abre en Android Studio**:
   ```bash
   npm run ionic:open
   ```

### 2. Construir APK

#### Opción A: Desde Android Studio (Recomendado)

1. Abre Android Studio: `npm run ionic:open`
2. Espera a que sincronice
3. Conecta un dispositivo Android o inicia un emulador
4. Clic en el botón "Run" (▶️)
5. O ve a **Build → Build Bundle(s) / APK(s) → Build APK(s)**

#### Opción B: Desde Terminal

```bash
cd android
./gradlew assembleDebug
```

La APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

### 3. Generar APK Firmada (Para Play Store)

1. En Android Studio: **Build → Generate Signed Bundle / APK**
2. Selecciona **APK**
3. Crea un keystore (si no tienes uno):
   - **Key store path**: `android/app/pronatura-release-key.jks`
   - **Password**: (guárdala en un lugar seguro)
   - **Key alias**: `pronatura`
   - **Validity**: 25 años
4. Selecciona **release** build variant
5. Sigue el asistente

## 🔧 Comandos Disponibles

### Comandos NPM

```bash
# Copiar archivos web a www/
npm run ionic:copy

# Sincronizar con Android
npm run ionic:sync

# Abrir en Android Studio
npm run ionic:open

# Construir APK (requiere Android SDK)
npm run ionic:build

# Setup completo (primera vez)
npm run ionic:setup
```

### Comandos Capacitor Directos

```bash
# Sincronizar todas las plataformas
npx cap sync

# Sincronizar solo Android
npx cap sync android

# Abrir Android Studio
npx cap open android

# Ver información de Capacitor
npx cap doctor
```

## 📁 Estructura del Proyecto

```
pronatura/
├── www/                    # Archivos web (para Capacitor)
│   ├── pages/
│   ├── assets/
│   ├── api/
│   └── ...
├── android/                # Proyecto Android nativo
│   ├── app/
│   │   └── build/
│   │       └── outputs/
│   │           └── apk/    # APKs generadas aquí
│   └── ...
├── capacitor.config.json   # Configuración de Capacitor
├── package.json
└── ionic-setup/            # Esta carpeta
    ├── scripts/
    ├── docs/
    └── config/
```

## 🔌 Plugins de Capacitor Útiles

### Instalar Plugins

```bash
# Cámara
npm install @capacitor/camera
npx cap sync android

# Geolocalización
npm install @capacitor/geolocation
npx cap sync android

# Notificaciones Push
npm install @capacitor/push-notifications
npx cap sync android

# Compartir
npm install @capacitor/share
npx cap sync android
```

### Usar Plugins en tu Código

```javascript
// Ejemplo: Cámara
import { Camera } from '@capacitor/camera';

const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: 'base64'
  });
  
  // Usar la imagen
  console.log(image.base64String);
};
```

## 🌐 Usar Ionic Appflow (CI/CD)

Ionic Appflow permite generar APKs automáticamente desde tu repositorio Git.

### Configuración Inicial

1. **Crea cuenta en Ionic Appflow:**
   - Ve a https://dashboard.ionicframework.com
   - Crea una cuenta o inicia sesión

2. **Conecta tu repositorio:**
   - Clic en "New app" → "Import app"
   - Conecta tu repositorio Git (GitHub, GitLab, Bitbucket)
   - Appflow detectará automáticamente Capacitor

3. **Configura el build:**
   - Ve a "Builds" → "New Build"
   - Selecciona "Android"
   - Selecciona el branch (ej: `main` o `master`)
   - Clic en "Start Build"

4. **Descarga la APK:**
   - Una vez completado, descarga la APK desde el dashboard

### Build Automático

Puedes configurar builds automáticos para cada commit:
- Ve a "Settings" → "Builds"
- Activa "Auto builds"
- Selecciona el branch

## ⚙️ Configuración Avanzada

### Modificar capacitor.config.json

```json
{
  "appId": "com.pronatura.app",
  "appName": "ProNatura",
  "webDir": "www",
  "server": {
    "url": "https://organicjournal.com.mx",
    "cleartext": true
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000
    }
  }
}
```

### Configurar Permisos Android

Edita `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
```

## 🐛 Solución de Problemas

### Error: "Cannot copy to subdirectory"

**Solución:** Asegúrate de que `webDir` en `capacitor.config.json` no sea `.` (raíz)

### Error: "Android Studio not found"

**Solución:** 
1. Instala Android Studio desde https://developer.android.com/studio
2. Asegúrate de tener Android SDK instalado
3. Ejecuta `npx cap doctor` para verificar

### La app no carga los archivos

**Solución:**
1. Verifica que los archivos estén en `www/`
2. Ejecuta `npm run ionic:sync`
3. Limpia el build: En Android Studio → **Build → Clean Project**

### APK muy grande

**Solución:**
1. Optimiza imágenes
2. Minifica CSS/JS
3. Habilita ProGuard en `android/app/build.gradle`

## 📚 Recursos Adicionales

- [Documentación Capacitor](https://capacitorjs.com/docs)
- [Ionic Appflow](https://ionic.io/docs/appflow)
- [Android Studio](https://developer.android.com/studio)
- [Guía de Publicación Play Store](https://developer.android.com/distribute/googleplay/start)

## ✅ Checklist Antes de Publicar

- [ ] APK firmada generada
- [ ] Iconos de la app configurados (`android/app/src/main/res/`)
- [ ] Splash screen configurado
- [ ] Permisos configurados en AndroidManifest.xml
- [ ] Versión actualizada en `android/app/build.gradle`
- [ ] Probar en dispositivo real
- [ ] Optimizar tamaño de APK
- [ ] Preparar screenshots para Play Store
- [ ] Escribir descripción de la app

