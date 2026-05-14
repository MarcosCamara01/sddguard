# Requirements: Workflow Improvements (spec-kit + AnchorSpec inspired)

> Source document: `sddx-workflow-improvements.md` (14 propuestas inspiradas en spec-kit y AnchorSpec).

## Status

- [x] Draft
- [x] Reviewed (user approved all 14 proposals — 2026-05-14)
- [x] Ready for /spec-plan — duplications resolved in Clarifications

---

## Problem Statement

`sddx-workflow` ship a minimal SDD protocol but lacks four classes of capability that the user wants to absorb from spec-kit and AnchorSpec:

1. **No audit trail for changes after approval** — when requirements or plan need to change mid-implementation, the agent or human edit silently. No CR record, no traceability.
2. **No mechanism for the agent to surface implementation-time gaps** — when the agent hits ambiguity during `/spec-tasks`, the only options are improvise or abort. There is no formal "stop and report a gap" channel.
3. **No mechanical consistency checks** — nothing verifies that every goal has at least one task, that no scope creep crept in, or that requirements have been clarified before planning.
4. **No multi-spec / discovery / convention-maintenance flow** — single-feature only, no brownfield onboarding command, no auto-refresh of conventions, no ceremony-level selection at init.

Result: the workflow is solid for greenfield single-feature work by one developer, but drifts as soon as anything non-trivial happens (mid-spec changes, parallel work, existing codebases).

## Goals

- **G1**: Add `/spec-amend` — change-request mechanism with audit trail for post-approval changes to requirements or plan.
- **G2**: Add `/impl-gap` — formal stop-and-report channel for ambiguities discovered during `/spec-tasks`, with optional escalation to `/spec-amend`.
- **G3**: Add `/spec-restore` command and `sddx-workflow snapshot` CLI subcommand — automatic snapshots before `/spec-tasks` for restore-point safety net.
- **G4**: Add convention that `/spec-plan` may emit optional artifacts (`2a-data-model.md`, `2b-api-contracts.md`, `2c-research.md`) when context warrants, referenced from `2-plan.md`.
- **G5**: Add `/research` — exploration command that produces a research artifact without committing to any option.
- **G6**: Add ceremony-level selection during `npx sddx-workflow init` (Solo / Team / Enterprise) and persist to `.sdd/config.json`. Generated workflow.md adapts ceremony tables accordingly.
- **G7**: Split current `/review` into `/verify` (strict mechanical audit) and a rewritten `/review` (lighter human-touch final pass).
- **G8**: Document Builder vs Auditor permissions table in `workflow.md` and `CLAUDE.md` — formalize what the agent may read/write/create in each phase.
- **G9**: Add `/scan` standalone command — discovery-only pass for existing codebases. `/bootstrap --scan` remains as the bootstrap shortcut.
- **G10**: Add `/conventions-sync` — refresh `.sdd/conventions.md` from current project state, preserving sections marked `<!-- manual -->`.
- **G11**: Add `/spec-status` and `/spec-conflicts` — multi-spec awareness commands.
- **G12**: Add `/spec-clarify` — structured pre-plan clarification pass; results land in a Clarifications section of `1-requirements.md`.
- **G13**: Add `/spec-analyze` — cross-consistency analysis (goal coverage, plan-task coverage, scope-creep detection); writes `analysis.md`.
- **G14**: Enrich `CLAUDE.md` template with per-phase permissions table, files-to-read-per-command section, and explicit anti-patterns list.

## Non-Goals

- No daemon, watcher, or background process — zero-runtime-dependency principle stands.
- No Python, no uv, no pipx — npx-first remains.
- No automatic decision-making for structural changes — every CR, every gap, every analysis report still requires human approval to take effect.
- No new binary or JSON-heavy formats — markdown only for all artifacts. `.sdd/config.json` is the single exception (config, not content).
- No retroactive enforcement on existing installations — these are additive; users who run `sddx-workflow update` get the new files but their current `.sdd/config.json` defaults to `team` if absent.
- No replacement of git — snapshots live alongside git, do not depend on it, do not duplicate its history model.

## Acceptance Criteria

Scenario: amendment workflow records a CR with traceability
  Given: a spec exists with approved `1-requirements.md` and `2-plan.md`
  When: the user runs `/spec-amend <feature>` describing a change
  Then: a new entry is appended to `specs/<feature>/amendments.md` with CR-NNN, date, motive, changes-in-requirements, changes-in-plan, affected-tasks, and status="Pending approval"
    And: no edit is made to `1-requirements.md` or `2-plan.md` until the CR is approved
    And: after explicit approval, the agent propagates the documented changes and updates the CR status to "Approved"

Scenario: implementation gap pauses execution and records context
  Given: the agent is executing `/spec-tasks` for an approved plan
  When: the agent detects a contradiction, ambiguity, or technical impossibility blocking a task
  Then: the agent appends an entry to `specs/<feature>/impl-gaps.md` with GAP-NNN, current task ID, problem statement, impact (which tasks are blocked), proposed resolution, and action-required ("Approval" or "Escalate to /spec-amend")
    And: the agent stops and waits for human input — no improvised fix
    And: if escalated, the gap entry references the resulting CR ID

Scenario: snapshot captures spec state before /spec-tasks begins
  Given: a feature has approved requirements, plan, and tasks files
  When: `/spec-tasks` starts (or the user runs `sddx-workflow snapshot <feature>` explicitly)
  Then: the three spec files are copied to `.sdd/snapshots/<feature>/<ISO-8601-timestamp>/`
    And: the snapshot files are not modified afterward by any command

Scenario: snapshot restore replaces current spec files
  Given: a snapshot exists at `.sdd/snapshots/<feature>/<timestamp>/`
  When: the user runs `/spec-restore <feature> <timestamp>`
  Then: the three files in `specs/<feature>/` are overwritten with the snapshot copies
    And: the agent reports what was restored and prompts the user to acknowledge

Scenario: plan generates optional artifacts when context warrants
  Given: a requirements doc mentions a database schema and an external API
  When: `/spec-plan` runs
  Then: `2-plan.md` is generated with references to `2a-data-model.md` and `2b-api-contracts.md`
    And: those artifact files exist with their respective content
    And: requirements without persistence or APIs produce only `2-plan.md` (no extra artifacts)

Scenario: research command produces non-committing exploration
  Given: the user runs `/research <topic>` during planning of a feature
  When: the command completes
  Then: `specs/<feature>/research-<topic>.md` exists with: options found, pros/cons of each, current versions/maintenance status, agent recommendation labelled "non-binding"
    And: `2-plan.md` is not modified by `/research`

Scenario: init prompts for ceremony level and persists choice
  Given: the user runs `npx sddx-workflow init` in a TTY
  When: prompted for ceremony level
  Then: the user can choose Solo / Team / Enterprise
    And: `.sdd/config.json` is written with `{"ceremony": "<choice>", "features": {...}}`
    And: the generated `workflow.md` ceremony-levels table reflects the choice
    And: non-TTY invocations default to "team"

Scenario: verify reports drift without modifying anything
  Given: a feature with implementation in progress
  When: `/verify <feature>` runs
  Then: a report is printed (and optionally written to `specs/<feature>/verify-report.md`) listing: goals not implemented, tasks marked done without matching code, files changed outside task scope, plan drift
    And: no file outside the report itself is modified

Scenario: review is the lighter human-touch final pass
  Given: a feature has passed `/verify`
  When: `/review` runs
  Then: it produces a qualitative summary of the implementation with subjective feedback (code clarity, naming, simplicity) and may propose minor follow-ups
    And: it does not enforce mechanical checks — those are `/verify`'s job

Scenario: builder cannot edit specs and auditor cannot edit anything
  Given: the agent is executing `/spec-tasks` (builder mode)
  When: the agent attempts to edit `1-requirements.md` or `2-plan.md`
  Then: the agent stops and reports that this requires `/spec-amend`

  Given: the agent is executing `/verify` (auditor mode)
  When: the agent attempts any write outside the verify-report file
  Then: the agent stops and reports the violation

Scenario: scan discovers and reports on existing codebase
  Given: an existing codebase without `.sdd/`
  When: the user runs `/scan`
  Then: a discovery report is produced summarizing: detected frameworks, dependencies, directory structure, naming patterns, lint/format config
    And: no `.sdd/` file is written by `/scan` — `/bootstrap --scan` is the command that writes

Scenario: conventions-sync preserves manual sections
  Given: `.sdd/conventions.md` contains sections marked `<!-- manual -->`
  When: `/conventions-sync` runs
  Then: manual sections are kept verbatim
    And: auto-generated sections are refreshed from current project state
    And: the diff is shown for approval before any write

Scenario: spec-status lists all active specs with phase
  Given: multiple folders exist under `specs/` (excluding `_template` and `_done`)
  When: `/spec-status` runs
  Then: each active spec is listed with: name, current phase (spec-plan / spec-tasks / verify / etc.), progress (e.g. "7/12 tasks done")

Scenario: spec-conflicts detects shared file modifications
  Given: two active specs both list overlapping files in their plans' "Components Affected"
  When: `/spec-conflicts` runs
  Then: the overlap is reported per file with the spec names that touch it

Scenario: spec-clarify generates blocking and non-blocking questions
  Given: a draft `1-requirements.md` exists
  When: `/spec-clarify` runs
  Then: a list of questions is produced, categorized as blocking or non-blocking
    And: answers are recorded in a new "Clarifications" section of `1-requirements.md`
    And: `/spec-plan` emits a warning if blocking questions remain unanswered

Scenario: spec-analyze reports coverage and scope creep
  Given: a feature with approved plan and tasks
  When: `/spec-analyze` runs
  Then: `specs/<feature>/analysis.md` is written with three reports:
    - Goal-to-task coverage: each goal ID present in at least one task
    - Plan-to-task coverage: each "Components Affected" item present in at least one task
    - Scope creep: any task that references no goal
    And: the analysis does not modify the spec itself

Scenario: CLAUDE.md template includes per-phase permissions table
  Given: the user runs `sddx-workflow init`
  When: `CLAUDE.md` is generated
  Then: it contains a "Per-Phase Permissions" table mapping each command to (read specs / edit specs / edit code / create files)
    And: it contains an "Anti-Patterns" section listing the explicit don'ts
    And: it contains a "Files to Read" section listing context files per command

## Constraints

- **Technical**: must remain zero-runtime-dependency. The only `sddx-workflow` CLI surface allowed for these features is `init` (existing) and `snapshot` (new). Everything else is markdown the agent reads.
- **Technical**: all new agent commands must exist in all four invocation surfaces: `templates/claude-commands/<name>.md`, `templates/codex-skills/<name>/SKILL.md`, `templates/copilot-prompts/<name>.prompt.md`, and listed in the single-file rule docs (cursor, windsurf, zed, gemini, AGENTS, copilot-instructions).
- **Technical**: the canonical source is `templates/workflow.md`. Every new command's full definition lives there; the other surfaces are thin pointers.
- **Compatibility**: existing installations updating via `sddx-workflow update` must not break. The new `.sdd/config.json` is optional; absent = "team" ceremony.
- **UX**: ceremony selection during `init` must skip silently on non-TTY (CI installs); default = "team".
- **Philosophy**: every advanced feature must be opt-in via ceremony level OR usable without ceremony (no forced ceremony for `team` users).

## Assumptions

1. **The two duplications (#7 `/verify` and #9 `/scan`) are resolved by splitting current `/review` into two commands and adding `/scan` as standalone alongside the existing `/bootstrap --scan`.** — discussed and confirmed with user.
   If false: only one of `/verify` or `/review` is added, or `/scan` is rejected as duplicate.

2. **Snapshots are triggered explicitly by `sddx-workflow snapshot <feature>` (called from `/spec-tasks` as its first step), not by a file watcher or git hook.** — required by zero-runtime-dependency principle.
   If false: would need a hook mechanism we explicitly reject.

3. **The CR (Change Request) mechanism does not require numeric ID uniqueness across features.** — CR-001 in feature A is independent of CR-001 in feature B; the spec folder scopes them.
   If false: would need a global counter, more state to maintain.

4. **`.sdd/config.json` is the right place for ceremony level and feature toggles.** — small JSON, ignored by agent during normal work, read only by CLI.
   If false: alternative would be embedding the choice as frontmatter in `workflow.md` itself.

5. **Optional plan artifacts (`2a-`, `2b-`, `2c-`) are generated by the agent during `/spec-plan` when it deems them warranted, not by a flag the user passes.** — keeps the surface area minimal.
   If false: would need flag-based generation, more CLI complexity.

6. **`/verify` and `/review` are sequential in the feature flow: `/spec-tasks` → `/verify` → `/review` → `/finish`.** — verify is mechanical, review is human-touch.
   If false: would collapse them back into one.

## Open Questions

⚠️ **Non-blocking — decided during planning with reasonable defaults:**

- Does `/spec-analyze` produce a markdown report or print to stdout? **Default: markdown report.**
- Does `/verify`'s report file overwrite or append? **Default: overwrite (timestamped versions live in snapshots if needed).**
- Where does ceremony-level config live? **Default: `.sdd/config.json`** (small, JSON, only read by CLI).

## Clarifications

(Populated during /spec-clarify or amended via /spec-amend. Initially empty.)

- **2026-05-14** — User confirmed all 14 proposals from `sddx-workflow-improvements.md` are in scope. Duplications between `/verify` (#7) and existing `/review`, and between `/scan` (#9) and existing `/bootstrap --scan`, are resolved by:
  - Splitting `/review` into `/verify` (strict, mechanical) + `/review` (lighter, qualitative).
  - Adding `/scan` as a standalone discovery command while keeping `/bootstrap --scan` as a shortcut that does scan + bootstrap in one.
