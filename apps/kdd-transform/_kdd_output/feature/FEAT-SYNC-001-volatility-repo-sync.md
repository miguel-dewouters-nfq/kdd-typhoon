---
id: FEAT-SYNC-001
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
  - mx3-management
---

# Mx3 Volatility & Repo Synchronization

## Intent

Define the feature for batch-refreshing market curve data (volatility surfaces and repo rates) across multiple snapshots and categories.

## Definition

### Purpose

Automatically refresh volatility smile/term-structure curves and repo margin rates from market data providers into Typhoon's Mx3 data storage for downstream valuation and risk management.

### Inputs

- **Snapshot**: Target data snapshot (e.g., "CLOSE_IPV")
- **Categories**: Multi-select list of categories to synchronize:
  - BASKET_SMILE
  - BASKET_VOLATILITY
  - INDEX_SMILE
  - INDEX_VOLATILITY
  - EQUITY_SMILE
  - EQUITY_VOLATILITY
  - REPO_MARGIN

### Behavior

#### UI Navigation

1. Operator navigates to: Typhoon web → Mx3 → Mx3 Management → Synchronize
2. Snapshot selector: Dropdown to choose CLOSE_IPV (or other available snapshots)
3. Category list: Displays available categories for the selected snapshot

#### Synchronization Workflow

1. **Filter By Category**: Operator enters partial or complete category name in "Filter" field
   - System displays matching categories (case-insensitive substring match)
   - Example: Filter "VOLATILITY" matches BASKET_VOLATILITY, INDEX_VOLATILITY, EQUITY_VOLATILITY
2. **Select Category**: Operator clicks row for single category
3. **Trigger Sync**: Operator clicks "Synchronize today" button (represented by circular arrow icon)
   - System displays modal dialog
4. **Confirm Sync**: Operator clicks "Synchronize" button in modal
   - System initiates background job
   - Returns to main Mx3 Management → Synchronize view
5. **Status Monitoring**: 
   - Category row updates with status
   - Initial state: PROCESSING (animated indicator)
   - User refreshes page periodically via "Refresh" button (circular arrow, upper right)
6. **Completion**: 
   - When background job finishes: PROCESSING → date/time string (e.g., "2026-07-08 14:23:45")
   - If error: PROCESSING → ERROR message
7. **Repeat For Next Category**: User clears Filter field, filters for next category, repeats steps 1-6

#### Status Sorting

- User clicks "Last Synchronization" column header to sort (arrow indicates sort direction)
- Descending sort shows most recent syncs first

### Outputs

- **Updated Curves**: Market data pushed into Mx3 storage for selected snapshot and categories
- **Completion Time**: Timestamp recorded for audit trail
- **Error Notifications**: Failed categories flagged for operator investigation

### Constraints

1. **One Category at a Time**: Operator must process categories sequentially (no bulk select in UI)
2. **Manual Refresh Required**: Status does NOT auto-update; operator must click "Refresh" repeatedly
3. **No Partial Retry**: If sync fails mid-job, entire category must be retried (cannot resume)
4. **Category Validation**: Only categories listed in DOM-KYUW-005 are valid; typos cause errors

### Workflow Timeline

- **T=0**: Operator clicks "Synchronize today"
- **T=0+5s**: Status shows PROCESSING
- **T=0+30s**: Operator clicks "Refresh" multiple times
- **T=0+2m**: Category completes, status shows timestamp
- **T=0+2m05s**: Operator proceeds to next category

### Integration with Other Features

- Synchronization is **independent** of instrument setup (PROD-SETUP-001, PROD-SETUP-002)
- Triggered manually by operator; not automatic post-setup
- Used for scheduled market data refresh (daily or on-demand)

## Acceptance Criteria

- [ ] Snapshot selector shows correct list of available snapshots
- [ ] Category list filters correctly by partial name match
- [ ] "Synchronize today" button triggers background job without blocking UI
- [ ] Status updates from PROCESSING to completion timestamp within reasonable timeframe (< 5 minutes)
- [ ] Manual refresh button updates all category statuses
- [ ] "Last Synchronization" column sortable (ascending/descending)
- [ ] Operator can synchronize same category multiple times on same day
- [ ] All seven standard categories (BASKET_SMILE, BASKET_VOLATILITY, etc.) successfully sync
- [ ] Failed synchronization produces clear error message (not silent failure)
- [ ] Previous synchronization timestamps preserved (can query history)

## Evidence

- Source document: "Tareas e incidencias comunes.docx" — "Sincronización de volatilities y repo" section with category list and workflow steps

## Traceability

- Used by: PROD-SETUP-002 (optionally)
- Constrained by: DOM-KYUW-005
- Related architecture: ARCH-KYUW-009 (Mx3 Synchronization Manager component)
- Documented in: DOC-KYUW-004

