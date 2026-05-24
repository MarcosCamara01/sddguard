# Project Overview

## What This App Does

`sddx-workflow` is a small Node.js CLI that installs a Spec-Driven Development protocol into a target project. The product is the Markdown workflow it copies: `.sdd/` context files, `specs/_template/` templates, and provider-specific agent command files for Claude Code, OpenAI Codex, GitHub Copilot, Gemini CLI, Windsurf, Cursor, and Zed.

The CLI installs and refreshes files that guide AI agents through clarify, plan, execute, verify, review, and finish phases with explicit human stop points. It also provides lightweight executable checks (`gate`, `status --strict`, `commands --installed`, `doctor`) so CI or an obedient agent can catch common protocol blockers before moving forward.

## What It Does NOT Do

- No daemon, server, database, watcher, or runtime hook in the target project.
- No automatic implementation of agent commands such as `/spec-plan` or `/verify`; those are instructions consumed by the AI tool.
- No hard sandbox preventing an AI from editing files if it ignores the protocol; executable gates are opt-in checks, not an operating-system-level lock.
- No project-stack detection in the CLI beyond copying templates and printing next steps.
- No custom domain generation beyond built-in templates for `auth`, `payments`, `storage`, and `email`.
- No silent refresh of project-owned context or provider entrypoints/rules. `update` and `init --force` preserve `.sdd/project-overview.md`, `.sdd/conventions.md`, `.sdd/domains/`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, Copilot instructions, Cursor/Windsurf rules, and `.rules`.

## Main Domains

- **Installation** — `init`, `init --all`, `init --provider`, `init --existing`, and `init --force` create the protocol files and selected provider integrations.
- **Maintenance** — `update`, `update --check`, and `doctor` refresh or inspect installed managed protocol files; `doctor` fails non-zero for missing core files or partial provider installs.
- **Inspection and gates** — `status` summarizes bootstrap/spec state, `status --strict` fails on blocking states, `commands --installed` reports installed command files, and `gate <phase> <feature>` checks whether critical phases may proceed.
- **Provider registry** — `src/providers.ts` maps provider IDs to files copied from `templates/`.
- **Protocol templates** — `templates/` contains the workflow, provider entrypoints, command files, domains, and spec templates.

## Architecture Decisions

- **Installer-only design.** The target project owns copied Markdown files; no runtime dependency remains after install.
- **Plain Markdown protocol.** Specs, plans, tasks, gaps, amendments, and verify reports are human-readable and diffable.
- **Flat provider registry.** Provider files are declared in `src/providers.ts`; command-aware providers derive command file lists from `COMMAND_NAMES`.
- **Conservative update semantics.** `update` only refreshes managed workflow/command files that already exist locally; it preserves user-owned provider entrypoints/rules and does not create newly introduced provider command files.
- **Procedural TypeScript.** Subcommands are small functions under `src/commands/`; shared helpers live in `src/utils.ts` and `src/providers.ts`.
- **CommonJS bundle.** `tsup` emits `dist/cli.js` as the npm bin target.

## Definition of Done

A change is done when:

- `npm ci` can install dependencies from `package-lock.json`.
- `npm run check` passes Biome checks.
- `npm test` passes; it runs check, build, and the `node:test` suite.
- `npm pack --dry-run` shows the expected runtime package contents.
- CLI behavior is smoke-tested in a scratch directory for affected install/update/status/doctor flows.
- Protocol changes are reflected consistently across `.sdd/workflow.md`, README, provider entrypoints, and command-aware provider templates.
- Project-owned context files are not overwritten unless the user explicitly edits them.

## Current Verification Baseline

As of the current audit run on 2026-05-23:

- `npm ci` passes with 0 vulnerabilities reported by npm.
- `npm run check` passes.
- `npm test` passes: 34 tests, 34 pass.
- `npm pack --dry-run` succeeds and reports 128 packaged files.
- `npm run build` succeeds and emits `dist/cli.js`.

The current audit artifact is `WORKFLOW_AUDIT_REPORT.md`, generated from a fresh audit run using temporary real projects under `/tmp/sddx-workflow-audit-2026-05-23-0oJweA/`.
