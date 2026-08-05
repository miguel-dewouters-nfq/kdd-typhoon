---
id: DOM-KYUW-001
type: spec
layer: domain
status: draft
confidence: high
version: 0.2.0
created: 2026-07-01
updated: 2026-07-17
owner: to-be-assigned
dependencies:
  - id: ARCH-KYUW-001
    relation: implemented-on
tags:
  - typhoon
  - autoclose
  - equity
  - index
  - provider-selection
  - refinitiv
  - bloomberg
  - datalicense
  - close-fo-madrid
  - solar
---

# Equity/Index Autoclose Provider Selection Rules

## Intent

Definir las reglas de negocio que gobiernan cómo el autoclose de Typhoon selecciona y valida proveedores de datos de mercado para instrumentos Equity e Index en el cierre de mercado — incluyendo los snapshots objetivo obligatorios, la lógica de categorización del instrumento y el árbol de decisión de selección de proveedor con fallback.

## Definition

### Concept

Cuando un instrumento Equity o Index se da de alta en Typhoon, debe configurarse en el subsistema de autoclose para que Typhoon capture su precio de cierre desde un proveedor de datos de mercado aprobado. La configuración especifica: en qué snapshot participa, a qué categoría pertenece, qué proveedor suministra el precio, qué regla de pricing se aplica y el identificador del vendor (fórmula) usado para recuperar el precio.

Esta configuracion se realiza de forma independiente para dos snapshots distintos: `CLOSE_FO_MADRID` y `SOLAR`. `CLOSE_FO_MADRID` es el cierre operativo principal en Typhoon; `SOLAR` se configura como espejo operativo, aunque puede presentar desalineaciones temporales respecto a FO_MADRID.

### Rules

#### R1 — Snapshots Objetivo Obligatorios

Todo instrumento Equity/Index **debe** estar configurado en los dos snapshots de autoclose siguientes:

| Snapshot | Propósito |
|---|---|
| `CLOSE_FO_MADRID` | Snapshot primario de precio de cierre Front Office Madrid — fuente de verdad |
| `SOLAR` | Snapshot secundario/satelite para continuidad operativa |

Ambas configuraciones usan la misma logica de seleccion de proveedor (R3). `CLOSE_FO_MADRID` es la fuente autoritativa. `SOLAR` debe mantenerse alineado en configuracion, pero su sincronizacion de resultados de cierre no esta garantizada en tiempo real.

#### R2 — Asignación de Categoría del Instrumento

La categoría del autoclose se determina por el Murex Label del instrumento:

| Condición | Categoría |
|---|---|
| Murex Label termina en `IN` o `IND` | `INDEX_PRICE` |
| Cualquier otro Murex Label | `EQUITY PRICE` |

Esta distinción determina cómo Typhoon clasifica y procesa el precio de cierre durante el batch EOD.

#### R3 — Árbol de Decisión de Selección de Proveedor

Los proveedores se prueban en el siguiente orden de prioridad fijo. Los operadores no pueden saltarse pasos.

```
1. Intentar REFINITIV
   ├─ Provider : REFINITIV
   ├─ Rule     : CLOSE_LAST_PREVIOUSCLOSE
   ├─ Formula  : [Reuters RIC]   ← entre corchetes
   ├─ Test formula
   ├─ Resultado = precio válido  →  GUARDAR con Provider=REFINITIV  ✅  (FIN)
   └─ Resultado = error (ej. "Not valid instruments")  →  continuar al paso 2

2. Intentar BLOOMBERG (solo para testear — el provider guardado será DATALICENSE)
   ├─ Provider : BLOOMBERG
   ├─ Rule     : CLOSE_LAST_MID
   ├─ Formula  : [Bloomberg ID]  ← entre corchetes
   ├─ Test formula
   ├─ Resultado = precio válido  →  cambiar Provider a DATALICENSE → GUARDAR  ✅  (FIN)
   └─ Resultado = error  →  ESCALAR al equipo de datos de vendor  ❌
```

**Restricción clave**: cuando el test de Bloomberg tiene éxito, el proveedor guardado en Typhoon es `DATALICENSE`, no `BLOOMBERG`. Bloomberg se usa únicamente para validar la fórmula; la captura real en el cierre usa el feed de Bloomberg Data License (canal DATALICENSE).

#### R4 — Formato de Fórmula

Los identificadores de vendor deben ir entre corchetes en el campo Formula:

| Proveedor | Formato | Ejemplo |
|---|---|---|
| REFINITIV | `[Reuters RIC]` | `[0069.HK]` |
| BLOOMBERG / DATALICENSE | `[Bloomberg ID]` | `[HSBA LN Equity]` |

#### R5 — Reglas de Pricing

| Proveedor | Rule | Semántica |
|---|---|---|
| REFINITIV | `CLOSE_LAST_PREVIOUSCLOSE` | Último precio de cierre disponible; fallback al cierre anterior si el de hoy falta |
| DATALICENSE | `CLOSE_LAST_MID` | Último precio mid disponible desde Bloomberg Data License |

#### R6 — Escalación por Autoclose No Disponible

Si ninguno de los dos proveedores devuelve precio válido, la configuración queda incompleta. El equipo responsable del vendor de datos debe ser notificado con los tickers del instrumento antes de que la petición JBPM pueda considerarse resuelta.

### Constraints

- La asignación de categoría (R2) es inmutable en el momento del alta; una reclasificación requiere una solicitud de cambio separada.
- El orden de proveedores (R3) es fijo: Refinitiv se prueba siempre primero. Saltar directamente a Bloomberg no está permitido.
- `DATALICENSE` debe usarse como proveedor guardado cuando el test de Bloomberg confirma el ticker — no es opcional ni un error.
- Ambos snapshots `CLOSE_FO_MADRID` y `SOLAR` deben recibir configuracion identica de provider/rule/formula para un instrumento dado.
- En el estado actual no existe cierre especifico de BC (Bancomer, Mexico); el cierre de referencia documentado para Equity/Index es Madrid (`CLOSE_FO_MADRID`).

### Examples

**Ejemplo 1 — Instrumento Index, Refinitiv con éxito**
- Murex Label: `NIKKEI225IN` → Categoría: `INDEX_PRICE` (termina en "IN")
- Test Refinitiv con `[.N225]` devuelve `32500.00` ✅
- Guardado: `Provider=REFINITIV`, `Rule=CLOSE_LAST_PREVIOUSCLOSE`, `Formula=[.N225]`
- Aplicado a: `CLOSE_FO_MADRID` y `SOLAR`

**Ejemplo 2 — Instrumento Equity, fallback Bloomberg**
- Murex Label: `HSBA_LN` → Categoría: `EQUITY PRICE` (sin sufijo IN/IND)
- Test Refinitiv con `[HSBA.L]` → `Not valid instruments` ❌
- Test Bloomberg con `[HSBA LN Equity]` → `625.80` ✅
- Guardado: `Provider=DATALICENSE`, `Rule=CLOSE_LAST_MID`, `Formula=[HSBA LN Equity]`
- Aplicado a: `CLOSE_FO_MADRID` y `SOLAR`

## Acceptance Criteria

- [ ] Todo instrumento Equity/Index onboarded tiene entrada en autoclose en los snapshots `CLOSE_FO_MADRID` y `SOLAR`.
- [ ] `CLOSE_FO_MADRID` se mantiene como cierre de referencia; no se asume cierre BC en esta version draft.
- [ ] La asignación de categoría sigue R2 de forma determinista; no se permiten overrides manuales sin solicitud de cambio aprobada.
- [ ] Refinitiv se prueba siempre antes que Bloomberg; confirmado por log de acción del operador.
- [ ] El test exitoso de Bloomberg resulta en `DATALICENSE` (no `BLOOMBERG`) como proveedor guardado.
- [ ] Los instrumentos para los que ningún proveedor devuelve precio nunca se guardan silenciosamente con fórmula incompleta; deben estar en estado de escalación.

## Evidence

- **Fuente primaria**: `docs/Tareas e incidencias comunes.docx` — sección "Alta Equity/Index", sub-sección "Meter el instrumento en el autoclose"

## Traceability

| Artifact | Relation | Notes |
|---|---|---|
| ARCH-KYUW-001 | implemented-on | Las reglas se ejecutan sobre el subsistema autoclose de Typhoon |
| DOM-KYUW-002 | used-by | El workflow de confirmación depende del resultado del autoclose |
| DOC-KYUW-001 | implemented-by | El SOP de Alta Equity/Index aplica estas reglas en el Paso 2 |

