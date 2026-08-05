---
id: PROD-SETUP-001
type: spec
layer: product
status: draft
confidence: high
version: 0.1.0
created: 2026-07-08
updated: 2026-07-08
owner: to-be-assigned
dependencies:
  - id: DOM-KYUW-003
    relation: constrained-by
  - id: FEAT-AUTOCLOSE-001
    relation: uses-data-from
tags:
  - equity-setup
  - user-journey
  - instrument-lifecycle
---

# Equity Instrument Setup Journey

## Intent

Map the complete user experience for equity instrument setup, from email notification to live pricing in the autoclose subsystem.

## Definition

### Purpose

Enable operators to:
1. Receive and process equity instrument setup requests from Securities & Reference Data team
2. Extract and validate instrument data from JBPM request portal
3. Configure market data provider connections for intraday and closing prices
4. Register the instrument in Ans system for downstream valuation and monitoring
5. Confirm completion to trigger instrument activation in dependent systems (ORC, REPO, LIQUIDITY)

### Actors

- **Securities & Reference Data Team** — Submits instrument setup request via email with ISIN and reference data
- **Operations Operator** — Executes all five stages of setup workflow using Typhoon web UI
- **PLATFORM MANAGEMENT Team** — Initializes instrument in ORC/REPO/LIQUIDITY once Typhoon setup confirms

### Flow

#### Stage 1: Receive & Access Request
1. Operator receives email titled "INFO:EQUITY - SETUP DONE BY SECURITIES & REFERENCE DATA (ISIN: CA29446Y5020)"
2. Clicks email link: "Please, press this link to access the application to continue this task."
3. Arrives at JBPM request portal

#### Stage 2: Extract Data
1. From email title, extracts ISIN (e.g., "CA29446Y5020")
2. In JBPM portal, searches by ISIN in "Find By.." field and presses enter
3. Locates instrument row and clicks to open request
4. If request not visible: Uses "Search Securities" option → "Search Securities" → Filter by ISIN → Clicks BPM ID (the JBPM request)
5. From JBPM request, extracts data from "MUREX/4SIGHT Data" tab:
   - ISIN (confirmation)
   - Market
   - Murex Label (copied from field "Murex Instrument Label")
   - Currency
   - Reference Price
   - Reuters RIC
   - Bloomberg ID

#### Stage 3: Configure Autoclose
1. Navigates to Typhoon web: Closing Process → Autoclose Instruments
2. Snapshot selector: Selects "CLOSE_FO_MADRID"
3. Category selector: If Murex Label ends in "IN" or "IND", selects "INDEX_PRICE"; otherwise "EQUITY_PRICE"
4. Clicks "Display"
5. Enables "Show all instruments" checkbox
6. Filters by Murex Label; if no match, trims characters from end and retries
7. Clicks edit icon (pencil) on matching row
8. **Try Provider 1 - REFINITIV**:
   - Provider: "REFINITIV"
   - Rule: "CLOSE_LAST_PREVIOUSCLOSE"
   - Formula: "[Reuters RIC]" (e.g., "[0069.HK]")
   - Clicks "Test formula"; waits for result
   - If result = price number ≈ Reference Price → Clicks "Save" → Stage 3 Complete ✓
9. **Fallback to Provider 2 - BLOOMBERG** (if REFINITIV fails):
   - Provider: "BLOOMBERG"
   - Rule: "CLOSE_LAST_MID"
   - Formula: "[Bloomberg ID]"
   - Clicks "Test formula"; waits for result
   - If result = price number → Provider: "DATALICENSE" → Clicks "Save" → Stage 3 Complete ✓
10. **Failure Case** (if BLOOMBERG also fails):
    - Notes error message
    - Proceeds to Stage 5a (Error Communication)

#### Stage 4: Database Registration (Ans)
1. Returns to Typhoon web; keeps Autoclose Instruments page open
2. Strips characters from Murex Label end until finding similar labels with:
   - Same Market as extracted data
   - Non-empty "First Provider"
   - Non-empty "First Resource"
3. Copies one matching label
4. Navigates to Ans → Instruments → Create Instrument
5. Pastes copied label; clicks "Search"; waits for load
6. Pastes own Murex Label; clicks "Search"; waits for load
7. Clicks "Confirm" in result window
8. Attributes section:
   - Finds "ISIN" key row; pastes ISIN in Value column
9. Dictionary Info section:
   - Verifies "BLOOMBERG" and "REUTERS" providers exist
   - If missing: Clicks "+" button; selects missing providers; clicks "Ok"
   - Fills "RIC" column with Bloomberg ID and Reuters RIC values
10. Realtime activation (left to right order):
    - "Realtime" → Toggle off if on; toggle on (activates)
    - "Tick History" → Toggle off if on; toggle on (activates)
    - "Realtime Subscription" → Toggle off if on; toggle on (activates)
    - "Delayed" → Toggle off if on; toggle on (activates)
    - Verifies "Listeners" section populates with new listener entries
11. Clicks "Create" button (upper left below "Instrument" field); waits for confirmation
12. Stage 4 Complete ✓

#### Stage 5: Confirm Request
1. Returns to JBPM request portal
2. Clicks button "Setup done" (lower right)
3. Stage 5a Complete ✓

#### Stage 5b: Email Response (Success Case)
1. Replies to original email with:
   ```
   Buenas,
   Instrumento configurado en Typhoon. 
   Pueden inicializarlo en ORC, REPO y LIQUIDITY en ambos sets con valores distintos de 0? 
   @PLATFORM MANAGEMENT (BZG12031)
   Saludos
   ```
2. Stage 5b Complete ✓

#### Stage 5c: Email Response (Failure Case - Autoclose Error)
1. Replies to original email with:
   ```
   El ticker proporcionado no nos devuelve precio. 
   +EMMANUEL BENISTY , lo puedes revisar por favor?
   ```
2. Stage 5c Complete; awaiting manual intervention ✓

## Acceptance Criteria

- [ ] Operator successfully extracts all seven data fields from JBPM request
- [ ] Murex Label suffix correctly determines INDEX_PRICE vs EQUITY_PRICE category
- [ ] Autoclose configuration with REFINITIV provider succeeds when Reuters RIC is valid
- [ ] Autoclose fallback to BLOOMBERG succeeds when REFINITIV fails
- [ ] Failed autoclose does not block progression to database registration
- [ ] Instrument persists in Ans with all providers and RIC values populated
- [ ] Realtime listeners activate without errors
- [ ] Operator receives clear UI feedback at each stage (error messages, success confirmations)
- [ ] Email confirmation sent to PLATFORM MANAGEMENT team on success
- [ ] Operator tagged user in error notification when autoclose fails

## Evidence

- Source document: "Tareas e incidencias comunes.docx" — Complete equity setup workflow (4 sections: Sacar datos, Autoclose, Ans registration, Confirm)

## Traceability

- Implements: ARCH-KYUW-009
- Uses: DOM-KYUW-003, FEAT-AUTOCLOSE-001
- Work decomposition: WRK-TASK-001, WRK-TASK-002
- Documented in: DOC-KYUW-002

