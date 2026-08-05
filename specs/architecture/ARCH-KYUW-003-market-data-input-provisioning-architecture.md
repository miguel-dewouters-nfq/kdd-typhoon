---
id: ARCH-KYUW-003
type: spec
layer: architecture
status: draft
confidence: high
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
  - input-layer
  - provisioning
  - bloomberg
  - refinitiv
  - kyuw-bpipe
  - kyuw-trep
  - file-watcher
  - real-time
---

# Market Data Input Provisioning Architecture

## Intent

Definir la arquitectura de la capa de provisión de datos de entrada de Typhoon — el conjunto de microservicios responsables de ingestar datos de mercado desde proveedores externos y sistemas BBVA internos hacia el NOVA API Core para su procesamiento y distribución.

## Definition

### Context

Typhoon consume datos de mercado de un conjunto heterogéneo de fuentes, cada una con modelos de conectividad, formatos y frecuencias de actualización distintos. La capa de entrada debe abstraer estas diferencias y entregar flujos de datos normalizados al NOVA API Core. Las fuentes incluyen proveedores financieros globales (Bloomberg, Refinitiv, IHS Markit, Stoxx, BCE, Eurex, Alpima) y plataformas BBVA internas (Asset Control, IPV Manager, Datio). La ingesta no implica persistencia automatica ni calibracion universal: cada flujo se filtra por reglas de negocio y por tipo de proceso.

### Decision

La capa de provisión se organiza en tres familias de microservicios diferenciadas por su patrón de conectividad e ingesta:

#### 1. Servicios Real Time (TCP/Socket)

Microservicios que mantienen conexiones TCP/Socket persistentes para streaming continuo de baja latencia:

| Servicio | Proveedor | Protocolo |
|---|---|---|
| KYUW B-Pipe | Bloomberg | Bloomberg B-PIPE TCP |
| KYUW TREP | Refinitiv | TREP / RSSL TCP Socket |

Reciben actualizaciones tick a tick de precios y datos de referencia en tiempo real y los reenvían al Core.

#### 2. Servicios HTTP/REST y SFTP

Microservicios que se conectan a proveedores externos mediante llamadas HTTP/REST o SFTP programadas o bajo demanda:

| Servicio | Proveedor | Tipo |
|---|---|---|
| KYUW Tick / DSS | Refinitiv Tick History | HTTP/REST |
| KYUW Data License | Bloomberg Data License | SFTP |
| KYUW Website | IHS Markit, BCE, Eurex, Alpima | HTTP/REST |

Gestionan extracciones batch de series históricas, datos de referencia EOD y ficheros de precios periódicos. Los datos descargados se depositan en la zona FS IN antes de su procesamiento.

#### 3. Demonios / File Watchers (Ingesta pasiva)

Demonios que monitorizan rutas del sistema de ficheros (NOVA FS — FS IN) para detectar ficheros entrantes de sistemas origen internos:

| Daemon | Sistema origen | Mecanismo |
|---|---|---|
| Demon NOVA (FW Core) | Asset Control, IPV Manager | Monitorización pasiva del sistema de ficheros |

Al detectar un fichero nuevo, el daemon invoca al NOVA API Core para su procesamiento.

### Rationale

- Separar microservicios de input por patrón de conectividad aísla dominios de fallo: una caída del feed de Bloomberg no afecta a la ingesta histórica vía SFTP.
- La zona FS IN actúa como buffer de ingesta, desacoplando la llegada de ficheros del timing de procesamiento y permitiendo replay ante fallos downstream.
- La monitorización pasiva de ficheros es preferible al polling activo para sistemas internos, reduciendo el acoplamiento entre sistemas.
- El filtrado temprano evita persistir o calibrar datos no aplicables al flujo activo, reduciendo costo operativo y ruido en procesos EOD.

### Consequences

- Cada microservicio específico de proveedor debe implementar de forma independiente autenticación, gestión de protocolo y lógica de reconexión propios del vendor.
- Los servicios en tiempo real (B-Pipe, TREP) deben implementar circuit-breakers para evitar sobrecarga del Core durante bursts de datos.
- La zona FS IN requiere políticas de monitorización y limpieza para prevenir crecimiento ilimitado de disco.
- Incorporar un nuevo proveedor de datos externo requiere un ciclo completo de desarrollo y despliegue de un nuevo microservicio.

## Acceptance Criteria

- [ ] KYUW B-Pipe y KYUW TREP mantienen conexiones persistentes y se reconectan automáticamente tras desconexión del proveedor.
- [ ] Los servicios HTTP/REST y SFTP implementan ejecución planificada con reintento configurable ante fallo.
- [ ] Demon NOVA (FW Core) detecta nuevos ficheros en FS IN en ≤ 60 segundos desde su llegada.
- [ ] Todos los microservicios de input registran eventos de ingesta (fuente, timestamp, volumen, éxito/fallo) en un sistema de observabilidad centralizado.
- [ ] Las ingestas fallidas o malformadas se enrutan al pipeline de alertas de NOVA Broker; no se pierde silenciosamente ningún dato.

## Evidence

- **Fuente primaria**: `docs/Info Typhoon.docx` — sección "Capa de Aprovisionamiento (Inputs)"

## Traceability

| Artifact | Relation | Notes |
|---|---|---|
| ARCH-KYUW-001 | implements | La Input Layer forma parte de la arquitectura Typhoon |
| ARCH-KYUW-002 | constrained-by | Todos los datos ingestados fluyen por el NOVA API Core |
| ARCH-KYUW-006 | uses-data-from | La zona FS IN de NOVA FS recibe los ficheros de entrada |

