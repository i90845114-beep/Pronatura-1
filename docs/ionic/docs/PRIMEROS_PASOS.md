# 🚀 Primeros Pasos con Ionic/Capacitor

## ✅ Verificación Inicial

Antes de empezar, verifica que tengas instalado:

- [ ] Node.js (v18 o superior)
- [ ] npm (v9 o superior)
- [ ] Android Studio (para construir APKs)
- [ ] Capacitor CLI (ya instalado)

Verifica con:
```bash
node --version
npm --version
npx cap --version
```

## 📋 Paso 1: Configuración Inicial (Solo Primera Vez)

Si es la primera vez que trabajas con este proyecto Ionic:

```bash
npm run ionic:setup
```

Esto instalará dependencias y configurará todo.

## 📋 Paso 2: Hacer Cambios en tu Código

1. Modifica tus archivos normalmente en `pages/`, `assets/`, etc.
2. **IMPORTANTE:** Después de cada cambio, ejecuta:

```bash
npm run ionic:sync
```

Este comando:
- Copia tus archivos a `www/`
- Sincroniza con el proyecto Android
- Prepara todo para construir la app

## 📋 Paso 3: Abrir en Android Studio

```bash
npm run ionic:open
```

Esto abrirá Android Studio con tu proyecto listo.

## 📋 Paso 4: Construir y Probar

### En Android Studio:

1. Espera a que termine de sincronizar
2. Conecta un dispositivo Android o inicia un emulador
3. Clic en el botón "Run" (▶️) o presiona Shift+F10
4. La app se instalará y ejecutará en tu dispositivo

### Construir APK:

1. Ve a **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Espera a que termine
3. La APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

## 🔄 Flujo de Trabajo Diario

```
1. Modificar código → 2. npm run ionic:sync → 3. Probar en Android Studio
```

## ⚠️ Errores Comunes

### "Cannot find module"

**Solución:**
```bash
npm install
npm run ionic:sync
```

### "Android Studio not found"

**Solución:**
1. Instala Android Studio desde https://developer.android.com/studio
2. Asegúrate de tener Android SDK instalado
3. Ejecuta `npx cap doctor` para verificar

### Los cambios no se reflejan

**Solución:**
1. Ejecuta `npm run ionic:sync`
2. En Android Studio: **Build → Clean Project**
3. Vuelve a ejecutar la app

## 📚 Siguiente Paso

Una vez que tengas la app funcionando, lee:
- `GUIA_COMPLETA.md` - Para detalles avanzados
- `COMANDOS_RAPIDOS.md` - Para referencia rápida

