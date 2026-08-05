Transform a document into KDD knowledge artifacts following the spec-driven framework.

## Input

The user will provide: $ARGUMENTS

This can be:
- A file path to a document (any format: .md, .txt, .html, .json, .yaml, .pdf, .docx, etc.)
- A URL to fetch and transform
- Raw text pasted directly

## Instructions

Execute this two-phase pipeline:

### Phase 1 — Analysis

Read the source document completely. Then analyze it and identify every distinct knowledge unit it contains. Classify each one into the correct KDD layer using this taxonomy:

**Knowledge Artifacts (Persistent):**
| Layer | ID Pattern | Scope |
|-------|-----------|-------|
| Architecture | `ARCH-NNN` | Technology decisions, patterns, infrastructure |
| Domain | `DOM-AREA-NNN` | Business rules, regulations, domain concepts |
| Product | `PROD-JOURNEY-NNN` | Product requirements, user journeys |
| Feature | `FEAT-MODULE-NNN` | Specific functionality, behaviors |
| Documentation | `DOC-TYPE-NNN` | Guides, runbooks, reference materials |

**Work Artifacts (Ephemeral):**
| Type | ID Pattern | Purpose |
|------|-----------|---------|
| WRK-SPEC | `WRK-SPEC-NNN` | Define what & why |
| WRK-PLAN | `WRK-PLAN-NNN` | Define how — technical approach |
| WRK-TASK | `WRK-TASK-NNN` | Atomic implementation unit |

**Governance Artifacts (Bridge):**
| Type | Purpose |
|------|---------|
| RFC | Propose changes |
| ADR | Record decisions |
| RULE | Codify constraints |

Before assigning IDs, scan the existing specs directory to avoid collisions:
```bash
find . -name "*.md" -path "*/specs/*" -o -name "*.md" -path "*/examples/*" | head -50
```

Present the decomposition plan as a table:
```
ID | Layer | Confidence | Title | Rationale
```

Also list cross-references between the identified artifacts.

**Ask the user to confirm the plan before proceeding to Phase 2.**

### Phase 2 — Generation

For each confirmed artifact, generate a complete KDD spec file. Each spec MUST follow the standard anatomy from `knowledge-architecture/spec-anatomy.md`:

**YAML Frontmatter (required fields):**
```yaml
---
id: TYPE-AREA-NNN
type: spec
layer: [architecture|domain|product|feature|documentation|work-spec|work-plan|work-task]
status: draft
confidence: [high|medium|low]
version: 0.1.0
created: [today's date]
updated: [today's date]
owner: to-be-assigned
dependencies:
  - id: OTHER-SPEC-ID
    relation: [implements|constrained-by|extends|uses-data-from|activates|depends-on]
tags:
  - tag1
  - tag2
---
```

**Section structure varies by layer:**
- **Architecture**: Intent → Definition (Context → Decision → Rationale → Consequences) → Acceptance Criteria → Evidence → Traceability
- **Domain**: Intent → Definition (Concept → Rules → Constraints → Examples) → Acceptance Criteria → Evidence → Traceability
- **Product**: Intent → Definition (Purpose → Actors → Flow) → Acceptance Criteria → Evidence → Traceability
- **Feature**: Intent → Definition (Purpose → Inputs → Behavior → Outputs) → Acceptance Criteria → Evidence → Traceability
- **Documentation**: Intent → Definition (Purpose → Audience → Content) → Acceptance Criteria → Traceability
- **Work-Spec**: Problem Statement → Proposed Change → Knowledge Context → Constraints → Acceptance Criteria → Open Questions
- **Work-Plan**: Approach → Task Breakdown → Architecture Impact → Risk Assessment → Dependencies
- **Work-Task**: Objective → Implementation Notes → Acceptance Criteria → Test Plan

**Rules for generation:**
1. Each spec must be self-contained — readable without the source document
2. Extract and formalize knowledge, do NOT copy-paste from the source
3. Acceptance criteria must be testable (use checkboxes `- [ ]`)
4. Evidence section should reference the source document
5. Traceability links back to source + any external references found
6. All specs start as `status: draft`

**Output organization:**
Write each spec to the appropriate directory:
```
_kdd_output/
├── architecture/    ARCH-*.md
├── domain/          DOM-*.md
├── product/         PROD-*.md
├── feature/         FEAT-*.md
├── documentation/   DOC-*.md
├── work/            WRK-*.md
└── _manifest.json
```

Also generate a `_manifest.json` with:
```json
{
  "source": "document name",
  "generated": "ISO date",
  "domain": "detected domain",
  "summary": "brief summary",
  "artifacts": [{ "id": "...", "title": "...", "layer": "...", "file": "..." }],
  "cross_references": [{ "from": "...", "to": "...", "relation": "...", "reason": "..." }]
}
```

After writing all files, run validation if spec-graph is available:
```bash
node apps/spec-graph/spec-graph.mjs --specs _kdd_output validate
```

Report a final summary: how many artifacts were created, organized by layer, with the output path.
