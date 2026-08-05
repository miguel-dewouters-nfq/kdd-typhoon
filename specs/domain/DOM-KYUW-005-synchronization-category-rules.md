---
id: DOM-KYUW-005
type: spec
layer: domain
status: draft
confidence: high
version: 0.1.0
created: 2026-08-05
updated: 2026-08-05
owner: to-be-assigned
dependencies: []
tags:
  - typhoon
  - synchronization
  - mx3
  - ipv
  - totem
---

# Reglas de Categorias y Estados de Sincronizacion

## Intent

Definir las categorias, snapshots y reglas de control para las sincronizaciones operativas en Typhoon.

## Definition

### Concept

Typhoon sincroniza categorias de mercado desde `Mx3 -> Mx3 Management -> Synchronize` y valida estado en la misma pantalla o en `Ans -> Monitor`.

### Rules

1. **Categorias estandar de sincronizacion**
   - `BASKET_SMILE`
   - `BASKET_VOLATILITY`
   - `INDEX_SMILE`
   - `INDEX_VOLATILITY`
   - `EQUITY_SMILE`
   - `EQUITY_VOLATILITY`
   - `REPO_MARGIN`

2. **Snapshot para volatilities/repo**
   - Usar `CLOSE_IPV`.

3. **Snapshot para TOTEM**
   - Usar `IPV TOTEM`.
   - Marcar `Past Date` e informar ultimo dia del mes anterior.

4. **Regla de ejecucion por categoria**
   - Lanzar sincronizacion categoria a categoria desde el icono `Synchronize today`.

5. **Regla de seguimiento de estado**
   - Estado inicial esperado: `PROCESSING`.
   - Estado final esperado:
     - En Mx3: fecha/hora reciente.
     - En Ans Monitor para TOTEM: `OK`.

6. **Regla para sincronizaciones historicas de FIXING_DIVIDENDS**
   - Para fechas fuera de ventana reciente (segun peticion), lanzar `Past Date` por cada fecha solicitada.

### Constraints

- No cerrar una solicitud como completada mientras exista alguna categoria en `PROCESSING`.
- En TOTEM, el rango de fechas en monitorizacion debe usar la misma fecha inicio/fin (ultimo dia del mes anterior).

### Examples

- Flujo diario: `Snapshot=CLOSE_IPV`, categoria `REPO_MARGIN`, `Synchronize today`, esperar fin de `PROCESSING`.
- Flujo TOTEM: `Snapshot=IPV TOTEM`, `Past Date=2026-07-31`, seguimiento en `Ans -> Monitor` hasta `OK`.

## Acceptance Criteria

- [ ] Las siete categorias estandar quedan documentadas sin ambiguedad.
- [ ] Se diferencia el flujo `CLOSE_IPV` del flujo `IPV TOTEM`.
- [ ] Se documenta estado esperado de inicio y fin.
- [ ] Se incluye regla de sincronizacion historica para `FIXING_DIVIDENDS`.

## Evidence

- Fuente: `docs/Tareas e incidencias comunes.docx` (secciones "Sincronizacion de volatilities y repo", "Sincronizacion IPV TOTEM", "Modificacion Puntos de Indices Historicos").

## Traceability

- Operacionalizado por: `DOC-KYUW-004`

