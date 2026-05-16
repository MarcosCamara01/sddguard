# sddx-workflow

[![npm](https://img.shields.io/npm/v/sddx-workflow)](https://www.npmjs.com/package/sddx-workflow)
[![node](https://img.shields.io/node/v/sddx-workflow)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/sddx-workflow)](LICENSE)

Slash-command workflows for AI-assisted projects.

`sddx-workflow` installs a local Spec-Driven Development protocol for AI agents. The CLI is intentionally small: it copies Markdown command definitions into your project, then you work inside your agent chat with commands like `/spec-plan`, `/spec-tasks`, `/verify`, and `/finish`.

Works with any project: Next.js, Python, React, Django, Go, Rails.
Provider templates are included for Claude Code, OpenAI Codex, GitHub Copilot, Gemini CLI, Windsurf, Cursor, and Zed.

```bash
npx sddx-workflow init
```

After that, the main workflow happens in your AI agent:

```text
/spec-new auth-refresh
/spec-plan auth-refresh
/spec-tasks auth-refresh
/verify auth-refresh
/review auth-refresh
/finish
```

---

## What this is

`sddx-workflow` is an installer for local AI-agent workflows.

It gives your agent a protocol for:

- clarifying requirements before planning;
- writing an approved technical plan before coding;
- executing one task at a time with test-first discipline;
- stopping on implementation gaps instead of improvising;
- recording post-approval changes as Change Requests;
- verifying implementation coverage before final review.

It is **not** a daemon, server, background process, database, or full task runner. Most commands are Markdown instructions executed by your agent, not terminal subcommands.

There are two command surfaces:

- **CLI commands** run in your terminal: `npx sddx-workflow init`, `sddx-workflow status`, `sddx-workflow snapshot auth-flow`.
- **Agent commands** run inside your AI tool: `/spec-plan`, `/spec-tasks`, `/verify`, `/finish`.

---

## Why this exists

AI agents tend to implement without validating assumptions, refactor more than asked, and silently make structural decisions when requirements are unclear.

This protocol gives the agent explicit stop points:

- plan before code;
- ask before guessing;
- verify before finish;
- amend specs through a visible CR instead of editing approved docs silently.

---

## Quick start

New project:

```bash
# 1. Initialize the workflow in your project
npx sddx-workflow init

# 2. Populate project context (run with your AI agent)
/bootstrap

# 3. Build a feature, using a real feature name
/spec-new auth-refresh
/spec-plan auth-refresh     # stops for your approval before code
/spec-tasks auth-refresh    # snapshots first, then executes task by task
/verify auth-refresh        # mechanical audit — writes verify-report.md
/review auth-refresh        # qualitative final pass
/finish                     # stage files + propose a commit message
```

Existing project:

```bash
npx sddx-workflow init --existing

# Then ask your agent to discover the codebase before writing context files:
/scan
/bootstrap --scan
```

---

## Which flow should I use?

| Situation | Use |
|---|---|
| Small confirmed bug | `/bugfix` → `/finish` |
| Behavior-preserving cleanup | `/refactor` → `/finish` |
| New feature | `/spec-new <name>` → `/spec-plan <name>` → `/spec-tasks <name>` |
| Unsure how the code works | `/ask` |
| Comparing libraries or approaches | `/research <feature> <topic>` |
| Requirements are ambiguous before planning | `/spec-clarify <feature>` |
| Implementation is blocked mid-task | `/impl-gap <feature>` |
| Approved requirements or plan must change | `/spec-amend <feature> <change-summary>` |
| Work is done and needs audit | `/verify <feature>` → `/review <feature>` |

Most commands are protocol instructions for the agent, stored as local Markdown. The CLI stays small on purpose: it installs the protocol, manages ceremony/config, reports status, and creates snapshots.

---

## CLI reference

```bash
npx sddx-workflow init                  # Initialize in current project
npx sddx-workflow init --existing       # Brownfield next steps: /scan then /bootstrap --scan
npx sddx-workflow init --force          # Overwrite existing files

npx sddx-workflow add domain auth       # Add a domain file
npx sddx-workflow add domain payments
npx sddx-workflow add domain storage
npx sddx-workflow add domain email

npx sddx-workflow status                # Show current workflow state
npx sddx-workflow snapshot <feature>    # Copy spec files into .sdd/snapshots/
npx sddx-workflow snapshot <feature> --list
npx sddx-workflow set-ceremony team     # solo | team | enterprise
npx sddx-workflow update                # Update workflow templates
```

Files are **copied locally** — your project owns them. No runtime dependency. Edit freely.

---

## Updating an existing install

`sddx-workflow update` refreshes workflow files that already exist in your project. It does not silently create newly introduced provider commands in older installs, because that could surprise teams that customized their local workflow.

Use this rule of thumb:

| Need | Command |
|---|---|
| Refresh files you already have | `sddx-workflow update` |
| Reinstall everything from the current template set | `sddx-workflow init --force` |
| Add a domain file | `sddx-workflow add domain auth` |

Before using `init --force`, review your local changes to `.sdd/`, provider command files, `CLAUDE.md`, and `AGENTS.md`.

---

## Generated structure

```
.sdd/
  workflow.md          # Commands, ceremony levels, stop points
  project-overview.md  # What this app is — populated by /bootstrap
  conventions.md       # Stack and patterns — populated by /bootstrap
  config.json          # Ceremony level and feature flags
  domains/             # Domain-specific rules (auth, payments, etc.)
  snapshots/           # Created lazily by sddx-workflow snapshot
specs/
  _template/
    1-requirements.md  # Problem, goals, acceptance criteria (BDD)
    2-plan.md          # Technical plan — requires approval before coding
    3-tasks.md         # Atomic task checklist with TDD gate
    amendments.md      # Change Request log template
    impl-gaps.md       # Implementation gap log template
    verify-report.md   # /verify report template
CLAUDE.md              # Agent entry point — points to .sdd/
```

What you usually edit:

- `.sdd/project-overview.md` — product context and non-goals.
- `.sdd/conventions.md` — stack, file layout, testing, naming, manual conventions.
- `specs/<feature>/1-requirements.md` — requirements for one feature.
- `specs/<feature>/2-plan.md` — approved technical plan.
- `specs/<feature>/3-tasks.md` — task checklist generated from the plan.

What is generated as history or reports:

- `specs/<feature>/amendments.md` — Change Requests after approval.
- `specs/<feature>/impl-gaps.md` — blocked implementation decisions.
- `specs/<feature>/verify-report.md` — read-only audit output.
- `.sdd/snapshots/<feature>/...` — restore points for spec files.

---

## Agent commands

| Command | Purpose |
|---|---|
| `/bootstrap` | Populate project context via interview or codebase scan |
| `/scan` | Discovery-only brownfield scan — writes `scan-report.md`, no `.sdd/` writes |
| `/conventions-sync` | Refresh `.sdd/conventions.md`, preserving `<!-- manual -->` sections |
| `/ask` | Research and exploration — no code changes |
| `/research` | Non-binding research artifact before planning |
| `/assume` | Surface all assumptions before acting |
| `/bugfix` | Reproduce → diagnose → fix → validate |
| `/refactor` | Restructure without behavior change (green baseline required) |
| `/spec-new` | Scaffold a spec folder for a feature |
| `/spec-clarify` | Structured pre-plan clarification |
| `/spec-plan` | Generate technical plan — **stops for approval before any code** |
| `/spec-tasks` | Execute plan one atomic task at a time, TDD-first |
| `/impl-gap` | Stop and report implementation-time ambiguity |
| `/spec-amend` | Change Request for post-approval spec edits |
| `/spec-restore` | Restore spec files from a snapshot |
| `/spec-analyze` | Cross-consistency analysis across requirements, plan, and tasks |
| `/verify` | Strict mechanical audit — report only |
| `/review` | Qualitative final pass after `/verify` |
| `/spec-status` | Show all active specs and their phase |
| `/spec-conflicts` | Detect planned file conflicts across active specs |
| `/finish` | Stage files + generate conventional commit message |

### Ceremony levels

`init` asks for a ceremony level in interactive terminals and defaults to `team` in non-TTY installs.

Ceremony levels guide the recommended flow. They do not remove commands or enforce runtime permissions; the full protocol stays readable in `.sdd/workflow.md`.

| Level | Feature flow |
|---|---|
| Solo / MVP | `/spec-plan` → `/spec-tasks` → `/finish` |
| Team / Product | `/spec-new` → `/spec-plan` → `/spec-tasks` → `/verify` → `/review` → `/finish` |
| Enterprise | `/spec-new` → `/spec-clarify` → `/spec-plan` → `/spec-tasks` → `/verify` → `/review` → `/finish` |

Post-approval spec changes go through `/spec-amend`; implementation-time ambiguity goes through `/impl-gap`.

---

## How approval works

The agent is allowed to draft plans and reports, but structural decisions stay with the human.

- `/spec-plan` stops before code. You approve the plan before `/spec-tasks`.
- `/spec-tasks` can edit code and tests, but not approved requirements or plan files.
- `/impl-gap` records a blocker and waits for direction.
- `/spec-amend` records a Change Request and waits for approval before changing `1-requirements.md` or `2-plan.md`.
- `/verify` and `/review` are read-only, except for their report output.

This is intentionally not a daemon, server, or database. The workflow is plain files plus agent instructions.

---

## Provider support

| Provider | Installed files |
|---|---|
| Claude Code | `.claude/commands/*.md`, `CLAUDE.md` |
| OpenAI Codex | `.agents/skills/*/SKILL.md`, `AGENTS.md` |
| GitHub Copilot | `.github/prompts/*.prompt.md`, `.github/copilot-instructions.md` |
| Gemini CLI | `.gemini/commands/*.toml`, `GEMINI.md` |
| Windsurf | `.windsurf/workflows/*.md`, `.windsurf/rules/sddx-workflow.md` |
| Cursor | `.cursor/rules/sddx-workflow.mdc` |
| Zed | `.rules` |

Providers with native slash-command or workflow support get per-command files. Rule-only providers get the protocol as project context.

---

## Execution principles

Enforced by every command:

1. **Surface assumptions** — list them before acting, not mid-execution
2. **Minimum code** — only what was asked; no "while I'm here" changes
3. **Surgical changes** — touch only what the task requires
4. **Verify before moving on** — define "done" before starting, not after
5. **Use the right channel for changes** — `/impl-gap` for blocked tasks, `/spec-amend` for approved spec edits

---

## Spec structure

Each feature lives in `specs/<name>/` with three files:

**`1-requirements.md`** — Problem, measurable goals (G1, G2…), BDD acceptance criteria, constraints, open questions (blocking vs. non-blocking).

**`2-plan.md`** — Goals coverage, assumptions confirmed via `/assume`, approach + tradeoffs, components affected, abort criteria. Requires explicit approval before execution starts.

**`3-tasks.md`** — One task at a time. Each has: test to write first (red → green), files to change, goal ID, and acceptance scenario. Completed specs move to `specs/_done/`.

---

## Development

```bash
git clone https://github.com/MarcosCamara01/sddx-workflow.git
cd sddx-workflow
npm install
npm run dev      # watch mode
npm run build    # production build
```

### Publishing

```bash
npm version patch   # bug fix:     0.1.0 → 0.1.1
npm version minor   # new feature: 0.1.0 → 0.2.0
npm publish
```

Users running `npx sddx-workflow init` always get the latest version. Existing `.sdd/` files are never overwritten on update — use `--force` to explicitly replace them.

---

## License

MIT
