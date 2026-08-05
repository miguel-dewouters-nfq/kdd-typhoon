---
id: DOC-KYUW-004
type: spec
layer: documentation
status: draft
confidence: high
version: 0.1.0
created: 2026-08-05
updated: 2026-08-05
owner: to-be-assigned
dependencies:
  - id: DOM-KYUW-005
    relation: implements
  - id: ARCH-KYUW-008
    relation: uses-data-from
tags:
  - typhoon
  - sop
  - synchronization
  - mx3
  - totem
---

# Sincronizaciones Mx3 - SOP Operativo

## Intent

Documentar los procedimientos de sincronizacion de curvas/categorias en Typhoon para `CLOSE_IPV`, `IPV TOTEM` y `FIXING_DIVIDENDS`.

## Definition

### Purpose

Permitir ejecucion y seguimiento de sincronizaciones de forma repetible, con control de estados y trazabilidad por email.

### Audience

Operadores de soporte Typhoon L1/L2.

### Accesos y URLs

- Integrado: `https://ei-wbamdesktop.es.igrupobbva/ENOA/com.bbva.kyuw-typhoonfront-typhoon-1/#/`
- Preproduccion: `https://au-wbamdesktop.es.igrupobbva/ENOA/com.bbva.kyuw-typhoonfront-typhoon-1/#/`
- Produccion: `https://cibdesktop.es.igrupobbva/ENOA/com.bbva.kyuw-typhoonfront-typhoon-1/#/`

### Content

#### Trigger - Solicitud por email

Este SOP se ejecuta cuando llega un email pidiendo sincronizacion (por ejemplo repo/vol o TOTEM) o cuando se solicita modificacion de puntos historicos.

#### Flujo A - Sincronizacion de volatilities y repo (`CLOSE_IPV`)

Ruta: `Mx3 -> Mx3 Management -> Synchronize`.

1. En `Snapshot`, seleccionar `CLOSE_IPV`.
2. Para cada categoria:
   - `BASKET_SMILE`
   - `BASKET_VOLATILITY`
   - `INDEX_SMILE`
   - `INDEX_VOLATILITY`
   - `EQUITY_SMILE`
   - `EQUITY_VOLATILITY`
   - `REPO_MARGIN`
3. En `Filter`, escribir la categoria.
4. En la fila, clic en icono `Synchronize today` (dos flechas circulares).
5. En popup, clic en `Synchronize`.
6. Repetir para cada categoria.
7. Clic en `Refresh` (arriba derecha) cada pocos minutos.
8. Verificar que cada fila pasa de `PROCESSING` a fecha/hora reciente.

Resultado esperado: todas las categorias finalizadas sin `PROCESSING`.

Que NO hacer: lanzar todas las categorias sin seguimiento posterior.

#### Flujo B - Sincronizacion IPV TOTEM (fin de mes)

Ruta de lanzamiento: `Mx3 -> Mx3 Management -> Synchronize`.

1. En `Snapshot`, seleccionar `IPV TOTEM`.
2. En `Filter`, buscar cada categoria indicada en email.
3. Clic en `Synchronize today`.
4. En popup:
   - Marcar `Past Date`.
   - Informar la fecha del ultimo dia del mes anterior.
   - Clic en `Synchronize`.
5. Repetir por categoria.

Ruta de seguimiento: `Ans -> Monitor`.

6. `Snapshot = IPV TOTEM`.
7. `Category = *`.
8. En `Date Range`, poner la misma fecha (inicio/fin = ultimo dia del mes anterior).
9. Clic en `Display`.
10. Refrescar con `Display` hasta que cada categoria pase de `PROCESSING` a `OK`.

Resultado esperado: todas las categorias `OK` en monitor.

Error comun: usar fecha distinta en inicio y fin del rango.

Que NO hacer: confirmar fin de sincronizacion mientras alguna fila siga en `PROCESSING`.

#### Flujo C - Modificacion puntos de indices historicos (`FIXING_DIVIDENDS`)

Ruta: `Mx3 -> Mx3 Management -> Synchronize`.

1. `Snapshot = CLOSE_IPV`.
2. En `Filter`, escribir `FIXING_DIVIDENDS`.
3. Clic en `Synchronize today`.
4. En popup, clic en `Synchronize` para fecha actual.
5. En peticiones con fechas historicas adicionales:
   - Repetir el lanzamiento.
   - Marcar `Past Date`.
   - Informar cada fecha solicitada en el email.
6. Monitorizar con `Refresh` hasta fin de `PROCESSING`.

Resultado esperado: ejecuciones actual e historicas completadas.

Que NO hacer: omitir fechas historicas solicitadas en el correo.

## Acceptance Criteria

- [ ] El SOP incluye rutas exactas de menu y botones para los 3 flujos.
- [ ] Se documentan las siete categorias de `CLOSE_IPV`.
- [ ] Se documenta `Past Date` en TOTEM y sincronizacion historica.
- [ ] El control de estado (`PROCESSING` -> completado/`OK`) queda explicitado.

## Traceability

| Artifact | Relation | Notes |
|---|---|---|
| DOM-KYUW-005 | implements | Reglas de categorias, snapshots y estados |
| ARCH-KYUW-008 | uses-data-from | Procedimiento ejecutado en frontal Typhoon |
| Fuente | - | `docs/Tareas e incidencias comunes.docx` (secciones "Sincronizacion de volatilities y repo", "Sincronizacion IPV TOTEM", "Modificacion Puntos de Indices Historicos") |

