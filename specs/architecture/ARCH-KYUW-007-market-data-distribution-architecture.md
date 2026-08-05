---
id: ARCH-KYUW-007
type: spec
layer: architecture
status: draft
confidence: high
version: 0.1.0
created: 2026-07-01
updated: 2026-07-01
owner: to-be-assigned
dependencies:
  - id: ARCH-KYUW-001
    relation: implements
  - id: ARCH-KYUW-002
    relation: constrained-by
  - id: ARCH-KYUW-006
    relation: uses-data-from
  - id: ARCH-KYUW-005
    relation: uses-data-from
tags:
  - typhoon
  - distribution
  - tibco-esb
  - rest-api
  - rancher
  - xmas
  - datax
  - nova-transfer
  - sftp
  - streaming
---

# Market Data Distribution Architecture

## Intent

Definir la arquitectura de la capa de distribución de datos de mercado de Typhoon — los patrones, tecnologías y puntos de integración a través de los cuales los datos de mercado validados y calibrados se entregan a todos los sistemas consumidores (Murex3, Telémaco, Risk Viewer, Calypso, DATIO, CFIT, ORC).

## Definition

### Context

Tras la ingesta, validación, enriquecimiento y (cuando es necesario) calibración de los datos de mercado, Typhoon debe entregarlos a un conjunto heterogéneo de sistemas consumidores con capacidades de integración, requisitos de latencia y expectativas de volumen de datos fundamentalmente distintos. Un único mecanismo de distribución no puede servir a todos los consumidores.

### Decision

La capa de distribución expone tres patrones tecnológicos:

#### Patrón 1: Transmisión en Streaming vía TIBCO ESB

- **Tecnología**: TIBCO Enterprise Service Bus (bus de integración corporativo)
- **Modo**: Publish/subscribe sincrónico y asincrónico en streaming
- **Caso de uso**: Consumidores que requieren actualizaciones continuas de datos de mercado con baja latencia (sistemas de trading front-office, motores de riesgo en tiempo real)
- **Flujo**: NOVA API Core publica eventos de precio validados → NOVA Broker → topic ESB → suscripción del consumidor

#### Patrón 2: API REST bajo Demanda

- **Tecnología**: Endpoints REST securizados
- **Capa proxy**: Entorno táctico en Rancher actuando como reverse proxy
- **Seguridad**: Proxy Rancher apantallado por la arquitectura de seguridad corporativa XMAS (autenticación, autorización, perímetro de red)
- **Consumidores**: CFIT, Telémaco, ORC
- **Caso de uso**: Sistemas que requieren consultas bajo demanda (lookups de instrumentos, consultas de último precio, recuperación de snapshots)

#### Patrón 3: Cesiones Batch (Transferencia de Ficheros)

- **Tecnología**: DataX, Nova Transfer, protocolos SFTP
- **Fuente de salida**: Zona de staging FS OUT (NOVA FS)
- **Caso de uso**: Consumidores que requieren ingesta de datos basada en ficheros masivos — ecosistemas Big Data y sistemas satélite que operan en ciclos de procesamiento batch
- **Flujo**: Typhoon escribe ficheros de salida consolidados en FS OUT → DataX/Nova Transfer/SFTP orquesta la entrega

### Rationale

- TIBCO ESB es el backbone de integración corporativo establecido para streaming de eventos en tiempo real; reutilizarlo evita introducir una tecnología de streaming competidora.
- El patrón REST bajo demanda sirve a consumidores que no pueden mantener una suscripción persistente; el proxy Rancher/XMAS garantiza aplicación consistente de política de seguridad.
- La transferencia de ficheros batch es el patrón de integración más simple para ecosistemas Big Data y proporciona un mecanismo de re-feed limpio para replay histórico.

### Consequences

- TIBCO ESB es una dependencia de infraestructura corporativa compartida; los SLAs de distribución en streaming dependen del equipo ESB.
- Los consumidores API REST deben gestionar la indisponibilidad del proxy Rancher con patrones de reintento y circuit-breaker.
- Los ficheros batch en FS OUT deben retenerse el tiempo suficiente para que los consumidores los recuperen; debe definirse una política de TTL y limpieza.
- Incorporar un nuevo consumidor requiere seleccionar un patrón, provisionar topic ESB/ruta Rancher/credenciales SFTP y actualizar las reglas de control de acceso XMAS.

## Acceptance Criteria

- [ ] Los topics TIBCO ESB están provisionados y documentados para cada consumidor en tiempo real; el versionado del esquema de mensajes se aplica.
- [ ] Los endpoints API REST se exponen exclusivamente a través del proxy Rancher; no se permite acceso directo desde consumidores externos.
- [ ] Las reglas de autorización XMAS para cada consumidor API REST están documentadas y revisadas.
- [ ] Los ficheros batch en FS OUT siguen una convención de nomenclatura definida con indicador de completitud (ej. flag `.done` o fichero de checksum).
- [ ] Los tres patrones de distribución emiten eventos de confirmación de entrega en NOVA Broker; las entregas fallidas disparan alertas.
- [ ] Los SLAs de latencia de distribución están definidos por consumidor y por patrón.

## Evidence

- **Fuente primaria**: `docs/Info Typhoon.docx` — sección "Capa de Distribución (Outputs y Consumers)"

## Traceability

| Artifact | Relation | Notes |
|---|---|---|
| ARCH-KYUW-001 | implements | Parte de la arquitectura Typhoon |
| ARCH-KYUW-002 | constrained-by | El Core dispara y controla los workflows de distribución |
| ARCH-KYUW-006 | uses-data-from | FS OUT (NOVA FS) proporciona la fuente para distribución batch |
| ARCH-KYUW-005 | uses-data-from | Los eventos y alertas de distribución circulan por NOVA Broker |

