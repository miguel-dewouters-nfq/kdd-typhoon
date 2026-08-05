---
id: DOM-KYUW-002
type: spec
layer: domain
status: draft
confidence: medium
version: 0.1.0
created: 2026-07-01
updated: 2026-07-01
owner: to-be-assigned
dependencies:
  - id: DOM-KYUW-001
    relation: constrained-by
tags:
  - typhoon
  - jbpm
  - onboarding
  - confirmation
  - post-setup
  - orc
  - repo
  - liquidity
  - platform-management
  - workflow
---

# Instrument Post-Setup Confirmation Workflow

## Intent

Definir las reglas de dominio que gobiernan el workflow de confirmación post-configuración que cierra una petición de alta de instrumento en Typhoon — cubriendo la transición de estado obligatoria en JBPM, el contenido estándar del email de respuesta, y el path de escalación condicional cuando la configuración del autoclose está incompleta.

## Definition

### Concept

Tras completar la configuración de un instrumento en Typhoon (autoclose en ambos snapshots + registro en base de datos), el equipo de soporte debe cerrar formalmente la petición JBPM y notificar al equipo solicitante. Este workflow no es meramente administrativo — el email de confirmación desencadena acciones de inicialización downstream en ORC, REPO y LIQUIDITY por parte del equipo de Platform Management.

Si alguna parte de la configuración falló (especialmente el autoclose), el workflow se bifurca: la petición JBPM debe igualmente avanzarse, pero el email de confirmación debe evidenciar el problema y enrutarlo al responsable de resolverlo.

### Rules

#### R1 — Cierre de la Petición JBPM

- Tras completar todos los pasos de configuración, el operador **debe** hacer clic en el botón **"Setup done"** de la petición JBPM (abajo a la derecha del formulario).
- La petición JBPM no puede cerrarse antes de que tanto el autoclose (en los dos snapshots `CLOSE_FO_MADRID` y `SOLAR`) como el registro en base de datos estén completos.
- **Excepción**: si la configuración del autoclose no pudo completarse (ambos proveedores fallaron según DOM-KYUW-001 R6), la petición debe igualmente avanzarse de estado, pero el problema no resuelto debe registrarse en el email de respuesta.

#### R2 — Email de Confirmación Estándar

La respuesta al email original de alta **debe** seguir exactamente esta plantilla:

```
Buenas,

Instrumento configurado en Typhoon.

¿Pueden inicializarlo en ORC, REPO y LIQUIDITY en ambos sets con valores distintos de 0? @PLATFORM MANAGEMENT (BZG12031)

Saludos
```

**Elementos obligatorios**:
- Confirmación de que el instrumento ha sido configurado en Typhoon.
- Petición explícita a Platform Management (BZG12031) de inicializar en ORC, REPO y LIQUIDITY con valores distintos de 0 en ambos sets.
- La mención `@PLATFORM MANAGEMENT (BZG12031)` es obligatoria; es el disparador formal de la inicialización downstream.

#### R3 — Path de Escalación por Error en Autoclose

Si la configuración del autoclose falló (DOM-KYUW-001 R6):
- Añadir al contacto responsable del equipo de datos de vendor al hilo del email usando `+<Nombre>`.
- Describir el problema con claridad (el ticker no devuelve precio).
- Formato estándar del mensaje de escalación:
  > El ticker proporcionado no nos devuelve precio. +\<Contacto Responsable\>, ¿lo puedes revisar por favor?

#### R4 — Dependencia de Inicialización Downstream

El equipo de Platform Management (BZG12031) es el único responsable de inicializar el instrumento en:

| Sistema | Requisito |
|---|---|
| ORC | Ambos sets, valores ≠ 0 |
| REPO | Ambos sets, valores ≠ 0 |
| LIQUIDITY | Ambos sets, valores ≠ 0 |

El equipo de soporte Typhoon no realiza esta inicializaci��n. Hasta que Platform Management la complete, el instrumento no es operativamente utilizable en ORC/REPO/LIQUIDITY.

### Constraints

- El email de confirmación debe ser una **respuesta** al email de notificación original de JBPM/ENOA, manteniendo el hilo para trazabilidad.
- Tanto la acción JBPM "Setup done" como el email de respuesta son obligatorios; ninguno por sí solo es suficiente para cerrar la petición.
- Si el autoclose falló, la línea de escalación debe aparecer en el **mismo** email de respuesta estándar — un email separado rompe la cadena de trazabilidad.

### Examples

**Ejemplo 1 — Setup completo con éxito**
1. Autoclose configurado en `CLOSE_FO_MADRID` y `SOLAR` ✅
2. Instrumento registrado en base de datos ✅
3. JBPM: clic en "Setup done"
4. Email de respuesta con plantilla estándar y mención @PLATFORM MANAGEMENT (BZG12031)

**Ejemplo 2 — Autoclose fallido**
1. Refinitiv y Bloomberg devolvieron error en el autoclose ❌
2. Instrumento registrado en base de datos ✅
3. JBPM: avanzar estado de la petición
4. Email de respuesta: plantilla estándar + línea de escalación:
   > El ticker proporcionado no nos devuelve precio. +EMMANUEL BENISTY, ¿lo puedes revisar por favor?

## Acceptance Criteria

- [ ] Toda petición de alta cerrada tiene una acción JBPM "Setup done" registrada.
- [ ] Todo email de confirmación incluye la petición de inicialización a @PLATFORM MANAGEMENT (BZG12031).
- [ ] Ninguna petición se cierra con fallo de autoclose silencioso; todos los errores no resueltos se evidencian en el hilo del email de confirmación.
- [ ] Los emails de escalación identifican correctamente al contacto responsable y describen el fallo específico de ticker.

## Evidence

- **Fuente primaria**: `docs/Tareas e incidencias comunes.docx` — sección "Alta Equity/Index", sub-sección "Confirmar el alta"

## Traceability

| Artifact | Relation | Notes |
|---|---|---|
| DOM-KYUW-001 | constrained-by | El resultado del autoclose (R6) determina si se aplica el path de escalación R3 |
| DOC-KYUW-001 | implemented-by | El SOP de Alta Equity/Index ejecuta este workflow en el Paso 4 |

