---
id: DOC-KYUW-001
type: spec
layer: documentation
status: draft
confidence: high
version: 0.2.0
created: 2026-07-01
updated: 2026-07-17
owner: to-be-assigned
dependencies:
  - id: DOM-KYUW-001
    relation: implements
  - id: DOM-KYUW-002
    relation: implements
  - id: ARCH-KYUW-008
    relation: uses-data-from
tags:
  - typhoon
  - equity
  - index
  - alta
  - onboarding
  - sop
  - autoclose
  - jbpm
  - enoa
  - runbook
  - operator-procedure
---

# Alta Equity/Index — Standard Operating Procedure

## Intent

Documentar el procedimiento operativo completo, paso a paso, para dar de alta un instrumento Equity o Index en Typhoon a raiz de una peticion JBPM del equipo de Securities and Reference Data. Este SOP cubre la extraccion de datos de JBPM/ENOA, la configuracion del autoclose con logica de fallback de proveedor, el registro del instrumento en base de datos y la confirmacion de la peticion.

## Definition

### Purpose

Este SOP lo ejecuta el equipo de soporte Typhoon (L1/L2) cuando un instrumento Equity o Index nuevo necesita configurarse en Typhoon para la captura de su precio de cierre de mercado.

### Audience

Operadores de soporte Typhoon L1/L2.

### Accesos y URLs

- Integrado: `https://ei-wbamdesktop.es.igrupobbva/ENOA/com.bbva.kyuw-typhoonfront-typhoon-1/#/`
- Preproduccion: `https://au-wbamdesktop.es.igrupobbva/ENOA/com.bbva.kyuw-typhoonfront-typhoon-1/#/`
- Produccion: `https://cibdesktop.es.igrupobbva/ENOA/com.bbva.kyuw-typhoonfront-typhoon-1/#/`

### Scope

Este documento describe operativa detallada de alta Equity/Index. No debe reutilizarse como resumen high-level de Typhoon.

### Content

---

#### Trigger — Email tipo

El procedimiento comienza cuando llega un email con asunto en el formato:

```
INFO:EQUITY - SETUP DONE BY SECURITIES & REFERENCE DATA (ISIN: <ISIN>)
```

El email contiene un hyperlink a la aplicación ENOA para procesar la petición JBPM.

---

#### Paso 1 — Extraer datos del JBPM (Sacar los datos)

1. Hacer clic en el link del email (`Please, press this link, to access the application to continue this task`) → se abre la aplicación **ENOA**.
2. En ENOA, pegar el ISIN del asunto en el campo **"Find By.."** → Enter → clic en el resultado.
3. **Si la petición no aparece**: pasar el ratón sobre el hueco a la derecha de "Find By.." → clic en **"Search Securities"** → clic en el botón **"Search Securities"** que aparece a la izquierda encima de "Clear Filters" → introducir el ISIN en el campo **"ISIN"** → **"Search"** → clic en el valor de la columna **"BPM ID"**.
4. En la petición JBPM, ir a la pestaña **MUREX/4SIGHT Data** y recoger:

| Campo | Fuente | Nota |
|---|---|---|
| ISIN | Pestaña MUREX/4SIGHT Data | |
| Market | Pestaña MUREX/4SIGHT Data | |
| Murex Label | Pestaña MUREX/4SIGHT Data | ⚠️ Si está vacío o incorrecto → usar "Murex Instrument Label" de la pestaña **SECURITIES & REFERENCE DATA** |
| Currency | Pestaña MUREX/4SIGHT Data | |
| Reference Price | Pestaña MUREX/4SIGHT Data | Se usará para validar que el resultado del test de fórmula es coherente |
| Reuters RIC | Pestaña MUREX/4SIGHT Data | |
| Bloomberg ID | Pestaña MUREX/4SIGHT Data | |

---

#### Paso 2 — Configurar el autoclose en Typhoon (Meter en el autoclose)

> ⚠️ **No cerrar la web de Typhoon** al terminar este paso — se necesita abierta para el Paso 3.

Este paso se ejecuta **dos veces**: una vez para el snapshot `CLOSE_FO_MADRID` y otra para `SOLAR`. La configuracion de proveedor/regla/formula debe ser identica en ambas ejecuciones. Nota: `SOLAR` puede no quedar sincronizado en resultado con `CLOSE_FO_MADRID` en tiempo real. (-> `DOM-KYUW-001 R1`)

**2a. Navegar**

Typhoon frontend → **Closing Process** → **Autoclose Instruments**

**2b. Seleccionar snapshot y categoría** (→ `DOM-KYUW-001 R1, R2`)

- **Snapshot**: seleccionar `CLOSE_FO_MADRID` (1ª ejecución) o `SOLAR` (2ª ejecución).
- **Categoría**:
  - Murex Label termina en `IN` o `IND` → seleccionar `INDEX_PRICE`
  - Cualquier otro Murex Label → seleccionar `EQUITY PRICE`

**2c. Mostrar y localizar el instrumento**

1. Clic en **"Display"**.
2. Marcar **"Show all instruments"**.
3. Pegar el Murex Label en el campo **"Filter"**.
4. En la fila del instrumento, clic en el icono ✏️ (**Edit**) en el extremo derecho.

**2d. Configurar proveedor — Refinitiv primero** (→ `DOM-KYUW-001 R3, R4, R5`)

En la ventana de edición:

| Campo | Valor |
|---|---|
| Provider | `REFINITIV` |
| Rule | `CLOSE_LAST_PREVIOUSCLOSE` |
| Formula | `[Reuters RIC]` ← ej. `[0069.HK]` |

Clic en **"Test formula"** y esperar el resultado.

- ✅ El resultado es un número (aproximadamente el Reference Price del Paso 1) → clic **"Save"**. Esta ejecución del autoclose está completa.
- ❌ El resultado es un error (ej. `Not valid instruments`) → continuar al paso 2e.

**2e. Fallback — Bloomberg / DATALICENSE** (→ `DOM-KYUW-001 R3`)

Cambiar los valores en la ventana de edición:

| Campo | Valor |
|---|---|
| Provider | `BLOOMBERG` |
| Rule | `CLOSE_LAST_MID` |
| Formula | `[Bloomberg ID]` ← ej. `[HSBA LN Equity]` |

Clic en **"Test formula"** y esperar.

- ✅ El resultado es un número → **cambiar Provider a `DATALICENSE`** (no guardar con BLOOMBERG) → clic **"Save"**. ✅
- ❌ El resultado sigue siendo un error → anotar para el Paso 4; esta ejecución no se puede configurar automáticamente. ❌

Repetir los pasos 2a–2e seleccionando ahora **`SOLAR`** como snapshot.

---

#### Paso 3 — Registrar el instrumento en base de datos (Meter en base de datos)

Todavía en la pantalla del autoclose de Typhoon del Paso 2 (no cerrar):

**3a. Encontrar un instrumento de referencia**

1. En el campo **"Filter"**, borrar letras del final del Murex Label progresivamente hasta que en la lista aparezcan otros labels que:
   - Tengan el **mismo valor en la columna "Market"** que el instrumento que se está dando de alta, Y
   - Tengan valores no vacíos en las columnas **"First Provider"** y **"First Resource"**.
2. Copiar uno de esos labels (se usará como plantilla de configuración).

**3b. Crear el instrumento**

3. Ir a Typhoon → **Ans** → **Instruments** → **Create Instrument**.
4. Pegar el **label de referencia copiado** en el campo **"Instrument"** → clic **"Search"** → esperar a que cargue la página (esto carga la configuración del instrumento de referencia como base).
5. Sustituir el label por el **Murex Label del instrumento que se está dando de alta** → clic **"Search"** → en el popup que aparece clic **"Confirm"**.

**3c. Configurar atributos e identificadores**

6. Sección **"Attributes"**: localizar la fila con Key = `ISIN` → pegar el ISIN del instrumento en la columna **"Value"**.
7. Sección **"Dictionary Info"**: verificar que tanto `BLOOMBERG` como `REUTERS` aparecen en la columna **"Provider"**.
   - Si falta alguno: clic en el botón **"+"** (extremo derecho) → seleccionar el o los providers faltantes → clic **"Ok"**.
8. Columna **"RIC"**: pegar el **Bloomberg ID** y el **Reuters RIC** del Paso 1.

**3d. Activar feeds de tiempo real**

9. En la sección **"Realtime"** (parte superior de la página), hay 4 ticks: **Realtime**, **Tick History**, **Realtime Subscription**, **Delayed**. Para cada uno, de izquierda a derecha:
   - Si está **inactivo** → activarlo.
   - Si ya estaba **activo** → desactivarlo y volver a activarlo (reset forzado).
   - Verificar que aparecen entradas en la sección **"Listeners"** — confirma que los feeds están suscritos.
10. Clic en **"Create"** (arriba a la izquierda, debajo del campo "Instrument") → esperar la confirmación de creación.

---

#### Paso 4 — Confirmar y cerrar la petición (Confirmar el alta)

1. En la petición JBPM: clic en **"Setup done"** (abajo a la derecha). (→ `DOM-KYUW-002 R1`)
2. Contestar al email original (mismo hilo, para trazabilidad) con la plantilla estándar: (→ `DOM-KYUW-002 R2`)

   > Buenas,
   >
   > Instrumento configurado en Typhoon.
   >
   > ¿Pueden inicializarlo en ORC, REPO y LIQUIDITY en ambos sets con valores distintos de 0? @PLATFORM MANAGEMENT (BZG12031)
   >
   > Saludos

3. Si el autoclose falló en los pasos 2d/2e: añadir al responsable del equipo de datos al hilo con `+` e informar del problema: (→ `DOM-KYUW-002 R3`)
   > El ticker proporcionado no nos devuelve precio. +EMMANUEL BENISTY, ¿lo puedes revisar por favor?

---

## Acceptance Criteria

- [ ] El operador puede completar el procedimiento completo de principio a fin sin referenciar documentación externa.
- [ ] El árbol de decisión de proveedor (Refinitiv → Bloomberg/DATALICENSE → escalación) es inequívoco y cubre todos los casos de bifurcación.
- [ ] Ambos snapshots `CLOSE_FO_MADRID` y `SOLAR` están siempre configurados (las dos ejecuciones del Paso 2 son obligatorias).
- [ ] ISIN, Bloomberg ID y Reuters RIC están siempre registrados en el registro del instrumento (Attributes + Dictionary Info + columna RIC).
- [ ] La petición JBPM siempre se cierra vía "Setup done" antes de enviar el email de confirmación.
- [ ] Si el autoclose falla, el usuario es notificado en el mismo hilo del email antes de cerrar el JBPM.

## Traceability

| Artifact | Relation | Notes |
|---|---|---|
| DOM-KYUW-001 | implements | El árbol de decisión de proveedor del autoclose se aplica en el Paso 2 |
| DOM-KYUW-002 | implements | El workflow de confirmación post-setup se ejecuta en el Paso 4 |
| ARCH-KYUW-008 | uses-data-from | Los pasos 2 y 3 se realizan a través de la SPA Angular de Typhoon (GUI) |
| **Fuente** | — | `docs/Tareas e incidencias comunes.docx` — sección "Alta Equity/Index" |

