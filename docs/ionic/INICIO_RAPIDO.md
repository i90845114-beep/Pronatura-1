# ⚡ Inicio Rápido - Ionic/Capacitor

## 🎯 ¿Qué Necesitas?

- ✅ Node.js instalado
- ✅ npm instalado  
- ✅ Android Studio (para construir APKs)
- ✅ Capacitor ya configurado ✓

## 🚀 Comandos Esenciales

### 1. Después de Modificar Código

```bash
npm run ionic:sync
```

Este comando:
- Copia tus archivos a `www/`
- Sincroniza con Android
- Prepara todo para construir

### 2. Abrir en Android Studio

```bash
npm run ionic:open
```

### 3. Construir APK

En Android Studio:
- **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- La APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

## 📚 Documentación

- **Primeros Pasos**: `docs/ionic/docs/PRIMEROS_PASOS.md`
- **Guía Completa**: `docs/ionic/docs/GUIA_COMPLETA.md`
- **Comandos Rápidos**: `docs/ionic/docs/COMANDOS_RAPIDOS.md`

## 🔄 Flujo de Trabajo

```
Modificar código → npm run ionic:sync → Abrir Android Studio → Construir APK
```

## ⚠️ Importante

**Siempre ejecuta `npm run ionic:sync` después de modificar archivos web**

## 📁 Estructura

```
docs/ionic/
├── README.md              # Este archivo
├── INICIO_RAPIDO.md       # Guía rápida
├── scripts/               # Scripts de automatización
│   ├── sync.ps1          # Sincronizar todo
│   ├── copy-files.ps1    # Solo copiar archivos
│   └── open-android.ps1  # Abrir Android Studio
├── docs/                  # Documentación
│   ├── PRIMEROS_PASOS.md
│   ├── GUIA_COMPLETA.md
│   └── COMANDOS_RAPIDOS.md
└── config/                # Configuraciones
    └── build-config.json
```

## 🆘 Ayuda

Si tienes problemas:
1. Lee `docs/ionic/docs/PRIMEROS_PASOS.md`
2. Verifica que Android Studio esté instalado
3. Ejecuta `npx cap doctor` para diagnosticar

