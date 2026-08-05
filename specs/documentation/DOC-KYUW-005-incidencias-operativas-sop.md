---
id: DOC-KYUW-005
type: spec
layer: documentation
status: draft
confidence: medium
version: 0.1.0
created: 2026-08-05
updated: 2026-08-05
owner: to-be-assigned
dependencies:
  - id: ARCH-KYUW-005
    relation: uses-data-from
  - id: ARCH-KYUW-008
    relation: uses-data-from
tags:
  - typhoon
  - sop
  - incidents
  - splunk
  - markit
---

# Incidencias Operativas - SOP

## Intent

Registrar procedimientos operativos recurrentes no cubiertos en el alta base: relanzar alerta de monitorizacion y alta de curva Markit.

## Definition

### Purpose

Dar un runbook accionable para resolver incidencias repetitivas desde el frontal Typhoon y consultas SQL operativas.

### Audience

Operadores de soporte Typhoon L1/L2.

### Accesos y URLs

- Integrado: `https://ei-wbamdesktop.es.igrupobbva/ENOA/com.bbva.kyuw-typhoonfront-typhoon-1/#/`
- Preproduccion: `https://au-wbamdesktop.es.igrupobbva/ENOA/com.bbva.kyuw-typhoonfront-typhoon-1/#/`
- Produccion: `https://cibdesktop.es.igrupobbva/ENOA/com.bbva.kyuw-typhoonfront-typhoon-1/#/`

### Content

#### Trigger - Incidencia operativa o peticion funcional

Este SOP aplica cuando llega una solicitud de relanzado de alerta o una peticion de alta de curva Markit.

#### Procedimiento 1 - Relanzar alerta Splunk

1. Ir a `Ans -> Tools -> Database`.
2. Ejecutar query SQL con el nombre de alerta solicitado (`Nombre_alerta`):

```sql
select cfa.des_geograph as GEOGRAFIA, anm.des_al_name as ALERT_NAME, aty.des_al_type as ALERT_TYPE,
des_cfgkey as KEY, des_cfgvalue as VALUE from kyuw.tkyuwcfa cfa, kyuw.tkyuwanm anm,
kyuw.tkyuwaty aty where cfa.cod_al_name=anm.cod_al_name and cfa.cod_al_type=aty.cod_al_type
AND anm.des_al_name = 'Nombre_alerta' ORDER BY GEOGRAFIA, ALERT_NAME, ALERT_TYPE DESC
```

3. Extraer del resultado: `ALERT_TYPE`, `ALERT_NAME`, `GEOGRAFIA`.
4. Ir a `Tools -> Api Invoker`.
5. En `API Name`, elegir `tymonitor` en la version mas reciente disponible.
6. En `Endpoint`, elegir `[get] /monitor/alert/{alertType}/{alertName}/{geography}` y clicar `Fill`.
7. Abrir la pestana `Params` y rellenar con los 3 datos extraidos.
8. Clic en `Send`.

Resultado esperado: invocacion enviada sin error y alerta relanzada.

Error comun: ejecutar endpoint sin `Fill` y dejar params vacios.

Que NO hacer: usar una version antigua de `tymonitor` si hay una mas reciente validada.

#### Procedimiento 2 - Alta de curva Markit

1. Abrir en Drive el Excel `Lista de curvas para Markit`.
2. En pestana `KYUW`, en la primera fila vacia:
   - Columna `A`: nombre de curva.
   - Columna `B`: instrumento (ejemplo del documento: `HEATFUNSNRFOREURMM14`).
   - Columna `C`: divisa extraida del instrumento (ejemplo: `EUR`).
3. Arrastrar formulas/queries del resto de columnas segun plantilla.
4. Ir a `Ans -> Tools -> Database`.
5. Ejecutar primero la query de columna `F`.
6. Ejecutar despues las queries hasta columna `L` (inclusive).
7. Ejecutar al final columnas `D` y `E`.
8. Responder al hilo de email confirmando alta de curva.

Resultado esperado: curva creada y trazabilidad cerrada por email.

Que NO hacer: cambiar el orden de ejecucion de queries (`F..L` antes de `D/E`).

## Acceptance Criteria

- [ ] El procedimiento de relanzado incluye query, API y endpoint exactos.
- [ ] El procedimiento de curva Markit documenta campos y orden de queries.
- [ ] Ambos procedimientos cierran con confirmacion en el hilo de email.

## Traceability

| Artifact | Relation | Notes |
|---|---|---|
| ARCH-KYUW-005 | uses-data-from | Operativa ligada a monitorizacion/alertas |
| ARCH-KYUW-008 | uses-data-from | Acciones ejecutadas en interfaz Typhoon |
| Fuente | - | `docs/Tareas e incidencias comunes.docx` (secciones "Relanzar alerta Splunk", "Alta de curva Markit") |

