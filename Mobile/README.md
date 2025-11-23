# 📱 Carpeta Mobile - Archivos PWA

Esta carpeta contiene todos los archivos relacionados con la conversión de la aplicación web a una **Progressive Web App (PWA)** instalable en dispositivos móviles.

## 📁 Estructura de Archivos

```
Mobile/
├── README.md                    # Este archivo
├── manifest.json                 # Configuración de la PWA
├── sw.js                        # Service Worker para funcionalidad offline
├── PWA_INSTRUCCIONES.md         # Guía completa de instalación y uso
└── assets/
    ├── js/
    │   └── pwa-register.js      # Script que registra el Service Worker
    └── icons/
        └── README_ICONOS.md     # Instrucciones para generar iconos
```

## 📋 Archivos Principales

### 1. `manifest.json`
Archivo de configuración de la PWA que define:
- Nombre de la aplicación
- Iconos en diferentes tamaños
- Colores del tema
- Pantalla de inicio
- Atajos de acceso rápido

**Ubicación en producción:** Debe estar en la raíz del proyecto (`/manifest.json`)

### 2. `sw.js`
Service Worker que maneja:
- Cache de archivos estáticos
- Funcionalidad offline
- Estrategias de cache (Network First para API, Cache First para assets)

**Ubicación en producción:** Debe estar en la raíz del proyecto (`/sw.js`)

### 3. `assets/js/pwa-register.js`
Script JavaScript que:
- Registra el Service Worker automáticamente
- Maneja el evento de instalación de la PWA
- Muestra botón de instalación personalizado
- Detecta actualizaciones del Service Worker

**Ubicación en producción:** `assets/js/pwa-register.js`

### 4. `PWA_INSTRUCCIONES.md`
Guía completa que incluye:
- Pasos para completar la implementación
- Cómo instalar la PWA en diferentes dispositivos
- Cómo probar y verificar la PWA
- Solución de problemas comunes
- Checklist de PWA

### 5. `assets/icons/README_ICONOS.md`
Instrucciones detalladas para:
- Generar los iconos necesarios
- Herramientas recomendadas
- Tamaños requeridos
- Recomendaciones de diseño

## 🚀 Instalación

### Pasos para Activar la PWA:

1. **Copiar archivos a la raíz del proyecto:**
   ```bash
   # Desde la carpeta Mobile
   copy manifest.json ..\manifest.json
   copy sw.js ..\sw.js
   copy assets\js\pwa-register.js ..\assets\js\pwa-register.js
   ```

2. **Generar los iconos:**
   - Sigue las instrucciones en `assets/icons/README_ICONOS.md`
   - Coloca los iconos en `assets/icons/` (en la raíz del proyecto)

3. **Verificar que los archivos HTML tengan:**
   - Meta tags PWA en el `<head>`
   - Referencia al manifest: `<link rel="manifest" href="../manifest.json">`
   - Script de registro: `<script src="../assets/js/pwa-register.js"></script>`

4. **Probar la instalación:**
   - Abre Chrome DevTools → Lighthouse → PWA
   - Verifica que el Service Worker se registre
   - Prueba la instalación en un dispositivo móvil

## 📱 Archivos Modificados en el Proyecto

Los siguientes archivos HTML fueron modificados para incluir soporte PWA:

- `pages/inicio.html` - Meta tags PWA y script de registro
- `pages/index.html` - Meta tags PWA y script de registro
- `pages/nuevo-registro.html` - Meta tags PWA y script de registro
- `pages/mapa-consolidado.html` - Meta tags PWA y script de registro

## ⚠️ Importante

1. **Los archivos deben estar en sus ubicaciones correctas** para que la PWA funcione
2. **Los iconos son obligatorios** - sin ellos la PWA no funcionará correctamente
3. **HTTPS es obligatorio** en producción (excepto localhost)
4. **El Service Worker debe estar en la raíz** del proyecto

## 📚 Documentación Adicional

- **Guía completa:** Ver `PWA_INSTRUCCIONES.md`
- **Generación de iconos:** Ver `assets/icons/README_ICONOS.md`
- **MDN PWA Guide:** https://developer.mozilla.org/es/docs/Web/Progressive_web_apps
- **Web.dev PWA:** https://web.dev/progressive-web-apps/

## ✅ Checklist de Implementación

- [ ] Archivos copiados a sus ubicaciones correctas
- [ ] Iconos generados y colocados en `assets/icons/`
- [ ] Meta tags PWA agregados en todas las páginas principales
- [ ] Service Worker registrado correctamente
- [ ] Manifest verificado con Lighthouse
- [ ] PWA probada en dispositivo móvil real
- [ ] Funcionalidad offline verificada

---

**Nota:** Esta carpeta es una copia de respaldo y organización. Los archivos deben estar en sus ubicaciones originales en el proyecto para que la PWA funcione correctamente.

