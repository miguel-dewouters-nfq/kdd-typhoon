---
id: ARCH-KYUW-006
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
tags:
  - typhoon
  - storage
  - oracle
  - nova-fs
  - epsilon
  - object-store
  - persistence
---

# Market Data Storage Architecture

## Intent

Definir la arquitectura de almacenamiento de Typhoon, compuesta por tres niveles de persistencia: base de datos relacional Oracle 19 para estado transaccional, el sistema de ficheros NOVA FS para staging operativo de ficheros, y los buckets de object store Epsilon para historificación profunda y archivado de snapshots.

## Definition

### Context

Typhoon gestiona múltiples categorías de datos con distintos requisitos de retención, patrones de acceso y consistencia: estado transaccional de instrumentos (requiere garantías ACID), ficheros en tránsito entre microservicios de input y output (requiere I/O rápido), y series históricas y snapshots del motor para auditabilidad y replay (requiere almacenamiento barato a largo plazo). Una única tecnología de almacenamiento no puede servir eficientemente estos tres patrones.

### Decision

La capa de almacenamiento de Typhoon se compone de tres niveles:

#### Nivel 1: Oracle 19 — Base de Datos Relacional

- **Ambito**: Datos transaccionales y estructurados seleccionados por reglas operativas — diccionarios de instrumentos, estado de procesamiento, registros de precios aplicables, acciones de usuario, configuracion.
- **Asignación**: Exclusiva para Typhoon; ninguna otra aplicación comparte esta instancia de base de datos.
- **Patron de acceso**: El NOVA API Core es el coordinador principal de escritura. Existen servicios Typhoon autorizados adicionales con acceso controlado a tablas concretas bajo gobierno de transacciones.

#### Nivel 2: NOVA FS — Sistema de Ficheros Segmentado

Tres zonas físicamente segmentadas con roles funcionales distintos:

| Zona | Propósito |
|---|---|
| **FS IN** | Zona de aterrizaje de entradas: ficheros procedentes de proveedores externos (descarga SFTP) y sistemas internos (File Watcher) se depositan aquí antes del procesamiento |
| **FS OUT** | Directorio de consolidación de salidas: ficheros de datos procesados y validados en staging aquí antes de la distribución batch a sistemas consumidores |
| **FS Calibrations** | Área transitoria del motor de calibración: datos en bruto enviados a FOL/Murex/ORC se depositan aquí; outputs calibrados se escriben aquí antes del commit en el Core |

#### Nivel 3: Epsilon — Object Store Buckets

- **Ámbito**: Historificación profunda de todos los ficheros procesados y todos los snapshots generados por el motor de Typhoon.
- **Patrón de acceso**: Write-once archival; lecturas poco frecuentes (auditoría, replay, consultas históricas).
- **Retención**: Largo plazo; gobernada por políticas de retención de datos definidas para Global Markets.

### Rationale

- Aislar la base de datos Oracle para Typhoon garantiza rendimiento de I/O predecible y evita contencion con aplicaciones externas.
- La segmentación física de zonas NOVA FS crea límites claros del flujo de datos y simplifica la monitorización de cada etapa del pipeline.
- El object store Epsilon descarga datos históricos tanto de Oracle como del sistema de ficheros, manteniendo el almacenamiento operativo ligero mientras preserva el historial completo de auditoría.

### Consequences

- La base de datos Oracle es un único punto de fallo de persistencia; debe desplegarse en configuración RAC o standby para HA.
- Al existir multiples escritores autorizados dentro de Typhoon, se requieren controles de concurrencia y trazabilidad por servicio.
- FS IN, FS OUT y FS Calibrations requieren monitorización independiente de cuota de disco y alertas; un disco lleno en cualquier zona bloquea la etapa correspondiente del pipeline.
- Los costes de los buckets Epsilon crecen linealmente con el volumen de datos; las políticas de retención deben establecerse y aplicarse.
- Los procedimientos de backup y restore deben cubrir los tres niveles independientemente, con RPO/RTO definidos para cada uno.

## Acceptance Criteria

- [ ] La instancia Oracle 19 esta asignada exclusivamente a Typhoon; el acceso desde aplicaciones externas no Typhoon es rechazado a nivel de base de datos.
- [ ] Los servicios Typhoon autorizados con escritura en Oracle 19 estan inventariados con alcance de tablas y controles de concurrencia.
- [ ] FS IN, FS OUT y FS Calibrations están montadas en volúmenes lógicos separados con aplicación independiente de cuotas.
- [ ] Las alertas de utilización de disco están configuradas para cada zona NOVA FS (≥ 80% warning, ≥ 90% critical).
- [ ] Todos los ficheros procesados con éxito se archivan en buckets Epsilon antes de su eliminación de NOVA FS.
- [ ] Las operaciones de escritura en buckets Epsilon son idempotentes; el re-archivado de ficheros ya almacenados no produce duplicados.
- [ ] El backup de base de datos se ejecuta diariamente; el procedimiento de restore se valida anualmente.

## Evidence

- **Fuente primaria**: `docs/Info Typhoon.docx` — sección "Capa de Almacenamiento (Storage)"

## Traceability

| Artifact | Relation | Notes |
|---|---|---|
| ARCH-KYUW-001 | implements | Parte de la arquitectura Typhoon |
| ARCH-KYUW-002 | constrained-by | El NOVA API Core coordina la persistencia en Oracle 19 |
| ARCH-KYUW-003 | used-by | FS IN es poblada por los servicios de la Input Layer |
| ARCH-KYUW-004 | used-by | FS Calibrations es usada por el subsistema de calibración |
| ARCH-KYUW-007 | used-by | FS OUT es consumida por la Distribution Layer |

