---
id: WRK-TASK-001
type: spec
layer: work-task
status: draft
confidence: high
version: 0.1.0
created: 2026-07-08
updated: 2026-07-08
owner: to-be-assigned
dependencies:
  - id: PROD-SETUP-001
    relation: activates
  - id: DOC-KYUW-002
    relation: implements
tags:
  - equity
  - data-extraction
  - jbpm
---

# Equity Instrument Data Extraction

## Objective

Extract all required data fields from a JBPM equity instrument setup request to enable subsequent autoclose configuration and database registration stages.

## Scope

- **Input**: JBPM request portal (email link received from Securities & Reference Data team)
- **Output**: Seven data fields validated and ready for autoclose configuration (Stage 3)
- **Time Box**: 5-10 minutes per request (typical)
- **Error Handling**: If ISIN not found or data incomplete, escalate to Securities & Reference Data with specific gap

## Implementation Notes

### Prerequisite

1. Email received with title format: "INFO:EQUITY - SETUP DONE BY SECURITIES & REFERENCE DATA (ISIN: [ISIN_CODE])"
2. Extract ISIN from email title (e.g., "CA29446Y5020")
3. Click email link to access JBPM portal

### Data Extraction Procedure

**Field 1: ISIN**
- Source: Email title or JBPM request header
- Validation: Non-null, alphanumeric, 12 characters typical
- Storage: Copy to extraction form/checklist
- Example: "CA29446Y5020"

**Field 2: Market**
- Source: JBPM request → MUREX/4SIGHT Data tab
- Validation: Non-null, geographic or exchange identifier
- Storage: Copy exactly as shown
- Example: "MADRID", "HONG_KONG", "XETRA"

**Field 3: Murex Label**
- Source: JBPM request → MUREX/4SIGHT Data tab → Field "Murex Instrument Label"
- **IMPORTANT**: Do NOT copy from other fields labeled "Murex Label" or "Instrument Label"; use only "Murex Instrument Label"
- Validation: Non-null, contains instrument identifier and suffix
- Storage: Copy exactly (case-sensitive)
- Example: "IBEX35IN", "AACDE", "UNICR"
- Suffix check for later: Does it end with "IN" or "IND"? (determines INDEX_PRICE vs EQUITY_PRICE)

**Field 4: Currency**
- Source: JBPM request → MUREX/4SIGHT Data tab
- Validation: Non-null, 3-letter currency code
- Storage: Copy exactly
- Example: "EUR", "USD", "CNY", "GBP"

**Field 5: Reference Price**
- Source: JBPM request → MUREX/4SIGHT Data tab
- Validation: Numeric value; not used in autoclose rule but validates formula result reasonableness
- Storage: Copy as number
- Example: "9400", "45.20", "35.80"
- Note: This field is informational; formula test will return current/last price (may differ from Reference Price)

**Field 6: Reuters RIC**
- Source: JBPM request → MUREX/4SIGHT Data tab
- Validation: Non-null for REFINITIV provider; format varies (e.g., ".IBEX", "AAC.DE", "UNICREDIT.MI")
- Storage: Copy exactly as shown (case-sensitive, includes dots)
- Example: ".IBEX", "0069.HK", "UNICREDIT.MI"
- Purpose: Used as REFINITIV formula input in Stage 3

**Field 7: Bloomberg ID**
- Source: JBPM request → MUREX/4SIGHT Data tab
- Validation: Non-null for BLOOMBERG provider; format varies (e.g., "IBEX ID", "UCG IM Equity")
- Storage: Copy exactly as shown
- Example: "IBEX ID", "UCG IM Equity", "CDAX ID"
- Purpose: Used as BLOOMBERG formula input in Stage 3 (fallback if REFINITIV fails)

### Search Procedure (If ISIN Not Visible in Portal)

1. In JBPM portal "Find By.." field, paste ISIN
2. Press Enter
3. Wait for search results
4. If no results appear:
   - Hover mouse to right of "Find By.." field
   - Click "Search Securities" option that appears
   - Modal opens: "Search Securities"
   - Click another "Search Securities" option (left side, above "Clear Filters" button)
   - Dropdown menu appears
   - Click in "ISIN" field and paste ISIN
   - Click "Search" button
   - Wait for results
   - Click "BPM ID" value in results
   - JBPM request opens

### Data Extraction Checklist

- [ ] ISIN extracted from email title and verified non-null
- [ ] JBPM portal accessible via email link
- [ ] Market field located in MUREX/4SIGHT Data tab and copied
- [ ] Murex Instrument Label field identified (NOT other "Murex" fields) and copied
- [ ] Currency field located and copied (3-letter code)
- [ ] Reference Price field located and copied (numeric)
- [ ] Reuters RIC field located and copied (REFINITIV format)
- [ ] Bloomberg ID field located and copied (Bloomberg format)
- [ ] All seven fields non-null and reasonable format
- [ ] Data ready for Stage 3 (Autoclose Configuration)

### Failure Cases & Escalation

**ISIN Not Found in Portal**
- Action: Use "Search Securities" alternate workflow (see above)
- If still not found: Escalate to Securities & Reference Data with ISIN and request details

**Any Field Null or Unreadable**
- Action: Document which field is missing
- Action: Escalate to Securities & Reference Data with ISIN and missing field name
- Example: "ISIN CA29446Y5020 — Bloomberg ID field is empty"

**Murex Label Not in 'Murex Instrument Label' Field**
- Action: Search for field labeled "Murex Instrument Label" specifically
- Common error: Using "Instrument Label" or "Label" fields (different content)
- If incorrect label used in formula test, error will be "Not valid instruments"

### Example Walkthrough

**Email Title**: "INFO:EQUITY - SETUP DONE BY SECURITIES & REFERENCE DATA (ISIN: CA29446Y5020)"

| Field | Value | Source |
|-------|-------|--------|
| ISIN | CA29446Y5020 | Email title |
| Market | MADRID | JBPM MUREX/4SIGHT Data tab |
| Murex Label | CANDIANS | JBPM field "Murex Instrument Label" |
| Currency | CAD | JBPM MUREX/4SIGHT Data tab |
| Reference Price | 156.75 | JBPM MUREX/4SIGHT Data tab |
| Reuters RIC | CADAS.TO | JBPM MUREX/4SIGHT Data tab |
| Bloomberg ID | CADAS CN Equity | JBPM MUREX/4SIGHT Data tab |

**Status**: ✓ Ready for Stage 3 (Autoclose Configuration)

## Acceptance Criteria

- [ ] All seven data fields successfully extracted from JBPM request
- [ ] ISIN matches email title and JBPM request (consistency check)
- [ ] Murex Label extracted from correct source ("Murex Instrument Label" field, not others)
- [ ] All fields are non-null and reasonable format
- [ ] Reference Price is numeric (may be float or integer)
- [ ] Reuters RIC and Bloomberg ID match expected provider formats
- [ ] Data extraction completed within 10 minutes
- [ ] Extraction logged for audit trail
- [ ] Data passed to Stage 3 handler without rework

## Test Plan

1. **Happy Path**: Complete equity request with all fields populated → Extract all 7 fields, proceed to Stage 3
2. **Alternate Search**: ISIN not in "Find By.." results → Use "Search Securities" workflow, extract all fields
3. **Escalation**: ISIN not found even in "Search Securities" → Escalate with error details
4. **Missing Field**: Bloomberg ID null → Escalate; note that REFINITIV fallback will be tested in Stage 3

## Related Work

- **Before this task**: WRK-SPEC-001 (Triage confirms EQUITY type)
- **After this task**: WRK-TASK-002 (Autoclose Configuration with extracted data)
- **Reference**: DOC-KYUW-002 (Equity SOP with detailed screenshots)

## Traceability

- Implements: PROD-SETUP-001 (Stage 2)
- Documented in: DOC-KYUW-002 (Part 2: Data Extraction)
- Feeds into: WRK-TASK-002 (Stage 3: Autoclose Configuration)

