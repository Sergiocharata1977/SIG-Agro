# Design System SIG Agro

Estandar UI de referencia para todo desarrollo nuevo de pantallas ABM y operaciones.

## Estructura

- `tokens`: colores, tipografia, radios, sombras, spacing.
- `primitives`: `BaseButton`, `BaseCard`, `BaseBadge`.
- `layout`: `PageHeader`, `PageToolbar`, `Section`.
- `patterns`: piezas ABM (`AbmEntityCard`, `AbmFormLayout`, `ListTable`, `ListGrid`).

## Reglas

1. Pantallas nuevas deben usar componentes de `design-system`.
2. Si se modifica una variante global, se cambia aca, no en cada modulo.
3. ABM debe usar `PageHeader + PageToolbar + Section + ListTable/ListGrid`.

## Demo

Ruta de referencia: `/super-admin/design-system`.
