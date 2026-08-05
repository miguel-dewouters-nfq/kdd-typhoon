---
id: DOM-KYUW-004
type: spec
layer: domain
status: draft
confidence: high
version: 0.1.0
created: 2026-08-05
updated: 2026-08-05
owner: to-be-assigned
dependencies:
  - id: DOM-KYUW-001
    relation: extends
tags:
  - typhoon
  - futures
  - options
  - autoclose
  - setup
---

# Reglas de Alta para Futures y Options

## Intent

Formalizar las reglas operativas para tratar peticiones de derivados (FUTURE y OPTION) en Typhoon.

## Definition

### Concept

La peticion se enruta por el campo `Type of Instrument` de JBPM:

- `OPTION`: no se configura en Typhoon; se archiva la peticion.
- `FUTURE`: se configura autoclose en Typhoon y se confirma la peticion.

### Rules

1. **Regla de enrutado por tipo**
   - Si `Type of Instrument = OPTION`: finalizar sin setup.
   - Si `Type of Instrument = FUTURE`: continuar con setup.

2. **Datos minimos para FUTURE**
   - `MUREX Label`
   - `BBG CODE`
   - `MATURITY` o `MATURITY DATE` (al menos uno informado)

3. **Regla de proveedor para FUTURE**
   - Provider: `BLOOMBERG`
   - Rule: `CLOSE_LAST_MID`
   - Formula: `[BBG CODE]`
   - No aplica fallback a `REFINITIV` ni a `DATALICENSE`.

4. **Regla de categoria para FUTURE**
   - En `Closing Process -> Autoclose Instruments`, la categoria debe contener `FUTURE`.

5. **Regla de error funcional**
   - Si `Test formula` devuelve error (ej. `Not valid instruments`), se informa en el hilo del email y no se guarda configuracion invalida.

### Constraints

- Esta regla no reemplaza `DOM-KYUW-001`; la extiende para derivados.
- No se debe intentar alta de OPTION en flujo de autoclose.
- Para FUTURE, no se debe guardar configuracion sin test exitoso.

### Examples

- `OPTION` -> archivar email, sin acciones en Typhoon.
- `FUTURE` con `BBG CODE = MOV26 Comdty` -> formula `[MOV26 Comdty]` -> test OK -> `Save`.

## Acceptance Criteria

- [ ] El flujo distingue OPTION y FUTURE antes de cualquier configuracion.
- [ ] Para FUTURE siempre se usa `BLOOMBERG + CLOSE_LAST_MID + [BBG CODE]`.
- [ ] El flujo exige `MATURITY` o `MATURITY DATE`.
- [ ] No se registra `Save` cuando el test devuelve error.

## Evidence

- Fuente: `docs/Tareas e incidencias comunes.docx` (seccion "Alta futuros y opciones").

## Traceability

- Extiende: `DOM-KYUW-001`
- Operacionalizado por: `DOC-KYUW-003`

