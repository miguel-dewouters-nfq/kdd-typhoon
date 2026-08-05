---
id: ARCH-KYUW-005
type: spec
layer: architecture
status: draft
confidence: medium
version: 0.1.0
created: 2026-07-01
updated: 2026-07-01
owner: to-be-assigned
dependencies:
  - id: ARCH-KYUW-001
    relation: implements
  - id: ARCH-KYUW-002
    relation: constrained-by
tags:
  - typhoon
  - messaging
  - amqp
  - nova-broker
  - alerts
  - ans-tool
  - cib-notifications
  - event-driven
---

# Messaging, Alerting and Operations Architecture

## Intent

Definir la arquitectura del bus de mensajería de Typhoon, el ecosistema de alertas y el tooling operativo — cubriendo el bus de eventos NOVA Broker (AMQP), el suscriptor Demon NOVA Alerts, la API de administración ANS Tool (Python) y la integración con el Gestor de Notificaciones CIB.

## Definition

### Context

En un sistema distribuido con múltiples microservicios, coordinar eventos asíncronos, aflorar problemas operativos de forma proactiva y proporcionar al equipo de operaciones control administrativo son preocupaciones transversales críticas. Typhoon las aborda mediante un bus de mensajería dedicado y un stack complementario de herramientas de alertas y operaciones.

### Decision

La capa de mensajería, alertas y operaciones se compone de cuatro componentes:

#### 1. NOVA Broker (AMQP)

Bus de mensajes AMQP que actúa como bus de eventos central para todos los servicios internos de Typhoon. Todos los microservicios (conectores de input, subsistemas de calibración, servicios de distribución) publican eventos internos de ciclo de vida en el broker, que los enruta a los consumidores correspondientes.

#### 2. Demon NOVA (Alerts)

Daemon suscriptor dedicado que:
- Consume todos los eventos del NOVA Broker.
- Consolida y correlaciona la actividad de los microservicios distribuidos.
- Dispara alertas y notificaciones basadas en reglas configurables (actualizaciones de precios perdidas, fallos de calibración, errores de distribución).

#### 3. ANS Tool (API de administración Python)

API Python que proporciona al equipo de operaciones de soporte capacidades administrativas:
- Disparo manual de extracciones o ciclos de procesamiento.
- Inspección y override del estado de instrumentos.
- Diagnósticos operativos y consultas de salud.

Es un canal alternativo para casos de uso de soporte técnico no expuestos a través de la GUI principal.

#### 4. Gestor de Notificaciones CIB (API G.N)

Integración directa con la API corporativa del Gestor de Notificaciones CIB permite a Typhoon emitir alertas proactivas y correos electrónicos a equipos de operaciones y stakeholders ante eventos críticos (caída de feed, cierre de mercado perdido, fallo de calibración).

### Rationale

- Un broker AMQP central desacopla productores y consumidores de eventos internos, habilitando escalado independiente y aislamiento de fallos.
- Un daemon de alertas dedicado mantiene la lógica de alertas separada de la lógica de procesamiento.
- El ANS Tool Python proporciona flexibilidad para scripting del equipo de soporte sin requerir cambios en los servicios Java del core.
- La integración con el Gestor de Notificaciones CIB garantiza que las alertas llegan a los stakeholders a través de canales de comunicación corporativos establecidos y gobernados.

### Consequences

- El NOVA Broker es una dependencia de infraestructura compartida; su caída afecta a todos los flujos de eventos internos.
- La profundidad de las colas AMQP debe monitorizarse; un crecimiento ilimitado indica un consumidor lento.
- El ANS Tool requiere control de acceso propio y audit logging para prevenir mutaciones no autorizadas de datos.
- La fatiga de alertas debe gestionarse mediante configuración cuidadosa de umbrales en Demon NOVA Alerts.

## Acceptance Criteria

- [ ] NOVA Broker está desplegado en configuración de alta disponibilidad (clusterizado o con failover).
- [ ] Todos los microservicios publican eventos de ciclo de vida en NOVA Broker en ingesta, calibración y distribución (start/end/error).
- [ ] Demon NOVA Alerts envía una notificación CIB dentro del SLA definido cuando se detecta una condición de alerta crítica.
- [ ] Las operaciones del ANS Tool se registran completamente en audit log (identidad del invocante, acción, timestamp, resultado).
- [ ] Se configuran dead-letter queues para todas las colas críticas del NOVA Broker; los mensajes no entregables disparan una alerta.

## Evidence

- **Fuente primaria**: `docs/Info Typhoon.docx` — sección "Ecosistema de Mensajería, Alertas y Gestión"

## Traceability

| Artifact | Relation | Notes |
|---|---|---|
| ARCH-KYUW-001 | implements | Parte de la arquitectura Typhoon |
| ARCH-KYUW-002 | constrained-by | El NOVA API Core publica eventos en NOVA Broker |

