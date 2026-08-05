---
id: FEAT-AUTOCLOSE-001
type: spec
layer: feature
status: draft
confidence: high
version: 0.1.0
created: 2026-07-08
updated: 2026-07-08
owner: to-be-assigned
dependencies:
  - id: DOM-KYUW-003
    relation: uses-data-from
  - id: DOM-KYUW-004
    relation: uses-data-from
tags:
  - pricing
  - market-data
  - closing-process
---

# Provider-Rule-Formula Engine for Autoclose

## Intent

Define the functional interface for configuring market data provider connections that automatically capture instrument prices at market close.

## Definition

### Purpose

Allow operators to define pricing rules by selecting:
1. **Data Provider**: Which market data vendor supplies the price (REFINITIV, BLOOMBERG, DATALICENSE)
2. **Pricing Rule**: Which price to use (CLOSE_LAST_PREVIOUSCLOSE, CLOSE_LAST_MID, etc.)
3. **Lookup Formula**: How to find the instrument in the provider's database (typically instrument identifier in square brackets)

System tests the formula against live market data, validates the returned price, and saves the rule.

### Inputs

- **Snapshot**: Target closing process snapshot (CLOSE_FO_MADRID, CLOSE_IPV, etc.)
- **Category**: Instrument type category (INDEX_PRICE, EQUITY_PRICE, COMMODITY_FUTURE, etc.)
- **Murex Label or BBG Code**: Instrument identifier to search
- **Provider**: "REFINITIV" | "BLOOMBERG" | "DATALICENSE"
- **Rule**: "CLOSE_LAST_PREVIOUSCLOSE" | "CLOSE_LAST_MID" | [others]
- **Formula**: String with instrument code in square brackets (e.g., "[0069.HK]", "[UCG IM Equity]", "[MOV26 Comdty]")

### Behavior

#### Configuration Workflow

1. **UI Form**: Operator selects Provider, Rule, and enters Formula
2. **Validation**: System verifies:
   - Provider exists and is accessible
   - Rule is applicable to selected Provider
   - Formula syntax is well-formed (non-empty, contains brackets)
3. **Test**: Operator clicks "Test formula"
4. **Market Lookup**: System:
   - Extracts instrument code from formula (content between brackets)
   - Connects to Provider API
   - Queries for current or latest close price
5. **Result Display**:
   - **Success**: Shows returned price (numeric value) to operator
   - **Error**: Shows error message (e.g., "Not valid instruments", "Provider unavailable")
6. **Operator Decision**:
   - If success + price seems valid (≈ Reference Price) → Clicks "Save"
   - If error or suspicious value → Tries alternative provider or investigates formula

#### Provider Fallback Logic (Equities Only)

For equity instruments, if Provider 1 fails:

1. **Try Provider 1 - REFINITIV**:
   - Rule: CLOSE_LAST_PREVIOUSCLOSE
   - Formula: [Reuters RIC]
   - Result: Price or "Not valid instruments" error
2. **If Error → Try Provider 2 - BLOOMBERG**:
   - Rule: CLOSE_LAST_MID
   - Formula: [Bloomberg ID]
   - Result: Price or "Not valid instruments" error
3. **If Error → Try Provider 3 - DATALICENSE**:
   - Set previous Provider to DATALICENSE (after BLOOMBERG succeeds)
   - Rule: [depends on DATALICENSE rules]
   - Formula: [depends on DATALICENSE format]
   - Result: Price or final error

**Note**: For futures, only BLOOMBERG is used; no fallback.

#### Save & Persistence

1. On successful test, operator clicks "Save"
2. System persists configuration:
   - Links Provider + Rule + Formula to Snapshot + Category + Instrument
   - Stores in Autoclose configuration registry
   - System begins capturing prices at next market close
3. Future price captures use saved formula automatically

### Outputs

- **Configured Rule**: Persisted association of (Provider, Rule, Formula) → (Snapshot, Category, Instrument)
- **Status Indicator**: Visual confirmation that autoclose is active for this instrument
- **Error Log**: Failed formula tests logged for audit and operator reference

### Edge Cases

1. **Multiple Maturity Variants**: Same MUREX Label may match multiple rows (e.g., futures with different expiration dates). Each row requires separate configuration. Operator must configure all matching rows.
2. **Partial Failure**: Autoclose failure does NOT block other setup stages (database registration, confirmation). Operator can return and retry autoclose.
3. **Provider Downtime**: If Provider is temporarily unavailable, "Test formula" returns specific error. Operator can retry later.
4. **Formula Syntax**: Must be exact; typos in instrument code (e.g., "[0069.HK" without closing bracket) cause validation failure.

## Acceptance Criteria

- [ ] Provider dropdown lists exactly three options: REFINITIV, BLOOMBERG, DATALICENSE
- [ ] Rule dropdown populated based on selected Provider; invalid combinations disabled
- [ ] Formula field accepts free-form text; system validates bracket syntax only
- [ ] "Test formula" button connects to live Provider API and returns price or error
- [ ] Returned price displayed to operator with sufficient precision
- [ ] "Save" button only enabled after successful test (disabled for error results)
- [ ] Saved configuration persists across session and instrument access
- [ ] Autoclose captures price automatically at scheduled close time
- [ ] Failed REFINITIV fallback to BLOOMBERG triggered automatically (not manual retry)
- [ ] Error messages are specific and actionable (not generic "failure")
- [ ] Multiple maturity variants handled independently (no cross-contamination)

## Evidence

- Source document: "Tareas e incidencias comunes.docx" — Provider/Rule/Formula configuration section for equities
- Source document: "Tareas e incidencias comunes.docx" — BLOOMBERG fallback when REFINITIV fails with "Not valid instruments"
- Source document: "Tareas e incidencias comunes.docx" — BBG CODE formula format for futures "[MOV26 Comdty]"

## Traceability

- Used by: PROD-SETUP-001, PROD-SETUP-002
- Constrained by: DOM-KYUW-003, DOM-KYUW-004
- Operationalized by: WRK-TASK-002
- Documented in: DOC-KYUW-002, DOC-KYUW-003

