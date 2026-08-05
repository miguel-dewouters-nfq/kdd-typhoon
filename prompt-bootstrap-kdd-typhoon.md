# Prompt para bootstrappear COPILOT.md en KDD Typhoon

> **Instrucciones**: Copia TODO el contenido del bloque inferior y pégalo en el chat de Copilot (modo Agent) dentro del workspace del KDD de Typhoon.

---

## PROMPT A COPIAR ↓

```
Necesito que analices este workspace KDD (Knowledge Discovery & Documentation) sobre Typhoon y generes dos ficheros de contexto para Copilot, siguiendo exactamente el patrón de otro KDD que ya tengo montado (Asset Control).

## QUÉ HACER — Paso a paso

### Paso 1: Explorar el workspace
1. Lista la estructura completa del workspace (`list_dir` recursivo desde la raíz, incluyendo subcarpetas hasta 3 niveles de profundidad).
2. Identifica las carpetas principales: `specs/`, `apps/`, `docs/`, `tools/`, `estimaciones/`, `projects/`, `_build/`, y cualquier otra que exista.
3. Dentro de `specs/`, identifica las subcarpetas por capa: `architecture/`, `domain/`, `documentation/`, `feature/`, `work/`, `governance/`, `product/`.
4. Anota TODAS las carpetas y ficheros relevantes que encuentres.

### Paso 2: Leer TODAS las specs
1. Lee el frontmatter (primeras 30 líneas) de CADA fichero `.md` dentro de `specs/` (todas las subcarpetas, recursivamente).
2. Extrae de cada spec: `id`, `title`, `type`, `layer`, `depends_on`, `tags`, y el resumen del contenido.
3. Agrupa las specs por capa y por temática funcional.
4. **IMPORTANTE**: La arquitectura puede estar pendiente de validar — documenta lo que encuentres tal cual, indicando si hay specs marcadas como draft o pendientes.

### Paso 3: Revisar si existe `.github/copilot-instructions.md`
1. Comprueba si existe la carpeta `.github/` y el fichero `copilot-instructions.md`.
2. Si existe, léelo completo. Si no existe, lo crearemos desde cero.

### Paso 4: Leer documentación adicional
1. Lee los ficheros en `docs/` (si existe) para extraer contexto de dominio.
2. Si hay `apps/spec-graph/`, identifica los comandos de validación disponibles.
3. Si hay herramientas en `tools/`, documéntalas.
4. Lee cualquier README.md o COPILOT.md que ya exista en la raíz.

### Paso 5: Generar `COPILOT.md` en la raíz del workspace
Crea el fichero `COPILOT.md` en la raíz con EXACTAMENTE esta estructura (adaptando TODO el contenido a Typhoon):

```markdown
# COPILOT.md — [NOMBRE DEL DOMINIO] Unified AI Context

> **Nota**: Este contenido se carga automáticamente vía `.github/copilot-instructions.md`.
> Este fichero se mantiene como referencia legible para humanos.

## ⚠️ REGLA FUNDAMENTAL
1. SIEMPRE consultar `specs/` antes de responder sobre [DOMINIO].
2. Si la consulta involucra código fuente, consultar también los repositorios referenciados.
3. NO inventar terminología, nombres de tablas, procesos, flujos o componentes.
4. Citar specs (ID + ruta) en cada respuesta.
5. Ejecutar validación tras cambios: [COMANDO VALIDACIÓN SI EXISTE]

## Mapa del Workspace
[Tabla con TODAS las carpetas del workspace y su rol]

## Dominio: [NOMBRE]
[Descripción del dominio: qué es Typhoon, para qué sirve, qué datos gestiona, cuál es su papel en el ecosistema BBVA CIB]

### Datos gestionados
[Lista de tipos de datos que maneja el sistema]

### Componentes clave
[Lista de componentes principales: scripts, pipelines, servicios, tablas, módulos, etc.]

## Anclas por Tipo de Tarea
[Agrupar specs por temática funcional, con IDs de specs como anclas de navegación]
### [Tema 1]
- Subtema: `SPEC-ID-1`, `SPEC-ID-2`
### [Tema 2]
- Subtema: `SPEC-ID-3`, `SPEC-ID-4`
[... todas las temáticas relevantes]

## Mapa de IDs
[Tabla con prefijos de IDs, rangos, capa y descripción]

## Pipeline del Sistema
[Diagrama ASCII del flujo principal del sistema: fuentes → procesado → consumidores]

### [Flujos específicos con diagramas ASCII]

## Stack Técnico
[Tabla con componente y tecnología]

## Protocolo de Cambios
[Reglas de coherencia specs ↔ código]

## Validación
[Comandos bash disponibles para validar, construir grafo, estadísticas, impacto, huérfanas]

## Idioma
[Nota sobre idioma usado en las specs]

## Pitfalls
[Lista numerada de errores comunes, confusiones habituales, trampas del sistema]
```

### Paso 6: Crear `.github/copilot-instructions.md`
1. Crea la carpeta `.github/` si no existe.
2. Crea el fichero `.github/copilot-instructions.md`.
3. El contenido debe ser IDÉNTICO al de `COPILOT.md` pero con el header:
   ```
   # Copilot Instructions — [NOMBRE DEL DOMINIO] Unified AI Context
   ```
   (sin la nota de "este fichero se mantiene como referencia legible").
4. Este fichero es el que VS Code Copilot lee automáticamente como instrucciones de workspace.

## REGLAS CRÍTICAS

- **NO inventar** specs, IDs, nombres de tablas o componentes que no existan en el workspace.
- **CITAR** siempre el spec-ID y la ruta del fichero de donde sacas la información.
- **INCLUIR** todas las specs que encuentres — no omitir ninguna.
- **Specs pendientes de validar**: Si encuentras specs marcadas como draft, en progreso, o con datos parciales, inclúyelas igualmente indicando su estado.
- **Anclas por tarea**: Agrupar por temática funcional (ej: "Ingesta de datos", "Cálculos/Procesado", "Reporting", "Interfaces upstream/downstream", "Operativa batch", "Monitorización", etc.) — NO por capa técnica.
- **Pipeline**: Incluir diagrama ASCII del flujo principal fuentes → sistema → consumidores.
- **Pitfalls**: Incluir al menos 5 errores comunes o confusiones que detectes al leer las specs (si no hay suficientes, indica las que encuentres).
- **Stack técnico**: Extraer de las specs las tecnologías mencionadas (lenguajes, frameworks, BBDD, mensajería, planificador, SO, etc.).
- Si hay `apps/spec-graph/`, incluir los comandos de validación en la sección "Validación".
- Responder en español (términos técnicos en inglés donde corresponda).
- **Contexto Typhoon en BBVA CIB**: Typhoon es un sistema conocido en el ecosistema de BBVA CIB. Si las specs mencionan relaciones con otros sistemas (Asset Control, Murex, NTRiDA, ESB, etc.), documentarlas en las anclas y en el pipeline.

## EJEMPLO DE RESULTADO ESPERADO (fragmento)

Para que entiendas el nivel de detalle esperado, así es un fragmento del KDD de Asset Control ya montado:

```markdown
## Dominio: Asset Control

**Asset Control** es la plataforma de gestión de datos de mercado y precios de BBVA CIB. Funciona como:
- **Repositorio maestro de emisiones** (renta fija, renta variable, estructurados)
- **Fuente autoritativa** de datos para: NTRiDA/N2TR, Algorithmics, Murex...
- **Motor de cálculo** (Formula Engine) para derivar precios...

## Anclas por Tipo de Tarea

### Datos de mercado (curvas, tipos, volatilidades, spreads)
- Volatilidades FX: `ARCH-060`, `WRK-SPEC-003`
- Spreads sectoriales: `WRK-SPEC-019`, `WRK-SPEC-023`

### Emisiones / Maestro de instrumentos
- Pipeline Java difusión ME: `ARCH-065`, `ARCH-066`, `ARCH-067`, `ARCH-068`

## Mapa de IDs

| Prefijo | Rango | Capa | Descripción |
|---------|-------|------|-------------|
| `ARCH-` | 001–068 | architecture | Scripts, tablas, fórmulas, JARs... |
| `DOM-ASSET-` | 001–025 | domain | Sistemas externos, integraciones... |

## Pipeline del Sistema

┌─────────────┐     ┌──────────────────┐     ┌────────────────┐
│  FUENTES    │     │  ASSET CONTROL   │     │  CONSUMIDORES  │
│             │────▶│  Componentes     │────▶│  Downstream    │
└─────────────┘     └──────────────────┘     └────────────────┘

## Pitfalls
1. **TEPP8050S**: Los parámetros `-i` y `-f` son mutuamente excluyentes.
2. **ENVIOS_FLAG vs ENVIOS**: Son tablas distintas — FLAG controla X, ENVIOS controla Y.
```

## INSTRUCCIÓN FINAL

Genera los ficheros ahora. Muéstrame:
1. La estructura del workspace que has encontrado
2. La lista de specs identificadas (ID, título, capa)
3. El `COPILOT.md` generado
4. El `.github/copilot-instructions.md` generado
```

---

> **Nota**: El prompt está diseñado para crear `.github/copilot-instructions.md` desde cero. Si el workspace es muy grande, Copilot puede necesitar varios turnos para leer todas las specs.
