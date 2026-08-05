---
id: FEAT-SYNC-002
type: spec
layer: feature
status: draft
confidence: medium
version: 0.1.0
created: 2026-07-08
updated: 2026-07-08
owner: to-be-assigned
dependencies:
  - id: DOM-KYUW-005
    relation: uses-data-from
tags:
  - market-curves
  - synchronization
  - totem
  - historical-data
---

# IPV TOTEM Synchronization with Date Range

## Intent

Define the feature for historical market curve synchronization into the TOTEM system with explicit date parameters and end-of-month data capture.

## Definition

### Purpose

Capture historical volatility, repo, and other market curve data at month-end for regulatory reporting, valuation reconciliation, and historical curve reconstruction. Support re-synchronization of past months without data corruption.

### Inputs

- **Snapshot**: "IPV_TOTEM" (fixed for this feature)
- **Categories**: Multi-select list (same as FEAT-SYNC-001):
  - BASKET_SMILE
  - BASKET_VOLATILITY
  - INDEX_SMILE
  - INDEX_VOLATILITY
  - EQUITY_SMILE
  - EQUITY_VOLATILITY
  - REPO_MARGIN
- **Pasta Date**: Date parameter (format YYYY-MM-DD), always last calendar day of prior month (may be non-workday)
  - Example: For July synchronization, Pasta Date = 2026-06-30
- **Date Range**: Two date fields (Start, End), both equal to Pasta Date
  - Example: 2026-06-30 to 2026-06-30

### Behavior

#### UI Navigation - Mx3 Synchronization

1. Operator navigates to: Typhoon web → Mx3 → Mx3 Management → Synchronize
2. Snapshot selector: Choose "IPV_TOTEM"
3. Category filter and synchronization (same as FEAT-SYNC-001 workflow):
   - Filter by category name
   - Click "Synchronize today" button
4. **Modal Dialog** (IPV TOTEM variant):
   - **Pasta Date checkbox**: Operator checks "Pasta Date" checkbox
   - **Date Input**: In date field, enters last day of prior month (e.g., "2026-06-30")
   - **Synchronize button**: Clicks "Synchronize" to submit
   - System initiates background job for historical data capture
5. **Status Monitoring**:
   - Returns to Synchronize view
   - Category status: PROCESSING (same as FEAT-SYNC-001)
   - Operator clicks "Refresh" periodically

#### UI Navigation - Ans Monitor (Status Verification)

1. Operator navigates to: Typhoon web → Ans → Monitor
2. Snapshot selector: Choose "IPV_TOTEM"
3. Category selector: Choose "*" (all categories)
4. **Date Range Field**:
   - Start Date: Pasta Date (e.g., 2026-06-30)
   - End Date: Pasta Date (e.g., 2026-06-30)
5. **Display**: Operator clicks "Display" button
6. Filter categories (optional):
   - Enters category name in Filter field (same as Synchronize workflow)
7. **Status Polling**:
   - Views Status column for each category
   - Initial: PROCESSING
   - Operator clicks "Display" every few minutes to refresh
   - Final: OK or ERROR

#### Workflow Timeline

- **T=0**: Operator initiates sync via Mx3 Management → Synchronize with Pasta Date
- **T=0+10s**: Status shows PROCESSING in Synchronize view
- **T=0+1m**: Operator navigates to Ans → Monitor with date range 2026-06-30 to 2026-06-30
- **T=0+2m**: Category status still PROCESSING; operator clicks "Display" to refresh
- **T=0+5m**: Status updates to OK in Monitor view
- **T=0+5m30s**: Operator proceeds to complete workflow or start next category

### Outputs

- **Historical Snapshot**: Market curve data captured for exact date (Pasta Date)
- **Status Record**: Timestamp and status (OK/ERROR) in Monitor view
- **Audit Trail**: Both Synchronize and Monitor views show records for recovery/validation

### Constraints

1. **Pasta Date Format**: Must be valid calendar date; always last day of month
   - Invalid dates (e.g., 2026-02-30) cause error
2. **Date Range Symmetry**: Start and End must both equal Pasta Date
   - Asymmetric ranges (e.g., 2026-06-01 to 2026-06-30) cause error
3. **Re-sync Safety**: Synchronizing same Pasta Date multiple times overwrites previous data
   - Operator must be intentional about re-runs
4. **Categories Must Match**: Categories synchronized via Synchronize must match categories queried in Monitor
   - Mismatch causes confusion in status verification

### Relationship to FEAT-SYNC-001

| Aspect | FEAT-SYNC-001 (CLOSE_IPV) | FEAT-SYNC-002 (IPV TOTEM) |
|--------|--------------------------|--------------------------|
| Snapshot | CLOSE_IPV | IPV_TOTEM |
| Date Parameter | None (current date implicit) | Explicit Pasta Date |
| Use Case | Daily refresh | Month-end historical capture |
| Status View | Mx3 Management → Synchronize only | Mx3 + Ans Monitor (dual verification) |
| Pasta Date Checkbox | Not present | Required |

## Acceptance Criteria

- [ ] Snapshot selector restricted to "IPV_TOTEM" in modal (or only IPV_TOTEM available)
- [ ] Pasta Date checkbox appears only for IPV_TOTEM snapshot
- [ ] Date input validates format (YYYY-MM-DD) and rejects invalid dates
- [ ] Date Range start/end both set to Pasta Date value
- [ ] Synchronization initiated and shows PROCESSING status
- [ ] Ans → Monitor displays same category statuses as Mx3 synchronization
- [ ] Date range filter (2026-06-30 to 2026-06-30) returns only records for that date
- [ ] Status polling reflects true job progress (PROCESSING → OK or ERROR)
- [ ] Multiple Pasta Dates syncable without data corruption (e.g., June, May, April month-ends)
- [ ] Re-synchronizing same Pasta Date updates records (not duplicates)

## Evidence

- Source document: "Tareas e incidencias comunes.docx" — "Sincronización IPV TOTEM" section with Pasta Date, date range, and Monitor status workflow

## Traceability

- Used by: PROD-SETUP-002 (optionally)
- Related: FEAT-SYNC-001 (volatility/repo sync base feature)
- Constrained by: DOM-KYUW-005 (category taxonomy)
- Documented in: DOC-KYUW-004

