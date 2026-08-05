---
id: DOM-KYUW-004
type: spec
layer: domain
status: draft
confidence: high
version: 0.1.0
created: 2026-07-08
updated: 2026-07-08
owner: to-be-assigned
dependencies:
  - id: DOM-KYUW-001
    relation: extends
tags:
  - derivatives
  - futures
  - options
  - instrument-classification
---

# Futures & Options Instrument Rules

## Intent

Codify the business rules for handling derivatives (futures and options) in Typhoon's instrument setup workflow.

## Definition

### Concept

Derivatives instruments are routed based on their **Type of Instrument** field in the JBPM request:
- **OPTION**: No further action required; archive the email
- **FUTURE**: Proceed with setup workflow, including maturity tracking and market data capture

Futures carry additional metadata:
- **MUREX Label**: Internal trading system identifier
- **BBG CODE** (Bloomberg Code): Provider identifier (format: "XXX26 Comdty")
- **MATURITY**: Discrete maturity indicator (e.g., "26")
- **MATURITY DATE**: Explicit expiration date
- **Category**: Must contain keyword "FUTURE" to filter results in Autoclose

### Rules

1. **Type-Based Routing**
   - If Type of Instrument = "OPTION" → No setup required; archive email immediately
   - If Type of Instrument = "FUTURE" ��� Proceed with autoclose configuration and optional sync

2. **Autoclose Configuration for Futures**
   - Provider: BLOOMBERG (primary only; no REFINITIV fallback for futures)
   - Rule: CLOSE_LAST_MID (standard mid-market price)
   - Formula: BBG CODE in square brackets, e.g., "[MOV26 Comdty]"
   - Category filter: Search categories containing "FUTURE" keyword
   - Multiple maturity results: Apply autoclose to each result that has non-null MATURITY or MATURITY DATE

3. **Maturity Handling**
   - MATURITY field (e.g., "26") takes precedence if populated
   - MATURITY DATE provides explicit calendar date fallback
   - At least one field must be present to accept the futures instrument

4. **Error Handling**
   - If BBG CODE formula returns "Not valid instruments" error: notify operator with user tag (e.g., "+EMMANUEL BENISTY")
   - Do not attempt REFINITIV fallback for futures (use BLOOMBERG only)

### Constraints

- Options instruments must not enter the setup workflow; routing decision must happen before any configuration steps
- Futures with null MATURITY AND null MATURITY DATE are rejected as invalid
- Category search is mandatory (cannot manually create futures without category keyword match)

### Examples

**Example 1: Options - No Action**
- Type of Instrument: "OPTION"
- Email Title: "INFO:FUTURE AND OPTIONS - SETUP DONE BY SEC & REF DATA: NEW OPTION: EUR PUT"
- Action: Archive email; notify user that options are not configured in Typhoon
- Status: Complete

**Example 2: Futures - CO2 Futures**
- Type of Instrument: "FUTURE"
- MUREX Label: "CO2F26"
- BBG CODE: "CO2F26 Comdty"
- MATURITY: "26"
- MATURITY DATE: "2026-08-28"
- Category: Search "FUTURE" → Returns "INDEX_FUTURE", "EQUITY_FUTURE", "COMMODITY_FUTURE" candidates
- Result: Apply autoclose rule "[CO2F26 Comdty]" to each matching candidate
- Test: Formula returns €68.50 (valid) → Save configuration ✓

**Example 3: Futures - Bloomberg Formula Fails**
- Type of Instrument: "FUTURE"
- BBG CODE: "INVALID26 Comdty"
- Formula test returns: "Not valid instruments"
- Action: Notify operator: "El ticker proporcionado no nos devuelve precio. +EMMANUEL BENISTY , lo puedes revisar por favor?"
- Status: Manual review required

## Acceptance Criteria

- [ ] Options-type instruments immediately archive without entering setup workflow
- [ ] Futures-type instruments proceed to autoclose configuration
- [ ] BLOOMBERG provider is attempted for futures (no REFINITIV fallback)
- [ ] BBG CODE formula syntax is validated (must include "Comdty" suffix when applicable)
- [ ] Formula test performs actual market data lookup and returns price or explicit error
- [ ] Multiple maturity variants are handled: each matching result gets autoclose configured separately
- [ ] Operator is tagged when formula test fails; no silent failures

## Evidence

- Source document: "Tareas e incidencias comunes.docx" — "si en el campo Type of Instrument pone 'OPTION', no hace falta hacer nada y archivamos el mail"
- Source document: "Tareas e incidencias comunes.docx" — Futures setup with MATURITY/MATURITY DATE fields
- Source document: "Tareas e incidencias comunes.docx" — "En el campo 'Formula' introducimos el valor de BBG CODE entre corchetes. Por ejemplo: [MOV26 Comdty]"

## Traceability

- Implemented by: FEAT-AUTOCLOSE-001
- Operationalized by: DOC-KYUW-003
- User journey: PROD-SETUP-002
- Work task: WRK-TASK-002

