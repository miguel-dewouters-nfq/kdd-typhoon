---
id: DOM-KYUW-005
type: spec
layer: domain
status: draft
confidence: medium
version: 0.1.0
created: 2026-07-08
updated: 2026-07-08
owner: to-be-assigned
dependencies: []
tags:
  - market-curves
  - volatility
  - repo
  - synchronization
---

# Data Synchronization Category Taxonomy

## Intent

Document the market curve categories that are synchronized between Typhoon and market data providers (volatility surfaces, repo rates, etc.).

## Definition

### Concept

Typhoon's Mx3 module manages market data snapshots (Closing Process curves, TOTEM data). Synchronization workflows batch-refresh curve data by category. Each category represents a specific financial data slice:
- **Smile curves**: Volatility surface across strike prices
- **Volatility curves**: Term structure of implied volatility
- **Repo curves**: Repurchase agreement rates by tenor

Categories are indexed by:
- **Snapshot**: CLOSE_IPV, CLOSE_FO_MADRID, IPV_TOTEM, etc.
- **Category name**: Standardized string identifier

### Standard Categories (Snapshot: CLOSE_IPV)

Synchronized in the "Volatilities and Repo" workflow:

1. **BASKET_SMILE** - Smile curve volatility for basket indices
2. **BASKET_VOLATILITY** - Term-structure volatility for basket indices
3. **INDEX_SMILE** - Smile curve volatility for equity indices
4. **INDEX_VOLATILITY** - Term-structure volatility for equity indices
5. **EQUITY_SMILE** - Smile curve volatility for individual stocks
6. **EQUITY_VOLATILITY** - Term-structure volatility for individual stocks
7. **REPO_MARGIN** - Repurchase agreement margin rates by tenor

### Snapshot Types

- **CLOSE_IPV**: Standard closing market curve snapshot for index pricing and valuation (synchronized daily or on-demand)
- **CLOSE_FO_MADRID**: Closing snapshot for futures & options on Madrid Exchange
- **IPV_TOTEM**: TOTEM system snapshot with end-of-month synchronization and historical date range support

### Synchronization Behaviors

**Standard Synchronization (CLOSE_IPV)**
- Triggered on-demand by operator via Mx3 Management → Synchronize
- Each category synchronized independently
- Status: PROCESSING → Completed (date/time) or ERROR
- No date parameter; uses current market date

**TOTEM Synchronization (IPV_TOTEM)**
- Triggered on-demand with **Pasta Date** parameter (last day of prior month)
- Date range filtering: Start and End both set to Pasta Date
- Status monitoring via Ans → Monitor with date range filter
- Status: PROCESSING → OK or ERROR
- Historical synchronization capability (can re-sync past months)

### Rules

1. **Category Naming**: All category names must be matched exactly when filtering in UI (case-sensitive)
2. **One Category at a Time**: Operator must filter and synchronize each category separately
3. **Status Polling**: Operator must refresh status repeatedly until all categories show completion
4. **Pasta Date Format**: YYYY-MM-DD; always last calendar day of prior month (may be non-workday)
5. **No Partial Success**: If any category fails, retry individual category; do not assume partial sync success

### Constraints

- Categories cannot be created or deleted via UI; only synchronized
- Snapshot selection must match the intended market data source
- TOTEM synchronization requires explicit Pasta Date; cannot use current date

### Examples

**Example 1: Daily Volatility Sync**
- Snapshot: CLOSE_IPV
- Categories to sync:
  - BASKET_VOLATILITY
  - INDEX_VOLATILITY
  - EQUITY_VOLATILITY
- Each category filtered individually and synced via "Synchronize today" button
- Status: PROCESSING → Completed 2026-07-08 13:45 ✓

**Example 2: Month-End TOTEM Sync**
- Snapshot: IPV_TOTEM
- Pasta Date: 2026-06-30 (last day of June)
- Date Range: 2026-06-30 to 2026-06-30
- Monitor via: Ans → Monitor (Snapshot=IPV_TOTEM, Category=*, DateRange=06-30 to 06-30)
- Status: PROCESSING → OK ✓

## Acceptance Criteria

- [ ] All seven categories for CLOSE_IPV are synchronized correctly
- [ ] TOTEM synchronization with Pasta Date creates historical snapshot
- [ ] Status polling reflects real-time progress (PROCESSING → Completed/ERROR)
- [ ] Manual refresh required to update status (no automatic polling)
- [ ] Failed category can be retried without affecting successful categories
- [ ] Operator receives clear feedback on completion status

## Evidence

- Source document: "Tareas e incidencias comunes.docx" — "Las categorías a sincronizar son: BASKET_SMILE, BASKET_VOLATILITY, INDEX_SMILE, INDEX_VOLATILITY, EQUITY_SMILE, EQUITY_VOLATILITY, REPO_MARGIN"
- Source document: "Tareas e incidencias comunes.docx" — Pasta Date synchronization with date range logic

## Traceability

- Implemented by: FEAT-SYNC-001, FEAT-SYNC-002
- Operationalized by: DOC-KYUW-004
- Related: DOM-KYUW-003 (for INDEX_VOLATILITY, EQUITY_VOLATILITY contexts)

