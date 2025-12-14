# SIG Agro - Documentación

Sistema de documentación para SIG Agro (Sistema de Información y Gestión Agropecuaria).

## 🚀 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo (puerto 3002)
npm run dev

# Build de producción
npm run build
```

## 📁 Estructura

```
docs-site/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── manual-usuario/             # Manual de usuario
│   │   ├── page.tsx
│   │   └── modulos/
│   │       ├── campos/
│   │       ├── campanias/
│   │       └── labores/
│   └── manual-programador/         # Manual técnico
│       └── page.tsx
├── components/
│   └── Navigation.tsx
└── package.json
```

## 🌐 Acceso

- Desarrollo: http://localhost:3002
- El puerto 3002 se usa para no conflictuar con otros proyectos

## 📚 Contenido

### Manual de Usuario
- Gestión de Campos y Lotes
- Campañas Agrícolas
- Labores Culturales
- Métricas y Dashboard

### Manual de Programadores
- Arquitectura del sistema
- Firebase y Multi-tenancy
- Servicios y APIs
- Componentes GIS
