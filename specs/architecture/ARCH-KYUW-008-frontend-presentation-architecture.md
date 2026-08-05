---
id: ARCH-KYUW-008
type: spec
layer: architecture
status: draft
confidence: medium
version: 0.2.0
created: 2026-07-01
updated: 2026-07-17
owner: to-be-assigned
dependencies:
  - id: ARCH-KYUW-001
    relation: implements
  - id: ARCH-KYUW-002
    relation: constrained-by
  - id: ARCH-KYUW-007
    relation: related
tags:
  - typhoon
  - frontend
  - angular
  - spa
  - nova-cdn
  - gui
  - z-table
  - market-operations
---

# Typhoon Frontend Presentation Architecture

## Intent

Definir la arquitectura de la capa de presentación frontend de Typhoon — la SPA Angular servida a través de NOVA CDN que proporciona a operadores, equipos de riesgo e ingenieros de soporte acceso interactivo a la gestión de instrumentos, monitorización de salud del sistema y auditoría de cierres de mercado.

## Definition

### Context

Typhoon es principalmente un sistema de procesamiento de datos backend, pero una parte significativa de su valor operativo se materializa a través de una interfaz de usuario. Los operadores necesitan configurar diccionarios de instrumentos, los ingenieros de soporte necesitan inspeccionar trazas y salud del sistema, y los equipos de riesgo necesitan auditar y validar el procesamiento del cierre de mercado.

### Decision

El frontend se implementa como una **SPA Angular** entregada vía **NOVA CDN**:

| Aspecto | Elección |
|---|---|
| Framework | Angular |
| Entrega | NOVA CDN (infraestructura CDN corporativa) |
| Rendimiento para tablas grandes | Componente `z-table` de alto rendimiento |
| Comunicación con backend | Llamadas HTTP API al NOVA API Core (endpoints REST, securizados vía XMAS) |

**URLs frontend Typhoon por entorno**:

- Integrado: `https://ei-wbamdesktop.es.igrupobbva/ENOA/com.bbva.kyuw-typhoonfront-typhoon-1/#/`
- Preproduccion: `https://au-wbamdesktop.es.igrupobbva/ENOA/com.bbva.kyuw-typhoonfront-typhoon-1/#/`
- Produccion: `https://cibdesktop.es.igrupobbva/ENOA/com.bbva.kyuw-typhoonfront-typhoon-1/#/`

**Cinco áreas funcionales principales de la GUI**:

1. **Gestión del diccionario de instrumentos** — CRUD visual de registros de instrumentos; búsqueda, filtrado, transiciones de estado, operaciones masivas.
2. **Monitorización de salud del sistema** — Vista en tiempo real del estado de los servicios Typhoon, conexiones de feeds activas (B-Pipe, TREP, etc.) y estados del pipeline de procesamiento.
3. **Monitorización de trazas** — Inspección de trazas de procesamiento de instrumentos individuales o flujos de datos; usada por soporte en investigación de incidentes.
4. **Lanzamiento de extracciones manuales** — Dispara extracción de datos bajo demanda desde proveedores fuera de la planificación habitual; usado para recuperación de precios perdidos.
5. **Auditoría del cierre de mercado** — Revisión y validación del procesamiento EOD; confirma qué instrumentos se cerraron correctamente, cuáles tuvieron excepciones y proporciona capacidad de re-trigger.

### Rationale

- Angular proporciona un framework SPA estructurado y mantenible, consistente con los estándares frontend BBVA para herramientas internas enterprise.
- La entrega vía NOVA CDN desacopla el hosting de activos estáticos del backend; la SPA puede actualizarse independientemente de los despliegues del Core.
- `z-table` se usa porque los diccionarios de instrumentos en Global Markets pueden contener decenas de miles de filas; las tablas HTML estándar o grids sin virtualización provocan degradación severa del rendimiento del navegador a esa escala.

### Consequences

- Los despliegues del frontend son independientes de los del Core (CDN), pero deben versionarse en sincronía con cambios rupturistas de API en el NOVA API Core.
- Los usuarios deben autenticarse y autorizarse a través de la arquitectura de seguridad XMAS; la gestión de sesión y renovación de tokens deben implementarse en el cliente.
- `z-table` es una dependencia de componente especializada; su actualización o sustitución requiere un refactor frontend significativo.

## Acceptance Criteria

- [ ] La SPA Angular carga dentro de un presupuesto de rendimiento definido (ej. < 3 segundos en red corporativa para carga inicial).
- [ ] `z-table` renderiza listas de instrumentos de hasta 50.000 filas sin degradación del frame rate del navegador.
- [ ] Todas las acciones de usuario que mutan estado estan protegidas por confirmacion y producen una entrada en el audit log de Oracle 19.
- [ ] La vista de monitorización de salud refresca el estado del sistema en ≤ 30 segundos (polling o push vía WebSocket).
- [ ] La SPA sólo es accesible a usuarios autenticados; el acceso no autenticado redirige al flujo de login XMAS.
- [ ] La vista de auditoría de cierre proporciona una lista filtrable de todos los instrumentos de un ciclo de cierre dado con estado (OK / excepción / re-triggered).

## Evidence

- **Fuente primaria**: `docs/Info Typhoon.docx` — sección "Capa de Presentación (Frontend)"

## Traceability

| Artifact | Relation | Notes |
|---|---|---|
| ARCH-KYUW-001 | implements | Parte de la arquitectura Typhoon |
| ARCH-KYUW-002 | constrained-by | La SPA Angular consume exclusivamente endpoints REST del NOVA API Core |
| ARCH-KYUW-007 | related | Los lanzamientos de extracción manual desde la GUI alimentan el pipeline de distribución |

