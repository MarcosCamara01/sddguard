---
description: Cross-consistency analysis (goal-task coverage, plan-task coverage, scope creep)
---

Execute the /spec-analyze command defined in .sdd/workflow.md.

The spec name is whatever you typed after the command (e.g. `/spec-analyze auth-refresh`).

Check: every G-ID referenced by at least one task; every "Components Affected" entry referenced by at least one task; any task lacking a goal reference (scope creep). Write specs/<spec>/analysis.md.
