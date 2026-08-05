---
id: PROD-SETUP-002
type: spec
layer: product
status: draft
confidence: high
version: 0.1.0
created: 2026-07-08
updated: 2026-07-08
owner: to-be-assigned
dependencies:
  - id: DOM-KYUW-004
    relation: constrained-by
  - id: FEAT-AUTOCLOSE-001
    relation: uses-data-from
tags:
  - futures-options-setup
  - user-journey
  - derivatives
---

# Futures & Options Instrument Setup Journey

## Intent

Map the streamlined user experience for derivatives (futures and options) instrument setup, with emphasis on type-based routing and simplified autoclose configuration.

## Definition

### Purpose

Enable operators to:
1. Receive derivatives instrument setup requests from Securities & Reference Data team
2. Route OPTIONS requests to archive (no setup required)
3. Execute simplified FUTURES setup with market data provider configuration
4. Optionally synchronize volatility and repo curves post-setup

### Actors

- **Securities & Reference Data Team** — Submits instrument setup request via email with Type and reference data
- **Operations Operator** — Executes setup workflow using Typhoon web UI (or archives if OPTION)
- **PLATFORM MANAGEMENT Team** — Initializes derivatives in ORC/REPO/LIQUIDITY once setup confirms

### Flow

#### Stage 1: Receive & Route Decision
1. Operator receives email titled "INFO:FUTURE AND OPTIONS - SETUP DONE BY SEC & REF DATA: [INSTRUMENT]"
2. Clicks email link: "Please, press this link to access the application to continue this task."
3. Arrives at JBPM request portal
4. **Type Check**:
   - If Type of Instrument = "OPTION" → **Proceed to Stage 5a (Archive)**
   - If Type of Instrument = "FUTURE" → **Proceed to Stage 2**

#### Stage 2: Extract Data (FUTURES only)
1. From JBPM request portal, extracts data:
   - MUREX Label
   - BBG CODE (e.g., "MOV26 Comdty")
   - MATURITY (discrete indicator, e.g., "26")
   - MATURITY DATE (calendar date, e.g., "2026-08-21")
   - At least one of MATURITY or MATURITY DATE must be present

#### Stage 3: Configure Autoclose
1. Navigates to Typhoon web: Closing Process → Autoclose Instruments
2. Snapshot selector: Selects "CLOSE_FO_MADRID"
3. Category selector: Searches for category containing keyword "FUTURE" (e.g., "INDEX_FUTURE", "EQUITY_FUTURE", "COMMODITY_FUTURE")
4. Clicks "Display"
5. Enables "Show all instruments" checkbox
6. Filters by MUREX Label
7. If multiple results with different MATURITY values: Configures each row separately
8. For each matching row, clicks edit icon (pencil)
9. **BLOOMBERG Provider Configuration** (no REFINITIV fallback for futures):
   - Provider: "BLOOMBERG"
   - Rule: "CLOSE_LAST_MID"
   - Formula: "[BBG CODE]" (e.g., "[MOV26 Comdty]")
   - Clicks "Test formula"; waits for result
   - If result = price number → Clicks "Save" �� Autoclose configured ✓
10. **Failure Case** (if BLOOMBERG returns error):
    - Notes error message (e.g., "Not valid instruments")
    - Proceeds to Stage 4 (Error Communication)

#### Stage 4: Optional Synchronization
1. If requested in email or by operator: Navigate to Typhoon Mx3 → Mx3 Management → Synchronize
2. Snapshot: Select appropriate snapshot (CLOSE_IPV or IPV_TOTEM)
3. Filter and synchronize volatility categories (BASKET_VOLATILITY, INDEX_VOLATILITY, EQUITY_VOLATILITY, REPO_MARGIN)
4. Monitor progress via Ans → Monitor until PROCESSING → Completed
5. Inform user of sync completion via email

#### Stage 5: Complete Request
1. Returns to JBPM request portal
2. Clicks button "Setup done" (lower right)
3. Proceeds to Stage 6

#### Stage 5a: Archive OPTION Request
1. Returns to JBPM request portal
2. Archives email or marks complete without setup
3. Message: "OPTIONS instruments do not require setup in Typhoon; archived."
4. Proceeds to Stage 6

#### Stage 6: Email Response (Success Case - FUTURES)
1. Replies to original email indicating autoclose configuration complete and optionally mentions synchronization if performed

#### Stage 6a: Email Response (Failure Case)
1. Replies to original email with:
   ```
   El ticker proporcionado no nos devuelve precio. 
   +EMMANUEL BENISTY , lo puedes revisar por favor?
   ```
2. Awaiting manual intervention from data provider team

## Acceptance Criteria

- [ ] OPTIONS-type instruments immediately identified and archived without configuration
- [ ] FUTURES-type instruments routed to autoclose configuration workflow
- [ ] MUREX Label filtering returns correct category matches (containing "FUTURE" keyword)
- [ ] Multiple maturity variants for same MUREX Label are each configured separately
- [ ] BLOOMBERG provider formula is tested and returns price for valid BBG CODEs
- [ ] Failed formula returns clear error message and does not corrupt autoclose state
- [ ] Operator can retry failed autoclose configuration without full restart
- [ ] Optional synchronization workflow completes without affecting autoclose configuration
- [ ] Email confirmation sent on success; operator tagged on failures
- [ ] OPTION requests archived and no further action taken

## Evidence

- Source document: "Tareas e incidencias comunes.docx" — "si en el campo Type of Instrument pone 'OPTION', no hace falta hacer nada y archivamos el mail"
- Source document: "Tareas e incidencias comunes.docx" — Futures autoclose setup section with BBG CODE formula format

## Traceability

- Implements: ARCH-KYUW-009
- Uses: DOM-KYUW-004, FEAT-AUTOCLOSE-001
- Work decomposition: WRK-TASK-002
- Documented in: DOC-KYUW-003

