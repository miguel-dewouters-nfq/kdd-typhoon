---
id: DOM-KYUW-003
type: spec
layer: domain
status: draft
confidence: high
version: 0.1.0
created: 2026-07-08
updated: 2026-07-08
owner: to-be-assigned
dependencies:
  - id: DOM-KYUW-001
    relation: extends
tags:
  - equity
  - instrument-classification
  - market-data
---

# Equity Instrument Classification Rules

## Intent

Formalize the business rules for classifying equity instruments and determining their pricing category in Typhoon's Autoclose subsystem.

## Definition

### Concept

Equity instruments are distinguished by their **Murex Label suffix** to determine whether they are index prices or equity prices:
- **Index** (suffix "IN" or "IND"): Priced as INDEX_PRICE
- **Equity** (any other suffix): Priced as EQUITY_PRICE

Each equity instrument carries metadata:
- **ISIN** (International Securities Identification Number): Unique identifier for securities lookup
- **Market**: Geographic or venue identifier (e.g., "MADRID", "HONG_KONG")
- **Currency**: Pricing currency (EUR, USD, CNY, etc.)
- **Reference Price**: Known valid price for validation after formula test
- **Murex Label**: Internal trading system identifier
- **Reuters RIC**: Reference data code for REFINITIV data provider
- **Bloomberg ID**: Reference data code for BLOOMBERG data provider (format: "XXX26 Comdty" for futures)

### Rules

1. **Category Assignment**
   - If Murex Label ends with "IN" or "IND" → category = "INDEX_PRICE"
   - Otherwise → category = "EQUITY_PRICE"

2. **Provider Selection Priority**
   - Primary: REFINITIV with Reuters RIC
   - Fallback: BLOOMBERG with Bloomberg ID
   - Last resort: DATALICENSE (if Bloomberg fails)

3. **Data Validation**
   - ISIN must exist and match the reference data in the JBPM request
   - Market must be populated in the JBPM request
   - Currency must not be null
   - Reference Price used to validate formula results (returned price ≈ Reference Price)

4. **Search Fallback** (if instrument not found by exact Murex Label)
   - Strip characters from end of label iteratively
   - Accept alternative label if: same Market + non-empty "First Provider" + non-empty "First Resource"

### Constraints

- An instrument cannot be classified until all three of ISIN, Market, Currency are available
- Reference Price is informational only (used for validation, not stored in autoclose rule)
- Multiple providers may have valid data; fallback sequence prevents "Not valid instruments" errors

### Examples

**Example 1: Index Equity**
- Murex Label: "IBEX35IN"
- Category: INDEX_PRICE (suffix "IN")
- Provider: REFINITIV
- Reuters RIC: ".IBEX"
- Formula: [.IBEX] → Returns 9500 (expected ~9400 Reference Price) ✓

**Example 2: Single Stock**
- Murex Label: "AACDE"
- Category: EQUITY_PRICE (no index suffix)
- Provider: REFINITIV
- Reuters RIC: "AAC.DE"
- Formula: [AAC.DE] → Returns €45.20 ✓

**Example 3: Fallback to Bloomberg**
- Murex Label: "UNICR"
- REFINITIV Reuters RIC: "UNICREDIT.MI" → Returns error "Not valid instruments"
- Fallback: BLOOMBERG
- Bloomberg ID: "UCG IM Equity"
- Rule: CLOSE_LAST_MID
- Formula: [UCG IM Equity] → Returns €35.80 ✓

## Acceptance Criteria

- [ ] Instruments with "IN" or "IND" suffix correctly route to INDEX_PRICE category
- [ ] Instruments with other suffixes route to EQUITY_PRICE category
- [ ] ISIN presence is validated before formula testing
- [ ] REFINITIV provider is attempted first; BLOOMBERG fallback triggered on error
- [ ] Reference Price field aids operator in validating formula correctness
- [ ] Fallback label search works with partial Murex Label when exact match unavailable

## Evidence

- Source document: "Tareas e incidencias comunes.docx" — "En el apartado 'Category' seleccionamos de la lista el valor 'INDEX_PRICE' si el Murex Label acaba en 'IN' o 'IND'"
- Source document: "Tareas e incidencias comunes.docx" — Fallback provider logic for REFINITIV → BLOOMBERG → DATALICENSE

## Traceability

- Implemented by: FEAT-AUTOCLOSE-001
- Operationalized by: DOC-KYUW-002
- User journey: PROD-SETUP-001

