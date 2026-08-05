---
id: DOC-KYUW-003
type: spec
layer: documentation
status: draft
confidence: high
version: 0.1.0
created: 2026-08-05
updated: 2026-08-05
owner: to-be-assigned
dependencies:
  - id: DOM-KYUW-004
    relation: implements
  - id: ARCH-KYUW-008
    relation: uses-data-from
tags:
  - typhoon
  - sop
  - futures
  - options
  - autoclose
---

# Alta Futures/Options - SOP Operativo

## Intent

Describir, con detalle operativo, el procedimiento para procesar peticiones de `FUTURE` y `OPTION` recibidas por email/JBPM.

## Definition

### Purpose

Guiar a un operador sin experiencia previa para completar el flujo sin apoyo externo.

### Audience

Operadores de soporte Typhoon L1/L2.

### Scope

Este SOP cubre unicamente el tratamiento operativo de solicitudes `FUTURE` y `OPTION` en Typhoon (clasificacion, autoclose y confirmacion). No cubre alta Equity/Index.

### Accesos y URLs

- Integrado: `https://ei-wbamdesktop.es.igrupobbva/ENOA/com.bbva.kyuw-typhoonfront-typhoon-1/#/`
- Preproduccion: `https://au-wbamdesktop.es.igrupobbva/ENOA/com.bbva.kyuw-typhoonfront-typhoon-1/#/`
- Produccion: `https://cibdesktop.es.igrupobbva/ENOA/com.bbva.kyuw-typhoonfront-typhoon-1/#/`

### Content

#### Trigger - Email tipo

El flujo inicia al recibir un correo con asunto similar a:

```text
INFO:FUTURE AND OPTIONS - SETUP DONE BY SEC & REF DATA: ...
```

El email incluye el enlace JBPM/ENOA para abrir la solicitud.

#### Paso 1 - Abrir peticion y clasificar tipo

1. Abrir el email con asunto tipo `INFO:FUTURE AND OPTIONS - SETUP DONE BY SEC & REF DATA ...`.
2. Hacer clic en el enlace del texto `Please, press this link...`.
3. En la pantalla JBPM, localizar el campo `Type of Instrument`.
4. Decision:
   - Si valor `OPTION`: **no hacer setup** en Typhoon, archivar y cerrar.
   - Si valor `FUTURE`: continuar al Paso 2.

Resultado esperado: peticion clasificada y ruta de trabajo decidida.

Error comun: empezar por autoclose sin revisar `Type of Instrument`.

Que NO hacer: tratar `OPTION` como si fuera `FUTURE`.

#### Paso 2 - Extraer datos de FUTURE

Desde JBPM, recoger:
- `MUREX Label`
- `BBG CODE`
- `MATURITY`
- `MATURITY DATE`

Resultado esperado: campos disponibles para configurar formula.

Que NO hacer: usar ticker sin corchetes o con texto incompleto al construir formula.

#### Paso 3 - Configurar autoclose

Ruta: `Closing Process -> Autoclose Instruments`.

1. En `Snapshot`, seleccionar `CLOSE_FO_MADRID`.
2. En `Category`, elegir una categoria que contenga `FUTURE`.
3. Hacer clic en `Display`.
4. Marcar `Show all instruments`.
5. En `Filter`, pegar `MUREX Label`.
6. En la fila del resultado, clic en icono lapiz (`Edit`) a la derecha.
7. En ventana de edicion:
   - `Provider`: `BLOOMBERG`
   - `Rule`: `CLOSE_LAST_MID`
   - `Formula`: `[BBG CODE]`
8. Clic en `Test formula`.
9. Si devuelve precio numerico, clic en `Save`.
10. Si devuelve error (`Not valid instruments` u otro), no guardar y preparar escalado en email.

Resultado esperado: autoclose guardado para FUTURE cuando test es valido.

Errores comunes:
- No marcar `Show all instruments` y no encontrar el label.
- Probar `REFINITIV` en futuros.

#### Paso 4 - Confirmar peticion

1. Volver a JBPM.
2. Clic en boton `Setup done` (abajo derecha).
3. Responder en el mismo hilo de email:

```text
Buenas,
Instrumento configurado en Typhoon.
Saludos
```

Si hubo error de formula, incluir aviso en el hilo y mencion de soporte funcional.

Resultado esperado: trazabilidad cerrada en JBPM + email.

Que NO hacer: enviar correo nuevo; la confirmacion debe ser respuesta al hilo original.

## Acceptance Criteria

- [ ] El SOP obliga a clasificar `OPTION` vs `FUTURE` al inicio.
- [ ] Para `FUTURE`, la configuracion de autoclose queda definida con campos concretos.
- [ ] Se documentan ubicacion y nombre exacto de botones/campos.
- [ ] Se cubren caso exitoso y caso con error de formula.

## Traceability

| Artifact | Relation | Notes |
|---|---|---|
| DOM-KYUW-004 | implements | Reglas de enrutado y setup para derivados |
| ARCH-KYUW-008 | uses-data-from | La operativa se ejecuta en SPA Angular Typhoon |
| Fuente | - | `docs/Tareas e incidencias comunes.docx` (seccion "Alta futuros y opciones") |

