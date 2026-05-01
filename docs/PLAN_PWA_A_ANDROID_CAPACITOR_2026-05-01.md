# Plan PWA → Android Nativo (Capacitor) — Ejecución multi-agente

**Fecha:** 2026-05-01
**Feature:** Eliminar toda la infraestructura PWA y convertir SIG-Agro en app Android nativa usando Capacitor
**Proyecto afectado:** `SIG-Agro`
**Stack actual:** Next.js 16 + React 19 + TypeScript + Firebase

---

## Por qué Capacitor y no TWA ni React Native

| Opción | Reutiliza código actual | Acceso nativo | Android + iOS | Veredicto |
|--------|------------------------|---------------|---------------|-----------|
| **Capacitor** | 100% (WebView) | ✅ Cámara, GPS, Push | ✅ | **ELEGIDO** |
| TWA (Chrome) | 100% | ❌ Limitado | Solo Android | Descartado |
| React Native | ~30% (reescritura UI) | ✅ Completo | ✅ | Demasiado costo |
| Expo | ~30% | ✅ Completo | ✅ | Demasiado costo |

**Capacitor** envuelve el build de Next.js en un WebView nativo. No hay reescritura. IndexedDB, Firestore, Leaflet, todo sigue funcionando. Lo que cambia es que Service Workers dejan de existir (no son necesarios en una app nativa) y las APIs de cámara/GPS/push se acceden por plugins nativos.

---

## Inventario de archivos PWA a eliminar

| Archivo | Por qué se elimina |
|---------|--------------------|
| `public/sw.js` | Service Worker manual — innecesario en WebView nativo |
| `public/firebase-messaging-sw.js` | FCM via SW — reemplazado por `@capacitor/push-notifications` |
| `public/manifest.json` | Manifest PWA — Capacitor no lo necesita |
| `src/components/pwa/PWAProvider.tsx` | Registra SWs — reemplazado por `CapacitorProvider.tsx` |
| `src/app/offline/page.tsx` | Fallback de SW — innecesario, la app está instalada |

| Código a limpiar | Dónde | Qué eliminar |
|-----------------|-------|-------------|
| Registro SW | `src/hooks/useOfflineSync.tsx:124` | `navigator.serviceWorker.register('/sw.js')` |
| Registro SW FCM | `src/services/fcm.ts:59` | `navigator.serviceWorker.register('/firebase-messaging-sw.js')` |
| `<PWAProvider>` | `src/app/layout.tsx` | Import y uso del componente |
| `getToken()` FCM | `src/services/fcm.ts` | Toda la lógica de token web — reemplazada por Capacitor Push |

---

## Resumen de olas

| Ola | Agentes | Paralelos entre sí | Dependen de |
|-----|---------|---------------------|-------------|
| 1 | A, B, C | Sí | Nada |
| 2 | A, B, C | Sí | Ola 1 completa |
| 3 | A, B | Sí | Ola 2 completa |

---

## Ola 1 — Demolición PWA + Instalación Capacitor base
> Ejecutar Agente A + Agente B + Agente C en PARALELO

### Agente A — Eliminar archivos PWA y limpiar código

**Puede ejecutarse en paralelo con:** Agente B, Agente C
**Depende de:** nada — es la primera ola

#### Objetivo
Borrar físicamente todos los archivos PWA y eliminar sus referencias del código, dejando el proyecto listo para Capacitor.

#### Archivos a eliminar
- `public/sw.js`
- `public/firebase-messaging-sw.js`
- `public/manifest.json`
- `src/app/offline/page.tsx`
- `src/components/pwa/PWAProvider.tsx`

#### Archivos a modificar
- `src/hooks/useOfflineSync.tsx` — eliminar bloque de registro de Service Worker (líneas ~120-135), mantener toda la lógica de IndexedDB intacta
- `src/services/fcm.ts` — eliminar `navigator.serviceWorker.register('/firebase-messaging-sw.js')`, eliminar `getToken()` de Firebase Messaging web (se reemplazará en Ola 2), dejar solo el esqueleto de la clase con los métodos sin implementación FCM web
- `src/app/layout.tsx` — eliminar `import PWAProvider`, eliminar `<PWAProvider>` del JSX, corregir el título de `"Don Juan GIS"` a `"SIG Agro"`, eliminar cualquier `<link rel="manifest">` explícito

#### Prompt completo para el agente

Estás en SIG-Agro, Next.js 16 + React 19 + TypeScript + Firebase. Proyecto en `c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro`.

**Objetivo:** Eliminar toda la infraestructura PWA. La app se está convirtiendo a nativa con Capacitor. Los Service Workers dejan de existir. IndexedDB se mantiene.

**PASO 1 — Eliminar archivos físicamente:**
```
public/sw.js
public/firebase-messaging-sw.js
public/manifest.json
src/app/offline/page.tsx
src/components/pwa/PWAProvider.tsx
```
Usa la herramienta de eliminación de archivos para cada uno.

**PASO 2 — Modificar `src/hooks/useOfflineSync.tsx`:**

Lee el archivo completo. Localiza y elimina SOLO el bloque que registra el Service Worker (`navigator.serviceWorker.register('/sw.js')`). Ese bloque está alrededor de la línea 124. Mantén absolutamente todo el resto: los listeners de `online`/`offline`, toda la lógica de IndexedDB (`addPendingSync`, `getPendingSync`, `removePendingSync`), el `OfflineIndicator` component, y la sincronización de items pendientes. Solo eliminar la parte que registra el SW.

Si hay referencias a `registration.sync.register('sync-pending-data')` (Background Sync API), también eliminarlas — esa API requiere SW.

Después de la edición, el hook debe:
- ✅ Seguir detectando online/offline con `window.addEventListener`
- ✅ Seguir usando IndexedDB para pendientes
- ✅ Seguir exponiendo `OfflineIndicator`
- ❌ NO registrar ningún Service Worker

**PASO 3 — Modificar `src/services/fcm.ts`:**

Lee el archivo completo. Realiza estos cambios quirúrgicos:

a) Eliminar el import de `getToken` y `onMessage` de `firebase/messaging`
b) Eliminar el bloque que registra `/firebase-messaging-sw.js`
c) El método `initialize()` debe quedar como stub que retorna `null` con un comentario `// Reemplazado por @capacitor/push-notifications en Ola 2`
d) El método `sendNotification()` mantener su lógica (llama al backend `/api/notifications/send` — eso NO cambia)
e) El método `isSupported()` cambiar para retornar `true` siempre (Capacitor determina soporte nativo)

**PASO 4 — Modificar `src/app/layout.tsx`:**

Lee el archivo. Hacer estos cambios:
- Eliminar `import PWAProvider` si existe
- Eliminar `<PWAProvider>` del JSX
- Cambiar el título de `"Don Juan GIS"` a `"SIG Agro"` en el objeto `metadata`
- Eliminar cualquier `<link rel="manifest" href="/manifest.json">` explícito (si existe)
- NO tocar AuthProvider, NextIntlClientProvider ni ningún otro provider

**Criterio de éxito:** `npx tsc --noEmit` no lanza nuevos errores causados por estos cambios. Los 5 archivos eliminados ya no existen en disco. El hook `useOfflineSync` sigue exportando `OfflineIndicator` sin errores.

---

### Agente B — Instalar Capacitor y generar proyecto Android

**Puede ejecutarse en paralelo con:** Agente A, Agente C
**Depende de:** nada — es la primera ola

#### Objetivo
Instalar todas las dependencias de Capacitor, crear `capacitor.config.ts`, ejecutar `npx cap init` y `npx cap add android` para generar el proyecto Android nativo.

#### Archivos a crear
- `capacitor.config.ts` — configuración principal de Capacitor

#### Archivos a modificar
- `package.json` — agregar dependencias Capacitor y scripts de build
- `next.config.ts` — agregar `output: 'export'` y `distDir: 'out'` para build estático

#### Prompt completo para el agente

Estás en SIG-Agro, Next.js 16 + React 19 + TypeScript. Proyecto en `c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro`.

**Contexto:** La app se está convirtiendo de PWA a Android nativo usando Capacitor. Capacitor necesita un build estático de Next.js (`next export` → carpeta `out/`), que luego envuelve en un WebView Android.

**PASO 1 — Instalar dependencias:**
```bash
cd "c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro"
npm install @capacitor/core@latest @capacitor/cli@latest
npm install @capacitor/android@latest
npm install @capacitor/camera@latest @capacitor/geolocation@latest
npm install @capacitor/push-notifications@latest
npm install @capacitor/filesystem@latest @capacitor/preferences@latest
npm install @capacitor/status-bar@latest @capacitor/splash-screen@latest
npm install @capacitor/app@latest @capacitor/haptics@latest @capacitor/network@latest
```

**PASO 2 — Crear `capacitor.config.ts`** en la raíz del proyecto:

```typescript
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.agrotech.sigagro',
  appName: 'SIG Agro',
  webDir: 'out',
  bundledWebRuntime: false,
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    backgroundColor: '#0f172a',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f172a',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      saveToGallery: true,
    },
  },
}

export default config
```

**PASO 3 — Modificar `next.config.ts`:**

Lee el archivo actual. Agregar dentro de `nextConfig`:
```typescript
output: 'export',
distDir: 'out',
images: {
  unoptimized: true,   // Necesario para export estático
},
trailingSlash: true,
```

**NOTA IMPORTANTE:** `output: 'export'` hace que `next build` genere HTML estático en `/out`. Esto es lo que Capacitor sirve en el WebView. Sin embargo, las API routes de Next.js (`/api/*`) NO funcionan en el build estático — deben estar deployadas en Firebase Functions o Vercel por separado. Agregar un comentario en `next.config.ts` explicando esto.

**PASO 4 — Agregar scripts en `package.json`:**

Agregar en el objeto `"scripts"`:
```json
"build:android": "next build && npx cap sync android",
"cap:sync": "npx cap sync",
"cap:open:android": "npx cap open android",
"cap:run:android": "npx cap run android"
```

**PASO 5 — Inicializar Capacitor y agregar Android:**
```bash
npx cap init "SIG Agro" "com.agrotech.sigagro" --web-dir=out
npx cap add android
```

Esto genera la carpeta `android/` en la raíz del proyecto.

**Criterio de éxito:**
- `capacitor.config.ts` existe en la raíz
- La carpeta `android/` fue generada con `AndroidManifest.xml` y `build.gradle`
- `npm run build` completa sin errores (puede haber warnings)
- `npx cap sync` completa sin errores

---

### Agente C — Actualizar next.config.ts para build estático + AndroidManifest permisos

**Puede ejecutarse en paralelo con:** Agente A, Agente B
**Depende de:** nada — es la primera ola

#### Objetivo
Preparar el AndroidManifest con todos los permisos necesarios y crear el archivo `android/app/src/main/res/xml/network_security_config.xml` para permitir llamadas a APIs externas.

#### Archivos a crear
- `android/app/src/main/res/xml/network_security_config.xml` — permite HTTPS a Firebase, Groq, Meta API

#### Archivos a modificar
- `android/app/src/main/AndroidManifest.xml` — agregar permisos nativos

#### Prompt completo para el agente

Estás en SIG-Agro, Capacitor + Next.js 16. Proyecto en `c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro`.

La carpeta `android/` fue generada por `npx cap add android` (Agente B de esta misma ola la está generando).

**PASO 1 — Editar `android/app/src/main/AndroidManifest.xml`:**

Localizar el bloque `<manifest>` y agregar estos permisos antes de `<application>`:

```xml
<!-- Geolocalización para mapas y scouting -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Cámara para scouting fotográfico -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />

<!-- Almacenamiento para fotos y datos offline -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="28" />

<!-- Internet y estado de red -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Notificaciones push -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />

<!-- Vibración para alertas críticas -->
<uses-permission android:name="android.permission.USE_VIBRATE" />
```

Dentro de `<application>`, agregar:
```xml
android:networkSecurityConfig="@xml/network_security_config"
android:usesCleartextTraffic="false"
```

**PASO 2 — Crear `android/app/src/main/res/xml/network_security_config.xml`:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <!-- Firebase -->
        <domain includeSubdomains="true">firebaseapp.com</domain>
        <domain includeSubdomains="true">firebasestorage.app</domain>
        <domain includeSubdomains="true">googleapis.com</domain>
        <!-- Meta Graph API (WhatsApp) -->
        <domain includeSubdomains="true">graph.facebook.com</domain>
        <!-- Groq IA -->
        <domain includeSubdomains="true">api.groq.com</domain>
        <!-- ElevenLabs TTS -->
        <domain includeSubdomains="true">api.elevenlabs.io</domain>
        <!-- Open-Meteo clima -->
        <domain includeSubdomains="true">api.open-meteo.com</domain>
        <!-- Copernicus satelital -->
        <domain includeSubdomains="true">dataspace.copernicus.eu</domain>
        <!-- Resend email -->
        <domain includeSubdomains="true">api.resend.com</domain>
    </domain-config>
    <debug-overrides>
        <trust-anchors>
            <certificates src="user" />
        </trust-anchors>
    </debug-overrides>
</network-security-config>
```

**PASO 3 — Crear directorio de recursos si no existe:**
```
android/app/src/main/res/xml/   (puede que ya exista)
```

**Criterio de éxito:** `android/app/src/main/AndroidManifest.xml` contiene los 12 permisos. El archivo `network_security_config.xml` existe con todos los dominios. El proyecto abre sin errores en Android Studio.

---

## Ola 2 — Wrappers Capacitor (reemplazos nativos)
> Ejecutar SOLO después de que Ola 1 esté completa
> Ejecutar Agente A + Agente B + Agente C en PARALELO

### Agente A — Hooks nativos: Cámara y Geolocalización

**Puede ejecutarse en paralelo con:** Agente B, Agente C
**Depende de:** Ola 1 completa (Capacitor instalado)

#### Objetivo
Crear hooks React que envuelven `@capacitor/camera` y `@capacitor/geolocation`, reemplazando cualquier uso directo de `navigator.geolocation` y `getUserMedia`.

#### Archivos a crear
- `src/hooks/useCapacitorCamera.ts` — hook para tomar fotos con cámara nativa
- `src/hooks/useCapacitorGeolocation.ts` — hook para GPS nativo
- `src/hooks/useCapacitorNetwork.ts` — hook de estado de red (reemplaza `navigator.onLine`)

#### Prompt completo para el agente

Estás en SIG-Agro, Next.js 16 + React 19 + TypeScript + Capacitor. Proyecto en `c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro`.

Capacitor ya está instalado. Los plugins disponibles: `@capacitor/camera`, `@capacitor/geolocation`, `@capacitor/network`.

**1. Crear `src/hooks/useCapacitorCamera.ts`:**

```typescript
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera'
import { useState } from 'react'

export interface CapturedPhoto {
  dataUrl: string       // base64 para mostrar en <img>
  format: string        // 'jpeg' | 'png'
  saved: boolean
}

export function useCapacitorCamera() {
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function takePhoto(): Promise<CapturedPhoto | null> {
    // Camera.getPhoto({ quality: 85, allowEditing: false, resultType: CameraResultType.DataUrl, source: CameraSource.Camera })
    // Si falla con permiso denegado → setError('Permiso de cámara denegado')
    // Retornar CapturedPhoto o null si falla
  }

  async function selectFromGallery(): Promise<CapturedPhoto | null> {
    // Igual pero source: CameraSource.Photos
  }

  return { photo, loading, error, takePhoto, selectFromGallery, clearPhoto: () => setPhoto(null) }
}
```

**2. Crear `src/hooks/useCapacitorGeolocation.ts`:**

```typescript
import { Geolocation, Position } from '@capacitor/geolocation'
import { useState, useEffect } from 'react'

export interface GeoLocation {
  latitude: number
  longitude: number
  accuracy: number
  altitude?: number
  timestamp: number
}

export function useCapacitorGeolocation(watchPosition = false) {
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function getCurrentPosition(): Promise<GeoLocation | null> {
    // Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
    // Mapear campos de Position a GeoLocation
  }

  // Si watchPosition === true, usar Geolocation.watchPosition() en useEffect
  // Limpiar watcher en cleanup de useEffect

  return { location, loading, error, getCurrentPosition }
}
```

**3. Crear `src/hooks/useCapacitorNetwork.ts`:**

```typescript
import { Network } from '@capacitor/network'
import { useState, useEffect } from 'react'

export function useCapacitorNetwork() {
  const [isOnline, setIsOnline] = useState(true)
  const [connectionType, setConnectionType] = useState<string>('unknown')

  useEffect(() => {
    // Network.getStatus() al montar
    // Network.addListener('networkStatusChange', handler)
    // Retornar cleanup que llama Network.removeAllListeners()
  }, [])

  return { isOnline, connectionType }
}
```

**Importante:** Actualizar `src/hooks/useOfflineSync.tsx` para que importe y use `useCapacitorNetwork().isOnline` en lugar de `navigator.onLine` y los eventos `window.addEventListener('online'/'offline')`.

**Criterio de éxito:** Los 3 hooks compilan sin errores TypeScript. `useCapacitorNetwork` retorna el estado correcto de red.

---

### Agente B — Push Notifications nativas (reemplaza FCM web)

**Puede ejecutarse en paralelo con:** Agente A, Agente C
**Depende de:** Ola 1 completa (FCM web eliminado, Capacitor instalado)

#### Objetivo
Reimplementar `src/services/fcm.ts` usando `@capacitor/push-notifications` en lugar de Firebase Messaging web (que requería Service Worker).

#### Archivos a modificar
- `src/services/fcm.ts` — reescribir con Capacitor Push Notifications

#### Prompt completo para el agente

Estás en SIG-Agro, Next.js 16 + TypeScript + Capacitor. Proyecto en `c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro`.

En Ola 1 el archivo `src/services/fcm.ts` quedó como stub vacío (se eliminó la lógica web de FCM). Ahora hay que reimplementarlo con Capacitor.

Lee el archivo actual `src/services/fcm.ts` para ver qué métodos públicos tiene (la firma pública NO debe cambiar para no romper los componentes que lo usan).

**Reescribir la clase `FCMService` usando `@capacitor/push-notifications`:**

```typescript
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'

class FCMService {
  private token: string | null = null
  private initialized = false

  isSupported(): boolean {
    return Capacitor.isNativePlatform()  // true en Android/iOS, false en web
  }

  async requestPermission(): Promise<boolean> {
    // PushNotifications.requestPermissions()
    // Retorna true si 'granted', false si no
  }

  async initialize(): Promise<string | null> {
    if (!this.isSupported()) return null
    if (this.initialized) return this.token

    await PushNotifications.register()

    return new Promise((resolve) => {
      PushNotifications.addListener('registration', (token: Token) => {
        this.token = token.value
        this.initialized = true
        resolve(token.value)
      })

      PushNotifications.addListener('registrationError', () => resolve(null))
    })
  }

  async saveTokenToServer(userId: string): Promise<void> {
    if (!this.token) return
    // Mismo código que antes: POST /api/notifications/token
    // Body: { token: this.token, userId, platform: 'android', deviceId: ... }
  }

  async sendNotification(targetUserId: string, type: string, payload: unknown): Promise<void> {
    // Sin cambios — sigue llamando POST /api/notifications/send en el backend
    // El backend ya usa Firebase Admin SDK, no necesita cambio
  }

  onMessage(callback: (notification: PushNotificationSchema) => void): void {
    // PushNotifications.addListener('pushNotificationReceived', callback)
  }

  async showLocalNotification(title: string, options?: { body?: string }): Promise<void> {
    // LocalNotifications plugin (si está instalado)
    // Fallback: console.log en web
  }
}

export const fcmService = new FCMService()
export default FCMService
```

**También agregar en `package.json`** (si no está ya):
```json
"@capacitor/local-notifications": "latest"
```
Y ejecutar `npm install @capacitor/local-notifications`.

**Criterio de éxito:** `src/services/fcm.ts` compila sin errores. No importa `firebase/messaging`. Los componentes que usaban `fcmService.initialize()` siguen funcionando sin cambios de firma.

---

### Agente C — CapacitorProvider + Splash Screen + App lifecycle

**Puede ejecutarse en paralelo con:** Agente A, Agente B
**Depende de:** Ola 1 completa (PWAProvider eliminado, Capacitor instalado)

#### Objetivo
Crear `CapacitorProvider.tsx` que reemplaza a `PWAProvider.tsx`, inicializa Capacitor, oculta el splash screen, y gestiona el ciclo de vida de la app (pausa/resume).

#### Archivos a crear
- `src/components/capacitor/CapacitorProvider.tsx` — inicialización Capacitor y lifecycle
- `src/components/capacitor/OfflineToast.tsx` — reemplaza `OfflineIndicator` del PWAProvider

#### Archivos a modificar
- `src/app/layout.tsx` — importar y usar `CapacitorProvider` en lugar del espacio vacío que dejó `PWAProvider`

#### Prompt completo para el agente

Estás en SIG-Agro, Next.js 16 + React 19 + TypeScript + Capacitor. Proyecto en `c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro`.

En Ola 1 se eliminó `PWAProvider.tsx` del layout. Ahora hay que agregar `CapacitorProvider.tsx`.

**1. Crear `src/components/capacitor/CapacitorProvider.tsx`:**

```typescript
'use client'
import { useEffect, ReactNode } from 'react'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App } from '@capacitor/app'

interface CapacitorProviderProps { children: ReactNode }

export default function CapacitorProvider({ children }: CapacitorProviderProps) {
  useEffect(() => {
    async function initCapacitor() {
      if (!Capacitor.isNativePlatform()) return  // No hacer nada en web/dev

      // Ocultar splash screen tras 2 segundos o cuando la app cargue
      await SplashScreen.hide({ fadeOutDuration: 300 })

      // Configurar status bar oscura (fondo #0f172a del tema)
      await StatusBar.setStyle({ style: Style.Dark })
      await StatusBar.setBackgroundColor({ color: '#0f172a' })

      // Listener: app pasa a background → pausar operaciones
      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          // App en background: no hacer nada especial por ahora
        }
      })

      // Listener: botón back de Android
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp()  // Cerrar app si no hay historial
        } else {
          window.history.back()
        }
      })
    }

    initCapacitor()

    return () => {
      App.removeAllListeners()
    }
  }, [])

  return <>{children}</>
}
```

**2. Crear `src/components/capacitor/OfflineToast.tsx`:**

Componente que muestra un toast en la parte inferior cuando no hay red. Usa `useCapacitorNetwork` (creado por Agente A de esta misma ola).

```typescript
'use client'
import { useCapacitorNetwork } from '@/hooks/useCapacitorNetwork'

export function OfflineToast() {
  const { isOnline, connectionType } = useCapacitorNetwork()

  if (isOnline) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50
                    bg-red-600 text-white text-sm px-4 py-2 rounded-full
                    shadow-lg flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
      Sin conexión — los cambios se sincronizarán al reconectarte
    </div>
  )
}
```

**3. Modificar `src/app/layout.tsx`:**

Agregar después de los imports existentes:
```typescript
import CapacitorProvider from '@/components/capacitor/CapacitorProvider'
import { OfflineToast } from '@/components/capacitor/OfflineToast'
```

Envolver el contenido con `<CapacitorProvider>` y agregar `<OfflineToast />` dentro del body.

**Criterio de éxito:** `CapacitorProvider.tsx` y `OfflineToast.tsx` compilan sin errores. El layout renderiza sin errores en `npm run dev`. En Android, el splash screen se oculta y el botón back funciona.

---

## Ola 3 — Build, verificación y documentación
> Ejecutar SOLO después de que Ola 2 esté completa
> Ejecutar Agente A + Agente B en PARALELO

### Agente A — Build estático + Cap sync + verificación

**Puede ejecutarse en paralelo con:** Agente B
**Depende de:** Ola 2 completa

#### Objetivo
Ejecutar el pipeline completo de build, verificar que no quedan rastros de PWA, y generar el APK de debug.

#### Prompt completo para el agente

Estás en SIG-Agro. Proyecto en `c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro`.

Ejecutar en este orden exacto:

**1. Verificar que no quedan rastros PWA:**
```bash
# Estos archivos NO deben existir:
ls public/sw.js              # debe dar error
ls public/manifest.json      # debe dar error
ls public/firebase-messaging-sw.js  # debe dar error

# Este código NO debe existir en ningún .ts/.tsx:
grep -r "serviceWorker.register" src/   # debe dar 0 resultados
grep -r "firebase-messaging-sw" src/    # debe dar 0 resultados
grep -r "PWAProvider" src/              # debe dar 0 resultados
```

**2. Build estático:**
```bash
npm run build
```
Si hay errores de TypeScript relacionados con las APIs de Capacitor (tipos no encontrados), agregar en `tsconfig.json` en `compilerOptions.types`: `"@capacitor/core"`.

Si hay errores porque API routes no son compatibles con `output: 'export'`, agregar en cada route file problemático:
```typescript
export const dynamic = 'force-static'
// o
export const runtime = 'nodejs'
```

**3. Cap sync:**
```bash
npx cap sync android
```
Esto copia el build de `/out` al proyecto Android.

**4. Verificar APK debug (sin Android Studio):**
```bash
cd android
./gradlew assembleDebug
```
El APK estará en `android/app/build/outputs/apk/debug/app-debug.apk`.

**5. Reportar:**
- Lista de todos los archivos creados/modificados en las 3 olas
- Tamaño del APK de debug
- Cualquier warning importante del build
- Instrucciones para instalar el APK en un dispositivo Android físico:
  ```
  adb install android/app/build/outputs/apk/debug/app-debug.apk
  ```

**Criterio de éxito:** `npm run build` sale con código 0. `npx cap sync` sin errores. APK generado. Cero archivos SW/PWA en el repositorio.

---

### Agente B — Actualizar documentación técnica

**Puede ejecutarse en paralelo con:** Agente A
**Depende de:** Ola 2 completa

#### Objetivo
Actualizar `docs/SIG_AGRO_BASELINE_TECNICA_2026-02-14.md` eliminando toda mención a PWA y documentando la nueva arquitectura Capacitor + Android.

#### Prompt completo para el agente

Estás en SIG-Agro. Lee `docs/SIG_AGRO_BASELINE_TECNICA_2026-02-14.md` y realiza estos cambios:

**1. En Stack efectivo — reemplazar:**

ELIMINAR: `PWA/offline con Service Worker + IndexedDB`
ELIMINAR: `Notificaciones push (FCM) por backend`

AGREGAR:
```
- Capacitor (app Android nativa con WebView)
- @capacitor/push-notifications (push nativo Android)
- @capacitor/camera (cámara nativa)
- @capacitor/geolocation (GPS nativo)
- @capacitor/network (estado de red nativo)
- IndexedDB (persistencia offline — sin cambios)
```

**2. Eliminar la sección "Variables de entorno requeridas para alertas"** (si menciona FCM web tokens).

**3. Agregar nueva sección "## Android (Capacitor)":**

```markdown
## Android (Capacitor)

### Build
- `npm run build` → genera `/out` (static export de Next.js)
- `npx cap sync android` → copia `/out` al WebView Android
- `cd android && ./gradlew assembleDebug` → genera APK

### App ID
`com.agrotech.sigagro`

### Permisos nativos
- `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` — GPS para mapas y scouting
- `CAMERA` — fotos georreferenciadas en scouting
- `READ_MEDIA_IMAGES` / `WRITE_EXTERNAL_STORAGE` — almacenamiento fotos
- `INTERNET` + `ACCESS_NETWORK_STATE` — conectividad
- Push notification permissions — alertas proactivas

### Archivos eliminados (eran PWA)
- `public/sw.js`
- `public/firebase-messaging-sw.js`
- `public/manifest.json`
- `src/components/pwa/PWAProvider.tsx`
- `src/app/offline/page.tsx`

### Archivos nuevos (Capacitor)
- `capacitor.config.ts` — configuración Capacitor
- `android/` — proyecto Gradle Android
- `src/components/capacitor/CapacitorProvider.tsx`
- `src/components/capacitor/OfflineToast.tsx`
- `src/hooks/useCapacitorCamera.ts`
- `src/hooks/useCapacitorGeolocation.ts`
- `src/hooks/useCapacitorNetwork.ts`
```

**4. Actualizar fecha del documento a 2026-05-01.**

---

## Verificación final (manual en dispositivo Android)

- [ ] `public/sw.js` no existe
- [ ] `public/firebase-messaging-sw.js` no existe
- [ ] `public/manifest.json` no existe
- [ ] `grep -r "serviceWorker.register" src/` → 0 resultados
- [ ] `npm run build` → código de salida 0
- [ ] `npx cap sync android` → sin errores
- [ ] APK instala en dispositivo físico Android 10+
- [ ] Splash screen aparece y desaparece
- [ ] Botón back de Android funciona (historial → cierra app)
- [ ] Push notification llega en background
- [ ] Cámara abre desde módulo de scouting
- [ ] GPS obtiene posición en mapa
- [ ] Toast "Sin conexión" aparece al desactivar WiFi
- [ ] IndexedDB persiste datos offline (scouting sin internet)
- [ ] Al reconectar, datos offline se sincronizan

---

## Nota sobre API Routes

Con `output: 'export'` en `next.config.ts`, las API routes (`/api/*`) **no se incluyen en el build estático**. La app Android consume esas APIs desde el servidor (Firebase/Vercel). El flujo es:

```
App Android (WebView) ──fetch──► API routes deployadas en Vercel/Firebase
                      ◄──────── Respuesta JSON
```

La app funciona offline para lectura/scouting (IndexedDB). Las operaciones que requieren servidor (IA, alertas, satélite) necesitan conexión.

---

## Tiempo estimado

| Ola | Tarea | Tiempo |
|-----|-------|--------|
| Ola 1 | Eliminar PWA + instalar Capacitor | 2-3 horas |
| Ola 2 | Wrappers nativos + FCM + Provider | 3-4 horas |
| Ola 3 | Build + docs | 1-2 horas |
| **Total** | | **~1 día de trabajo** |
