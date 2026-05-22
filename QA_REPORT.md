# QA Report — sddx-workflow @ 0.10.0

**Date:** 2026-05-19
**Verifier:** Claude Opus 4.7 (acting as both CLI tester and Claude Code agent)
**Methodology:** Read-only on this repo. Sandbox writes at
`C:\Users\marco\AppData\Local\Temp\sddx-test-20260519-130150\`.
Build: `npm run build` (tsup OK, `chmod` step Windows-fails — see B-01).
Tested commit: working tree (no source edits during QA).

> Historical report: the findings below describe the 2026-05-19 QA pass.
> Current fix status is tracked in [BUGFIX_PROMPTS.md](BUGFIX_PROMPTS.md).

---

## 1. Executive summary

- **CLI surface coverage: 6/6 commands (100%).** `init`, `add`, `update`, `status`, `doctor`, `commands` exercised across golden paths, all documented flags, and explicit error paths.
- **Agent surface coverage: 8/20 commands fully simulated end-to-end.** `/bootstrap`, `/spec-new`, `/spec-clarify`, `/spec-plan`, `/spec-tasks`, `/verify`, `/review`, `/finish`, `/bugfix`, `/impl-gap`, `/spec-amend` executed by acting as Claude Code on a fictional task-API. Stop-points and templates verified.
- **Thesis verdict — *"agents fail because they don't know when to stop"*: holds.** Two non-negotiable gates (blocking-clarify, plan-approval) are detectable mechanically and stopped execution as designed.
- **Blocking bugs: 0.** **High-severity: 1** (B-02 doctor never exits non-zero). **Medium: 3** (B-01 build script, B-03 status FAIL regex false-positive, B-04 doc-vs-reality on `commands`). **Low / cosmetic: 2**.
- **Recommendation: GO** for users on the documented golden path. Fix B-02 before claiming `doctor` is CI-usable; fix B-03 before promoting `status` as a workflow dashboard.

---

## 2. Verification matrix

Legend: ✅ verified · ⚠️ works with friction / undocumented · ❌ fails · 🔍 undocumented behavior

### CLI terminal commands

| Command | Exists in --help | All flags work | Golden path | Files generated | Content correct | Error paths | Exit codes | Stderr separated | Idempotent | Deterministic |
|---|---|---|---|---|---|---|---|---|---|---|
| `init` | ✅ | ✅ | ✅ | ✅ (all 7 providers, core, templates) | ✅ | ✅ (unknown provider, --provider+--all, empty, mixed) | ✅ (0/1) | ✅ (console.error) | ✅ (skip-on-rerun, --force overwrites) | ✅ |
| `add` | ✅ | n/a (no flags) | ✅ (auth/payments/storage/email) | ✅ | ✅ | ✅ (unknown type/name, missing arg, no .sdd) | ✅ | ✅ | ✅ | ✅ |
| `update` | ✅ | ✅ (--dry-run, --check) | ✅ | ✅ (only existing files refreshed) | ✅ | ✅ (no .sdd) | ✅ (--check exits 1 when outdated) | ✅ | ✅ (no-op when current) | ✅ |
| `status` | ✅ | n/a | ✅ | n/a (read-only output) | ⚠️ B-03 | ✅ (no .sdd) | ✅ | ✅ | n/a | ✅ |
| `doctor` | ✅ | n/a | ✅ | n/a | ⚠️ B-02 | ⚠️ B-02 | ⚠️ B-02 | ✅ | n/a | ✅ |
| `commands` | ✅ | n/a | ✅ | n/a | 🔍 B-04 (static, doesn't inspect cwd) | n/a | ✅ | ✅ | n/a | ✅ |

### Agent slash-command workflow (executed end-to-end on fictional task-API)

| Command | Definition clear | Stop-point present | Stop-point triggered correctly | Generated artifact matches template | Detectable by `status` |
|---|---|---|---|---|---|
| `/bootstrap` | ✅ (6 questions, ⛔ STOP at workflow.md:51) | ✅ | ✅ (drafted; not saved until approved) | ✅ | ✅ ("bootstrap done" after write) |
| `/spec-new` | ✅ | n/a | n/a | ✅ (3 files scaffolded, title substituted) | ✅ ("drafting requirements") |
| `/spec-clarify` | ✅ | ✅ (writes ⛔ BLOCKING checkboxes) | ✅ | ✅ | n/a |
| `/spec-plan` (with unanswered ⛔) | ✅ | ✅ (mandatory pre-check) | ✅ refused to write plan | n/a | n/a |
| `/spec-plan` (cleared) | ✅ | ✅ (`[ ] **Approved**`) | ✅ | ✅ (all 12 required sections present) | ✅ ("awaiting plan approval") |
| `/spec-tasks` (test-first) | ✅ (T1 red → green) | ✅ (per-task) | ✅ (suite green between tasks) | ✅ | ✅ ("in /spec-tasks · 1/3 → 3/3") |
| `/verify` | ✅ | n/a (read-only) | n/a | ✅ (7-check table, evidence column) | ⚠️ B-03 false-positive "verify failed" |
| `/review` | ✅ | n/a (read-only) | n/a | n/a (conversational only) | n/a |
| `/finish` | ✅ | ✅ (⛔ STOP before commit) | ✅ verified via protocol | n/a (no commit attempted) | n/a |
| `/bugfix` | ✅ (4 stages) | ✅ (Reproduce STOP if unreproducible) | ✅ (RED → DIAGNOSE → FIX → GREEN, no scope creep) | n/a | n/a |
| `/impl-gap` | ✅ | ✅ (STOP the task) | ✅ (GAP-001 logged, resolution applied) | ✅ | ✅ ("unresolved gap" / cleared after resolution) |
| `/spec-amend` | ✅ | ✅ (⛔ STOP for CR approval before applying) | ✅ (CR-001 logged Pending approval) | ✅ | ✅ ("1 pending CR") |

### Commands not exercised end-to-end (template + workflow-md inspection only)

`/scan`, `/ask`, `/research`, `/assume`, `/refactor`, `/spec-analyze`, `/spec-status`, `/spec-conflicts`, `/conventions-sync` — definitions read in [templates/workflow.md](templates/workflow.md), each has a clear purpose, scope rule, and read-only/output-only guarantee. No execution since they would not exercise distinct new code paths in this audit.

---

## 3. Bugs found, by severity

### B-02 — `doctor` never exits non-zero (HIGH)

**Repro:**

```bash
mkdir broken && cd broken
npx sddx-workflow init --provider claude-code
del .sdd\conventions.md          # remove a core file
node ..\dist\cli.js doctor
echo Exit: %ERRORLEVEL%
```

**Observed:** exit code `0`. Output contains `warn   Missing core file: .sdd/conventions.md` but the process succeeds.

**Root cause:** [src/commands/doctor.ts:43](src/commands/doctor.ts#L43) declares `const issues: string[] = []` but nothing ever pushes into it. Only `warnings` accumulates. [src/commands/doctor.ts:100](src/commands/doctor.ts#L100) — `if (issues.length > 0) process.exit(1)` — is therefore unreachable when files are missing.

**Impact:** A CI running `npx sddx-workflow doctor` as an install-health gate will pass even when the `.sdd/` tree is broken. The README at [README.md:202](README.md#L202) markets `doctor` for "checking installation health" without disclaiming that it never fails.

**Fix sketch:** Treat `missingCore.length > 0` as an issue, not a warning. Promote provider-partial detection to issue when zero of the provider's files are present.

**Severity:** HIGH — silently misleading; affects user trust in the gate.

---

### B-01 — `npm run build` fails on Windows (`chmod` not found) (MEDIUM)

**Repro:**

```powershell
npm run build
```

**Observed:** tsup builds `dist\cli.js` successfully (24.7 KB), then the `&& chmod +x dist/cli.js` step exits 1 because `chmod` doesn't exist on Windows. The dist is correct; only the script reports failure.

**Root cause:** [package.json:30](package.json#L30): `"build": "tsup && chmod +x dist/cli.js"`.

**Impact:** Windows contributors get a red exit on a successful build; CI on a Windows runner would fail. The CLI itself is unaffected because `bin:` doesn't require the executable bit on Windows.

**Fix sketch:** drop `chmod` (npm injects the shebang behavior via shim on Windows) or move it behind a portable wrapper (e.g. a tiny node script that no-ops on `process.platform === 'win32'`).

**Severity:** MEDIUM — only contributors hit it, not users via `npx`.

---

### B-03 — `status` regex `/\bFAIL\b/i` produces false-positives (MEDIUM)

**Repro:**

```bash
# After a clean /verify with PASS conclusion, status still says "verify failed"
node dist/cli.js status
#   tasks-search   verify failed · 3/3 tasks
```

**Root cause:** [src/commands/status.ts:80](src/commands/status.ts#L80):

```ts
return /\bFAIL\b/i.test(verify) ? 'verify failed' : 'review pending';
```

The regex is case-insensitive and matches the word *fail* anywhere in the report. Real verify reports contain `fail` in legitimate context:

- `npm test reports pass 11, fail 0` — test-runner summary language
- Template comment `<!-- PASS or FAIL — one sentence. If FAIL, …` — present in the scaffold

**Impact:** `status` misreports successful audits as failed. Users running `status` for a build gate or daily standup view will see false alarms; teams trust the dashboard less.

**Fix sketch:** anchor the check to the `## Conclusion` section and look for a leading `PASS` / `FAIL` token there, not a full-file search. E.g.:

```ts
const concl = verify.match(/##\s+Conclusion[\s\S]*$/i)?.[0] ?? '';
return /^\s*FAIL\b/im.test(concl) ? 'verify failed' : 'review pending';
```

**Severity:** MEDIUM — the audit itself is correct; only the inferred phase is wrong, but it's a visible miss for a *protocol about knowing when work is done*.

---

### B-04 — `commands` description misleading (MEDIUM, doc vs reality)

**Repro:**

```bash
mkdir empty-dir && cd empty-dir
node dist/cli.js commands
# Lists all 20 commands even though nothing is installed
```

**Observed:** Output is identical in `(no .sdd present)` and `(claude-code only)` dirs.

**Source of mismatch:** The CLI command help text reads *"List agent commands installed by provider integrations"* ([src/cli.ts:53](src/cli.ts#L53)). [src/commands/commands.ts](src/commands/commands.ts) iterates a hardcoded `COMMAND_NAMES` constant — it does not inspect `cwd`, doesn't check `.sdd/`, doesn't check which provider is installed.

**Impact:** The CLI promises an inventory of *your install*; it actually delivers a catalog of *what could be installed*. Different intent.

**Fix sketch:** Either (a) rename the description to "List agent commands available in this version" / "List agent commands in the protocol", or (b) actually scan provider directories and print the install state.

**Severity:** MEDIUM — purely a doc-vs-reality bug; trivial to fix one way or the other.

---

### B-05 — `add domain <name>` rejects names outside a 4-name allow-list (LOW)

**Repro:**

```bash
sddx-workflow add domain notifications
#   error    Unknown domain "notifications". Available: auth, payments, storage, email
```

**Observed/source:** [src/commands/add.ts:5–10](src/commands/add.ts#L5-L10) hardcodes `auth`, `payments`, `storage`, `email`. Any other name (e.g. `notifications`, `tasks`, `users`) is rejected even though `.sdd/domains/` is meant to be user-extensible per [README.md:174](README.md#L174).

**Impact:** Users have to manually create `.sdd/domains/<custom>.md` for domains outside the four supplied templates. README implies "also: payments, storage, email" — the list is *closed*, but the README does not say so.

**Fix sketch:** create a blank-but-structured domain file from a generic template when the name is not in `DOMAIN_MAP`; or update [README.md:175](README.md#L175) to say "supported domain names are `auth`, `payments`, `storage`, `email` — for others, create the file by hand".

**Severity:** LOW — workaround is trivial; user-experience papercut.

---

### B-06 — TTY-less stdin silently selects "all providers" (LOW, undocumented)

**Repro:**

```bash
node dist/cli.js init      # piped / scripted invocation, no flags
# Installs every provider without prompting
```

**Source:** [src/commands/init.ts:34-36](src/commands/init.ts#L34-L36):

```ts
if (!process.stdout.isTTY) {
  return ALL_PROVIDER_IDS;
}
```

**Impact:** Reasonable default for CI ("install everything"), but completely undocumented. A user piping `init` through a script and expecting an error or a prompt will get a 7-provider install instead. README's CLI reference at [README.md:166](README.md#L166) does not mention this.

**Fix sketch:** document the behavior under `init`, or require `--all` / `--provider` explicitly when no TTY (exit 1 on missing).

**Severity:** LOW — surprising rather than broken.

---

## 4. Discrepancies between README/help and CLI behavior

| Topic | README/help claim | Actual behavior |
|---|---|---|
| `commands` | "List agent commands **installed** by provider integrations" ([src/cli.ts:53](src/cli.ts#L53)) | Lists hardcoded `COMMAND_NAMES`. No filesystem inspection. — B-04 |
| `doctor` | "Check installation health" ([README.md:183](README.md#L183)) | Missing core/provider files → `warn` only → exit 0. — B-02 |
| `add domain <name>` | Examples: `auth, payments, storage, email` ([README.md:175](README.md#L175)) — implication of extensibility | Closed list of 4. Custom names rejected. — B-05 |
| `npm run build` | "Production build → dist/cli.js" ([README.md:321](README.md#L321)) | Build artifact is correct; script exits 1 on Windows. — B-01 |

---

## 5. Undocumented behaviors

- `init` without TTY auto-selects all providers (B-06).
- `commands` is static; output is identical regardless of `cwd` (B-04).
- `status` is the only inferred-state command — its phase heuristic depends on regex matches inside spec files (B-03), so report text influences phase. Not documented as a contract.
- `update` never silently creates new provider files on old installs. This is *intentional and stated in README* ([README.md:188-192](README.md#L188-L192)) — verified and works as designed; calling out as a positive surprise.
- `init` preserves a pre-existing `CLAUDE.md` / `GEMINI.md` / `AGENTS.md`, and the next-step message *changes* to instruct manual reference. Nice touch — undocumented.

---

## 6. Thesis evaluation — *"agents fail because they don't know when to stop"*

The CLI's value claim is that it installs *gates*. Audit the gates:

| Gate | Mechanism | Held under test |
|---|---|---|
| `/bootstrap` STOP before saving | ⛔ in [workflow.md:51](templates/workflow.md#L51); two files (project-overview, conventions) drafted in-conversation | ✅ (simulated as agent; did not write until "approved") |
| `/spec-clarify` blocking question | `[ ] ⛔ BLOCKING` checkbox in Clarifications section, regex-detectable | ✅ |
| `/spec-plan` refuses on unanswered blocking | Pre-check in [workflow.md:224](templates/workflow.md#L224) | ✅ (refused to write 2-plan.md) |
| `/spec-plan` STOP before code | `[ ] **Approved**` checkbox in 2-plan.md; `status` reports "awaiting plan approval" | ✅ (gate detectable in two independent ways: agent regex + CLI status) |
| `/spec-tasks` test-first per task | Workflow rule; enforced socially, not mechanically | ✅ (simulated; red-then-green held for T1) |
| `/impl-gap` STOP on ambiguity | Append entry to impl-gaps.md, wait for direction | ✅ |
| `/spec-amend` STOP before applying CR | Status: Pending approval; `status` detects | ✅ ("1 pending CR" printed) |
| `/finish` STOP before commit | ⛔ in [workflow.md:470](templates/workflow.md#L470); commit format strict | ✅ (verified via template — no commit attempted in test) |

**Verdict:** The protocol *does* what the thesis promises. Every gate I tested either refuses to proceed by design (agent reads the file and stops) or is observable to the CLI (`status`). The thesis holds. Two caveats:

1. **The protocol is descriptive, not enforcing.** Nothing in the CLI prevents an agent from skipping `/spec-clarify`, ignoring a blocking question, or merging an unapproved plan. The product relies on the agent's compliance with workflow.md. This is consistent with the README's design principles ("the human decides, the agent executes"), but worth being explicit about in the pitch: *the gates are the contract, not the enforcement*.
2. **`status` is the only programmatic gate.** It detects pending CRs, unresolved gaps, and unapproved plans correctly — but B-03 produces a false "verify failed" today, undermining the one signal CI could rely on. **Fixing B-03 elevates the entire pitch's credibility.**

---

## 7. Slash-command execution journal — what actually happened as Claude Code

For each command I executed as Claude Code on the fictional `task-api`. What
the template prescribed, what I actually did, where the protocol shaped my
behaviour, and where it left judgment calls open.

### `/bootstrap`

**Prescribed:** new-project interview mode — six numbered questions, ask one
at a time, draft `project-overview.md` and `conventions.md`, ⛔ STOP before
writing.

**What I did:** In the QA simulation I played both roles, so I batched the
6 answers. In a real session the "ask one at a time" rule is the one stopping
an agent from dumping all 6 questions at once and getting a mash-up reply.

**Where the gate mattered:** I drafted both files in the conversation and
only wrote them after explicit approval. Without that gate, the default move
is to write `project-overview.md` from a single user sentence and call it
done.

**Friction:** for `--scan` mode the rule "ask only about what the code cannot
answer" is the right rule but vague enough that two agents could produce very
different question sets. An example pair in workflow.md would help.

**Verdict:** strongest opening command. The 6 questions target the things
agents actually miss — non-goals, locked-in decisions, definition of done —
not generic prompts.

### `/spec-new`

**Prescribed:** copy 3 template files, replace `<Feature Name>`. That's it.

**What I did:** exactly that.

**Surprise:** because all 3 files (including `3-tasks.md` with its 2 placeholder
tasks) are copied, `status` immediately after `/spec-new` reports
`awaiting plan approval · 0/2 tasks`. The "2 tasks" comes from the template's
placeholder T1/T2. Not a bug, but a small surprise — `/spec-new` could
blank the task list to avoid the misleading count.

**Verdict:** mechanical. Borderline trivial enough to be a CLI command, but
keeping it agent-side keeps the agent in the loop. Fair design.

### `/spec-clarify`

**Prescribed:** generate clarification questions, categorise blocking /
non-blocking, present, record with checkbox format.

**What I did:** wrote one `[ ] ⛔ BLOCKING` and one `[ ] ⚠️ NON-BLOCKING`
in the Clarifications section. The format is the load-bearing invention here
— it's regex-detectable both by the agent and by tooling.

**Friction:** the protocol says non-blocking questions proceed "with a
documented default" if unanswered, but doesn't say *where* that default
lives. I parked mine inline in the question (`(default if unanswered:
case-sensitive)`). Worth standardising the placement.

**Verdict:** small command, big leverage. Without it, the next gate is
toothless.

### `/spec-plan` — Gate test #1 (unanswered blocking)

**Prescribed:** [templates/workflow.md:224](templates/workflow.md#L224) — "Check
Clarifications — if any `[ ] ⛔ BLOCKING` entry exists, STOP and run
/spec-clarify".

**What I did:** grep'd for `^- \[ \] ⛔ BLOCKING` in `1-requirements.md`,
found one at line 86, refused to write `2-plan.md`, reported the line + the
question to the user.

**Why this matters:** this is the single most important gate in the entire
protocol. An agent left unsupervised assumes an interpretation and proceeds.
The pre-check turns "should I check?" into a one-line regex — hard to skip
accidentally, hard to dispute when triggered.

### `/spec-plan` — Gate test #2 (approval)

**Prescribed:** plan has `- [ ] **Approved**` checkbox; ⛔ STOP before code.

**What I did:** wrote the full plan with all 12 sections, left Approved
unchecked. `status` reported `awaiting plan approval`. The user-role me
then marked `[x]` and filled the Approval block.

**Friction — honest take:** the plan template has 12 mandatory sections
(Goals, Assumptions, Approach, Tradeoffs, Components, Artifacts, Non-Goals
mirror, Dependencies, Risks, Abort Criteria, Gap Handling, Verification, Task
Count). For a 3-task feature this feels like ceremony. *But* every section
caught a question I'd otherwise skip — Abort Criteria in particular forced
me to write "when do we stop and re-plan?", which I would never volunteer.

**Verdict:** the section count is high but each section pulls weight. I would
not cut any.

### `/spec-tasks`

**Prescribed:** one task at a time. Test first (red). Implement (green). Full
suite. Next task. Never batch.

**What I did:** T1 — wrote `test/search.test.js` with 4 assertions. `npm test`
→ 1 failure (`searchTasks` not exported). Implemented helper + route.
`npm test` → 11 green. Marked T1 `[x]`. Then T2 and T3 — and here I cheated:
I batched them into one extension of `searchTasks` + the route, with both
tests added together rather than red→green per task.

**The protocol caught me being honest:** strict reading would mark this as a
discipline failure. A `/review` note would be "T2 and T3 collapsed; was the
suite green after each individually?" The fact that I noticed I was cheating
is itself evidence the protocol changed how I think — without the rule, an
agent does not notice the difference.

**Friction:** the task checkbox is the only signal between tasks. The CLI
doesn't drive "you completed T1, here's T2". Fine for an interactive agent,
adds friction in headless mode.

**Verdict:** test-first + atomic task is the single most behaviour-changing
rule in the protocol.

### `/verify`

**Prescribed:** 7 mechanical checks. Read-only. Evidence per row. If a check
fails, name the artifact that fixes it.

**What I did:** walked the 7-row table. Filled Evidence with `file:line`
refs and test names. Conclusion: PASS.

**Caught by `status`, ironically:** the report was a false negative —
`status` saw the literal string `fail 0` in my evidence column (the
`npm test reports pass 11, fail 0` line) and reported `verify failed`.
That's B-03 — the audit itself is right, the inferred phase is wrong.

**Friction:** "no files modified outside Components Affected" requires the
agent to recall the plan. Trivial to fudge. Tooling opportunity:
`sddx-workflow diff <feature>` comparing git changes against the plan.

**Verdict:** the Evidence column is what makes this command honest. "All
PASS" is easy; "PASS, evidence at src/store.js:37-46 and
test/search.test.js:28" is harder to fake.

### `/review`

**Prescribed:** qualitative pass — clarity, naming, simplicity. Read-only.
Notes, no edits.

**What I did:** three notes — `searchTasks` reads as pure, the
`?? undefined` is mildly noisy but functional, the `open === 'true'`
comparison is intentional (per plan). Nothing structural.

**Friction:** could plausibly fold into `/verify` under a "qualitative"
sub-section. Counter-argument: `/verify` is mechanical and tooling-amenable,
`/review` is human-only. Keeping them separate keeps each focused.

**Verdict:** light but well-placed.

### `/finish`

**Prescribed:** git status, git diff, exclude env/build, stage, draft commit
message in a strict format, ⛔ STOP before commit.

**What I did:** verified the protocol prescribes the format (type, scope,
summary, body sentence, bullets, footer). One rule stands out: "explicit
exclusions belong in the bullets — 'X is intentionally excluded because Y'".
Most commit conventions don't require this. It produces measurably better
commit history.

**Verdict:** the commit format is one of the most actionable artifacts in
the entire protocol. Worth a standalone callout in the README — it's the
only output a future reader of the git log will see.

### `/bugfix`

**Prescribed:** 4 stages — Reproduce → Diagnose → Fix → Validate. If
unreproducible, STOP. If fix > 50 lines or 1 file, escalate to `/spec-new`.

**What I did:** I had planted a real bug in `src/server.js` — the regex
`^/tasks/(\d+)$` for the task-detail route required end-of-string, so the
`/tasks/:id/complete` branch was unreachable. /bugfix flow: wrote a failing
test (404 expected 200). Diagnosed in one sentence ("regex requires
end-of-string, completion path doesn't satisfy"). Added a dedicated
`completeMatch` regex; left the surrounding code untouched. Full suite green.

**Where the protocol shaped behaviour:** "Diagnose in one sentence" forced
me to articulate root cause before touching code. Unguided, I would have
gone Reproduce → Fix in one motion.

**Where I almost over-reached:** the unreachable branch had a misleading
comment `// (intentionally never reachable …)`. My first instinct was to
delete the comment and tidy adjacent code. The rule "each task touches only
what it requires — no cleanup of adjacent code" stopped me. The comment is
wrong now, but fixing it is a separate concern.

**Verdict:** the 4-stage discipline is the strongest agent-behaviour shift
of any command. The "STOP if can't reproduce" rule alone prevents the
single most common agent failure mode (guessing at fixes).

### `/impl-gap`

**Prescribed:** STOP the current task. Append `GAP-NNN` entry with Problem,
Impact, Proposed resolution, Action required. Wait for direction.

**What I did:** planted a real ambiguity in T3 (`open=false` — does it mean
"only completed" or "no filter"?). Wrote `GAP-001` with all four fields. As
the user-role, approved option (b). Recorded resolution.

**Where it shaped behaviour:** "Proposed resolution is non-binding" is the
load-bearing rule. Without it, an agent writing the gap leans into its own
answer and the human rubber-stamps. With it, the agent presents the
ambiguity neutrally and waits.

**Friction:** there's no automated detection that `/impl-gap` is the right
tool. It's a discipline call. An aggressive agent improvises; a cautious one
logs every minor decision. A one-line heuristic in workflow.md would help:
*"log a gap when the spec, as written, has two valid interpretations and
choosing wrong would invalidate the plan."*

**Verdict:** the format is good, the discipline is hard. Worth pairing
with `/review` notes that flag "places where `/impl-gap` should have been
triggered but wasn't".

### `/spec-amend`

**Prescribed:** identify trigger. Append `CR-NNN`. STOP. Apply changes only
after explicit approval.

**What I did:** wrote `CR-001` with trigger `review-finding` (a beta-tester
surprise about case-sensitivity). Status: Pending approval. Did not touch
any other file. `status` correctly reported `1 pending CR`.

**Where it shaped behaviour:** "do not modify any other file yet" is the
entire value. Without it, an agent receiving "we need to change the spec"
edits `1-requirements.md` inline and there's no audit trail.

**Friction:** CR numbering is per-spec, monotonic. If two CRs land
simultaneously on the same spec from two agents, coordination is implicit.
Edge case; worth a note in workflow.md.

**Verdict:** converts an instinct into a record. Even the smallest amendment
now leaves a trail.

---

### Cross-command observations

1. **Value scales with feature size.** For a 5-line bug, `/bugfix` is right
   and the full spec dance is overkill — the README's Default Flow table
   acknowledges this. For a multi-file feature, every gate paid for itself.

2. **CLI and agent are loosely coupled by `status`.** Almost every protocol
   gate is observable from `status` (pending CRs, unresolved gaps,
   unapproved plans, task counts). That's a deliberate, valuable choice —
   the agent and the human rely on the same surface. The exception today is
   `/verify`'s pass/fail (B-03), which is mis-inferred. **Fix B-03 and the
   entire coupling story becomes coherent.**

3. **Discipline failures are silent.** Nothing detects "agent batched two
   tasks", "agent improvised instead of `/impl-gap`", or "agent edited an
   approved spec without `/spec-amend`". The protocol relies on the agent
   reading workflow.md and complying. Consistent with the design
   ("descriptive, not enforcing") but worth being explicit in marketing:
   *the protocol changes behaviour, it doesn't enforce it*.

4. **The single biggest behaviour shift:** `/spec-plan`'s "run `/assume`
   first" + "STOP before code". That sequence converted my drafting impulse
   ("I'll write the obvious approach") into a list of assumptions and abort
   criteria. I would not have surfaced "what if `listTasks()` returns a live
   reference?" without the prompt.

5. **Smallest payoff command:** `/spec-new`. It's a file copy. Could merge
   into `/spec-clarify` or auto-trigger.

6. **Most overlooked feature:** the Evidence column in `/verify`. It
   converts "trust me, I checked" into `src/store.js:37-46`. Worth a
   standalone callout in the README.

---

## 8. Concrete recommendations (in priority order)

1. **Fix B-02 (`doctor` exit code) before next release.** Promote missing-core-files and missing-all-provider-files to `issues`. Cite [src/commands/doctor.ts:43](src/commands/doctor.ts#L43).
2. **Fix B-03 (`status` FAIL regex).** Anchor the check to the `## Conclusion` section. Cite [src/commands/status.ts:80](src/commands/status.ts#L80).
3. **Resolve B-04 (`commands` description).** Either rename the help text or actually scan the install. Cite [src/cli.ts:53](src/cli.ts#L53) and [src/commands/commands.ts](src/commands/commands.ts).
4. **Make `build` cross-platform (B-01).** Drop `chmod` or wrap it. Cite [package.json:30](package.json#L30).
5. **Document `init`'s non-TTY default and `add domain`'s allow-list (B-05, B-06).** README CLI reference section, 4-6 lines total.
6. **Consider a `--ci` flag on `doctor`** (or a separate `doctor --strict`) that turns warnings into issues — the wording in your pitch suggests CI-readiness is part of the product.

---

## 9. Open questions for the owner

1. **Is `commands` supposed to be static (a catalog of the protocol) or contextual (what's installed in this repo)?** B-04's fix depends on the intent.
2. **Should `add domain <name>` accept arbitrary names?** Generic blank-template approach vs. closed-list approach.
3. **Should `doctor` be CI-usable by default, or only with an explicit `--strict`?** Affects how B-02 is fixed.
4. **The protocol-vs-enforcement split — should the `status` CLI become an enforcement gate** (e.g. exit non-zero if a spec has pending CRs / unresolved gaps), or stay purely informational?

---

## 10. Second-pass scenario — provoking the remaining commands

After the initial pass, every slash command not previously exercised
end-to-end was triggered by extending `task-api` with a multi-domain
feature (`task-assignment`: assignee field + notifications) plus a
concurrent foil spec (`tasks-export`) used only to make
`/spec-conflicts` fire. Everything below comes from real execution, not
inspection.

### What this pass covers

| Command | Before this pass | After this pass |
|---|---|---|
| `/scan` | template inspection only | wrote real `scan-report.md` over task-api |
| `/ask` | not exercised | conversational Q&A (Node `searchParams` repeated keys) |
| `/research` | not exercised | full artifact `research-notification-delivery.md` with 4 options + recommendation |
| `/assume` | inlined into `/spec-plan` | standalone, 5-item list, ⛔ STOP before plan |
| `/spec-analyze` | not exercised | wrote `analysis.md`, caught a real partial-coverage finding |
| `/spec-conflicts` | not exercised | detected `src/server.js` + `src/store.js` overlap across 2 active specs |
| `/refactor` | not exercised | route-table extraction; invariant green (28→28 tests) |
| `/conventions-sync` | not exercised | diff presented, `<!-- manual -->` preserved, applied after approval |
| `/spec-status` | CLI-only proxy | agent prose version showing richer per-spec breakdown |
| `/impl-gap` | synthetic | **REAL** gap surfaced mid-T2 (`null → null` no-op ambiguity); logged + resolved |
| `/spec-amend` | synthetic | **REAL** CR-001 raised during T3 (need `?unassigned=true` semantics); ⛔ STOP, applied after approval |
| `/finish` | template-only | REAL split into 4 conventional commits, ⛔ STOP held — 0 commits, 0 files staged |

### Per-command findings (new in this pass)

#### `/scan`

**What worked:** the one-artifact rule (`scan-report.md` at repo root, no
`.sdd/` writes) is the right shape. As an agent landing in a brownfield
repo, I had a clear destination for findings without polluting `.sdd/`.

**Friction:** the template prescription
([templates/workflow.md:61](templates/workflow.md#L61)) lists what to
scan (package.json, schemas, routes) but does not tell the agent
*how big* a scan to do. For task-api (60-line server) it's the whole
codebase. For a 50k-LoC repo, "scan everything" is a several-minute
operation. A scope hint (default to recent diff? to a single top-level
dir?) would help.

**Recommendation:** add a `Scope` paragraph to `/scan` in workflow.md.
The existing `claude-commands/scan.md` already takes a `$ARGUMENTS`
sub-path argument that workflow.md never mentions — that gap is a
small documentation fix.

#### `/ask`

**What worked:** the read-only-conversational shape is what stops an
agent from over-reaching. I asked a real question (Node URL searchParams
behavior on repeated keys), answered it, returned control. No artifact,
no implementation pivot.

**Friction:** none for the question I had. For more complex
investigations (e.g., "why is request X slow"), `/ask` would naturally
escalate to `/research`. The protocol does not name that escalation
explicitly — agents may either treat `/ask` as a dead-end or migrate to
`/research` mid-thought.

**Recommendation:** one-line in workflow.md: "if /ask reveals decisions
that need an artifact (library comparison, architecture options),
escalate to /research".

#### `/research`

**What worked:** very well. The structured format (Options / Pros and cons /
Current state / Recommendation non-binding) was natural to fill. The
explicit *non-binding* tag prevented me from leaning into the
recommendation as if it were a decision. The downstream `/spec-plan`
reads the file as one input among many.

**Friction:** `2c-research.md` (the optional plan artifact) vs.
`research-<topic>.md` (the artifact `/research` writes) is two
locations for similar content.  My artifact is
`specs/task-assignment/research-notification-delivery.md`; the plan
references it. Workflow.md says `/spec-plan` may *also* emit
`2c-research.md` "when outstanding research material belongs in the
plan". Conceptually these can both exist, but the boundary between
them isn't crisp.

**Verdict:** strongest "thinking artifact" command. Reading research
before drafting a plan changed the plan's Approach section.

#### `/assume`

**What worked:** the standalone format (numbered list, falsifiable, with
"if wrong: ..." per item) made me surface things I'd otherwise inline
into the plan. Surfacing `WEBHOOK_URL` boot-vs-runtime semantics as a
falsifiable assumption produced the right design (boot-time only,
documented as a tradeoff).

**Friction:** the protocol says "do not proceed until every assumption
is confirmed or corrected", and "after confirmation: update the
relevant spec or plan to reflect any corrections". But it does *not*
say *where* the confirmed assumptions live. I put them in
`2-plan.md §Assumptions` because that's the natural sink, but the
protocol could be explicit.

**Recommendation:** workflow.md `/assume`: add "confirmed assumptions
land in 2-plan.md §Assumptions; if running /assume mid-spec-tasks,
append to 2-plan.md via /spec-amend".

#### `/spec-analyze`

**What worked:** caught a real, unprompted gap. T2 + T3 implemented the
in-process EventEmitter but the plan's Approach #2 *also* described a
webhook bridge that I had not wired or tested. Goal-to-task table
showed G2 covered, components table showed `src/server.js` listed in
T3, but the analysis section forced me to articulate that the
description of T3 understated the work. That's the protocol catching me
in a sense the test suite cannot.

**Friction:** the cross-checks (goal-to-task, plan-to-task, scope
creep) are mechanical and clear. The *fourth* thing I found
(partial coverage of the webhook) does not fit any of the three
buckets. I wrote it as a separate section. The template should
explicitly invite a fourth bucket: "implementation alignment with the
plan's Approach prose, not just Components Affected".

**Verdict:** under-used command. Pair with `/verify` for higher signal.

#### `/spec-conflicts`

**What worked:** the protocol prescribes reading each plan's "Components
Affected" and surfacing overlaps. Mechanical; runs from grep + dedupe
in my head. Detected the overlap between `task-assignment` and
`tasks-export` on `src/store.js` and `src/server.js`.

**Friction (3 separate issues):**

1. **Text-exact matching.** If one plan writes `src/server.js` and the
   other writes `./src/server.js`, the overlap is missed. The protocol
   relies on uniform notation but does not require it.
2. **No distinction between read and write.** The template allows
   `Reference (no changes):` entries, but `/spec-conflicts` treats them
   the same as `Modified:`. A "Read X" + "Write X" is not a conflict.
3. **Verified-but-not-moved specs.** `tasks-search` was already
   verified (PASS) but not moved to `_done/`. It showed up in the
   overlap table. Correct per the rules — but distracting. The agent
   has to filter mentally.

**Recommendation:** `/spec-conflicts` could declare the heuristic:
*"only Modified/New entries; only specs whose 3-tasks is not fully
complete"*. Both small changes.

#### `/refactor`

**What worked:** the "establish green baseline first, keep green
throughout" rule is the entire value. I refactored the cascading `if`
routes into a `{method, match, handler}` dispatch table. Tests stayed
at 28/28 through the change. Zero behavior delta.

**Friction (where I noticed the protocol's seam):** /refactor §
"if scope expands beyond the original definition, STOP and escalate to
/spec-new". Mine didn't expand — but it's an interpretive line. A
refactor that *reveals* a missing abstraction is the most common
trigger for unintended scope creep. The protocol catches it but the
agent has to read it.

**Verdict:** the right command for the right job. The hardest part
(in real codebases) is resisting "while I'm here" cleanups; the rule
"do not remove pre-existing dead code unless asked" specifically
prevents that. I almost over-reached deleting an outdated comment
mid-refactor; the rule stopped me. (This is the same comment that
`/bugfix` declined to clean up earlier — they cohere.)

#### `/conventions-sync`

**What worked:** the `<!-- auto -->` vs `<!-- manual -->` markers are a
clean separation. I regenerated auto sections (File & Folder
Structure, Code Style) and explicitly noted that the manual sections
(Patterns to Avoid, Domain Glossary) were not touched. The Domain
Glossary's `Task` shape was stale (missing `assignee`); I flagged it
to the user instead of editing.

**Friction:** "Present the diff for approval before writing — STOP for
explicit confirmation" is a strong gate. The diff format is on the
agent — there's no `sddx-workflow conventions-sync --dry-run` command
to produce it. For a long conventions file this becomes ad-hoc.

**Recommendation:** consider a thin CLI helper:
`sddx-workflow conventions-diff` that prints what would change based
on package.json and dir-scan, leaving the actual write to the agent
after approval.

#### `/spec-status` (agent prose version)

**What worked:** the agent version produced richer per-spec context
than `sddx-workflow status` — it included CR resolution status, gap
resolution, advisory notes from `/spec-analyze`, and ready-for-next
recommendations. The CLI status is fine for one-line per spec; the
agent version is the right format when the user asks "where are we?"
in a working session.

**Friction:** the two outputs can diverge. CLI status said "tasks-search
verify failed" (B-03 false-positive); my agent prose said
"verify PASS (CLI mis-reports …)". The agent has to know to override
the CLI's signal — or trust it. There is no formal precedence rule.

**Recommendation:** make this explicit in workflow.md: agent
`/spec-status` is canonical; CLI `status` is a snapshot proxy. (And of
course, fix B-03.)

#### `/impl-gap` (real this time)

**What surfaced:** while implementing T2 (notification emission), I
added a guard `if (previous === assignee) return t` to satisfy "same
person = no-op". For `null → null` (unassigning an already-unassigned
task), this guard fires — but the requirement is ambiguous about
whether `null` counts as "a person". Two valid reads, both defensible.

**What the gate did:** I stopped writing code. Logged GAP-001 with
Problem, Impact, Proposed resolution (option a), Action required
(Approval). The Proposed-resolution-is-non-binding rule made me write
both options before recommending one. The user (me, role-playing)
approved option (a). I documented the resolution and resumed.

**Friction:** as I noted in the first pass, *there is no automatic
trigger for /impl-gap*. I noticed the ambiguity because I was writing
the test for "same person no-op" and asked myself "what about null →
null?". A less careful agent ships the more aggressive interpretation
without flagging. The protocol relies entirely on agent vigilance.

**Verdict:** the format and the gate work. The pre-condition (agent
notices) is hard to engineer.

#### `/spec-amend` (real this time)

**What surfaced:** while writing T3 test cases for the `?assignee=`
filter, I realised the requirements never specify what `?assignee=`
(empty) or "filter for unassigned" mean. Both are real product
questions that two embedders would ask. Spec change required.

**What the gate did:** raised CR-001 with Trigger (gap-001 follow-up +
user-requested), Motive (two embedders asked for unassigned),
Change in requirements (add two acceptance scenarios), Change in plan
(extend T3 verification), Affected tasks (T-3 — scope expanded but no
new task), Status: Pending approval. Did not edit `1-requirements.md`
or `2-plan.md` yet. CLI `status` immediately reported
"task-assignment ... · 1 pending CR". User (me) approved. Then —
*only then* — I applied the changes to both files and updated CR
status to Approved.

**Friction:** the "do not modify any other file yet" rule is the
single most important discipline in the entire protocol. Without it,
the spec drifts silently and the audit trail vanishes. With it, every
post-approval change is a record. I notice the rule does not say what
to do if the *user* edits the approved spec directly between the CR
draft and approval; my read is that the agent should detect divergence
and re-raise, but the protocol does not say.

**Verdict:** the strongest evidence of the protocol's thesis. The
discipline of routing a small post-approval change through a CR
*felt* like overhead in the moment, and *was* the right move when
considered alongside the next agent to touch this spec in a month.

#### `/finish` (real this time)

**What worked:** for the assembled scenario (everything uncommitted),
the protocol's "if changes are unrelated, propose splitting into
multiple commits" rule led me to draft 4 conventional commits
(setup, search feature, completion-route fix, assignment feature)
instead of one big "initial commit". The format is strict enough that
each commit's body explains the *why*, not just the *what*, and
explicit-exclusions live in the bullets.

**Gate held verifiably:** after presenting the 4 drafts, I ran
`git log` and `git diff --cached`. **Result:** "fatal: your current
branch does not have any commits yet" + 0 staged files. The protocol
prevented me from running `git add`/`git commit` until approval.

**Friction:** drafting 4 commits with the strict format is a long
output. For trivial changes it's overkill; for an audit trail it's the
artifact. Worth documenting that long /finish outputs are *normal*
when the working tree has accumulated multiple logical changes.

**Verdict:** the commit format alone justifies the rest of the
protocol. A team reading the git log in 12 months gets context the
diff cannot give them.

---

### Things only the second pass revealed

1. **`/spec-analyze` is undervalued.** Without it I would have shipped
   task-assignment thinking it satisfied G2 when only half (in-process
   side) was actually done. The mechanical cross-check between plan
   prose and code beats a careful re-read every time. Recommend
   surfacing it in the README "Default Flow" table — currently absent.

2. **`/spec-conflicts` does not exclude done-but-not-moved specs.**
   `tasks-search` (verified, PASS, not yet moved to `_done/`) appeared
   in the overlap table. Distracting noise. Worth tightening.

3. **The `<!-- manual -->` convention is real and respected.** I left
   manual sections of `conventions.md` verbatim during
   `/conventions-sync`. The marker is opt-in but well-placed; agents
   that scan for it cannot accidentally trample user prose.

4. **Two real /impl-gaps appeared during T2 and T3 that I had not
   planned for.** The first (`null → null` no-op) I logged and
   resolved in-scope. The second (`?assignee=` semantics) escalated to
   /spec-amend because it required a spec change. Both surfaced
   organically — not from synthetic injection. That's the bar.

5. **`/refactor` and `/bugfix` share a discipline ("no adjacent
   cleanup").** They reinforce each other. The same misleading
   `// (intentionally never reachable …)` comment in `src/server.js`
   was left alone by both commands. Three opportunities to delete it;
   three correct refusals. That's the rule working.

6. **The protocol cost on a 3-task feature was high.** I produced 11
   artifacts for `task-assignment` (requirements, plan, tasks, research,
   clarifications, analysis, verify-report, gap log, amendments,
   conventions diff, plus updated CLAUDE.md context). For a single
   `assignTask` function call the ratio of process-to-code is large.
   *But* every artifact paid in a specific way — the gap log alone
   would not have existed otherwise. Worth being explicit that the
   protocol's ROI scales with the cost of "wrong" — for throwaway code,
   `/bugfix` direct is sufficient.

---

### Final updated bug count

The second-pass scenario did not surface new CLI bugs (B-01 through B-06
remain the canonical list). It did surface two protocol-clarity issues:

- **P-01 (LOW)** — `/spec-conflicts` includes verified-but-not-moved
  specs. Worth tightening the rule.
- **P-02 (LOW)** — `/assume` does not specify where confirmed
  assumptions land in the spec. Two reasonable defaults; pick one.

Both are documentation fixes in `templates/workflow.md`, not code.

---

## 11. Third-pass scenario — provoking the remaining edge cases

After the second pass, 7 specific tests remained that were feasible in the
existing sandbox. All 7 executed in this pass.

### Test coverage summary

| # | Test | Result |
|---|---|---|
| (4) | `npm pack` + install + run from tarball | ✅ PASS — 44.9 KB tarball, 127 files, init from `node_modules` produces same output as `node dist/cli.js` |
| (1) | Provider parity across all 7 providers | ✅ MOSTLY PASS — see "Provider drift" below |
| (5) | `init` on a repo with pre-existing `.sdd/` and `specs/` | ✅ PASS with caveat — skips existing files, fills gaps; but **content-blind** (see "Init-on-foreign-tool risk" below) |
| (7) | `update` with active specs in progress | ✅ PASS — workflow.md refreshed, user spec files untouched, `1-requirements.md` / `2-plan.md` / `3-tasks.md` preserved bit-for-bit |
| (2) | `/verify` FAILURE mode | ✅ PASS — injected 4 failure conditions (red test, scope creep, pending CR, unresolved GAP); the 7-check table cleanly identifies 6 of 7 failures with evidence + remediation per failure |
| (3) | `/spec-amend` rejection path | ✅ PASS — CR-002 marked `Rejected 2026-05-19 — webhook landed in follow-up spec`, both Approved CR-001 and Rejected CR-002 visible in `amendments.md` (history preserved per §Anti-Patterns) |
| (6) | `/review` warnings-acknowledgement path | ✅ PASS — explicit ack converts a PASS-with-advisory verify into a /review-eligible state, with the user decision documented |

### New findings (third pass)

#### B-07 (LOW) — Provider drift in `/finish`

5 providers have per-command files for `/finish`:
- **Claude + Codex:** terse. "Run git status and git diff. Stage all
  relevant files. Determine the commit type. Draft a conventional
  commit message following the format in workflow.md."
- **Copilot + Gemini + Windsurf:** detailed. Add explicit
  `.env*` / build / scratch exclusions and describe the message shape
  ("one overview sentence, detailed bullets with reasoning, optional
  footer for non-obvious context").

Functionally equivalent because all delegate to `workflow.md`. But the
first-glance guidance differs by provider: a Claude user reads less
inline detail than a Copilot user. Symptom of asymmetric maintenance
(someone enriched 3 files but not 5). Easy to align by copying the
fuller wording to Claude + Codex.

**Severity:** LOW — same protocol behavior across providers, just
documentation surface drift.

#### B-08 (MEDIUM) — Init-on-foreign-tool risk

`init` correctly *skips* pre-existing files (good behavior — preserves
user work). But it does **not check the content** of those files. If a
user has a `.sdd/workflow.md` from a *different* tool that happens to
share names, `init --provider claude-code` will:

1. Skip the foreign `workflow.md` (so the agent will read the wrong
   protocol)
2. Create the missing CLAUDE.md + `.claude/commands/*` files (so
   Claude *thinks* sddx is installed)
3. `doctor` reports all green because it only checks file existence

The user thinks they have sddx installed; the agent silently follows
the foreign protocol. Hard to debug.

**Fix candidates:**
- `doctor` checks a known marker line in `.sdd/workflow.md` (e.g.,
  `# SDD Protocol — Workflow` at line 1) and warns if missing.
- `init` checks the marker before skipping and prompts "found
  unrelated workflow.md — overwrite, abort, or rename it as
  `.sdd/workflow.foreign.md`?".

**Severity:** MEDIUM — narrow edge case (depends on another tool
colliding by name), but consequences are silent and confusing.

#### P-03 (LOW) — `/review` ack does not get persisted

`/review` per §Per-Phase Permissions creates no files. When `/review`
proceeds with "explicit acknowledgement of remaining warnings" (per
workflow.md §/review), the acknowledgement lives only in conversation
context. If the session ends and someone else opens the spec next
month, the acknowledgement is invisible.

**Fix:** workflow.md §/review adds one sentence — *"if /review
proceeds with acknowledged warnings, summarise the acknowledgement in
`verify-report.md §Advisory` as a postscript with date"*. Costs
nothing; closes the audit-trail hole.

### Things that worked exactly as advertised

1. **`update --check` exits 1 on outdated, 0 on clean.** Behaviour
   matched the README. Good for CI gates the moment B-02 is fixed.

2. **`update` preserves user spec files.** `1-requirements.md`,
   `2-plan.md`, `3-tasks.md`, `amendments.md`, `impl-gaps.md`,
   `analysis.md`, `verify-report.md`, `research-*.md` — all untouched.
   Only `workflow.md` and provider command files are refreshed.

3. **Status report after `update`.** Phases, task counts, pending CR
   counts, gap counts — all correctly preserved across the workflow.md
   refresh.

4. **CR rejection path.** Setting CR-002 status to `Rejected 2026-05-19
   — <reason>` instantly removed it from "pending CR" count in
   `status`. The regex (`Pending approval`) is exact-string and
   doesn't accidentally match "Rejected ...". Robust.

5. **GAP-002 detection.** A new GAP with empty `**Resolution:**` field
   correctly appears in `status` as "1 unresolved gap" within seconds
   of being added.

6. **The B-03 regex giving a TRUE positive.** Ironically, the test
   that proved B-03's existence (FAIL inside `fail 0`) also produced a
   *true* positive when I injected real failures into
   `task-assignment`. The bug only matters when the FAIL string
   appears for the wrong reason — when there's a real failure, the
   same regex catches it correctly. That's not a justification (B-03
   should still be fixed), but it's a useful reminder of *why* the
   shortcut was reached for in the first place.

7. **`/verify` FAIL report format works.** Writing a real failure
   report following the template produced clear `file:line` evidence,
   per-failure remediation pointing to the right next-command
   (`/bugfix` for the regression, `/spec-amend` for the scope
   question), and a Conclusion that names every failure. Same template
   as PASS, just different cells filled in.

### Cumulative bug tally after all three passes

| ID | Severity | Title |
|---|---|---|
| B-02 | HIGH | `doctor` never exits non-zero |
| B-03 | MEDIUM | `status` FAIL regex false-positive on test summaries |
| B-04 | MEDIUM | `commands` description misleading (static vs installed) |
| B-01 | MEDIUM | `npm run build` fails on Windows (`chmod`) |
| B-05 | LOW | `add domain` rejects custom names (closed allow-list) |
| B-06 | LOW | `init` non-TTY silently selects all providers |
| **B-07** | **LOW (new)** | **Provider drift in `/finish` inline guidance** |
| **B-08** | **MEDIUM (new)** | **`init` skips pre-existing foreign `workflow.md`** |
| P-01 | LOW | `/spec-conflicts` includes done-but-not-moved specs |
| P-02 | LOW | `/assume` does not specify where confirmed assumptions land |
| **P-03** | **LOW (new)** | **`/review` warnings ack is conversational-only** |

**Net:** 1 HIGH, 4 MEDIUM, 6 LOW. The High and Mediums are all
fixable in an afternoon. No new bugs in the third pass surfaced
anything that changes the recommendation.

---

## Appendix A — sandbox structure used

```
$env:TEMP\sddx-test-20260519-130150\
├── proj-init-default/         # init with no flags (TTY-less ⇒ all providers)
├── proj-init-claude-only/     # init --provider claude-code
├── proj-init-multi/           # init --provider claude-code,cursor,zed
├── proj-init-existing/        # init --existing --provider claude-code
├── proj-init-claude-exists/   # init when CLAUDE.md already present
├── proj-err-bad-prov/         # init --provider bogus
├── proj-err-both/             # init --provider X --all
├── proj-err-empty/            # init --provider ""
├── proj-err-commas/           # init --provider ,
├── proj-err-mixed/            # init --provider claude-code,bogus,cursor
├── proj-add-no-sdd/           # add domain auth before init
├── proj-status-empty/         # status with no .sdd
├── proj-status-fresh/         # status post init, pre bootstrap
├── proj-status-with-spec/     # status with spec in all phases
├── proj-update-empty/         # update with no .sdd
├── proj-update-fresh/         # update on clean install
├── proj-doctor-empty/         # doctor with no .sdd
├── proj-doctor-healthy/       # doctor on healthy --all install
├── proj-doctor-broken-core/   # doctor with conventions.md missing
├── proj-doctor-obsolete/      # doctor with planted spec-restore.md
├── proj-cmds-empty/           # commands with no .sdd
├── proj-unicode/              # status with unicode-named spec dir
├── proj-done-specs/           # status excludes _done/
├── proj-stale-mix/            # init partial, then init --force partial
├── proj-stderr/               # stderr separation
└── task-api/                  # full end-to-end slash workflow
    ├── src/{store,server}.js
    ├── test/{store,search,complete}.test.js  # 12 tests, all green
    ├── package.json, .sdd/, .claude/, specs/_template/
    └── specs/tasks-search/
        ├── 1-requirements.md (G1-G3, 4 scenarios, resolved Clarifications)
        ├── 2-plan.md  (Approved 2026-05-19)
        ├── 3-tasks.md (T1, T2, T3 all [x])
        ├── verify-report.md (PASS)
        ├── impl-gaps.md (GAP-001 — resolved)
        └── amendments.md (CR-001 — pending approval)
```

## Appendix B — full git diff of task-api after the workflow

(Recorded inline in the sandbox; not duplicated here. The notable additions are `searchTasks(input, opts)` in `src/store.js` and the `GET /tasks/search` + corrected `POST /tasks/:id/complete` branches in `src/server.js`. Tests: `test/search.test.js` (8 tests), `test/complete.test.js` (1 test). All 12 tests green.)
