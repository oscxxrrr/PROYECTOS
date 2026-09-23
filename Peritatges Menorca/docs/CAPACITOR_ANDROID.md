# Guía de Generación de APK Android con Capacitor
## PERITATGES MENORCA

Esta guía explica cómo compilar un archivo APK instalable para teléfonos móviles Android utilizando la configuración de Capacitor incluida en el proyecto.

---

### 1. Requisitos Previos

- **Node.js** (v18 o superior)
- **Android Studio** instalado en tu ordenador (con Android SDK y Build Tools)
- **Java JDK** (versión 17 o 21 recomendada)

---

### 2. Comandos para Generar el Proyecto Android

En la terminal del proyecto, ejecuta:

```bash
# 1. Compilar el frontend optimizado
npm run build

# 2. Agregar la plataforma Android (sólo la primera vez)
npx cap add android

# 3. Sincronizar el código compilado (dist) con la app Android
npx cap sync

# 4. Abrir el proyecto en Android Studio
npx cap open android
```

---

### 3. Generar el APK en Android Studio

1. Una vez abierto Android Studio con el comando `npx cap open android`:
2. Espera a que Gradle termine de sincronizar las dependencias.
3. En el menú superior, selecciona:
   **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
4. Android Studio compilará la aplicación y mostrará una notificación con el enlace:
   `locate` (generalmente en `android/app/build/outputs/apk/debug/app-debug.apk`).
5. Copia ese archivo `.apk` a tu teléfono Android e instálalo directamente.

---

### 4. Permisos de Cámara en Android (`AndroidManifest.xml`)

Capacitor solicita automáticamente los siguientes permisos para la toma continua de fotografías y linterna:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" />
<uses-feature android:name="android.hardware.camera.autofocus" />
<uses-permission android:name="android.permission.FLASHLIGHT" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

---

### 5. Alternativa Inmediata: Instalación PWA Directa en Android

Si no deseas compilar con Android Studio, la aplicación es una **PWA completa**:

1. Abre la URL de la aplicación en **Google Chrome** en tu móvil Android.
2. Pulsa en el menú de 3 puntos de Chrome (arriba a la derecha).
3. Selecciona **"Añadir a la pantalla de inicio"** o **"Instalar aplicación"**.
4. Se instalará un acceso directo con icono propio y se abrirá a pantalla completa (standalone) exactamente como una aplicación nativa.
