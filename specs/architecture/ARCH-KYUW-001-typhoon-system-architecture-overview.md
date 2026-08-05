---
id: ARCH-KYUW-001
type: spec
layer: architecture
status: draft
confidence: high
version: 0.2.0
created: 2026-07-01
updated: 2026-07-17
owner: to-be-assigned
tags:
  - typhoon
  - mds
  - market-data-server
  - nova
  - global-markets
  - system-architecture
---

# Typhoon System Architecture Overview

## Intent

Establecer la referencia arquitectonica canonica de Typhoon (tambien conocido como Market Data Server / MDS), la plataforma centralizada de gestion y provision de datos de mercado que orquesta y aplica la logica de control de datos para los sistemas de Global Markets.

## Definition

### Context

Typhoon es una pieza critica de la infraestructura de BBVA Global Markets. Los sistemas que requieren datos de mercado en tiempo real o de referencia (Murex3, Telemaco, Risk Viewer, Calypso, DATIO, CFIT, ORC) dependen de Typhoon para recibir datos autorizados, validados y correctamente formateados. El impacto operativo de incidencias no siempre es simultaneo para todos los consumidores: depende del flujo afectado (intraday/online vs procesos de cierre EOD).

El sistema ha evolucionado hasta Typhoon 2.0 en la arquitectura Nova, incorporando alta disponibilidad, escalabilidad y redundancia como requisitos no funcionales de primer nivel.

### Decision

Typhoon se describe a nivel de arquitectura de sistema con tres dominios principales y dos ejes transversales:

| Dominio/Eje | Componentes principales | Responsabilidad |
|---|---|---|
| **Inputs** | KYUW B-Pipe, KYUW TREP, KYUW Tick/DSS, KYUW Data License, Demon NOVA FW Core | Ingesta de datos de proveedores externos e internos |
| **Sistema Typhoon** | NOVA API Core, microservicios especializados, Oracle 19, NOVA FS, Epsilon, NOVA Broker | Coordinacion de reglas, validaciones, persistencia selectiva y orquestacion operativa |
| **Outputs** | TIBCO ESB, REST/Rancher/XMAS, DataX/Nova Transfer/SFTP | Distribucion multiconsumidor en streaming, API y batch |
| **Eje real-time** | B-Pipe, TREP, suscripciones y consumidores online | Procesamiento y distribucion intraday de baja latencia |
| **Eje calibraciones** | Conectores a FOL/Symphony, Murex, ORC | Intercambio request/response de parametros con motores externos |

No todo dato recibido en Inputs se persiste ni pasa por calibracion: el sistema aplica filtros de validacion y enruta por flujo segun el tipo de instrumento y el proceso activo.

Un bus de mensajeria NOVA Broker (AMQP) proporciona coordinacion interna orientada a eventos entre los microservicios.

Este documento se limita a una vista high-level de arquitectura; los pasos operativos de alta de Equity/Index se documentan en specs de capa `documentation`.

### Rationale

- El control centralizado garantiza autorizacion, validacion y formateo consistentes en los sistemas consumidores, eliminando silos de datos por sistema.
- El modelo por dominios y ejes separa responsabilidades principales sin confundir el resumen high-level con procedimientos operativos.
- El cluster Hazelcast en memoria elimina round-trips repetidos a base de datos para datos de referencia estaticos.
- La arquitectura Nova 2.0 aporta la alta disponibilidad y redundancia exigida por un sistema critico para procesos intraday y de cierre.

### Consequences

- Typhoon es critico para Global Markets, pero el impacto de una incidencia depende del proceso afectado: puede limitarse a flujos online/intraday, a cierres EOD o a combinaciones parciales.
- Incorporar un nuevo proveedor o consumidor requiere cambios coordinados en inputs/outputs y en la configuracion del orquestador.
- El sistema debe mantener SLAs diferenciados para streaming intraday y para snapshots/cierres EOD (por ejemplo `CLOSE_FO_MADRID`).
- El cierre de referencia documentado en esta version draft es Madrid; no existe modelado de cierre BC (Bancomer, Mexico) en las specs actuales.

## Acceptance Criteria

- [ ] El modelo high-level Inputs/Sistema Typhoon/Outputs y los ejes real-time/calibraciones estan documentados con sus componentes.
- [ ] Los interfaces de integracion (ESB, endpoints REST, protocolos batch) estan especificados con sus bindings a sistemas consumidores.
- [ ] La topologia del cluster Hazelcast esta documentada en una especificacion de despliegue.
- [ ] El modelo de acceso y escritura en Oracle 19 (incluyendo servicios autorizados ademas del Core) esta trazado y alineado con `ARCH-KYUW-006`.
- [ ] La topologia de alta disponibilidad del NOVA API Core esta formalmente documentada.

## Evidence

- **Fuente primaria**: `docs/Info Typhoon.docx` - secciones "Que es Typhoon" y "Arquitectura Typhoon"

## Traceability

| Artifact | Relation | Notes |
|---|---|---|
| ARCH-KYUW-002 | elaborated-by | Detalle del NOVA API Core Orchestrator |
| ARCH-KYUW-003 | elaborated-by | Detalle de la Input Layer |
| ARCH-KYUW-004 | elaborated-by | Detalle del Calibration Subsystem |
| ARCH-KYUW-005 | elaborated-by | Detalle de Messaging and Alerting |
| ARCH-KYUW-006 | elaborated-by | Detalle de la Storage Layer |
| ARCH-KYUW-007 | elaborated-by | Detalle de la Distribution Layer |
| ARCH-KYUW-008 | elaborated-by | Detalle de la Frontend Layer |
