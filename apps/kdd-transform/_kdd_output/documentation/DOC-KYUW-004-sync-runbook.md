---
id: DOC-KYUW-004
type: spec
layer: documentation
status: draft
confidence: medium
version: 0.1.0
created: 2026-07-08
updated: 2026-07-08
owner: to-be-assigned
dependencies:
  - id: FEAT-SYNC-001
    relation: implements
  - id: FEAT-SYNC-002
    relation: implements
tags:
  - sop
  - market-curves
  - synchronization
  - mx3-management
---

# Synchronization Management Runbook

## Intent

Guide operations teams through market data synchronization workflows in Typhoon's Mx3 system, covering both daily volatility/repo refreshes and end-of-month historical data captures.

## Definition

### Purpose

Audience: Operations staff managing market curve data
Scope: Covers two synchronization modes (CLOSE_IPV daily sync and IPV_TOTEM month-end sync) with status monitoring
Outcome: Operator can independently execute synchronization workflows and verify completion

### Audience

- Operations staff (daily or weekly market data refresh tasks)
- Risk management (volatility surface validation)
- Finance (month-end close data audit)
- Training: Market data lifecycle management

### Content Overview

**Part 1: Understanding Synchronization**

**What is Synchronization?**
- Refresh market curve data in Typhoon from external providers
- Captures volatility surfaces (smile and term-structure), repo rates, and other curves
- Enables accurate valuation and risk calculations for portfolio instruments
- Two modes: Daily (CLOSE_IPV) and Month-End (IPV_TOTEM)

**When to Synchronize**
- **Daily**: After market close (daily refresh) or on-demand for new instruments
- **Month-End**: Last calendar day of month (Pasta Date) for regulatory/audit purposes

**Categories Being Synchronized**
- BASKET_SMILE — Volatility smile for basket indices
- BASKET_VOLATILITY — Term structure volatility for baskets
- INDEX_SMILE — Volatility smile for individual indices
- INDEX_VOLATILITY — Term structure volatility for indices
- EQUITY_SMILE — Volatility smile for individual stocks
- EQUITY_VOLATILITY — Term structure volatility for stocks
- REPO_MARGIN — Repurchase agreement margin rates

**Part 2: Daily Synchronization (CLOSE_IPV)**

**Step-by-Step Workflow**

1. Navigate to Typhoon web interface
2. Go to: Mx3 → Mx3 Management → Synchronize
3. **Snapshot Selection**: 
   - Dropdown shows available snapshots
   - Select "CLOSE_IPV" (or other snapshot specified by your team)
4. **Category List Display**:
   - Full list of categories appears below Snapshot selector
5. **Filter First Category**:
   - Click Filter field
   - Type category name (or substring, e.g., "VOLATILITY" matches multiple)
   - Example: Type "BASKET_VOLATILITY" → System displays BASKET_VOLATILITY row
6. **Synchronize First Category**:
   - Click row for BASKET_VOLATILITY
   - Click "Synchronize today" button (circular arrow icon)
   - Modal dialog appears
7. **Confirm Synchronization**:
   - Modal shows category name for confirmation
   - Click "Synchronize" button
   - Dialog closes; return to main Synchronize view
   - Status for BASKET_VOLATILITY changes to: **PROCESSING** (with animated indicator)
8. **Monitor First Category**:
   - Wait 1-2 minutes for background job
   - Click "Refresh" button (circular arrow, upper right)
   - Status updates: PROCESSING → Completion timestamp (e.g., "2026-07-08 14:23:45")
9. **Proceed to Next Category**:
   - Clear Filter field
   - Type next category name: "BASKET_SMILE"
   - Repeat steps 5-8
10. **Repeat for All Seven Categories**:
    - BASKET_SMILE
    - BASKET_VOLATILITY
    - INDEX_SMILE
    - INDEX_VOLATILITY
    - EQUITY_SMILE
    - EQUITY_VOLATILITY
    - REPO_MARGIN

**Status Interpretation**
- **PROCESSING**: Background job running; expect completion within 5 minutes
- **Date/Time** (e.g., "2026-07-08 14:23:45"): Synchronization completed successfully
- **ERROR**: Synchronization failed; check error message and retry

**Sorting by Completion Time**
- Click column header "Last Synchronization"
- Arrow indicates sort direction (↑ ascending, ↓ descending)
- Descending shows most recent syncs first

**Part 3: Month-End Synchronization (IPV TOTEM)**

**When to Perform**
- Last calendar day of each month (e.g., 2026-06-30, 2026-07-31)
- Even if that day is a weekend or holiday (still use calendar date)

**What is Pasta Date?**
- "Pasta" = Last day of prior month
- Used for historical data capture in TOTEM system
- Format: YYYY-MM-DD (e.g., 2026-06-30 for July sync run)

**Synchronization via Mx3 Management**

1. Navigate to Typhoon: Mx3 → Mx3 Management → Synchronize
2. **Snapshot Selection**: Select "IPV_TOTEM"
3. **Category Filtering & Synchronization** (same as daily):
   - Filter category by name
   - Click "Synchronize today"
4. **Modal Dialog** (IPV TOTEM Variant):
   - **Pasta Date Checkbox**: Checked ☑ (enables date input)
   - **Date Input Field**: Enter last day of prior month
     - Example for July: 2026-06-30
     - Example for August: 2026-07-31
   - **Synchronize Button**: Click to submit
5. **Return to Synchronize View**:
   - Status shows PROCESSING
   - Repeat for all seven categories

**Status Verification via Ans Monitor**

1. Navigate to Typhoon: Ans → Monitor
2. **Snapshot Selection**: "IPV_TOTEM"
3. **Category Selection**: "*" (all categories)
4. **Date Range Input**:
   - Start Date: Paste Date (e.g., 2026-06-30)
   - End Date: Paste Date (e.g., 2026-06-30) — Must match Start Date
5. **Display**: Click "Display" button
   - System queries all categories synchronized on Pasta Date
6. **Monitor Status**:
   - Status column shows: PROCESSING or OK
   - Repeat "Display" clicks every few minutes
   - Status updates: PROCESSING → OK or ERROR
7. **Optional Category Filter** (if monitoring specific categories):
   - Click Filter field
   - Type category name (e.g., "EQUITY_VOLATILITY")
   - Displays only matching rows

**Workflow Timeline Example**
```
14:00 - Operator initiates TOTEM sync for June 30 via Mx3 Management
14:05 - Operator navigates to Ans → Monitor
14:10 - Clicks "Display" → Sees all categories with PROCESSING status
14:15 - Clicks "Display" again → EQUITY_VOLATILITY shows OK
14:20 - Clicks "Display" → All categories show OK
14:25 - Synchronization complete; operator confirms to stakeholders
```

**Part 4: Troubleshooting**

**"Synchronization Taking Too Long"**
- Normal duration: 2-5 minutes per category
- If > 10 minutes: Provider may be slow; wait or contact support

**"Status Shows ERROR"**
- Click error message for details
- Common causes:
  - Provider temporarily unavailable → Retry after 5 minutes
  - Category not available in snapshot → Verify category name spelling
  - Date format invalid (TOTEM only) → Check Pasta Date format (YYYY-MM-DD)
- Action: Retry synchronization for failed category

**"Monitor Display Shows Different Status than Synchronize View"**
- Normal delay of 1-2 minutes for status propagation
- Click "Display" again in Monitor view to refresh
- If persists > 5 minutes: Contact support

**"Forgot Pasta Date Format"**
- Pasta Date = Last calendar day of prior month
- Examples:
  - July: 2026-06-30
  - August: 2026-07-31
  - February (non-leap): 2026-02-28
  - February (leap): 2025-02-29 (not 2025-02-30)

**Part 5: Best Practices**

1. **Process One Category at a Time**: Reduces UI errors and makes troubleshooting easier
2. **Use Filter Field Aggressively**: Speeds category search; no need to scroll through all 7
3. **Check "Last Synchronization" Column**: Verify all categories synced recently
4. **Record Pasta Dates in Calendar**: Month-end sync dates predetermined and trackable
5. **Notify Stakeholders on Completion**: Risk management and finance need assurance of data freshness
6. **Keep Error Logs**: Screenshot error messages for support escalation
7. **Retry Failed Categories Immediately**: Most failures are transient (provider delays)

**Part 6: FAQ**

**Q: Can I synchronize multiple categories simultaneously?**
A: Not recommended. UI processes one "Synchronize today" click at a time. Sequential processing is more reliable.

**Q: What if I synchronize same Pasta Date twice?**
A: Second sync overwrites first. Only one record per category per date. Use this to force re-sync if first attempt was corrupted.

**Q: Do I need to synchronize all seven categories?**
A: Yes, all seven are synchronized in each cycle (daily or month-end) to maintain data consistency.

**Q: Can I skip a month-end Pasta Date?**
A: Operationally yes, but not recommended. Calendar month-ends should have data captured for audit trail. Consult Finance/Risk before skipping.

**Q: What is the difference between CLOSE_IPV and IPV_TOTEM?**
A: CLOSE_IPV = Daily operational curves for valuation. IPV_TOTEM = Historical snapshot for regulatory/audit purposes with explicit date parameters.

## Acceptance Criteria

- [ ] Runbook covers both CLOSE_IPV and IPV_TOTEM synchronization modes
- [ ] Step-by-step instructions include exact UI button/menu paths
- [ ] Category list all seven categories explicitly
- [ ] Status interpretation explained (PROCESSING vs completion timestamp vs ERROR)
- [ ] Pasta Date definition and format clearly documented
- [ ] Date range logic for Ans Monitor explained (Start = End = Pasta Date)
- [ ] Troubleshooting section covers top 5 operator issues
- [ ] Best practices section provides actionable guidance
- [ ] FAQ section addresses common questions
- [ ] Timeline example shows typical workflow duration

## Evidence

- Source document: "Tareas e incidencias comunes.docx" — "Sincronización de volatilities y repo" section (CLOSE_IPV)
- Source document: "Tareas e incidencias comunes.docx" — "Sincronización IPV TOTEM" section with Pasta Date and date range logic

## Traceability

- Implements: FEAT-SYNC-001, FEAT-SYNC-002
- Uses: DOM-KYUW-005 (category taxonomy)
- Related to: PROD-SETUP-002 (optional sync post-futures setup)

