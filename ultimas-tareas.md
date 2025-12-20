# SIG-Agro - Últimas Tareas

**Última actualización:** 2025-12-20

---

## 📊 Estado del Repositorio

Branch: `main` (actualizado con `origin/main`)

---

## 🗑️ Archivos Eliminados (docs-site movido a sig-agro-doc)

| Archivo |
|---------|
| `docs-site/.gitignore` |
| `docs-site/README.md` |
| `docs-site/app/manual-programador/arquitectura/page.tsx` |
| `docs-site/app/manual-programador/firebase/page.tsx` |
| `docs-site/app/manual-programador/page.tsx` |
| `docs-site/app/manual-programador/servicios/page.tsx` |
| `docs-site/app/manual-usuario/introduccion/page.tsx` |
| `docs-site/app/manual-usuario/modulos/campanias/page.tsx` |
| `docs-site/app/manual-usuario/modulos/campos/page.tsx` |
| `docs-site/app/manual-usuario/modulos/labores/page.tsx` |
| `docs-site/app/manual-usuario/modulos/metricas/page.tsx` |
| `docs-site/app/manual-usuario/page.tsx` |
| `docs-site/app/page.tsx` |

---

## ✏️ Archivos Modificados

| Archivo | Descripción |
|---------|-------------|
| `eslint.config.mjs` | Configuración ESLint |
| `next.config.ts` | Configuración Next.js |
| `package-lock.json` | Dependencias actualizadas |
| `scripts/create-super-admin.js` | Script administrador |
| `src/components/layout/Sidebar.tsx` | UI Sidebar |
| `src/services/alerts.ts` | Servicio de alertas |
| `src/services/copernicus.ts` | Integración Copernicus |
| `src/services/satellite-analysis.ts` | Análisis satelital |
| `src/types/index.ts` | Tipos principales |
| `src/types/sig-agro-advanced.ts` | Tipos avanzados |
| `tsconfig.json` | Configuración TypeScript |

---

## ✨ Archivos Nuevos (Para subir)

### Configuración
- `.lintstagedrc.json` - Lint staged config
- `.prettierrc` - Prettier config

### PWA / Offline
- `public/manifest.json` - Manifest PWA
- `public/sw.js` - Service Worker
- `src/app/offline/` - Página offline
- `src/components/pwa/` - Componentes PWA
- `src/lib/indexed-db.ts` - IndexedDB para offline

### Dashboard
- `src/app/(dashboard)/` - Nuevo layout dashboard
- `src/components/layout/DashboardHeader.tsx` - Header del dashboard

### Scouting
- `src/app/api/alerts/` - API de alertas
- `src/components/scouting/` - Componentes scouting
- `src/services/scouting.ts` - Servicio scouting
- `src/types/scouting.ts` - Tipos scouting

### Weather / Clima
- `src/components/weather/` - Componentes clima
- `src/services/weather.ts` - Servicio clima
- `src/types/weather.ts` - Tipos clima

### VRA (Variable Rate Application)
- `src/services/vra.ts` - Servicio VRA
- `src/types/vra.ts` - Tipos VRA

### Contabilidad
- `src/services/asientos-auto.ts` - Asientos automáticos
- `src/services/terceros.ts` - Terceros/Proveedores
- `src/types/contabilidad-simple.ts` - Tipos contabilidad

### Otros
- `src/services/cost-calculator.ts` - Calculador de costos
- `src/hooks/` - Custom hooks
- `src/components/ui/alert-dialog.tsx` - Dialog alertas
- `src/components/ui/avatar.tsx` - Componente avatar
- `src/components/ui/badge.tsx` - Componente badge
- `src/components/ui/dropdown-menu.tsx` - Dropdown menu
- `src/components/ui/tabs.tsx` - Componente tabs
- `src/components/ui/toast.tsx` - Componente toast

---

## 🚀 Próximos Pasos

1. [ ] Revisar y confirmar cambios pendientes
2. [ ] Hacer commit con mensaje descriptivo
3. [ ] Push a repositorio remoto
4. [ ] Verificar deployment en Vercel

---

## 📌 Comando para subir todos los cambios

```bash
git add .
git commit -m "feat: PWA support, Scouting, Weather, VRA, Contabilidad modules"
git push origin main
```
