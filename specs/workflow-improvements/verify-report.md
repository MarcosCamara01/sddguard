# Verify Report: workflow-improvements

Date: 2026-05-14
Auditor: /verify-style audit (manual, since /verify command itself is being built here)

---

## Goals coverage (G1–G14)

| Goal | Implementation evidence | Status |
|---|---|---|
| **G1** `/spec-amend` (CR mechanism) | `templates/workflow.md` § `/spec-amend`; `templates/claude-commands/spec-amend.md`; `templates/codex-skills/spec-amend/SKILL.md`; `templates/copilot-prompts/spec-amend.prompt.md`; registered in `init.ts` and `update.ts`; surfaced in CLAUDE.md, AGENTS.md, gemini.md, copilot-instructions.md, cursor-rules, windsurf-rules, zed-rules | ✅ |
| **G2** `/impl-gap` | Same fan-out as G1, all surfaces present. Anti-Pattern #2 references it. Stop point #7 references it. Spec-tasks now mentions it explicitly. | ✅ |
| **G3** `/spec-restore` + `sddx-workflow snapshot` CLI | `templates/workflow.md` § `/spec-restore` + § Snapshots; thin pointers in all 3 surfaces; CLI subcommand `src/commands/snapshot.ts` registered in `src/cli.ts`; smoke test passed (snapshot create + list + missing-feature error). `/spec-tasks` updated to invoke it as first action. | ✅ |
| **G4** Optional plan artifacts (2a/2b/2c) | `templates/workflow.md` § `/spec-plan` step 8 enumerates the conditions; `templates/specs/_template/2-plan.md` Approach section now contains a comment listing them. | ✅ |
| **G5** `/research` | All 3 surfaces, thin pointers; registered; canonical workflow.md describes process. | ✅ |
| **G6** Ceremony level prompt + `.sdd/config.json` | `src/commands/init.ts` adds `selectCeremony()` with select() prompt (defaults to "team" on non-TTY); `writeConfig()` writes `.sdd/config.json`; smoke test confirms file created on team default. `workflow.md` Ceremony Levels section adapted into per-edition table (Solo / Team / Enterprise). | ✅ |
| **G7** `/verify` separated from `/review` | New `/verify` section in workflow.md is the strict mechanical audit; `/review` section rewritten as lighter human-touch pass; thin pointers in 3 surfaces updated/rewritten accordingly. | ✅ |
| **G8** Per-Phase Permissions table | Present in `templates/workflow.md` § Per-Phase Permissions; mirrored in `templates/CLAUDE.md` § Per-Phase Permissions. Covers all 21 commands. | ✅ |
| **G9** `/scan` standalone | New `/scan` command in workflow.md, all 3 surfaces. `/bootstrap` section explicitly references it as the standalone discovery alternative. | ✅ |
| **G10** `/conventions-sync` | All 3 surfaces. Workflow.md section requires diff approval before writing and preserves `<!-- manual -->` blocks. | ✅ |
| **G11** `/spec-status` + `/spec-conflicts` | Both commands added to all 3 surfaces. Note: existing `sddx-workflow status` CLI is unchanged and complements these agent commands. | ✅ |
| **G12** `/spec-clarify` + Clarifications section | Command in all 3 surfaces. `/spec-plan` step 2 checks Clarifications for unanswered blockers. Spec template `1-requirements.md` now contains a Clarifications section. | ✅ |
| **G13** `/spec-analyze` | All 3 surfaces. Workflow.md defines the three checks (goal→task, plan→task, scope creep) and the output file `analysis.md`. | ✅ |
| **G14** CLAUDE.md enrichments | Quick Reference grouped into 5 categories; Per-Phase Permissions table; Files-to-Read-Per-Command table; Anti-Patterns list. | ✅ |

---

## Acceptance scenario coverage

Every scenario in `1-requirements.md` maps to a workflow.md section and at least one delivery surface. Walked through each — all are addressed by the implementation. The mechanical assertion (e.g. "snapshot folder exists at `.sdd/snapshots/<feature>/<timestamp>/`") was exercised live during the smoke test.

Outstanding: the *behavioral* scenarios for the new agent commands (e.g. `/spec-amend` actually appending a CR, `/verify` writing `verify-report.md`) cannot be exercised inside this build because they are executed by the agent at runtime, not by the CLI. Their definitions are present and unambiguous in `templates/workflow.md`, which is the contract.

---

## Build / install verification

- `npm run build` → green, `dist/cli.js` produced (~19 KB)
- `node dist/cli.js init` in `/tmp/sddx-smoke` (non-TTY) → 21 claude commands + 21 codex skills + 22 copilot prompts (10 + 11 new + copilot-instructions) + single-file rules for cursor/windsurf/zed/gemini + CLAUDE.md + AGENTS.md + GEMINI.md + `.sdd/config.json` (`team` default)
- `node dist/cli.js snapshot test-feature` → `.sdd/snapshots/test-feature/<timestamp>/` with 3 files
- `node dist/cli.js snapshot test-feature --list` → lists existing snapshots
- `node dist/cli.js snapshot nonexistent` → error and exit 1
- `node dist/cli.js update` → refreshes 68 files; `.sdd/config.json` untouched (correct)

---

## Non-goals respected

- ✅ No daemon, watcher, or background process.
- ✅ No Python/uv/pipx.
- ✅ No automatic structural decisions — every CR, gap, and analysis still gates on human approval.
- ✅ Only addition to JSON is `.sdd/config.json` (config, not content).
- ✅ Existing installs upgrade non-destructively via `sddx-workflow update`.
- ✅ Snapshots independent from git.

---

## Post-audit gap closure (2026-05-14, second pass)

User audit caught two partial implementations against the original document:

1. **G6** asked for the *generated* `workflow.md` to adapt its ceremony-levels and stop-points tables per install. Initial implementation kept a single canonical file. **Closed:** `init` now injects a 3-line ceremony header right after the top-level title via `injectCeremonyHeader()` in `src/commands/init.ts`. The header names the active level, the required flow, and the mandatory features. The canonical workflow.md remains the source of truth for all three levels; the header is the per-install personalization.

2. **G9** asked for an `--existing` flag on `npx sddx-workflow init`. Initial implementation shipped only the `/scan` agent command. **Closed:** `init` now accepts `--existing` (registered in `src/cli.ts`); when set, the next-steps panel recommends `/scan` then `/bootstrap --scan` instead of `/bootstrap`. The banner also reflects "(existing project mode)".

Re-smoke-tested after the fixes: `node dist/cli.js init --existing` in a fresh dir injects the `> **Active ceremony level: Team / Product.**` banner into `.sdd/workflow.md` and prints brownfield-appropriate next-steps. Build re-green (21.21 KB).

## Conclusion

All 14 goals delivered (post gap-closure). Build green. Smoke tests pass for both `--existing` flag and ceremony header injection. Ready for `/review` and `/finish`.
