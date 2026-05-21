# Bugfix prompts — sddx-workflow

Copia el bloque entre `▼▼▼` y `▲▲▲` de un bug y pégalo en un chat nuevo de Claude Code en este repo.

## Estado

| Bug | Severidad | Título | Estado |
|---|---|---|---|
| B-01 | MED | `npm run build` falla en Windows (chmod) | ✅ commit `07d8a61` |
| **B-02** | **HIGH** | `doctor` nunca exit ≠ 0 | ⬜ pendiente |
| **B-03** | **MED** | `status` FAIL regex false-positive | ⬜ pendiente |
| B-08 | MED | `init` skipea pre-existing foreign `workflow.md` | ⬜ pendiente |
| B-04 | MED | `commands` description engaña | ⬜ pendiente |
| P-01 | LOW | `/spec-conflicts` incluye specs done pero no movidos | ⬜ pendiente |
| P-02 | LOW | `/assume` no dice dónde aterrizan assumptions | ⬜ pendiente |
| P-03 | LOW | `/review` warnings ack no se persiste | ⬜ pendiente |
| B-07 | LOW | Drift en `/finish` entre providers | ⬜ pendiente |
| B-05 | LOW | `add domain` con lista cerrada de 4 | ⬜ pendiente |
| B-06 | LOW | `init` sin TTY instala todos en silencio | ⬜ pendiente |

---
---
---

# 🐛 B-02 — `doctor` nunca exit ≠ 0  *(HIGH)*

▼▼▼ COPIA TODO ESTO EN UN CHAT NUEVO ▼▼▼

# Tarea: arreglar B-02 en sddx-workflow

## TL;DR

`sddx-workflow doctor` se vende como "check installation health" para uso en CI gates. Pero la variable `issues` declarada en `doctor.ts:43` se declara y nunca recibe push — solo `warnings` se llena. Resultado: una install rota (falta `conventions.md`, falta proveedor entero) reporta `warn` y exit 0. Cualquier CI que use `doctor` como gate tiene un no-op silencioso.

Corresponde `/bugfix → /finish`. ~10 líneas modificadas en 1 archivo.

## Contexto del repo

- **Path:** `c:\Users\marco\togga\sddx-workflow`
- **Versión:** 0.10.0
- **OS:** Windows 11, PowerShell 5.1
- **Estado SDD:** ya instalado (verifica con `Test-Path .sdd`). Si no existe, ejecuta `node dist/cli.js init --provider claude-code` + `/bootstrap --scan` antes.
- **Pre-existente:** `.agents/skills/blog-writing-guide/` (untracked, NO la toques).
- **QA docs (background):** `QA_REPORT.md`, `WORKFLOW_REVIEW.md`.

## El bug

**Archivo:** [src/commands/doctor.ts:43-100](src/commands/doctor.ts#L43-L100)

```ts
export function doctorCommand(): void {
  const cwd = process.cwd();
  const issues: string[] = [];      // L43 — nunca recibe push
  const warnings: string[] = [];
  // L64-66: missingCore → warnings.push
  // L70-72: providers.length === 0 → warnings.push
  // L73-77: provider partial → warnings.push
  // L81-83: obsolete → warnings.push
  if (issues.length > 0) process.exit(1);   // L100 — inalcanzable
}
```

**Repro:**
```bash
mkdir broken && cd broken
node ../dist/cli.js init --provider claude-code
del .sdd\conventions.md
node ../dist/cli.js doctor
# warn   Missing core file: .sdd/conventions.md
# Exit code: 0   ← debería ser 1
```

**Root cause:** todo se clasifica como warning. La rama de exit 1 es inalcanzable.

**Fix propuesto** — reparto warnings → issues por gravedad:

| Condición | Hoy | Debería |
|---|---|---|
| Missing core file | warning | **issue** (protocolo roto) |
| `providers.length === 0` | warning | **issue** (agent no puede usar nada) |
| Provider partially installed | warning | warning (degraded, no roto) |
| Obsolete files | warning | warning (cleanup) |

**Cambios concretos:**

Línea ~64-66:
```ts
for (const missing of missingCore) {
  issues.push(`Missing core file: ${missing}`);   // antes: warnings.push
}
```

Línea ~70-72:
```ts
if (providers.length === 0) {
  issues.push('No provider files detected. Run `npx sddx-workflow init --provider <id>` or `npx sddx-workflow init --all`.');
}
```

Provider partial (~73-77) y obsolete (~81-83) NO se tocan.

## Pasos

1. **`/bugfix`** con bug or error:
   ```
   sddx-workflow doctor never exits non-zero even when the install is broken because the issues array is declared but never populated
   ```
2. 4 stages: Reproduce (usa repro arriba), Diagnose ("L43 declara `issues` pero L64/71 push a `warnings`; L100 inalcanzable"), Fix (los 2 cambios listados), Validate (repro: exit 1; install limpia: exit 0).
3. **`/finish`** — tipo `fix(doctor)`. ⛔ STOP antes del commit.

## Reglas

1. Solo este bug.
2. NO toques warnings legítimos (partial provider, obsolete).
3. No adjacent cleanup en `providerHealth()` ni `OBSOLETE_PATHS`.
4. Lee `.sdd/workflow.md` antes de slash commands.
5. `/finish` ⛔ STOP no negociable.

## Done criteria

- `doctor` exit 1 cuando falta `.sdd/conventions.md`
- `doctor` exit 1 cuando no hay providers detectados
- `doctor` exit 0 sigue siendo el happy path
- Partial provider sigue siendo warning + exit 0
- 1 commit conventional

▲▲▲ FIN B-02 ▲▲▲

---
---
---

# 🐛 B-03 — `status` FAIL regex false-positive  *(MED)*

▼▼▼ COPIA TODO ESTO EN UN CHAT NUEVO ▼▼▼

# Tarea: arreglar B-03 en sddx-workflow

## TL;DR

`status` infiere el phase de un spec leyendo `verify-report.md`. Si el report contiene "fail" en cualquier parte (incluido `fail 0` del resumen de `npm test`), `status` dice "verify failed" — falso positivo sobre reports PASS. Rompe el acoplamiento CLI↔agente vía `status`.

Corresponde `/bugfix → /finish`. ~5 líneas en 1 archivo.

## Contexto del repo

- **Path:** `c:\Users\marco\togga\sddx-workflow`
- **Versión:** 0.10.0
- **OS:** Windows 11
- **Estado SDD:** ya instalado.

## El bug

**Archivo:** [src/commands/status.ts:80](src/commands/status.ts#L80)

```ts
const verify = fs.readFileSync(verifyFile, 'utf8');
return /\bFAIL\b/i.test(verify) ? 'verify failed' : 'review pending';
```

**Síntoma:**
- Verify report con `## Conclusion ... PASS ...` que en otra sección contiene `npm test reports pass 11, fail 0` → status dice "verify failed" (FALSO POSITIVO)
- Verify report con `## Conclusion ... FAIL ...` → status dice "verify failed" (TRUE POSITIVE — el regex sí caza el caso real, lo cual explica por qué se tomó el atajo)

**Root cause:** regex case-insensitive matchea "fail" en CUALQUIER parte: test output (`fail 0`), comentarios del template ("If FAIL, name each failing check…"), texto narrativo describiendo failure conditions.

**Fix propuesto:** anclar al `## Conclusion`, FAIL al inicio de línea:

```ts
const verify = fs.readFileSync(verifyFile, 'utf8');
const conclusion = verify.match(/##\s+Conclusion[\s\S]*$/i)?.[0] ?? '';
return /^\s*\*?\*?FAIL\b/im.test(conclusion) ? 'verify failed' : 'review pending';
```

- `match(/##\s+Conclusion[\s\S]*$/i)` extrae sección Conclusion hasta fin del file
- `/^\s*\*?\*?FAIL\b/im` matchea FAIL al inicio de línea dentro de esa sección, opcionalmente bold (`**FAIL**`)
- Sin Conclusion → conclusion='' → "review pending" (default razonable)

## Pasos

1. **`/bugfix`** con bug or error:
   ```
   sddx-workflow status reports 'verify failed' on PASS verify reports because the FAIL regex matches the word 'fail' anywhere in the report (including 'fail 0' from npm test output)
   ```
2. 4 stages: Reproduce (escribe report con `## Conclusion PASS` + `fail 0` en otra sección, status reporta "verify failed"), Diagnose, Fix (reemplaza las 2 líneas), Validate (false-positive desaparece, real FAIL sigue cazándose).
3. **`/finish`** — tipo `fix(status)`. ⛔ STOP antes del commit.

## Reglas

1. Solo este bug.
2. NO refactor `inferPhase` ni `readSpec`.
3. NO añadas tests (no hay suite).
4. Lee `.sdd/workflow.md`.

## Done criteria

- Report PASS con "fail 0" textual → `status` dice "review pending"
- Report FAIL real → `status` dice "verify failed"
- Report sin Conclusion → `status` dice "review pending"
- 1 commit `fix(status)`

▲▲▲ FIN B-03 ▲▲▲

---
---
---

# 🐛 B-08 — `init` skipea pre-existing foreign `workflow.md`  *(MED)*

▼▼▼ COPIA TODO ESTO EN UN CHAT NUEVO ▼▼▼

# Tarea: arreglar B-08 en sddx-workflow

## TL;DR

`init` skipea archivos pre-existentes (correcto — preserva user work). Pero NO comprueba contenido. Si un usuario tiene `.sdd/workflow.md` de OTRO tool con mismo nombre, init lo respeta, instala `CLAUDE.md` + `.claude/commands/*`, y el usuario cree tener sddx mientras el agente sigue protocolo foráneo. `doctor` no lo detecta (solo checkea existencia).

Fix: marker check en `doctor` (warning si workflow.md no empieza con `# SDD Protocol`).

Corresponde `/bugfix → /finish`. ~15 líneas en 1 archivo.

## Contexto del repo

- **Path:** `c:\Users\marco\togga\sddx-workflow`
- **Versión:** 0.10.0
- **OS:** Windows 11
- **Estado SDD:** ya instalado.

## El bug

**Archivo:** [src/commands/doctor.ts](src/commands/doctor.ts)

**Repro:**
```bash
mkdir foreign-tool-test && cd foreign-tool-test
mkdir .sdd
echo "# Some other tool's protocol" > .sdd/workflow.md
node ../dist/cli.js init --provider claude-code
# init reporta "skip .sdd/workflow.md" (correcto)
node ../dist/cli.js doctor
# "ok installation looks healthy" — pero el workflow.md es FORÁNEO
```

El template real empieza con `# SDD Protocol — Workflow` (línea 1 de `templates/workflow.md`). Cualquier otro contenido = foreign.

**Fix propuesto** — tras los checks existentes en `doctorCommand()` (missing core, providers, obsolete), añadir:

```ts
// Marker check: confirm .sdd/workflow.md is from sddx-workflow
const workflowPath = path.join(cwd, '.sdd/workflow.md');
if (fs.existsSync(workflowPath)) {
  const firstLine = fs.readFileSync(workflowPath, 'utf8').split('\n')[0]?.trim() ?? '';
  if (!firstLine.startsWith('# SDD Protocol')) {
    warnings.push(
      `.sdd/workflow.md does not look like an sddx-workflow file (header: "${firstLine.slice(0, 60)}"). ` +
      `Was it from a different tool? Run \`npx sddx-workflow init --force\` to replace it.`
    );
  }
}
```

Decisión: **warning, no issue.** El archivo existe y podría estar customizado legítimamente; sugerir `--force` es no-destructivo.

## Pasos

1. **`/bugfix`** con bug or error:
   ```
   sddx-workflow init silently skips a pre-existing .sdd/workflow.md even if it came from a different tool, and doctor doesn't detect the mismatch because it only checks file existence
   ```
2. 4 stages: Reproduce (repro arriba), Diagnose, Fix (añade marker check tras `obsolete` en `doctor.ts`), Validate (foreign workflow → warning visible; install limpia → "ok").
3. **`/finish`** — tipo `fix(doctor)`. ⛔ STOP.

## Reglas

1. Solo este bug.
2. NO repliques el check en `init.ts` (cambio mínimo — doctor como guardian).
3. NO refactor `OBSOLETE_PATHS` ni `providerHealth()`.
4. NO toques templates.

## Done criteria

- doctor con foreign workflow.md → warning visible
- doctor con install limpia → "ok"
- 1 commit `fix(doctor)`

▲▲▲ FIN B-08 ▲▲▲

---
---
---

# 🐛 B-04 — `commands` description engaña  *(MED)*

▼▼▼ COPIA TODO ESTO EN UN CHAT NUEVO ▼▼▼

# Tarea: arreglar B-04 en sddx-workflow

## TL;DR

`commands` description dice "List agent commands installed by provider integrations". La implementación lista 20 nombres hardcoded sin inspeccionar `cwd`. Discrepancia doc-vs-reality.

**Recomendado:** opción A (rename description, 1 línea). Opción B (scan cwd, ~30 líneas) solo si quieres feature nueva.

## Contexto del repo

- **Path:** `c:\Users\marco\togga\sddx-workflow`
- **Estado SDD:** ya instalado.

## El bug

**Archivos:**
- [src/cli.ts:53](src/cli.ts#L53) — description
- [src/commands/commands.ts](src/commands/commands.ts) — implementación (estática)

```ts
// cli.ts:53
program.command('commands')
  .description('List agent commands installed by provider integrations')
  .action(commandsCommand);

// commands.ts (entero)
import { COMMAND_NAMES } from './command-names';
export function commandsCommand(): void {
  for (const name of COMMAND_NAMES) console.log(`  /${name}`);
}
```

**Repro:** corre `node dist/cli.js commands` en un dir vacío (sin .sdd, sin providers) — lista los 20 igual.

## Decisión: A o B

**Opción A — rename description (mínimo).** 1 línea. Cambia a:
```ts
.description('List the agent commands defined by the SDD protocol')
```

**Opción B — implement scan (feature).** ~30 líneas. Modifica `commandsCommand()` para inspeccionar `.claude/commands/*.md`, `.agents/skills/*/SKILL.md`, etc. Fallback al catálogo estático sin .sdd.

**Decide ANTES de empezar.** Recomendado: A. Es reversible si después quieres B.

## Pasos

1. **`/bugfix`** (Opción A) con bug or error:
   ```
   sddx-workflow commands description claims it lists installed commands but the implementation is static — rename the description to match reality
   ```
2. 4 stages: Reproduce, Diagnose ("commands.ts no inspecciona cwd, description promete lo contrario"), Fix (rename), Validate (`commands --help` muestra description nueva).
3. **`/finish`** — tipo `docs(cli)` o `fix(cli)`.

Si eliges B: NO uses `/bugfix`, es feature. Usa `/spec-new commands-scan`. Out of scope de este prompt.

## Reglas

1. Decide A vs B ANTES de empezar.
2. Opción A: cambio mínimo en cli.ts.
3. NO toques `command-names.ts` ni `commands.ts` salvo Opción B.

## Done criteria

- `commands --help` muestra description sin promesa falsa
- 1 commit

▲▲▲ FIN B-04 ▲▲▲

---
---
---

# 🐛 P-01 — `/spec-conflicts` incluye specs done pero no movidos  *(LOW, doc-only)*

▼▼▼ COPIA TODO ESTO EN UN CHAT NUEVO ▼▼▼

# Tarea: arreglar P-01 en sddx-workflow (doc-only)

## TL;DR

`/spec-conflicts` flaguea overlaps entre specs activos. "Activo" = no movido a `_done/`. Un spec verificado con PASS pero no movido manualmente sigue contando y aparece en la tabla, contaminando el output.

Fix de doc: 1 línea en workflow.md. **Direct edit + `/finish`**, no `/bugfix`.

## Contexto del repo

- **Path:** `c:\Users\marco\togga\sddx-workflow`
- **Estado SDD:** ya instalado.

## El bug

**Archivo:** [templates/workflow.md](templates/workflow.md) §/spec-conflicts (~líneas 402-413)

Estado actual del Rules:
```markdown
Rules:
- Detection only — resolution is always human-decided
- "Components Affected" is the source of truth; if a plan understates its surface, conflicts will be missed
```

**Fix:** añadir nueva regla al final del bloque Rules de `/spec-conflicts`:

```markdown
- Specs whose `3-tasks.md` is fully checked (all `[x]`) are excluded even
  if not yet moved to `_done/` — moving is a human action and conflict
  detection should not block on it.
```

## Pasos

1. **Direct edit** en `templates/workflow.md` §/spec-conflicts Rules. Sin `/bugfix` (es doc per Default Flow).
2. **`/finish`** — tipo `docs(workflow)`.

## Reglas

1. Solo edita §/spec-conflicts. NO toques otras secciones.
2. Tras el edit, NO rebuild necesario (templates se distribuyen tal cual).

## Done criteria

- workflow.md §/spec-conflicts Rules incluye la nueva regla
- 1 commit `docs(workflow)`

▲▲▲ FIN P-01 ▲▲▲

---
---
---

# 🐛 P-02 — `/assume` no dice dónde aterrizan assumptions confirmadas  *(LOW, doc-only)*

▼▼▼ COPIA TODO ESTO EN UN CHAT NUEVO ▼▼▼

# Tarea: arreglar P-02 en sddx-workflow (doc-only)

## TL;DR

`/assume` prescribe listar assumptions, ⛔ STOP, "update the relevant spec or plan". Pero NO dice DÓNDE aterrizan las confirmadas. Default razonable es `2-plan.md §Assumptions`. Fix de doc: 1 línea.

**Direct edit + `/finish`.**

## Contexto del repo

- **Path:** `c:\Users\marco\togga\sddx-workflow`
- **Estado SDD:** ya instalado.

## El bug

**Archivo:** [templates/workflow.md](templates/workflow.md) §/assume

Estado actual:
```markdown
4. After confirmation: update the relevant spec or plan to reflect any corrections
```

**Fix:**
```markdown
4. After confirmation: confirmed assumptions land in `2-plan.md §Assumptions`.
   If running /assume mid-/spec-tasks (after plan approval), append via
   /spec-amend rather than editing the approved plan directly.
```

## Pasos

1. **Direct edit** en `templates/workflow.md` §/assume Process step 4.
2. **`/finish`** — tipo `docs(workflow)`.

## Done criteria

- workflow.md §/assume step 4 especifica el destino
- 1 commit `docs(workflow)`

▲▲▲ FIN P-02 ▲▲▲

---
---
---

# 🐛 P-03 — `/review` warnings ack no se persiste  *(LOW, doc-only)*

▼▼▼ COPIA TODO ESTO EN UN CHAT NUEVO ▼▼▼

# Tarea: arreglar P-03 en sddx-workflow (doc-only)

## TL;DR

`/review` per §Permissions no crea archivos. Cuando proceeds "after explicit acknowledgement of remaining warnings", el ack vive solo en chat context. Sesión termina = ack se pierde. Fix: prescribir que el ack se resuma como postscript en `verify-report.md §Advisory`.

**Direct edit + `/finish`.**

## Contexto del repo

- **Path:** `c:\Users\marco\togga\sddx-workflow`
- **Estado SDD:** ya instalado.

## El bug

**Archivo:** [templates/workflow.md](templates/workflow.md) §/review Rules

**Fix** — añade nueva regla al final del bloque Rules de `/review`:

```markdown
- If `/review` proceeds with acknowledged warnings (rather than a green
  /verify), append a one-line postscript to `verify-report.md §Advisory`
  recording the date and the warning(s) explicitly acknowledged. Keeps
  the audit trail intact across sessions.
```

## Pasos

1. **Direct edit** en `templates/workflow.md` §/review Rules.
2. **`/finish`** — tipo `docs(workflow)`.

## Done criteria

- workflow.md §/review Rules incluye la nueva regla
- 1 commit `docs(workflow)`

▲▲▲ FIN P-03 ▲▲▲

---
---
---

# 🐛 B-07 — drift en `/finish` entre providers  *(LOW)*

▼▼▼ COPIA TODO ESTO EN UN CHAT NUEVO ▼▼▼

# Tarea: arreglar B-07 en sddx-workflow

## TL;DR

5 providers tienen archivos per-comando para `/finish`. Claude + Codex son terse; Copilot + Gemini + Windsurf son más detallados (incluyen `.env*` exclusion, describen el formato del mensaje). Funcionalmente equivalente (todos delegan a workflow.md) pero asimétrico al "first glance" del agente.

Fix: copiar la versión detallada a Claude + Codex. **Direct edit + `/finish`.** 2 archivos.

## Contexto del repo

- **Path:** `c:\Users\marco\togga\sddx-workflow`
- **Estado SDD:** ya instalado.

## El bug

**Archivos:**
- [templates/claude-commands/finish.md](templates/claude-commands/finish.md)
- [templates/codex-skills/finish/SKILL.md](templates/codex-skills/finish/SKILL.md)

**Versión terse actual (Claude + Codex):**
```
Run git status and git diff. Stage all relevant files. Determine the commit type.
Draft a conventional commit message following the format in workflow.md.
```

**Versión detallada (ya en Copilot + Gemini + Windsurf):**
```
Run git status and git diff. Stage all relevant files (exclude .env*, build artifacts, scratch files). Determine the commit type. Draft a conventional commit message following the format in workflow.md — one overview sentence, detailed bullets with reasoning, optional footer for non-obvious context.
```

**Fix:** copia la versión detallada a Claude + Codex, **preservando el formato del archivo** (Codex tiene frontmatter YAML, Claude no).

Claude (`templates/claude-commands/finish.md`) — sin frontmatter:
```markdown
Execute the /finish command defined in .sdd/workflow.md.

Run git status and git diff. Stage all relevant files (exclude .env*, build artifacts, scratch files). Determine the commit type. Draft a conventional commit message following the format in workflow.md — one overview sentence, detailed bullets with reasoning, optional footer for non-obvious context.

Stop and present the staged file list and commit message for approval before committing.
```

Codex (`templates/codex-skills/finish/SKILL.md`) — preserva el frontmatter existente:
```markdown
---
name: finish
description: Stage changed files and produce a conventional commit message for approval. Use after completing any unit of work — bug fix, refactor, or feature tasks.
---

Execute the /finish command defined in .sdd/workflow.md.

Run git status and git diff. Stage all relevant files (exclude .env*, build artifacts, scratch files). Determine the commit type. Draft a conventional commit message following the format in workflow.md — one overview sentence, detailed bullets with reasoning, optional footer for non-obvious context.

Stop and present the staged file list and commit message for approval before committing.
```

## Pasos

1. **Direct edit** (2 archivos).
2. **`/finish`** — tipo `docs(templates)`.

## Reglas

1. Otros comandos también tienen drift parecido. NO los arregles aquí — un commit por concern.

## Done criteria

- 5 versiones del prompt `finish` semánticamente equivalentes
- 1 commit `docs(templates)`

▲▲▲ FIN B-07 ▲▲▲

---
---
---

# 🐛 B-05 — `add domain` con lista cerrada de 4  *(LOW)*

▼▼▼ COPIA TODO ESTO EN UN CHAT NUEVO ▼▼▼

# Tarea: arreglar B-05 en sddx-workflow

## TL;DR

`add domain <name>` solo acepta `auth | payments | storage | email`. Otros nombres (`tasks`, `users`, `notifications`, …) rechazados. README implica extensibilidad sin decirla explícita.

**Recomendado:** opción A (mejorar error + documentar). ~5 líneas en `add.ts` + 1 en README.

## Contexto del repo

- **Path:** `c:\Users\marco\togga\sddx-workflow`
- **Estado SDD:** ya instalado.

## El bug

**Archivo:** [src/commands/add.ts:5-10](src/commands/add.ts#L5-L10)

```ts
const DOMAIN_MAP: Record<string, string> = {
  auth: 'domains/auth.md',
  payments: 'domains/payments.md',
  storage: 'domains/storage.md',
  email: 'domains/email.md',
};
```

**Fix (opción A)** — mejorar error + actualizar README:

En `add.ts`:
```ts
if (!templateSrc) {
  const available = Object.keys(DOMAIN_MAP).join(', ');
  console.error(`  error    Unknown domain "${name}". Built-in templates: ${available}.`);
  console.error(`  hint     For other domains, create .sdd/domains/${name}.md manually.`);
  process.exit(1);
}
```

En README sección "CLI reference":
```diff
- npx sddx-workflow add domain auth       # add a domain context file (.sdd/domains/auth.md)
-                                         # also: payments, storage, email
+ npx sddx-workflow add domain auth       # add a built-in domain template
+                                         # built-in: auth, payments, storage, email
+                                         # for custom domains, create .sdd/domains/<name>.md manually
```

## Pasos

1. **`/bugfix`** con bug or error:
   ```
   sddx-workflow add domain rejects custom names without explaining the template list is closed
   ```
2. 4 stages.
3. **`/finish`** — tipo `docs(cli)` o `fix(cli)`.

## Reglas

1. Opción A (mínima). No implementes scan/extensibilidad aquí.

## Done criteria

- `add domain tasks` falla con hint claro de cómo crear manualmente
- README actualizado
- 1 commit

▲▲▲ FIN B-05 ▲▲▲

---
---
---

# 🐛 B-06 — `init` sin TTY instala todos en silencio  *(LOW)*

▼▼▼ COPIA TODO ESTO EN UN CHAT NUEVO ▼▼▼

# Tarea: arreglar B-06 en sddx-workflow

## TL;DR

`init` sin flags + sin TTY instala los 7 providers silenciosamente. Razonable como default para CI, pero **undocumented**. Un usuario piping `init` por error obtiene 7 providers instalados.

**Recomendado:** documentar (path A). NO cambiar comportamiento (rompería scripts CI existentes).

## Contexto del repo

- **Path:** `c:\Users\marco\togga\sddx-workflow`
- **Estado SDD:** ya instalado.

## El bug

**Archivo:** [src/commands/init.ts:34-36](src/commands/init.ts#L34-L36)

```ts
if (!process.stdout.isTTY) {
  return ALL_PROVIDER_IDS;
}
```

**Fix (documentación)** — en `src/cli.ts` añadir `.addHelpText('after', ...)`:

```ts
program
  .command('init')
  .description('Initialize SDD protocol in the current project')
  .option('--force', 'Overwrite files that already exist')
  .option('--existing', 'Brownfield mode: ...')
  .option('--provider <ids>', '...')
  .option('--all', 'Install all provider integrations without prompting')
  .addHelpText('after', '\nNon-TTY default:\n  When stdin/stdout is not a TTY (CI, piped scripts), init defaults\n  to installing every provider — equivalent to --all. Pass --provider to limit.\n')
  .action(initCommand);
```

En README sección CLI reference, añadir:
```markdown
> **Non-TTY default:** When stdin/stdout is not a TTY (CI, piped scripts),
> `init` without flags installs every provider — equivalent to `--all`.
> Pass `--provider` explicitly to limit.
```

## Pasos

1. **`/bugfix`** con bug or error:
   ```
   sddx-workflow init silently selects all providers when stdin/stdout is not a TTY, and this default is undocumented
   ```
2. 4 stages. Fix: addHelpText en cli.ts + README edit.
3. **`/finish`** — tipo `docs(cli)`.

## Reglas

1. NO cambies comportamiento (path b) — rompería scripts CI existentes.
2. Solo documenta.

## Done criteria

- `node dist/cli.js init --help` muestra "Non-TTY default" block
- README documenta el comportamiento
- 1 commit `docs(cli)`

▲▲▲ FIN B-06 ▲▲▲
