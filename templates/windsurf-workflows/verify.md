---
description: Strict mechanical audit — read-only; writes verify-report.md
---

Execute the /verify command defined in .sdd/workflow.md.

The spec name is whatever you typed after the command (e.g. `/verify auth-refresh`).

Read-only mechanical audit. Check: all tasks marked complete, every goal has an artifact, every acceptance scenario has a passing test, full test suite green, no out-of-scope file changes, no unresolved /impl-gap entries, no pending CRs. Write specs/<spec>/verify-report.md. Do not modify code or specs.
