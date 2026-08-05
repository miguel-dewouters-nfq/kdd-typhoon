# kdd-transform

Transforma cualquier documento en artifacts [Knowledge-Driven Development (KDD)](../../CLAUDE.md). Lee un documento fuente (Markdown, texto, HTML, JSON, YAML, PDF, etc.), analiza su contenido con Claude, y produce un conjunto de especificaciones KDD listas para integrar en un repositorio spec-driven.

---

## Dos formas de usarlo

| | **Via Claude Code (sin coste extra)** | **Via CLI (automatizado)** |
|---|---|---|
| Requiere | Licencia Claude Code (Max/Pro) | API key de Anthropic (pago por uso) |
| Setup | Ninguno | `npm install` + `ANTHROPIC_API_KEY` |
| Uso | `/kdd-transform <documento>` | `node kdd-transform.mjs transform <documento>` |
| Ideal para | Uso puntual, revisiones interactivas | Lotes grandes, pipelines CI/CD |

---

## Opcion A: Claude Code (recomendado, sin coste extra)

Si tienes Claude Code (Max o Pro), usa el slash command integrado. No necesitas API key, ni instalar nada, ni Node.js.

### Setup (una sola vez)

Copia la carpeta `.claude/commands/` en la raiz de tu proyecto:

```
tu-proyecto/
└── .claude/
    └── commands/
        └── kdd-transform.md    <── este archivo
```

O si ya tienes el repo spec-driven clonado, el comando ya esta disponible.

### Uso

Abre Claude Code en tu proyecto y escribe:

```
/kdd-transform ruta/al/documento.md
```

Tambien puedes pasarle una URL o pegar texto directamente:

```
/kdd-transform https://example.com/architecture-doc.html
```

```
/kdd-transform [pega tu texto aqui]
```

### Que ocurre

1. **Fase 1 — Analisis**: Claude lee el documento y te muestra un plan de descomposicion:

   ```
   ID              | Layer          | Confidence | Title
   ────────────────|────────────────|────────────|──────────────────────
   ARCH-TRADE-001  | architecture   | high       | Event-Driven Trade Processing
   DOM-TRADE-001   | domain         | medium     | Trade Lifecycle Rules
   FEAT-EXEC-001   | feature        | low        | Order Execution Engine
   ```

2. **Tu confirmas** el plan (puedes pedir ajustes: quitar, anadir, cambiar layers...)

3. **Fase 2 — Generacion**: Claude crea los archivos `.md` en `_kdd_output/`

4. **Validacion**: ejecuta `spec-graph validate` automaticamente si esta disponible

### Ventajas

- Sin coste extra sobre tu licencia Claude Code
- Interactivo: puedes revisar y ajustar antes de generar
- Sin dependencias ni setup

---

## Opcion B: CLI automatizado

Para lotes grandes o integracion en pipelines. Requiere una API key de Anthropic (coste por uso, ~$0.10-0.30 por documento tipico).

### Requisitos

- **Node.js** >= 18
- **API key de Anthropic**: obtenla en [console.anthropic.com](https://console.anthropic.com) → Settings → API Keys

### Instalacion

```bash
cd apps/kdd-transform
npm install
```

### Quick start

```bash
# Configura tu API key
export ANTHROPIC_API_KEY=sk-ant-...

# 1. Preview del plan (no escribe archivos)
node kdd-transform.mjs analyze path/to/document.md

# 2. Transformacion completa
node kdd-transform.mjs transform path/to/document.md

# 3. Revisa el output
ls _kdd_output/
cat _kdd_output/_manifest.json
```

### Comandos

#### `analyze <file>`

Analiza un documento y muestra el plan de descomposicion. No escribe archivos.

```bash
node kdd-transform.mjs analyze requirements.md
node kdd-transform.mjs analyze architecture.html --domain "Payments"
node kdd-transform.mjs analyze api-spec.yaml --focus "security constraints"
```

#### `transform <file>`

Pipeline completo: analisis + generacion de specs.

```bash
node kdd-transform.mjs transform document.md
node kdd-transform.mjs transform document.md --out-dir ./specs
node kdd-transform.mjs transform document.md --specs-dir ../existing-specs
node kdd-transform.mjs transform document.md --concurrency 5
```

#### `batch <file1> <file2> ...`

Transforma multiples documentos en secuencia.

```bash
node kdd-transform.mjs batch doc1.md doc2.txt doc3.html --out-dir ./specs
```

### Opciones

| Flag | Short | Descripcion | Default |
|------|-------|-------------|---------|
| `--out-dir <dir>` | `-o` | Directorio de salida | `_kdd_output/` junto al fichero |
| `--model <model>` | `-m` | Modelo Claude | `claude-sonnet-4-6` |
| `--domain <domain>` | `-d` | Dominio funcional (ej. `"Risk Management"`) | Auto-detectado |
| `--focus <focus>` | `-f` | Enfocar en un aspecto concreto | Documento completo |
| `--specs-dir <dir>` | `-s` | Directorio de specs existentes (evita colision de IDs) | Ninguno |
| `--concurrency <n>` | `-c` | Paralelismo en generacion | `3` |
| `--api-key <key>` | `-k` | API key de Anthropic | `$ANTHROPIC_API_KEY` |

---

## Como funciona (pipeline)

```
                         Fase 1                     Fase 2
  Documento fuente  ──────────────▶  Plan de        ──────────────▶  Specs KDD
  (cualquier formato)   Analisis     descomposicion     Generacion    (.md files)
```

**Fase 1 — Analisis**: Claude lee el documento completo e identifica cada unidad de conocimiento. Clasifica cada una en la capa KDD correcta (architecture, domain, product, feature, documentation, work) y produce un plan con IDs, dependencias y niveles de confianza.

**Fase 2 — Generacion**: Para cada artifact del plan, Claude genera una especificacion KDD completa con YAML frontmatter valido, la estructura de secciones correcta para su capa, criterios de aceptacion testeables, y trazabilidad al documento fuente.

---

## Estructura de salida

```
_kdd_output/
├── architecture/
│   └── arch-trade-001-event-driven-trade-processing.md
├── domain/
│   ├── dom-trade-001-trade-lifecycle-rules.md
│   └── dom-settle-001-settlement-constraints.md
├── feature/
│   └── feat-exec-001-order-execution-engine.md
├── work/
│   └── wrk-spec-001-migration-plan.md
└── _manifest.json
```

Cada `.md` es un spec KDD completo con:

- **YAML frontmatter** — `id`, `type`, `layer`, `status`, `confidence`, `version`, `owner`, `dependencies`, `tags`
- **Secciones estandar** segun la capa:
  - Architecture: Intent → Definition (Context/Decision/Rationale/Consequences) → Acceptance Criteria → Evidence → Traceability
  - Domain: Intent → Definition (Concept/Rules/Constraints/Examples) → Acceptance Criteria → Evidence → Traceability
  - Product: Intent → Definition (Purpose/Actors/Flow) → Acceptance Criteria → Evidence → Traceability
  - Feature: Intent → Definition (Purpose/Inputs/Behavior/Outputs) → Acceptance Criteria → Evidence → Traceability
  - Work-Spec: Problem Statement → Proposed Change → Knowledge Context → Constraints → Acceptance Criteria → Open Questions

El **`_manifest.json`** contiene el indice de todos los artifacts y sus cross-references:

```json
{
  "source": "document.md",
  "generated": "2026-05-20T10:00:00.000Z",
  "domain": "Markets & Trading",
  "summary": "...",
  "artifacts": [
    { "id": "ARCH-TRADE-001", "title": "...", "layer": "architecture", "file": "..." }
  ],
  "cross_references": [
    { "from": "FEAT-EXEC-001", "to": "ARCH-TRADE-001", "relation": "implements", "reason": "..." }
  ]
}
```

---

## Integracion con spec-graph

Tras la transformacion, valida y visualiza con [spec-graph](../spec-graph/):

```bash
# Validar frontmatter y dependencias
node ../spec-graph/spec-graph.mjs --specs _kdd_output validate

# Construir grafo de conocimiento
node ../spec-graph/spec-graph.mjs --specs _kdd_output build --html

# Buscar specs huerfanos
node ../spec-graph/spec-graph.mjs --specs _kdd_output orphans
```

---

## Formatos soportados

Cualquier formato basado en texto: `.md`, `.txt`, `.html`, `.xml`, `.json`, `.yaml`, `.yml`, `.csv`, `.tsv`, `.rst`, `.adoc`, `.tex`, `.sql`, `.graphql`, `.proto`, `.log`, `.cfg`, `.ini`, `.toml`, `.properties`.

Para formatos binarios (`.pdf`, `.docx`, `.pptx`), pre-convierte a texto/markdown o usa la Opcion A (Claude Code puede leer PDFs directamente).

---

## Uso programatico (libreria)

La libreria core es importable para scripts o integraciones:

```javascript
import {
  readDocument,
  analyzeDocument,
  generateSpec,
  transformDocument,
  scanExistingIds,
} from './kdd-transform-lib.mjs';

// Pipeline completo
const result = await transformDocument('path/to/doc.md', {
  apiKey: process.env.ANTHROPIC_API_KEY,
  domain: 'Payments',
  outDir: './output',
  onProgress: (event, data) => console.log(event, data),
});

// Paso a paso
const doc = readDocument('path/to/doc.md');
const plan = await analyzeDocument(doc, { apiKey: '...' });
const spec = await generateSpec(plan.artifacts[0], doc.content, { apiKey: '...' });
```

---

## Tips

- Usa `analyze` (CLI) o revisa el plan en Fase 1 (Claude Code) antes de generar. Ajusta con `--domain`/`--focus` si la descomposicion no encaja.
- Apunta `--specs-dir` a tu repositorio existente para que los IDs no colisionen.
- Los specs generados empiezan como `status: draft` y `confidence: low|medium`. Revisalos y promuevelos segun tu workflow de governance.
- El `_manifest.json` mapea directamente al campo `dependencies` del frontmatter, facilitando la integracion con el knowledge graph.

---

## Licencia

Herramienta interna. Parte del framework [spec-driven](../../CLAUDE.md) Knowledge-Driven Development.
