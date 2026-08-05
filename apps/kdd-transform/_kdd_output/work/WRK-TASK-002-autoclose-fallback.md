---
id: WRK-TASK-002
type: spec
layer: work-task
status: draft
confidence: high
version: 0.1.0
created: 2026-07-08
updated: 2026-07-08
owner: to-be-assigned
dependencies:
  - id: FEAT-AUTOCLOSE-001
    relation: activates
  - id: DOM-KYUW-003
    relation: constrained-by
  - id: DOM-KYUW-004
    relation: constrained-by
tags:
  - autoclose
  - provider-fallback
  - formula-testing
---

# Autoclose Provider Fallback Logic

## Objective

Configure market data provider connections (with automatic fallback) to capture instrument prices at market close, handling both equities (REFINITIV → BLOOMBERG fallback) and futures (BLOOMBERG only).

## Scope

- **Input**: Extracted equity or futures data fields (from WRK-TASK-001 or PROD-SETUP-002 Stage 2)
- **Output**: Autoclose rule saved and active for daily price capture
- **Time Box**: 5-15 minutes per instrument (includes formula test wait time)
- **Asset Classes**: EQUITY and FUTURE
- **Error Handling**: If all providers fail, escalate to data provider team with tagged user

## Implementation Notes

### Prerequisite

1. Data extraction complete (7 fields for equities, 4 fields for futures)
2. Murex Label suffix analyzed: INDEX_PRICE vs EQUITY_PRICE category (equities only)
3. Category determined for Autoclose Instruments filter (CLOSE_FO_MADRID snapshot)

### Equity Instruments: Three-Provider Fallback Sequence

#### Provider 1: REFINITIV

1. **Navigate**: Typhoon web → Closing Process → Autoclose Instruments
2. **Filter Setup**:
   - Snapshot: CLOSE_FO_MADRID
   - Category: INDEX_PRICE (if label ends IN/IND) or EQUITY_PRICE (otherwise)
   - Display button
   - Enable "Show all instruments" checkbox
   - Filter field: Paste Murex Label → Enter
3. **Find Instrument**:
   - If instrument found in results: Click edit icon (pencil)
   - If NOT found:
     - Strip last character from Murex Label and retry
     - Continue stripping until finding similar label with same Market and non-empty Provider/Resource
     - Click edit on closest match
4. **Configure REFINITIV**:
   - Provider dropdown: Select "REFINITIV"
   - Rule dropdown: Select "CLOSE_LAST_PREVIOUSCLOSE"
   - Formula field: Enter "[Reuters RIC]" (e.g., "[0069.HK]")
   - **Test Formula** button: Click and wait (typical: 3-10 seconds)
5. **Evaluate Result**:
   - **Success Path** (numeric price returned):
     - Compare returned price ≈ Reference Price (within 10-20%)
     - If reasonable: Click **Save** button → **SUCCESS** ✓
     - Autoclose configured; move to Stage 4 (Database Registration)
   - **Failure Path** (error returned, e.g., "Not valid instruments"):
     - Record error message
     - **Proceed to Provider 2 (BLOOMBERG)**

#### Provider 2: BLOOMBERG (Equity Fallback)

1. **Reopen Edit Modal**: Return to Autoclose Instruments, find same row, click edit (pencil)
2. **Configure BLOOMBERG**:
   - Provider dropdown: Select "BLOOMBERG"
   - Rule dropdown: Select "CLOSE_LAST_MID"
   - Formula field: Enter "[Bloomberg ID]" (e.g., "[UCG IM Equity]")
   - **Test Formula** button: Click and wait (typical: 3-10 seconds)
3. **Evaluate Result**:
   - **Success Path** (numeric price returned):
     - **Provider Field Update**: Change to "DATALICENSE"
     - Click **Save** button → **SUCCESS** ✓
     - Autoclose configured; move to Stage 4
   - **Failure Path** (error returned):
     - Record error message
     - **Proceed to Provider 3 or Escalation**

#### Provider 3: DATALICENSE (Last Resort)

1. **If BLOOMBERG also failed**:
   - Operator may attempt DATALICENSE configuration (if supported)
   - Or **Escalate** (see Failure Case below)
2. **Record Failure**:
   - Note all three providers failed
   - Document error messages from each provider
   - Prepare escalation email

### Futures Instruments: BLOOMBERG Only (No Fallback)

1. **Navigate**: Typhoon web → Closing Process → Autoclose Instruments
2. **Filter Setup**:
   - Snapshot: CLOSE_FO_MADRID
   - Category: Search for keyword "FUTURE" (e.g., INDEX_FUTURE, EQUITY_FUTURE)
   - Display button
   - Enable "Show all instruments" checkbox
   - Filter field: Paste MUREX Label → Enter
3. **Find Instruments**:
   - Multiple maturity variants may appear (e.g., June, July, August expiry)
   - For each row with non-null MATURITY or MATURITY DATE: Click edit (pencil)
4. **Configure BLOOMBERG** (Only Provider for Futures):
   - Provider dropdown: Select "BLOOMBERG"
   - Rule dropdown: Select "CLOSE_LAST_MID"
   - Formula field: Enter "[BBG CODE]" (e.g., "[MOV26 Comdty]")
   - **Test Formula** button: Click and wait
5. **Evaluate Result**:
   - **Success Path** (numeric price returned):
     - Click **Save** button → **SUCCESS** ✓
   - **Failure Path** (error returned):
     - Do NOT attempt REFINITIV (only BLOOMBERG for futures)
     - Record error and **Escalate** immediately

### Decision Tree

```
Start: Instrument data extracted
   ↓
Asset class: EQUITY or FUTURE?
   ├─ EQUITY:
   │   ├─ Try REFINITIV ([Reuters RIC], rule CLOSE_LAST_PREVIOUSCLOSE)
   │   │   ├─ Success? → Save & DONE ✓
   │   │   └─ Error? → Continue
   │   ├─ Try BLOOMBERG ([Bloomberg ID], rule CLOSE_LAST_MID)
   │   │   ├─ Success? → Set Provider=DATALICENSE, Save & DONE ✓
   │   │   └─ Error? → Continue
   │   └─ All failed → Escalate
   └─ FUTURE:
       ├─ Try BLOOMBERG only ([BBG CODE], rule CLOSE_LAST_MID)
       │   ├─ Success? → Save & DONE ✓
       │   └─ Error? → Escalate (no fallback)
```

### Failure Case & Escalation

**When to Escalate**:
- Equities: All three providers (REFINITIV, BLOOMBERG, DATALICENSE) return errors
- Futures: BLOOMBERG returns error (single provider)

**Escalation Process**:
1. Tag user in email reply: "+EMMANUEL BENISTY"
2. Message template:
   ```
   El ticker proporcionado no nos devuelve precio. 
   +EMMANUEL BENISTY , lo puedes revisar por favor?
   ```
3. Include:
   - Instrument identifier (ISIN for equities, MUREX Label for futures)
   - All error messages from each provider attempt
   - Reuters RIC / Bloomberg ID / BBG CODE used in formulas
4. Proceed to Stage 4 (Database Registration) even with failed autoclose
   - Instrument can be registered in Ans
   - Operator communicates failure to downstream systems
5. Return to autoclose configuration after data provider resolves issue

### Autoclose Configuration Checklist (Equity)

- [ ] Equity type confirmed (not FUTURE or OPTION)
- [ ] Category selected (INDEX_PRICE or EQUITY_PRICE based on Murex Label suffix)
- [ ] Instrument found in Autoclose Instruments list (or partial match used)
- [ ] REFINITIV provider tested with correct Reuters RIC format
- [ ] If REFINITIV fails: BLOOMBERG provider tested with correct Bloomberg ID format
- [ ] If BLOOMBERG succeeds: Provider field set to DATALICENSE before Save
- [ ] Formula test returned numeric price (not error)
- [ ] Returned price validated against Reference Price (reasonable range)
- [ ] Save button clicked; confirmation received
- [ ] Autoclose status verified (rule active)

### Autoclose Configuration Checklist (Futures)

- [ ] Futures type confirmed (from JBPM Type field)
- [ ] Category filter includes "FUTURE" keyword
- [ ] Instrument found in results (possibly multiple maturity rows)
- [ ] For each row: BLOOMBERG provider selected (no alternative)
- [ ] BBG CODE formula correct format (includes "Comdty" suffix if applicable)
- [ ] Formula test returned numeric price (not error)
- [ ] Save button clicked; confirmation received
- [ ] All maturity variants configured independently
- [ ] Autoclose status verified (rule active)

### Example Walkthrough (Equity)

**Instrument**: IBEX35 Index
- ISIN: ES0SI0000005
- Murex Label: IBEX35IN
- Reuters RIC: .IBEX
- Bloomberg ID: IBEX ID
- Reference Price: 9400

**Execution**:
1. Category: INDEX_PRICE (label ends IN)
2. Find: IBEX35IN in Autoclose Instruments → Edit
3. Provider 1 (REFINITIV):
   - Formula: [.IBEX]
   - Test: Returns 9523 (≈ 9400 Reference Price) ✓
   - Save → **SUCCESS** ✓

**Result**: Autoclose active; IBEX35 will capture close price daily

### Example Walkthrough (Futures - Failed)

**Instrument**: CO2 Futures
- MUREX Label: CO2F26
- BBG CODE: CO2F26 Comdty
- Category: COMMODITY_FUTURE

**Execution**:
1. Find: CO2F26 in Autoclose Instruments → Edit
2. Provider (BLOOMBERG only):
   - Formula: [CO2F26 Comdty]
   - Test: Returns error "Not valid instruments"
3. No REFINITIV fallback for futures
4. Escalate: "+EMMANUEL BENISTY , lo puedes revisar por favor?"

**Result**: Autoclose not configured; waiting for data provider investigation

## Acceptance Criteria

- [ ] REFINITIV provider tested first for equities (CLOSE_LAST_PREVIOUSCLOSE rule)
- [ ] BLOOMBERG provider tested second if REFINITIV fails (CLOSE_LAST_MID rule)
- [ ] DATALICENSE provider noted/configured on BLOOMBERG success (equities only)
- [ ] No fallback for futures (BLOOMBERG only, no REFINITIV attempt)
- [ ] Formula syntax validated (non-empty, contains brackets)
- [ ] Test formula connects to live provider and returns price or explicit error
- [ ] Price result compared to Reference Price (within reasonable range)
- [ ] Save persists autoclose rule without UI errors
- [ ] All three providers failed → User tagged in escalation email
- [ ] Autoclose failure does not block subsequent stages (Database Registration, Confirmation)
- [ ] Multiple maturity variants (futures) each configured independently

## Test Plan

1. **Happy Path (Equity, REFINITIV Success)**: All fields correct, REFINITIV returns price ≈ Reference Price → Save succeeds
2. **Fallback Path (Equity, REFINITIV Fails, BLOOMBERG Succeeds)**: REFINITIV error, BLOOMBERG returns price → Set DATALICENSE, Save succeeds
3. **Multiple Variants (Futures)**: Three maturity variants with same MUREX Label → Each row configured independently
4. **Escalation (All Fail)**: All providers return errors → User tagged, escalation email sent
5. **Partial Label Match**: Exact Murex Label not found → Partial search returns alternative with same Market, configure succeeds

## Related Work

- **Before this task**: WRK-TASK-001 (Equity data extraction) or PROD-SETUP-002 Stage 2 (Futures data extraction)
- **After this task**: PROD-SETUP-001 Stage 4 (Database Registration for equities) or PROD-SETUP-002 Stage 4 (Optional sync for futures)
- **Reference**: DOC-KYUW-002 Part 3 (Equity autoclose steps), DOC-KYUW-003 Part 3 (Futures autoclose steps)

## Traceability

- Implements: FEAT-AUTOCLOSE-001
- Constrained by: DOM-KYUW-003 (equity rules), DOM-KYUW-004 (futures rules)
- Operationalized by: DOC-KYUW-002, DOC-KYUW-003
- Part of: PROD-SETUP-001 (Stage 3), PROD-SETUP-002 (Stage 3)

