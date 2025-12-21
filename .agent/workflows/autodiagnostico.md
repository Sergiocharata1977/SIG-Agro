---
description: Ejecutar autodiagnóstico cuando hay problemas de rendimiento o errores
---

# Workflow de Autodiagnóstico

Usa este workflow cuando sientas que la IA está fallando, trabándose o trabajando lento.

## Comando rápido

Solo escribe: `/autodiagnóstico` o pega este prompt:

---

## Checklist de Verificación

### 1. Acceso a Recursos

// turbo

```bash
# Verificar que puedo leer documentación
Get-ChildItem -Path "." -Filter "*.md" -Name
```

// turbo

```bash
# Verificar .gitignore
Get-Content ".gitignore" | Select-String "\.md"
```

### 2. Verificar Workflows Disponibles

// turbo

```bash
# Listar workflows
Get-ChildItem -Path ".agent/workflows" -Name 2>$null
```

### 3. Verificar Conexión a docs-9001app (si está corriendo)

```bash
# Solo si docs-9001app está en localhost:3001
Invoke-RestMethod -Uri "http://localhost:3001/api/roadmap/cards" -Method GET 2>$null | ConvertTo-Json
```

## Diagnóstico Automático

La IA debe responder con una tabla:

| Área         | Estado | Problema | Solución |
| ------------ | ------ | -------- | -------- |
| Acceso a .md | ✅/❌  | ...      | ...      |
| Gitignore    | ✅/❌  | ...      | ...      |
| Workflows    | ✅/❌  | ...      | ...      |
| Contexto     | ✅/❌  | ...      | ...      |
| API Kanban   | ✅/❌  | ...      | ...      |

## Causas Comunes de Fallos

1. **Gitignore bloqueando archivos**
   - Síntoma: No puedo leer documentación
   - Solución: Agregar excepciones al .gitignore

2. **Pérdida de contexto**
   - Síntoma: Pregunto cosas que ya deberías saber
   - Solución: Usar `/load-context` al inicio

3. **Conversaciones largas**
   - Síntoma: Respuestas más lentas, olvido cosas
   - Solución: Iniciar nueva conversación

4. **Archivos muy grandes**
   - Síntoma: Timeout al leer archivos
   - Solución: Leer archivos en chunks

5. **Comandos no aprobados**
   - Síntoma: Comandos quedan "pendientes"
   - Solución: Aprobar comandos en la UI

## Prompt de Emergencia

Si nada funciona, usa este prompt:

```
RESET: Ignora todo el contexto previo de esta conversación.

1. Lee README.md del proyecto actual
2. Lista la estructura de carpetas principales (src/, scripts/, .agent/)
3. Dime qué proyecto es y en qué estado está
4. Pregúntame qué quiero hacer

NO asumas nada. Empieza de cero.
```

// turbo-all
