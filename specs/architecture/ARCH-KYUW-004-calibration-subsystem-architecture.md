---
id: ARCH-KYUW-004
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
  - id: ARCH-KYUW-006
    relation: uses-data-from
tags:
  - typhoon
  - calibration
  - fol
  - financial-object-library
  - murex
  - orc
  - symphony
  - enrichment
---

# Calibration Subsystem Architecture

## Intent

Definir la arquitectura de los subsistemas de calibracion de Typhoon: conectores dedicados e integracion con motores analiticos externos (FOL/Symphony, Murex 3, ORC) bajo patron request/response, donde Typhoon coordina el intercambio pero no ejecuta la calibracion matematica.

## Definition

### Context

Los datos de mercado ingestados en bruto no siempre son directamente adecuados para consumo por sistemas de riesgo y valoración. Ciertos instrumentos requieren calibración matemática de parámetros de modelos (superficies de volatilidad, curvas de tipos) antes de poder usarse en valoración. Esta calibración la realizan motores analíticos especializados externos a Typhoon.

### Decision

La integración de calibración se implementa mediante conectores TCP dedicados que establecen comunicación con los siguientes sistemas analíticos:

| Sistema | Rol | Patrón de integración |
|---|---|---|
| FOL — Financial Object Library (Symphony) | Motor analitico BBVA; calibra parametros de modelos para derivados e instrumentos de renta fija | TCP - Typhoon envia datos en bruto, recibe conjuntos de parametros calibrados |
| Murex 3 | Sistema de trading front-office con integracion bidireccional; intercambia datos y parametros para flujos de derivados y no derivados | TCP via API Typhoon dedicada |
| Murex AWS Labs | Entornos de calibración Murex alojados en AWS; usados para ejecuciones de alto cómputo | TCP vía API dedicada |
| ORC | Sistema de valoración de opciones; recibe datos en bruto y devuelve parámetros calibrados | TCP |

**Flujo de calibración**:
1. El NOVA API Core determina que un instrumento o dataset requiere calibración.
2. El conector de calibración envía los datos de mercado en bruto al sistema analítico objetivo.
3. El sistema analítico devuelve parámetros calibrados (volatility smile, matrices de correlación, curvas de descuento).
4. Typhoon almacena el output calibrado en FS Calibrations y lo persiste en el registro del instrumento.
5. Los datos calibrados quedan disponibles para distribución a sistemas consumidores.

### Rationale

- Externalizar la calibracion a motores especializados mantiene Typhoon enfocado en gestion de datos; Typhoon coordina solicitudes y respuestas, no la matematica de calibracion.
- Las conexiones TCP proporcionan intercambio síncrono de baja latencia de parámetros de calibración.
- La zona FS Calibrations transitoria desacopla el intercambio de calibración del commit en base de datos principal, permitiendo reintento ante fallos parciales.

### Consequences

- La completitud de la calibración en Typhoon depende de la disponibilidad de los sistemas analíticos externos; su caída retrasa la publicación de datos calibrados.
- La gestión de conexiones TCP (reconexión, timeout, versionado de esquemas de datos) debe mantenerse por sistema analítico.
- La correctitud de los parámetros calibrados es responsabilidad de los motores analíticos, no de Typhoon.
- Los labs Murex en AWS requieren ruta de red y aprobación de seguridad XMAS adecuadas.

## Acceptance Criteria

- [ ] Los conectores de calibración implementan timeout TCP configurable y lógica de reconexión automática.
- [ ] La zona FS Calibrations se limpia tras commit exitoso; los ficheros huérfanos con antigüedad superior al TTL definido disparan una alerta.
- [ ] Los fallos de calibración resultan en el instrumento marcado con estado `calibration_error`; nunca se publica datos no calibrados silenciosamente.
- [ ] El tiempo de round-trip de calibración se monitoriza y se alerta cuando supera umbrales definidos.

## Evidence

- **Fuente primaria**: `docs/Info Typhoon.docx` — sección "Subsistemas de Calibración"

## Traceability

| Artifact | Relation | Notes |
|---|---|---|
| ARCH-KYUW-001 | implements | Parte de la arquitectura Typhoon |
| ARCH-KYUW-002 | constrained-by | El Core dispara y coordina los workflows de calibración |
| ARCH-KYUW-006 | uses-data-from | FS Calibrations forma parte de NOVA FS |

