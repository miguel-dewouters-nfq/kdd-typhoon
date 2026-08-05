---
id: DOC-KYUW-003
type: spec
layer: documentation
status: draft
confidence: high
version: 0.1.0
created: 2026-07-08
updated: 2026-07-08
owner: to-be-assigned
dependencies:
  - id: PROD-SETUP-002
    relation: implements
tags:
  - sop
  - futures
  - options
  - runbook
---

# Futures & Options Setup Standard Operating Procedure

## Intent

Provide operations teams with a clear runbook for derivatives (futures and options) instrument setup in Typhoon, emphasizing type-based routing and simplified configuration compared to equities.

## Definition

### Purpose

Audience: Operations operators handling futures and options setup requests
Scope: Covers type routing decision (OPTIONS → archive; FUTURES → setup workflow) and simplified autoclose configuration
Outcome: Operator can independently route and setup derivatives without supervisor guidance

### Audience

- All operations staff (receives both equity and derivatives requests)
- Secondary: Compliance (for options archive/audit trail)
- Training: Orientation on derivatives vs. equities workflow differences

### Content Overview

**Part 1: Email & Type Identification**
- Email notification structure for derivatives requests
- Email title format: "INFO:FUTURE AND OPTIONS - SETUP DONE BY SEC & REF DATA: [DESCRIPTION]"
- Accessing JBPM portal via email link
- **Critical First Step**: Identify Type of Instrument field
  - If Type = "OPTION" → Proceed to Part 5 (Archive & Exit)
  - If Type = "FUTURE" → Proceed to Part 2 (Setup Workflow)

**Part 2: Data Extraction (FUTURES only)**
- Extract four data fields from JBPM request:
  - MUREX Label
  - BBG CODE (e.g., "MOV26 Comdty", "GCV26 Comdty")
  - MATURITY (discrete indicator, e.g., "26", "M26")
  - MATURITY DATE (calendar date, e.g., "2026-08-28")
- Validation: At least one of MATURITY or MATURITY DATE must be non-null
- Note: Difference from Equity setup (no Reuters RIC, no Bloomberg ID variants)

**Part 3: Autoclose Configuration (FUTURES only)**
- Navigate to Closing Process → Autoclose Instruments
- Snapshot selection: CLOSE_FO_MADRID (same as equities)
- **Category Selection** (Different from Equities):
  - Search for category containing keyword "FUTURE"
  - Valid examples: INDEX_FUTURE, EQUITY_FUTURE, COMMODITY_FUTURE
  - Invalid: EQUITY_PRICE, INDEX_PRICE (equity categories)
- Display and filter workflow
- "Show all instruments" checkbox toggle
- Filter by MUREX Label
- **Multiple Maturity Results**: If filtering returns multiple rows (different expiration dates):
  - Configure autoclose for EACH row separately
  - Repeat steps 5-10 for each matching row
- Edit icon (pencil) to open autoclose rule editor
- **BLOOMBERG Provider Configuration** (No Fallback for Futures):
  - Provider: BLOOMBERG (only option; no REFINITIV for derivatives)
  - Rule: CLOSE_LAST_MID (standard mid-market price)
  - Formula syntax: "[BBG CODE]" with examples:
    - MOV26 Comdty → [MOV26 Comdty]
    - GCV26 Comdty → [GCV26 Comdty]
  - Test formula button
  - Expected output: Price number (e.g., €68.50)
  - Save button
- **Error Case** (if BLOOMBERG returns "Not valid instruments"):
  - Do NOT attempt fallback to REFINITIV (futures use BLOOMBERG only)
  - Document error message
  - Proceed to Part 4 (Email Response - Error Case)

**Part 4: Optional Synchronization (FUTURES only, conditional)**
- Check email body: Does request mention "sync" or "synchronize"?
- If Yes:
  - Navigate to Mx3 → Mx3 Management → Synchronize
  - Snapshot: Select as specified in email (typically CLOSE_IPV)
  - Filter categories: BASKET_VOLATILITY, INDEX_VOLATILITY, EQUITY_VOLATILITY, REPO_MARGIN
  - For each category:
    - Filter → Synchronize today → Confirm
    - Monitor status until PROCESSING → Completed
- If No: Skip synchronization

**Part 5a: OPTION Request Handling**
- Upon discovering Type = "OPTION":
  - Proceed to JBPM request
  - Mark as archived or complete without setup
  - Log: "OPTIONS instruments do not require setup in Typhoon"
  - Skip Parts 2, 3, 4

**Part 5b: FUTURES Request Confirmation**
- Return to JBPM portal
- Click "Setup done" button (lower right)

**Part 6: Email Response**
- **Success Case** (FUTURES with autoclose configured):
  ```
  Buenas,
  Instrumento configurado en Typhoon.
  [Optional: Volatility and repo synchronization initiated if applicable]
  Saludos
  ```
- **Autoclose Error Case** (Formula fails):
  ```
  El ticker proporcionado no nos devuelve precio. 
  +EMMANUEL BENISTY , lo puedes revisar por favor?
  ```

### Key Differences from Equity Setup

| Aspect | Equity (DOC-KYUW-002) | Futures (This Doc) |
|--------|----------------------|-------------------|
| Database Registration (Ans) | Yes (4-step process) | No |
| Provider Fallback | REFINITIV → BLOOMBERG → DATALICENSE | BLOOMBERG only |
| Category Rules | Based on label suffix (IN/IND) | Based on category keyword (FUTURE) |
| Multiple Maturity | Not applicable | Each variant configured separately |
| Optional Sync | Not typical | Conditional on email request |

### Additional Sections

**Troubleshooting**
- "Type of Instrument field is missing/unclear" → Check JBPM request details tab
- "MUREX Label not found in Autoclose" → Verify category filter includes "FUTURE" keyword
- "Formula test returns 'Not valid instruments'" → Check BBG CODE format (should include "Comdty" suffix)
- "Multiple rows with same MUREX Label" → Configure each row independently

**Decision Tree**
```
Email received
    ↓
Access JBPM portal
    ↓
Check Type of Instrument field
    ├─ Type = OPTION? → Archive, send "no setup required" message, STOP
    └─ Type = FUTURE? → Continue to autoclose setup
         ↓
    Extract: MUREX Label, BBG CODE, MATURITY, MATURITY_DATE
         ↓
    Configure autoclose (BLOOMBERG only)
         ↓
    [Optional] Synchronize volatility/repo if requested
         ↓
    Mark "Setup done" in JBPM
         ↓
    Send email confirmation (success or error)
```

**Checklists**
- Pre-setup: Type of Instrument verified (FUTURE or OPTION)
- Pre-autoclose: All data fields extracted (MUREX Label, BBG CODE, MATURITY/DATE)
- Post-autoclose: Formula test successful and price returned (not error)
- Post-confirm: JBPM request marked "Setup done"
- Pre-email: Type-specific response selected (OPTION archive vs FUTURE success/error)

**Common Pitfalls**
- Attempting REFINITIV provider for futures → Will fail; use BLOOMBERG only
- Forgetting to check "Show all instruments" → Instrument invisible in filter
- Configuring only first maturity variant → Other expirations not in autoclose
- Copying BBG CODE incorrectly (missing "Comdty" suffix) → Formula test fails
- Treating OPTION as FUTURE → Unnecessary database registration attempted

## Acceptance Criteria

- [ ] Runbook clearly distinguishes OPTION (archive) vs FUTURE (setup) paths
- [ ] Type identification step placed before any configuration work
- [ ] BLOOMBERG provider emphasized as only option for futures (no REFINITIV fallback)
- [ ] Multiple maturity handling documented with examples
- [ ] Optional synchronization section conditional on email content
- [ ] All UI steps include exact text to select (dropdowns, buttons)
- [ ] Error messages explained with actionable troubleshooting
- [ ] Decision tree provided for quick reference
- [ ] Comparison table vs equity setup highlights key differences
- [ ] Common pitfalls section addresses top 5 operator mistakes

## Evidence

- Source document: "Tareas e incidencias comunes.docx" — "Alta futuros y opciones" section with type routing and setup workflow

## Traceability

- Implements: PROD-SETUP-002
- Uses: DOM-KYUW-004, FEAT-AUTOCLOSE-001
- Work support: WRK-TASK-002

