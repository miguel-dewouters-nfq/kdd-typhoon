# Copilot Instructions — Typhoon (Market Data Server) Unified AI Context

## ⚠️ REGLA FUNDAMENTAL

1. SIEMPRE consultar `specs/` antes de responder sobre Typhoon / MDS.
2. Si la consulta involucra código fuente, consultar también los repositorios referenciados (NOVA API Core, KYUW microservicios, SPA Angular).
3. NO inventar terminología, nombres de tablas, procesos, flujos, snapshots o componentes.
4. Citar specs (ID + ruta) en cada respuesta.
5. Todas las specs están actualmente en estado **draft** — documentar tal cual, indicando el estado.
6. **MÁXIMA ESPECIFICIDAD EN PROCEDIMIENTOS**: Cuando se expliquen pasos operativos, procedimientos o acciones dentro de Typhoon u otros sistemas:
   - Indicar **exactamente dónde hacer clic** (nombre del botón, posición en pantalla: arriba/abajo/izquierda/derecha, icono visual).
   - Indicar las **rutas de navegación completas** en los menús (ej: `Closing Process → Autoclose Instruments`).
   - Incluir **URLs de acceso** cuando estén documentadas en `specs/documentation/` (sección "Accesos y URLs").
   - Detallar el **resultado esperado** de cada acción (qué debe aparecer en pantalla tras hacer clic).
   - Incluir **capturas de errores comunes** y cómo resolverlos en cada paso.
   - Indicar **qué NO hacer** (errores típicos de novato) cuando aplique.
   - Asumir siempre que el lector es **alguien que nunca ha usado el sistema** y necesita autonomía total.
   - **Nunca dar por sentado** que el usuario sabe dónde está un botón, qué significa un campo o cómo navegar entre pantallas.

## Mapa del Workspace

| Carpeta | Rol |
|---------|-----|
| `specs/` | Especificaciones formales del dominio Typhoon (KDD) |
| `specs/architecture/` | 8 specs de arquitectura del sistema (ARCH-KYUW-001..008) |
| `specs/domain/` | 2 specs de reglas de negocio (DOM-KYUW-001..002) |
| `specs/documentation/` | 1 SOP operativo (DOC-KYUW-001) |
| `specs/feature/` | (vacío — pendiente de poblar) |
| `specs/governance/` | (vacío — pendiente de poblar) |
| `specs/product/` | (vacío — pendiente de poblar) |
| `specs/work/` | (vacío — pendiente de poblar) |
| `specs/_manifest.json` | Manifiesto con IDs, capas, rutas y cross-references |
| `docs/` | Documentación fuente original (.docx): Info Typhoon, Tareas e incidencias comunes |
| `prompt-bootstrap-kdd-typhoon.md` | Prompt de bootstrapping para generar este fichero |

## Dominio: Typhoon (Market Data Server / MDS)

**Typhoon** es la plataforma centralizada de gestión y provisión de datos de mercado de **BBVA CIB Global Markets**. También conocida como **MDS** (Market Data Server), opera bajo la arquitectura **Nova 2.0** y funciona como:

- **Repositorio centralizado de datos de mercado** — precios en tiempo real, datos de referencia, series históricas, snapshots de cierre EOD.
- **Motor de validación y control** — todo dato de mercado pasa por validación, autorización y formateo antes de distribuirse a sistemas consumidores.
- **Orquestador de calibración** — envía datos a motores analíticos externos (FOL/Symphony, Murex, ORC) para calibración de parámetros de modelos financieros (superficies de volatilidad, curvas de tipos).
- **Hub de distribución multiconsumidor** — entrega datos validados y calibrados a todos los sistemas de Global Markets (Murex3, Telémaco, Risk Viewer, Calypso, DATIO, CFIT, ORC) mediante streaming ESB, API REST y cesiones batch.
- **Plataforma de gestión operativa** — SPA Angular para operadores, equipos de riesgo e ingeniería de soporte: gestión de diccionarios de instrumentos, monitorización, extracciones manuales, auditoría de cierres.

**Fuente**: `ARCH-KYUW-001` (`specs/architecture/ARCH-KYUW-001-typhoon-system-architecture-overview.md`)

### Datos gestionados

- Precios de mercado en tiempo real (tick-by-tick vía Bloomberg B-PIPE, Refinitiv TREP)
- Datos de referencia de instrumentos (Equity, Index, Renta Fija, Derivados)
- Series históricas (Refinitiv Tick History, Bloomberg Data License)
- Datos de proveedores periódicos (IHS Markit, BCE, Eurex, Alpima)
- Datos internos BBVA (Asset Control, IPV Manager, Datio)
- Snapshots de cierre de mercado (EOD: `CLOSE_FO_MADRID`, `SOLAR`)
- Parámetros calibrados (volatility smile, curvas de descuento, matrices de correlación)

### Componentes clave

| Componente | Descripción | Spec |
|------------|-------------|------|
| NOVA API Core | Orquestador Java 11 + Hazelcast — cerebro del sistema | `ARCH-KYUW-002` |
| KYUW B-Pipe | Conector real-time Bloomberg (TCP) | `ARCH-KYUW-003` |
| KYUW TREP | Conector real-time Refinitiv (RSSL TCP) | `ARCH-KYUW-003` |
| KYUW Tick/DSS | Extracción Refinitiv Tick History (HTTP/REST) | `ARCH-KYUW-003` |
| KYUW Data License | Extracción Bloomberg Data License (SFTP) | `ARCH-KYUW-003` |
| KYUW Website | Conectores HTTP/REST (IHS Markit, BCE, Eurex, Alpima) | `ARCH-KYUW-003` |
| Demon NOVA (FW Core) | File watcher ingesta pasiva (Asset Control, IPV Manager) | `ARCH-KYUW-003` |
| Conectores Calibración | TCP a FOL/Symphony, Murex 3, Murex AWS, ORC | `ARCH-KYUW-004` |
| NOVA Broker | Bus AMQP de eventos internos | `ARCH-KYUW-005` |
| Demon NOVA (Alerts) | Daemon suscriptor para alertas y correlación de eventos | `ARCH-KYUW-005` |
| ANS Tool | API Python de administración operativa | `ARCH-KYUW-005` |
| Oracle 19 | BD relacional exclusiva de Typhoon (estado transaccional) | `ARCH-KYUW-006` |
| NOVA FS | Sistema de ficheros segmentado: FS IN, FS OUT, FS Calibrations | `ARCH-KYUW-006` |
| Epsilon | Object store para historificación profunda y archivado | `ARCH-KYUW-006` |
| TIBCO ESB | Distribución streaming publish/subscribe | `ARCH-KYUW-007` |
| Rancher/XMAS | Proxy REST seguro para consumidores API | `ARCH-KYUW-007` |
| DataX/Nova Transfer/SFTP | Distribución batch de ficheros | `ARCH-KYUW-007` |
| SPA Angular | Frontend operativo con z-table (NOVA CDN) | `ARCH-KYUW-008` |

## Anclas por Tipo de Tarea

### Ingesta de datos de mercado (Input Layer)
- Proveedores real-time (Bloomberg B-PIPE, Refinitiv TREP): `ARCH-KYUW-003`
- Extracciones HTTP/REST y SFTP (Tick History, Data License, websites): `ARCH-KYUW-003`
- File watchers internos (Asset Control, IPV Manager): `ARCH-KYUW-003`
- Zona de aterrizaje FS IN: `ARCH-KYUW-006`

### Procesamiento y orquestación (NOVA API Core)
- Lógica de negocio y validación de instrumentos: `ARCH-KYUW-002`
- Caché distribuida Hazelcast: `ARCH-KYUW-002`
- Coordinación de microservicios: `ARCH-KYUW-002`
- Ciclo de vida del instrumento (ingest → validate → enrich → publish → snapshot): `ARCH-KYUW-002`

### Calibración de parámetros financieros
- FOL/Symphony (motor analítico interno BBVA): `ARCH-KYUW-004`
- Murex 3 y Murex AWS Labs: `ARCH-KYUW-004`
- ORC (valoración de opciones): `ARCH-KYUW-004`
- Zona transitoria FS Calibrations: `ARCH-KYUW-004`, `ARCH-KYUW-006`

### Almacenamiento y persistencia
- Oracle 19 (estado transaccional, exclusiva): `ARCH-KYUW-006`
- NOVA FS (FS IN / FS OUT / FS Calibrations): `ARCH-KYUW-006`
- Epsilon (historificación, archivado write-once): `ARCH-KYUW-006`

### Distribución de datos a consumidores
- Streaming vía TIBCO ESB: `ARCH-KYUW-007`
- API REST bajo demanda (Rancher/XMAS): `ARCH-KYUW-007`
- Cesiones batch (DataX, Nova Transfer, SFTP): `ARCH-KYUW-007`
- Consumidores: Murex3, Telémaco, Risk Viewer, Calypso, DATIO, CFIT, ORC: `ARCH-KYUW-007`

### Mensajería, alertas y operaciones
- NOVA Broker (bus AMQP): `ARCH-KYUW-005`
- Demon NOVA Alerts (correlación y alertas): `ARCH-KYUW-005`
- ANS Tool Python (API de administración): `ARCH-KYUW-005`
- Gestor de Notificaciones CIB (API G.N): `ARCH-KYUW-005`

### Frontend y experiencia de operador
- SPA Angular (NOVA CDN): `ARCH-KYUW-008`
- Gestión de diccionario de instrumentos: `ARCH-KYUW-008`
- Monitorización de salud y trazas: `ARCH-KYUW-008`
- Lanzamiento de extracciones manuales: `ARCH-KYUW-008`
- Auditoría de cierre de mercado (EOD): `ARCH-KYUW-008`
- Componente z-table (rendimiento tablas grandes): `ARCH-KYUW-008`

### Alta de instrumentos Equity/Index (onboarding)
- Reglas de autoclose y selección de proveedor: `DOM-KYUW-001`
- Workflow de confirmación post-setup (JBPM): `DOM-KYUW-002`
- SOP operativo completo paso a paso: `DOC-KYUW-001`

### Autoclose y cierre de mercado (EOD)
- Snapshots `CLOSE_FO_MADRID` y `SOLAR`: `DOM-KYUW-001`
- Árbol de decisión Refinitiv → Bloomberg/DATALICENSE: `DOM-KYUW-001`
- Categorización INDEX_PRICE vs EQUITY PRICE: `DOM-KYUW-001`
- Reglas de pricing (CLOSE_LAST_PREVIOUSCLOSE, CLOSE_LAST_MID): `DOM-KYUW-001`

### Integraciones upstream/downstream
- **Upstream (proveedores)**: Bloomberg, Refinitiv, IHS Markit, BCE, Eurex, Alpima, Asset Control, IPV Manager, Datio: `ARCH-KYUW-003`
- **Calibración (bidireccional)**: FOL/Symphony, Murex 3, Murex AWS, ORC: `ARCH-KYUW-004`
- **Downstream (consumidores)**: Murex3, Telémaco, Risk Viewer, Calypso, DATIO, CFIT, ORC: `ARCH-KYUW-007`
- **Downstream (post-setup)**: ORC, REPO, LIQUIDITY vía Platform Management (BZG12031): `DOM-KYUW-002`
- **Workflow**: JBPM, ENOA: `DOM-KYUW-002`, `DOC-KYUW-001`

## Mapa de IDs

| Prefijo | Rango | Capa | Descripción |
|---------|-------|------|-------------|
| `ARCH-KYUW-` | 001–008 | architecture | Arquitectura del sistema: capas, servicios, componentes, tecnologías |
| `DOM-KYUW-` | 001–002 | domain | Reglas de negocio: autoclose, selección de proveedor, workflows |
| `DOC-KYUW-` | 001 | documentation | SOPs operativos: procedimientos paso a paso para operadores |

> **Nota**: Las capas `feature/`, `governance/`, `product/` y `work/` están vacías — pendientes de poblar a medida que el KDD crezca.

## Pipeline del Sistema

```
┌──────────────────────────┐     ┌─────────────────────────────┐     ┌──────────────────────────┐
│       PROVEEDORES        │     │         TYPHOON / MDS       │     │      CONSUMIDORES        │
│       (Input Layer)      │     │       (Nova 2.0)            │     │      (Output Layer)      │
│                          │     │                             │     │                          │
│  Bloomberg B-PIPE ───────│────▶│  KYUW B-Pipe ──┐            │     │                          │
│  Refinitiv TREP ─────────│────▶│  KYUW TREP ────┤            │     │  Murex3 ◀── ESB Stream   │
│  Refinitiv Tick/DSS ─────│────▶│  KYUW Tick/DSS ┤            │     │  Telémaco ◀── REST API   │
│  Bloomberg Data License ─│────▶│  KYUW DataLic. ┤  ┌────────┐│     │  Risk Viewer ◀── ESB     │
│  IHS Markit / BCE ───────│────▶│  KYUW Website ─┼─▶│ NOVA   ││     │  Calypso ◀── ESB/Batch   │
│  Eurex / Alpima ─────────│────▶│                │  │ API    ││     │  DATIO ◀── Batch/SFTP    │
│                          │     │  Demon NOVA ───┤  │ Core   ││     │  CFIT ◀── REST API       │
│  Asset Control ──────────│────▶│  (FW Core)     │  │(Java11)││────▶│  ORC ◀── REST/Batch      │
│  IPV Manager ────────────│────▶│                │  │+Hazel- ││     │                          │
│  Datio ──────────────────│────▶│    FS IN ──────┘  │cast    ││     │                          │
│                          │     │                   └───┬────┘│     │                          │
└──────────────────────────┘     │                       │     │     └──────────────────────────┘
                                 │              ┌────────┴───┐ │
                                 │    ┌─────────┤ Oracle 19  │ │
                                 │    │         │ NOVA FS    │ │
┌──────────────────────────┐     │    │         │ Epsilon    │ │     ┌──────────────────────────┐
│    CALIBRACIÓN           │     │    │         └────────────┘ │     │    OPERACIONES            │
│                          │     │    │                        │     │                          │
│  FOL/Symphony ◀──────────│────▶│    ▼                        │     │  NOVA Broker (AMQP)      │
│  Murex 3 ◀───────────────│────▶│  Calibration               │     │  Demon NOVA Alerts       │
│  Murex AWS Labs ◀────────│────▶│  Connectors (TCP)          │     │  ANS Tool (Python)       │
│  ORC ◀───────────────────│────▶│                             │     │  G.N. CIB (notificac.)   │
│                          │     │                             │     │  SPA Angular (z-table)   │
└──────────────────────────┘     └─────────────────────────────┘     └──────────────────────────┘
```

### Flujo de alta de instrumento Equity/Index

```
Email JBPM (ENOA)                    Typhoon Frontend (SPA Angular)              JBPM / Email
──────────────────                   ──────────────────────────────              ──────────────
       │                                        │                                     │
  1. Extraer datos                              │                                     │
     (ISIN, Market,                             │                                     │
      Murex Label,                              │                                     │
      Currency,                                 │                                     │
      Reuters RIC,                              │                                     │
      Bloomberg ID)                             │                                     │
       │                                        │                                     │
       └──────────────────▶ 2. Autoclose Config │                                     │
                               Snapshot: CLOSE_FO_MADRID                              │
                               Snapshot: SOLAR                                        │
                               │                                                      │
                               ├─ Refinitiv ✅ → Save                                 │
                               └─ Refinitiv ❌ → Bloomberg ✅ → DATALICENSE → Save    │
                                                  Bloomberg ❌ → Escalar              │
                               │                                                      │
                           3. Registrar en BD                                         │
                               (Create Instrument,                                    │
                                ISIN, RIC, Bloomberg,                                 │
                                Realtime feeds)                                       │
                               │                                                      │
                               └───────────────────────────────▶ 4. "Setup done"      │
                                                                    Email confirm     │
                                                                    → Platform Mgmt   │
                                                                    (ORC, REPO,       │
                                                                     LIQUIDITY)       │
```

## Stack Técnico

| Componente | Tecnología |
|------------|------------|
| Backend / Orquestador | Java 11 (NOVA API Core) |
| Caché distribuida | Hazelcast (cluster in-JVM) |
| Base de datos | Oracle 19 (exclusiva Typhoon) |
| Sistema de ficheros | NOVA FS (FS IN / FS OUT / FS Calibrations) |
| Object store | Epsilon (buckets write-once) |
| Bus de mensajería | NOVA Broker (AMQP) |
| ESB corporativo | TIBCO ESB (streaming publish/subscribe) |
| Frontend | Angular SPA (z-table para rendimiento) |
| CDN | NOVA CDN |
| API de operaciones | ANS Tool (Python) |
| Seguridad | XMAS (autenticación, autorización, perímetro) |
| Proxy API | Rancher (reverse proxy) |
| Transferencia batch | DataX, Nova Transfer, SFTP |
| Conectores real-time | Bloomberg B-PIPE (TCP), Refinitiv TREP (RSSL TCP) |
| Conectores calibración | TCP dedicado (FOL/Symphony, Murex 3, Murex AWS, ORC) |
| Workflow | JBPM, ENOA |
| Notificaciones | Gestor de Notificaciones CIB (API G.N.) |

## Protocolo de Cambios

1. **Spec primero** — Toda regla de negocio, workflow o componente arquitectónico documentado en `specs/` es la fuente de verdad. Si el código o la operativa divergen, la spec debe actualizarse antes o a la vez.
2. **ID obligatorio** — Cada spec tiene un ID único (`ARCH-KYUW-XXX`, `DOM-KYUW-XXX`, `DOC-KYUW-XXX`). Toda referencia cruzada usa IDs, no nombres.
3. **Cross-references en manifest** — `specs/_manifest.json` contiene las relaciones entre specs (implements, constrained-by, uses-data-from, related). Actualizar al añadir o modificar specs.
4. **Estado draft** — Todas las specs actuales están en estado `draft`. Cuando se validen con los equipos técnicos, pasar a `validated`.
5. **Coherencia bidireccional** — Los cambios operativos (ej. nuevo proveedor, nuevo consumidor) deben reflejarse en las specs correspondientes de `architecture/`, `domain/` y `documentation/`.

## Validación

> **Nota**: Este workspace KDD no dispone aún de herramientas de validación automatizada (`apps/spec-graph/` no existe). Los comandos se añadirán cuando se incorporen.

```bash
# Verificar estructura del workspace
ls specs/architecture/ specs/domain/ specs/documentation/

# Contar specs por capa
echo "Architecture: $(ls specs/architecture/*.md 2>/dev/null | wc -l)"
echo "Domain: $(ls specs/domain/*.md 2>/dev/null | wc -l)"
echo "Documentation: $(ls specs/documentation/*.md 2>/dev/null | wc -l)"
echo "Feature: $(ls specs/feature/*.md 2>/dev/null | wc -l)"
echo "Work: $(ls specs/work/*.md 2>/dev/null | wc -l)"

# Verificar que todas las specs tienen frontmatter con id
grep -l "^id:" specs/**/*.md

# Buscar specs huérfanas (no referenciadas en _manifest.json)
diff <(ls specs/**/*.md | sort) <(grep '"file"' specs/_manifest.json | sed 's/.*"file": "//;s/".*//' | sort)
```

## Idioma

Las specs están redactadas en **español** con terminología técnica en inglés donde corresponde (nombres de tecnologías, componentes, protocolos, campos de sistema). Los nombres de proveedores, snapshots, reglas y campos del sistema se mantienen en su idioma original (inglés).

## Pitfalls

1. **BLOOMBERG ≠ DATALICENSE**: Cuando el test de Bloomberg tiene éxito en el autoclose, el proveedor que se guarda en Typhoon es `DATALICENSE`, **NO** `BLOOMBERG`. Bloomberg se usa solo para validar el ticker; la captura real en cierre usa el feed Data License. Guardar con `BLOOMBERG` es un error operativo. (`DOM-KYUW-001` R3)

2. **Ambos snapshots son obligatorios**: Todo instrumento Equity/Index debe configurarse en el autoclose en **dos** snapshots: `CLOSE_FO_MADRID` **y** `SOLAR`. Configurar solo uno es una configuración incompleta. (`DOM-KYUW-001` R1)

3. **Orden fijo de proveedores**: Refinitiv se prueba **siempre primero**. No se puede saltar directamente a Bloomberg. El árbol de decisión es secuencial y obligatorio. (`DOM-KYUW-001` R3)

4. **Murex Label puede estar vacío**: En la pestaña MUREX/4SIGHT Data de JBPM, el campo Murex Label puede estar vacío o ser incorrecto. En ese caso, usar el campo "Murex Instrument Label" de la pestaña SECURITIES & REFERENCE DATA. (`DOC-KYUW-001` Paso 1)

5. **Oracle 19 es exclusiva**: El NOVA API Core es el **único** componente que escribe en la base de datos Oracle 19. Ningún otro microservicio tiene acceso directo. Los accesos desde aplicaciones externas están rechazados a nivel de BD. (`ARCH-KYUW-006`, `ARCH-KYUW-002`)

6. **Email de confirmación = respuesta al hilo original**: El email de confirmación post-setup debe ser una **respuesta** al email original de notificación JBPM/ENOA. Enviar un email nuevo rompe la cadena de trazabilidad. (`DOM-KYUW-002` R2)

7. **Platform Management (BZG12031) inicializa ORC/REPO/LIQUIDITY**: El equipo de soporte Typhoon **no** inicializa instrumentos en estos sistemas. Es responsabilidad exclusiva de Platform Management. Sin su acción, el instrumento no es operativo en ORC/REPO/LIQUIDITY. (`DOM-KYUW-002` R4)

8. **Hazelcast split-brain**: En el clúster Hazelcast del NOVA API Core, fallos de nodo durante el procesamiento pueden generar escenarios de split-brain o estado de datos parcial. La política de detección y resolución debe estar definida. (`ARCH-KYUW-002`)

9. **FS Calibrations es transitoria**: Los ficheros en la zona FS Calibrations deben limpiarse tras commit exitoso en el Core. Ficheros huérfanos con antigüedad superior al TTL indican un problema (calibración fallida sin limpiar). (`ARCH-KYUW-004`)

10. **Disponibilidad Typhoon = disponibilidad Global Markets**: Una caída de Typhoon se propaga a **todos** los sistemas consumidores (Murex3, Telémaco, Risk Viewer, Calypso, DATIO, CFIT, ORC). Es un sistema crítico de infraestructura. (`ARCH-KYUW-001`)
