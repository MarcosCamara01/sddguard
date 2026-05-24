# SDD Workflow Audit Report

Date: 2026-05-23
Repo: `sddx-workflow`
Version observed: `0.10.0`
Evidence root: `/tmp/sddx-workflow-audit-2026-05-23-0oJweA/`

## Executive Summary

This audit was run from scratch. The report file was deleted before testing, and the project context files were rewritten from current repository evidence.

The CLI is small, readable, and materially safer than a typical template copier: `init --force` preserves project-owned SDD context and provider entrypoints, `update --check` has useful CI semantics, `doctor` now fails for partial providers, and the test suite covers install/update/status/gate/commands surfaces plus an end-to-end workflow fixture. The packaging story is also clean.

The hard truth remains: no Markdown protocol can physically stop an AI that ignores instructions. The remediation pass adds executable gates (`gate`, `status --strict`, stricter `doctor`, and `commands --installed`) so obedient agents and CI can fail fast on common blockers. That is a real maturity jump, but not an OS-level enforcement layer.

## Methodology

- Read required context: `AGENTS.md`, `.sdd/workflow.md`, `.sdd/project-overview.md`, `.sdd/conventions.md`.
- Deleted any existing report file before writing this one.
- Ran the repo's package, check, test, build, and pack commands.
- Created two real temporary projects outside the repo:
  - A new mini app: `primary-mini-app`.
  - An existing/brownfield app: `brownfield-app`.
- Installed the workflow into those projects via `node /Users/marcospenelascamara/proyectos/sddx-workflow/dist/cli.js`.
- Executed real CLI positive and negative cases under `cli-cases/`.
- Simulated SDD agent-command behavior by creating real specs, clarifications, plans, tasks, gaps, amendments, research artifacts, verify reports, conflict specs, and a real bugfix red-green cycle in the mini app.

## Technical Verification

Repo commands executed:

| Command | Result | Evidence |
|---|---:|---|
| `npm ci` | PASS | Added 79 packages; npm reported 0 vulnerabilities. |
| `npm run check` | PASS | Biome checked 22 files with no fixes. |
| `npm test` | PASS | 34 tests, 34 pass. |
| `npm pack --dry-run` | PASS | Package dry-run succeeded; 128 files, 49.9 kB package, 173.9 kB unpacked. |
| `npm run build` | PASS | `dist/cli.js` emitted by tsup, 37.89 kB. |

CI observed:

- `.github/workflows/ci.yml` runs Node 18, 20, and 22.
- CI steps: `npm ci`, `npm run check`, `npm test`, `npm pack --dry-run`.
- Note: `npm test` already runs `npm run check` and `npm run build`, so CI checks are slightly duplicated but clear.

## Test Project Evidence

### Evidence Root

`/tmp/sddx-workflow-audit-2026-05-23-0oJweA/`

Preserved for inspection. It contains:

```text
primary-mini-app/
  package.json
  README.md
  src/ledger.js
  test/ledger.test.js
  .sdd/
  .agents/skills/
  specs/
brownfield-app/
  package.json
  README.md
  src/tickets.js
  test/tickets.test.js
  scan-report.md
  .sdd/
  .agents/skills/
cli-cases/
  init-default/
  init-all/
  init-codex/
  init-existing/
  init-force/
  update-drift/
  invalid-provider/
  invalid-domain/
  no-install/
  doctor-partial/
  malformed-verify/
  incomplete-spec/
  pending-blockers/
```

### Primary Mini App

Path: `/tmp/sddx-workflow-audit-2026-05-23-0oJweA/primary-mini-app/`

Real app characteristics:

- Node/CommonJS mini ledger library.
- Source under `src/ledger.js`.
- Tests under `test/ledger.test.js`.
- Scripts: `npm run check`, `npm test`.
- Deliberate bug: non-positive ledger amounts were accepted.

Commands/results:

- `npm run check && npm test` before SDD install: PASS, 3 tests.
- `node <repo>/dist/cli.js init --provider codex`: PASS; installed `.sdd/`, `AGENTS.md`, and `.agents/skills/*`.
- `add domain auth`: PASS; created `.sdd/domains/auth.md`.
- `add domain payments`: PASS; created `.sdd/domains/payments.md`.
- `doctor`: PASS; healthy Codex install.
- `status` before bootstrap: `bootstrap pending`, `open specs 0`.
- Simulated `/bootstrap`: populated `.sdd/project-overview.md` and `.sdd/conventions.md`.
- `status` after bootstrap: `bootstrap done`.
- Simulated `/spec-new`, `/spec-clarify`, `/spec-plan`, `/spec-tasks`, `/impl-gap`, `/spec-amend`, `/verify`, `/research`, `/spec-status`, `/spec-conflicts`.
- Simulated `/bugfix`: added failing test, observed test failure, applied minimal fix, then `npm run check && npm test` passed with 4 tests.
- Simulated `/finish`: initialized git in the temp app, staged `src/ledger.js` and `test/ledger.test.js`, did not commit.

Final primary status output:

```text
bootstrap    done
open specs   3
  negative-debit-validation in /spec-tasks · 1/2 tasks · 1 pending CR · 1 unresolved gap
  statement-export awaiting tasks · no tasks
  withdrawal-reason in /spec-tasks · 0/1 tasks
```

### Brownfield App

Path: `/tmp/sddx-workflow-audit-2026-05-23-0oJweA/brownfield-app/`

Real app characteristics:

- Existing Node/CommonJS helpdesk ticket helper.
- Source under `src/tickets.js`.
- Tests under `test/tickets.test.js`.
- Ambiguity: README mentions `urgent`/`p0`, code supports only `low`, `medium`, `high`.

Commands/results:

- `npm run check && npm test` before SDD install: PASS, 2 tests.
- `node <repo>/dist/cli.js init --existing --provider codex`: PASS; next steps correctly pointed to `/scan` then `/bootstrap --scan`.
- Simulated `/scan`: wrote `scan-report.md`; did not need to touch `.sdd/`.
- Simulated `/bootstrap --scan`: populated `.sdd/project-overview.md` and `.sdd/conventions.md` using scan findings.
- `status`: `bootstrap done`, `open specs 0`.

### CLI Cases

Representative real outputs:

- `init` without flags in non-TTY installed all providers, matching README's non-TTY default.
- `init --all` installed all providers.
- `init --provider codex` installed only core + Codex files.
- `init --existing` printed brownfield next steps.
- `init --force --provider codex` overwrote workflow/provider files but skipped `.sdd/project-overview.md` and `.sdd/conventions.md`; custom content remained intact.
- `update --check` after drifting `.sdd/workflow.md`: exit `1`, `1 outdated`.
- `update`: repaired drift, exit `0`.
- `update --check` after repair: exit `0`, `0 outdated`.
- Invalid provider: exit `1`, `Unknown provider: nope`.
- Invalid domain: exit `1`, `Unknown domain "analytics"`.
- `update`, `status`, and `add domain auth` outside install: exit `1` with clear errors.
- Partial provider install missing `.agents/skills/verify/SKILL.md`: `doctor` warned but exited `0`.
- Malformed `verify-report.md`: `status` reported `verify report malformed`.
- Incomplete spec with only `1-requirements.md`: `status` reported `drafting requirements`.
- Spec with pending CR and unresolved gap: `status` reported both blockers.

## CLI Audit Matrix

| Surface | Result | Notes |
|---|---|---|
| `init` | PASS | Non-TTY default installs all providers. Correct, but potentially surprising. |
| `init --all` | PASS | Installed all provider surfaces. |
| `init --provider codex` | PASS | Installed core + `AGENTS.md` + Codex skills only. |
| `init --existing` | PASS | Correct next-step messaging for `/scan` and `/bootstrap --scan`. |
| `init --force` | PASS with caveat | Preserves `.sdd/project-overview.md` and `.sdd/conventions.md`; overwrites provider entry files. |
| `add domain auth` | PASS | Creates built-in domain template. |
| `add domain payments` | PASS | Creates built-in domain template. |
| Invalid domain | PASS | Fails with actionable hint. |
| `update --check` | PASS | CI-friendly exit `1` on drift, `0` when clean. |
| `update` | PASS | Repairs installed workflow/provider files only. |
| `doctor` healthy | PASS | Clear healthy output. |
| `doctor` no install | PASS | Exit `1`. |
| `doctor` missing core | PASS | Exit `1`. |
| `doctor` partial provider | CONCERN | Warns but exits `0`. |
| `status` no install | PASS | Exit `1`. |
| `status` normal specs | PASS | Useful phase summary. |
| `status` malformed verify | PASS | Detects malformed `Result:`. |
| `status` semantic correctness | CONCERN | Phase heuristic only; not a verifier. |
| `commands` | PASS | Lists 20 protocol commands. |
| `npm pack --dry-run` | PASS | Package includes runtime CLI and templates, excludes source/tests by `files`. |

## AI Command Behavior Audit

### `/bootstrap`

- **Instruction:** New projects use interview mode; existing projects scan first; stop and present full drafts before writing.
- **Obedient AI:** Reads code/manifests, asks only non-discoverable questions, drafts context, waits for approval, then writes `.sdd/project-overview.md` and `.sdd/conventions.md`.
- **Likely failure:** AI writes files immediately because the output files are obvious and the stop point is easy to gloss over.
- **Stop point:** Clear in workflow.
- **Improvisation risk:** Medium; business intent and non-goals are not inferable from code.
- **Write risk:** High if the agent ignores the approval gate.
- **Verifiable output:** Yes, two files.
- **Evidence:** Primary and brownfield apps got populated context; `status` changed to `bootstrap done`.
- **Recommendation:** Add a required draft marker or checklist to generated context files so bootstrapping can distinguish draft-vs-approved state.

### `/spec-new`

- **Instruction:** Scaffold `specs/<name>/` from `specs/_template/` and replace title placeholders.
- **Obedient AI:** Copies only initial spec files, does not start planning.
- **Likely failure:** AI immediately fills requirements or starts planning in the same breath.
- **Stop point:** Implicit: "Then fill out requirements before clarify/plan"; not a hard stop.
- **Improvisation risk:** Low for file creation, medium for requirements filling.
- **Write risk:** Low; spec scaffold only.
- **Verifiable output:** Yes, folder and files.
- **Evidence:** `primary-mini-app/specs/negative-debit-validation/`.
- **Recommendation:** Make `/spec-new` explicitly stop after scaffold unless the user also supplied requirements.

### `/spec-clarify`

- **Instruction:** Read requirements, generate blocking/non-blocking questions, record answered questions append-only.
- **Obedient AI:** Identifies whether positive amount validation applies to all entries; records answer in Clarifications.
- **Likely failure:** Treats non-blocking defaults as final decisions without making defaults explicit.
- **Stop point:** Clear for unanswered blocking questions.
- **Improvisation risk:** Medium; question quality depends on model discipline.
- **Write risk:** Medium; command may only append Clarifications, but an AI could rewrite requirements.
- **Verifiable output:** Yes, checkbox Clarifications.
- **Evidence:** `negative-debit-validation/1-requirements.md` contains answered blocking and non-blocking clarifications.
- **Recommendation:** Add a pre-plan checklist that fails if `Open Questions` contains unresolved blocking prose outside the Clarifications checkbox format.

### `/spec-plan`

- **Instruction:** Check blocking clarifications, run `/assume`, draft `2-plan.md`, stop for approval before code.
- **Obedient AI:** Produces goals coverage, assumptions, approach, components, abort criteria, verification, and stops.
- **Likely failure:** "Runs `/assume`" conversationally but does not actually wait for confirmation.
- **Stop point:** Very clear.
- **Improvisation risk:** Medium; plan can silently encode unconfirmed assumptions.
- **Write risk:** Medium; should only write plan/artifacts.
- **Verifiable output:** Yes, `2-plan.md`; approval marker is Markdown.
- **Evidence:** `negative-debit-validation/2-plan.md` has approved marker and assumptions.
- **Recommendation:** Separate "draft plan" and "approved plan" with a machine-readable approval field or timestamp convention.

### `/spec-tasks`

- **Instruction:** Execute one approved task at a time, test first, stop on ambiguity/gap.
- **Obedient AI:** Writes failing test, implements minimal code, updates task checklist only after verification.
- **Likely failure:** Batches several tasks, marks checkboxes optimistically, or continues past a contradiction.
- **Stop point:** Clear for gaps, failed tests, scope creep.
- **Improvisation risk:** High; this is where agents most naturally keep going.
- **Write risk:** High; code/test edits are allowed.
- **Verifiable output:** Partially; task checkboxes exist, but no enforcement ties them to tests.
- **Evidence:** `negative-debit-validation/3-tasks.md` has 1/2 tasks, and CLI `status` reports it.
- **Recommendation:** Add a stricter task template requiring command output snippets and changed-file evidence per completed task.

### `/impl-gap`

- **Instruction:** Stop, append `impl-gaps.md`, propose non-binding resolution, wait.
- **Obedient AI:** Records GAP-001 and halts.
- **Likely failure:** Writes a proposed fix and continues because the fix seems obvious.
- **Stop point:** Very clear.
- **Improvisation risk:** Medium-high despite clear wording.
- **Write risk:** Low if obeyed; only `impl-gaps.md`.
- **Verifiable output:** Yes, gap entry.
- **Evidence:** `negative-debit-validation/impl-gaps.md` has GAP-001 with `Resolution: pending`.
- **Recommendation:** Make `/verify` and `status` stricter around unresolved gaps; consider a CLI command that fails when gaps are pending.

### `/spec-amend`

- **Instruction:** Append CR, stop for approval, only then edit approved requirements/plan/tasks.
- **Obedient AI:** Creates CR-001 and stops.
- **Likely failure:** Applies the requirement change immediately after writing the CR.
- **Stop point:** Very clear.
- **Improvisation risk:** Medium.
- **Write risk:** Medium; command is close to approved spec files.
- **Verifiable output:** Yes, `amendments.md`.
- **Evidence:** `negative-debit-validation/amendments.md` has CR-001 pending approval; `status` reports one pending CR.
- **Recommendation:** Add a convention that pending CRs must include "no files changed yet" evidence or a touched-file list.

### `/verify`

- **Instruction:** Strict mechanical audit; read-only except `verify-report.md`; Result line must be exactly `PASS` or `FAIL`.
- **Obedient AI:** Checks tasks, goals, acceptance scenarios, full suite, scope, gaps, CRs; writes report.
- **Likely failure:** Produces a plausible report without actually running tests or comparing changed files.
- **Stop point:** Fails if checks fail.
- **Improvisation risk:** High; "mechanical" is described but not implemented.
- **Write risk:** Low if obeyed.
- **Verifiable output:** Report exists, but evidence quality is subjective.
- **Evidence:** `negative-debit-validation/verify-report.md` correctly says `Result: FAIL`; malformed case is detected by CLI `status`.
- **Recommendation:** Create a CLI `verify` helper or schema-backed report validator; Markdown alone is too easy to fake.

### `/review`

- **Instruction:** Qualitative pass after green verify or acknowledged warnings; no code edits; optional Advisory write.
- **Obedient AI:** Reads implementation and records qualitative notes conversationally.
- **Likely failure:** Duplicates `/verify`, or starts fixing style issues.
- **Stop point:** Weak unless structural issue is found.
- **Improvisation risk:** Medium.
- **Write risk:** Medium; review naturally invites edits.
- **Verifiable output:** Weak; notes are usually conversational, not durable.
- **Evidence:** Workflow only allows optional `verify-report.md` Advisory; no required `review-report.md`.
- **Recommendation:** Add a durable `review-report.md` or required Review section in `verify-report.md`.

### `/finish`

- **Instruction:** Inspect git status/diff, stage relevant files, propose conventional commit, stop before commit.
- **Obedient AI:** Stages safe files and presents staged list + message.
- **Likely failure:** Stages generated/scratch files or commits without approval.
- **Stop point:** Clear before commit.
- **Improvisation risk:** Medium.
- **Write risk:** Medium; staging is a git mutation.
- **Verifiable output:** Yes via `git status`.
- **Evidence:** Temp app staged `src/ledger.js` and `test/ledger.test.js`; no commit was made.
- **Recommendation:** Include a required "excluded files" list in the `/finish` output.

### `/spec-status`

- **Instruction:** Summarize active specs, phase, progress, CRs/gaps.
- **Obedient AI:** Reads spec folders and prints a table.
- **Likely failure:** Uses stale conversational memory instead of files.
- **Stop point:** None needed.
- **Improvisation risk:** Low-medium.
- **Write risk:** Low; read-only.
- **Verifiable output:** Partially; compare with CLI `status`.
- **Evidence:** CLI `status` reported three active specs and blockers in primary app.
- **Recommendation:** Make the agent command explicitly prefer CLI `sddx-workflow status` when available.

### `/spec-conflicts`

- **Instruction:** Cross-reference "Components Affected" across active specs; detection only.
- **Obedient AI:** Flags `src/ledger.js` and `test/ledger.test.js` overlap across three active specs.
- **Likely failure:** Misses conflicts if plans use inconsistent phrasing.
- **Stop point:** Human decides resolution.
- **Improvisation risk:** Medium.
- **Write risk:** Low; read-only.
- **Verifiable output:** Conversational only.
- **Evidence:** `rg` over primary specs showed all three plans touching `src/ledger.js` and `test/ledger.test.js`.
- **Recommendation:** Standardize Components Affected entries or add a parser-friendly table.

### `/scan`

- **Instruction:** Read existing project, write only `scan-report.md`.
- **Obedient AI:** Scans package, structure, tests, conventions, open questions.
- **Likely failure:** Also edits `.sdd/conventions.md` because the next step is obvious.
- **Stop point:** None, but write boundary is clear.
- **Improvisation risk:** Medium around business intent.
- **Write risk:** Medium; only one file allowed.
- **Verifiable output:** Yes, `scan-report.md`.
- **Evidence:** Brownfield app has `scan-report.md`; `.sdd/` context was updated separately as `/bootstrap --scan`.
- **Recommendation:** Add "do not run `/bootstrap --scan` unless asked" to `/scan`.

### `/bugfix`

- **Instruction:** Reproduce, diagnose, fix, validate; stop if not reproducible or too large.
- **Obedient AI:** Added failing non-positive amount test, saw red, fixed `normalizeEntry`, saw green.
- **Likely failure:** Fixes first, then writes a passing test.
- **Stop point:** Clear after failed reproduction or oversized fix.
- **Improvisation risk:** Medium.
- **Write risk:** High; code/test edits are allowed.
- **Verifiable output:** Strong when the test suite exists.
- **Evidence:** Primary app `npm test` failed with "Missing expected exception"; after fix, 4 tests passed.
- **Recommendation:** Require the red test output to be pasted or summarized before fix.

### `/research`

- **Instruction:** Writes `specs/<feature>/research-<topic>.md`.
- **Obedient AI:** Produces non-binding options/pros/cons/recommendation.
- **Likely failure:** Treats recommendation as a plan decision.
- **Stop point:** No implementation.
- **Improvisation risk:** Medium.
- **Write risk:** Medium; it writes a spec artifact even though README groups it under "Exploration (read-only)".
- **Verifiable output:** Yes, research artifact.
- **Evidence:** `negative-debit-validation/research-validation-policy.md`.
- **Recommendation:** Change docs from "read-only" to "no code changes"; `/research` is intentionally file-writing.

### `/ask`

- **Instruction:** Research and exploration only; no code changes.
- **Obedient AI:** Reads and summarizes; does not write.
- **Likely failure:** Slides into implementation if the answer looks obvious.
- **Stop point:** Requires explicit instruction before implementation.
- **Improvisation risk:** Medium.
- **Write risk:** Low if obeyed.
- **Verifiable output:** Weak; no artifact required.
- **Evidence:** Used as the first planning pass for this audit before mutation.
- **Recommendation:** Encourage optional `ask-report.md` only when the user asks for durable evidence; keep default conversational.

## Remediation Pass

After the audit, each finding was handled through the project's `$bugfix` flow by a separate worker and integrated into this workspace. No commits were made.

| Finding | Status | Fix summary | Regression coverage |
|---|---|---|---|
| F-001 | Fixed | Added `sddx-workflow gate <phase> <feature>` for `spec-plan`, `spec-tasks`, `verify`, and `finish`. | `test/gate.test.js` |
| F-002 | Fixed | `doctor` now exits non-zero for partial provider installs. | `test/cli-smoke.test.js` |
| F-003 | Fixed | Added `status --strict` for blocking spec states. | `test/status.test.js` |
| F-004 | Fixed | Provider parity tests now require canonical workflow command references. | `test/provider-parity.test.js` |
| F-005 | Fixed | Added durable `review-report.md` template and `/review` guidance. | `test/package.test.js`, `test/cli-smoke.test.js` |
| F-006 | Fixed | Clarified docs: exploration means no code changes; `/research` may write artifacts. | Provider parity/package smoke coverage |
| F-007 | Fixed | `init --force` preserves provider entrypoints/rules while refreshing command files. | `test/cli-smoke.test.js` |
| F-008 | Fixed | `Components Affected` is now a structured exact-path table for `/spec-conflicts`. | `test/provider-parity.test.js` |
| F-009 | Fixed | Added realistic installed-workflow end-to-end fixture. | `test/workflow-e2e.test.js` |
| F-010 | Fixed | Added `commands --installed` to inspect installed command files. | `test/cli-smoke.test.js` |

Post-remediation validation:

- `npm run check` PASS.
- `npm test` PASS: 34/34.
- `npm pack --dry-run` PASS: 128 files.

## Original Findings And Remediation Status

### F-001 — SDD stop points are prompt-only and easy to bypass

- **Severity:** High
- **Area affected:** Protocol reliability, AI behavior
- **Evidence exacta:** README says the agent reads `.sdd/workflow.md` and humans approve decisions (`README.md:47-50`), while `.sdd/workflow.md` states per-phase permissions are "Documentation, not runtime enforcement" (`.sdd/workflow.md:528`). In the temp app, code was changed by `/bugfix` while the related spec still had a pending CR/gap, and `status` correctly reported the Markdown state but could not reason about the code state.
- **Steps to reproduce:** Install SDD in a project, create a spec with pending `impl-gaps.md`/`amendments.md`, modify code directly, run `sddx-workflow status`.
- **Impact:** A normal AI can continue past gates; the CLI cannot stop it or detect code/spec divergence.
- **Recommendation:** Add a machine-checkable state layer or CLI validators for pending gaps/CRs, approved plans, and verify reports. At minimum, document that SDD is advisory, not enforcement.
- **Existing test coverage:** Fixed by `test/gate.test.js`; residual limitation remains that gates are opt-in checks, not a hard filesystem lock.

### F-002 — `doctor` exits 0 for partial provider installs

- **Severity:** High
- **Area affected:** CLI health checks, CI usage
- **Evidence exacta:** Removing `.agents/skills/verify/SKILL.md` from a Codex install produced a warning and `exit=0`. Source pushes partial provider problems into `warnings` (`src/commands/doctor.ts:80-85`) and exits only when `issues.length > 0` (`src/commands/doctor.ts:122`). Test codifies this with `expectCliOk` for partial provider (`test/cli-smoke.test.js:144-148`).
- **Steps to reproduce:** `init --provider codex`; delete `.agents/skills/verify/SKILL.md`; run `doctor`.
- **Impact:** CI or humans can treat a broken provider install as healthy enough, even though a selected command is missing.
- **Recommendation:** Make partial provider installs non-zero by default, or add `doctor --strict` and recommend it for CI.
- **Existing test coverage:** Fixed by `test/cli-smoke.test.js`; partial provider installs now fail non-zero.

### F-003 — `status` is useful but not mechanically reliable

- **Severity:** Medium
- **Area affected:** CLI status, workflow observability
- **Evidence exacta:** `status` parses Markdown with regexes for approval, tasks, CRs, gaps, and verify result (`src/commands/status.ts:34-55`, `77-94`, `97-118`). It only reads `Result: PASS|FAIL` for verify status (`src/commands/status.ts:43-51`) and ignores report substance.
- **Steps to reproduce:** Create a spec with `Result: PASS` but bogus check evidence; run `status`.
- **Impact:** `status` can report "review pending" even if `/verify` was fabricated or incomplete.
- **Recommendation:** Add a report schema/checklist parser or a separate `sddx-workflow verify-status` command that validates required checks and evidence fields.
- **Existing test coverage:** Improved by `test/status.test.js`; `status --strict` now fails on malformed/failed verify reports, pending CRs, unresolved gaps, and contradictory task/verify states.

### F-004 — Provider parity tests check presence, not meaning

- **Severity:** Medium
- **Area affected:** Provider consistency
- **Evidence exacta:** Provider parity test verifies one file per command and that entry files mention every command (`test/provider-parity.test.js:11-76`). It does not compare command behavior across Claude/Codex/Copilot/Gemini/Windsurf templates.
- **Steps to reproduce:** Change one provider's `spec-plan` wording while keeping the filename and command name; tests still pass if command names remain mentioned.
- **Impact:** Provider drift can ship silently even though the repo treats provider parity as a product invariant.
- **Recommendation:** Generate provider command files from canonical command metadata, or test normalized semantic snippets per command across providers.
- **Existing test coverage:** Fixed by `test/provider-parity.test.js`; command-aware provider files must reference their canonical workflow command instruction.

### F-005 — `/review` does not leave enough durable evidence

- **Severity:** Medium
- **Area affected:** Protocol audit trail
- **Evidence exacta:** `/review` is recommendation-only and may only append an advisory to `verify-report.md` under warnings (`.sdd/workflow.md:368-387`). There is no required `review-report.md`.
- **Steps to reproduce:** Complete a spec, run `/review`, then open a new session; unless the agent wrote conversational notes somewhere, the review can disappear.
- **Impact:** The final qualitative gate is weaker than `/verify` and hard for later agents to inspect.
- **Recommendation:** Add `review-report.md` or a required `## Review` section in `verify-report.md` with findings, non-blockers, and explicit "no issues found" state.
- **Existing test coverage:** Fixed through package/init coverage for `templates/specs/_template/review-report.md`.

### F-006 — `/research` is documented under read-only exploration but writes files

- **Severity:** Medium
- **Area affected:** Documentation clarity, AI expectations
- **Evidence exacta:** README labels the section "Exploration (read-only)" (`README.md:125`) but lists `/research` as producing `research-<topic>.md` (`README.md:129`). Workflow explicitly instructs `/research` to write `specs/<feature>/research-<topic>.md` (`.sdd/workflow.md:93-112`), and per-phase permissions allow "Only research / report files" (`.sdd/workflow.md:533`).
- **Steps to reproduce:** Run `/research negative-debit-validation validation-policy`; artifact is written.
- **Impact:** Users and agents can misunderstand `/research` as no-file-write. This matters because the user explicitly asked this audit to check that `/research` and `/ask` do not modify files; `/research` does modify files by design.
- **Recommendation:** Rename that README grouping to "Exploration / non-implementation" and state `/research` writes a spec artifact but no code.
- **Existing test coverage:** Fixed by docs/template wording updates; provider/package tests keep the touched surfaces packaged and command-consistent.

### F-007 — `init --force` preserves SDD context but overwrites provider entry files

- **Severity:** Medium
- **Area affected:** User-file safety
- **Evidence exacta:** `USER_OWNED_CORE_FILES` includes only `.sdd/project-overview.md` and `.sdd/conventions.md` (`src/commands/init.ts:62`); provider files are copied with `force` (`src/commands/init.ts:94-97`). Temp evidence showed `AGENTS.md` overwritten by `init --force --provider codex`.
- **Steps to reproduce:** Install Codex, customize `AGENTS.md`, run `init --force --provider codex`.
- **Impact:** Users may lose custom provider entrypoint instructions, even though SDD project context is preserved.
- **Recommendation:** Treat provider entry files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, rules files) as user-owned unless a separate `--overwrite-entrypoints` is supplied.
- **Existing test coverage:** Fixed by `test/cli-smoke.test.js`; customized provider entrypoints/rules are preserved on `init --force`.

### F-008 — `/spec-conflicts` depends on fragile free-form plan prose

- **Severity:** Medium
- **Area affected:** Multi-spec coordination
- **Evidence exacta:** Workflow says conflicts are based on "Components Affected" and missed if the plan understates its surface (`.sdd/workflow.md:410-423`). Primary app conflict specs all touched `src/ledger.js` and `test/ledger.test.js`, but detection required reading free-form lines.
- **Steps to reproduce:** Create two approved plans with the same file described differently, e.g. `src/ledger.js` vs `ledger module`; ask `/spec-conflicts`.
- **Impact:** Important conflicts are easy to miss or over-report.
- **Recommendation:** Make Components Affected a structured table with exact paths and `New/Modified/Reference` columns.
- **Existing test coverage:** Fixed by `test/provider-parity.test.js`; the plan template now requires a structured exact-path table used by `/spec-conflicts`.

### F-009 — The CLI test suite is solid for installer behavior but does not test real AI workflow outcomes

- **Severity:** Medium
- **Area affected:** Testing maturity
- **Evidence exacta:** Current tests cover install/update/status/package/provider presence (`test/cli-smoke.test.js`, `test/status.test.js`, `test/provider-parity.test.js`, `test/package.test.js`). No automated test creates a realistic app, runs a full SDD spec cycle, or validates protocol artifacts beyond parser heuristics.
- **Steps to reproduce:** Run `npm test`; all tests pass without exercising `/spec-plan` quality, `/verify` evidence quality, or stop-point adherence.
- **Impact:** Regressions in the actual agent workflow can ship while CLI tests stay green.
- **Recommendation:** Add smoke fixtures that simulate a full SDD cycle in a temporary project and assert expected files, blockers, and status output.
- **Existing test coverage:** Fixed by `test/workflow-e2e.test.js`.

### F-010 — `commands` is only a catalog, not a consistency verifier

- **Severity:** Low
- **Area affected:** CLI UX
- **Evidence exacta:** `commandsCommand` prints `COMMAND_NAMES` only (`src/commands/commands.ts`), while users may expect installed provider command availability. In a partial provider install, `commands` still lists `/verify` even if `.agents/skills/verify/SKILL.md` is missing.
- **Steps to reproduce:** Delete a provider command file, run `commands`.
- **Impact:** Users can see a protocol catalog that does not reflect their local install health.
- **Recommendation:** Keep `commands` as catalog but add `commands --installed` or direct users to `doctor --strict`.
- **Existing test coverage:** Fixed by `test/cli-smoke.test.js`; `commands --installed` reports installed/missing command files.

## Brutally Honest Assessment

### Code Quality

The code is clean, small, and easy to audit. The procedural style is appropriate. The remediation pass added more CLI surface (`gate`, `status --strict`, `commands --installed`) without introducing a large abstraction. Some behavior is still Markdown-based, but there are now executable checks for the most common blockers.

### Protocol Quality

The protocol is thoughtful. Stop points are explicit. `/impl-gap` and `/spec-amend` are the strongest parts because they name the exact failure mode: the AI wants to improvise. Enforcement is now materially better through `gate` and `status --strict`, while still depending on the agent or CI to run those checks.

### AI Instruction Quality

Good for careful agents, decent for average agents, still insufficient for fully unsupervised agents. The command files defer to `.sdd/workflow.md`, which keeps a single source of truth, and tests now require canonical command references across command-aware providers.

### Drift Between Providers

Provider file presence is well-covered, and command-aware provider files now get a basic semantic parity check through canonical workflow command references. Rule-only providers still differ structurally because they receive broad always-on context rather than per-command files.

### Reliability of `status`

Plain `status` remains a dashboard over Markdown. `status --strict` is now the safer gate for blocking states, but it still cannot prove whether `/verify` truly ran every command claimed in the report.

### Testing / CI / Release Maturity

Better than many small CLIs: Node matrix, package dry-run, install/update/status tests, provider presence tests, semantic command-reference checks, strict status/doctor checks, command-install inspection, and an end-to-end SDD workflow fixture.

### Probable Behavior of a Real AI Following SDD

A strong AI that reads carefully will improve dramatically under this protocol. It will ask more, plan better, and leave better artifacts. A normal AI will still sometimes:

- skip `/assume` as a real stop,
- write after `/bootstrap` without approval,
- continue after `/impl-gap`,
- mark tasks complete because tests pass nearby,
- fabricate `/verify` evidence,
- treat `/review` as permission to edit.

The protocol plus executable gates reduces these failures. It does not eliminate them.

## What Is Good

- The product boundary is clear: installer, not runtime.
- `init --force` preserves the two most important project-owned context files.
- `init --force` also preserves provider entrypoints/rules while refreshing command files.
- `update --check` has useful exit semantics.
- `status` is genuinely helpful for a Markdown-only system, and `status --strict` is useful as a CI/agent gate.
- `gate` gives the main stop points executable checks.
- `commands --installed` makes local command-file availability visible.
- The templates are understandable and portable across providers.
- The test suite covers the highest-risk CLI regression areas plus an installed workflow fixture.
- CI covers supported Node versions and package contents.
- The SDD flow models real AI failure modes better than generic "be careful" prompts.

## What Is Missing

- Machine-readable spec state.
- Deeper `verify-report.md` validation beyond `Result:` and blocking state checks.
- Packed-tarball execution smoke test.
- True hard enforcement through hooks or sandbox integration, if the project chooses to become more than an installer.

## What I Would Not Publish Yet

I would not publish a claim that SDD fully enforces AI behavior. It now provides executable gates for obedient agents and CI, but a careless agent can still ignore the command.

I would rely on `doctor`, `status --strict`, and `gate` as practical CI/agent checks, but not as proof that every claimed test or review step truly happened.

## Final Verdict

`sddx-workflow` is a good, compact installer for a serious protocol idea. The CLI is in stronger shape after this remediation pass, and the current test baseline is credible.

The next maturity jump is stricter evidence: schema-like report formats, deeper verify validation, and optional hooks/sandbox integration for teams that want real enforcement.

Final rating: stronger beta. Useful now as a protocol installer with executable gates; still not a hard enforcement system for fully autonomous AI work.
