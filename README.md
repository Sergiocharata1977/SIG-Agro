# SIG Agro - Don Cándido IA

Sistema de Información Geográfica Agrícola para productores del Chaco argentino.

## 🌾 Descripción

SIG Agro es una plataforma web moderna para la gestión integral de campos agrícolas, con foco en:

- **Gestión de campos y lotes** con visualización GIS
- **Campañas agrícolas** con seguimiento completo
- **Análisis IA** con datos satelitales (Copernicus/Sentinel)
- **Scouting** de cultivos con alertas
- **Contabilidad simple** para operaciones
- **Multi-tenant** para múltiples organizaciones

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Base de datos:** Firebase Firestore
- **Auth:** Firebase Authentication
- **IA:** Google Gemini API
- **PDF:** jsPDF
- **i18n:** next-intl

## ✨ Funcionalidades Implementadas

### Core
- ✅ Multi-tenant (organizaciones)
- ✅ Autenticación Firebase
- ✅ Dashboard responsive (móvil/desktop)
- ✅ PWA/Offline support

### Módulos
- ✅ Campos y Lotes
- ✅ Campañas
- ✅ Operaciones
- ✅ Scouting
- ✅ Weather/Clima
- ✅ VRA (Variable Rate)
- ✅ Contabilidad Simple
- ✅ Terceros/Proveedores

### IA & Análisis
- ✅ Análisis IA con Gemini
- ✅ Integración Copernicus (NDVI, EVI)
- ✅ Dashboard de Análisis IA
- ✅ Alertas inteligentes
- ✅ Recomendaciones automáticas

### Reportes & Notificaciones
- ✅ Reportes PDF (Campaña, Costos, Scouting, Rendimiento)
- ✅ Alertas Push FCM
- ✅ Multi-idioma (ES/EN/PT)

## 📦 Instalación

```bash
# Clonar repositorio
git clone https://github.com/Sergiocharata1977/SIG-Agro.git

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Desarrollo
npm run dev

# Bootstrap automatico (Firebase Auth + Firestore demo)
npm run bootstrap

# Build
npm run build
```

## 🔧 Variables de Entorno

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# Firebase Admin
FIREBASE_SERVICE_ACCOUNT_KEY=

# Gemini IA
GEMINI_API_KEY=

# Copernicus (opcional)
COPERNICUS_CLIENT_ID=
COPERNICUS_CLIENT_SECRET=
```

## 📁 Estructura del Proyecto

```
sig-agro/
├── src/
│   ├── app/              # Pages (App Router)
│   │   ├── (dashboard)/  # Dashboard layout
│   │   ├── api/          # API routes
│   │   └── auth/         # Auth pages
│   ├── components/       # Componentes React
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom hooks
│   ├── i18n/             # Traducciones
│   ├── lib/              # Utilidades
│   ├── services/         # Servicios
│   └── types/            # TypeScript types
├── public/               # Assets estáticos
└── i18n.ts               # Config i18n
```

## 🌐 APIs Disponibles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/ia/chat` | POST | Chat con IA |
| `/api/ia/analizar-lote` | POST | Análisis de lote |
| `/api/ia/recomendacion` | POST | Recomendaciones |
| `/api/satellite/analyze` | POST/GET | Análisis satelital |
| `/api/satellite/prescription` | POST | Mapas VRA |
| `/api/notifications/send` | POST | Enviar push |
| `/api/notifications/token` | POST/DELETE | Gestión tokens FCM |
| `/api/alerts/send` | POST | Alertas |

## 🔗 Links

- **Producción:** [Vercel](https://vercel.com/sergiocharata1977/sig-agro)
- **Repositorio:** [GitHub](https://github.com/Sergiocharata1977/SIG-Agro)
- **Documentación:** [sig-agro-doc](../sig-agro-doc)

## 📄 Licencia

Proyecto privado - Don Cándido IA © 2024
