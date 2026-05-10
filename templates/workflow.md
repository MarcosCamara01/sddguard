# SDD Protocol — Workflow

This file defines how AI agents interact with this codebase.
Read it before starting any task.

---

## Execution Principles

These rules apply to every command. They are not suggestions.

1. **Surface assumptions** — before writing code, state what you're assuming. If something is unclear, stop and ask. Do not pick an interpretation silently. If a simpler approach exists, say so — push back when warranted.
2. **Minimum code** — implement only what was asked. No extra abstractions, no "while I'm here" cleanups, no speculative flexibility, no error handling for impossible scenarios. Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.
3. **Surgical changes** — touch only the lines the task requires. Do not reformat, rename, or refactor adjacent code. Match existing style, even if you'd do it differently. Remove imports, variables, and functions that *your* changes made unused — do not remove pre-existing dead code unless asked. Test: every changed line should trace directly to the user's request.
4. **Verify before moving on** — define what "done" looks like before you start. Transform vague tasks into verifiable goals: "Fix the bug" → "Write a test that reproduces it, then make it pass." Strong success criteria let you loop independently without constant clarification. A task isn't done until its verification passes.

---

## Commands

### /bootstrap
**Purpose:** Populate `.sdd/project-overview.md` and `.sdd/conventions.md` with real project context. Run once at project start, or when joining an existing codebase.

Two modes:

**New project — interview mode:**
Ask the following questions one at a time, waiting for a full answer before continuing:

1. What problem does this app solve? Who is it for?
2. What is the tech stack? (framework, database, auth, hosting, key libraries)
3. What are the explicit non-goals — what will this app intentionally NOT do?
4. Are there architecture decisions already made? (patterns, constraints, things that cannot change)
5. What are the main business domains? (e.g. auth, payments, orders, notifications)
6. What does "production ready" mean here? (performance targets, compliance, security requirements)

**Existing project — scan mode (`/bootstrap --scan`):**
Before asking anything, read the codebase:
- Project structure, `package.json` / dependency manifests, environment files
- Schema definitions, migration files, route declarations
- Main entry points and key components

Infer what you can from the code. Ask only about what the code cannot answer:
- Business intent behind models or patterns ("I see `Order` and `Product` — is this B2C or B2B?")
- Whether patterns are deliberate or shortcuts ("Is X intentional or a workaround?")
- Non-goals that aren't visible in code
- What "done" means for this team

⛔ **STOP. Present the full draft of `project-overview.md` and `conventions.md` for review before writing anything. Do not save files until both are explicitly approved.**

After approval:
- Write `.sdd/project-overview.md`
- Update `.sdd/conventions.md` with confirmed stack and patterns
- Update `CLAUDE.md` to reference `.sdd/project-overview.md`

---

### /ask
**Purpose:** Research and exploration. No code changes.

Use when: understanding a system, gathering context, analyzing options, investigating a bug.

Rules:
- Read files, search, analyze — never modify
- If the question has multiple valid interpretations, surface all of them; do not pick one silently
- If something is ambiguous or surprising, name it explicitly
- End with a clear summary and explicit options or recommendations
- Do NOT proceed to implementation without explicit instruction

---

### /assume
**Purpose:** Surface all assumptions before acting on a task.

Use when: before running /spec-plan, before a complex diagnosis in /bugfix, or any time you realize you're making an unstated guess about requirements, codebase state, or technical decisions.

Process:
1. List every assumption, numbered, in plain language
2. For each one: what you're assuming, why, and what would change if it's wrong
3. ⛔ **STOP — do not proceed until every assumption is confirmed or corrected**
4. After confirmation: update the relevant spec or plan to reflect any corrections

Format:
```
Assumptions for <task>:

1. **<assumption>** — because <reason>.
   If wrong: <what changes>.

2. **<assumption>** — because <reason>.
   If wrong: <what changes>.
```

Rules:
- No assumption is too obvious — name it anyway
- "I don't know X" is a valid assumption; it means the answer must be found before proceeding
- One wrong assumption can invalidate an entire plan — surface them cheap, not mid-execution

---

### /bugfix
**Purpose:** Lightweight flow for confirmed bugs.

Stages (in order, no skipping):
1. **Reproduce** — if the repo has a test suite, write a failing test that captures the bug before doing anything else. If no suite exists or a test is not feasible, document a deterministic minimal repro (exact steps, inputs, observed vs. expected output) and state explicitly why a test isn't viable. If the bug cannot be reproduced at all, STOP and report — do not guess at a fix.
2. **Diagnose** — identify the root cause, not the symptom. State the root cause in one sentence before proposing any fix. If you cannot, run /assume and surface what's missing.
3. **Fix** — the minimum change that addresses the stated root cause. Do not refactor surrounding code, rename adjacent symbols, tidy formatting, or fix unrelated issues you notice along the way (note them, don't fix them).
4. **Validate** — the failing test from Reproduce now passes, and the full suite is green. If Reproduce used a manual repro, walk it again and confirm the original symptom is gone.

Stop points:
- After Reproduce: if unable to reproduce, STOP and report
- After Diagnose: if fix scope exceeds ~1 file or ~50 lines, escalate to /spec-new

---

### /refactor
**Purpose:** Restructure code without changing external behavior.

The invariant: every observable behavior before the refactor must be identical after it.

Process:
1. Run existing tests — establish a green baseline; if any fail, fix them first as a separate /bugfix
2. Run /assume — list structural assumptions: file dependencies, public interfaces, callers
3. Define scope: which files change, which stay untouched
4. Implement in small steps; run tests after each step — they must stay green throughout
5. Run /finish when done

Rules:
- No new features, no bug fixes mixed in — if you find a bug, note it; don't fix it now
- No new tests for new behavior — only tests that verify unchanged behavior
- If tests go red mid-refactor, revert the last step immediately; do not continue on a red baseline
- If scope expands beyond the original definition, STOP and escalate to /spec-new

⛔ If the refactor reveals a structural problem that requires new behavior to fix properly, stop and escalate to /spec-new.

---

### /spec-new
**Purpose:** Scaffold a spec folder for a feature or significant change.

Process:
1. Create `specs/<name>/` directory
2. Copy `specs/_template/1-requirements.md` → `specs/<name>/1-requirements.md`
3. Copy `specs/_template/2-plan.md` → `specs/<name>/2-plan.md`
4. Copy `specs/_template/3-tasks.md` → `specs/<name>/3-tasks.md`
5. Replace `<Feature Name>` in each file title with the actual feature name

Then: fill out `1-requirements.md` before running /spec-plan

---

### /spec-plan
**Purpose:** Generate a technical plan from an approved requirements doc.

Input: completed `specs/<name>/1-requirements.md`

Process:
1. Read requirements and acceptance criteria
2. Run /assume — list every assumption about requirements, codebase state, and technical decisions; STOP and wait for confirmation before continuing
3. Consider the simplest approach that satisfies the requirements; if you reject it, explain why
4. Analyze codebase impact
5. Define abort criteria: conditions under which tasks must stop and return to planning
6. Draft technical plan in `specs/<name>/2-plan.md`

⛔ **STOP HERE. Do not write any code until the plan is explicitly approved.**

The plan must include:
- Goals coverage — which goal IDs (G1, G2…) from requirements this plan addresses, and which are out of scope
- Explicit assumptions — confirmed via /assume before drafting
- The simplest viable approach and why it was chosen or rejected
- Tradeoffs — conscious sacrifices the chosen approach makes (write "none" if there are none)
- Components affected (files, modules, services)
- New artifacts (files, types, schemas, migrations)
- What the plan explicitly does NOT do (mirrors non-goals)
- External dependencies, if any
- Risks and open questions — unresolved items block approval
- Abort criteria — conditions that trigger a stop and return to planning
- Verification criteria for each task (define "done" before executing)
- Estimated task count

---

### /spec-tasks
**Purpose:** Execute an approved plan as atomic tasks.

Input: approved `specs/<name>/2-plan.md`

Rules:
- One task at a time — complete it fully before moving to the next
- **Before writing implementation code for each task: write the test that defines "done" first.** It must fail (red) before any implementation exists
- Implement until that test passes (green), then run the full test suite to catch regressions
- Do NOT batch tasks or run ahead
- Each task touches only what it requires — no cleanup of adjacent code, no style fixes, no refactors of nearby functions
- If you notice something broken or worth improving nearby, note it in the spec — do not fix it now
- If a task reveals new scope, STOP and update the plan before continuing

Generates / updates: `specs/<name>/3-tasks.md` checklist

---

### /review
**Purpose:** Final audit before closing a spec or merging.

Checks:
- All tasks in `3-tasks.md` are marked complete
- Every goal (G1, G2…) in `1-requirements.md` is satisfied by the implementation
- Every scenario in `1-requirements.md` has a test that covers it and passes
- Tests pass (full suite, not just the new ones)
- No leftover debug code or TODO comments
- Conventions in `.sdd/conventions.md` are followed
- No out-of-scope changes were introduced
- No speculative features, unused abstractions, or "just in case" code
- Every changed line traces directly to the user's request — if not, explain why
- The implementation is the simplest one that satisfies the requirements — if it's more complex, justify it

---

### /finish
**Purpose:** Stage changed files and produce a conventional commit message for approval.

Process:
1. Run `git status` — identify changed, added, and deleted files
2. Run `git diff` (staged and unstaged) — read the actual changes in detail
3. Exclude files that must not be committed: `.env*`, build artifacts, scratch files, editor state
4. Stage all relevant files with `git add`
5. Determine the commit type from the changes:
   - `feat` — new feature or user-visible capability
   - `fix` — bug fix
   - `refactor` — restructuring without behavior change
   - `docs` — documentation only
   - `test` — adding or updating tests
   - `chore` — build, tooling, dependencies, config
   - `style` — formatting, no logic change
   - `perf` — performance improvement
6. Draft commit message following the format below

⛔ **STOP. Present the staged file list and the proposed commit message. Do not commit until explicitly approved.**

Commit format:
```
<type>(<scope>): <short summary, imperative mood, max 72 chars>

<One sentence that frames the overall change — what it adds or fixes
 at a high level, and why it matters.>

- <Specific change — what was added/modified and the reasoning or
  tradeoff behind the decision.>
- <Specific change — include method names, file paths, component names
  when they clarify what was touched.>
- <Specific change — explain exclusions and edge cases explicitly:
  "X is intentionally excluded because Y".>

<Footer — notable technical context that isn't obvious from the diff:
 migration notes, performance tradeoffs, deliberate design decisions,
 known limitations. Not required if there's nothing non-obvious.>
```

Rules for the message:
- Summary line: imperative mood (`add`, `fix`, `remove`, `update`), lowercase, no trailing period
- Scope: the domain or module most affected (`auth`, `cli`, `payments`, `spec`)
- Overview sentence: one sentence only — frames the "what and why" at the highest level
- Bullets: one per logical unit of change; name real identifiers (functions, files, endpoints); explain the *why* behind each decision, not just the *what*
- Explicit exclusions belong in the bullets: "X is intentionally excluded because Y"
- Footer: non-obvious context only — migration decisions, deliberate tradeoffs, known caveats
- If changes are unrelated, propose splitting into multiple commits

---

## Ceremony Levels

| Change size | Required flow |
|---|---|
| Typo / comment | Direct — no ceremony |
| Bug (< ~50 lines, 1 file) | /bugfix → /finish |
| Refactor (no behavior change) | /refactor → /finish |
| Feature | /spec-new → /spec-plan → /spec-tasks → /review → /finish |
| Architecture change | /spec-new → /spec-plan (mandatory human review) → /spec-tasks → /review → /finish |

## Stop Points (Non-Negotiable)

1. **Unclear requirements** — stop, ask via /ask, do not assume
2. **Unvalidated assumptions** — run /assume before /spec-plan; if a confirmed assumption turns out false mid-execution, stop and re-plan
3. **After /spec-plan** — never proceed to tasks without explicit approval
4. **Abort criterion triggered** — when any condition in the plan's Abort Criteria is met, stop immediately and return to /spec-plan
5. **Scope creep detected** — stop, report, get a decision before continuing
6. **Test failure during /spec-tasks** — stop, fix the failure before the next task
