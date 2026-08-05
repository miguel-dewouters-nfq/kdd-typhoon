---
id: ARCH-KYUW-002
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
tags:
  - typhoon
  - nova-api-core
  - java
  - hazelcast
  - orchestrator
---

# NOVA API Core — Orchestrator Service

## Intent

Definir la arquitectura y responsabilidades del NOVA API Core, el servicio de orquestación central de Typhoon que aplica la lógica de negocio de datos de mercado, procesa peticiones del frontal, coordina todos los microservicios y mantiene consistencia de datos mediante caché distribuida en memoria.

## Definition

### Context

Toda acción de procesamiento en Typhoon — desencadenada por usuario vía GUI, evento externo o temporizador interno — es gestionada por el NOVA API Core. Es el "cerebro" del sistema, situado entre la capa de presentación, la base de datos, el bus de mensajería y todos los microservicios especializados de mercado.

El sistema debe gestionar peticiones concurrentes de múltiples consumidores y servicios de provisión simultáneamente, garantizando consistencia de datos y baja latencia.

### Decision

El NOVA API Core está implementado en **Java 11** como servicio backend con las siguientes responsabilidades:

1. **Ejecución de lógica de negocio** — aplica todas las reglas de control de datos de mercado (validación de instrumentos, transiciones de estado, autorizaciones de publicación de datos).
2. **Procesamiento de peticiones del frontal** — sirve la SPA Angular exponiendo endpoints API para gestión de diccionarios, extracciones manuales, consultas de salud y auditoría de cierres.
3. **Coordinación de microservicios** — actúa como disparador y coordinador del resto de microservicios Typhoon (conectores de provisión, subsistemas de calibración, servicios de distribución).
4. **Coordinación de persistencia** — coordina la persistencia del estado critico en Oracle 19 (metadatos de instrumentos, logs de procesamiento, snapshots), incluyendo el orden de operaciones para servicios de soporte autorizados que tambien escriben en BD.
5. **Gestión de caché distribuida** — usa un **clúster Hazelcast** como data grid distribuido en memoria para:
   - Compartir datos de referencia estáticos (diccionarios de instrumentos, configuración) entre instancias concurrentes del Core.
   - Sincronizar estado entre instancias activas en topología de alta disponibilidad.
   - Reducir latencia de lecturas en BD para patrones de acceso de alta frecuencia.

### Rationale

- Java 11 aporta un runtime maduro con sólidas primitivas de concurrencia para servicios backend financieros.
- Hazelcast frente a Redis o caché centralizada: estructuras de datos distribuidas in-JVM con overhead de red casi nulo en despliegues co-localizados.
- El patrón de orquestador único (en vez de malla peer-to-peer) garantiza que toda la lógica de negocio se aplica en un único lugar, simplificando auditabilidad y gobierno.

### Consequences

- El Core es el punto único de control lógico; su correctitud determina directamente la correctitud de todos los flujos de datos downstream.
- La membresía del clúster Hazelcast debe gestionarse cuidadosamente: fallos de nodo durante el procesamiento pueden generar escenarios split-brain o estado de datos parcial.
- El escalado horizontal del Core requiere expansión del clúster Hazelcast y potencial re-particionado de los mapas en memoria.
- Todos los microservicios dependen de las APIs del Core; se requiere disciplina en versionado de APIs para evitar roturas en cascada.

## Acceptance Criteria

- [ ] El NOVA API Core expone APIs internas versionadas consumidas por todos los microservicios Typhoon.
- [ ] Todas las mutaciones de estado critico coordinadas por el Core se persisten atómicamente en Oracle 19 antes de disparar distribución downstream.
- [ ] El clúster Hazelcast está configurado con al menos 2 miembros para redundancia; la política de detección y resolución de split-brain está definida.
- [ ] El Core gestiona correctamente el ciclo de vida completo del instrumento: ingest → validate → enrich → publish → snapshot.
- [ ] Las peticiones concurrentes de múltiples sesiones se procesan sin condiciones de carrera en el estado compartido de instrumentos.

## Evidence

- **Fuente primaria**: `docs/Info Typhoon.docx` — sección "Núcleo Orquestador (Core y Lógica de Datos)"

## Traceability

| Artifact | Relation | Notes |
|---|---|---|
| ARCH-KYUW-001 | implements | Componente orquestador de la arquitectura Typhoon |
| ARCH-KYUW-003 | used-by | Los microservicios de input entregan datos al Core |
| ARCH-KYUW-004 | used-by | El Core dispara los workflows de calibración |
| ARCH-KYUW-005 | used-by | El Core publica eventos en NOVA Broker |
| ARCH-KYUW-006 | used-by | El Core persiste en Oracle 19 y NOVA FS |
| ARCH-KYUW-007 | triggers | El Core inicia los workflows de distribución |
| ARCH-KYUW-008 | serves | El Core expone las APIs consumidas por la SPA Angular |

