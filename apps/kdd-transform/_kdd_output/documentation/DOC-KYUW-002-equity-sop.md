---
id: DOC-KYUW-002
type: spec
layer: documentation
status: draft
confidence: high
version: 0.1.0
created: 2026-07-08
updated: 2026-07-08
owner: to-be-assigned
dependencies:
  - id: PROD-SETUP-001
    relation: implements
tags:
  - sop
  - equity
  - runbook
  - step-by-step
---

# Equity Setup Standard Operating Procedure

## Intent

Provide operations teams with a clear, step-by-step runbook for equity instrument setup in Typhoon, from email receipt to live pricing configuration.

## Definition

### Purpose

Audience: Operations operators performing daily equity instrument setup tasks
Scope: Covers the four-stage process (Data Extraction → Autoclose Config → Database Registration → Confirmation)
Outcome: Operator can independently complete equity setup without supervision

### Audience

- Junior operations staff (first-time equity setup)
- Senior operations staff (as reference checklist)
- Training materials and onboarding programs

### Content Overview

**Part 1: Email & JBPM Request Access**
- Email notification structure and fields to extract
- Step-by-step: How to navigate email link to JBPM portal
- Troubleshooting: Request not found in "Find By.." field

**Part 2: Data Extraction from JBPM**
- ISIN search workflow
- Alternative search via "Search Securities" for archived requests
- 7 data fields to extract from MUREX/4SIGHT Data tab:
  - ISIN
  - Market
  - Murex Label (with note on copying from "Murex Instrument Label" field vs. other labels)
  - Currency
  - Reference Price
  - Reuters RIC
  - Bloomberg ID
- Data validation checklist (all fields populated, ISIN matches email title)

**Part 3: Autoclose Configuration**
- Navigate to Closing Process → Autoclose Instruments
- Snapshot selection (CLOSE_FO_MADRID)
- Category selection logic:
  - Decision tree: Does Murex Label end with "IN" or "IND"?
  - Yes → INDEX_PRICE; No → EQUITY_PRICE
- Display and filter workflow
- "Show all instruments" checkbox toggle and purpose
- Partial label search (if exact match not found)
- Edit icon (pencil) to open autoclose rule editor
- **Try REFINITIV First**:
  - Provider dropdown selection
  - Rule selection (CLOSE_LAST_PREVIOUSCLOSE)
  - Formula syntax: "[Reuters RIC]" with examples
  - Test formula button behavior
  - Expected output: Price number (not error)
  - Reference Price comparison: Does returned ≈ Reference Price?
  - Save button
- **Fallback to BLOOMBERG** (if REFINITIV fails):
  - Provider: BLOOMBERG
  - Rule: CLOSE_LAST_MID
  - Formula: "[Bloomberg ID]"
  - Test and validate
  - Special case: "DATALICENSE" provider used after BLOOMBERG (operational note only)
- **Error Case**:
  - Logged error message
  - Proceed to Database Registration even if Autoclose fails
  - Note error for Stage 5 email

**Part 4: Database Registration (Ans)**
- Keep Autoclose Instruments page open (reference for label matching)
- Navigate to Ans → Instruments → Create Instrument
- Partial label search strategy (strip characters from end until finding similar labels with same Market)
- Copy candidate label from Autoclose page
- Paste in Ans → Search → Confirm
- Paste own Murex Label → Search → Confirm
- Attributes section:
  - Locate "ISIN" row
  - Paste ISIN value in Value column
- Dictionary Info section:
  - Verify BLOOMBERG and REUTERS providers present
  - If missing: Click "+" → Select providers → OK
  - Fill RIC column with Bloomberg ID and Reuters RIC
- Realtime activation sequence (toggle off/on for each):
  - "Realtime"
  - "Tick History"
  - "Realtime Subscription"
  - "Delayed"
  - Verify Listeners section populates
- Click Create button (upper left below Instrument field)
- Wait for confirmation message

**Part 5: Request Confirmation**
- Return to JBPM portal
- Click "Setup done" button (lower right)

**Part 6: Email Response**
- **Success Case**:
  ```
  Buenas,
  Instrumento configurado en Typhoon. 
  Pueden inicializarlo en ORC, REPO y LIQUIDITY en ambos sets con valores distintos de 0? 
  @PLATFORM MANAGEMENT (BZG12031)
  Saludos
  ```
- **Autoclose Error Case**:
  ```
  El ticker proporcionado no nos devuelve precio. 
  +EMMANUEL BENISTY , lo puedes revisar por favor?
  ```

### Additional Sections

**Troubleshooting**
- "ISIN not found in JBPM portal" → Use "Search Securities" workflow
- "Murex Label not found in Autoclose Instruments" → Partial label search instructions
- "Formula test returns error" → Fallback provider instructions
- "Ans Create Instrument fails" → Common validation errors

**Checklists**
- Pre-setup: Email and ISIN verified
- Post-setup: All 7 data fields extracted
- Post-autoclose: Formula test successful and price valid
- Post-database: All providers and RIC values saved
- Pre-email: Request marked "Setup done" in JBPM

**Common Pitfalls**
- Forgetting to enable "Show all instruments" → Instrument invisible in filter
- Copying Murex Label from wrong field → Formula test fails with "Not valid instruments"
- Confusing INDEX_PRICE vs EQUITY_PRICE → Autoclose rule saved to wrong category
- Skipping Database Registration → Instrument not available to downstream systems

## Acceptance Criteria

- [ ] Runbook covers all six stages (Email, JBPM, Autoclose, Database, Confirm, Email)
- [ ] Step numbers are sequential and unambiguous
- [ ] All dropdown selections show exact text to select (not just "choose option")
- [ ] Error messages and their meanings explained
- [ ] Data extraction fields match JBPM portal exactly
- [ ] Provider fallback sequence documented (REFINITIV ��� BLOOMBERG → DATALICENSE)
- [ ] Troubleshooting section addresses top 5 operator questions
- [ ] Checklists provided for each stage
- [ ] Example workflow with real ISIN walkthrough included

## Evidence

- Source document: "Tareas e incidencias comunes.docx" — Complete "Alta Equities" section with all four stages

## Traceability

- Implements: PROD-SETUP-001
- Uses: DOM-KYUW-003, FEAT-AUTOCLOSE-001
- Work support: WRK-TASK-001, WRK-TASK-002

