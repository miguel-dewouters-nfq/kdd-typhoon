---
id: ARCH-KYUW-009
type: spec
layer: architecture
status: draft
confidence: high
version: 0.1.0
created: 2026-07-08
updated: 2026-07-08
owner: to-be-assigned
dependencies:
  - id: ARCH-KYUW-003
    relation: uses-data-from
tags:
  - instrument-management
  - setup-workflow
  - integration
---

# Typhoon Instrument Setup Subsystem

## Intent

Define the architecture for instrument lifecycle management: from request ingestion through JBPM to data extraction, validation, autoclose configuration, and database persistence in Ans.

## Definition

### Context

Typhoon receives instrument setup requests via email notifications from external systems (Securities & Reference Data). These requests trigger multi-step workflows:
- **Equity instruments**: Complex 4-stage setup (data extraction → autoclose config → database creation → confirmation)
- **Futures instruments**: Simplified workflow with optional market data sync
- **Options instruments**: No-action routing

### Decision

The subsystem is decomposed into five components operating in sequence:

1. **JBPM Request Handler** - Receives and manages workflow requests via email link
2. **Data Extraction Layer** - Validates ISINs against reference data; extracts Murex labels, market, currency, pricing metadata
3. **Autoclose Configuration Engine** - Connects market data providers (REFINITIV, BLOOMBERG, DATALICENSE) to pricing formulas
4. **Ans Instrument Registry** - Persists instruments with provider and resource mappings
5. **Mx3 Synchronization Manager** - Propagates volatility, repo, and other market curve data

### Rationale

This separation of concerns allows:
- Fault isolation (autoclose failure doesn't block database creation)
- Provider fallback (try REFINITIV → BLOOMBERG → DATALICENSE)
- Idempotent re-run (step can be retried without full restart)
- Audit trail (each stage produces confirmations and error artifacts)

### Consequences

- Operators must follow a strict step sequence; out-of-order execution causes state corruption
- Email-driven workflow introduces latency for confirmations
- Manual testing of autoclose formulas is required before committing

## Acceptance Criteria

- [ ] All four instrument types (EQUITY, FUTURE, OPTION, BASKET) route correctly based on type field
- [ ] Failed autoclose setup in REFINITIV falls back to BLOOMBERG without requiring rerun of extraction
- [ ] Instrument persists in Ans even if autoclose setup fails; failure is logged and communicated to operator
- [ ] Synchronization workflows (Volatility, IPV TOTEM) execute independently of instrument setup
- [ ] All state transitions (JBPM → Autoclose → Ans → Monitor) are logged and auditable

## Evidence

- Source document: "Tareas e incidencias comunes.docx" — "Meter el instrumento en el autoclose" (Steps for autoclose configuration)
- Source document: "Tareas e incidencias comunes.docx" — "Meter el instrumento en base de datos" (Steps for Ans registry)

## Traceability

- Implemented by: FEAT-AUTOCLOSE-001, FEAT-SYNC-001, FEAT-SYNC-002
- Operationalized by: DOC-KYUW-002, DOC-KYUW-003
- User journey: PROD-SETUP-001, PROD-SETUP-002

