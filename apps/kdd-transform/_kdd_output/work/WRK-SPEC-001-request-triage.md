---
id: WRK-SPEC-001
type: spec
layer: work-spec
status: draft
confidence: medium
version: 0.1.0
created: 2026-07-08
updated: 2026-07-08
owner: to-be-assigned
dependencies:
  - id: PROD-SETUP-001
    relation: depends-on
  - id: PROD-SETUP-002
    relation: depends-on
tags:
  - triage
  - decision-tree
  - intake
---

# Instrument Setup Request Triage

## Problem Statement

Operations receives instrument setup requests for multiple asset classes (equities, futures, options, baskets). Current workflow lacks a clear decision framework for routing requests to appropriate handlers. This causes:

- Operators spending time on OPTIONS requests that require no setup (wasted effort)
- Uncertainty about which runbook to follow (DOC-KYUW-002 vs DOC-KYUW-003)
- Risk of mixing equity and futures procedures (different provider strategies, database requirements)

## Proposed Change

Formalize a **Type-Based Request Triage** process:

1. **Email Intake**: Upon receiving instrument setup email, operator immediately checks "Type of Instrument" field in JBPM request
2. **Type Decision**:
   - **Type = OPTION** → Route to Archive handler (no Typhoon setup)
   - **Type = FUTURE** → Route to Futures Setup handler (DOC-KYUW-003)
   - **Type = EQUITY** or other → Route to Equity Setup handler (DOC-KYUW-002)
3. **Handler Assignment**: Operator or team leads assign request to appropriate specialist
4. **Runbook Selection**: Handler opens corresponding SOP (Equity or Futures)
5. **Execution**: Handler follows 4-6 stage process to completion

## Knowledge Context

From "Tareas e incidencias comunes.docx":
- OPTIONS require only email archive; no Typhoon configuration
- FUTURES and EQUITIES differ significantly:
  - EQUITIES: 4-stage setup (data extract → autoclose → database registration → confirm)
  - FUTURES: Simplified 3-stage setup (data extract → autoclose → confirm)
  - EQUITIES: Provider fallback (REFINITIV → BLOOMBERG → DATALICENSE)
  - FUTURES: BLOOMBERG only (no fallback)
- Existing runbooks and decision trees support this triage approach

## Constraints

- Type field must be present in JBPM request; if missing or unclear, escalate to Securities & Reference Data team
- Triage decision must happen **before any UI navigation** to avoid wasted effort
- Triage output drives assignment, not execution; handlers remain responsible for full workflow

## Acceptance Criteria

- [ ] Type identification step is documented as **first step** in any request handling
- [ ] Clear mapping exists: Type → Runbook (OPTIONS → None, FUTURE → DOC-KYUW-003, EQUITY → DOC-KYUW-002)
- [ ] Triage decision tree implemented in operator checklist or intake form
- [ ] Missing Type field triggers immediate escalation (not silent error)
- [ ] Triage outcome documented in email/ticket for audit trail
- [ ] Team leads can quickly assign based on Type routing

## Open Questions

- Should triage be automated (email rule) or manual (operator decision)?
- Is there a "BASKET" type requiring separate handling?
- Can triage decision be embedded in Ans or Typhoon UI (type field validation)?

## Related Artifacts

- DOC-KYUW-002 (Equity SOP — follows OPTIONS filter)
- DOC-KYUW-003 (Futures SOP — includes type routing)
- PROD-SETUP-001, PROD-SETUP-002 (User journeys)

## Traceability

- Supports: PROD-SETUP-001, PROD-SETUP-002 via pre-workflow filtering
- Constrained by: DOM-KYUW-004 (which defines Type field semantics)

