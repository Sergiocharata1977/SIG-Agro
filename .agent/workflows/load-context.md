---
description: Load project context for efficient work sessions
---

# Context Loading Workflow

Este workflow carga el contexto del proyecto al inicio de cada sesión de trabajo.

## Fuentes de Contexto

### 1. Documentación Principal (docs-9001app)

La documentación vive en el proyecto separado `docs-9001app`:

- Manual de Usuario: `/manual-usuario`
- Manual de Programador: `/manual-programador`
- Estado del Proyecto: `/estado`
- Roadmap Kanban: `/roadmap`

### 2. Roadmap API (cuando docs-9001app está corriendo en localhost:3001)

```bash
# Ver todas las tarjetas del Kanban
GET http://localhost:3001/api/roadmap/cards
```

### 3. Archivos Locales en sig-agro

Leer estos archivos para contexto rápido:

- `README.md` - Descripción general

## Pasos para Cargar Contexto

1. **Leer README.md** - Para saber qué es este proyecto
2. **Consultar Kanban API** (si disponible) - Para estado en tiempo real

## Notas

- Los archivos .md están en .gitignore (no suben al repo)
- La documentación oficial vive en docs-9001app
- El Kanban tiene API REST para manipular tarjetas

// turbo-all
