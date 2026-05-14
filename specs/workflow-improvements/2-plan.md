# Technical Plan: Workflow Improvements

## Status

- [x] Draft
- [x] **Approved** ← user said "acepta todas las propuestas" — implicit approval to proceed

---

## Goals This Plan Addresses

G1–G14 — all covered. See task breakdown for which task implements which goal.

## Assumptions

1. **The canonical source of truth is `templates/workflow.md`.** All other docs (claude-commands, codex-skills, copilot-prompts, single-file rule docs) are thin pointers that delegate to it. Adding a command means: extending workflow.md once + adding thin pointers in each surface.
   If false: would need to duplicate command logic across 7 places.

2. **Each new agent command needs files in 3 invocation surfaces:** `templates/claude-commands/<name>.md`, `templates/codex-skills/<name>/SKILL.md`, `templates/copilot-prompts/<name>.prompt.md`. Plus the command must appear in the command tables of: `gemini.md`, `AGENTS.md`, `copilot-instructions.md`, `cursor-rules/sddx-workflow.mdc`, `windsurf-rules/sddx-workflow.md`, `zed-rules/sddx-workflow.md`. Plus `templates/CLAUDE.md`'s Quick Reference.
   If false: some surfaces are out of sync.

3. **The `init.ts` PROVIDERS map drives what gets copied into the user's project.** Adding a command file to a template directory does nothing unless `init.ts` registers it.
   If false: new templates ship dead.

4. **Ceremony level is a single CLI prompt added to `init`.** Stored in `.sdd/config.json`. Read by `init` (during prompt) and never enforced at runtime by code — only by what the agent reads in workflow.md.
   If false: would need runtime enforcement logic.

5. **Snapshot subcommand `sddx-workflow snapshot <feature>` is invoked by the agent as the first step of `/spec-tasks`.** No git hooks, no watchers. The user can also call it manually.
   If false: violates zero-runtime-dependency.

6. **Per-phase permissions are documented, not enforced.** Builder/Auditor modes (G8) are conventions in `workflow.md` and `CLAUDE.md`, not runtime guards.
   If false: would require runtime mode logic.

## Approach

Single linear refactor, no migrations, no breaking changes for existing users.

Six layers, applied in order:

1. **Canonical spec** — rewrite `templates/workflow.md` with all new commands, ceremony table, permissions table, anti-patterns, stop points. This is the source of truth; everything else mirrors it.
2. **Agent-facing thin pointers** — add 11 new command files in each of `templates/claude-commands/`, `templates/codex-skills/*/SKILL.md`, `templates/copilot-prompts/`. Rewrite `review` files to be the lighter human-touch pass. Update wording in `spec-tasks` to mention snapshot + impl-gap.
3. **Single-file rule docs** — refresh the command tables in `gemini.md`, `AGENTS.md`, `copilot-instructions.md`, `cursor-rules/sddx-workflow.mdc`, `windsurf-rules/sddx-workflow.md`, `zed-rules/sddx-workflow.md`.
4. **CLAUDE.md template** — enrich with permissions table, anti-patterns, files-to-read-per-command (#14, also satisfies #8).
5. **Spec templates** — add Clarifications section to `1-requirements.md` template, add Implementation Gaps + Optional Artifacts note to `2-plan.md` template.
6. **CLI changes** — register new files in `src/commands/init.ts`, add ceremony-level prompt + `.sdd/config.json` write, add `snapshot` subcommand to `src/cli.ts`.

Rejected: a more aggressive refactor that splits workflow.md by command into separate files. Rejected because (a) the current single-file design is part of the brand and (b) it would force every install to materialize 11+ separate files for what is essentially reference doc.

## Tradeoffs

- **Many small thin-pointer files** → high file count for new commands → acceptable because each file is 3–6 lines and the maintenance burden is captured by "if you add a command, also touch these 3 files" convention.
- **Documentation-not-enforcement for Builder/Auditor (G8)** → the agent can violate it → acceptable because runtime enforcement would require either a wrapper layer or modifying the agent host (neither possible without violating zero-runtime-dependency).
- **Snapshots stored in `.sdd/snapshots/` not git** → duplicates some git functionality → acceptable because (a) does not require a git repo, (b) doesn't pollute git history with auto-commits, (c) self-contained per feature folder.
- **CR numbering is per-spec, not global** → can't reference "CR-001" project-wide → acceptable because the spec folder always scopes it and `specs/<feature>/amendments.md#CR-001` is the canonical reference form.

## Components Affected

**Created:**

- `templates/claude-commands/spec-amend.md`
- `templates/claude-commands/impl-gap.md`
- `templates/claude-commands/spec-restore.md`
- `templates/claude-commands/research.md`
- `templates/claude-commands/verify.md`
- `templates/claude-commands/scan.md`
- `templates/claude-commands/conventions-sync.md`
- `templates/claude-commands/spec-status.md`
- `templates/claude-commands/spec-conflicts.md`
- `templates/claude-commands/spec-clarify.md`
- `templates/claude-commands/spec-analyze.md`
- `templates/codex-skills/{spec-amend,impl-gap,spec-restore,research,verify,scan,conventions-sync,spec-status,spec-conflicts,spec-clarify,spec-analyze}/SKILL.md` (× 11)
- `templates/copilot-prompts/{spec-amend,impl-gap,spec-restore,research,verify,scan,conventions-sync,spec-status,spec-conflicts,spec-clarify,spec-analyze}.prompt.md` (× 11)
- `src/commands/snapshot.ts` — new CLI subcommand

**Modified:**

- `templates/workflow.md` — extensive rewrite: 11 new command sections, expanded ceremony table, permissions table, anti-patterns, updated stop points.
- `templates/CLAUDE.md` — Quick Reference table expanded, Permissions table added, Anti-Patterns section added, Files-to-Read section added.
- `templates/AGENTS.md` — Quick Reference table expanded with new skills.
- `templates/gemini.md` — Quick Reference table expanded.
- `templates/copilot-instructions.md` — Available commands table expanded.
- `templates/cursor-rules/sddx-workflow.mdc` — Available commands table expanded.
- `templates/windsurf-rules/sddx-workflow.md` — Available commands table expanded.
- `templates/zed-rules/sddx-workflow.md` — Workflows table expanded.
- `templates/claude-commands/review.md` — rewritten as lighter human-touch pass.
- `templates/codex-skills/review/SKILL.md` — same.
- `templates/copilot-prompts/review.prompt.md` — same.
- `templates/claude-commands/spec-tasks.md` — add snapshot + impl-gap references.
- `templates/codex-skills/spec-tasks/SKILL.md` — same.
- `templates/copilot-prompts/spec-tasks.prompt.md` — same.
- `templates/specs/_template/1-requirements.md` — add Clarifications section.
- `templates/specs/_template/2-plan.md` — add Implementation Gaps + Optional Artifacts note.
- `src/cli.ts` — register `snapshot` subcommand.
- `src/commands/init.ts` — register all new template files in PROVIDERS map; add ceremony-level prompt + `.sdd/config.json` write.

## New Artifacts

In user's project after `sddx-workflow init`:

- `.sdd/config.json` — `{"ceremony": "team", "features": {...}}` (created during init).
- `.sdd/snapshots/` — directory used by `sddx-workflow snapshot` (created lazily).

In specs after the new commands are used:

- `specs/<feature>/amendments.md` — written by `/spec-amend`.
- `specs/<feature>/impl-gaps.md` — written by `/impl-gap`.
- `specs/<feature>/analysis.md` — written by `/spec-analyze`.
- `specs/<feature>/research-<topic>.md` — written by `/research`.
- `specs/<feature>/2a-data-model.md`, `2b-api-contracts.md`, `2c-research.md` — optionally written by `/spec-plan` when context warrants.

## What This Plan Does NOT Do

- Does not enforce Builder/Auditor modes at runtime — documentation only.
- Does not add a global CR numbering scheme — per-spec only.
- Does not auto-detect ceremony level from project size — explicit prompt during `init`.
- Does not introduce file watchers, daemons, or background processes.
- Does not change git workflows — `/finish` still does staging + commit message authoring.
- Does not deprecate or remove any existing command — `/review` is rewritten, not removed.
- Does not break existing installations — `sddx-workflow update` is additive.

## External Dependencies

None new. Existing dependencies: `commander`, `@inquirer/prompts`.

## Risks & Open Questions

- **Risk: information overload in workflow.md.** Adding 11 commands roughly doubles the file. Mitigation: terse command sections, keep deep rationale out, link to per-command reference within the file.
- **Risk: command surface bloat.** Going from 10 to 21 commands is a lot. Mitigation: ceremony-level docs make it clear that `solo` users can ignore most of them.
- **Risk: thin-pointer drift.** With 4 surfaces per command, descriptions can desync. Mitigation: every thin pointer says "Execute /<name> defined in .sdd/workflow.md" — the canonical doc is always authoritative.
- **Open: should `/scan` write a report file or print to stdout?** Decision: write `scan-report.md` at repo root so user can review and discard, mirroring how `/spec-analyze` works.
- **Open: where does `analysis.md` live?** Decision: `specs/<feature>/analysis.md`, replaces previous run.

## Abort Criteria

- Any of the existing 10 commands' definitions in `workflow.md` would have to change in a way that breaks current users (NOT just additive).
- An existing test suite (if any is added during this work) goes red.
- The CLI changes cannot be implemented without adding a new dependency beyond `commander` + `@inquirer/prompts`.
- The new commands cannot fit cleanly into the existing PROVIDERS map structure in `init.ts`.

## Verification

Each task below has its verification criterion inline. The overall feature is verified when:

- All 14 acceptance scenarios in `1-requirements.md` map to at least one task and are addressed.
- `tsc --noEmit` passes for the CLI changes.
- `npm run build` (or whatever the project uses; tsup) produces a working binary.
- A fresh `sddx-workflow init` in an empty directory creates: `.sdd/`, `.sdd/config.json`, the new commands in `.claude/commands/`, the new prompts in `.github/prompts/`, the new skills in `.agents/skills/`, and the updated single-file rule docs.
- `sddx-workflow snapshot test-feature` (with `specs/test-feature/` existing) creates `.sdd/snapshots/test-feature/<timestamp>/`.

## Task Count Estimate

22 tasks. Grouped by layer:

- L1 Canonical workflow.md: T1
- L2 Claude commands: T2–T4
- L3 Codex skills: T5
- L4 Copilot prompts: T6
- L5 Single-file rule docs: T7
- L6 CLAUDE.md: T8
- L7 Spec templates: T9
- L8 CLI: T10–T12
- L9 Build + verify: T13–T14

(Some "tasks" bundle ~11 related files, since e.g. creating 11 thin-pointer codex skills is mechanically uniform.)

---

## Approval

Date: 2026-05-14
Approved by: user ("acepta todas las propuestas del documento md", "no pares hasta que tengas todo perfecto implementado")
Notes: User asked for dogfooding the SDD workflow — this spec is the implementation of that.
