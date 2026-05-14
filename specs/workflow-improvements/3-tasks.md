# Tasks: Workflow Improvements

## Status

Plan approved: 2026-05-14

---

## Rules

- One task at a time — finish completely before moving on.
- After each layer, the canonical doc and the thin pointers should agree.
- After CLI changes, run `npm run build` to verify TS compiles.
- If a task reveals new scope (e.g. an unexpected coupling), STOP and amend the plan.

---

## Tasks

- [x] **T1**: Rewrite `templates/workflow.md` as the canonical source.
  - Changes: extend the Commands section with the 11 new commands; expand Ceremony Levels into a per-edition table (Solo / Team / Enterprise); add a Per-Phase Permissions table (G8); add an Anti-Patterns section; update Stop Points to include impl-gap and amendment triggers; add a section describing the snapshot mechanism.
  - Goal: G1–G14 (all reference workflow.md).
  - Criterion: file contains a `### /<name>` section for each new command, the ceremony table has rows for solo/team/enterprise, the permissions table maps each command to read/edit/create permissions.

- [x] **T2**: Create the 11 new `templates/claude-commands/*.md` thin pointers.
  - Files: spec-amend.md, impl-gap.md, spec-restore.md, research.md, verify.md, scan.md, conventions-sync.md, spec-status.md, spec-conflicts.md, spec-clarify.md, spec-analyze.md.
  - Each file is 3–6 lines: opens with "Execute the /<name> command defined in .sdd/workflow.md", one sentence summary, and $ARGUMENTS placeholder where relevant.
  - Criterion: 11 files exist, each delegates to workflow.md, formatting matches existing thin pointers like spec-plan.md.

- [x] **T3**: Rewrite `templates/claude-commands/review.md` as the lighter human-touch pass.
  - Changes: review.md now describes qualitative final pass (clarity, naming, simplicity, minor follow-ups). Removes the mechanical checklist (that's `/verify`'s job per workflow.md).
  - Criterion: review.md no longer contains the goal-coverage / scenario-test / scope-creep checklist; verify.md contains those.

- [x] **T4**: Update `templates/claude-commands/spec-tasks.md` to mention snapshot + impl-gap.
  - Changes: add a sentence telling the agent to call `sddx-workflow snapshot <feature>` as the first step (if available), and to use `/impl-gap` when a contradiction or ambiguity blocks a task.
  - Criterion: spec-tasks.md mentions both snapshot and /impl-gap.

- [x] **T5**: Create 11 new `templates/codex-skills/<name>/SKILL.md` files.
  - Pattern: frontmatter with `name:` and `description:` fields, body delegates to workflow.md.
  - Also rewrite `templates/codex-skills/review/SKILL.md` and update `spec-tasks/SKILL.md` to match T3 and T4.
  - Criterion: 11 new SKILL.md files plus 2 updated ones; each has name+description frontmatter; review SKILL.md no longer carries mechanical checks.

- [x] **T6**: Create 11 new `templates/copilot-prompts/<name>.prompt.md` files.
  - Pattern: frontmatter with `description:` and `mode: agent`, body delegates to workflow.md.
  - Also rewrite `templates/copilot-prompts/review.prompt.md` and update `spec-tasks.prompt.md`.
  - Criterion: 11 new prompt files plus 2 updated ones; all use `${input:specName}` placeholders consistently.

- [x] **T7**: Update all single-file rule docs with new command tables.
  - Files: `templates/gemini.md`, `templates/AGENTS.md`, `templates/copilot-instructions.md`, `templates/cursor-rules/sddx-workflow.mdc`, `templates/windsurf-rules/sddx-workflow.md`, `templates/zed-rules/sddx-workflow.md`.
  - Changes: extend each command table with the 11 new commands grouped logically (Audit / Multi-spec / Discovery / Amendments / Research). Adjust the recommended flow line to mention `/verify` between `/spec-tasks` and `/review`.
  - Criterion: each file's command table includes all 21 commands with one-line purpose.

- [x] **T8**: Enrich `templates/CLAUDE.md`.
  - Changes: expand Quick Reference table; add Per-Phase Permissions table (G8); add Anti-Patterns section listing the explicit don'ts; add Files-to-Read-per-command section.
  - Criterion: CLAUDE.md contains all four new/expanded sections; permissions table covers all 21 commands.

- [x] **T9**: Update `templates/specs/_template/1-requirements.md` and `2-plan.md`.
  - 1-requirements.md: add a Clarifications section at the bottom (after Open Questions).
  - 2-plan.md: add an Implementation Gaps section (where /impl-gap entries are appended) and an Optional Artifacts note near Approach (mentioning 2a/2b/2c).
  - Criterion: 1-requirements.md has a Clarifications header; 2-plan.md has Implementation Gaps and the optional-artifacts note.

- [x] **T10**: Add `sddx-workflow snapshot <feature>` subcommand.
  - Files: create `src/commands/snapshot.ts`; register in `src/cli.ts`.
  - Behavior: read `specs/<feature>/{1-requirements.md, 2-plan.md, 3-tasks.md}`, copy them to `.sdd/snapshots/<feature>/<ISO-timestamp>/`. If any source file is missing, report which and proceed for the ones that exist.
  - Optional flag: `--list` shows existing snapshots for a feature.
  - Criterion: `sddx-workflow snapshot <feature>` creates the snapshot directory; `sddx-workflow snapshot <feature> --list` prints existing timestamps; non-existent feature produces a clear error.

- [x] **T11**: Update `src/commands/init.ts` to register the 11 new templates per provider and the new CLAUDE.md sections, and add ceremony-level prompt.
  - Changes: add the 11 new templates to claude-code/codex/copilot provider entries; add a `select` prompt for ceremony level (Solo/Team/Enterprise) before provider selection; write `.sdd/config.json` with the choice + feature flags; default non-TTY to "team".
  - Criterion: `init.ts` lists all new templates; running `npx sddx-workflow init` in a fresh dir prompts for ceremony level and writes `.sdd/config.json`.

- [x] **T12**: Run `npm run build` and fix any TypeScript errors.
  - Criterion: build succeeds with no errors; the generated CLI binary works for `init` and `snapshot`.

- [x] **T13**: Smoke test in a scratch directory.
  - Run `node dist/cli.js init` (or equivalent) in a temp dir, confirm: `.sdd/`, `.sdd/config.json`, `.claude/commands/spec-amend.md` exist; `templates/workflow.md` content was copied; `CLAUDE.md` has the new sections.
  - Criterion: smoke test passes manually.

- [x] **T14**: `/verify`-style audit.
  - Walk through `1-requirements.md` Goals G1–G14 — confirm each goal is implemented by one or more tasks and ends up in the canonical workflow.md plus its thin pointers and the relevant rule doc tables.
  - Walk through Acceptance Criteria scenarios — confirm each is covered.
  - Criterion: every goal traced to its implementation; every scenario has a matching artifact in templates.

---

## Implementation Gaps

(Appended by `/impl-gap` when scope-blocking ambiguity is found. Currently empty.)

---

## Completion

- [x] All tasks done
- [x] Every acceptance scenario in 1-requirements.md covered by an implementation
- [x] /verify completed (T14)
- [ ] Spec moved to `specs/_done/workflow-improvements/`
